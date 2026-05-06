import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight,
  Clock,
  Crown,
  Sparkles,
  Trophy,
  Users2,
} from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';
import AnimatedPressable from '../components/AnimatedPressable';
import Header from '../components/Header';
import AvatarCircle from '../components/AvatarCircle';
import EmptyStateCard from '../components/EmptyStateCard';
import { RankingSelectionSkeleton } from '../components/ListSkeletons';
import { colors, fontStyles } from '../theme';

function resolveDate(dateValue) {
  if (!dateValue) return null;
  if (dateValue?.toDate) return dateValue.toDate();

  const parsedDate = new Date(dateValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatQuizGroupDate(dateValue) {
  const resolvedDate = resolveDate(dateValue);
  if (!resolvedDate) return 'Sem data';

  return resolvedDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

function getEntryScore(entry) {
  return entry.correct || entry.totalCorrect || 0;
}

function getEntryName(quizGroup, entry) {
  if (quizGroup.rankingType === 'teams') {
    return entry.teamMembers?.map((member) => member.name).join(', ') || 'Time';
  }

  return entry.name || 'Usuário';
}

function OverviewPill({ icon: Icon, value, label }) {
  return (
    <View style={styles.overviewPill}>
      <View style={styles.overviewIconWrap}>
        <Icon size={14} color={colors.primaryLight} />
      </View>
      <View style={styles.overviewTextWrap}>
        <Text style={styles.overviewValue}>{value}</Text>
        <Text style={styles.overviewLabel}>{label}</Text>
      </View>
    </View>
  );
}

export default function SelectQuizGroupRankingScreen({ navigation, route }) {
  const { groupId, groupName } = route.params || {};
  const { getGroupQuizGroups } = useGroups();
  const [quizGroups, setQuizGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizGroups();
  }, [groupId]);

  const loadQuizGroups = async () => {
    try {
      setLoading(true);
      const groups = await getGroupQuizGroups(groupId);
      const withRanking = groups.filter((quizGroup) => quizGroup.ranking && quizGroup.ranking.length > 0);
      setQuizGroups(withRanking);
    } catch (error) {
      console.error('Error loading quiz groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const overview = useMemo(() => {
    const latestDate = [...quizGroups]
      .map((quizGroup) => resolveDate(quizGroup.endTime))
      .filter(Boolean)
      .sort((first, second) => second - first)[0] || null;

    const highestScore = quizGroups.reduce((highest, quizGroup) => {
      const quizHighest = (quizGroup.ranking || []).reduce((entryHighest, entry) => {
        return Math.max(entryHighest, getEntryScore(entry));
      }, 0);

      return Math.max(highest, quizHighest);
    }, 0);

    return {
      rankings: quizGroups.length,
      competitors: quizGroups.reduce((total, quizGroup) => total + (quizGroup.ranking?.length || 0), 0),
      latestDate: latestDate ? formatQuizGroupDate(latestDate) : '--',
      highestScore,
    };
  }, [quizGroups]);

  const handleQuizGroupSelect = (quizGroup) => {
    navigation.navigate('Ranking', {
      quizGroupId: quizGroup.id,
      groupId,
      groupName,
      quizGroupTitle: quizGroup.title,
    });
  };

  const handleOverallRanking = async () => {
    try {
      const allQuizGroups = await getGroupQuizGroups(groupId);
      const withRanking = allQuizGroups.filter((quizGroup) => quizGroup.ranking && quizGroup.ranking.length > 0);

      if (withRanking.length === 0) {
        return;
      }

      const userScores = {};

      withRanking.forEach((quizGroup) => {
        const sortedRanking = [...(quizGroup.ranking || [])].sort((first, second) => {
          if (quizGroup.rankingType === 'teams') {
            return getEntryScore(second) - getEntryScore(first);
          }

          return getEntryScore(second) - getEntryScore(first);
        });

        sortedRanking.forEach((entry, index) => {
          const entryId = quizGroup.rankingType === 'teams'
            ? entry.teamMembers?.map((member) => member.userId).join('_')
            : entry.userId;

          if (!userScores[entryId]) {
            userScores[entryId] = {
              userId: entry.userId || entryId,
              name: entry.name || 'Usuário',
              photoURL: entry.photoURL || entry.teamMembers?.[0]?.photoURL || null,
              totalCorrect: 0,
              totalQuizzes: 0,
              positions: [],
            };
          }

          userScores[entryId].totalCorrect += getEntryScore(entry);
          userScores[entryId].totalQuizzes += 1;
          userScores[entryId].positions.push(index + 1);
        });
      });

      const overallRanking = Object.values(userScores)
        .sort((first, second) => second.totalCorrect - first.totalCorrect)
        .map((entry, index) => ({
          ...entry,
          position: index + 1,
        }));

      const latestRanking = [...withRanking].sort((first, second) => {
        const firstTime = resolveDate(first.endTime)?.getTime() || 0;
        const secondTime = resolveDate(second.endTime)?.getTime() || 0;
        return secondTime - firstTime;
      })[0];

      navigation.navigate('Ranking', {
        quizGroupId: latestRanking.id,
        groupId,
        groupName,
        quizGroupTitle: 'Ranking Geral do Grupo',
        overallRanking,
      });
    } catch (error) {
      console.error('Error calculating overall ranking:', error);
    }
  };

  const heroContent = (
    <View style={styles.heroCard}>
      <View style={styles.heroAccentOrb} />
      <View style={styles.heroTopRow}>
        <View style={styles.heroEyebrow}>
          <Sparkles size={14} color={colors.primaryLight} />
          <Text style={styles.heroEyebrowText}>Panorama do grupo</Text>
        </View>
      </View>

      <Text style={styles.heroTitle}>
        Veja como o grupo {groupName || 'selecionado'} se saiu nos rankings.
      </Text>
      <Text style={styles.heroSubtitle}>
        Abra o ranking geral para uma leitura completa ou entre em cada quiz group
        para revisar os placares rodada por rodada.
      </Text>

      {!loading && overview.rankings > 0 ? (
        <View style={styles.overviewRow}>
          <OverviewPill icon={Trophy} value={overview.rankings} label="rankings" />
          <OverviewPill icon={Users2} value={overview.competitors} label="competidores" />
          <OverviewPill icon={Clock} value={overview.latestDate} label="última data" />
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
          title={groupName || 'Ranking'}
          subtitle="Selecione um quiz ou abra a visão geral do grupo"
          onBack={() => navigation.goBack()}
        >
          {heroContent}
        </Header>

        {loading ? (
          <View style={styles.cardsStack}>
            <RankingSelectionSkeleton count={3} includeOverallCard={true} />
          </View>
        ) : quizGroups.length === 0 ? (
          <EmptyStateCard
            icon={Trophy}
            eyebrow="Sem histórico ainda"
            title="Nenhum ranking foi liberado neste grupo"
            description="Assim que um quiz group for encerrado e pontuado, o histórico completo aparecerá aqui para consulta."
            primaryAction={{
              label: 'Voltar aos grupos',
              onPress: () => navigation.goBack(),
            }}
          />
        ) : (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTextWrap}>
                <Text style={styles.sectionTitle}>Visão geral</Text>
                <Text style={styles.sectionSubtitle}>
                  Comece pelo consolidado do grupo ou entre em um ranking específico.
                </Text>
              </View>
            </View>

            <AnimatedPressable
              style={styles.overallCardWrap}
              onPress={handleOverallRanking}
              activeScale={0.985}
            >
              <LinearGradient
                colors={[colors.primaryDark, colors.primary, '#6d28d9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.overallCard}
              >
                <View style={styles.overallGlow} />
                <View style={styles.overallHeader}>
                  <View style={styles.overallIconShell}>
                    <Trophy size={28} color={colors.textPrimary} />
                    <Crown size={16} color={colors.orangeAccent} style={styles.crownOverlay} />
                  </View>

                  <View style={styles.overallInfo}>
                    <Text style={styles.overallTitle}>Ranking geral do grupo</Text>
                    <Text style={styles.overallSubtitle}>
                      Some todos os resultados e veja quem lidera o histórico completo.
                    </Text>
                  </View>

                  <View style={styles.overallChevron}>
                    <ChevronRight size={18} color={colors.textPrimary} />
                  </View>
                </View>

                <View style={styles.overallMetaRow}>
                  <View style={styles.overallMetaPill}>
                    <Text style={styles.overallMetaText}>{overview.rankings} rankings</Text>
                  </View>
                  <View style={styles.overallMetaPill}>
                    <Text style={styles.overallMetaText}>pico de {overview.highestScore} acertos</Text>
                  </View>
                </View>
              </LinearGradient>
            </AnimatedPressable>

            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTextWrap}>
                <Text style={styles.sectionTitle}>Histórico de quiz groups</Text>
                <Text style={styles.sectionSubtitle}>
                  Acesse cada ranking individual para revisar os destaques de cada rodada.
                </Text>
              </View>
              <View style={styles.sectionCountPill}>
                <Text style={styles.sectionCountText}>{overview.rankings}</Text>
              </View>
            </View>

            <View style={styles.cardsStack}>
              {quizGroups.map((quizGroup) => {
                const sortedRanking = [...(quizGroup.ranking || [])].sort((first, second) => {
                  return getEntryScore(second) - getEntryScore(first);
                });

                return (
                  <AnimatedPressable
                    key={quizGroup.id}
                    style={styles.quizGroupCard}
                    onPress={() => handleQuizGroupSelect(quizGroup)}
                    activeScale={0.985}
                  >
                    <View style={styles.quizGroupAccentOrb} />

                    <View style={styles.quizGroupHeader}>
                      <View style={styles.cardIconContainer}>
                        <Trophy size={20} color={colors.primaryLight} />
                      </View>

                      <View style={styles.cardInfo}>
                        <View style={styles.quizTitleRow}>
                          <Text style={styles.cardTitle} numberOfLines={2}>
                            {quizGroup.title}
                          </Text>
                          <View style={styles.datePill}>
                            <Clock size={12} color={colors.textMuted} />
                            <Text style={styles.datePillText}>
                              {formatQuizGroupDate(quizGroup.endTime)}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.cardSubtitle}>
                          {quizGroup.rankingType === 'teams' ? 'Ranking em times' : 'Ranking individual'}
                          {'  '}•{'  '}
                          {sortedRanking.length} participantes
                        </Text>
                      </View>
                    </View>

                    <View style={styles.previewContainer}>
                      {sortedRanking.slice(0, 3).map((entry, index) => {
                        const displayName = getEntryName(quizGroup, entry);

                        return (
                          <View key={`${quizGroup.id}_${entry.userId || index}`} style={styles.previewRow}>
                            <View style={styles.previewLeft}>
                              <View style={[styles.positionBubble, index === 0 && styles.positionBubbleFirst]}>
                                <Text style={styles.positionBubbleText}>{index + 1}</Text>
                              </View>
                              <AvatarCircle
                                name={displayName}
                                photoURL={
                                  quizGroup.rankingType === 'teams'
                                    ? entry.teamMembers?.[0]?.photoURL || null
                                    : entry.photoURL || null
                                }
                                size={30}
                              />
                              <Text style={styles.previewName} numberOfLines={1}>
                                {displayName}
                              </Text>
                            </View>

                            <View style={styles.scorePill}>
                              <Text style={styles.scorePillText}>{getEntryScore(entry)} acertos</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.cardFooterText}>Abrir detalhes do ranking</Text>
                      <View style={styles.chevronWrap}>
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
    width: 116,
    height: 116,
    marginTop: -58,
    borderRadius: 58,
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
    lineHeight: 31,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  heroSubtitle: {
    ...fontStyles.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  overviewRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  overviewPill: {
    flex: 1,
    minHeight: 72,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overviewIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryAlpha12,
    marginBottom: 8,
  },
  overviewTextWrap: {
    gap: 2,
  },
  overviewValue: {
    ...fontStyles.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  overviewLabel: {
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
  cardsStack: {
    gap: 16,
  },
  overallCardWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 8,
  },
  overallCard: {
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  overallGlow: {
    position: 'absolute',
    right: -14,
    top: -18,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  overallHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  overallIconShell: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownOverlay: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  overallInfo: {
    flex: 1,
  },
  overallTitle: {
    ...fontStyles.bold,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  overallSubtitle: {
    ...fontStyles.regular,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.82)',
  },
  overallChevron: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overallMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  overallMetaPill: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  overallMetaText: {
    ...fontStyles.semibold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  quizGroupCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.primaryAlpha08,
    position: 'relative',
    overflow: 'hidden',
  },
  quizGroupAccentOrb: {
    position: 'absolute',
    right: -20,
    top: 22,
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primaryAlpha08,
  },
  quizGroupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryAlpha12,
    borderWidth: 1,
    borderColor: colors.primaryAlpha20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  quizTitleRow: {
    gap: 10,
  },
  cardTitle: {
    ...fontStyles.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  datePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  datePillText: {
    ...fontStyles.medium,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  cardSubtitle: {
    ...fontStyles.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: 10,
  },
  previewContainer: {
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  previewLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  positionBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.whiteAlpha10,
  },
  positionBubbleFirst: {
    backgroundColor: colors.orangeAccent,
  },
  positionBubbleText: {
    ...fontStyles.bold,
    fontSize: 12,
    color: colors.textPrimary,
  },
  previewName: {
    flex: 1,
    ...fontStyles.medium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  scorePill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.primaryAlpha12,
    borderWidth: 1,
    borderColor: colors.primaryAlpha20,
  },
  scorePillText: {
    ...fontStyles.semibold,
    fontSize: 12,
    color: colors.primaryLight,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cardFooterText: {
    ...fontStyles.semibold,
    fontSize: 14,
    color: colors.primaryLight,
  },
  chevronWrap: {
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
