import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { 
  ArrowLeft, 
  CheckCircle,
  Trophy,
  Clock,
  Edit,
  Trash2,
  Eye,
  Ghost,
  Gift,
  Users2,
  XCircle,
} from 'lucide-react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../contexts/AuthContext';
import OptionCard from '../components/OptionCard';
import AvatarCircle from '../components/AvatarCircle';

export default function QuizGroupDetailScreen({ navigation, route }) {
  const { quizGroupId } = route.params;
  const { currentUser } = useAuth();
  const { 
    getQuizGroupDetails, 
    voteOnQuiz,
    markCorrectAnswer,
    endQuizGroup,
    deleteQuizGroup,
    loading 
  } = useGroups();
  
  const [quizGroup, setQuizGroup] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadQuizGroupData();
  }, [quizGroupId]);

  // Listeners em tempo real para atualizar votos e avatares
  useEffect(() => {
    if (!quizGroup || !quizGroup.quizzesData || quizGroup.quizzesData.length === 0) {
      return;
    }

    const unsubscribes = quizGroup.quizzesData.map(quiz => {
      return onSnapshot(
        doc(db, 'quizzes', quiz.id),
        (snapshot) => {
          if (snapshot.exists()) {
            const updatedQuiz = {
              id: snapshot.id,
              ...snapshot.data()
            };
            
            // Atualizar quiz específico no estado
            setQuizGroup(prev => {
              if (!prev) return prev;
              const updatedQuizzes = prev.quizzesData.map(q =>
                q.id === quiz.id ? updatedQuiz : q
              );
              
              return {
                ...prev,
                quizzesData: updatedQuizzes
              };
            });
            
            // Atualizar respostas selecionadas se necessário
            if (updatedQuiz.votes && updatedQuiz.votes[currentUser?.uid] !== undefined) {
              setSelectedAnswers(prev => ({
                ...prev,
                [quiz.id]: updatedQuiz.votes[currentUser.uid]
              }));
            }
          }
        }
      );
    });
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [quizGroup?.id, quizGroup?.quizzesData?.map(q => q.id).join(',')]);

  const loadQuizGroupData = async () => {
    try {
      const data = await getQuizGroupDetails(quizGroupId);
      setQuizGroup(data);
      
      // Inicializar respostas selecionadas com votos existentes do usuário
      const userAnswers = {};
      if (data.quizzesData) {
        data.quizzesData.forEach(quiz => {
          if (quiz.votes && quiz.votes[currentUser?.uid] !== undefined) {
            userAnswers[quiz.id] = quiz.votes[currentUser?.uid];
          }
        });
      }
      setSelectedAnswers(userAnswers);
    } catch (error) {
      Alert.alert('Erro', error.message);
      navigation.goBack();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuizGroupData();
    setRefreshing(false);
  };

  const handleVote = async (quizId, optionIndex) => {
    try {
      await voteOnQuiz(quizId, optionIndex);
      setSelectedAnswers(prev => ({ ...prev, [quizId]: optionIndex }));
      Alert.alert('Sucesso', 'Voto registrado!');
      await loadQuizGroupData();
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleMarkCorrect = async (quizId, optionIndex) => {
    Alert.alert(
      'Confirmar',
      'Deseja marcar esta opção como resposta correta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await markCorrectAnswer(quizGroupId, quizId, optionIndex);
              Alert.alert('Sucesso', 'Resposta correta marcada!');
              await loadQuizGroupData();
            } catch (error) {
              Alert.alert('Erro', error.message);
            }
          }
        }
      ]
    );
  };

  const handleEndQuizGroup = () => {
    Alert.alert(
      'Encerrar Grupo de Quiz',
      'Tem certeza que deseja encerrar este grupo de quiz?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: async () => {
            try {
              await endQuizGroup(quizGroupId);
              Alert.alert('Sucesso', 'Grupo de quiz encerrado');
              await loadQuizGroupData();
            } catch (error) {
              Alert.alert('Erro', error.message);
            }
          }
        }
      ]
    );
  };

  const handleDeleteQuizGroup = () => {
    Alert.alert(
      'Deletar Grupo de Quiz',
      'Tem certeza que deseja deletar este grupo de quiz? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteQuizGroup(quizGroupId, quizGroup.groupId);
              Alert.alert('Sucesso', 'Grupo de quiz deletado');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Erro', error.message);
            }
          }
        }
      ]
    );
  };

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'normal': return <Eye size={16} color="#8A4F9E" />;
      case 'ghost': return <Ghost size={16} color="#8A4F9E" />;
      case 'surprise': return <Gift size={16} color="#8A4F9E" />;
      case 'challenge': return <Users2 size={16} color="#8A4F9E" />;
      default: return <Eye size={16} color="#8A4F9E" />;
    }
  };

  const getModeLabel = (mode) => {
    switch (mode) {
      case 'normal': return 'Normal';
      case 'ghost': return 'Ghost';
      case 'surprise': return 'Surpresa';
      case 'challenge': return 'Desafios';
      default: return 'Normal';
    }
  };

  if (!quizGroup) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  const isCreator = quizGroup.createdBy === currentUser?.uid;
  const canMarkCorrect = isCreator || quizGroup.allowEveryoneToMarkCorrect;
  const allQuizzesHaveCorrectAnswer = quizGroup.quizzesData?.every(q => 
    q.correctAnswer !== null && q.correctAnswer !== undefined
  );
  const hasRespondedAll = quizGroup.quizzesData?.every(q =>
    selectedAnswers[q.id] !== undefined
  );

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
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <ArrowLeft size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{quizGroup.title}</Text>
            </View>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.modeBadge}>
              {getModeIcon(quizGroup.mode)}
              <Text style={styles.modeText}>{getModeLabel(quizGroup.mode)}</Text>
            </View>
            {quizGroup.status === 'active' && (
              <View style={styles.timeBadge}>
                <Clock size={14} color="#4CAF50" />
                <Text style={styles.timeText}>
                  {Math.ceil((quizGroup.endTime?.toDate ? quizGroup.endTime.toDate() - new Date() : 0) / (1000 * 60 * 60))}h restantes
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Enquetes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Enquetes ({quizGroup.quizzesData?.length || 0})
          </Text>

          {quizGroup.quizzesData?.map((quiz, quizIndex) => {
            const userVote = selectedAnswers[quiz.id];
            const hasVoted = userVote !== undefined;
            const hasCorrectAnswer = quiz.correctAnswer !== null && quiz.correctAnswer !== undefined;
            const isActive = quiz.status === 'active' && quizGroup.status === 'active';

            return (
              <View key={quiz.id} style={styles.quizCard}>
                <View style={styles.quizHeader}>
                  <Text style={styles.quizQuestion}>
                    {quizIndex + 1}. {quiz.question}
                  </Text>
                  {hasVoted && (
                    <View style={styles.votedBadge}>
                      <CheckCircle size={16} color="#4CAF50" />
                    </View>
                  )}
                </View>

                <View style={styles.optionsContainer}>
                  {quiz.options.map((option, optionIndex) => {
                    const isSelected = userVote === optionIndex;
                    const isCorrect = hasCorrectAnswer && optionIndex === quiz.correctAnswer;
                    const showAvatars = quizGroup.mode === 'normal';
                    
                    const voterUserIds = quiz.voterAvatars && quiz.voterAvatars[optionIndex] 
                      ? quiz.voterAvatars[optionIndex] 
                      : [];
                    
                    return (
                      <View key={optionIndex} style={styles.optionWrapper}>
                        <OptionCard
                          option={option}
                          index={optionIndex}
                          selected={isSelected}
                          onSelect={(idx) => !hasVoted && isActive && handleVote(quiz.id, idx)}
                          mode={quizGroup.mode}
                          correctAnswer={hasCorrectAnswer ? quiz.correctAnswer : null}
                          disabled={hasVoted || !isActive}
                          voterUserIds={voterUserIds}
                          voterDetails={quiz.voterDetails || []}
                        />
                        {canMarkCorrect && !hasCorrectAnswer && isActive && (
                          <TouchableOpacity
                            style={styles.markCorrectButton}
                            onPress={() => handleMarkCorrect(quiz.id, optionIndex)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.markCorrectText}>Marcar como correta</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>

                {hasCorrectAnswer && (
                  <View style={styles.correctAnswerBadge}>
                    <Text style={styles.correctAnswerText}>
                      ✓ Resposta correta marcada
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Modo Desafios - Times */}
        {quizGroup.mode === 'challenge' && quizGroup.challengeConfig?.teams && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Times</Text>
            <View style={styles.teamsContainer}>
              {quizGroup.challengeConfig.teams.map((team, teamIndex) => {
                const isUserInTeam = team.includes(currentUser?.uid);
                return (
                  <View key={teamIndex} style={styles.teamCard}>
                    <Text style={styles.teamTitle}>
                      Time {teamIndex + 1} {isUserInTeam && '(Você)'}
                    </Text>
                    <View style={styles.teamMembers}>
                      {team.map((memberId, idx) => {
                        const member = quizGroup.teamMemberDetails?.find(
                          m => m.uid === memberId || m.id === memberId
                        );
                        const displayName = member?.displayName || member?.name || memberId.substring(0, 2);
                        
                        return (
                          <AvatarCircle
                            key={memberId}
                            name={displayName}
                            size={32}
                            style={styles.teamMemberAvatar}
                          />
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Ranking */}
        {allQuizzesHaveCorrectAnswer && quizGroup.ranking && quizGroup.ranking.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {quizGroup.rankingType === 'teams' ? 'Ranking de Times' : 'Ranking Individual'}
            </Text>
            <View style={styles.rankingContainer}>
              {quizGroup.ranking.map((entry, index) => {
                // Ranking por times (modo Desafios)
                if (quizGroup.rankingType === 'teams' && entry.teamMembers) {
                  return (
                    <View
                      key={`team-${entry.teamIndex}`}
                      style={[
                        styles.rankingCard,
                        entry.isWinner && styles.rankingCardTop
                      ]}
                    >
                      <View style={styles.rankingPosition}>
                        {entry.isWinner && <Trophy size={24} color="#FFD700" />}
                        {!entry.isWinner && (
                          <Text style={styles.rankingPositionText}>#{entry.position}</Text>
                        )}
                      </View>
                      <View style={styles.rankingInfo}>
                        <Text style={styles.rankingName}>Time {entry.teamIndex + 1}</Text>
                        <View style={styles.teamRankingMembers}>
                          {entry.teamMembers.map((member, idx) => (
                            <Text key={member.userId} style={styles.teamMemberName}>
                              {member.name}{idx < entry.teamMembers.length - 1 ? ', ' : ''}
                            </Text>
                          ))}
                        </View>
                      </View>
                      <View style={styles.rankingStats}>
                        <Text style={styles.rankingScore}>
                          {entry.totalCorrect}/{entry.totalVotes}
                        </Text>
                        <Text style={styles.rankingAccuracy}>
                          {entry.accuracy}%
                        </Text>
                      </View>
                    </View>
                  );
                }
                
                // Ranking individual (modo Normal/Ghost/Surprise)
                return (
                  <View
                    key={entry.userId}
                    style={[
                      styles.rankingCard,
                      index < 3 && styles.rankingCardTop
                    ]}
                  >
                    <View style={styles.rankingPosition}>
                      {index === 0 && <Trophy size={24} color="#FFD700" />}
                      {index === 1 && <Trophy size={24} color="#C0C0C0" />}
                      {index === 2 && <Trophy size={24} color="#CD7F32" />}
                      {index > 2 && (
                        <Text style={styles.rankingPositionText}>#{index + 1}</Text>
                      )}
                    </View>
                    <View style={styles.rankingInfo}>
                      <Text style={styles.rankingName}>{entry.name}</Text>
                      <Text style={styles.rankingTitle}>{entry.title}</Text>
                    </View>
                    <View style={styles.rankingStats}>
                      <Text style={styles.rankingScore}>
                        {entry.correct}/{entry.total}
                      </Text>
                      <Text style={styles.rankingAccuracy}>
                        {entry.accuracy}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Botões de Ação (Criador) */}
        {isCreator && quizGroup.status === 'active' && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEndQuizGroup}
              activeOpacity={0.8}
            >
              <XCircle size={20} color="#FF6B35" />
              <Text style={styles.actionButtonText}>Encerrar Grupo de Quiz</Text>
            </TouchableOpacity>
          </View>
        )}

        {isCreator && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDeleteQuizGroup}
              activeOpacity={0.8}
            >
              <Trash2 size={20} color="#F44336" />
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                Deletar Grupo de Quiz
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
    backgroundColor: '#121212',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  headerInfo: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(138, 79, 158, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#8A4F9E',
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A4F9E',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  quizCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quizQuestion: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  votedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsContainer: {
    gap: 8,
  },
  optionWrapper: {
    gap: 8,
  },
  markCorrectButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: '#4CAF50',
    alignItems: 'center',
  },
  markCorrectText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  correctAnswerBadge: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  correctAnswerText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
  },
  rankingContainer: {
    gap: 12,
  },
  rankingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rankingCardTop: {
    borderColor: '#8A4F9E',
    borderWidth: 2,
  },
  rankingPosition: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankingPositionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B0B0B0',
  },
  rankingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  rankingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  rankingTitle: {
    fontSize: 12,
    color: '#8A4F9E',
    fontWeight: '500',
  },
  teamRankingMembers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  teamMemberName: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  rankingStats: {
    alignItems: 'flex-end',
  },
  rankingScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  rankingAccuracy: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  teamsContainer: {
    gap: 16,
  },
  teamCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  teamTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  teamMembers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teamMemberAvatar: {
    marginRight: -8,
  },
  actionsSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: '#F44336',
  },
  actionButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#F44336',
  },
});

