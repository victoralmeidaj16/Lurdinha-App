import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, Platform } from 'react-native';
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
import LandingScreen from './src/screens/LandingScreen';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { colors } from './src/theme';
import configureTypography from './src/utils/configureTypography';
import installWebAlert from './src/utils/webAlert';

installWebAlert();

function AppContent() {
  const { currentUser } = useAuth();
  usePushNotifications(currentUser?.uid);
  const [loading, setLoading] = useState(true);
  const [viewedOnboarding, setViewedOnboarding] = useState(false);
  const [initialIsLogin, setInitialIsLogin] = useState(true);
  // Web visitors always see the landing page until they pick a login/signup CTA.
  const [leftLanding, setLeftLanding] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
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
    if (Platform.OS === 'web') {
      // The landing page replaces the onboarding slides on web.
      setViewedOnboarding(true);
      setLoading(false);
      return;
    }
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

  if (loading || (!fontsLoaded && !fontError)) {
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
      ) : Platform.OS === 'web' && !leftLanding ? (
        <LandingScreen
          onFinish={({ isLogin = true } = {}) => {
            setInitialIsLogin(isLogin);
            setLeftLanding(true);
          }}
        />
      ) : !viewedOnboarding ? (
        <OnboardingScreen onFinish={handleOnboardingFinish} />
      ) : (
        <LoginScreen
          initialIsLogin={initialIsLogin}
          onBack={Platform.OS === 'web' ? () => setLeftLanding(false) : undefined}
        />
      )}
    </>
  );
}

export default function AppRuntime() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
