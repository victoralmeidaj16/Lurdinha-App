import React, { useEffect, useState } from 'react';
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
  SquarePen,
  History,
  Settings as SettingsIcon,
  ChevronRight,
  BellRing,
  Power,
  Zap,
} from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';
import { db } from '../firebase';
import SkeletonLoader, { SkeletonAvatar } from '../components/SkeletonLoader';
import NetworkRetry from '../components/NetworkRetry';


// ─── Medal visuals ───────────────────────────────────────────
const MEDAL_BADGES = [
  { id: 'gold', title: 'Melhor\nresultado', emoji: '🥇' },
  { id: 'silver', title: 'Boa\ncolocação', emoji: '🥈' },
  { id: 'bronze', title: 'Top 3\nda galera', emoji: '🥉' },
];

const WEEK_DAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const WEEK_ACTIVITY = [false, false, false, false, false, false, false];

const MEDAL_EMOJIS = { 1: '🥇', 2: '🥈', 3: '🥉' };
const GAME_TYPE_META = {
  lurdinha: { label: 'Lurdinha', emoji: '🎯', color: '#8B5CF6' },
  draw: { label: 'Desenho', emoji: '✏️', color: '#10B981' },
  most_likely: { label: 'Mais Provável', emoji: '👀', color: '#3B82F6' },
  obvious_mind: { label: 'Na Minha Cabeça', emoji: '🧠', color: '#F59E0B' },
  secret: { label: 'Telefone Sem Fio', emoji: '📖', color: '#F43F5E' },
  telephone: { label: 'Telefone Sem Fio', emoji: '📖', color: '#F43F5E' },
  tier_list: { label: 'Tier List', emoji: '🏆', color: '#FF6B35' },
};

const getPlaceLabel = (position) => {
  if (position === 1) return '1o lugar';
  if (position === 2) return '2o lugar';
  if (position === 3) return '3o lugar';
  return `${position}o lugar`;
};

const getDateValue = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatRelativeTime = (value) => {
  const date = getDateValue(value);
  if (!date) return 'recentemente';

  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (hours < 1) return 'agora';
  if (hours < 24) return `${hours}h`;
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('pt-BR');
};

// ─── Reusable action row ──────────────────────────────────────
function ActionRow({ icon: Icon, title, subtitle, color, onPress, isDestructive, delay = 0 }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(20)}>
      <TouchableOpacity
        style={[styles.actionRow, isDestructive && styles.actionRowDestructive]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.actionLeft}>
          <View style={[styles.actionIconWrap, { backgroundColor: isDestructive ? 'rgba(239,68,68,0.1)' : `${color}15` }]}>
            <Icon size={20} color={isDestructive ? '#EF4444' : color} />
          </View>
          <View>
            <Text style={[styles.actionTitle, isDestructive && { color: '#EF4444' }]}>{title}</Text>
            {subtitle && <Text style={styles.actionSubtitle}>{subtitle}</Text>}
          </View>
        </View>
        <ChevronRight size={18} color="rgba(255,255,255,0.18)" />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { logout, currentUser } = useAuth();
  const { userData, loading, error, refreshUserData, updateUserPhoto } = useUserData();
  const [photoSaving, setPhotoSaving] = useState(false);
  const [recentGames, setRecentGames] = useState([]);
  const [recentRankings, setRecentRankings] = useState([]);

  useEffect(() => {
    const loadRecentGameHistory = async () => {
      if (!currentUser?.uid) {
        setRecentGames([]);
        setRecentRankings([]);
        return;
      }

      try {
        const historyQuery = query(
          collection(db, 'game_history'),
          where('participantIds', 'array-contains', currentUser.uid)
        );
        const historySnapshot = await getDocs(historyQuery);
        const matches = historySnapshot.docs
          .map((historyDoc) => ({ id: historyDoc.id, ...historyDoc.data() }))
          .sort((firstMatch, secondMatch) => {
            const firstTime = getDateValue(firstMatch.finishedAt)?.getTime() || 0;
            const secondTime = getDateValue(secondMatch.finishedAt)?.getTime() || 0;
            return secondTime - firstTime;
          });

        const mappedMatches = matches
          .map((match) => {
            const player = (match.players || []).find((entry) => entry.uid === currentUser.uid);
            if (!player) return null;

            const meta = GAME_TYPE_META[match.gameType] || { label: 'Jogo social', emoji: '🎮', color: '#8B5CF6' };
            const position = player.position || 0;
            const total = Array.isArray(match.players) ? match.players.length : 0;

            return {
              id: match.id,
              mode: meta.label,
              emoji: meta.emoji,
              color: meta.color,
              place: position,
              total,
              time: formatRelativeTime(match.finishedAt),
            };
          })
          .filter(Boolean);

        setRecentGames(mappedMatches.slice(0, 3));
        setRecentRankings(mappedMatches.slice(0, 3));
      } catch (historyError) {
        console.warn('[ProfileScreen] failed to load recent game history:', historyError);
        setRecentGames([]);
        setRecentRankings([]);
      }
    };

    loadRecentGameHistory();
  }, [currentUser?.uid]);

  const handleLogout = async () => {
    try { await logout(); }
    catch { Alert.alert('Erro', 'Falha ao fazer logout'); }
  };

  const pickProfilePhoto = async (source) => {
    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permissão necessária', source === 'camera' ? 'Precisamos acessar sua câmera.' : 'Precisamos acessar suas fotos.');
        return;
      }
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      setPhotoSaving(true);
      await updateUserPhoto(result.assets[0].uri);
      Alert.alert('Sucesso', 'Sua foto foi atualizada.');
    } catch (err) {
      console.error('Error updating photo:', err);
      Alert.alert('Erro', 'Não foi possível atualizar a foto.');
    } finally {
      setPhotoSaving(false);
    }
  };

  const showProfilePhotoOptions = () => {
    if (photoSaving) return;
    Alert.alert('Alterar foto', 'Escolha uma nova foto de perfil.', [
      { text: 'Tirar foto', onPress: () => pickProfilePhoto('camera') },
      { text: 'Galeria', onPress: () => pickProfilePhoto('gallery') },
      { text: 'Cancelar', style: 'cancel' },
    ], { cancelable: true });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <SkeletonAvatar size={96} />
        <SkeletonLoader width={180} height={24} style={{ marginTop: 18 }} />
      </View>
    );
  }
  if (error) return <NetworkRetry onRetry={refreshUserData} message="Não foi possível carregar seu perfil." />;

  const profileName = userData?.displayName || 'Usuário';
  const socialStats = userData?.stats?.socialGames || {};
  const matches = (socialStats?.lurdinhaPlayed || 0)
    + (socialStats?.drawPlayed || 0)
    + (socialStats?.secretPlayed || 0)
    + (socialStats?.mostLikelyPlayed || 0)
    + (socialStats?.obviousMindPlayed || 0)
    + (socialStats?.tierListPlayed || 0);
  const wins = (socialStats?.lurdinhaWins || 0)
    + (socialStats?.secretWins || 0)
    + (socialStats?.mostLikelyWins || 0)
    + (socialStats?.obviousMindWins || 0)
    + (socialStats?.tierListWins || 0);
  const crowns = userData?.stats?.titles || 0;
  const level = userData?.stats?.level || 1;
  const xp = userData?.stats?.xp || 0;
  const streakDays = userData?.stats?.streakDays || userData?.stats?.streak || 0;
  const xpNeeded = 1000;
  const xpPct = Math.min(Math.round((xp / xpNeeded) * 100), 100);

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Identidade</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation?.navigate?.('Settings')}>
          <SettingsIcon size={20} color="#D1D5DB" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── 1. Identity Hero ── */}
        <Animated.View entering={FadeInDown.delay(80).springify().damping(20)} style={styles.identityCard}>
          <LinearGradient
            colors={['#6D28D9', '#4C1D95', '#2E1065']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.identityTopRow}>
            {/* Avatar */}
            <TouchableOpacity onPress={showProfilePhotoOptions} activeOpacity={0.85} disabled={photoSaving} style={styles.avatarArea}>
              <LinearGradient colors={['#8B5CF6', '#D97706']} style={styles.avatarRing}>
                <View style={styles.avatarInner}>
                  {userData?.photoURL ? (
                    <Image source={{ uri: userData.photoURL }} style={styles.avatarImage} />
                  ) : (
                    <LinearGradient colors={['#2A1748', '#1E1030']} style={styles.avatarFallback}>
                      <Text style={styles.avatarFallbackText}>{profileName.charAt(0).toUpperCase()}</Text>
                    </LinearGradient>
                  )}
                </View>
              </LinearGradient>
              <View style={styles.cameraBtn}>
                {photoSaving ? <ActivityIndicator size="small" color="#FFF" /> : <Camera size={15} color="#FFF" />}
              </View>
            </TouchableOpacity>

            {/* Name + level */}
            <View style={styles.identityInfo}>
              <Text style={styles.identityName}>{profileName}</Text>
              <Text style={styles.identityTagline}>{userData?.tagline || 'Perfil da galera'}</Text>
              <Text style={styles.identityContext}>Histórico e conquistas aparecem conforme você joga.</Text>
              <View style={styles.levelPillOuter}>
                <LinearGradient colors={['#8B5CF6', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.levelPillGrad}>
                  <Zap size={10} color="#FFF" fill="#FFF" />
                  <Text style={styles.levelPillText}>Nível {level}</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* XP bar */}
          <View style={styles.xpSection}>
            <View style={styles.xpLabelRow}>
              <Text style={styles.xpLabel}>Nível {level}</Text>
              <Text style={styles.xpCenter}>{xp} / {xpNeeded} XP</Text>
              <Text style={styles.xpLabel}>Nível {level + 1}</Text>
            </View>
            <View style={styles.xpTrack}>
              <LinearGradient
                colors={['#8B5CF6', '#A78BFA']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.xpFill, { width: `${xpPct}%` }]}
              />
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{matches}</Text>
              <Text style={styles.statLabel}>Partidas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#A78BFA' }]}>{wins}</Text>
              <Text style={styles.statLabel}>Vitórias</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.statValue, { color: '#FCD34D' }]}>{crowns}</Text>
                <Text style={styles.statEmoji}>👑</Text>
              </View>
              <Text style={styles.statLabel}>Coroas</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── 2. Streak + Week Activity ── */}
        <Animated.View entering={FadeInDown.delay(160).springify().damping(20)} style={styles.streakCard}>
          <LinearGradient colors={['rgba(249,115,22,0.08)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.streakTop}>
            <View style={styles.streakLeft}>
              <View style={styles.streakFireWrap}>
                <LottieView source={require('../../assets/animations/fire-loop.json')} autoPlay loop style={{ width: 44, height: 44 }} />
              </View>
              <View>
                <Text style={styles.streakTitle}>{streakDays} dias seguidos</Text>
                <Text style={styles.streakSub}>
                  {streakDays > 0 ? 'Você está on fire 🔥' : 'Jogue para iniciar sua sequência'}
                </Text>
              </View>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>Sequência</Text>
            </View>
          </View>

          <View style={styles.weekRow}>
            {WEEK_DAYS.map((day, i) => (
              <View key={i} style={styles.weekCol}>
                <View style={[styles.weekDot, WEEK_ACTIVITY[i] && styles.weekDotActive]} />
                <Text style={[styles.weekDayLabel, WEEK_ACTIVITY[i] && styles.weekDayLabelActive]}>{day}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── 3. Conquistas ── */}
        <Animated.View entering={FadeInDown.delay(240).springify().damping(20)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Medalhas</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesRow}>
            {MEDAL_BADGES.map((badge) => (
              <TouchableOpacity key={badge.id} style={styles.badgeCard} activeOpacity={0.8}>
                <View style={styles.badgeEmojiWrap}>
                  <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                </View>
                <Text style={styles.badgeTitle}>{badge.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── 4. Últimas Partidas ── */}
        <Animated.View entering={FadeInDown.delay(300).springify().damping(20)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Últimas Partidas</Text>
          </View>
          <View style={styles.listCard}>
            {recentGames.length === 0 ? (
              <View style={styles.emptyListState}>
                <Text style={styles.emptyListEmoji}>🎮</Text>
                <Text style={styles.emptyListText}>Nenhuma partida registrada ainda.</Text>
              </View>
            ) : recentGames.map((game, i) => (
              <View key={game.id} style={[styles.listRow, i > 0 && styles.listRowBorder]}>
                <View style={[styles.listEmoji, { backgroundColor: `${game.color}18` }]}>
                  <Text style={styles.listEmojiText}>{game.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listPrimary}>{game.mode}</Text>
                  <Text style={styles.listSecondary}>{game.time} atrás</Text>
                </View>
                <View style={styles.placeResult}>
                  <Text style={styles.placeMedal}>{MEDAL_EMOJIS[game.place] || '🏅'}</Text>
                  <Text style={styles.placeResultText}>{getPlaceLabel(game.place)}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── 5. Últimos Rankings ── */}
        <Animated.View entering={FadeInDown.delay(360).springify().damping(20)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Últimos Rankings</Text>
          </View>
          <View style={styles.listCard}>
            {recentRankings.length === 0 ? (
              <View style={styles.emptyListState}>
                <Text style={styles.emptyListEmoji}>🏅</Text>
                <Text style={styles.emptyListText}>Nenhum ranking registrado ainda.</Text>
              </View>
            ) : recentRankings.map((r, i) => (
              <View key={r.id} style={[styles.listRow, i > 0 && styles.listRowBorder]}>
                <Text style={styles.medalEmoji}>{MEDAL_EMOJIS[r.place] || '🏅'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listPrimary}>{r.mode}</Text>
                  <Text style={styles.listSecondary}>{r.total} participantes • {r.time} atrás</Text>
                </View>
                <View style={styles.placeResult}>
                  <Text style={styles.placeResultText}>{getPlaceLabel(r.place)}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── 6. Account Actions ── */}
        <View style={styles.actionsContainer}>
          <ActionRow icon={SquarePen} title="Editar Perfil" subtitle="Nome, avatar, tagline" color="#C4B5FD" onPress={() => navigation?.navigate?.('EditProfile')} delay={420} />
          <ActionRow icon={History} title="Histórico e Rankings" subtitle="Estatísticas detalhadas" color="#FCD34D" onPress={() => navigation?.navigate?.('History')} delay={450} />
          <ActionRow icon={BellRing} title="Notificações" color="#6EE7B7" onPress={() => navigation?.navigate?.('Notifications')} delay={480} />
          <ActionRow icon={Power} title="Sair da Conta" color="#EF4444" isDestructive onPress={handleLogout} delay={510} />
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#08080C',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#08080C',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#111116',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 120 },

  // ── Identity Card
  identityCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.22)',
    backgroundColor: '#4C1D95',
    padding: 22,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 8,
  },
  identityTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
    marginBottom: 22,
  },
  avatarArea: { position: 'relative' },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
  },
  avatarInner: {
    flex: 1,
    backgroundColor: '#08080C',
    borderRadius: 47,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 47 },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 47,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: { color: '#FFF', fontSize: 36, fontWeight: '900' },
  cameraBtn: {
    position: 'absolute',
    right: -2,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1F2937',
    borderWidth: 2,
    borderColor: '#151821',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityInfo: { flex: 1, paddingTop: 3 },
  identityName: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  identityTagline: {
    color: '#E5E7EB',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    marginBottom: 5,
  },
  identityContext: {
    color: 'rgba(255,255,255,0.56)',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  levelPillOuter: { alignSelf: 'flex-start', borderRadius: 9, overflow: 'hidden' },
  levelPillGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  levelPillText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },

  // XP
  xpSection: { marginBottom: 16 },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  xpLabel: { fontSize: 9, color: '#7D7989', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  xpCenter: { fontSize: 11, color: '#A78BFA', fontWeight: '800' },
  xpTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  xpFill: { height: '100%', borderRadius: 99 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#FFF', fontSize: 22, fontWeight: '900', marginBottom: 2 },
  statEmoji: { fontSize: 15, marginLeft: 4, marginTop: 1 },
  statLabel: { color: '#7D7989', fontSize: 9, textTransform: 'uppercase', fontWeight: '800', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.07)' },

  // ── Streak Card
  streakCard: {
    backgroundColor: '#111116',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.15)',
    padding: 18,
    marginBottom: 28,
    overflow: 'hidden',
  },
  streakTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakFireWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(249,115,22,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginBottom: 1 },
  streakSub: { color: '#7D7989', fontSize: 12, fontWeight: '500' },
  streakBadge: {
    backgroundColor: 'rgba(249,115,22,0.12)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.2)',
  },
  streakBadgeText: { color: '#FB923C', fontSize: 11, fontWeight: '800' },

  // Week dots
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekCol: { alignItems: 'center', gap: 5 },
  weekDot: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  weekDotActive: { backgroundColor: 'rgba(139,92,246,0.35)', borderColor: 'rgba(139,92,246,0.5)' },
  weekDayLabel: { fontSize: 9, color: '#7D7989', fontWeight: '700', textTransform: 'uppercase' },
  weekDayLabelActive: { color: '#A78BFA' },

  // ── Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  sectionAction: { color: '#8B5CF6', fontSize: 13, fontWeight: '800' },

  // ── Badges
  badgesRow: { paddingBottom: 28, gap: 10 },
  badgeCard: {
    width: 100,
    height: 128,
    backgroundColor: '#111116',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  badgeEmojiWrap: {
    width: 58,
    height: 58,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  badgeEmoji: { fontSize: 36 },
  badgeTitle: { color: '#B8B5C4', fontSize: 10, fontWeight: '800', textAlign: 'center', lineHeight: 13 },

  // ── Shared list card (games + rankings)
  listCard: {
    backgroundColor: '#111116',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    marginBottom: 28,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  listRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  listEmoji: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listEmojiText: { fontSize: 20 },
  listPrimary: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  listSecondary: { color: '#7D7989', fontSize: 11 },
  emptyListState: {
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  emptyListEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyListText: {
    color: '#7D7989',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Results + Ranking
  placeResult: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 76,
  },
  placeMedal: { fontSize: 24, marginBottom: 1 },
  placeResultText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '800',
  },
  medalEmoji: { fontSize: 26, width: 34, textAlign: 'center' },

  // ── Actions
  actionsContainer: {
    backgroundColor: '#111116',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
    marginBottom: 32,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  actionRowDestructive: { borderBottomWidth: 0 },
  actionLeft: { flexDirection: 'row', alignItems: 'center' },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionTitle: {
    color: '#F3F4F6',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  actionSubtitle: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 11,
    marginTop: 1,
    fontWeight: '500',
  },
});
