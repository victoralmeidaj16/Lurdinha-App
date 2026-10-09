const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./load-source.cjs');

test('Firebase web usa o Auth do navegador sem persistência React Native', () => {
  const app = { platform: 'web' };
  const auth = { app };
  let receivedConfig;

  const firebase = loadSource('src/firebase.web.js', {
    'firebase/app': {
      initializeApp(config) {
        receivedConfig = config;
        return app;
      },
    },
    'firebase/auth': {
      getAuth(receivedApp) {
        assert.equal(receivedApp, app);
        return auth;
      },
    },
    'firebase/firestore': { getFirestore: () => ({ app }) },
    'firebase/storage': { getStorage: () => ({ app }) },
    'firebase/analytics': {
      getAnalytics: () => ({ app }),
      isSupported: () => Promise.resolve(false),
    },
  });

  assert.equal(firebase.default, app);
  assert.equal(firebase.auth, auth);
  assert.equal(receivedConfig.projectId, process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);
});
