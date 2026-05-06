import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  LogOut,
  Paintbrush,
  Trophy,
  Settings as SettingsIcon,
  ChevronRight,
  Crown,
  Bell,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';
import SkeletonLoader, { SkeletonAvatar } from '../components/SkeletonLoader';
import NetworkRetry from '../components/NetworkRetry';
import { fontStyles } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { logout } = useAuth();
  const { userData, loading, error, refreshUserData, updateUserPhoto } = useUserData();
  const [photoSaving, setPhotoSaving] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      Alert.alert('Erro', 'Falha ao fazer logout');
    }
  };

  const pickProfilePhoto = async (source) => {
    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          source === 'camera'
            ? 'Precisamos acessar sua câmera para tirar uma foto de perfil.'
            : 'Precisamos acessar suas fotos para escolher uma foto de perfil.'
        );
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
        : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      setPhotoSaving(true);
      await updateUserPhoto(result.assets[0].uri);
      Alert.alert('Foto atualizada', 'Sua foto de perfil foi substituída.');
    } catch (err) {
      console.error('Error updating profile photo:', err);
      Alert.alert('Erro', 'Não foi possível atualizar sua foto de perfil.');
    } finally {
      setPhotoSaving(false);
    }
  };

  const showProfilePhotoOptions = () => {
    if (photoSaving) return;

    Alert.alert(
      'Alterar foto de perfil',
      'Escolha uma nova foto para substituir seu avatar atual.',
      [
        { text: 'Tirar foto', onPress: () => pickProfilePhoto('camera') },
        { text: 'Escolher da galeria', onPress: () => pickProfilePhoto('gallery') },
        { text: 'Cancelar', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <SkeletonAvatar size={96} />
          <SkeletonLoader width={180} height={24} style={{ marginTop: 18 }} />
          <SkeletonLoader width={140} height={14} style={{ marginTop: 10 }} />
        </View>
      </View>
    );
  }

  if (error) {
    return <NetworkRetry onRetry={refreshUserData} message="Não foi possível carregar seu perfil." />;
  }

  const stats = userData?.stats || {};
  const socialStats = stats?.socialGames || {};
  const profileName = userData?.displayName || 'Usuário';

  const matches = (socialStats?.lurdinhaPlayed || 0) + (socialStats?.drawPlayed || 0);
  const wins = (socialStats?.lurdinhaWins || 0);
  const crowns = stats?.titles || 0;

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.ambientGlowTop} />
      <View pointerEvents="none" style={styles.ambientGlowBottom} />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Perfil</Text>
          <Text style={styles.headerSubtitle}>Seu espaço no app</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation?.navigate?.('Settings')}>
          <SettingsIcon size={20} color="#D1D5DB" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify().damping(18)} style={styles.heroShell}>
          <View style={styles.heroGlowPrimary} />
          <View style={styles.heroGlowSecondary} />
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeDot} />
            <Text style={styles.heroBadgeText}>Conta social</Text>
          </View>

          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={showProfilePhotoOptions}
            activeOpacity={0.86}
            disabled={photoSaving}
          >
            <LinearGradient
              colors={['#8B5CF6', '#B894FF', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradientRing}
            >
              <View style={styles.avatarInnerRing}>
                {userData?.photoURL ? (
                  <Image source={{ uri: userData.photoURL }} style={styles.heroImage} />
                ) : (
                  <View style={styles.heroFallback}>
                    <Text style={styles.heroFallbackText}>
                      {profileName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            <View style={styles.changePhotoButton}>
              {photoSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Camera size={16} color="#FFFFFF" />
              )}
            </View>

            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Nv. {userData?.stats?.level || 12}</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.heroName}>{profileName}</Text>
          <View style={styles.heroRoleRow}>
            <Crown size={14} color="#8B5CF6" />
            <Text style={styles.heroRole}>Pro Player</Text>
          </View>

          <View style={styles.coreStatsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>{matches}</Text>
              <Text style={styles.statBoxLabel}>Partidas</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={styles.statBoxValue}>{wins}</Text>
              <Text style={[styles.statBoxLabel, { color: '#8B5CF6', fontWeight: 'bold' }]}>Vitórias</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <View style={styles.statValueWithIcon}>
                <Text style={styles.statBoxValue}>{crowns} </Text>
                <Crown size={14} color="#F59E0B" />
              </View>
              <Text style={styles.statBoxLabel}>Coroas</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <Text style={styles.sectionTitle}>Conta</Text>

          <View style={styles.actionsBox}>
            <TouchableOpacity style={styles.actionRow} onPress={() => navigation?.navigate?.('EditProfile')}>
               <View style={styles.actionLeft}>
                 <View style={styles.actionIconWrap}>
                   <Paintbrush size={20} color="#C4B5FD" />
                 </View>
                 <Text style={styles.actionText}>Editar Perfil</Text>
               </View>
               <ChevronRight size={18} color="rgba(196,181,253,0.42)" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={() => navigation?.navigate?.('History')}>
               <View style={styles.actionLeft}>
                 <View style={styles.actionIconWrap}>
                   <Trophy size={20} color="#C4B5FD" />
                 </View>
                 <Text style={styles.actionText}>Histórico de Jogos</Text>
               </View>
               <ChevronRight size={18} color="rgba(196,181,253,0.42)" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={() => navigation?.navigate?.('Notifications')}>
               <View style={styles.actionLeft}>
                 <View style={styles.actionIconWrap}>
                   <Bell size={20} color="#C4B5FD" />
                 </View>
                 <Text style={styles.actionText}>Notificações</Text>
               </View>
               <ChevronRight size={18} color="rgba(196,181,253,0.42)" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionRow, { borderBottomWidth: 0 }]} onPress={handleLogout}>
               <View style={styles.actionLeft}>
                 <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                   <LogOut size={20} color="#EF4444" />
                 </View>
                 <Text style={[styles.actionText, { color: '#EF4444' }]}>Sair</Text>
               </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  ambientGlowTop: {
    position: 'absolute',
    top: 20,
    right: -72,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    left: -88,
    bottom: 120,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(168,85,247,0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    ...fontStyles.headingBold,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    marginTop: 3,
    color: 'rgba(255,255,255,0.46)',
    fontSize: 14,
  },
  headerBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#202024',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#09090B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    backgroundColor: '#18181B',
  },
  heroShell: {
    backgroundColor: '#18181B',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 32,
    overflow: 'hidden',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
    backgroundColor: 'rgba(139,92,246,0.14)',
    borderColor: 'rgba(167,139,250,0.2)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#A78BFA',
  },
  heroBadgeText: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroGlowPrimary: {
    position: 'absolute',
    top: 0,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(168,85,247,0.1)',
  },
  heroGlowSecondary: {
    position: 'absolute',
    bottom: 0,
    left: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(249,115,22,0.1)',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarGradientRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 4,
  },
  avatarInnerRing: {
    flex: 1,
    backgroundColor: '#18181B',
    borderRadius: 48,
    padding: 4,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  changePhotoButton: {
    position: 'absolute',
    right: -2,
    bottom: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#8B5CF6',
    borderWidth: 3,
    borderColor: '#09090B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  heroFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFallbackText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    transform: [{ translateX: -30 }], // approx half width
    backgroundColor: '#09090B',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 24,
    ...fontStyles.headingBold,
    marginBottom: 4,
  },
  heroRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  heroRole: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  coreStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 280,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBoxValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statValueWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBoxLabel: {
    color: '#6B7280',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
    marginLeft: 8,
  },
  actionsBox: {
    backgroundColor: '#18181B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.12)',
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
  },
});
