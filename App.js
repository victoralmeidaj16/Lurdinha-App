import 'react-native-reanimated';
import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/components/LoginScreen';
import Navigation from './src/components/Navigation';
import OnboardingScreen from './src/screens/OnboardingScreen';

function AppContent() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [viewedOnboarding, setViewedOnboarding] = useState(false);

  useEffect(() => {
    checkOnboarding();
  }, []);

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

  const handleOnboardingFinish = async () => {
    try {
      await AsyncStorage.setItem('@viewedOnboarding', 'true');
      setViewedOnboarding(true);
    } catch (err) {
      console.log('Error @handleOnboardingFinish: ', err);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#000000" />
      {currentUser ? (
        <Navigation />
      ) : !viewedOnboarding ? (
        <OnboardingScreen onFinish={handleOnboardingFinish} />
      ) : (
        <LoginScreen />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}