import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Header from '../components/Header';

const PRIVACY_POLICY_URL = 'https://victoralmeidaj16.github.io/Lurdinha-App/privacy-policy.html';

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Header
        title="Política de Privacidade"
        onBack={() => navigation.goBack()}
      />
      <WebView
        source={{ uri: PRIVACY_POLICY_URL }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8A4F9E" />
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  webview: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
});

