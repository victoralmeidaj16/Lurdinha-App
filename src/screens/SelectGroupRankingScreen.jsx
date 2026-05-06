import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ChevronRight, Sparkles, Trophy, Users } from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';
import AnimatedPressable from '../components/AnimatedPressable';
import Header from '../components/Header';
import EmptyStateCard from '../components/EmptyStateCard';
import { GroupSelectionSkeleton } from '../components/ListSkeletons';
import { colors, fontStyles } from '../theme';

function SummaryPill({ icon: Icon, value, label, accent = false }) {
  return (
    <View style={[styles.summaryPill, accent && styles.summaryPillAccent]}>
      <View style={[styles.summaryIconWrap, accent && styles.summaryIconWrapAccent]}>
        <Icon size={14} color={accent ? colors.primaryLight : colors.textMuted} />
      </View>
      <View style={styles.summaryTextWrap}>
        <Text style={styles.summaryValue}>{value}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
    </View>
  );
}

export default function SelectGroupRankingScreen({ navigation }) {
  const { getUserGroups } = useGroups();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const userGroups = await getUserGroups();
      setGroups(userGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    return groups.reduce((accumulator, group) => {
      accumulator.groups += 1;
      accumulator.members += group.stats?.totalMembers || group.members?.length || 0;
      accumulator.activeQuizzes += group.stats?.activeQuizzes || 0;
      return accumulator;
    }, {
      groups: 0,
      members: 0,
      activeQuizzes: 0,
    });
  }, [groups]);

  const handleGroupSelect = (group) => {
    navigation.navigate('SelectQuizGroupRanking', {
      groupId: group.id,
      groupName: group.name,
    });
  };

  const heroContent = (
    <View style={styles.heroCard}>
      <View style={styles.heroAccentOrb} />
      <View style={styles.heroTopRow}>
        <View style={styles.heroEyebrow}>
          <Sparkles size={14} color={colors.primaryLight} />
          <Text style={styles.heroEyebrowText}>Fluxo de ranking</Text>
        </View>
      </View>

      <Text style={styles.heroTitle}>Escolha o grupo que você quer analisar.</Text>
      <Text style={styles.heroSubtitle}>
        Abra o histórico de rankings da sua galera e encontre rapidamente os quiz groups
        que mais movimentaram cada círculo.
      </Text>

      {!loading && summary.groups > 0 ? (
        <View style={styles.summaryRow}>
          <SummaryPill
            icon={Users}
            value={summary.groups}
            label="grupos"
            accent={true}
          />
          <SummaryPill
            icon={Users}
            value={summary.members}
            label="membros"
          />
          <SummaryPill
            icon={Trophy}
            value={summary.activeQuizzes}
            label="ativos"
          />
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header
          title="Selecionar Grupo"
          subtitle="Escolha um grupo para visualizar os rankings"
          onBack={() => navigation.goBack()}
        >
          {heroContent}
        </Header>

        {loading ? (
          <View style={styles.groupsContainer}>
            <GroupSelectionSkeleton count={4} />
          </View>
        ) : groups.length === 0 ? (
          <EmptyStateCard
            icon={Users}
            eyebrow="Sem grupos por aqui"
            title="Você ainda não tem rankings para explorar"
            description="Entre em um grupo ou crie um novo espaço para acompanhar placares, resultados e lideranças."
            primaryAction={{
              label: 'Ver grupos',
              onPress: () => navigation.navigate('groups'),
            }}
            secondaryAction={{
              label: 'Entrar em grupo',
              onPress: () => navigation.navigate('SearchGroups'),
            }}
          />
        ) : (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTextWrap}>
                <Text style={styles.sectionTitle}>Seus grupos</Text>
                <Text style={styles.sectionSubtitle}>
                  Selecione onde deseja abrir o ranking geral e o histórico de quiz groups.
                </Text>
              </View>
              <View style={styles.sectionCountPill}>
                <Text style={styles.sectionCountText}>{summary.groups}</Text>
              </View>
            </View>

            <View style={styles.groupsContainer}>
              {groups.map((group) => {
                const memberCount = group.stats?.totalMembers || group.members?.length || 0;
                const activeQuizzes = group.stats?.activeQuizzes || 0;

                return (
                  <AnimatedPressable
                    key={group.id}
                    style={styles.groupCard}
                    onPress={() => handleGroupSelect(group)}
                    activeScale={0.985}
                  >
                    <View style={styles.groupCardAccentOrb} />

                    <View style={styles.groupHeader}>
                      <View
                        style={[
                          styles.groupBadge,
                          { backgroundColor: group.color || colors.primary },
                        ]}
                      >
                        <Text style={styles.groupBadgeText}>{group.badge || '👥'}</Text>
                      </View>

                      <View style={styles.groupInfo}>
                        <Text style={styles.groupName}>{group.name}</Text>
                        <Text style={styles.groupDescription} numberOfLines={2}>
                          {group.description ||
                            'Explore o ranking geral do grupo e os placares dos quiz groups mais recentes.'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.groupMetaRow}>
                      <View style={styles.groupMetaPill}>
                        <Users size={14} color={colors.textMuted} />
                        <Text style={styles.groupMetaText}>{memberCount} membros</Text>
                      </View>
                      <View style={styles.groupMetaPill}>
                        <Trophy size={14} color={colors.primaryLight} />
                        <Text style={styles.groupMetaText}>{activeQuizzes} ativos</Text>
                      </View>
                    </View>

                    <View style={styles.groupFooter}>
                      <Text style={styles.groupActionText}>Abrir ranking do grupo</Text>
                      <View style={styles.groupChevronWrap}>
                        <ChevronRight size={16} color={colors.textMuted} />
                      </View>
                    </View>
                  </AnimatedPressable>
                );
              })}
            </View>
          </>
        )}
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
  heroCard: {
    marginTop: 18,
    marginHorizontal: -4,
    borderRadius: 28,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.primaryAlpha15,
    overflow: 'hidden',
    position: 'relative',
  },
  heroAccentOrb: {
    position: 'absolute',
    right: -24,
    top: '50%',
    width: 108,
    height: 108,
    marginTop: -54,
    borderRadius: 54,
    backgroundColor: colors.primaryAlpha08,
    borderWidth: 1,
    borderColor: colors.primaryAlpha12,
  },
  heroTopRow: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  heroEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.primaryAlpha12,
    borderWidth: 1,
    borderColor: colors.primaryAlpha20,
  },
  heroEyebrowText: {
    ...fontStyles.semibold,
    fontSize: 12,
    color: colors.primaryLight,
    letterSpacing: 0.3,
  },
  heroTitle: {
    ...fontStyles.headingBold,
    fontSize: 25,
    lineHeight: 30,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  heroSubtitle: {
    ...fontStyles.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  summaryPill: {
    flex: 1,
    minHeight: 72,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryPillAccent: {
    borderColor: colors.primaryAlpha20,
    backgroundColor: colors.primaryAlpha08,
  },
  summaryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.whiteAlpha10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryIconWrapAccent: {
    backgroundColor: colors.primaryAlpha12,
  },
  summaryTextWrap: {
    gap: 2,
  },
  summaryValue: {
    ...fontStyles.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  summaryLabel: {
    ...fontStyles.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  sectionTextWrap: {
    flex: 1,
  },
  sectionTitle: {
    ...fontStyles.bold,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  sectionSubtitle: {
    ...fontStyles.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  sectionCountPill: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
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
  groupsContainer: {
    gap: 16,
  },
  groupCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.primaryAlpha08,
    position: 'relative',
    overflow: 'hidden',
  },
  groupCardAccentOrb: {
    position: 'absolute',
    right: -18,
    top: 18,
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primaryAlpha08,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  groupBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },
  groupBadgeText: {
    fontSize: 22,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    ...fontStyles.bold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  groupDescription: {
    ...fontStyles.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  groupMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  groupMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupMetaText: {
    ...fontStyles.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  groupFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  groupActionText: {
    ...fontStyles.semibold,
    fontSize: 14,
    color: colors.primaryLight,
  },
  groupChevronWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.whiteAlpha10,
    borderWidth: 1,
    borderColor: colors.whiteAlpha10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
