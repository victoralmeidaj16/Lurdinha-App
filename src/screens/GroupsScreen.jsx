import React, { useState, useEffect } from 'react';
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
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

export default function GroupsScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const { getUserGroups } = useGroups();
  const { userData } = useUserData();

  useEffect(() => {
    loadGroups();
  }, [userData?.groups]);


  const loadGroups = async () => {
    try {
      setError(false);
      setLoading(true);
      const userGroups = await getUserGroups();
      setGroups(userGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

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
          subtitle="Organize sua galera, acompanhe as enquetes ativas e dispute posições no ranking"
          rightAction={() => navigation.navigate('Settings')}
          rightActionIcon={Settings}
        />

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <View style={styles.statGlow} />
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

        {/* Action Buttons */}
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
            <Users size={20} color={colors.primaryDark} />
            <Text style={styles.secondaryButtonText}>Entrar em Grupo</Text>
          </AnimatedPressable>
        </View>

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
                label: 'Entrar em grupo',
                onPress: handleJoinGroup,
              }}
            />
          ) : (
            groups.map((group) => {
              const memberCount = group.stats?.totalMembers || group.members?.length || 0;
              const activeQuizzes = group.stats?.activeQuizzes || 0;

              return (
                <TouchableOpacity
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => handleGroupPress(group)}
                  activeOpacity={0.8}
                >
                  <View style={styles.groupCardAccentOrb} />
                  <View style={styles.groupHeader}>
                    <View style={styles.groupInfo}>
                      <View style={[styles.groupBadge, { backgroundColor: group.color || colors.primary }]}>
                        <Text style={styles.groupBadgeText}>{group.badge || '👥'}</Text>
                      </View>
                      <View style={styles.groupDetails}>
                        <Text style={styles.groupName}>{group.name}</Text>
                        {group.description ? (
                          <Text style={styles.groupDescription} numberOfLines={1}>
                            {group.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.groupChevronWrap}>
                      <ChevronRight size={16} color={colors.textDim} />
                    </View>
                  </View>

                  <View style={styles.groupStats}>
                    <View style={styles.groupStatPill}>
                      <Users size={16} color={colors.textMuted} />
                      <Text style={styles.groupStatText}>{memberCount} membros</Text>
                    </View>
                    <View style={styles.groupStatPill}>
                      <Clock size={16} color={colors.textMuted} />
                      <Text style={styles.groupStatText}>{activeQuizzes} quiz ativos</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

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
  statGlow: {
    position: 'absolute',
    top: -18,
    right: -18,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryAlpha08,
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
    marginBottom: 32,
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
    marginBottom: 32,
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
  groupCardAccentOrb: {
    position: 'absolute',
    right: -18,
    top: '50%',
    width: 82,
    height: 82,
    marginTop: -41,
    borderRadius: 41,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
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
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupBadgeText: {
    fontSize: 20,
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
  groupStats: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  groupStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
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
