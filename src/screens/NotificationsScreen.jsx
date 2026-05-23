import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight,
  Bell,
  Check,
  Clock,
  Radio,
  Target,
  Trophy,
  UserPlus,
  Users2,
  X,
} from 'lucide-react-native';
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AvatarCircle from '../components/AvatarCircle';
import { useAuth } from '../contexts/AuthContext';
import { useGroups } from '../hooks/useGroups';
import { useGame } from '../hooks/useGame';
import { db } from '../firebase';
import { colors, fontStyles } from '../theme';

const LIVE_ROOM_WAITING_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const LIVE_ROOM_PLAYING_MAX_AGE_MS = 6 * 60 * 60 * 1000;

const EVENT_CONFIG = {
  live_room: {
    icon: Radio,
    iconColor: '#34D399',
    title: 'Tem sala ao vivo no seu grupo',
    fallbackSubtitle: 'Tem gente jogando agora',
    meta: 'Agora',
  },
  room_group_invite: {
    icon: UserPlus,
    iconColor: '#C4B5FD',
    title: 'Seu grupo foi convidado',
    fallbackSubtitle: 'Entre no lobby para jogar',
    meta: 'Convite',
  },
  quiz_group_created: {
    icon: Target,
    iconColor: '#C4B5FD',
    title: 'Alguém criou um grupo de quiz',
    fallbackSubtitle: 'Novo palpite para responder',
    meta: 'Novo',
  },
  pending_quiz: {
    icon: Target,
    iconColor: '#C4B5FD',
    title: 'Palpite em aberto',
    fallbackSubtitle: 'Responda antes do prazo',
    meta: 'Aberto',
  },
  quiz_result: {
    icon: Trophy,
    iconColor: '#FDE68A',
    title: 'Resultado revelado',
    fallbackSubtitle: 'Veja como ficou a disputa',
    meta: 'Novo',
  },
  ranking_update: {
    icon: Trophy,
    iconColor: '#A78BFA',
    title: 'Ranking atualizado',
    fallbackSubtitle: 'O pódio mudou',
    meta: 'Novo',
  },
  ranking_drop: {
    icon: Trophy,
    iconColor: '#F87171',
    title: 'Você caiu no ranking',
    fallbackSubtitle: 'Alguém passou sua posição',
    meta: 'Atenção',
  },
};

function getDate(value) {
  if (!value) return new Date(0);
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function isRecentlyLiveRoom(room) {
  if (!['waiting', 'playing'].includes(room?.status)) return false;
  const players = Array.isArray(room.players) ? room.players : [];
  if (players.length === 0) return false;

  const createdAt = getDate(room.createdAt);
  if (createdAt.getTime() === 0) return false;

  const age = Date.now() - createdAt.getTime();
  const maxAge = room.status === 'waiting'
    ? LIVE_ROOM_WAITING_MAX_AGE_MS
    : LIVE_ROOM_PLAYING_MAX_AGE_MS;

  return age >= 0 && age <= maxAge;
}

function getTimeLeft(endTime) {
  const endDate = getDate(endTime);
  const diffMinutes = Math.ceil((endDate.getTime() - Date.now()) / 60000);
  if (diffMinutes <= 0) return 'Expirado';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const hours = Math.ceil(diffMinutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.ceil(hours / 24)}d`;
}

function isQuizGroupOpen(quizGroup) {
  const endDate = getDate(quizGroup?.endTime);
  if (endDate.getTime() > 0 && endDate.getTime() <= Date.now()) return false;
  return quizGroup?.isActive === true || quizGroup?.status === 'active';
}

function getRankScore(rank = {}) {
  return rank.correct || rank.totalCorrect || rank.score || rank.points || 0;
}

function getRankingPosition(quizGroup = {}, userId) {
  if (!userId || !Array.isArray(quizGroup.ranking)) return null;

  const sortedRanking = [...quizGroup.ranking].sort((first, second) => getRankScore(second) - getRankScore(first));
  const index = sortedRanking.findIndex((rank) => {
    if (quizGroup.rankingType === 'teams') {
      return rank.teamMembers?.some((member) => (
        member.userId === userId || member.uid === userId || member.id === userId
      ));
    }
    return rank.userId === userId || rank.uid === userId || rank.id === userId;
  });

  return index >= 0 ? index + 1 : null;
}

function Header({ onBack, total }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.82}>
        <ArrowRight size={20} color="#FFFFFF" style={{ transform: [{ rotate: '180deg' }] }} />
      </TouchableOpacity>
      <View style={styles.headerCopy}>
        <Text style={styles.title}>Notificações</Text>
        <Text style={styles.subtitle}>
          {total > 0 ? `${total} atualização${total > 1 ? 'es' : ''} para revisar` : 'Tudo em dia por aqui'}
        </Text>
      </View>
    </View>
  );
}

function JoinRequestCard({ notification, index, onAccept, onReject }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 70).springify().damping(18)} style={styles.joinCard}>
      <View pointerEvents="none" style={styles.cardOrb} />
      <View style={styles.joinHeader}>
        <View style={[styles.groupBadge, { backgroundColor: notification.groupColor || colors.primary }]}>
          <Users2 size={15} color="#FFFFFF" />
        </View>
        <Text style={styles.joinGroupName} numberOfLines={1}>{notification.groupName}</Text>
      </View>

      <View style={styles.joinBody}>
        <AvatarCircle
          name={notification.userName}
          photoURL={notification.userPhoto}
          size={46}
        />
        <View style={styles.joinCopy}>
          <Text style={styles.joinTitle} numberOfLines={1}>{notification.userName}</Text>
          <Text style={styles.joinSubtitle}>quer entrar no grupo</Text>
        </View>
      </View>

      <View style={styles.joinActions}>
        <TouchableOpacity style={styles.rejectButton} onPress={() => onReject(notification)} activeOpacity={0.78}>
          <X size={18} color="#F87171" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} onPress={() => onAccept(notification)} activeOpacity={0.82}>
          <Text style={styles.acceptButtonText}>Aceitar</Text>
          <Check size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function NotificationRow({ event, index, onPress }) {
  const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.ranking_update;
  const Icon = config.icon;
  const data = event.data || {};
  const subtitle = event.type === 'quiz_group_created'
    ? `${data.quizGroupTitle || 'Novo quiz'} • ${data.groupName || 'Grupo'}`
    : event.type === 'ranking_drop'
      ? `De #${data.previousPosition} para #${data.latestPosition} em ${data.groupName || 'um grupo'}`
      : data.groupName || data.quizGroupTitle || config.fallbackSubtitle;
  const meta = event.type === 'pending_quiz'
    ? data.timeLeft
    : event.type === 'ranking_drop'
      ? `#${data.latestPosition}`
      : config.meta;

  return (
    <Animated.View entering={FadeInDown.delay(80 + index * 70).springify().damping(18)}>
      <TouchableOpacity style={styles.notificationRow} onPress={onPress} activeOpacity={0.82}>
        <View pointerEvents="none" style={styles.rowOrb} />
        <View style={[styles.notificationIcon, { backgroundColor: `${config.iconColor}1f` }]}>
          <Icon size={20} color={config.iconColor} />
        </View>
        <View style={styles.notificationCopy}>
          <Text style={styles.notificationTitle} numberOfLines={1}>{config.title}</Text>
          <Text style={styles.notificationSubtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
        <View style={styles.metaPill}>
          <Text style={styles.metaText}>{meta}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NotificationsScreen({ navigation }) {
  const { currentUser } = useAuth();
  const {
    getUserGroups,
    getGroupQuizGroups,
    getQuizGroupDetails,
    acceptJoinRequest,
    rejectJoinRequest,
  } = useGroups();
  const { joinRoom } = useGame();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [events, setEvents] = useState([]);

  const loadNotifications = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const groups = await getUserGroups();
      const nextRequests = [];
      const nextEvents = [];

      const socialContacts = new Set();
      if (currentUser?.uid) socialContacts.add(currentUser.uid);
      groups.forEach((group) => {
        (group.members || []).forEach((memberId) => socialContacts.add(memberId));
      });
      const userGroupIds = new Set(groups.map((group) => group.id));

      const adminGroups = groups.filter((group) => group.admins?.includes(currentUser?.uid));
      for (const group of adminGroups) {
        const pendingIds = (group.pendingRequests || []).filter((request) => typeof request === 'string');
        const userDocs = await Promise.all(pendingIds.map((uid) => getDoc(doc(db, 'users', uid))));
        userDocs.forEach((userDoc) => {
          if (!userDoc.exists()) return;
          const user = userDoc.data();
          nextRequests.push({
            id: `${group.id}_${userDoc.id}`,
            groupId: group.id,
            groupName: group.name,
            groupColor: group.color,
            userId: userDoc.id,
            userName: user.username || user.displayName || 'Usuário',
            userPhoto: user.photoURL,
          });
        });
      }

      const roomSnapshot = await getDocs(query(collection(db, 'game_rooms'), orderBy('createdAt', 'desc'), limit(30)));
      roomSnapshot.docs.forEach((roomDoc) => {
        const room = roomDoc.data();
        if (!isRecentlyLiveRoom(room)) return;
        const players = Array.isArray(room.players) ? room.players : [];
        const groupInvite = room.groupInvite || {};
        const invitedGroupId = room.invitedGroupId || groupInvite.groupId;
        const invitedGroup = groups.find((group) => group.id === invitedGroupId);
        const invitedMemberIds = Array.isArray(groupInvite.memberIds) ? groupInvite.memberIds : null;
        const isGroupInvite = Boolean(
          invitedGroupId
          && userGroupIds.has(invitedGroupId)
          && (!invitedMemberIds || invitedMemberIds.includes(currentUser?.uid))
        );
        const hasSocialContact = players.some((player) => socialContacts.has(player.uid || player.id));
        if (!hasSocialContact && !isGroupInvite) return;

        nextEvents.push({
          type: isGroupInvite ? 'room_group_invite' : 'live_room',
          timestamp: getDate(groupInvite.invitedAt || room.invitedAt || room.createdAt).getTime() + 10000000,
          data: {
            roomId: room.roomId || roomDoc.id,
            status: room.status,
            isOpen: room.status === 'waiting',
            gameType: room.settings?.gameType || 'lurdinha',
            groupId: invitedGroupId,
            groupName: isGroupInvite
              ? `${invitedGroup?.name || groupInvite.groupName || room.invitedGroupName || 'Grupo'} chamou você`
              : `${players.length || 1} jogador${players.length === 1 ? '' : 'es'} na sala`,
          },
        });
      });

      if (groups.length > 0) {
        const quizGroupsResults = await Promise.all(groups.map((group) => getGroupQuizGroups(group.id)));
        const activeQuizGroups = [];
        const completedQuizGroups = [];

        quizGroupsResults.forEach((quizGroups, index) => {
          const group = groups[index];
          const withGroup = (quizGroup) => ({
            ...quizGroup,
            groupId: group.id,
            groupName: group.name,
            groupColor: group.color,
            groupBadge: group.badge,
          });
          activeQuizGroups.push(...quizGroups.filter(isQuizGroupOpen).map(withGroup));
          completedQuizGroups.push(...quizGroups.filter((quizGroup) => !isQuizGroupOpen(quizGroup)).map(withGroup));
        });

        activeQuizGroups
          .sort((first, second) => getDate(second.createdAt) - getDate(first.createdAt))
          .slice(0, 5)
          .forEach((quizGroup) => {
            nextEvents.push({
              type: 'quiz_group_created',
              timestamp: getDate(quizGroup.createdAt).getTime() + 4000000,
              data: {
                groupName: quizGroup.groupName,
                quizGroupTitle: quizGroup.title,
                quizGroupId: quizGroup.id,
                groupId: quizGroup.groupId,
              },
            });
          });

        const activeDetails = await Promise.all(
          activeQuizGroups.slice(0, 8).map(async (quizGroup) => {
            try {
              const details = await getQuizGroupDetails(quizGroup.id);
              return { ...quizGroup, quizzesData: details?.quizzesData || [] };
            } catch {
              return null;
            }
          })
        );

        activeDetails.filter(Boolean).forEach((quizGroup) => {
          const unanswered = quizGroup.quizzesData.find((quiz) => quiz.votes?.[currentUser?.uid] === undefined);
          if (!unanswered) return;
          nextEvents.push({
            type: 'pending_quiz',
            timestamp: Date.now() + 5000000,
            data: {
              ...unanswered,
              quizGroupId: quizGroup.id,
              groupId: quizGroup.groupId,
              quizGroupTitle: quizGroup.title,
              groupName: quizGroup.groupName,
              timeLeft: getTimeLeft(quizGroup.endTime),
            },
          });
        });

        const withRanking = [...activeQuizGroups, ...completedQuizGroups]
          .filter((quizGroup) => quizGroup.ranking?.length > 0)
          .sort((first, second) => getDate(second.endTime || second.createdAt) - getDate(first.endTime || first.createdAt));

        groups.forEach((group, index) => {
          const rankedGroups = quizGroupsResults[index]
            .filter((quizGroup) => quizGroup.ranking?.length > 0)
            .map((quizGroup) => ({
              ...quizGroup,
              groupId: group.id,
              groupName: group.name,
            }))
            .sort((first, second) => getDate(second.endTime || second.createdAt) - getDate(first.endTime || first.createdAt));

          if (rankedGroups.length < 2) return;

          const latestWithUser = rankedGroups.find((quizGroup) => getRankingPosition(quizGroup, currentUser?.uid));
          if (!latestWithUser) return;

          const previousWithUser = rankedGroups.find((quizGroup) => (
            quizGroup.id !== latestWithUser.id && getRankingPosition(quizGroup, currentUser?.uid)
          ));
          if (!previousWithUser) return;

          const latestPosition = getRankingPosition(latestWithUser, currentUser?.uid);
          const previousPosition = getRankingPosition(previousWithUser, currentUser?.uid);
          if (!latestPosition || !previousPosition || latestPosition <= previousPosition) return;

          nextEvents.push({
            type: 'ranking_drop',
            timestamp: getDate(latestWithUser.endTime || latestWithUser.createdAt).getTime() + 3000000,
            data: {
              groupName: group.name,
              quizGroupTitle: latestWithUser.title,
              quizGroupId: latestWithUser.id,
              previousPosition,
              latestPosition,
            },
          });
        });

        withRanking.slice(0, 5).forEach((quizGroup) => {
          nextEvents.push({
            type: 'ranking_update',
            timestamp: getDate(quizGroup.endTime || quizGroup.createdAt).getTime(),
            data: {
              groupName: quizGroup.groupName,
              quizGroupTitle: quizGroup.title,
              quizGroupId: quizGroup.id,
            },
          });
        });

        completedQuizGroups
          .sort((first, second) => getDate(second.endTime || second.createdAt) - getDate(first.endTime || first.createdAt))
          .slice(0, 4)
          .forEach((quizGroup) => {
            nextEvents.push({
              type: 'quiz_result',
              timestamp: getDate(quizGroup.endTime || quizGroup.createdAt).getTime() - 5000,
              data: quizGroup,
            });
          });
      }

      nextEvents.sort((first, second) => second.timestamp - first.timestamp);
      setJoinRequests(nextRequests);
      setEvents(nextEvents.slice(0, 30));
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Erro', 'Não foi possível carregar as notificações.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser?.uid]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications(true);
  };

  const handleAcceptRequest = async (notification) => {
    await acceptJoinRequest(notification.groupId, notification.userId);
    setJoinRequests((current) => current.filter((item) => item.id !== notification.id));
  };

  const handleRejectRequest = async (notification) => {
    await rejectJoinRequest(notification.groupId, notification.userId);
    setJoinRequests((current) => current.filter((item) => item.id !== notification.id));
  };

  const handleEventPress = async (event) => {
    if (event.type === 'live_room' || event.type === 'room_group_invite') {
      if (event.data?.isOpen) {
        try {
          await joinRoom(event.data.roomId);
        } catch {}
        navigation.navigate('Lobby', { roomId: event.data.roomId });
      } else {
        try {
          await joinRoom(event.data.roomId);
          navigation.navigate('Game', { roomId: event.data.roomId });
        } catch {
          navigation.navigate('GameHome');
        }
      }
      return;
    }

    if (event.type === 'pending_quiz' || event.type === 'quiz_group_created') {
      navigation.navigate('QuizGroupDetail', {
        quizGroupId: event.data.quizGroupId,
        groupId: event.data.groupId,
        groupName: event.data.groupName,
      });
      return;
    }

    if (event.type === 'quiz_result') {
      navigation.navigate('QuizGroupDetail', {
        quizGroupId: event.data.id,
        groupId: event.data.groupId,
        groupName: event.data.groupName,
      });
      return;
    }

    if (event.type === 'ranking_update' || event.type === 'ranking_drop') {
      navigation.navigate('Ranking', {
        quizGroupId: event.data.quizGroupId,
        groupName: event.data.groupName,
        quizGroupTitle: event.data.quizGroupTitle,
      });
    }
  };

  const total = joinRequests.length + events.length;

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#09090B', '#101014', '#120B1F']} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.ambientGlow} />
      <Header total={total} onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#A78BFA" />
          <Text style={styles.loadingText}>Carregando notificações...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#A855F7"
              colors={['#A855F7']}
            />
          }
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Bell size={28} color="#C4B5FD" />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Central da galera</Text>
              <Text style={styles.heroSubtitle}>
                Solicitações, salas, palpites e rankings recentes aparecem aqui.
              </Text>
            </View>
          </View>

          {joinRequests.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <UserPlus size={18} color="#C4B5FD" />
                  <Text style={styles.sectionTitle}>Solicitações pendentes</Text>
                </View>
                <View style={styles.countPill}>
                  <Text style={styles.countText}>{joinRequests.length}</Text>
                </View>
              </View>
              {joinRequests.map((notification, index) => (
                <JoinRequestCard
                  key={notification.id}
                  notification={notification}
                  index={index}
                  onAccept={handleAcceptRequest}
                  onReject={handleRejectRequest}
                />
              ))}
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Clock size={18} color="#C4B5FD" />
                <Text style={styles.sectionTitle}>Atualizações recentes</Text>
              </View>
              {events.length > 0 && (
                <View style={styles.countPill}>
                  <Text style={styles.countText}>{events.length}</Text>
                </View>
              )}
            </View>

            {events.length === 0 ? (
              <View style={styles.emptyCard}>
                <Bell size={44} color="rgba(255,255,255,0.32)" />
                <Text style={styles.emptyTitle}>Sem notificações novas</Text>
                <Text style={styles.emptySubtitle}>
                  Quando alguém criar sala, palpite, ranking ou pedir entrada em grupo, você verá aqui.
                </Text>
              </View>
            ) : (
              events.map((event, index) => (
                <NotificationRow
                  key={`${event.type}-${event.timestamp}-${index}`}
                  event={event}
                  index={index}
                  onPress={() => handleEventPress(event)}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  ambientGlow: {
    position: 'absolute',
    right: -72,
    top: 88,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 18,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#232326',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...fontStyles.extrabold,
    color: '#FFFFFF',
    fontSize: 26,
  },
  subtitle: {
    ...fontStyles.medium,
    color: 'rgba(255,255,255,0.46)',
    fontSize: 14,
    marginTop: 3,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 130,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 14,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#18181B',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.14)',
    padding: 18,
    marginBottom: 26,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    ...fontStyles.extrabold,
    color: '#FFFFFF',
    fontSize: 21,
  },
  heroSubtitle: {
    ...fontStyles.medium,
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  section: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...fontStyles.extrabold,
    color: '#FFFFFF',
    fontSize: 18,
  },
  countPill: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(139,92,246,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  countText: {
    color: '#C4B5FD',
    fontWeight: '900',
    fontSize: 13,
  },
  joinCard: {
    backgroundColor: '#18181B',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.13)',
    padding: 15,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardOrb: {
    position: 'absolute',
    right: -30,
    top: -24,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(139,92,246,0.08)',
  },
  joinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
  },
  groupBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinGroupName: {
    flex: 1,
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '700',
  },
  joinBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  joinCopy: {
    flex: 1,
    minWidth: 0,
  },
  joinTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  joinSubtitle: {
    color: '#A1A1AA',
    fontSize: 13,
    marginTop: 2,
  },
  joinActions: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#18181B',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.065)',
    padding: 13,
    marginBottom: 9,
    overflow: 'hidden',
  },
  rowOrb: {
    position: 'absolute',
    right: -18,
    top: -18,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  notificationIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCopy: {
    flex: 1,
    minWidth: 0,
  },
  notificationTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  notificationSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 3,
  },
  metaPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  metaText: {
    color: '#C4B5FD',
    fontSize: 11,
    fontWeight: '900',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 26,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 12,
  },
  emptySubtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 7,
    fontSize: 13,
  },
});
