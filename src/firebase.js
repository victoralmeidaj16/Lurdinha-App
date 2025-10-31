import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Initialize Auth with AsyncStorage persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);

// Analytics - só inicializa se suportado (não funciona em React Native/Expo Go)
let analytics = null;
isSupported().then((supported) => {
  if (supported && typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
}).catch(() => {
  // Analytics não suportado neste ambiente (React Native)
  analytics = null;
});
export { analytics };

export default app;
