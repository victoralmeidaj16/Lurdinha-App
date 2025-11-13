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
  Modal,
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
  Calendar,
  BarChart3,
  AlertCircle,
  ChevronRight,
  Plus,
  MoreVertical,
} from 'lucide-react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../contexts/AuthContext';
import OptionCard from '../components/OptionCard';
import AvatarCircle from '../components/AvatarCircle';
import VoterAvatars from '../components/VoterAvatars';
import Header from '../components/Header';

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
  const [showMarkCorrectModal, setShowMarkCorrectModal] = useState(false);
  const [selectedQuizForMarking, setSelectedQuizForMarking] = useState(null);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);

  useEffect(() => {
    loadQuizGroupData();
    setCurrentQuizIndex(0);
  }, [quizGroupId]);

  // Listeners em tempo real para atualizar votos e avatares do quiz atual
  useEffect(() => {
    if (!quizGroup || !quizGroup.quizzesData || quizGroup.quizzesData.length === 0) {
      return;
    }

    const currentQuiz = quizGroup.quizzesData[currentQuizIndex];
    if (!currentQuiz) return;

    const unsubscribe = onSnapshot(
      doc(db, 'quizzes', currentQuiz.id),
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
              q.id === currentQuiz.id ? updatedQuiz : q
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
              [currentQuiz.id]: updatedQuiz.votes[currentUser.uid]
            }));
          }
        }
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [quizGroup?.id, currentQuizIndex, currentUser?.uid]);

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
      
      // Atualizar dados do quiz group
      const updatedData = await getQuizGroupDetails(quizGroupId);
      setQuizGroup(updatedData);
      
      // Capturar o índice atual antes do setTimeout
      const currentIndex = currentQuizIndex;
      
      // Aguardar 1.3 segundos e navegar para o próximo quiz
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        if (updatedData && updatedData.quizzesData && nextIndex < updatedData.quizzesData.length) {
          setCurrentQuizIndex(nextIndex);
        } else {
          // Todos os quizzes foram respondidos, voltar ou mostrar resultado
          navigation.goBack();
        }
      }, 1300);
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleOpenMarkCorrect = (quizId) => {
    setSelectedQuizForMarking(quizId);
    setShowMarkCorrectModal(true);
  };

  const handleMarkCorrect = async (quizId, optionIndex) => {
    setShowMarkCorrectModal(false);
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
      case 'challenge': return <Users2 size={16} color="#8A4F9E" />;
      default: return <Eye size={16} color="#8A4F9E" />;
    }
  };

  const getModeLabel = (mode) => {
    switch (mode) {
      case 'normal': return 'Normal';
      case 'ghost': return 'Ghost';
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
        <Header
          title={quizGroup.title}
          onBack={() => navigation.goBack()}
          rightAction={isCreator ? () => handleDeleteQuizGroup() : undefined}
          rightActionIcon={isCreator ? Trash2 : undefined}
        />

        {/* Enquetes - Mostrar apenas o quiz atual */}
        <View style={styles.quizzesSection}>
          {(() => {
            const quiz = quizGroup.quizzesData?.[currentQuizIndex];
            if (!quiz) return null;
            
            const quizIndex = currentQuizIndex;
            const userVote = selectedAnswers[quiz.id];
            const hasVoted = userVote !== undefined;
            const hasCorrectAnswer = quiz.correctAnswer !== null && quiz.correctAnswer !== undefined;
            const isActive = quiz.status === 'active' && quizGroup.status === 'active';
            const isRevealed = hasCorrectAnswer || quiz.isRevealed;
            const showResults = isRevealed || hasVoted;
            
            // Calcular totais de votos e percentuais
            const totalVotes = quiz.votes ? Object.keys(quiz.votes).length : 0;
            const voteCounts = {};
            let maxVotes = 0;
            
            if (quiz.votes) {
              Object.values(quiz.votes).forEach((optionIndex) => {
                voteCounts[optionIndex] = (voteCounts[optionIndex] || 0) + 1;
                maxVotes = Math.max(maxVotes, voteCounts[optionIndex]);
              });
            }

            return (
              <View key={quiz.id} style={styles.quizCard}>
                {/* Question with Purple Background */}
                <View style={styles.quizQuestionHeader}>
                  <Text style={styles.quizQuestion}>{quiz.question}</Text>
                </View>

                {/* Options */}
                <View style={styles.optionsContainer}>
                  {quiz.options.map((option, optionIndex) => {
                    const isSelected = userVote === optionIndex;
                    const optionVotes = voteCounts[optionIndex] || 0;
                    const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
                    const canVote = !hasVoted && !isRevealed && isActive;
                    
                    // Obter avatares dos votantes
                    const voterUserIds = quiz.voterAvatars && quiz.voterAvatars[optionIndex] 
                      ? quiz.voterAvatars[optionIndex] 
                      : [];
                    const voterDetails = (quiz.voterDetails || []).filter(v => 
                      voterUserIds.includes(v.uid || v.id)
                    );
                    
                    // Lógica de exibição de avatares baseado no modo
                    // Mode Normal: Mostrar avatares antes de votar (a menos que revelado) OU após revelar
                    // Mode Ghost: Mostrar avatares somente após o usuário votar
                    const shouldShowAvatars = quizGroup.mode === 'normal'
                      ? (!hasVoted || isRevealed) && voterUserIds.length > 0
                      : (quizGroup.mode === 'ghost' && hasVoted && voterUserIds.length > 0);

                    return (
                      <TouchableOpacity
                        key={optionIndex}
                        style={[
                          styles.optionCard,
                          isSelected && styles.optionCardSelected,
                          !canVote && styles.optionCardDisabled,
                        ]}
                        onPress={() => {
                          if (canVote) {
                            handleVote(quiz.id, optionIndex);
                          }
                        }}
                        disabled={!canVote}
                        activeOpacity={canVote ? 0.8 : 1}
                      >
                        {/* Progress bar background */}
                        {showResults && (
                          <View style={[styles.progressBarBg, { width: `${percentage}%` }]} />
                        )}
                        
                        {/* Option content */}
                        <View style={styles.optionContent}>
                          <View style={styles.optionLeft}>
                            {isSelected && (
                              <CheckCircle size={20} color="#9061F9" style={styles.optionCheckIcon} />
                            )}
                            <Text style={[
                              styles.optionText,
                              isSelected && styles.optionTextSelected
                            ]}>
                              {option}
                            </Text>
                          </View>
                          
                          <View style={styles.optionRight}>
                            {/* Avatars */}
                            {shouldShowAvatars && (
                              <VoterAvatars 
                                voters={voterDetails.length > 0 ? voterDetails : voterUserIds} 
                                maxDisplay={3} 
                              />
                            )}
                            
                            {/* Votes and percentage */}
                            {showResults && (
                              <View style={styles.optionStats}>
                                <Text style={styles.optionVotes}>{optionVotes}</Text>
                                <View style={styles.percentageBadge}>
                                  <Text style={styles.percentageText}>
                                    {percentage.toFixed(0)}%
                                  </Text>
                                </View>
                              </View>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Poll Status Footer */}
                <View style={styles.pollStatusFooter}>
                  <View style={styles.pollStatusLeft}>
                    <BarChart3 size={16} color="#B9C0CC" />
                    <Text style={styles.pollStatusText}>{totalVotes} respostas</Text>
                  </View>
                  
                  <View style={styles.pollStatusRight}>
                    {hasVoted && !isRevealed && (
                      <View style={styles.statusBadgeSuccess}>
                        <Text style={styles.statusBadgeTextSuccess}>Voto registrado</Text>
                      </View>
                    )}
                    
                    {isRevealed && (
                      <View style={styles.statusBadgePrimary}>
                        <Text style={styles.statusBadgeTextPrimary}>Resultado revelado</Text>
                      </View>
                    )}
                    
                    {!hasVoted && !isRevealed && (
                      <View style={styles.statusBadgeWarning}>
                        <Text style={styles.statusBadgeTextWarning}>Aguardando voto</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Botão único para marcar resposta correta */}
                {canMarkCorrect && !hasCorrectAnswer && isActive && (
                  <TouchableOpacity
                    style={styles.markCorrectSingleButton}
                    onPress={() => handleOpenMarkCorrect(quiz.id)}
                    activeOpacity={0.8}
                  >
                    <Plus size={16} color="#FFFFFF" />
                    <Text style={styles.markCorrectSingleButtonText}>Adicionar Resposta</Text>
                  </TouchableOpacity>
                )}

                {/* Botão Próxima */}
                {hasVoted && (
                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={() => {
                      const nextIndex = currentQuizIndex + 1;
                      if (quizGroup && quizGroup.quizzesData && nextIndex < quizGroup.quizzesData.length) {
                        setCurrentQuizIndex(nextIndex);
                      } else {
                        navigation.goBack();
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.nextButtonText}>Próxima</Text>
                    <ChevronRight size={18} color="#9061F9" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })()}
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
            <View style={styles.sectionHeaderWithButton}>
              <Text style={styles.sectionTitle}>
                {quizGroup.rankingType === 'teams' ? 'Ranking de Times' : 'Ranking Individual'}
              </Text>
              <TouchableOpacity
                style={styles.viewFullRankingButton}
                onPress={() => {
                  navigation.navigate('Ranking', {
                    quizGroupId: quizGroup.id,
                    groupId: quizGroup.groupId,
                    groupName: route.params?.groupName || 'Grupo',
                    quizGroupTitle: quizGroup.title,
                  });
                }}
                activeOpacity={0.8}
              >
                <Trophy size={16} color="#8A4F9E" />
                <Text style={styles.viewFullRankingText}>Ver ranking completo</Text>
              </TouchableOpacity>
            </View>
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
                
                // Ranking individual (modo Normal/Ghost)
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

        {/* Encerrar Grupo de Quiz - Layout mais sutil */}
        {isCreator && quizGroup.status === 'active' && (
          <View style={styles.endQuizGroupContainer}>
            <TouchableOpacity
              style={styles.endQuizGroupLink}
              onPress={handleEndQuizGroup}
              activeOpacity={0.7}
            >
              <Text style={styles.endQuizGroupText}>Encerrar grupo de quiz</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal para marcar resposta correta */}
      <Modal
        visible={showMarkCorrectModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMarkCorrectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedQuizForMarking && (() => {
              const quiz = quizGroup.quizzesData?.find(q => q.id === selectedQuizForMarking);
              if (!quiz) return null;

              return (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Selecione a resposta correta</Text>
                    <TouchableOpacity
                      onPress={() => setShowMarkCorrectModal(false)}
                      style={styles.modalCloseButton}
                    >
                      <XCircle size={24} color="#B0B0B0" />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.modalQuestion}>{quiz.question}</Text>
                  
                  <View style={styles.modalOptions}>
                    {quiz.options.map((option, optionIndex) => (
                      <TouchableOpacity
                        key={optionIndex}
                        style={styles.modalOption}
                        onPress={() => handleMarkCorrect(quiz.id, optionIndex)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.modalOptionText}>{option}</Text>
                        <CheckCircle size={20} color="#8A4F9E" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E10',
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
    backgroundColor: '#0E0E10',
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
  quizzesSection: {
    gap: 16,
  },
  sectionHeaderWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewFullRankingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(138, 79, 158, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(138, 79, 158, 0.4)',
  },
  viewFullRankingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A4F9E',
  },
  groupInfoCard: {
    backgroundColor: '#17171B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  groupInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modeBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(144, 97, 249, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modeTextSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9061F9',
  },
  timeBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timeTextSmall: {
    fontSize: 11,
    color: '#B9C0CC',
  },
  groupInfoStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupInfoStatNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9061F9',
  },
  groupInfoStatLabel: {
    fontSize: 13,
    color: '#B9C0CC',
  },
  groupInfoStatDivider: {
    fontSize: 13,
    color: '#B9C0CC',
    marginHorizontal: 4,
  },
  quizCard: {
    backgroundColor: '#17171B',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    overflow: 'hidden',
  },
  quizQuestionHeader: {
    backgroundColor: '#9061F9',
    padding: 20,
    paddingVertical: 16,
  },
  quizQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  optionsContainer: {
    padding: 20,
    gap: 12,
  },
  optionCard: {
    position: 'relative',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#17171B',
    minHeight: 52,
    overflow: 'hidden',
  },
  optionCardSelected: {
    borderColor: '#9061F9',
    backgroundColor: 'rgba(144, 97, 249, 0.25)',
    borderWidth: 2,
  },
  optionCardDisabled: {
    opacity: 0.8,
  },
  progressBarBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(144, 97, 249, 0.1)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 1,
  },
  optionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionCheckIcon: {
    marginRight: 4,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#F5F7FB',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionVotes: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F5F7FB',
  },
  percentageBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F5F7FB',
  },
  pollStatusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  pollStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pollStatusText: {
    fontSize: 14,
    color: '#B9C0CC',
  },
  pollStatusRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeSuccess: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#32D583',
    backgroundColor: 'rgba(50, 213, 131, 0.1)',
  },
  statusBadgeTextSuccess: {
    fontSize: 11,
    fontWeight: '600',
    color: '#32D583',
  },
  statusBadgePrimary: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#9061F9',
    backgroundColor: 'rgba(144, 97, 249, 0.1)',
  },
  statusBadgeTextPrimary: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9061F9',
  },
  statusBadgeWarning: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FF7A59',
    backgroundColor: 'rgba(255, 122, 89, 0.1)',
  },
  statusBadgeTextWarning: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF7A59',
  },
  markCorrectSingleButton: {
    marginTop: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  markCorrectSingleButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  nextButton: {
    marginTop: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(144, 97, 249, 0.1)',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(144, 97, 249, 0.3)',
  },
  nextButtonText: {
    fontSize: 15,
    color: '#9061F9',
    fontWeight: '600',
  },
  endQuizGroupContainer: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  endQuizGroupLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  endQuizGroupText: {
    fontSize: 14,
    color: '#B9C0CC',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  modalOptions: {
    gap: 12,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 12,
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
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
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
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
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
});

