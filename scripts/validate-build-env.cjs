// Run before an EAS build can publish a bundle with missing Firebase settings.
// Only report variable names; never log their values.
const REQUIRED_FIREBASE_ENV = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

function validateBuildEnv(env) {
  const missing = REQUIRED_FIREBASE_ENV.filter(name => !env[name]?.trim());
  if (missing.length) {
    throw new Error(`Configuração Firebase ausente no build: ${missing.join(', ')}. Configure essas variáveis no perfil do eas.json ou no ambiente EAS correspondente.`);
  }
}

if (require.main === module) {
  try {
    validateBuildEnv(process.env);
    console.log('Configuração Firebase do build validada.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { validateBuildEnv, REQUIRED_FIREBASE_ENV };
