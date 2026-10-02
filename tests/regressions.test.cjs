const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./load-source.cjs');
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');

function extractFunction(relativePath, name, bindings) {
  const source = fs.readFileSync(path.resolve(__dirname, '..', relativePath), 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
  let expression;
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'VariableDeclarator' && node.id.name === name) expression = source.slice(node.init.start, node.init.end);
    Object.values(node).forEach(value => Array.isArray(value) ? value.forEach(visit) : visit(value));
  }
  visit(ast);
  assert.ok(expression, name);
  return new Function(...Object.keys(bindings), `return (${expression});`)(...Object.values(bindings));
}

const { calculateObviousMindRoundOutcome } = loadSource('src/hooks/game/obviousMind.js', {
  'firebase/firestore': { serverTimestamp: () => null },
});

test('alvo sem resposta produz resultado serializável e não distribui pontos', () => {
  const result = calculateObviousMindRoundOutcome({
    players: [{ uid: 'a', score: 3 }, { uid: 'b', score: 1 }],
    roundData: { targetId: 'a', answers: { b: 'Comida' } },
  });
  assert.equal(result.results.targetAnswer, null);
  assert.deepEqual(result.players.map(p => p.score), [3, 1]);
  assert.deepEqual(result.results.correctGuessers, []);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
});

test('alvo respondendo mantém acertos e bônus', () => {
  const players = [{ uid: 'a', score: 0 }, { uid: 'b', score: 0 }];
  const match = calculateObviousMindRoundOutcome({ players, roundData: { targetId: 'a', answers: { a: 'Comida', b: 'Comida' } } });
  assert.deepEqual(match.players.map(p => p.score), [0, 2]);
  const stump = calculateObviousMindRoundOutcome({ players, roundData: { targetId: 'a', answers: { a: 'Comida', b: 'Viagem' } } });
  assert.deepEqual(stump.players.map(p => p.score), [3, 0]);
});

test('cálculo genérico não encerra Telefone nem grava resultados de Lurdinha', async () => {
  const calculate = extractFunction('src/hooks/useGame.js', 'calculateRoundResults', {
    SECRET_GAME_TYPES: new Set(['secret', 'telephone']),
    calculateLurdinhaRoundOutcome: () => { throw new Error('Cálculo errado'); },
  });
  for (const gameType of ['secret', 'telephone']) await calculate('room', { settings: { gameType } });
});

test('Telefone somente termina após o último turno', () => {
  const { buildNextSecretTurn } = loadSource('src/hooks/game/secret.js');
  const roomData = { currentTurn: 1, players: [{ uid: 'a' }, { uid: 'b' }], roundData: { totalTurns: 3 } };
  const next = buildNextSecretTurn({ roomData, startTimeFactory: () => 1 });
  assert.equal(next.currentTurn, 2);
  assert.equal(next.status, undefined);
  assert.equal(buildNextSecretTurn({ roomData: { ...roomData, currentTurn: 3 } }).status, 'round_results');
});

test('ranking não incrementa novamente a quantidade de enquetes votadas', async () => {
  const writes = [];
  const docs = {
    'quizGroups/qg': { quizzes: ['q'] },
    'quizzes/q': { correctAnswer: 0, votes: { u: 0 } },
    'users/u': { displayName: 'Pessoa' },
  };
  const calculate = extractFunction('src/hooks/useGroups.js', 'calculateRanking', {
    db: {}, doc: (_, collection, id) => `${collection}/${id}`,
    getDoc: async ref => ({ exists: () => !!docs[ref], data: () => docs[ref] }),
    updateDoc: async (ref, patch) => writes.push({ ref, patch }),
    increment: value => ({ increment: value }), setError: () => {},
  });
  await calculate('qg');
  const stats = writes.find(write => write.ref === 'users/u').patch;
  assert.equal(stats['stats.enquetesVotadas'], undefined);
  assert.deepEqual(stats['stats.acertos'], { increment: 1 });
});

function authenticationHarness({ cancel = false, mismatch = false } = {}) {
  const calls = [];
  const api = loadSource('src/utils/reauthenticateAccount.js', {
    'firebase/auth': {
      EmailAuthProvider: { credential: (email, password) => ({ email, password }) },
      OAuthProvider: class { credential(data) { return data; } },
      reauthenticateWithCredential: async (user, credential) => {
        calls.push({ user, credential });
        if (mismatch) throw Object.assign(new Error('wrong account'), { code: 'auth/user-mismatch' });
      },
    },
    'expo-apple-authentication': {
      isAvailableAsync: async () => true,
      signInAsync: async options => {
        calls.push(options);
        if (cancel) throw Object.assign(new Error('cancelled'), { code: 'ERR_REQUEST_CANCELED' });
        return { identityToken: 'apple-token' };
      },
    },
    'expo-crypto': { randomUUID: () => 'nonce', CryptoDigestAlgorithm: { SHA256: 'SHA256' }, digestStringAsync: async (_, input) => `hash:${input}` },
  });
  return { ...api, calls };
}

test('Apple reautentica sem e-mail/senha, com nonce, na mesma sessão', async () => {
  const harness = authenticationHarness();
  const user = { uid: 'u', providerData: [{ providerId: 'apple.com' }] };
  await harness.reauthenticateAccount(user, '');
  assert.deepEqual(harness.calls[0], { nonce: 'hash:nonce' });
  assert.equal(harness.calls[1].user, user);
  assert.deepEqual(harness.calls[1].credential, { idToken: 'apple-token', rawNonce: 'nonce' });
});

test('cancelamento e conta Apple diferente interrompem a reautenticação', async () => {
  const user = { uid: 'u', providerData: [{ providerId: 'apple.com' }] };
  await assert.rejects(authenticationHarness({ cancel: true }).reauthenticateAccount(user), { code: 'ERR_REQUEST_CANCELED' });
  await assert.rejects(authenticationHarness({ mismatch: true }).reauthenticateAccount(user), { code: 'auth/user-mismatch' });
});

test('contas de senha continuam usando credencial de e-mail', async () => {
  const harness = authenticationHarness();
  const user = { uid: 'u', email: 'u@example.com', providerData: [{ providerId: 'password' }] };
  await harness.reauthenticateAccount(user, 'senha');
  assert.equal(harness.calls.length, 1);
  assert.deepEqual(harness.calls[0].credential, { email: user.email, password: 'senha' });
});
