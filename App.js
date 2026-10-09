import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { View } from 'react-native';
import ErrorBoundary from './src/components/ErrorBoundary';

function StartupContent() {
  // Load Firebase and screens during render so startup errors reach the boundary.
  const AppRuntime = require('./AppRuntime').default;
  return <AppRuntime />;
}

export default function App() {
  // Expo hides the native splash when this view mounts. Do not hold it while
  // authentication, local storage or fonts load; they have their own loading UI.
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <ErrorBoundary fallbackMessage="Não foi possível iniciar o app. Feche e abra novamente. Se continuar, entre em contato com o suporte.">
        <StartupContent />
      </ErrorBoundary>
    </View>
  );
}
