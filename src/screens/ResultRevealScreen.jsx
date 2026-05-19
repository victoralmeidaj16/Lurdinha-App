import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Trophy,
  Crown,
  CheckCircle2,
  Circle,
  ArrowRight,
  ChevronLeft,
  BarChart3,
  Target,
} from 'lucide-react-native';
import { colors, shadows } from '../theme';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../contexts/AuthContext';
import AvatarCircle from '../components/AvatarCircle';
import { triggerImpact } from '../utils/haptics';
import { playSound } from '../utils/sounds';

const RESULT_GRADIENT = ['#8B5CF6', '#7C3AED'];

export default function ResultRevealScreen({ navigation, route }) {
  const { quizGroupId } = route.params || {};
  const { currentUser } = useAuth();
  const { getQuizGroupDetails } = useGroups();

  const [quizGroup, setQuizGroup] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [showRanking, setShowRanking] = useState(false);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    loadData();
  }, [quizGroupId]);

  useEffect(() => {
    if (loading) return;

    fadeAnim.setValue(0);
    slideAnim.setValue(24);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [loading, showIntro, showRanking, currentQuestionIndex, fadeAnim, slideAnim]);

  const loadData = async () => {
    if (!quizGroupId) {
      Alert.alert('Erro', 'ID do quiz não fornecido');
      navigation.goBack();
      return;
    }

    setLoading(true);
    try {
      const data = await getQuizGroupDetails(quizGroupId);
      setQuizGroup(data);
    } catch (error) {
      console.error('Error loading result data:', error);
      Alert.alert('Erro', 'Não foi possível carregar os resultados');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const quizzes = quizGroup?.quizzesData || [];

  const derivedRanking = useMemo(() => {
    if (!quizzes.length) return [];

    const scoreMap = {};

    quizzes.forEach((quiz) => {
      const correctAnswer = quiz.correctAnswer;
      if (correctAnswer === null || correctAnswer === undefined) return;

      Object.entries(quiz.votes || {}).forEach(([userId, optionIndex]) => {
        if (!scoreMap[userId]) {
          scoreMap[userId] = { userId, correct: 0, total: 0 };
        }

        scoreMap[userId].total += 1;
        if (optionIndex === correctAnswer) {
          scoreMap[userId].correct += 1;
        }
      });
    });

    return Object.values(scoreMap)
      .filter((item) => item.total > 0)
      .sort((a, b) => b.correct - a.correct)
      .map((item, index) => ({
        userId: item.userId,
        name: item.userId === currentUser?.uid ? 'Você' : `Jogador ${index + 1}`,
        correct: item.correct,
        total: item.total,
        points: item.correct,
        accuracy: Math.round((item.correct / item.total) * 100),
        title: index === 0 ? 'Mestre da Previsão' : index === 1 ? 'Vidente' : index === 2 ? 'Profeta' : 'Adivinho',
        position: index + 1,
      }));
  }, [quizzes, currentUser?.uid]);

  const ranking = (quizGroup?.ranking && quizGroup.ranking.length > 0)
    ? quizGroup.ranking
    : derivedRanking;

  const userStats = useMemo(() => {
    if (!quizzes.length || !currentUser) {
      return { points: 0, accuracy: 0, total: 0, position: null };
    }

    let correct = 0;
    let total = 0;

    quizzes.forEach((quiz) => {
      const userVote = quiz.votes?.[currentUser.uid];
      if (userVote !== undefined) {
        total += 1;
        if (userVote === quiz.correctAnswer) {
          correct += 1;
        }
      }
    });

    const rankingPosition = ranking.findIndex((item) => item.userId === currentUser.uid);

    return {
      points: correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      total,
      position: rankingPosition >= 0 ? rankingPosition + 1 : null,
    };
  }, [quizzes, currentUser, ranking]);

  const handleBack = () => navigation.goBack();

  useEffect(() => {
    if (showRanking) {
      playSound('winner');
    }
  }, [showRanking]);

  const handleNext = () => {
    triggerImpact('medium');
    if (currentQuestionIndex < quizzes.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    setShowRanking(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando resultados...</Text>
      </View>
    );
  }

  if (!quizzes.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Resultados</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyState}>
          <Trophy size={46} color={colors.primaryMuted} />
          <Text style={styles.emptyTitle}>Ainda não há dados suficientes</Text>
          <Text style={styles.emptySubtitle}>
            Os resultados aparecem aqui depois que o grupo tiver respostas registradas.
          </Text>
        </View>
      </View>
    );
  }

  if (showIntro) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0F0F12', '#18181B']} style={styles.background} />

        <View style={styles.revealContainer}>
          <LinearGradient colors={RESULT_GRADIENT} style={styles.revealBadge}>
            <Trophy size={42} color="#FFFFFF" />
          </LinearGradient>

          <Text style={styles.revealEyebrow}>RESULTADO PRONTO</Text>
          <Text style={styles.revealTitle}>O quiz terminou</Text>
          <Text style={styles.revealSubtitle}>
            Revele cada pergunta, veja como o grupo votou e confira o ranking final.
          </Text>

          <View style={styles.revealStatsRow}>
            <View style={styles.revealStatCard}>
              <BarChart3 size={18} color={colors.primaryMuted} />
              <Text style={styles.revealStatValue}>{quizzes.length}</Text>
              <Text style={styles.revealStatLabel}>questões</Text>
            </View>

            <View style={styles.revealStatCard}>
              <Target size={18} color={colors.primaryMuted} />
              <Text style={styles.revealStatValue}>{userStats.accuracy}%</Text>
              <Text style={styles.revealStatLabel}>precisão</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.revealButton}
            onPress={() => setShowIntro(false)}
            activeOpacity={0.85}
          >
            <LinearGradient colors={RESULT_GRADIENT} style={styles.revealButtonGradient}>
              <Text style={styles.revealButtonText}>Ver resultados</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showRanking) {
    const topThree = ranking.slice(0, 3);
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0F0F12', '#18181B']} style={styles.background} />

        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ranking Final</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Animated.ScrollView
          style={[styles.scrollView, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          contentContainerStyle={styles.scrollContent}
        >
          <LinearGradient colors={RESULT_GRADIENT} style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <Crown size={18} color="#FDE68A" />
                <Text style={styles.heroBadgeText}>
                  {userStats.position ? `${userStats.position}º lugar` : 'Seu desempenho'}
                </Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Resumo final</Text>
            <Text style={styles.heroSubtitle}>
              {quizGroup?.title || 'Grupo de quiz'} concluído.
            </Text>

            <View style={styles.heroStatsGrid}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{userStats.points}</Text>
                <Text style={styles.heroStatLabel}>acertos</Text>
              </View>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{userStats.accuracy}%</Text>
                <Text style={styles.heroStatLabel}>precisão</Text>
              </View>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{userStats.total}</Text>
                <Text style={styles.heroStatLabel}>respondidas</Text>
              </View>
            </View>
          </LinearGradient>

          {topThree.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Top jogadores</Text>
              <View style={styles.podiumRow}>
                {topThree.map((player, index) => (
                  <View
                    key={player.userId || `${player.name}-${index}`}
                    style={[
                      styles.podiumCard,
                      index === 0 && styles.podiumCardFirst,
                    ]}
                  >
                    <View style={styles.podiumAvatarWrap}>
                      <AvatarCircle size={56} name={player.name} />
                      <View style={styles.podiumPositionBadge}>
                        <Text style={styles.podiumPositionText}>{player.position || index + 1}</Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} style={styles.podiumName}>{player.name}</Text>
                    <Text style={styles.podiumTitle}>{player.title}</Text>
                    <Text style={styles.podiumPoints}>{player.points} pts</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Classificação completa</Text>
            {ranking.length > 0 ? (
              ranking.map((item, index) => (
                <View key={item.userId || `${item.name}-${index}`} style={styles.rankingItem}>
                  <Text style={styles.positionText}>{item.position || index + 1}º</Text>
                  <AvatarCircle size={42} name={item.name} />
                  <View style={styles.rankingInfo}>
                    <Text style={styles.playerName}>{item.name}</Text>
                    <Text style={styles.playerTitle}>{item.title}</Text>
                  </View>
                  <View style={styles.playerStats}>
                    <Text style={styles.playerPoints}>{item.points} pts</Text>
                    <Text style={styles.playerAccuracy}>{item.accuracy}%</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyRankingCard}>
                <Text style={styles.emptyRankingText}>O ranking final ainda não está disponível.</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => navigation.navigate('MainTabs', { screen: 'home' })}
            activeOpacity={0.85}
          >
            <Text style={styles.finishButtonText}>Voltar para o início</Text>
          </TouchableOpacity>
        </Animated.ScrollView>
      </View>
    );
  }

  const currentQuiz = quizzes[currentQuestionIndex];
  const userVote = currentQuiz?.votes?.[currentUser?.uid];
  const isCorrect = userVote === currentQuiz?.correctAnswer;
  const totalVotes = Object.values(currentQuiz?.votes || {}).length;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F0F12', '#18181B']} style={styles.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Questão {currentQuestionIndex + 1}/{quizzes.length}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient colors={RESULT_GRADIENT} style={styles.questionHero}>
          <Text style={styles.questionHeroEyebrow}>RESULTADO DA QUESTÃO</Text>
          <Text style={styles.questionHeroTitle}>{currentQuiz?.question || 'Pergunta sem título'}</Text>
        </LinearGradient>

        <View style={styles.questionMetaRow}>
          <View style={styles.metaChip}>
            <BarChart3 size={16} color={colors.primaryMuted} />
            <Text style={styles.metaChipText}>{totalVotes} respostas</Text>
          </View>

          {userVote !== undefined ? (
            <View style={[styles.metaChip, isCorrect ? styles.metaChipSuccess : styles.metaChipDanger]}>
              <CheckCircle2 size={16} color={isCorrect ? '#34D399' : '#F87171'} />
              <Text style={[styles.metaChipText, isCorrect ? styles.metaChipTextSuccess : styles.metaChipTextDanger]}>
                {isCorrect ? 'Você acertou' : 'Você errou'}
              </Text>
            </View>
          ) : (
            <View style={styles.metaChip}>
              <Circle size={14} color={colors.textMuted} />
              <Text style={styles.metaChipText}>Sem voto</Text>
            </View>
          )}
        </View>

        <View style={styles.quizCard}>
          <View style={styles.optionsList}>
            {currentQuiz?.options?.map((option, idx) => {
              const optionVotes = Object.values(currentQuiz.votes || {}).filter((vote) => vote === idx).length;
              const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
              const isOptionCorrect = idx === currentQuiz.correctAnswer;
              const isSelected = idx === userVote;

              return (
                <View
                  key={`${option}-${idx}`}
                  style={[
                    styles.optionCard,
                    isOptionCorrect && styles.optionCardCorrect,
                    isSelected && !isOptionCorrect && styles.optionCardSelectedWrong,
                  ]}
                >
                  <View style={styles.optionTopRow}>
                    <Text style={styles.optionText}>{option}</Text>
                    <View style={styles.optionPercentBadge}>
                      <Text style={styles.optionPercentText}>{percentage}%</Text>
                    </View>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${percentage}%` },
                        isOptionCorrect ? styles.progressFillCorrect : styles.progressFillNeutral,
                      ]}
                    />
                  </View>

                  <View style={styles.optionFooter}>
                    <Text style={styles.optionVotesText}>{optionVotes} voto(s)</Text>

                    <View style={styles.optionBadges}>
                      {isOptionCorrect && (
                        <View style={[styles.smallBadge, styles.smallBadgeCorrect]}>
                          <Text style={styles.smallBadgeCorrectText}>Resposta correta</Text>
                        </View>
                      )}
                      {isSelected && (
                        <View style={[styles.smallBadge, isCorrect ? styles.smallBadgeCorrect : styles.smallBadgeMuted]}>
                          <Text style={isCorrect ? styles.smallBadgeCorrectText : styles.smallBadgeMutedText}>
                            Sua escolha
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient colors={RESULT_GRADIENT} style={styles.nextButtonGradient}>
            <Text style={styles.nextButtonText}>
              {currentQuestionIndex < quizzes.length - 1 ? 'Próxima questão' : 'Ver ranking final'}
            </Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  revealContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  revealBadge: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    ...shadows.primary,
  },
  revealEyebrow: {
    color: colors.primaryMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  revealTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  revealSubtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 28,
  },
  revealStatsRow: {
    flexDirection: 'row',
    gap: 14,
    width: '100%',
    marginBottom: 28,
  },
  revealStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  revealStatValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  revealStatLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  revealButton: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  revealButtonGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  revealButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  questionHero: {
    borderRadius: 28,
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  questionHeroEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 12,
  },
  questionHeroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  questionMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metaChipSuccess: {
    borderColor: 'rgba(52, 211, 153, 0.28)',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  metaChipDanger: {
    borderColor: 'rgba(248, 113, 113, 0.28)',
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
  },
  metaChipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  metaChipTextSuccess: {
    color: '#34D399',
  },
  metaChipTextDanger: {
    color: '#F87171',
  },
  quizCard: {
    backgroundColor: '#17171B',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 18,
  },
  optionsList: {
    gap: 14,
  },
  optionCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  optionCardCorrect: {
    borderColor: 'rgba(52, 211, 153, 0.28)',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  optionCardSelectedWrong: {
    borderColor: 'rgba(248, 113, 113, 0.2)',
  },
  optionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  optionText: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  optionPercentBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  optionPercentText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  progressTrack: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressFillCorrect: {
    backgroundColor: '#34D399',
  },
  progressFillNeutral: {
    backgroundColor: colors.primaryMuted,
  },
  optionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  optionVotesText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  optionBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
    flex: 1,
  },
  smallBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallBadgeCorrect: {
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
  },
  smallBadgeMuted: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  smallBadgeCorrectText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '800',
  },
  smallBadgeMutedText: {
    color: '#D4D4D8',
    fontSize: 12,
    fontWeight: '800',
  },
  nextButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    marginBottom: 22,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(17, 24, 39, 0.22)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    marginBottom: 18,
  },
  heroStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroStatItem: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.22)',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 14,
  },
  podiumRow: {
    flexDirection: 'row',
    gap: 12,
  },
  podiumCard: {
    flex: 1,
    backgroundColor: '#17171B',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  podiumCardFirst: {
    borderColor: 'rgba(251, 191, 36, 0.28)',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  podiumAvatarWrap: {
    position: 'relative',
    marginBottom: 10,
  },
  podiumPositionBadge: {
    position: 'absolute',
    right: -6,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumPositionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  podiumName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  podiumTitle: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 8,
  },
  podiumPoints: {
    color: colors.primaryMuted,
    fontSize: 15,
    fontWeight: '900',
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17171B',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 10,
  },
  positionText: {
    width: 34,
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '900',
  },
  rankingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  playerTitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  playerStats: {
    alignItems: 'flex-end',
  },
  playerPoints: {
    color: colors.primaryMuted,
    fontSize: 15,
    fontWeight: '900',
  },
  playerAccuracy: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  emptyRankingCard: {
    backgroundColor: '#17171B',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyRankingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  finishButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    color: colors.primaryMuted,
    fontSize: 16,
    fontWeight: '800',
  },
});
