import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configurar Google Sign-In
  // useEffect(() => {
  //   GoogleSignin.configure({
  //     webClientId: 'SEU_WEB_CLIENT_ID_AQUI', // Substitua pelo seu Web Client ID
  //     offlineAccess: true,
  //   });
  // }, []);

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    try {
      // Google Sign-In temporariamente desabilitado
      throw new Error('Google Sign-In não está configurado. Use email e senha por enquanto.');
      
      // // Verificar se o Google Play Services está disponível
      // await GoogleSignin.hasPlayServices();
      
      // // Fazer login com Google
      // const { idToken } = await GoogleSignin.signIn();
      
      // // Criar credencial do Google
      // const googleCredential = GoogleAuthProvider.credential(idToken);
      
      // // Fazer login no Firebase com a credencial do Google
      // return signInWithCredential(auth, googleCredential);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      // Fazer logout do Google Sign-In
      // await GoogleSignin.signOut();
      // Fazer logout do Firebase
      return signOut(auth);
    } catch (error) {
      console.error('Logout Error:', error);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    logout,
    loginWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
