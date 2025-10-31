// Firebase Admin SDK - Para uso em backend/servidor
// Este arquivo é apenas para referência futura

const admin = require("firebase-admin");

// Para usar o Firebase Admin, você precisará:
// 1. Baixar o arquivo serviceAccountKey.json do Firebase Console
// 2. Colocar na pasta do projeto
// 3. Descomentar e ajustar o código abaixo

/*
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://lurdinha-1451d-default-rtdb.firebaseio.com"
});

module.exports = admin;
*/

// Para obter o serviceAccountKey.json:
// 1. Acesse Firebase Console > Project Settings
// 2. Vá para a aba "Service accounts"
// 3. Clique em "Generate new private key"
// 4. Baixe o arquivo JSON
// 5. Renomeie para "serviceAccountKey.json"
// 6. Coloque na raiz do projeto
