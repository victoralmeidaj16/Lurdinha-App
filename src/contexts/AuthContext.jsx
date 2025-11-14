import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  updateProfile
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { auth } from '../firebase';

// Verificar se estamos no Expo Go ANTES de qualquer import
// Expo Go não suporta módulos nativos customizados
let isExpoGo = false;
try {
  // Verificar se Constants está disponível e se estamos no Expo Go
  if (Constants && Constants.executionEnvironment) {
    isExpoGo = Constants.executionEnvironment === 'storeClient';
  } else {
    // Se não conseguir verificar, assumir que estamos no Expo Go por segurança
    isExpoGo = true;
  }
} catch (error) {
  // Se houver qualquer erro, assumir Expo Go por segurança
  isExpoGo = true;
}

// Função lazy para carregar Google Sign-In apenas quando necessário
// IMPORTANTE: Nunca executar require no Expo Go
let GoogleSignin = null;
let isGoogleSignInAvailable = false;
let googleSignInLoaded = false;

function loadGoogleSignIn() {
  // Se já tentamos carregar, retornar resultado em cache
  if (googleSignInLoaded) {
    return { GoogleSignin, isGoogleSignInAvailable };
  }
  
  googleSignInLoaded = true;
  
  // CRÍTICO: NUNCA tentar require se estiver no Expo Go
  // Isso causaria erro fatal no nível nativo
  if (isExpoGo) {
    isGoogleSignInAvailable = false;
    GoogleSignin = null;
    return { GoogleSignin, isGoogleSignInAvailable };
  }
  
  // Só tentar importar em builds customizados
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const googleSignInModule = require('@react-native-google-signin/google-signin');
    if (googleSignInModule?.GoogleSignin) {
      GoogleSignin = googleSignInModule.GoogleSignin;
      isGoogleSignInAvailable = true;
    }
  } catch (error) {
    // Módulo não disponível - não é um erro fatal
    isGoogleSignInAvailable = false;
    GoogleSignin = null;
  }
  
  return { GoogleSignin, isGoogleSignInAvailable };
}

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configurar Google Sign-In apenas se estiver disponível
  useEffect(() => {
    const { GoogleSignin: GS, isGoogleSignInAvailable: available } = loadGoogleSignIn();
    if (available && GS) {
      try {
        GS.configure({
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '', // Configure no .env ou app.json
          offlineAccess: true,
        });
      } catch (error) {
        console.warn('Erro ao configurar Google Sign-In:', error);
      }
    }
  }, []);

  async function signup(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Atualizar o displayName no Firebase Auth
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
    }
    
    return userCredential;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    // Carregar Google Sign-In lazy
    const { GoogleSignin: GS, isGoogleSignInAvailable: available } = loadGoogleSignIn();
    
    // Google Sign-In não funciona no Expo Go
    if (!available || !GS) {
      throw new Error('Google Sign-In requer um build customizado. Use Email/Senha ou faça um build de desenvolvimento com EAS Build.');
    }

    try {
      // Verificar se o Google Play Services está disponível (Android)
      if (Platform.OS === 'android') {
        await GS.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      
      // Fazer login com Google
      const { idToken } = await GS.signIn();
      
      if (!idToken) {
        throw new Error('Não foi possível obter o token do Google.');
      }
      
      // Criar credencial do Google
      const googleCredential = GoogleAuthProvider.credential(idToken);
      
      // Fazer login no Firebase com a credencial do Google
      return signInWithCredential(auth, googleCredential);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      
      // Se o usuário cancelou, não mostrar erro
      if (error.code === 'SIGN_IN_CANCELLED' || error.code === '10') {
        throw new Error('Login cancelado.');
      }
      
      throw error;
    }
  }

  async function loginWithApple() {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign-In está disponível apenas no iOS.');
      }

      // Verificar se o Apple Authentication está disponível
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign-In não está disponível neste dispositivo.');
      }

      // Iniciar autenticação com Apple
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('Não foi possível obter o token da Apple.');
      }

      // Criar provider OAuth para Apple
      const provider = new OAuthProvider('apple.com');
      const appleCredential = provider.credential({
        idToken: credential.identityToken,
        rawNonce: credential.nonce,
      });

      // Fazer login no Firebase com a credencial da Apple
      return signInWithCredential(auth, appleCredential);
    } catch (error) {
      console.error('Apple Sign-In Error:', error);
      
      // Se o usuário cancelou, não mostrar erro
      if (error.code === 'ERR_CANCELED') {
        throw new Error('Login cancelado.');
      }
      
      throw error;
    }
  }

  async function logout() {
    try {
      // Fazer logout do Google Sign-In se estiver logado (apenas se disponível)
      const { GoogleSignin: GS, isGoogleSignInAvailable: available } = loadGoogleSignIn();
      if (available && GS) {
        try {
          const isSignedIn = await GS.isSignedIn();
          if (isSignedIn) {
            await GS.signOut();
          }
        } catch (error) {
          // Ignorar erros do Google Sign-In no logout
          // Google Sign-Out error (ignored for social login users)
        }
      }
      
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
    loginWithGoogle,
    loginWithApple
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
