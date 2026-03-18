import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors, shadows } from '../theme';
import { 
  Trophy, 
  Star, 
  Crown, 
  Users,
  CheckCircle,
  XCircle,
  ArrowRight,
  Share2,
  ChevronLeft
} from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../contexts/AuthContext';
import AvatarCircle from '../components/AvatarCircle';

const { width } = Dimensions.get('window');

export default function ResultRevealScreen({ navigation, route }) {
  const { quizGroupId } = route.params || {};
  const { currentUser } = useAuth();
  const { getQuizGroupDetails, loading: groupsLoading } = useGroups();
  
  const [quizGroup, setQuizGroup] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    loadData();
  }, [quizGroupId]);

  const loadData = async () => {
    if (!quizGroupId) {
      Alert.alert('Erro', 'ID do quiz não fornecido');
      navigation.goBack();
      return;
    }

    try {
      const data = await getQuizGroupDetails(quizGroupId);
      setQuizGroup(data);
    } catch (err) {
      console.error('Error loading result data:', err);
      Alert.alert('Erro', 'Não foi possível carregar os resultados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showResults && !loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [showResults, loading, currentQuestionIndex, showRanking]);

  const quizzes = quizGroup?.quizzesData || [];
  const ranking = quizGroup?.ranking || [];

  const userStats = useMemo(() => {
    if (!quizzes.length || !currentUser) return { points: 0, accuracy: 0, total: 0 };
    
    let correct = 0;
    let total = 0;

    quizzes.forEach(quiz => {
      const userVote = quiz.votes?.[currentUser.uid];
      if (userVote !== undefined) {
        total++;
        if (userVote === quiz.correctAnswer) {
          correct++;
        }
      }
    });

    return {
      points: correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      total
    };
  }, [quizzes, currentUser]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando Resultados...</Text>
      </View>
    );
  }

  const handleNext = () => {
    if (currentQuestionIndex < quizzes.length - 1) {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      scaleAnim.setValue(0.8);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowRanking(true);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (!showResults) {
    return (
      <View style={styles.container}>
        <View style={styles.revealContainer}>
          <Animated.View style={[styles.loadingIcon, { transform: [{ scale: scaleAnim }] }]}>
            <Trophy size={80} color={colors.primary} />
          </Animated.View>
          <Text style={styles.revealTitle}>O Quiz Terminou!</Text>
          <Text style={styles.revealSubtitle}>Preparado para ver quem ganhou?</Text>
          
          <TouchableOpacity 
            style={styles.revealButton}
            onPress={() => setShowResults(true)}
          >
            <Text style={styles.revealButtonText}>Ver Resultados</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showRanking) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ranking Final</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.summaryCard}>
            <Crown size={40} color="#FFD700" style={{ marginBottom: 12 }} />
            <Text style={styles.summaryTitle}>Parabéns!</Text>
            <Text style={styles.summarySubtitle}>Você fez sua parte!</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userStats.points}</Text>
                <Text style={styles.statLabel}>Pontos</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userStats.accuracy}%</Text>
                <Text style={styles.statLabel}>Precisão</Text>
              </View>
            </View>
          </View>

          <View style={styles.rankingList}>
            <Text style={styles.sectionTitle}>Classificação</Text>
            {ranking.map((item, index) => (
              <View key={index} style={styles.rankingItem}>
                <Text style={styles.positionText}>{index + 1}º</Text>
                <AvatarCircle size={40} name={item.name} />
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{item.name}</Text>
                  <Text style={styles.playerTitle}>{item.title}</Text>
                </View>
                <View style={styles.playerStats}>
                  <Text style={styles.playerPoints}>{item.points} pts</Text>
                  <Text style={styles.playerAccuracy}>{item.accuracy}%</Text>
                </View>
              </View>
            ))}
          </View>
          
          <TouchableOpacity 
            style={styles.finishButton}
            onPress={() => navigation.navigate('home')}
          >
            <Text style={styles.finishButtonText}>Voltar para o Início</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const currentQuiz = quizzes[currentQuestionIndex];
  const userVote = currentQuiz?.votes?.[currentUser?.uid];
  const isCorrect = userVote === currentQuiz?.correctAnswer;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Questão {currentQuestionIndex + 1}/{quizzes.length}</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.quizCard}>
          <Text style={styles.questionText}>{currentQuiz?.question}</Text>
          
          <View style={styles.optionsList}>
            {currentQuiz?.options.map((option, idx) => {
              const totalVotes = Object.values(currentQuiz.votes || {}).length;
              const optionVotes = Object.values(currentQuiz.votes || {}).filter(v => v === idx).length;
              const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
              const isOptionCorrect = idx === currentQuiz.correctAnswer;
              const isSelected = idx === userVote;

              return (
                <View key={idx} style={styles.optionRow}>
                  <View style={styles.optionHeader}>
                    <Text style={[styles.optionText, isOptionCorrect && styles.correctText]}>
                      {option}
                      {isOptionCorrect && " ✓"}
                    </Text>
                    <Text style={styles.percentageText}>{percentage}%</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${percentage}%`, backgroundColor: isOptionCorrect ? '#4CAF50' : '#3B82F6' }
                      ]} 
                    />
                  </View>
                  {isSelected && (
                    <Text style={[styles.yourVoteText, isCorrect ? { color: '#4CAF50' } : { color: '#EF4444' }]}>
                      Sua escolha: {isCorrect ? 'Correta!' : 'Incorreta'}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentQuestionIndex < quizzes.length - 1 ? 'Próxima Questão' : 'Ver Resultado Final'}
          </Text>
          <ArrowRight size={20} color="#FFFFFF" />
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  revealContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingIcon: {
    marginBottom: 24,
  },
  revealTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  revealSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 40,
    textAlign: 'center',
  },
  revealButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    ...shadows.primary,
  },
  revealButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#1f2937',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  rankingList: {
    marginBottom: 32,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  positionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textMuted,
    width: 30,
    marginRight: 8,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerTitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  playerStats: {
    alignItems: 'flex-end',
  },
  playerPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  playerAccuracy: {
    fontSize: 12,
    color: colors.textMuted,
  },
  quizCard: {
    backgroundColor: '#1f2937',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsList: {
    gap: 20,
  },
  optionRow: {
    width: '100%',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  finishButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  yourVoteText: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  correctText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  }
});

