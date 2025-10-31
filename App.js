import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/components/LoginScreen';
import Navigation from './src/components/Navigation';

function AppContent() {
  const { currentUser } = useAuth();

  return (
    <>
      <StatusBar style="light" backgroundColor="#000000" />
      {currentUser ? <Navigation /> : <LoginScreen />}
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