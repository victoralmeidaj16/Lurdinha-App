import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// EXEMPLO - Substitua pelas suas credenciais reais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC...", // Sua API Key
  authDomain: "lurdinha-app.firebaseapp.com", // Seu domínio
  projectId: "lurdinha-app", // Seu Project ID
  storageBucket: "lurdinha-app.appspot.com", // Seu Storage Bucket
  messagingSenderId: "123456789", // Seu Sender ID
  appId: "1:123456789:web:abc123def456" // Seu App ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
