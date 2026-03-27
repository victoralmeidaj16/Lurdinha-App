import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
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
import { useGroups } from '../hooks/useGroups';
import { useUserData } from '../hooks/useUserData';
import AnimatedPressable from '../components/AnimatedPressable';
import Header from '../components/Header';
import EmptyStateCard from '../components/EmptyStateCard';
import { colors, fontStyles } from '../theme';
import { SkeletonList } from '../components/SkeletonLoader';
import NetworkRetry from '../components/NetworkRetry';

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
          subtitle="Preveja comportamentos e ganhe pontos com seus grupos"
          rightAction={() => navigation.navigate('Settings')}
          rightActionIcon={Settings}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Header>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Trophy size={20} color={colors.orange} />
            </View>
            <Text style={styles.statNumber}>{stats.totalPoints.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Pontos Totais</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Star size={20} color={colors.orange} />
            </View>
            <Text style={styles.statNumber}>{stats.accuracy}%</Text>
            <Text style={styles.statLabel}>Taxa de Acerto</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Crown size={20} color={colors.orange} />
            </View>
            <Text style={styles.statNumber}>{stats.titles}</Text>
            <Text style={styles.statLabel}>Títulos</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <AnimatedPressable
            style={styles.primaryButton}
            onPress={handleCreateGroup}
            activeScale={0.96}
          >
            <Plus size={20} color={colors.textPrimary} />
            <Text style={styles.primaryButtonText}>Criar Grupo</Text>
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
          <Text style={styles.sectionTitle}>Seus Grupos</Text>

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
                    <ChevronRight size={20} color={colors.textMuted} />
                  </View>

                  <View style={styles.groupStats}>
                    <View style={styles.groupStat}>
                      <Users size={16} color={colors.textMuted} />
                      <Text style={styles.groupStatText}>{memberCount} membros</Text>
                    </View>
                    <View style={styles.groupStat}>
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
    paddingBottom: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  logo: {
    width: 48,
    height: 48,
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
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryAlpha12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    ...fontStyles.bold,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    ...fontStyles.regular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
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
    backgroundColor: 'transparent',
    borderRadius: 12,
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
  sectionTitle: {
    ...fontStyles.bold,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  groupCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 18,
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
    gap: 16,
    marginBottom: 16,
  },
  groupStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupStatText: {
    ...fontStyles.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
});
