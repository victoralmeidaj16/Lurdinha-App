const test = require('node:test');
const assert = require('node:assert/strict');
const { initializeApp, deleteApp } = require('firebase/app');
const firestore = require('firebase/firestore');
const { loadSource } = require('./load-source.cjs');
const host = process.env.FIRESTORE_EMULATOR_HOST;
const emulatorTest = host ? test : test.skip;
const apps = [];
let id = 0;

function connection(uid = 'owner') {
  assert.match(host, /^(127\.0\.0\.1|localhost):\d+$/, 'Somente emulador local');
  const app = initializeApp({ projectId: 'demo-lurdinha-fixes', apiKey: 'demo-key' }, `test-${++id}`);
  apps.push(app);
  const db = firestore.getFirestore(app);
  const [hostname, port] = host.split(':');
  firestore.connectFirestoreEmulator(db, hostname, Number(port), {
    mockUserToken: uid === 'owner' ? 'owner' : { sub: uid, user_id: uid, email: `${uid}@example.com` },
  });
  return db;
}

test.after(async () => {
  for (const app of apps) {
    await firestore.terminate(firestore.getFirestore(app));
    await deleteApp(app);
  }
});

function service(db, deleteUser = async () => {}, overrides = {}) {
  const state = loadSource('src/utils/accountDeletionState.js');
  return {
    ...state,
    ...loadSource('src/utils/deleteAccount.js', {
      'firebase/firestore': { ...firestore, ...overrides },
      'firebase/auth': { deleteUser }, '../firebase': { db },
      './accountDeletionState': state,
    }),
  };
}

emulatorTest('regras permitem remover opção zero sem alterar votos ou avatares alheios', async () => {
  const admin = connection();
  const db = connection('zero');
  const ref = firestore.doc(db, 'quizzes', 'zero');
  await firestore.setDoc(firestore.doc(admin, 'quizzes', 'zero'), {
    createdBy: 'other', votes: { zero: 0, other: 0 }, voterAvatars: { 0: ['zero', 'other'], 1: ['third'] },
  });
  const api = service(db);
  await firestore.runTransaction(db, async tx => {
    const snapshot = await tx.get(ref);
    tx.update(ref, api.buildOwnVoteRemoval(snapshot.data(), 'zero'));
  });
  const actual = (await firestore.getDoc(ref)).data();
  assert.deepEqual(actual.votes, { other: 0 });
  assert.deepEqual(actual.voterAvatars, { 0: ['other'], 1: ['third'] });
});

emulatorTest('regras recusam apagar ou mudar dados de terceiros junto ao próprio voto', async () => {
  const admin = connection();
  const db = connection('attacker');
  const ref = firestore.doc(db, 'quizzes', 'tamper');
  await firestore.setDoc(firestore.doc(admin, 'quizzes', 'tamper'), {
    createdBy: 'other', votes: { attacker: 0, other: 1 }, voterAvatars: { 0: ['attacker'], 1: ['other'] }, status: 'active',
  });
  const valid = service(db).buildOwnVoteRemoval((await firestore.getDoc(ref)).data(), 'attacker');
  for (const extra of [
    { 'votes.other': firestore.deleteField() },
    { 'votes.other': 0 },
    { 'voterAvatars.1': [] },
    { 'voterAvatars.0': ['forged'] },
    { status: 'completed' },
  ]) {
    await assert.rejects(firestore.updateDoc(ref, { ...valid, ...extra }), { code: 'permission-denied' });
  }
});

emulatorTest('votos antigos sem mapa de avatares também podem ser removidos', async () => {
  const admin = connection();
  const db = connection('legacy');
  await firestore.setDoc(firestore.doc(admin, 'quizzes', 'legacy'), { createdBy: 'other', votes: { legacy: 1, other: 0 } });
  const ref = firestore.doc(db, 'quizzes', 'legacy');
  await firestore.updateDoc(ref, service(db).buildOwnVoteRemoval((await firestore.getDoc(ref)).data(), 'legacy'));
  assert.deepEqual((await firestore.getDoc(ref)).data().votes, { other: 0 });
});

emulatorTest('exclusão limpa votos e transfere grupo antes de apagar perfil e Auth', async () => {
  const admin = connection();
  const db = connection('deleting');
  const userRef = firestore.doc(db, 'users', 'deleting');
  await firestore.setDoc(firestore.doc(admin, 'users', 'deleting'), { displayName: 'Pessoa', groups: ['shared'], stats: { grupos: 1 } });
  await firestore.setDoc(firestore.doc(admin, 'groups', 'shared'), { createdBy: 'deleting', members: ['deleting', 'other'], admins: ['deleting'], stats: { totalMembers: 2 } });
  await firestore.setDoc(firestore.doc(admin, 'quizzes', 'deleting'), { createdBy: 'other', votes: { deleting: 0, other: 1 }, voterAvatars: { 0: ['deleting'], 1: ['other'] } });
  let deleted = false;
  const api = service(db, async user => {
    assert.equal(user.uid, 'deleting');
    assert.equal((await firestore.getDoc(userRef)).exists(), false);
    assert.equal(api.isAccountDeletionInProgress(user.uid), true);
    assert.deepEqual((await firestore.getDoc(firestore.doc(db, 'quizzes', 'deleting'))).data().votes, { other: 1 });
    const group = (await firestore.getDoc(firestore.doc(db, 'groups', 'shared'))).data();
    assert.deepEqual(group.members, ['other']);
    assert.deepEqual(group.admins, ['other']);
    assert.equal(group.createdBy, 'other');
    assert.equal(group.stats.totalMembers, 1);
    deleted = true;
  });
  await api.deleteAccountData({ uid: 'deleting' });
  assert.equal(deleted, true);
});

emulatorTest('falha no Auth restaura perfil; uma nova tentativa conclui sem repetir votos', async () => {
  const admin = connection();
  const db = connection('retry');
  const userRef = firestore.doc(db, 'users', 'retry');
  await firestore.setDoc(firestore.doc(admin, 'users', 'retry'), { displayName: 'Pessoa', groups: [], stats: { acertos: 7 } });
  await firestore.setDoc(firestore.doc(admin, 'quizzes', 'retry'), { createdBy: 'other', votes: { retry: 0 }, voterAvatars: { 0: ['retry'] } });
  let calls = 0;
  const api = service(db, async () => { if (++calls === 1) throw Object.assign(new Error('Auth unavailable'), { code: 'auth/network-request-failed' }); });
  await assert.rejects(api.deleteAccountData({ uid: 'retry' }), { code: 'auth/network-request-failed' });
  assert.equal((await firestore.getDoc(userRef)).data().stats.acertos, 7);
  assert.equal(api.isAccountDeletionInProgress('retry'), false);
  await api.deleteAccountData({ uid: 'retry' });
  assert.equal((await firestore.getDoc(userRef)).exists(), false);
  assert.equal(calls, 2);
});

emulatorTest('falha na limpeza preserva perfil e não chama exclusão do Auth', async () => {
  const admin = connection();
  const db = connection('denied');
  await firestore.setDoc(firestore.doc(admin, 'users', 'denied'), { displayName: 'Pessoa' });
  const api = service(db, async () => assert.fail('Auth não pode ser excluído'), {
    getDocs: async () => { throw Object.assign(new Error('Denied'), { code: 'permission-denied' }); },
  });
  await assert.rejects(api.deleteAccountData({ uid: 'denied' }), { code: 'permission-denied' });
  assert.equal((await firestore.getDoc(firestore.doc(db, 'users', 'denied'))).exists(), true);
  assert.equal(api.isAccountDeletionInProgress('denied'), false);
});
