import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { 
  Trophy, 
  Star, 
  Crown, 
  Users,
  CheckCircle,
  XCircle,
  ArrowRight,
  Share2
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function ResultRevealScreen() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [slideAnim] = useState(new Animated.Value(50));

  const quizResults = [
    {
      question: "O que o Zé vai fazer na festa?",
      options: [
        { text: "Beber skol 😅", votes: 45, isCorrect: false },
        { text: "Beber skol 😊", votes: 12, isCorrect: false },
        { text: "Falar com a sogra 😬", votes: 8, isCorrect: true },
        { text: "Dançar pagode 😎", votes: 35, isCorrect: false }
      ],
      correctAnswer: "Falar com a sogra 😬",
      yourAnswer: "Falar com a sogra 😬",
      points: 50
    },
    {
      question: "Quem vai chegar atrasado?",
      options: [
        { text: "Tio João", votes: 60, isCorrect: true },
        { text: "Prima Maria", votes: 15, isCorrect: false },
        { text: "Vovó", votes: 20, isCorrect: false },
        { text: "Ninguém", votes: 5, isCorrect: false }
      ],
      correctAnswer: "Tio João",
      yourAnswer: "Tio João",
      points: 50
    }
  ];

  const ranking = [
    { name: "Ana", points: 100, accuracy: 100, title: "Mestre da Previsão" },
    { name: "Carlos", points: 85, accuracy: 85, title: "Vidente do Café" },
    { name: "Maria", points: 70, accuracy: 70, title: "Profeta do Tio" },
    { name: "João", points: 50, accuracy: 50, title: "Adivinho Iniciante" }
  ];

  useEffect(() => {
    if (showResults) {
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
  }, [showResults]);

  const handleNextQuestion = () => {
    if (currentQuestion < quizResults.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowRanking(true);
    }
  };

  const handleShare = () => {
    Alert.alert('Compartilhar', 'Resultados compartilhados!');
  };

  const handleBack = () => {
    Alert.alert('Voltar', 'Funcionalidade de navegação será implementada');
  };

  const currentResult = quizResults[currentQuestion];
  const totalPoints = quizResults.reduce((sum, result) => sum + result.points, 0);
  const totalAccuracy = Math.round((quizResults.filter(r => r.yourAnswer === r.correctAnswer).length / quizResults.length) * 100);

  if (!showResults) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Animated.View 
            style={[
              styles.loadingIcon,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim
              }
            ]}
          >
            <Trophy size={60} color="#FF6B35" />
          </Animated.View>
          <Text style={styles.loadingTitle}>Revelando Resultados...</Text>
          <Text style={styles.loadingSubtitle}>Preparando as surpresas!</Text>
          
          <TouchableOpacity 
            style={styles.revealButton}
            onPress={() => setShowResults(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.revealButtonText}>Revelar Agora!</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showRanking) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowRight size={24} color="#B0B0B0" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ranking Final</Text>
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Share2 size={24} color="#8A4F9E" />
            </TouchableOpacity>
          </View>

          {/* Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Crown size={32} color="#FF6B35" />
              <Text style={styles.summaryTitle}>Parabéns!</Text>
            </View>
            <Text style={styles.summarySubtitle}>
              Você acertou {totalAccuracy}% das previsões
            </Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatNumber}>{totalPoints}</Text>
                <Text style={styles.summaryStatLabel}>Pontos</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatNumber}>{totalAccuracy}%</Text>
                <Text style={styles.summaryStatLabel}>Precisão</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatNumber}>{quizResults.length}</Text>
                <Text style={styles.summaryStatLabel}>Quiz</Text>
              </View>
            </View>
          </View>

          {/* Ranking */}
          <View style={styles.rankingContainer}>
            <Text style={styles.rankingTitle}>Ranking do Grupo</Text>
            {ranking.map((player, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.rankingItem,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { translateY: slideAnim },
                      { scale: scaleAnim }
                    ]
                  }
                ]}
              >
                <View style={styles.rankingPosition}>
                  <Text style={styles.rankingPositionText}>{index + 1}</Text>
                </View>
                <View style={styles.rankingInfo}>
                  <Text style={styles.rankingName}>{player.name}</Text>
                  <Text style={styles.rankingTitle}>{player.title}</Text>
                </View>
                <View style={styles.rankingStats}>
                  <Text style={styles.rankingPoints}>{player.points} pts</Text>
                  <Text style={styles.rankingAccuracy}>{player.accuracy}%</Text>
                </View>
                {index === 0 && (
                  <View style={styles.winnerBadge}>
                    <Crown size={20} color="#FF6B35" />
                  </View>
                )}
              </Animated.View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Jogar Novamente</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Criar Novo Quiz</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowRight size={24} color="#B0B0B0" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Resultado {currentQuestion + 1} de {quizResults.length}
          </Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Share2 size={24} color="#8A4F9E" />
          </TouchableOpacity>
        </View>

        {/* Question Result */}
        <Animated.View 
          style={[
            styles.resultCard,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <Text style={styles.questionText}>{currentResult.question}</Text>
          
          <View style={styles.optionsContainer}>
            {currentResult.options.map((option, index) => (
              <View key={index} style={styles.optionResult}>
                <View style={styles.optionHeader}>
                  <View style={styles.optionInfo}>
                    <View style={[
                      styles.optionIcon,
                      option.isCorrect ? styles.optionIconCorrect : styles.optionIconIncorrect
                    ]}>
                      {option.isCorrect ? (
                        <CheckCircle size={20} color="#4CAF50" />
                      ) : (
                        <XCircle size={20} color="#E53935" />
                      )}
                    </View>
                    <Text style={styles.optionText}>{option.text}</Text>
                  </View>
                  <Text style={styles.optionVotes}>{option.votes}%</Text>
                </View>
                <View style={styles.optionBar}>
                  <View 
                    style={[
                      styles.optionBarFill,
                      { 
                        width: `${option.votes}%`,
                        backgroundColor: option.isCorrect ? '#4CAF50' : '#E53935'
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Your Result */}
          <View style={styles.yourResult}>
            <View style={styles.yourResultHeader}>
              <Text style={styles.yourResultTitle}>Sua Resposta</Text>
              <View style={[
                styles.yourResultBadge,
                currentResult.yourAnswer === currentResult.correctAnswer 
                  ? styles.yourResultBadgeCorrect 
                  : styles.yourResultBadgeIncorrect
              ]}>
                {currentResult.yourAnswer === currentResult.correctAnswer ? (
                  <CheckCircle size={16} color="#4CAF50" />
                ) : (
                  <XCircle size={16} color="#E53935" />
                )}
                <Text style={[
                  styles.yourResultBadgeText,
                  currentResult.yourAnswer === currentResult.correctAnswer 
                    ? styles.yourResultBadgeTextCorrect 
                    : styles.yourResultBadgeTextIncorrect
                ]}>
                  {currentResult.yourAnswer === currentResult.correctAnswer ? 'Acertou!' : 'Errou'}
                </Text>
              </View>
            </View>
            <Text style={styles.yourResultAnswer}>{currentResult.yourAnswer}</Text>
            <Text style={styles.yourResultPoints}>+{currentResult.points} pontos</Text>
          </View>
        </Animated.View>

        {/* Next Button */}
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNextQuestion}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {currentQuestion < quizResults.length - 1 ? 'Próximo Resultado' : 'Ver Ranking'}
          </Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingIcon: {
    marginBottom: 32,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    marginBottom: 32,
    textAlign: 'center',
  },
  revealButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  revealButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
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
  optionsContainer: {
    marginBottom: 24,
  },
  optionResult: {
    marginBottom: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionIconCorrect: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  optionIconIncorrect: {
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
  },
  optionText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  optionVotes: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  optionBar: {
    height: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  optionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  yourResult: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
  },
  yourResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  yourResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  yourResultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  yourResultBadgeCorrect: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  yourResultBadgeIncorrect: {
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
  },
  yourResultBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  yourResultBadgeTextCorrect: {
    color: '#4CAF50',
  },
  yourResultBadgeTextIncorrect: {
    color: '#E53935',
  },
  yourResultAnswer: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  yourResultPoints: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#8A4F9E',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summarySubtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    marginBottom: 24,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 32,
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  summaryStatLabel: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  rankingContainer: {
    marginBottom: 24,
  },
  rankingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  rankingPosition: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8A4F9E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankingPositionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rankingInfo: {
    flex: 1,
  },
  rankingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  rankingStats: {
    alignItems: 'flex-end',
  },
  rankingPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 2,
  },
  rankingAccuracy: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  winnerBadge: {
    marginLeft: 8,
  },
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#8A4F9E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8A4F9E',
  },
  secondaryButtonText: {
    color: '#8A4F9E',
    fontSize: 16,
    fontWeight: '600',
  },
});

