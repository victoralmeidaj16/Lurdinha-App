// Remove os contadores do jogo "Lurdinha" (stats.socialGames.lurdinhaPlayed/lurdinhaWins)
// de todos os documentos em `users`.
//
// Uso (a partir da raiz do projeto, com credenciais padrão do gcloud já configuradas):
//   node scripts/remove-lurdinha-stats.cjs            # simulação: só conta
//   node scripts/remove-lurdinha-stats.cjs --apply    # grava de verdade
const path = require('path');
const admin = require(path.join(__dirname, '../functions/node_modules/firebase-admin'));

const PROJECT_ID = 'lurdinha-1451d';
const FIELDS = ['stats.socialGames.lurdinhaPlayed', 'stats.socialGames.lurdinhaWins'];
const apply = process.argv.includes('--apply');

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

(async () => {
  console.log(`${apply ? 'APLICANDO' : 'SIMULAÇÃO'} em ${PROJECT_ID}`);
  const snapshot = await db.collection('users').get();
  const targets = snapshot.docs.filter((doc) => {
    const social = doc.get('stats.socialGames') || {};
    return 'lurdinhaPlayed' in social || 'lurdinhaWins' in social;
  });
  console.log(`${snapshot.size} usuários lidos, ${targets.length} com contadores da Lurdinha.`);
  if (!apply) return;

  let batch = db.batch();
  let pending = 0;
  for (const doc of targets) {
    batch.update(doc.ref, Object.fromEntries(FIELDS.map((f) => [f, admin.firestore.FieldValue.delete()])));
    if (++pending === 400) { await batch.commit(); batch = db.batch(); pending = 0; }
  }
  if (pending) await batch.commit();
  console.log('Concluído.');
})().catch((err) => { console.error(err); process.exit(1); });
