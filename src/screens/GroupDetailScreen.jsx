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
  Users,
  Plus,
  Settings,
  Clock,
  Trophy,
  UserMinus,
  CheckCircle,
  XCircle,
  ChevronRight,
} from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../contexts/AuthContext';
import AddMembersCard from '../components/AddMembersCard';

export default function GroupDetailScreen({ navigation, route }) {
  const { groupId } = route.params;
  const { currentUser } = useAuth();
  const { 
    getGroupDetails, 
    leaveGroup,
    acceptJoinRequest,
    rejectJoinRequest,
    getGroupQuizzes,
    getGroupQuizGroups,
    loading 
  } = useGroups();
  
  const [group, setGroup] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [quizGroups, setQuizGroups] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      const [groupData, quizzesData, quizGroupsData] = await Promise.all([
        getGroupDetails(groupId),
        getGroupQuizzes(groupId),
        getGroupQuizGroups(groupId)
      ]);
      setGroup(groupData);
      setQuizzes(quizzesData);
      setQuizGroups(quizGroupsData);
    } catch (error) {
      Alert.alert('Erro', error.message);
      navigation.goBack();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupData();
    setRefreshing(false);
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Sair do Grupo',
      'Tem certeza que deseja sair deste grupo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveGroup(groupId);
              Alert.alert('Sucesso', 'Você saiu do grupo');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Erro', error.message);
            }
          },
        },
      ]
    );
  };

  const handleAcceptRequest = async (userId) => {
    try {
      await acceptJoinRequest(groupId, userId);
      await loadGroupData();
      Alert.alert('Sucesso', 'Solicitação aceita!');
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      await rejectJoinRequest(groupId, userId);
      await loadGroupData();
      Alert.alert('Sucesso', 'Solicitação rejeitada');
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleCreateQuiz = () => {
    navigation.navigate('CreateQuiz', { groupId });
  };

  const handleCreateQuizGroup = () => {
    navigation.navigate('CreateQuizGroupStep1', { groupId });
  };

  const handleQuizGroupPress = (quizGroup) => {
    navigation.navigate('QuizGroupDetail', { quizGroupId: quizGroup.id });
  };

  const handleQuizPress = (quiz) => {
    navigation.navigate('Quiz', { quizId: quiz.id });
  };

  if (!group) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  const isAdmin = group.admins?.includes(currentUser?.uid);
  const isMember = group.members?.includes(currentUser?.uid);
  const pendingRequests = group.pendingRequests || [];

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
              <Text style={styles.headerTitle}>{group.name}</Text>
            </View>
            {isAdmin && (
              <TouchableOpacity 
                style={styles.settingsButton}
                activeOpacity={0.8}
              >
                <Settings size={24} color="#B0B0B0" />
              </TouchableOpacity>
            )}
          </View>

          {/* Group Info */}
          <View style={styles.groupInfo}>
            <View style={[styles.groupBadge, { backgroundColor: group.color || '#8b5cf6' }]}>
              <Text style={styles.groupBadgeText}>{group.badge || '👥'}</Text>
            </View>
            <View style={styles.groupDetails}>
              {group.description ? (
                <Text style={styles.groupDescription}>{group.description}</Text>
              ) : null}
              <View style={styles.groupStats}>
                <View style={styles.statItem}>
                  <Users size={16} color="#B0B0B0" />
                  <Text style={styles.statText}>
                    {group.stats?.totalMembers || group.members?.length || 0} membros
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Clock size={16} color="#B0B0B0" />
                  <Text style={styles.statText}>
                    {group.stats?.activeQuizzes || 0} quiz ativos
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Pending Requests (Admin only) */}
        {isAdmin && pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solicitações Pendentes</Text>
            {pendingRequests.map((userId) => {
              const member = group.memberDetails?.find(m => m.uid === userId);
              return (
                <View key={userId} style={styles.requestCard}>
                  <View style={styles.requestInfo}>
                    <View style={styles.requestAvatar}>
                      <Text style={styles.requestAvatarText}>
                        {member?.displayName?.charAt(0) || 'U'}
                      </Text>
                    </View>
                    <Text style={styles.requestName}>
                      {member?.displayName || 'Usuário'}
                    </Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAcceptRequest(userId)}
                    >
                      <CheckCircle size={20} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleRejectRequest(userId)}
                    >
                      <XCircle size={20} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Add Members Card (Admin only) */}
        {isAdmin && (
          <AddMembersCard 
            onPress={() => setShowAddMembers(!showAddMembers)}
            memberCount={group.stats?.totalMembers || group.members?.length || 0}
          />
        )}

        {/* Actions */}
        {isMember && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.createQuizButton}
              onPress={handleCreateQuizGroup}
              activeOpacity={0.8}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.createQuizButtonText}>Criar Grupo de Quiz</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quiz Groups Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grupos de Quiz</Text>
          
          {quizGroups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum grupo de quiz ainda</Text>
              {isMember && (
                <Text style={styles.emptySubtext}>
                  Crie o primeiro grupo de quiz!
                </Text>
              )}
            </View>
          ) : (
            <>
              {/* Ativos */}
              {quizGroups.filter(qg => qg.isActive).length > 0 && (
                <>
                  <Text style={styles.subsectionTitle}>Ativos</Text>
                  <View style={styles.quizGroupsContainer}>
                    {quizGroups.filter(qg => qg.isActive).map((quizGroup) => {
                      const modeLabels = {
                        'normal': 'Normal',
                        'ghost': 'Ghost',
                        'surprise': 'Surpresa',
                        'challenge': 'Desafios'
                      };
                      
                      return (
                        <TouchableOpacity
                          key={quizGroup.id}
                          style={styles.quizGroupCard}
                          onPress={() => handleQuizGroupPress(quizGroup)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.quizGroupHeader}>
                            <View style={styles.quizGroupInfo}>
                              <Text style={styles.quizGroupTitle}>{quizGroup.title}</Text>
                              <Text style={styles.quizGroupMeta}>
                                {quizGroup.quizzes?.length || 0} enquetes • {modeLabels[quizGroup.mode] || 'Normal'}
                              </Text>
                            </View>
                            <ChevronRight size={20} color="#B0B0B0" />
                          </View>
                          <View style={styles.quizGroupFooter}>
                            <Text style={styles.quizGroupStatus}>Ativo</Text>
                            <Clock size={14} color="#4CAF50" />
                            <Text style={styles.quizGroupTime}>
                              {(() => {
                                const endTime = quizGroup.endTime?.toDate ? quizGroup.endTime.toDate() : new Date(quizGroup.endTime);
                                const hoursLeft = Math.ceil((endTime - new Date()) / (1000 * 60 * 60));
                                return hoursLeft > 0 ? `${hoursLeft}h restantes` : 'Expirado';
                              })()}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Encerrados */}
              {quizGroups.filter(qg => !qg.isActive).length > 0 && (
                <>
                  <Text style={[styles.subsectionTitle, { marginTop: 24 }]}>Encerrados</Text>
                  <View style={styles.quizGroupsContainer}>
                    {quizGroups.filter(qg => !qg.isActive).map((quizGroup) => {
                      const modeLabels = {
                        'normal': 'Normal',
                        'ghost': 'Ghost',
                        'surprise': 'Surpresa',
                        'challenge': 'Desafios'
                      };
                      
                      return (
                        <TouchableOpacity
                          key={quizGroup.id}
                          style={styles.quizGroupCard}
                          onPress={() => handleQuizGroupPress(quizGroup)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.quizGroupHeader}>
                            <View style={styles.quizGroupInfo}>
                              <Text style={styles.quizGroupTitle}>{quizGroup.title}</Text>
                              <Text style={styles.quizGroupMeta}>
                                {quizGroup.quizzes?.length || 0} enquetes • {modeLabels[quizGroup.mode] || 'Normal'}
                              </Text>
                            </View>
                            <ChevronRight size={20} color="#B0B0B0" />
                          </View>
                          <View style={styles.quizGroupFooter}>
                            <Text style={[styles.quizGroupStatus, { color: '#B0B0B0' }]}>Encerrado</Text>
                            {quizGroup.ranking && (
                              <Text style={styles.quizGroupRanking}>
                                Ranking disponível
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </>
          )}
        </View>

        {/* Quizzes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quizzes</Text>
          
          {quizzes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum quiz ainda</Text>
              {isMember && (
                <Text style={styles.emptySubtext}>
                  Crie o primeiro quiz do grupo!
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.quizzesContainer}>
              {quizzes.map((quiz) => (
                <TouchableOpacity
                  key={quiz.id}
                  style={styles.quizCard}
                  onPress={() => handleQuizPress(quiz)}
                  activeOpacity={0.8}
                >
                  <View style={styles.quizHeader}>
                    <Text style={styles.quizTitle} numberOfLines={2}>
                      {quiz.title}
                    </Text>
                    <ChevronRight size={20} color="#B0B0B0" />
                  </View>
                  {quiz.description ? (
                    <Text style={styles.quizDescription} numberOfLines={1}>
                      {quiz.description}
                    </Text>
                  ) : null}
                  <View style={styles.quizFooter}>
                    <View style={styles.quizStat}>
                      <Trophy size={14} color="#B0B0B0" />
                      <Text style={styles.quizStatText}>
                        {Object.keys(quiz.votes || {}).length} votos
                      </Text>
                    </View>
                    <View style={styles.quizStat}>
                      <Clock size={14} color={quiz.isActive ? "#4CAF50" : "#F44336"} />
                      <Text style={[
                        styles.quizStatText,
                        { color: quiz.isActive ? "#4CAF50" : "#F44336" }
                      ]}>
                        {quiz.isActive ? 'Ativo' : 'Finalizado'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membros</Text>
          <View style={styles.membersContainer}>
            {group.memberDetails?.slice(0, 10).map((member) => (
              <View key={member.uid} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {member.displayName?.charAt(0) || 'U'}
                  </Text>
                </View>
                <Text style={styles.memberName} numberOfLines={1}>
                  {member.displayName || 'Usuário'}
                </Text>
                {group.admins?.includes(member.uid) && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
              </View>
            ))}
            {group.members?.length > 10 && (
              <View style={styles.memberCard}>
                <Text style={styles.moreMembersText}>
                  +{group.members.length - 10} mais
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Leave Group Button */}
        {isMember && (
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveGroup}
            activeOpacity={0.8}
          >
            <UserMinus size={20} color="#F44336" />
            <Text style={styles.leaveButtonText}>Sair do Grupo</Text>
          </TouchableOpacity>
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
    marginBottom: 24,
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  groupBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBadgeText: {
    fontSize: 32,
  },
  groupDetails: {
    flex: 1,
  },
  groupDescription: {
    fontSize: 16,
    color: '#B0B0B0',
    marginBottom: 12,
    lineHeight: 22,
  },
  groupStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#B0B0B0',
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
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    padding: 8,
  },
  rejectButton: {
    padding: 8,
  },
  actionsContainer: {
    marginBottom: 32,
  },
  createQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  createQuizButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B0B0B0',
    marginBottom: 12,
  },
  quizGroupsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  quizGroupCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quizGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quizGroupInfo: {
    flex: 1,
  },
  quizGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  quizGroupMeta: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  quizGroupFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quizGroupStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  quizGroupTime: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  quizGroupRanking: {
    fontSize: 12,
    color: '#8A4F9E',
    fontWeight: '600',
    marginLeft: 'auto',
  },
  quizzesContainer: {
    gap: 12,
  },
  quizCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quizTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  quizDescription: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 12,
  },
  quizFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  quizStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quizStatText: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  membersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  memberCard: {
    alignItems: 'center',
    width: 80,
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  memberName: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  adminBadge: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adminBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  moreMembersText: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
    marginTop: 20,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F44336',
    gap: 8,
    marginTop: 16,
  },
  leaveButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
});

