import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { Mail, Phone, Heart } from 'lucide-react-native';
import Header from '../components/Header';
import { colors, fontStyles } from '../theme';

export default function AboutScreen({ navigation }) {
  const handleEmailPress = () => {
    Linking.openURL('mailto:victor.almeida.jeremias@gmail.com?subject=Contato - Lurdinha App');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+5548996147527');
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header
          title="Sobre o App"
          onBack={() => navigation.goBack()}
        />

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* App Info */}
        <View style={styles.infoCard}>
          <Text style={styles.appName}>Lurdinha</Text>
          <Text style={styles.appVersion}>Versão 1.0.7</Text>
          <Text style={styles.appDescription}>
            Preveja comportamentos, aposte no seu feeling e descubra se até a Lurdinha sabia.
            Uma plataforma divertida para criar enquetes e competir com seus grupos.
          </Text>
        </View>

        {/* Developer Info */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Desenvolvedor</Text>
          <Text style={styles.infoText}>Victor Almeida Jeremias</Text>
          
          <View style={styles.contactContainer}>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={handleEmailPress}
              activeOpacity={0.7}
            >
              <Mail size={18} color={colors.primary} />
              <Text style={styles.contactText}>victor.almeida.jeremias@gmail.com</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={handlePhonePress}
              activeOpacity={0.7}
            >
              <Phone size={18} color={colors.primary} />
              <Text style={styles.contactText}>+55 48 99614-7527</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Credits */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Créditos</Text>
          <Text style={styles.infoText}>
            Desenvolvido com ❤️ usando React Native e Expo
          </Text>
          <Text style={styles.infoText}>
            Backend: Firebase (Firestore, Authentication, Storage)
          </Text>
        </View>

        {/* Legal Links */}
        <View style={styles.legalContainer}>
          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => navigation.navigate('PrivacyPolicy')}
            activeOpacity={0.7}
          >
            <Text style={styles.legalLinkText}>Política de Privacidade</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}>•</Text>
          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => navigation.navigate('TermsOfService')}
            activeOpacity={0.7}
          >
            <Text style={styles.legalLinkText}>Termos de Serviço</Text>
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightContainer}>
          <Heart size={14} color={colors.textMuted} />
          <Text style={styles.copyrightText}>
            © 2024 Lurdinha. Todos os direitos reservados.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
  },
  infoCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  appName: {
    ...fontStyles.bold,
    fontSize: 28,
    color: colors.textLight,
    marginBottom: 8,
    textAlign: 'center',
  },
  appVersion: {
    ...fontStyles.regular,
    fontSize: 14,
    color: colors.textAlt,
    marginBottom: 16,
    textAlign: 'center',
  },
  appDescription: {
    ...fontStyles.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textAlt,
    textAlign: 'center',
  },
  sectionTitle: {
    ...fontStyles.semibold,
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 12,
  },
  infoText: {
    ...fontStyles.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textAlt,
    marginBottom: 8,
  },
  contactContainer: {
    marginTop: 12,
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  contactText: {
    ...fontStyles.medium,
    fontSize: 14,
    color: colors.primary,
  },
  legalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 32,
    marginBottom: 24,
  },
  legalLink: {
    paddingVertical: 8,
  },
  legalLinkText: {
    ...fontStyles.medium,
    fontSize: 14,
    color: colors.primary,
  },
  legalSeparator: {
    fontSize: 14,
    color: colors.textAlt,
  },
  copyrightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  copyrightText: {
    ...fontStyles.regular,
    fontSize: 12,
    color: colors.textAlt,
    textAlign: 'center',
  },
});

