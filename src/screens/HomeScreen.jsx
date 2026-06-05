import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Gamepad2, Hash, Radio, Target, Trophy, Users } from 'lucide-react-native';
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';
import { useGroups } from '../hooks/useGroups';
import { useGame } from '../hooks/useGame';
import UsernameSetupModal from '../components/UsernameSetupModal';
import NetworkRetry from '../components/NetworkRetry';
import { fontStyles } from '../theme';
import HeroSection from '../components/home/HeroSection';
import AdminNotificationBanner from '../components/home/AdminNotificationBanner';
import { LiveRoomCard, PendingQuizCard, RankingUpdateCard, QuizResultCard } from '../components/home/FeedCards';
import { INTERNAL_TEST_FEATURES_ENABLED } from '../utils/internalFeatures';
import JoinRoomModal from '../components/JoinRoomModal';
import HeroBannerCards from '../components/home/HeroBannerCards';

const DISMISSED_HOME_RESULTS_KEY = '@lurdinha:dismissed_home_results';
const LIVE_ROOM_WAITING_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const LIVE_ROOM_PLAYING_MAX_AGE_MS = 6 * 60 * 60 * 1000;

const getQuizResultDismissKey = (data = {}) => {
  const endTime = data.endTime?.toDate ? data.endTime.toDate().getTime() : data.endTime || data.updatedAt || '';
  return data.id || data.quizGroupId || `${data.groupId || 'group'}-${data.title || 'resultado'}-${endTime}`;
};

const getDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isRecentlyLiveRoom = (room) => {
  if (!['waiting', 'playing'].includes(room?.status)) return false;
  const players = Array.isArray(room.players) ? room.players : [];
  if (players.length === 0) return false;
  const createdAt = getDate(room.createdAt);
  if (!createdAt) return false;
  const age = Date.now() - createdAt.getTime();
  const maxAge = room.status === 'waiting' ? LIVE_ROOM_WAITING_MAX_AGE_MS : LIVE_ROOM_PLAYING_MAX_AGE_MS;
  return age >= 0 && age <= maxAge;
};

// ─── Game modes list ──────────────────────────────────────────
const GAME_MODES = [
  { emoji: '😈', label: 'Lurdinha', gameType: 'lurdinha', color: '#8B5CF6' },
  { emoji: '👀', label: 'Mais Provável', gameType: 'most_likely', color: '#3B82F6' },
  { emoji: '🏆', label: 'Tier List', gameType: 'tier_list', color: '#FF6B35' },
  { emoji: '🕵️', label: 'Impostor', gameType: 'impostor', color: '#EC4899' },
  { emoji: '✏️', label: 'Desenho', gameType: 'draw', color: '#10B981' },
  { emoji: '🧠', label: 'Óbvio', gameType: 'obvious_mind', color: '#F59E0B' },
  { emoji: '📖', label: 'Telefone', gameType: 'telephone', color: '#F43F5E' },
];

// ─── Skeleton ────────────────────────────────────────────────
const SkeletonFeedBlock = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);
  return (
    <Animated.View style={{ opacity, marginBottom: 16 }}>
      <View style={styles.skeletonCard} />
    </Animated.View>
  );
};

// ─── Now Dashboard (hero carousel) ───────────────────────────
const getNowCopy = (event, summary) => {
  if (!event) {
    if (summary.groupCount === 0) {
      return {
        eyebrow: 'Pódio do Grupo',
        title: 'Quem vai dominar o pódio?',
        subtitle: 'Crie um grupo com seus amigos para acumular pontos, responder palpites e disputar o primeiro lugar!',
        cta: 'Criar grupo',
        icon: Trophy,
      };
    }
    return {
      eyebrow: 'Agora',
      title: 'Crie uma rodada para movimentar a galera',
      subtitle: 'Abra uma sala ou crie um palpite para o grupo responder.',
      cta: 'Jogar agora',
      icon: Gamepad2,
    };
  }
  if (event.type === 'pending_quiz') {
    return {
      eyebrow: 'Palpite em aberto',
      title: event.data?.question || event.data?.quizGroupTitle || 'Tem palpite esperando você',
      subtitle: `${event.data?.groupName || 'Seu grupo'} • resultado em ${event.data?.timeLeft || 'breve'}`,
      cta: 'Responder agora',
      icon: Target,
    };
  }
  if (event.type === 'live_room') {
    const players = event.data?.playerCount || 0;
    return {
      eyebrow: 'Sala ao vivo',
      title: players > 0 ? `${players} pessoa${players > 1 ? 's' : ''} jogando agora` : 'Sala aberta esperando a galera',
      subtitle: 'Entre antes que a rodada avance.',
      cta: event.data?.isOpen ? 'Entrar na sala' : 'Ver sala',
      icon: Radio,
    };
  }
  if (event.type === 'ranking_update') {
    return {
      eyebrow: 'Ranking novo',
      title: 'O pódio mudou',
      subtitle: `${event.data?.groupName || 'Seu grupo'} • você está em #${event.data?.userPosition || '?'}. Abra o grupo para ver a classificação completa!`,
      cta: 'Abrir grupo',
      icon: Trophy,
    };
  }
  if (event.type === 'quiz_result') {
    return {
      eyebrow: 'Resultado revelado',
      title: event.data?.title || 'Veja como a galera respondeu',
      subtitle: event.data?.groupName || 'Disputa encerrada recentemente',
      cta: 'Ver resultado',
      icon: Trophy,
    };
  }
  return {
    eyebrow: 'Agora',
    title: 'Pronto para jogar?',
    subtitle: 'Escolha uma sala, palpite ou grupo para começar.',
    cta: 'Jogar agora',
    icon: Gamepad2,
  };
};

function NowDashboard({ mainEvent, summary, onMainPress }) {
  const nowCopy = getNowCopy(mainEvent, summary);
  const Icon = nowCopy.icon;
  const isResultEvent = mainEvent?.type === 'quiz_result';
  const isLiveEvent = mainEvent?.type === 'live_room';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onMainPress}
      style={styles.promoHeroCard}
    >
      <LinearGradient
        colors={isLiveEvent ? ['#1A0A3E', '#3B1285', '#7C3AED'] : ['#1A0A3E', '#2D1B69', '#6D28D9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(139,92,246,0.18)', 'rgba(109,40,217,0.06)', 'rgba(0,0,0,0.08)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.promoHeroBloom} />

      <View style={styles.promoHeroCopy}>
        <View style={styles.promoHeroBadge}>
          <Icon size={14} color="#C4B5FD" />
          <Text style={styles.promoHeroBadgeText}>{nowCopy.eyebrow}</Text>
        </View>
        <Text style={[styles.promoHeroTitle, isResultEvent && styles.promoHeroTitleCompact]} numberOfLines={3}>
          {nowCopy.title}
        </Text>
        <Text style={styles.promoHeroSubtitle} numberOfLines={2}>
          {nowCopy.subtitle}
        </Text>
        <View style={styles.promoHeroCta}>
          <Text style={styles.promoHeroCtaText}>{nowCopy.cta}</Text>
          <ArrowRight size={17} color="#3B1285" />
        </View>
      </View>

      <View pointerEvents="none" style={styles.promoHeroStage}>
        <View style={styles.promoPhoneShadow} />
        <View style={styles.promoPhoneCard}>
          <LinearGradient
            colors={['#FFFFFF', '#F4ECFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.promoPhoneHeader} />
          <View style={styles.promoMiniLine} />
          <View style={styles.promoMiniLineShort} />
          <View style={styles.promoScorePill}>
            <Text style={styles.promoScoreText}>
              {isLiveEvent ? summary.liveRoomCount : isResultEvent ? '🏆' : summary.pendingQuizCount || summary.rankingCount || 0}
            </Text>
          </View>
        </View>
        <View style={styles.promoCrownObject}>
          <Text style={styles.promoCrownEmoji}>{isLiveEvent ? '🔥' : '👑'}</Text>
        </View>
        <View style={styles.promoBubbleObject}>
          <Text style={styles.promoBubbleText}>!</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Hero Action Zone ─────────────────────────────────────────
function HeroActionZone({ navigation, groupCount, onJoinWithCode }) {
  return (
    <View style={styles.heroZone}>
      {/* Primary CTA: Entrar com código */}
      <TouchableOpacity
        style={styles.heroCreateCard}
        onPress={onJoinWithCode}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={['#6D28D9', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={styles.heroGlow} />
        <View style={styles.heroCreateBody}>
          <View style={styles.heroIconWrap}>
            <Hash size={26} color="#FFF" />
          </View>
          <View style={styles.heroCreateCopy}>
            <Text style={styles.heroCreateTitle}>Entrar com código</Text>
            <Text style={styles.heroCreateSub}>Use o convite da sala</Text>
          </View>
        </View>
        <View style={styles.heroCreateCta}>
          <Text style={styles.heroCreateCtaText}>Entrar</Text>
          <ArrowRight size={15} color="#FFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Active Now Card ──────────────────────────────────────────
function ActiveNowCard({ event, onPress }) {
  const isLive = event.type === 'live_room';
  const color = isLive ? '#EF4444' : '#FF6B35';
  const Icon = isLive ? Radio : Target;
  const badge = isLive ? 'AO VIVO' : 'AGUARDANDO';
  const title = isLive
    ? (event.data?.playerCount > 0 ? `${event.data.playerCount} jogando agora` : 'Sala aberta')
    : (event.data?.question || event.data?.quizGroupTitle || 'Palpite em aberto');
  const sub = isLive
    ? `${event.data?.gameType || 'lurdinha'} · entre antes que avance`
    : `${event.data?.groupName || 'Seu grupo'} · ${event.data?.timeLeft || 'vence em breve'}`;
  const ctaLabel = isLive ? 'Entrar' : 'Responder';

  return (
    <TouchableOpacity
      style={[styles.activeNowCard, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={[styles.activeNowIconWrap, { backgroundColor: `${color}18` }]}>
        <Icon size={18} color={color} />
      </View>
      <View style={styles.activeNowCopy}>
        <View style={[styles.activeNowBadge, { backgroundColor: `${color}22` }]}>
          <Text style={[styles.activeNowBadgeText, { color }]}>{badge}</Text>
        </View>
        <Text style={styles.activeNowTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.activeNowSub} numberOfLines={1}>{sub}</Text>
      </View>
      <View style={[styles.activeNowCtaBtn, { backgroundColor: color }]}>
        <Text style={styles.activeNowCtaText}>{ctaLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Game Modes Scroll ────────────────────────────────────────
function GameModesScroll({ navigation }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.gameModesRow}
    >
      {GAME_MODES.map((mode) => (
        <TouchableOpacity
          key={mode.gameType}
          style={[styles.gameModeCard, { borderColor: `${mode.color}28` }]}
          onPress={() => navigation.navigate('CreateRoom', { gameType: mode.gameType })}
          activeOpacity={0.8}
        >
          <View style={[styles.gameModeEmojiWrap, { backgroundColor: `${mode.color}18` }]}>
            <Text style={styles.gameModeEmoji}>{mode.emoji}</Text>
          </View>
          <Text style={styles.gameModeLabel} numberOfLines={2}>{mode.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Screen ───────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { currentUser } = useAuth();
  const { userData, refreshUserData } = useUserData();
  const { getUserGroups, getGroupQuizGroups, getQuizGroupDetails, acceptJoinRequest, rejectJoinRequest } = useGroups();
  useGame();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [feedEvents, setFeedEvents] = useState([]);
  const [dismissedResultIds, setDismissedResultIds] = useState([]);
  const [homeSummary, setHomeSummary] = useState({
    groupCount: 0,
    liveRoomCount: 0,
    pendingQuizCount: 0,
    rankingCount: 0,
    latestGroupName: null,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    loadHomeData();
  }, [userData?.groups, dismissedResultIds.join('|')]);

  useEffect(() => {
    const loadDismissedResults = async () => {
      try {
        const raw = await AsyncStorage.getItem(DISMISSED_HOME_RESULTS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setDismissedResultIds(parsed);
        }
      } catch (err) {
        console.warn('Erro ao carregar resultados dispensados da Home:', err);
      }
    };
    loadDismissedResults();
  }, []);

  const animateEntrance = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.97);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  };

  const processAdminNotifications = async (groups) => {
    if (!currentUser) return;
    const adminGroups = groups.filter(g => g.admins && g.admins.includes(currentUser.uid));
    if (adminGroups.length === 0) { setAdminNotifications([]); return; }

    const notifications = [];
    for (const group of adminGroups) {
      if (group.pendingRequests && group.pendingRequests.length > 0) {
        const userIds = group.pendingRequests.filter(req => typeof req === 'string');
        if (userIds.length > 0) {
          const userPromises = userIds.map(uid => getDoc(doc(db, 'users', uid)));
          const userDocs = await Promise.all(userPromises);
          userDocs.forEach(docSnap => {
            if (docSnap.exists()) {
              const uData = docSnap.data();
              notifications.push({
                type: 'join_request',
                id: `${group.id}_${docSnap.id}`,
                groupId: group.id,
                groupName: group.name,
                groupColor: group.color || '#8b5cf6',
                userId: docSnap.id,
                userName: uData.username || uData.displayName || 'Usuário',
                userPhoto: uData.photoURL,
                timestamp: new Date(),
              });
            }
          });
        }
      }
    }
    setAdminNotifications(notifications);
  };

  const loadHomeData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(false);

      const userGroups = await getUserGroups();
      let events = [];
      let liveRoomCount = 0;
      let pendingQuizCount = 0;
      let rankingCount = 0;
      let latestGroupName = userGroups[0]?.name || null;

      const socialContacts = new Set();
      if (currentUser) socialContacts.add(currentUser.uid);
      userGroups.forEach(g => {
        if (Array.isArray(g.members)) g.members.forEach(m => socialContacts.add(m));
      });

      // 1. Live Rooms
      const roomsQuery = query(collection(db, 'game_rooms'), orderBy('createdAt', 'desc'), limit(30));
      const roomSnapshot = await getDocs(roomsQuery);
      const seenRooms = new Set();

      roomSnapshot.docs
        .map(roomDoc => {
          const room = roomDoc.data();
          if (!isRecentlyLiveRoom(room)) return null;
          const roomId = room.roomId || roomDoc.id;
          if (seenRooms.has(roomId)) return null;
          seenRooms.add(roomId);
          const players = Array.isArray(room.players) ? room.players : [];
          const hasSocialContact = players.some(p => socialContacts.has(p.uid || p.id));
          if (!hasSocialContact) return null;
          const createdAt = getDate(room.createdAt);
          return { roomId, status: room.status, gameType: room.settings?.gameType || 'lurdinha', createdAt, playerCount: players.length, players, isOpen: room.status === 'waiting' };
        })
        .filter(Boolean)
        .forEach(room => {
          liveRoomCount += 1;
          events.push({ type: 'live_room', data: room, timestamp: room.createdAt.getTime() + 10000000 });
        });

      // 2. Quizzes e Rankings
      if (userGroups.length > 0) {
        await processAdminNotifications(userGroups);

        const allQuizGroups = [];
        const allCompletedQuizGroups = [];

        const quizGroupsResults = await Promise.all(userGroups.map(g => getGroupQuizGroups(g.id)));
        quizGroupsResults.forEach((quizGroups, index) => {
          const group = userGroups[index];
          const mapF = qg => ({ ...qg, groupName: group.name, groupId: group.id, groupColor: group.color, groupBadge: group.badge });
          allQuizGroups.push(...quizGroups.filter(qg => qg.isActive && qg.status === 'active').map(mapF));
          allCompletedQuizGroups.push(...quizGroups.filter(qg => !qg.isActive || qg.status === 'completed').map(mapF));
        });

        const quizGroupsDetails = await Promise.all(
          allQuizGroups.slice(0, 5).map(async qg => {
            try {
              const details = await getQuizGroupDetails(qg.id);
              if (!details?.quizzesData?.length) return null;
              const quizzesWithStatus = details.quizzesData.map(quiz => ({
                ...quiz,
                needsAnswer: quiz.votes && quiz.votes[currentUser?.uid] === undefined && details.status === 'active',
              }));
              return { ...qg, quizzes: quizzesWithStatus, hasAction: quizzesWithStatus.some(q => q.needsAnswer) };
            } catch { return null; }
          })
        );
        pendingQuizCount = quizGroupsDetails.filter(qg => qg?.hasAction).length;

        for (const qg of quizGroupsDetails) {
          if (qg?.quizzes) {
            const unanswered = qg.quizzes.find(q => q.needsAnswer);
            if (unanswered) {
              const endTime = qg.endTime?.toDate ? qg.endTime.toDate() : new Date(qg.endTime);
              const now = new Date();
              const hoursLeft = Math.ceil((endTime - now) / (1000 * 60 * 60));
              const minutesLeft = Math.ceil((endTime - now) / (1000 * 60)) % 60;
              const timeLeft = hoursLeft > 24 ? `${Math.floor(hoursLeft / 24)}d` : hoursLeft > 0 ? `${hoursLeft}h` : minutesLeft > 0 ? `${minutesLeft}m` : 'Expirado';
              events.push({ type: 'pending_quiz', data: { ...unanswered, quizGroupId: qg.id, groupId: qg.groupId, quizGroupTitle: qg.title, groupName: qg.groupName, timeLeft }, timestamp: Date.now() + 5000000 });
              break;
            }
          }
        }

        const withRanking = [...allQuizGroups, ...allCompletedQuizGroups]
          .filter(qg => qg.ranking?.length > 0)
          .sort((a, b) => {
            const aT = a.endTime?.toDate ? a.endTime.toDate() : new Date(a.createdAt || 0);
            const bT = b.endTime?.toDate ? b.endTime.toDate() : new Date(b.createdAt || 0);
            return bT - aT;
          });

        if (withRanking.length > 0) {
          rankingCount = withRanking.length;
          const latest = withRanking[0];
          latestGroupName = latest.groupName || latestGroupName;
          const sorted = [...latest.ranking].sort((a, b) => b.correct - a.correct);
          const rank = sorted.findIndex(r => r.userId === currentUser?.uid);
          if (rank >= 0) {
            events.push({
              type: 'ranking_update',
              data: {
                groupId: latest.groupId,
                groupName: latest.groupName,
                quizGroupTitle: latest.title,
                userPosition: rank + 1,
                top3: sorted.slice(0, 3)
              },
              timestamp: latest.endTime?.toDate ? latest.endTime.toDate().getTime() : Date.now() - 10000
            });
          }
        }

        if (allCompletedQuizGroups.length > 0) {
          const latestCompleted = allCompletedQuizGroups.sort((a, b) => {
            const aT = a.endTime?.toDate ? a.endTime.toDate() : new Date(0);
            const bT = b.endTime?.toDate ? b.endTime.toDate() : new Date(0);
            return bT - aT;
          })[0];
          const dismissKey = getQuizResultDismissKey(latestCompleted);
          if (!dismissedResultIds.includes(dismissKey)) {
            events.push({ type: 'quiz_result', data: { ...latestCompleted, dismissKey }, timestamp: (latestCompleted.endTime?.toDate ? latestCompleted.endTime.toDate().getTime() : Date.now()) - 5000 });
          }
        }
      }

      events.sort((a, b) => b.timestamp - a.timestamp);
      setFeedEvents(events);
      setHomeSummary({ groupCount: userGroups.length, liveRoomCount, pendingQuizCount, rankingCount, latestGroupName });
    } catch (err) {
      console.error('Error loading home data:', err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (!isRefresh) animateEntrance();
    }
  };

  const handleRefresh = () => { setRefreshing(true); loadHomeData(true); };

  const handlePendingQuizPress = (data) => {
    navigation.navigate('QuizGroupDetail', { quizGroupId: data.quizGroupId, groupId: data.groupId, groupName: data.groupName });
  };

  const handleJoinLiveRoom = async (data) => {
    if (!data?.roomId) return;
    if (data.isOpen) { navigation.navigate('Lobby', { roomId: data.roomId }); return; }
    navigation.navigate('GameHome');
  };

  const handleViewRanking = (eventData) => {
    if (eventData?.groupId) {
      navigation.navigate('GroupDetail', { groupId: eventData.groupId });
    } else {
      navigation.navigate('SelectGroupRanking');
    }
  };

  const dismissQuizResultFromHome = async (data) => {
    const dismissKey = data?.dismissKey || getQuizResultDismissKey(data);
    if (!dismissKey) return;
    const nextDismissed = Array.from(new Set([...dismissedResultIds, dismissKey]));
    setDismissedResultIds(nextDismissed);
    setFeedEvents((current) => current.filter((event) => (
      event.type !== 'quiz_result' || (event.data?.dismissKey || getQuizResultDismissKey(event.data)) !== dismissKey
    )));
    try {
      await AsyncStorage.setItem(DISMISSED_HOME_RESULTS_KEY, JSON.stringify(nextDismissed.slice(-80)));
    } catch (err) {
      console.warn('Erro ao salvar resultado dispensado da Home:', err);
    }
  };

  const handleViewQuizResult = async (data) => {
    await dismissQuizResultFromHome(data);
    navigation.navigate('QuizGroupDetail', { quizGroupId: data.id, groupName: data.groupName });
  };

  const getEventHandler = (event) => {
    switch (event.type) {
      case 'live_room': return () => handleJoinLiveRoom(event.data);
      case 'pending_quiz': return () => handlePendingQuizPress(event.data);
      case 'quiz_result': return () => handleViewQuizResult(event.data);
      case 'ranking_update': return () => handleViewRanking(event.data);
      default: return () => {};
    }
  };

  // ─── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingPad}>
          <View style={styles.skeletonHeader} />
          <View style={styles.skeletonHero} />
          <View style={styles.skeletonStreak} />
          {[1, 2].map(i => <SkeletonFeedBlock key={i} />)}
        </View>
      </View>
    );
  }

  if (error) {
    return <NetworkRetry onRetry={() => loadHomeData()} message="Não foi possível carregar as atividades." />;
  }

  // Urgentes: salas ao vivo + quizzes pendentes (aparecem no "Agora nos grupos")
  const activeNowEvents = feedEvents.filter(e => e.type === 'live_room' || e.type === 'pending_quiz');
  // Feed informativo: ranking + resultados
  const activityEvents = feedEvents.filter(e => e.type === 'ranking_update' || e.type === 'quiz_result');

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#A855F7" colors={['#A855F7']} />
      }
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

        {/* ── 1. Header */}
        <HeroSection
          userData={userData}
          navigation={navigation}
          notificationCount={activeNowEvents.length + activityEvents.length}
        />

        {/* ── 2. Admin Notifications */}
        <AdminNotificationBanner
          adminNotifications={adminNotifications}
          handleAcceptRequest={(n) => { acceptJoinRequest(n.groupId, n.userId); setAdminNotifications(p => p.filter(x => x.id !== n.id)); }}
          handleRejectRequest={(n) => { rejectJoinRequest(n.groupId, n.userId); setAdminNotifications(p => p.filter(x => x.id !== n.id)); }}
        />

        {/* ── 3. Hero Banner Carousel */}
        <HeroBannerCards style={{ marginBottom: 24 }} />

        {/* ── 4. Now Dashboard — hero carousel */}
        <View style={styles.section}>
          <NowDashboard
            mainEvent={feedEvents[0] ?? null}
            summary={homeSummary}
            onMainPress={feedEvents[0] ? getEventHandler(feedEvents[0]) : () => navigation.navigate(homeSummary.groupCount > 0 ? 'GameHome' : 'CreateGroup')}
          />
        </View>

        {/* ── 5. Hero Action Zone */}
        <View style={styles.section}>
          <HeroActionZone
            navigation={navigation}
            groupCount={homeSummary.groupCount}
            onJoinWithCode={() => setJoinModalVisible(true)}
          />
        </View>

        {/* ── 5. Agora nos grupos (condicional) */}
        {activeNowEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionLiveDot} />
              <Text style={styles.sectionTitle}>AGORA NOS GRUPOS</Text>
            </View>
            {activeNowEvents.slice(0, 2).map((event, i) => (
              <ActiveNowCard
                key={`${event.timestamp}-${event.type}-${i}`}
                event={event}
                onPress={getEventHandler(event)}
              />
            ))}
            {activeNowEvents.length > 2 && (
              <TouchableOpacity style={styles.seeMoreBtn} onPress={() => navigation.navigate('groups')} activeOpacity={0.7}>
                <Text style={styles.seeMoreText}>+{activeNowEvents.length - 2} outros acontecimentos</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── 6. Modos de jogo */}
        <View style={[styles.section, styles.sectionNoPad]}>
          <View style={[styles.sectionHeader, styles.sectionHeaderPad]}>
            <Text style={styles.sectionTitle}>MODOS DE JOGO</Text>
          </View>
          <GameModesScroll navigation={navigation} />
        </View>

        {/* ── 7. Feed de atividades */}
        {(activityEvents.length > 0 || feedEvents.length === 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>O QUE ACONTECEU</Text>
              {activityEvents.length > 0 && (
                <View style={styles.feedCountPill}>
                  <Text style={styles.feedCountText}>{activityEvents.length}</Text>
                </View>
              )}
            </View>

            {feedEvents.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconGlow}>
                  <Users size={38} color="#D8B4FE" />
                </View>
                <Text style={styles.emptyTitle}>Nada rolando agora</Text>
                <Text style={styles.emptySubtext}>Crie uma sala ou palpite para dar assunto para a galera.</Text>
                <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('groups')} activeOpacity={0.85}>
                  <Text style={styles.emptyButtonText}>Convidar Galera</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.activityList}>
                {activityEvents.map((event, index) => {
                  const key = `${event.timestamp}-${event.type}-${index}`;
                  const onPress = getEventHandler(event);
                  switch (event.type) {
                    case 'live_room': return <LiveRoomCard key={key} event={event} index={index} onPress={onPress} />;
                    case 'pending_quiz': return <PendingQuizCard key={key} event={event} index={index} onPress={onPress} />;
                    case 'quiz_result': return <QuizResultCard key={key} event={event} index={index} onPress={onPress} />;
                    case 'ranking_update': return <RankingUpdateCard key={key} event={event} index={index} onPress={onPress} />;
                    default: return null;
                  }
                })}
              </View>
            )}
          </View>
        )}

        {INTERNAL_TEST_FEATURES_ENABLED && (
          <View style={styles.devTeasers}>
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => navigation.navigate('SocialGameSandbox')}
              style={styles.newHomeTeaser}
            >
              <LinearGradient
                colors={['rgba(59,130,246,0.18)', 'rgba(56,189,248,0.08)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.newHomeTeaserGrad}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.newHomeTeaserBadge}>
                    <Text style={styles.newHomeTeaserBadgeText}>TESTE</Text>
                  </View>
                  <Text style={styles.newHomeTeaserTitle}>Sandbox social</Text>
                  <Text style={styles.newHomeTeaserSub}>Abra telas dos jogos com jogadores falsos</Text>
                </View>
                <ArrowRight size={18} color="#93C5FD" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => navigation.navigate('NewHome')}
              style={styles.newHomeTeaser}
            >
              <LinearGradient
                colors={['rgba(124,58,237,0.18)', 'rgba(139,92,246,0.08)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.newHomeTeaserGrad}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.newHomeTeaserBadge}>
                    <Text style={styles.newHomeTeaserBadgeText}>TESTE</Text>
                  </View>
                  <Text style={styles.newHomeTeaserTitle}>Nova Home</Text>
                  <Text style={styles.newHomeTeaserSub}>Design experimental — toque para ver</Text>
                </View>
                <ArrowRight size={18} color="#A78BFA" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

      </Animated.View>

      <UsernameSetupModal
        visible={!!userData && !userData.username}
        onSuccess={refreshUserData}
      />

      <JoinRoomModal
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
        navigation={navigation}
      />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080C',
  },
  content: {
    paddingBottom: 120,
  },

  // ── Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionNoPad: {
    paddingHorizontal: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeaderPad: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    flex: 1,
    color: 'rgba(255,255,255,0.38)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  sectionLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },

  // ── Now Dashboard (promo hero card)
  promoHeroCard: {
    minHeight: 200,
    borderRadius: 34,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.38,
    shadowRadius: 26,
    elevation: 12,
  },
  promoHeroBloom: {
    position: 'absolute',
    left: -40, right: -36, bottom: -30,
    height: 100,
    backgroundColor: 'rgba(139,92,246,0.18)',
    transform: [{ rotate: '-8deg' }],
  },
  promoHeroCopy: {
    width: '66%',
    minHeight: 163,
    justifyContent: 'space-between',
    zIndex: 4,
  },
  promoHeroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.30)',
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  promoHeroBadgeText: { color: '#C4B5FD', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  promoHeroTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    lineHeight: 29,
    ...fontStyles.headingBold,
    marginTop: 14,
    marginBottom: 8,
  },
  promoHeroTitleCompact: { fontSize: 22, lineHeight: 26 },
  promoHeroSubtitle: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 13,
    lineHeight: 18,
    ...fontStyles.medium,
    marginBottom: 16,
  },
  promoHeroCta: {
    alignSelf: 'flex-start',
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 4,
  },
  promoHeroCtaText: { color: '#3B1285', fontSize: 13, fontWeight: '900' },
  promoHeroStage: {
    position: 'absolute',
    right: 0, top: 22, bottom: 14,
    width: '42%',
    zIndex: 3,
  },
  promoPhoneShadow: {
    position: 'absolute',
    right: 2, bottom: 18,
    width: 112, height: 30,
    borderRadius: 999,
    backgroundColor: 'rgba(42,23,78,0.20)',
    transform: [{ rotate: '-8deg' }],
  },
  promoPhoneCard: {
    position: 'absolute',
    right: 14, top: 42,
    width: 110, height: 148,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    overflow: 'hidden',
    padding: 12,
    transform: [{ rotate: '-10deg' }],
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  promoPhoneHeader: { width: 38, height: 6, borderRadius: 999, backgroundColor: 'rgba(76,29,149,0.20)', marginBottom: 18 },
  promoMiniLine: { width: '100%', height: 9, borderRadius: 999, backgroundColor: 'rgba(76,29,149,0.16)', marginBottom: 9 },
  promoMiniLineShort: { width: '68%', height: 9, borderRadius: 999, backgroundColor: 'rgba(76,29,149,0.12)', marginBottom: 15 },
  promoScorePill: { height: 48, borderRadius: 18, backgroundColor: '#2A174E', alignItems: 'center', justifyContent: 'center' },
  promoScoreText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  promoCrownObject: {
    position: 'absolute',
    right: 76, top: 10,
    width: 64, height: 64,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.74)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '14deg' }],
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 7,
  },
  promoCrownEmoji: { fontSize: 34 },
  promoBubbleObject: {
    position: 'absolute',
    right: 8, top: 6,
    width: 34, height: 34,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-11deg' }],
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },
  promoBubbleText: { color: '#FF6B35', fontSize: 20, fontWeight: '900' },

  // ── Hero Action Zone
  heroZone: { gap: 10 },
  heroCreateCard: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 20,
    minHeight: 110,
    justifyContent: 'space-between',
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 12,
  },
  heroGlow: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(196,181,253,0.14)',
  },
  heroCreateBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCreateCopy: { flex: 1 },
  heroCreateTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  heroCreateSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontWeight: '500',
  },
  heroCreateCta: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  heroCreateCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  heroSecondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroSecondaryCard: {
    flex: 1,
    minHeight: 154,
    backgroundColor: '#2E1065',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.26)',
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
  },
  heroSecondaryGlow: {
    position: 'absolute',
    top: -38,
    right: -38,
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(221,214,254,0.18)',
  },
  heroSecondaryIconStage: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(245,243,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#C4B5FD',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
  },
  heroSecondaryIconHalo: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.20)',
  },
  heroOrbitGlyph: {
    position: 'absolute',
    color: '#DDD6FE',
    fontSize: 19,
    fontWeight: '900',
    opacity: 0.72,
  },
  heroOrbitGlyphTopLeft: {
    top: 18,
    left: 18,
    transform: [{ rotate: '-12deg' }],
  },
  heroOrbitGlyphTopRight: {
    top: 22,
    right: 20,
    transform: [{ rotate: '14deg' }],
  },
  heroOrbitGlyphBottomLeft: {
    left: 20,
    bottom: 54,
    fontSize: 17,
    opacity: 0.58,
  },
  heroSecondaryTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroSecondarySub: {
    color: 'rgba(245,243,255,0.68)',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  // ── Active Now Cards
  activeNowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111116',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderLeftWidth: 3,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  activeNowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNowCopy: { flex: 1, gap: 2 },
  activeNowBadge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 2,
  },
  activeNowBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  activeNowTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  activeNowSub: {
    color: '#7D7989',
    fontSize: 11,
    fontWeight: '500',
  },
  activeNowCtaBtn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeNowCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  seeMoreBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  seeMoreText: {
    color: '#8B5CF6',
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Game Modes Scroll
  gameModesRow: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    gap: 10,
  },
  gameModeCard: {
    width: 80,
    backgroundColor: '#111116',
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 8,
  },
  gameModeEmojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameModeEmoji: { fontSize: 24 },
  gameModeLabel: {
    color: '#B8B5C4',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 13,
  },

  // ── Feed
  feedCountPill: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(168,85,247,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  feedCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  activityList: { gap: 0 },

  // ── Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#111116',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyIconGlow: {
    width: 72,
    height: 72,
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.22)',
  },
  emptyTitle: {
    fontSize: 18,
    ...fontStyles.headingBold,
    color: '#F3F4F6',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#7D7989',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: '78%',
    lineHeight: 19,
  },
  emptyButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    ...fontStyles.bold,
  },

  devTeasers: {
    gap: 12,
  },

  // ── Nova Home Teaser (internal test)
  newHomeTeaser: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  newHomeTeaserGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  newHomeTeaserBadge: {
    backgroundColor: 'rgba(139,92,246,0.3)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  newHomeTeaserBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#A78BFA',
    letterSpacing: 1,
  },
  newHomeTeaserTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  newHomeTeaserSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 1,
  },

  // ── Loading skeletons
  loadingPad: {
    paddingHorizontal: 20,
    paddingTop: 64,
    gap: 14,
  },
  skeletonHeader: {
    height: 72,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  skeletonHero: {
    height: 150,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  skeletonStreak: {
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  skeletonCard: {
    height: 72,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
});
