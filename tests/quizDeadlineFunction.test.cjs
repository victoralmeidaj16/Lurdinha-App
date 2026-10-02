// Testa a Cloud Function de lembrete de prazo contra o emulador do Firestore.
//   firebase emulators:exec --only firestore --project demo-lurdinha-fixes \
//     "node --test tests/quizDeadlineFunction.test.cjs"
const test = require('node:test');
const assert = require('node:assert/strict');
const host = process.env.FIRESTORE_EMULATOR_HOST;
const emulatorTest = host ? test : test.skip;

const MIN = 60 * 1000;
const noLog = { error: () => {}, info: () => {} };
let admin;
let db;
let counter = 0;

if (host) {
  assert.match(host, /^(127\.0\.0\.1|localhost):\d+$/, 'Somente emulador local');
  admin = require('../functions/node_modules/firebase-admin');
  admin.initializeApp({ projectId: 'demo-lurdinha-fixes' });
  db = admin.firestore();
}

const { processDeadlineReminders, findPendingVoters } = require('../functions/reminders');

const run = (overrides = {}) => processDeadlineReminders({
  db,
  Timestamp: admin.firestore.Timestamp,
  FieldValue: admin.firestore.FieldValue,
  log: noLog,
  ...overrides,
});

const okFetch = (calls, tickets) => async (url, options) => {
  const messages = JSON.parse(options.body);
  calls.push(messages);
  return { ok: true, json: async () => ({ data: tickets ? tickets(messages) : messages.map(() => ({ status: 'ok' })) }) };
};

// Cria um cenário isolado (ids únicos) e devolve os ids.
async function seed({ endInMin = 50, durationMin = 24 * 60, votes = {}, extra = {} } = {}) {
  const n = ++counter;
  const ids = { group: `g${n}`, qg: `qg${n}`, q1: `q${n}a`, q2: `q${n}b`, creator: `c${n}`, ana: `a${n}`, bia: `b${n}`, caio: `k${n}` };
  const now = Date.now();
  const token = (name) => `ExponentPushToken[${name}${n}]`;

  await db.collection('groups').doc(ids.group).set({
    name: 'Galera', members: [ids.creator, ids.ana, ids.bia, ids.caio],
  });
  await db.collection('users').doc(ids.creator).set({ expoPushToken: token('creator') });
  await db.collection('users').doc(ids.ana).set({ expoPushToken: token('ana') });
  await db.collection('users').doc(ids.bia).set({ expoPushToken: token('bia') });
  await db.collection('users').doc(ids.caio).set({}); // sem token
  await db.collection('quizzes').doc(ids.q1).set({ votes: { [ids.ana]: 0, [ids.bia]: 1, ...(votes.q1 || {}) } });
  await db.collection('quizzes').doc(ids.q2).set({ votes: { [ids.ana]: 2, ...(votes.q2 || {}) } });
  await db.collection('quizGroups').doc(ids.qg).set({
    groupId: ids.group, status: 'active', title: 'Fofoca', createdBy: ids.creator,
    createdAt: admin.firestore.Timestamp.fromMillis(now + endInMin * MIN - durationMin * MIN),
    endTime: admin.firestore.Timestamp.fromMillis(now + endInMin * MIN),
    quizzes: [ids.q1, ids.q2],
    ...extra,
  });
  return { ids, token };
}

const sentTokens = (calls) => calls.flat().map((message) => message.to);

test('quem ainda deve ser lembrado: membros sem voto completo, exceto o criador', () => {
  const quizzes = [{ votes: { a: 0, b: 0 } }, { votes: { a: 1 } }];
  assert.deepEqual(findPendingVoters({ members: ['c', 'a', 'b', 'd'], createdBy: 'c', quizzes }), ['b', 'd']);
  assert.deepEqual(findPendingVoters({ members: ['a'], createdBy: 'c', quizzes: [] }), []);
});

emulatorTest('avisa só quem não votou em tudo e marca o quiz como avisado', async () => {
  const { ids, token } = await seed();
  const calls = [];
  const summary = await run({ fetchImpl: okFetch(calls) });

  const tokens = sentTokens(calls);
  assert.ok(tokens.includes(token('bia')), 'bia votou só na primeira enquete');
  assert.ok(!tokens.includes(token('ana')), 'ana já votou em tudo');
  assert.ok(!tokens.includes(token('creator')), 'criador não é lembrado');
  const message = calls.flat().find((item) => item.to === token('bia'));
  assert.match(message.body, /Fofoca/);
  assert.match(message.body, /Galera/);
  assert.equal(message.data.type, 'QUIZ_DEADLINE');
  assert.equal(message.data.quizGroupId, ids.qg);
  assert.ok(summary.reminded >= 1);

  const stored = (await db.collection('quizGroups').doc(ids.qg).get()).data();
  assert.ok(stored.deadlineReminderSentAt);

  // Segunda execução não repete.
  const again = [];
  await run({ fetchImpl: okFetch(again) });
  assert.ok(!sentTokens(again).includes(token('bia')));
});

emulatorTest('não avisa quiz que termina em mais de 1 hora nem quiz que já acabou', async () => {
  const far = await seed({ endInMin: 180 });
  const past = await seed({ endInMin: -5 });
  const calls = [];
  await run({ fetchImpl: okFetch(calls) });
  assert.ok(!sentTokens(calls).includes(far.token('bia')));
  assert.ok(!sentTokens(calls).includes(past.token('bia')));
});

emulatorTest('quiz curto demais (recém-criado) não recebe lembrete', async () => {
  const { token } = await seed({ endInMin: 50, durationMin: 60 });
  const calls = [];
  await run({ fetchImpl: okFetch(calls) });
  assert.ok(!sentTokens(calls).includes(token('bia')));
});

emulatorTest('quem já votou em tudo não recebe, e sem pendentes nada é enviado', async () => {
  const { token } = await seed({ votes: { q1: {}, q2: {} } });
  // bia vota na segunda enquete: todos completos
  const scenario = await seed();
  await db.collection('quizzes').doc(scenario.ids.q2).update({ [`votes.${scenario.ids.bia}`]: 0 });
  await db.collection('quizzes').doc(scenario.ids.q1).update({ [`votes.${scenario.ids.caio}`]: 0 });
  await db.collection('quizzes').doc(scenario.ids.q2).update({ [`votes.${scenario.ids.caio}`]: 0 });
  const calls = [];
  await run({ fetchImpl: okFetch(calls) });
  assert.ok(!sentTokens(calls).includes(scenario.token('bia')));
  assert.ok(sentTokens(calls).includes(token('bia')), 'o outro cenário continua pendente');
});

emulatorTest('falha no envio libera o quiz para a próxima execução tentar de novo', async () => {
  const { ids, token } = await seed();
  const failing = async () => { throw new Error('rede'); };
  await run({ fetchImpl: failing });
  const stored = (await db.collection('quizGroups').doc(ids.qg).get()).data();
  assert.equal(stored.deadlineReminderSentAt, undefined);

  const calls = [];
  await run({ fetchImpl: okFetch(calls) });
  assert.ok(sentTokens(calls).includes(token('bia')));
});

emulatorTest('token inválido (DeviceNotRegistered) é removido do perfil', async () => {
  const { ids, token } = await seed();
  const calls = [];
  await run({
    fetchImpl: okFetch(calls, (messages) => messages.map((message) => (
      message.to === token('bia')
        ? { status: 'error', details: { error: 'DeviceNotRegistered' } }
        : { status: 'ok' }
    ))),
  });
  const bia = (await db.collection('users').doc(ids.bia).get()).data();
  assert.equal(bia.expoPushToken, undefined);
});

emulatorTest('envia em lotes de no máximo 100 destinatários', async () => {
  const n = ++counter;
  const members = Array.from({ length: 230 }, (_, index) => `m${n}_${index}`);
  await db.collection('groups').doc(`g${n}`).set({ name: 'Grande', members: ['dono', ...members] });
  await Promise.all(members.map((uid) => db.collection('users').doc(uid).set({ expoPushToken: `ExponentPushToken[${uid}]` })));
  await db.collection('quizzes').doc(`q${n}`).set({ votes: {} });
  await db.collection('quizGroups').doc(`qg${n}`).set({
    groupId: `g${n}`, status: 'active', title: 'Grande', createdBy: 'dono',
    createdAt: admin.firestore.Timestamp.fromMillis(Date.now() - 24 * 60 * MIN),
    endTime: admin.firestore.Timestamp.fromMillis(Date.now() + 30 * MIN),
    quizzes: [`q${n}`],
  });
  const calls = [];
  await run({ fetchImpl: okFetch(calls) });
  const mine = calls.filter((batch) => batch.some((message) => message.to.includes(`m${n}_`)));
  assert.deepEqual(mine.map((batch) => batch.length).sort((a, b) => a - b), [30, 100, 100]);
});
