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
import { ArrowRight, Gamepad2, Radio, Target, Trophy, Users } from 'lucide-react-native';
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';
import { useGroups } from '../hooks/useGroups';
import { useGame } from '../hooks/useGame';
import UsernameSetupModal from '../components/UsernameSetupModal';
import NetworkRetry from '../components/NetworkRetry';
import { fontStyles } from '../theme';

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
  const maxAge = room.status === 'waiting'
    ? LIVE_ROOM_WAITING_MAX_AGE_MS
    : LIVE_ROOM_PLAYING_MAX_AGE_MS;

  return age >= 0 && age <= maxAge;
};

// ─── Sub-Components ──────────────────────────────────────────
import HeroSection from '../components/home/HeroSection';
import MainFocusCard from '../components/home/MainFocusCard';
import QuickActions from '../components/home/QuickActions';
import HorizontalCards from '../components/home/HorizontalCards';
import AdminNotificationBanner from '../components/home/AdminNotificationBanner';
import { LiveRoomCard, PendingQuizCard, RankingUpdateCard, QuizResultCard } from '../components/home/FeedCards';

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

const getNowCopy = (event, summary) => {
  if (!event) {
    return {
      eyebrow: 'Agora',
      title: summary.groupCount > 0 ? 'Crie uma rodada para movimentar a galera' : 'Comece criando ou entrando em um grupo',
      subtitle: summary.groupCount > 0
        ? 'Abra uma sala ou crie um palpite para o grupo responder.'
        : 'Grupos, salas e rankings aparecem aqui quando a roda começa.',
      cta: summary.groupCount > 0 ? 'Jogar agora' : 'Encontrar grupos',
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
      subtitle: `${event.data?.groupName || event.data?.quizGroupTitle || 'Seu grupo'} • você está em #${event.data?.userPosition || '?'}`,
      cta: 'Ver ranking',
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

function NowDashboard({ mainEvent, summary, onMainPress, navigation }) {
  const nowCopy = getNowCopy(mainEvent, summary);
  const Icon = nowCopy.icon;
  const isResultEvent = mainEvent?.type === 'quiz_result';
  const stats = [
    { id: 'pending', label: 'Palpites', value: summary.pendingQuizCount, icon: Target },
    { id: 'live', label: 'Ao vivo', value: summary.liveRoomCount, icon: Radio },
    { id: 'ranking', label: 'Rankings', value: summary.rankingCount, icon: Trophy },
  ];

  return (
    <View style={styles.nowDashboard}>
      <LinearGradient
        colors={['#1D1A24', '#18181B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.nowDashboardCard, isResultEvent && styles.nowDashboardCardCompact]}
      >
        <View pointerEvents="none" style={styles.nowDashboardOrb} />
        <View style={styles.nowDashboardHeader}>
          <View style={[styles.nowIconWrap, isResultEvent && styles.nowIconWrapCompact]}>
            <Icon size={22} color="#A855F7" />
          </View>
          <View style={styles.nowCopy}>
            <Text style={styles.nowEyebrow}>{nowCopy.eyebrow}</Text>
            <Text style={[styles.nowTitle, isResultEvent && styles.nowTitleCompact]} numberOfLines={2}>{nowCopy.title}</Text>
            <Text style={styles.nowSubtitle} numberOfLines={2}>{nowCopy.subtitle}</Text>
          </View>
        </View>

        {!isResultEvent && (
          <View style={styles.nowStatsRow}>
            {stats.map((stat) => {
              const StatIcon = stat.icon;
              return (
                <TouchableOpacity
                  key={stat.id}
                  activeOpacity={0.82}
                  style={styles.nowStatPill}
                  onPress={() => {
                    if (stat.id === 'ranking') navigation.navigate('SelectGroupRanking');
                    if (stat.id === 'live') navigation.navigate('GameHome');
                    if (stat.id === 'pending') onMainPress();
                  }}
                >
                  <StatIcon size={14} color="#D8B4FE" />
                  <Text style={styles.nowStatValue}>{stat.value}</Text>
                  <Text style={styles.nowStatLabel}>{stat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={[styles.nowPrimaryButton, isResultEvent && styles.nowPrimaryButtonCompact]}
          onPress={onMainPress}
          activeOpacity={0.86}
        >
          <Text style={styles.nowPrimaryButtonText}>{nowCopy.cta}</Text>
          <ArrowRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.nowMiniActions}>
        <TouchableOpacity style={styles.nowMiniAction} onPress={() => navigation.navigate('GameHome')} activeOpacity={0.82}>
          <Gamepad2 size={18} color="#A855F7" />
          <Text style={styles.nowMiniActionText}>Jogar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nowMiniAction} onPress={() => navigation.navigate('groups')} activeOpacity={0.82}>
          <Users size={18} color="#A855F7" />
          <Text style={styles.nowMiniActionText}>{summary.latestGroupName || 'Grupos'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { currentUser } = useAuth();
  const { userData, refreshUserData } = useUserData();
  const { getUserGroups, getGroupQuizGroups, getQuizGroupDetails, acceptJoinRequest, rejectJoinRequest } = useGroups();
  const { joinRoom } = useGame();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
      } catch (error) {
        console.warn('Erro ao carregar resultados dispensados da Home:', error);
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

      // Build a set of all members from the user's groups (their social network)
      const socialContacts = new Set();
      if (currentUser) socialContacts.add(currentUser.uid);

      userGroups.forEach(g => {
        if (Array.isArray(g.members)) {
          g.members.forEach(m => socialContacts.add(m));
        }
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

          // Only show room if the user themselves, or someone from their social groups, is in the room
          const hasSocialContact = players.some(p => socialContacts.has(p.uid || p.id));
          if (!hasSocialContact) return null;

          const createdAt = getDate(room.createdAt);
          return {
            roomId,
            status: room.status,
            gameType: room.settings?.gameType || 'lurdinha',
            createdAt,
            playerCount: players.length,
            players,
            isOpen: room.status === 'waiting',
          };
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

        // Ranking
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
            events.push({ type: 'ranking_update', data: { groupName: latest.groupName, quizGroupTitle: latest.title, userPosition: rank + 1, top3: sorted.slice(0, 3) }, timestamp: latest.endTime?.toDate ? latest.endTime.toDate().getTime() : Date.now() - 10000 });
          }
        }

        // Resultado encerrado
        if (allCompletedQuizGroups.length > 0) {
          const latestCompleted = allCompletedQuizGroups.sort((a, b) => {
            const aT = a.endTime?.toDate ? a.endTime.toDate() : new Date(0);
            const bT = b.endTime?.toDate ? b.endTime.toDate() : new Date(0);
            return bT - aT;
          })[0];
          const dismissKey = getQuizResultDismissKey(latestCompleted);
          if (!dismissedResultIds.includes(dismissKey)) {
            events.push({
              type: 'quiz_result',
              data: { ...latestCompleted, dismissKey },
              timestamp: (latestCompleted.endTime?.toDate ? latestCompleted.endTime.toDate().getTime() : Date.now()) - 5000,
            });
          }
        }
      }

      events.sort((a, b) => b.timestamp - a.timestamp);
      setFeedEvents(events);
      setHomeSummary({
        groupCount: userGroups.length,
        liveRoomCount,
        pendingQuizCount,
        rankingCount,
        latestGroupName,
      });
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

  const handleViewRanking = () => navigation.navigate('SelectGroupRanking');
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
    } catch (error) {
      console.warn('Erro ao salvar resultado dispensado da Home:', error);
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
      case 'ranking_update': return handleViewRanking;
      default: return () => { };
    }
  };

  // ─── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingPad}>
          <View style={styles.skeletonHeader} />
          <View style={styles.skeletonGreeting} />
          <View style={styles.skeletonStats} />
          {[1, 2, 3].map(i => <SkeletonFeedBlock key={i} />)}
        </View>
      </View>
    );
  }

  if (error) {
    return <NetworkRetry onRetry={() => loadHomeData()} message="Não foi possível carregar as atividades." />;
  }

  // Separar cards
  const [mainEvent, ...restEvents] = feedEvents;
  const carouselAllowed = ['ranking_update', 'pending_quiz', 'live_room'];
  const carouselEvents = restEvents.filter(e => carouselAllowed.includes(e.type)).slice(0, 3);
  const carouselEventHashes = new Set(carouselEvents.map(e => e.timestamp + e.type));
  // O que sobrou vai pro activity feed
  const activityEvents = feedEvents.slice(1).filter(e => !carouselEventHashes.has(e.timestamp + e.type));

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#A855F7" colors={['#A855F7']} />
      }
    >
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* ── 1. Smart Header + Greeting */}
        <HeroSection userData={userData} navigation={navigation} notificationCount={activityEvents.length} />

        {/* ── 2. Admin Notifications */}
        <AdminNotificationBanner
          adminNotifications={adminNotifications}
          handleAcceptRequest={(n) => { acceptJoinRequest(n.groupId, n.userId); setAdminNotifications(p => p.filter(x => x.id !== n.id)); }}
          handleRejectRequest={(n) => { rejectJoinRequest(n.groupId, n.userId); setAdminNotifications(p => p.filter(x => x.id !== n.id)); }}
        />

        {/* ── 3. Agora: próxima melhor ação */}
        <NowDashboard
          mainEvent={mainEvent}
          summary={homeSummary}
          onMainPress={mainEvent ? getEventHandler(mainEvent) : () => navigation.navigate(homeSummary.groupCount > 0 ? 'GameHome' : 'groups')}
          navigation={navigation}
        />

        {/* ── 4. Card principal detalhado */}
        <View style={styles.mainFocusWrap}>
          <MainFocusCard
            event={mainEvent || { type: 'default_cta', data: {} }}
            onPress={mainEvent ? getEventHandler(mainEvent) : () => navigation.navigate('GameHome')}
          />
        </View>

        {/* ── 5. Mais coisas acontecendo */}
        {carouselEvents.length > 0 && (
          <HorizontalCards events={carouselEvents} getEventHandler={getEventHandler} />
        )}

        {/* ── 6. Ações rápidas */}
        <QuickActions navigation={navigation} />

        {/* ── 6.5. Nova Home (teste) */}
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
            <View style={styles.newHomeTeaserLeft}>
              <View style={styles.newHomeTeaserBadge}>
                <Text style={styles.newHomeTeaserBadgeText}>TESTE</Text>
              </View>
              <Text style={styles.newHomeTeaserTitle}>Nova Home</Text>
              <Text style={styles.newHomeTeaserSub}>Design experimental — toque para ver</Text>
            </View>
            <ArrowRight size={18} color="#A78BFA" />
          </LinearGradient>
        </TouchableOpacity>

        {/* ── 7. Atividade social */}
        <View style={styles.feedSection}>
          <View style={styles.feedSectionHeader}>
            <View>
              <Text style={styles.feedSectionTitle}>Acontecendo nos grupos</Text>
              <Text style={styles.feedSectionSubtitle}>Salas, palpites, rankings e resultados recentes</Text>
            </View>
            {activityEvents.length > 0 && (
              <View style={styles.feedCountPill}>
                <Text style={styles.feedCountText}>{activityEvents.length}</Text>
              </View>
            )}
          </View>

          {/* Empty State */}
          {feedEvents.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconGlow}>
                <Users size={40} color="#D8B4FE" />
              </View>
              <Text style={styles.emptyTitle}>Nada rolando agora</Text>
              <Text style={styles.emptySubtext}>Crie uma sala ou palpite para dar assunto para a galera.</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('groups')}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyButtonText}>Convidar Galera</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.activityList}>
            {activityEvents.map((event, index) => {
              const key = `${event.timestamp}-${event.type}-${index}`;
              const onPress = getEventHandler(event);
              switch (event.type) {
                case 'live_room':
                  return <LiveRoomCard key={key} event={event} index={index} onPress={onPress} />;
                case 'pending_quiz':
                  return <PendingQuizCard key={key} event={event} index={index} onPress={onPress} />;
                case 'quiz_result':
                  return <QuizResultCard key={key} event={event} index={index} onPress={onPress} />;
                case 'ranking_update':
                  return <RankingUpdateCard key={key} event={event} index={index} onPress={onPress} />;
                default:
                  return null;
              }
            })}
          </View>
        </View>
      </Animated.View>

      <UsernameSetupModal
        visible={!!userData && !userData.username}
        onSuccess={refreshUserData}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    paddingBottom: 120,
  },

  // ── Nova Home teaser button
  newHomeTeaser: {
    marginHorizontal: 16,
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
  newHomeTeaserLeft: { flex: 1 },
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
    paddingHorizontal: 24,
    paddingTop: 64,
    gap: 14,
  },
  skeletonHeader: {
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 10,
  },
  skeletonGreeting: {
    height: 64,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  skeletonStats: {
    height: 62,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: 8,
  },
  skeletonCard: {
    height: 180,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  // ── Sections
  nowDashboard: {
    paddingHorizontal: 24,
    marginBottom: 18,
  },
  nowDashboardCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.22)',
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  nowDashboardCardCompact: {
    borderRadius: 24,
    padding: 14,
  },
  nowDashboardOrb: {
    position: 'absolute',
    right: -36,
    top: -34,
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: 'rgba(168,85,247,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.14)',
  },
  nowDashboardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  nowIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: 'rgba(168,85,247,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowIconWrapCompact: {
    width: 44,
    height: 44,
    borderRadius: 16,
  },
  nowCopy: {
    flex: 1,
    minWidth: 0,
  },
  nowEyebrow: {
    color: '#C084FC',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  nowTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 27,
    ...fontStyles.headingBold,
    marginBottom: 6,
  },
  nowTitleCompact: {
    fontSize: 19,
    lineHeight: 24,
  },
  nowSubtitle: {
    color: '#A1A1AA',
    fontSize: 13,
    lineHeight: 18,
    ...fontStyles.medium,
  },
  nowStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  nowStatPill: {
    flex: 1,
    minHeight: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 8,
  },
  nowStatValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  nowStatLabel: {
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '800',
  },
  nowPrimaryButton: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nowPrimaryButtonCompact: {
    minHeight: 44,
    alignSelf: 'stretch',
    borderRadius: 16,
  },
  nowPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  nowMiniActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  nowMiniAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  nowMiniActionText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '800',
  },
  mainFocusWrap: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  feedSection: {
    paddingHorizontal: 24,
  },
  feedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  feedSectionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  feedSectionSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 17,
  },
  feedCountPill: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(168,85,247,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedCountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  activityList: {
    gap: 0,
  },

  // ── Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 56,
    backgroundColor: '#18181B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyIconGlow: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.22)',
  },
  emptyTitle: {
    fontSize: 19,
    ...fontStyles.headingBold,
    color: '#F3F4F6',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    ...fontStyles.regular,
    color: '#A1A1AA',
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: '78%',
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    ...fontStyles.bold,
  },
});
