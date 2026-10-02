const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { validateBuildEnv, REQUIRED_FIREBASE_ENV } = require('../scripts/validate-build-env.cjs');
const eas = require('../eas.json');

test('produção possui configuração Firebase completa sem depender do .env local', () => {
  assert.doesNotThrow(() => validateBuildEnv(eas.build.production.env));
});

test('validação rejeita configuração ausente, vazia ou em branco sem expor valores', () => {
  for (const name of REQUIRED_FIREBASE_ENV) {
    for (const value of [undefined, '', '  ']) {
      const env = Object.fromEntries(REQUIRED_FIREBASE_ENV.map(key => [key, 'private-test-value']));
      env[name] = value;
      assert.throws(() => validateBuildEnv(env), error => error.message.includes(name) && !error.message.includes('private-test-value'));
    }
  }
});

test('hook interrompe build sem variáveis e aceita ambiente completo', () => {
  const script = path.resolve(__dirname, '../scripts/validate-build-env.cjs');
  const missing = spawnSync(process.execPath, [script], { env: {}, encoding: 'utf8' });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /EXPO_PUBLIC_FIREBASE_API_KEY/);
  const complete = spawnSync(process.execPath, [script], { env: eas.build.production.env, encoding: 'utf8' });
  assert.equal(complete.status, 0);
});
