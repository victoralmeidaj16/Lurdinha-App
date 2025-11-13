import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import {
  ChevronRight,
  Shield,
  FileText,
  Mail,
  Trash2,
  LogOut,
  UserCog,
} from 'lucide-react-native';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';

const SUPPORT_EMAIL = 'contato@lurdinha.app';

function SettingsRow({ icon: Icon, label, description, onPress, danger }) {
  return (
    <TouchableOpacity
      style={[styles.row, danger && styles.rowDanger]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.rowIconContainer, danger && styles.rowIconDanger]}>
        <Icon size={20} color={danger ? '#fca5a5' : '#8b5cf6'} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {description ? (
          <Text style={[styles.rowDescription, danger && styles.rowDescriptionDanger]}>
            {description}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={18} color={danger ? '#fca5a5' : '#9ca3af'} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }) {
  const { logout } = useAuth();
  const { userData } = useUserData();

  const handleContact = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=Suporte - Lurdinha App`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(
        'Não foi possível abrir o e-mail',
        `Envie uma mensagem para ${SUPPORT_EMAIL}`
      );
      return;
    }
    Linking.openURL(url);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza de que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header
          title="Configurações"
          subtitle="Gerencie sua conta e preferências"
          onBack={() => navigation.goBack()}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sua conta</Text>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userData?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {userData?.displayName || 'Usuário'}
              </Text>
              <Text style={styles.profileEmail}>
                {userData?.email || 'email não disponível'}
              </Text>
            </View>
          </View>

          <SettingsRow
            icon={UserCog}
            label="Dados da conta"
            description="Revise suas informações básicas"
            onPress={() => navigation.navigate('profile')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacidade e legal</Text>
          <SettingsRow
            icon={Shield}
            label="Política de Privacidade"
            description="Saiba como tratamos seus dados"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          <SettingsRow
            icon={FileText}
            label="Termos de Serviço"
            description="Leia os termos de uso do aplicativo"
            onPress={() => navigation.navigate('TermsOfService')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suporte</Text>
          <SettingsRow
            icon={Mail}
            label="Falar com o suporte"
            description="Envie um e-mail para nossa equipe"
            onPress={handleContact}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Encerramento</Text>
          <SettingsRow
            icon={Trash2}
            label="Excluir conta"
            description="Remova permanentemente sua conta e dados"
            onPress={() => navigation.navigate('DeleteAccount')}
            danger
          />
          <SettingsRow
            icon={LogOut}
            label="Sair"
            description="Desconecte-se deste dispositivo"
            onPress={handleLogout}
            danger
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  profileEmail: {
    marginTop: 4,
    fontSize: 14,
    color: '#cbd5f5',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  rowDanger: {
    backgroundColor: 'rgba(220, 38, 38, 0.06)',
    borderColor: 'rgba(248, 113, 113, 0.24)',
  },
  rowIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rowIconDanger: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  rowLabelDanger: {
    color: '#fca5a5',
  },
  rowDescription: {
    marginTop: 4,
    fontSize: 13,
    color: '#94a3b8',
  },
  rowDescriptionDanger: {
    color: '#fca5a5',
  },
});

