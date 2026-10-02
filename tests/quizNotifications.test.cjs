const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./load-source.cjs');

function fakeFirestore(store) {
  return {
    doc: (_, col, id) => ({ col, id }),
    getDoc: async ({ col, id }) => ({
      exists: () => Boolean(store[col]?.[id]),
      data: () => store[col]?.[id],
    }),
  };
}

test('aviso de quiz novo vai para os outros membros com token, sem duplicar', async () => {
  const store = {
    users: {
      me: { expoPushToken: 'ExponentPushToken[me]' },
      ana: { expoPushToken: 'ExponentPushToken[ana]' },
      bia: { expoPushToken: 'ExponentPushToken[ana]' },
      caio: {},
    },
  };
  const sent = [];
  const { notifyGroupMembers } = loadSource('src/utils/quizNotifications.js', {
    'firebase/firestore': fakeFirestore(store),
    '../firebase': { db: {} },
    '../hooks/usePushNotifications': { sendPushNotification: async (...args) => sent.push(args) },
  });

  await notifyGroupMembers({
    memberIds: ['me', 'ana', 'bia', 'caio', 'fantasma'],
    excludeUid: 'me',
    title: 'Novo',
    body: 'Corpo',
    data: { type: 'NEW_QUIZ' },
  });
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0][0], ['ExponentPushToken[ana]']);
  assert.equal(sent[0][3].type, 'NEW_QUIZ');

  await notifyGroupMembers({ memberIds: ['me'], excludeUid: 'me', title: 'x', body: 'y' });
  assert.equal(sent.length, 1);
});

test('falha ao enviar aviso não lança erro (não pode travar a criação do quiz)', async () => {
  const { notifyGroupMembers } = loadSource('src/utils/quizNotifications.js', {
    'firebase/firestore': fakeFirestore({ users: { ana: { expoPushToken: 'ExponentPushToken[ana]' } } }),
    '../firebase': { db: {} },
    '../hooks/usePushNotifications': { sendPushNotification: async () => { throw new Error('rede'); } },
  });
  const originalError = console.error;
  console.error = () => {};
  try {
    await notifyGroupMembers({ memberIds: ['ana'], excludeUid: 'me', title: 'x', body: 'y' });
  } finally {
    console.error = originalError;
  }
});
