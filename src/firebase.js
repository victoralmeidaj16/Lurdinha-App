import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Suas configurações do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAqviVROU5hIbcmWpnLK8Ru5tfPJ3JkwJ0",
  authDomain: "lurdinha-1451d.firebaseapp.com",
  projectId: "lurdinha-1451d",
  storageBucket: "lurdinha-1451d.firebasestorage.app",
  messagingSenderId: "605109047504",
  appId: "1:605109047504:web:8eee61ed6e2c40b4788ed5",
  measurementId: "G-PRK6NL0MYJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics (opcional - funciona apenas na web)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };

export default app;
