import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Plus,
  Users,
  Crown,
  Trophy,
  Star,
  Clock,
  ChevronRight,
  Settings,
  Search,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import AvatarCircle from '../components/AvatarCircle';
import {
  getQuizGroupEndDate,
  getQuizGroupActivityTime,
} from '../utils/groupRanking';
import { getGroupsLastSeen } from '../utils/groupSeen';
import { useGroups } from '../hooks/useGroups';
import { useUserData } from '../hooks/useUserData';
import AnimatedPressable from '../components/AnimatedPressable';
import Header from '../components/Header';
import EmptyStateCard from '../components/EmptyStateCard';
import { colors, fontStyles } from '../theme';
import { SkeletonList } from '../components/SkeletonLoader';
import NetworkRetry from '../components/NetworkRetry';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.8;
const MAX_STACKED_AVATARS = 4;

// Converte uma cor hex (#RRGGBB) em rgba com a opacidade informada.
const withAlpha = (hex, alpha) => {
  if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return colors.primaryAlpha(alpha);
  }
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
};

const formatTimeLeft = (endDate) => {
  if (!endDate) return null;
  const diffMs = endDate.getTime() - Date.now();
  if (diffMs <= 0) return null;

  const totalMinutes = Math.ceil(diffMs / (1000 * 60));
  if (totalMinutes < 60) return `${totalMinutes}min`;

  const hours = Math.ceil(totalMinutes / 60);
  if (hours < 48) return `${hours}h`;

  return `${Math.ceil(hours / 24)} dias`;
};

export default function GroupsScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [groupInsights, setGroupInsights] = useState({});
  const [lastSeen, setLastSeen] = useState({});
  const { getUserGroups } = useGroups();
  const { userData } = useUserData();
  const { currentUser } = useAuth();

  useEffect(() => {
    loadGroups();
  }, [userData?.groups]);


  const loadGroups = async () => {
    try {
      setError(false);
      setLoading(true);
      const userGroups = await getUserGroups();
      setGroups(userGroups);
      loadGroupInsights(userGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Busca, sem bloquear a lista, os dados extras de cada card:
  // avatares dos membros, quiz ativo e última atividade.
  const loadGroupInsights = async (userGroups) => {
    const userCache = new Map();
    const fetchUser = (userId) => {
      if (!userCache.has(userId)) {
        userCache.set(userId, getDoc(doc(db, 'users', userId))
          .then(snap => (snap.exists() ? { uid: snap.id, ...snap.data() } : null))
          .catch(() => null));
      }
      return userCache.get(userId);
    };

    const entries = await Promise.all(userGroups.map(async (group) => {
      try {
        const memberIds = (group.members || []).slice(0, MAX_STACKED_AVATARS);
        const [members, quizGroups] = await Promise.all([
          Promise.all(memberIds.map(fetchUser)),
          Promise.all((group.quizGroups || []).map(quizGroupId => (
            getDoc(doc(db, 'quizGroups', quizGroupId))
              .then(snap => (snap.exists() ? { id: snap.id, ...snap.data() } : null))
              .catch(() => null)
          ))),
        ]);

        const validQuizGroups = quizGroups.filter(Boolean);
        const now = Date.now();
        const activeEndDates = validQuizGroups
          .filter(quizGroup => quizGroup.status === 'active')
          .map(getQuizGroupEndDate)
          .filter(endDate => endDate && endDate.getTime() > now)
          .sort((first, second) => first - second);

        return [group.id, {
          members: members.filter(Boolean),
          activeQuizCount: activeEndDates.length,
          nextDeadline: activeEndDates[0] || null,
          latestActivity: Math.max(0, ...validQuizGroups.map(getQuizGroupActivityTime)),
        }];
      } catch (insightError) {
        console.warn('Error loading group insights:', insightError);
        return [group.id, null];
      }
    }));

    setGroupInsights(Object.fromEntries(entries.filter(([, value]) => value)));
  };

  // Recarrega o "visto por último" ao voltar para a aba (ex.: depois de abrir um grupo).
  useFocusEffect(
    useCallback(() => {
      if (!currentUser?.uid || groups.length === 0) return;
      getGroupsLastSeen(currentUser.uid, groups.map(group => group.id)).then(setLastSeen);
    }, [currentUser?.uid, groups])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup', {
      onGroupCreated: () => {
        loadGroups();
      }
    });
  };

  const handleJoinGroup = () => {
    navigation.navigate('SearchGroups');
  };

  const handleGroupPress = (group) => {
    navigation.navigate('GroupDetail', { groupId: group.id });
  };

  const calculateUserStats = () => {
    const totalPoints = userData?.stats?.totalPoints || 0;
    const acertos = userData?.stats?.acertos || 0;
    const enquetesVotadas = userData?.stats?.enquetesVotadas || 0;
    const accuracy = enquetesVotadas > 0 ? Math.round((acertos / enquetesVotadas) * 100) : 0;
    const titles = userData?.stats?.titles || 0;

    return { totalPoints, accuracy, titles };
  };

  const stats = calculateUserStats();
  const hasActivity = stats.totalPoints > 0 || (userData?.stats?.enquetesVotadas || 0) > 0;
  const showGroupExtras = !loading && !error && groups.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Header
          title="Meus Grupos"
          subtitle="Sua galera, seus quizzes, seu ranking."
          rightAction={() => navigation.navigate('Settings')}
          rightActionIcon={Settings}
          flush
        />

        {/* Groups List */}
        <View style={styles.groupsContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Seus Grupos</Text>
            {!loading && !error && groups.length > 0 ? (
              <View style={styles.sectionCountPill}>
                <Text style={styles.sectionCountText}>{groups.length}</Text>
              </View>
            ) : null}
          </View>

          {loading ? (
            <SkeletonList count={3} />
          ) : error ? (
            <NetworkRetry
              onRetry={loadGroups}
              message="Erro ao carregar seus grupos."
              compact={true}
            />
          ) : groups.length === 0 ? (
            <EmptyStateCard
              icon={Users}
              eyebrow="Comece por aqui"
              title="Seu círculo ainda está vazio"
              description="Crie um grupo para reunir sua galera ou entre em um convite existente para começar a jogar, votar e subir no ranking."
              primaryAction={{
                label: 'Criar grupo',
                onPress: handleCreateGroup,
              }}
              secondaryAction={{
                label: 'Buscar grupos/pessoas',
                onPress: handleJoinGroup,
              }}
            />
          ) : (
            groups.map((group) => {
              const memberCount = group.stats?.totalMembers || group.members?.length || 0;
              const insight = groupInsights[group.id];
              const activeQuizzes = insight ? insight.activeQuizCount : (group.stats?.activeQuizzes || 0);
              const timeLeft = formatTimeLeft(insight?.nextDeadline);
              const hasNews = !!insight && lastSeen[group.id] !== undefined
                && insight.latestActivity > lastSeen[group.id];
              const groupColor = group.color || colors.primary;
              const stackedMembers = insight?.members || [];
              const hiddenMembers = Math.max(0, memberCount - stackedMembers.length);

              return (
                <TouchableOpacity
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => handleGroupPress(group)}
                  activeOpacity={0.8}
                >
                  <View style={styles.groupHeader}>
                    <View style={styles.groupInfo}>
                      <View
                        style={[
                          styles.groupBadge,
                          { backgroundColor: withAlpha(groupColor, 0.18), borderColor: withAlpha(groupColor, 0.35) },
                        ]}
                      >
                        <Text style={styles.groupBadgeText}>{group.badge || '👥'}</Text>
                      </View>
                      <View style={styles.groupDetails}>
                        <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
                        {group.description ? (
                          <Text style={styles.groupDescription} numberOfLines={1}>
                            {group.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.groupChevronWrap}>
                      <ChevronRight size={16} color={colors.textDim} />
                      {hasNews ? <View style={styles.newsDot} /> : null}
                    </View>
                  </View>

                  <View style={styles.groupMetaRow}>
                    <View style={styles.membersRow}>
                      {stackedMembers.length > 0 ? (
                        <View style={styles.avatarStack}>
                          {stackedMembers.map((member, index) => (
                            <View
                              key={member.uid}
                              style={[styles.avatarStackItem, index > 0 && styles.avatarStackOverlap]}
                            >
                              <AvatarCircle
                                name={member.displayName || member.username || member.name || 'U'}
                                photoURL={member.photoURL}
                                size={26}
                              />
                            </View>
                          ))}
                          {hiddenMembers > 0 ? (
                            <View style={[styles.avatarStackItem, styles.avatarStackOverlap, styles.avatarMore]}>
                              <Text style={styles.avatarMoreText}>+{hiddenMembers}</Text>
                            </View>
                          ) : null}
                        </View>
                      ) : (
                        <Users size={16} color={colors.textMuted} />
                      )}
                      <Text style={styles.groupStatText}>
                        {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
                      </Text>
                    </View>

                  </View>

                  {activeQuizzes > 0 ? (
                    <View style={styles.quizActiveRow}>
                      <Clock size={15} color={colors.orange} />
                      <Text style={styles.quizActiveText} numberOfLines={1}>
                        {activeQuizzes === 1 ? 'Quiz' : `${activeQuizzes} quizzes`}
                        {timeLeft
                          ? ` ${activeQuizzes === 1 ? 'fecha' : 'fecham'} em ${timeLeft}`
                          : ` ${activeQuizzes === 1 ? 'ativo' : 'ativos'}`}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Ações e desempenho — só depois da lista, quando já existem grupos */}
        {showGroupExtras ? (
          <>
            <View style={styles.actionsContainer}>
              <AnimatedPressable
                style={styles.primaryButtonWrap}
                onPress={handleCreateGroup}
                activeScale={0.96}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  <Plus size={20} color={colors.textPrimary} />
                  <Text style={styles.primaryButtonText}>Criar Grupo</Text>
                </LinearGradient>
              </AnimatedPressable>
              <AnimatedPressable
                style={styles.secondaryButton}
                onPress={handleJoinGroup}
                activeScale={0.98}
              >
                <Search size={20} color={colors.primaryDark} />
                <Text style={styles.secondaryButtonText} numberOfLines={1}>Buscar</Text>
              </AnimatedPressable>
            </View>

            <Text style={styles.subsectionTitle}>Seu desempenho</Text>
            {hasActivity ? (
              <View style={styles.statsContainer}>
                <View style={[styles.statCard, styles.statCardPrimary]}>
                  <View style={styles.statHeaderRow}>
                    <Trophy size={14} color={colors.primaryLight} />
                    <Text style={styles.statNumberCompact}>{stats.totalPoints.toLocaleString()}</Text>
                  </View>
                  <Text style={styles.statLabel}>Pontos Totais</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={styles.statHeaderRow}>
                    <Star size={14} color={colors.orange} />
                    <Text style={styles.statNumberCompact}>{stats.accuracy}%</Text>
                  </View>
                  <Text style={styles.statLabel}>Taxa de Acerto</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={styles.statHeaderRow}>
                    <Crown size={14} color={colors.orange} />
                    <Text style={styles.statNumberCompact}>{stats.titles}</Text>
                  </View>
                  <Text style={styles.statLabel}>Títulos</Text>
                </View>
              </View>
            ) : (
              <AnimatedPressable
                style={styles.statsHintCard}
                onPress={() => handleGroupPress(groups[0])}
                activeScale={0.98}
              >
                <View style={styles.statsHintIcon}>
                  <Trophy size={18} color={colors.orange} />
                </View>
                <View style={styles.statsHintText}>
                  <Text style={styles.statsHintTitle}>Seus pontos aparecem aqui</Text>
                  <Text style={styles.statsHintSubtitle}>
                    Responda o primeiro quiz de um grupo para entrar no ranking.
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.textDim} />
              </AnimatedPressable>
            )}
          </>
        ) : null}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 190,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    ...fontStyles.semibold,
    fontSize: 18,
    color: colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    ...fontStyles.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  statCardPrimary: {
    borderColor: colors.primaryAlpha20,
    backgroundColor: colors.surfaceLight,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statNumberCompact: {
    ...fontStyles.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  statLabel: {
    ...fontStyles.regular,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  primaryButtonWrap: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
  primaryButton: {
    flex: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    ...fontStyles.semibold,
    color: colors.textPrimary,
    fontSize: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    ...fontStyles.semibold,
    color: colors.primary,
    fontSize: 16,
  },
  groupsContainer: {
    marginBottom: 8,
  },
  subsectionTitle: {
    ...fontStyles.semibold,
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  statsHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsHintIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,107,53,0.12)',
  },
  statsHintText: {
    flex: 1,
  },
  statsHintTitle: {
    ...fontStyles.semibold,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statsHintSubtitle: {
    ...fontStyles.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    ...fontStyles.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  sectionCountPill: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.primaryAlpha15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  sectionCountText: {
    ...fontStyles.bold,
    fontSize: 14,
    color: colors.primaryLight,
  },
  groupCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primaryAlpha08,
    position: 'relative',
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  groupBadgeText: {
    fontSize: 28,
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    ...fontStyles.bold,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  groupDescription: {
    ...fontStyles.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  groupMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStackItem: {
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.surfaceAlt,
    backgroundColor: colors.surfaceAlt,
  },
  avatarStackOverlap: {
    marginLeft: -9,
  },
  avatarMore: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
  },
  avatarMoreText: {
    ...fontStyles.semibold,
    fontSize: 10,
    color: colors.textMuted,
  },
  quizActiveRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,107,53,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.25)',
  },
  quizActiveText: {
    ...fontStyles.semibold,
    fontSize: 14,
    color: colors.orange,
    flex: 1,
  },
  newsDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surfaceAlt,
  },
  groupStatText: {
    ...fontStyles.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  groupChevronWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupsScroll: {
    marginHorizontal: -16,
  },
  groupsScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  groupCardHorizontal: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 24,
    padding: 18,
    width: CARD_WIDTH,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.primaryAlpha08,
    position: 'relative',
    overflow: 'hidden',
  },
});
