import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { Poppins_800ExtraBold } from '@expo-google-fonts/poppins/800ExtraBold';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/components/LoginScreen';
import RootNavigator from './src/components/RootNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ErrorBoundary from './src/components/ErrorBoundary';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { colors } from './src/theme';
import configureTypography from './src/utils/configureTypography';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppContent() {
  const { currentUser } = useAuth();
  usePushNotifications(currentUser?.uid);
  const [loading, setLoading] = useState(true);
  const [viewedOnboarding, setViewedOnboarding] = useState(false);
  const [initialIsLogin, setInitialIsLogin] = useState(true);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  useEffect(() => {
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      configureTypography();
    }
  }, [fontsLoaded]);

  const checkOnboarding = async () => {
    try {
      const value = await AsyncStorage.getItem('@viewedOnboarding');
      if (value !== null) {
        setViewedOnboarding(true);
      }
    } catch (err) {
      console.log('Error @checkOnboarding: ', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingFinish = async ({ isLogin = true } = {}) => {
    try {
      setInitialIsLogin(isLogin);
      await AsyncStorage.setItem('@viewedOnboarding', 'true');
      setViewedOnboarding(true);
    } catch (err) {
      console.log('Error @handleOnboardingFinish: ', err);
    }
  };

  if (loading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      {currentUser ? (
        <RootNavigator />
      ) : !viewedOnboarding ? (
        <OnboardingScreen onFinish={handleOnboardingFinish} />
      ) : (
        <LoginScreen initialIsLogin={initialIsLogin} />
      )}
    </>
  );
}

export default function App() {
  const [rootLaidOut, setRootLaidOut] = useState(false);

  const handleRootLayout = useCallback(() => {
    if (rootLaidOut) return;
    setRootLaidOut(true);
    SplashScreen.hideAsync().catch(() => {});
  }, [rootLaidOut]);

  return (
    <View style={{ flex: 1 }} onLayout={handleRootLayout}>
      <ErrorBoundary>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ErrorBoundary>
    </View>
  );
}
