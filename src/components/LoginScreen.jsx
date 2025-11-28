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
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
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

  async function handleSubmit() {
    if (isLogin) {
      if (!email || !password) {
        return setError('Preencha todos os campos');
      }
    } else {
      if (!email || !password || !displayName.trim()) {
        return setError('Preencha todos os campos');
      }
      if (displayName.trim().length < 2) {
        return setError('O nome deve ter pelo menos 2 caracteres');
      }
    }

    try {
      setError('');
      setLoading(true);

      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, displayName.trim());
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
            {/* Google Login - apenas em builds customizados */}
            {/* O botão só aparece se o Google Sign-In estiver disponível */}
            {/* No Expo Go, o botão não será exibido automaticamente */}

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
    backgroundColor: '#1a1a2e',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  emoji: {
    color: '#fbbf24',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  errorText: {
    color: '#fecaca',
    fontSize: 14,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    color: '#ffffff',
    fontSize: 16,
  },
  eyeButton: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  socialButtonsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
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
    height: 50,
  },
  toggleButton: {
    alignItems: 'center',
  },
  toggleButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#8b5cf6',
    fontSize: 14,
  },
});
