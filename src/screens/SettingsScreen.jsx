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
  HelpCircle,
  Info,
  Download,
  Volume2,
} from 'lucide-react-native';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';
import { colors } from '../theme';

const SUPPORT_EMAIL = 'victor.almeida.jeremias@gmail.com';

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
      <View style={[styles.rowChevronShell, danger && styles.rowChevronShellDanger]}>
        <ChevronRight size={18} color={danger ? '#fca5a5' : '#c4b5fd'} />
      </View>
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
      <View pointerEvents="none" style={styles.ambientGlowTop} />
      <View pointerEvents="none" style={styles.ambientGlowBottom} />
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
            <View pointerEvents="none" style={styles.profileOrb} />
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
          <Text style={styles.sectionTitle}>Suporte e Informações</Text>
          <SettingsRow
            icon={Volume2}
            label="Laboratório de sons"
            description="Teste cliques, respostas e sons de rodada"
            onPress={() => navigation.navigate('SoundLab')}
          />
          <SettingsRow
            icon={HelpCircle}
            label="Central de Suporte"
            description="FAQ, perguntas frequentes e ajuda"
            onPress={() => navigation.navigate('Support')}
          />
          <SettingsRow
            icon={Info}
            label="Sobre o App"
            description="Informações sobre o Lurdinha"
            onPress={() => navigation.navigate('Marketing')}
          />
          <SettingsRow
            icon={Mail}
            label="Falar com o suporte"
            description="Envie um e-mail para nossa equipe"
            onPress={handleContact}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seus Dados</Text>
          <SettingsRow
            icon={Download}
            label="Exportar Dados"
            description="Baixe uma cópia dos seus dados (LGPD)"
            onPress={() => navigation.navigate('ExportData')}
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
    backgroundColor: '#0f0f13',
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#7C3AED',
    opacity: 0.08,
  },
  ambientGlowBottom: {
    position: 'absolute',
    left: -120,
    bottom: -60,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: '#FF6B35',
    opacity: 0.06,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.42)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17171C',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.12)',
    overflow: 'hidden',
  },
  profileOrb: {
    position: 'absolute',
    right: -28,
    top: 18,
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
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
    color: 'rgba(255,255,255,0.56)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#17171C',
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.12)',
  },
  rowDanger: {
    backgroundColor: 'rgba(38, 16, 18, 0.82)',
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
  rowChevronShell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(139,92,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowChevronShellDanger: {
    backgroundColor: 'rgba(248,113,113,0.1)',
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
