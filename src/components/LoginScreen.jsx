import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, User, AtSign } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, signup, loginWithGoogle, loginWithApple, resetPassword } = useAuth();
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  async function handleResetPassword() {
    if (!email) {
      return setError('Por favor, informe seu email');
    }

    try {
      setError('');
      setLoading(true);
      await resetPassword(email);
      Alert.alert('Sucesso', 'Email de recuperação enviado! Verifique sua caixa de entrada.');
      setIsForgotPassword(false);
      setIsLogin(true);
    } catch (error) {
      setError('Falha ao enviar email: ' + error.message);
    }
    setLoading(false);
  }

  async function checkUsernameAvailability(usernameToCheck) {
    const usernameDoc = await getDoc(doc(db, 'usernames', usernameToCheck.toLowerCase()));
    return !usernameDoc.exists();
  }

  async function handleSubmit() {
    if (isLogin) {
      if (!email || !password) {
        return setError('Preencha todos os campos');
      }
    } else {
      if (!email || !password || !displayName.trim() || !username.trim()) {
        return setError('Preencha todos os campos');
      }
      if (displayName.trim().length < 2) {
        return setError('O nome deve ter pelo menos 2 caracteres');
      }
      if (username.trim().length < 3) {
        return setError('O usuário deve ter pelo menos 3 caracteres');
      }
      // Validar formato do username (apenas letras, números e underline)
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(username.trim())) {
        return setError('O usuário deve conter apenas letras, números e underline');
      }
    }

    try {
      setError('');
      setLoading(true);

      if (isLogin) {
        await login(email, password);
      } else {
        // Verificar disponibilidade do username antes de criar a conta
        const lowerUsername = username.trim().toLowerCase();
        const isAvailable = await checkUsernameAvailability(lowerUsername);

        if (!isAvailable) {
          setLoading(false);
          return setError('Este nome de usuário já está em uso');
        }

        // Criar conta
        const userCredential = await signup(email, password, displayName.trim());
        const user = userCredential.user;

        // Salvar username e dados do usuário
        await setDoc(doc(db, 'usernames', lowerUsername), {
          uid: user.uid,
          createdAt: new Date()
        });

        // O documento do usuário será criado/atualizado pelo useUserData, 
        // mas podemos garantir a criação inicial aqui com o username
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: displayName.trim(),
          username: lowerUsername,
          photoURL: user.photoURL || 'https://i.pravatar.cc/100?img=25',
          createdAt: new Date(),
          stats: {
            ranking: 0,
            fireStreak: 0,
            acertos: 0,
            enquetesVotadas: 0,
            grupos: 0
          },
          groups: []
        });
      }
    } catch (error) {
      setError('Falha na autenticação: ' + error.message);
    }

    setLoading(false);
  }

  // Verificar disponibilidade do Apple Sign-In
  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setIsAppleAvailable);
    }
  }, []);

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
    } catch (error) {
      if (error.message !== 'Login cancelado.') {
        setError('Falha no login com Google: ' + error.message);
      }
      setLoading(false);
    }
  }

  async function handleAppleLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithApple();
    } catch (error) {
      if (error.message !== 'Login cancelado.') {
        setError('Falha no login com Apple: ' + error.message);
      }
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logo}>
              lurdinha <Text style={styles.emoji}>💛</Text>
            </Text>
            <Text style={styles.subtitle}>
              {isForgotPassword ? 'Recuperar Senha' : (isLogin ? 'Entre na sua conta' : 'Crie sua conta')}
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Nome (apenas no cadastro) */}
            {!isLogin && !isForgotPassword && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Nome</Text>
                  <View style={styles.inputWrapper}>
                    <User style={styles.inputIcon} size={20} color="#ffffff50" />
                    <TextInput
                      style={styles.input}
                      value={displayName}
                      onChangeText={setDisplayName}
                      placeholder="Seu nome"
                      placeholderTextColor="#ffffff50"
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Usuário</Text>
                  <View style={styles.inputWrapper}>
                    <AtSign style={styles.inputIcon} size={20} color="#ffffff50" />
                    <TextInput
                      style={styles.input}
                      value={username}
                      onChangeText={(text) => setUsername(text.toLowerCase())}
                      placeholder="seu_usuario"
                      placeholderTextColor="#ffffff50"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Mail style={styles.inputIcon} size={20} color="#ffffff50" />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seu@email.com"
                  placeholderTextColor="#ffffff50"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password */}
            {!isForgotPassword && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.inputWrapper}>
                  <Lock style={styles.inputIcon} size={20} color="#ffffff50" />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Sua senha"
                    placeholderTextColor="#ffffff50"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#ffffff50" />
                    ) : (
                      <Eye size={20} color="#ffffff50" />
                    )}
                  </TouchableOpacity>
                </View>
                {isLogin && (
                  <TouchableOpacity
                    style={styles.forgotPasswordButton}
                    onPress={() => setIsForgotPassword(true)}
                  >
                    <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={isForgotPassword ? handleResetPassword : handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Carregando...' : (isForgotPassword ? 'Enviar Email' : (isLogin ? 'Entrar' : 'Criar Conta'))}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialButtonsContainer}>
            {/* Apple Login (iOS only) */}
            {Platform.OS === 'ios' && isAppleAvailable && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={12}
                style={styles.appleButton}
                onPress={handleAppleLogin}
              />
            )}
          </View>

          {/* Toggle Login/Signup */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => {
              if (isForgotPassword) {
                setIsForgotPassword(false);
                setIsLogin(true);
                setError('');
                return;
              }
              setIsLogin(!isLogin);
              setDisplayName(''); // Limpar nome ao alternar
              setUsername(''); // Limpar username ao alternar
              setError(''); // Limpar erros
            }}
          >
            <Text style={styles.toggleButtonText}>
              {isForgotPassword
                ? 'Voltar para o Login'
                : (isLogin ? 'Não tem conta? Criar conta' : 'Já tem conta? Fazer login')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Pure black background
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24, // Increased padding
  },
  card: {
    // Removed card styling (bg, border, radius) for cleaner look
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48, // More spacing
  },
  logoImage: {
    width: 100, // Slightly larger
    height: 100,
    marginBottom: 24,
  },
  logo: {
    fontSize: 36, // Larger font
    fontWeight: '800', // Bolder
    color: '#ffffff',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 32,
  },
  subtitle: {
    color: '#9ca3af', // Gray-400 equivalent
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#e5e7eb', // Gray-200
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b', // Zinc-900
    borderWidth: 1,
    borderColor: '#27272a', // Zinc-800
    borderRadius: 16, // More rounded
    paddingHorizontal: 16,
    height: 56, // Taller inputs
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#ffffff',
    fontSize: 16,
  },
  eyeButton: {
    padding: 8,
  },
  submitButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 16, // Match inputs
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  socialButtonsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  socialButton: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  socialButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  appleButton: {
    width: '100%',
    height: 56,
  },
  toggleButton: {
    alignItems: 'center',
    padding: 16,
  },
  toggleButtonText: {
    color: '#9ca3af',
    fontSize: 15,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
    padding: 4,
  },
  forgotPasswordText: {
    color: '#a78bfa', // Lighter purple
    fontSize: 14,
    fontWeight: '500',
  },
});
