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
  Eye,
  Ghost,
  Users2,
  Crown,
  ArrowRight,
  Award,
  BarChart2,
  TrendingUp,
  Zap,
  Target,
} from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../contexts/AuthContext';
import AddMembersCard from '../components/AddMembersCard';
import AvatarCircle from '../components/AvatarCircle';
import { UserPlus, Mail, Search, X } from 'lucide-react-native';
import { TextInput } from 'react-native';

const PRIMARY_PURPLE = '#9F63FF';
const PRIMARY_PURPLE_RGB = '159, 99, 255';
const PRIMARY_PURPLE_ALPHA_08 = `rgba(${PRIMARY_PURPLE_RGB}, 0.08)`;
const PRIMARY_PURPLE_ALPHA_12 = `rgba(${PRIMARY_PURPLE_RGB}, 0.12)`;
const PRIMARY_PURPLE_ALPHA_15 = `rgba(${PRIMARY_PURPLE_RGB}, 0.15)`;
const PRIMARY_PURPLE_ALPHA_20 = `rgba(${PRIMARY_PURPLE_RGB}, 0.2)`;
const PRIMARY_PURPLE_ALPHA_30 = `rgba(${PRIMARY_PURPLE_RGB}, 0.3)`;

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
    searchUsers,
    sendInvite,
    loading
  } = useGroups();

  const [group, setGroup] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [quizGroups, setQuizGroups] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [inviteEmails, setInviteEmails] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz', 'ranking', 'badges'

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

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchUsers(searchQuery.trim());
      const filtered = results.filter(
        user => user.uid !== currentUser?.uid &&
          !group.members?.includes(user.uid) &&
          !selectedUsers.some(su => su.uid === user.uid)
      );
      setSearchResults(filtered);
    } catch (error) {
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        handleSearchUsers();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedUsers]);

  const handleAddUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchResults(searchResults.filter(u => u.uid !== user.uid));
    setSearchQuery('');
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.uid !== userId));
  };

  const handleAddEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (email && email.includes('@') && !inviteEmails.includes(email)) {
      setInviteEmails([...inviteEmails, email]);
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (email) => {
    setInviteEmails(inviteEmails.filter(e => e !== email));
  };

  const handleSendInvites = async () => {
    if (selectedUsers.length === 0 && inviteEmails.length === 0) {
      Alert.alert('Aviso', 'Selecione usuários ou adicione e-mails');
      return;
    }

    try {
      // Enviar convites para usuários selecionados
      if (selectedUsers.length > 0) {
        await Promise.all(
          selectedUsers.map(user =>
            sendInvite(groupId, user.uid, 'username')
          )
        );
      }

      // Enviar convites por email
      if (inviteEmails.length > 0) {
        await Promise.all(
          inviteEmails.map(email =>
            sendInvite(groupId, email, 'email')
          )
        );
      }

      Alert.alert('Sucesso', 'Convites enviados com sucesso!');
      setSelectedUsers([]);
      setInviteEmails([]);
      setShowAddMembers(false);
      await loadGroupData();
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
        <ActivityIndicator size="large" color={PRIMARY_PURPLE} />
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
            <View style={[styles.groupBadge, { backgroundColor: group.color || PRIMARY_PURPLE }]}>
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
          <>
            <AddMembersCard
              onPress={() => setShowAddMembers(!showAddMembers)}
              memberCount={group.stats?.totalMembers || group.members?.length || 0}
            />

            {/* Add Members Form (Expandable) */}
            {showAddMembers && (
              <View style={styles.addMembersContainer}>
                {/* Search by Username */}
                <View style={styles.searchSection}>
                  <Text style={styles.searchLabel}>Buscar por username/apelido</Text>
                  <View style={styles.searchInputContainer}>
                    <Search size={20} color="#71717a" />
                    <TextInput
                      style={styles.searchInput}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Digite o username ou apelido"
                      placeholderTextColor="#71717a"
                      onSubmitEditing={handleSearchUsers}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}>
                        <X size={20} color="#71717a" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <View style={styles.searchResults}>
                      {searchResults.map(user => (
                        <TouchableOpacity
                          key={user.uid}
                          style={styles.searchResultItem}
                          onPress={() => handleAddUser(user)}
                          activeOpacity={0.8}
                        >
                          <AvatarCircle
                            name={user.username || user.displayName || user.email?.substring(0, 2)}
                            size={40}
                          />
                          <View style={styles.searchResultInfo}>
                            <Text style={styles.searchResultName}>
                              {user.username || user.displayName || 'Usuário'}
                            </Text>
                            {user.email && (
                              <Text style={styles.searchResultEmail}>{user.email}</Text>
                            )}
                          </View>
                          <UserPlus size={20} color={PRIMARY_PURPLE} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Invite by Email */}
                <View style={styles.emailSection}>
                  <Text style={styles.searchLabel}>Ou convidar por e-mail</Text>
                  <View style={styles.emailInputContainer}>
                    <Mail size={20} color="#71717a" />
                    <TextInput
                      style={styles.emailInput}
                      value={emailInput}
                      onChangeText={setEmailInput}
                      placeholder="Digite o e-mail"
                      placeholderTextColor="#71717a"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onSubmitEditing={handleAddEmail}
                    />
                    <TouchableOpacity
                      style={styles.addEmailButton}
                      onPress={handleAddEmail}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addEmailButtonText}>Adicionar</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Email List */}
                  {inviteEmails.length > 0 && (
                    <View style={styles.emailList}>
                      {inviteEmails.map((email, index) => (
                        <View key={index} style={styles.emailTag}>
                          <Text style={styles.emailTagText}>{email}</Text>
                          <TouchableOpacity onPress={() => handleRemoveEmail(email)}>
                            <X size={16} color="#71717a" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                  <View style={styles.selectedUsersSection}>
                    <Text style={styles.selectedUsersTitle}>Usuários selecionados</Text>
                    <View style={styles.selectedUsersList}>
                      {selectedUsers.map(user => (
                        <View key={user.uid} style={styles.selectedUserTag}>
                          <AvatarCircle
                            name={user.username || user.displayName || user.email?.substring(0, 2)}
                            size={32}
                          />
                          <Text style={styles.selectedUserText}>
                            {user.username || user.displayName || user.email}
                          </Text>
                          <TouchableOpacity onPress={() => handleRemoveUser(user.uid)}>
                            <X size={16} color="#71717a" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Send Button */}
                {(selectedUsers.length > 0 || inviteEmails.length > 0) && (
                  <TouchableOpacity
                    style={styles.sendInvitesButton}
                    onPress={handleSendInvites}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <UserPlus size={18} color="#FFFFFF" />
                        <Text style={styles.sendInvitesButtonText}>
                          Enviar {selectedUsers.length + inviteEmails.length} convite(s)
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}

        {/* Actions */}
        {isMember && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.createQuizButton}
              onPress={handleCreateQuizGroup}
              activeOpacity={0.8}
            >
              <Plus size={24} color="#FFFFFF" />
              <Text style={styles.createQuizButtonText}>Criar Grupo de Quiz</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tabs Navigation */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'quiz' && styles.tabButtonActive]}
            onPress={() => setActiveTab('quiz')}
            activeOpacity={0.8}
          >
            <Trophy size={20} color={activeTab === 'quiz' ? PRIMARY_PURPLE : '#71717a'} />
            <Text style={[styles.tabButtonText, activeTab === 'quiz' && styles.tabButtonTextActive]}>
              Quiz
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'ranking' && styles.tabButtonActive]}
            onPress={() => setActiveTab('ranking')}
            activeOpacity={0.8}
          >
            <Crown size={20} color={activeTab === 'ranking' ? PRIMARY_PURPLE : '#71717a'} />
            <Text style={[styles.tabButtonText, activeTab === 'ranking' && styles.tabButtonTextActive]}>
              Ranking
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'stats' && styles.tabButtonActive]}
            onPress={() => setActiveTab('stats')}
            activeOpacity={0.8}
          >
            <BarChart2 size={20} color={activeTab === 'stats' ? PRIMARY_PURPLE : '#71717a'} />
            <Text style={[styles.tabButtonText, activeTab === 'stats' && styles.tabButtonTextActive]}>
              Estatísticas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'badges' && styles.tabButtonActive]}
            onPress={() => setActiveTab('badges')}
            activeOpacity={0.8}
          >
            <Award size={20} color={activeTab === 'badges' ? PRIMARY_PURPLE : '#71717a'} />
            <Text style={[styles.tabButtonText, activeTab === 'badges' && styles.tabButtonTextActive]}>
              Badges
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'quiz' && (
          <View style={styles.tabContent}>
            {/* Quiz Groups Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Grupos de Quiz</Text>
                {quizGroups.length > 0 && (
                  <Text style={styles.sectionCount}>{quizGroups.length}</Text>
                )}
              </View>

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
                            'challenge': 'Desafios'
                          };

                          const getModeIcon = (mode) => {
                            switch (mode) {
                              case 'normal': return <Eye size={16} color={PRIMARY_PURPLE} />;
                              case 'ghost': return <Ghost size={16} color={PRIMARY_PURPLE} />;
                              case 'challenge': return <Users2 size={16} color={PRIMARY_PURPLE} />;
                              default: return <Eye size={16} color={PRIMARY_PURPLE} />;
                            }
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
                                  <View style={styles.quizGroupMetaRow}>
                                    <View style={styles.quizGroupMode}>
                                      {getModeIcon(quizGroup.mode)}
                                      <Text style={styles.quizGroupMeta}>
                                        {modeLabels[quizGroup.mode] || 'Normal'} • {quizGroup.quizzes?.length || 0} enquetes
                                      </Text>
                                    </View>
                                  </View>
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
                            'challenge': 'Desafios'
                          };

                          const getModeIcon = (mode) => {
                            switch (mode) {
                              case 'normal': return <Eye size={16} color={PRIMARY_PURPLE} />;
                              case 'ghost': return <Ghost size={16} color={PRIMARY_PURPLE} />;
                              case 'challenge': return <Users2 size={16} color={PRIMARY_PURPLE} />;
                              default: return <Eye size={16} color={PRIMARY_PURPLE} />;
                            }
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
                                  <View style={styles.quizGroupMetaRow}>
                                    <View style={styles.quizGroupMode}>
                                      {getModeIcon(quizGroup.mode)}
                                      <Text style={styles.quizGroupMeta}>
                                        {modeLabels[quizGroup.mode] || 'Normal'} • {quizGroup.quizzes?.length || 0} enquetes
                                      </Text>
                                    </View>
                                  </View>
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
          </View>
        )}

        {activeTab === 'stats' && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Estatísticas do Grupo</Text>

              {(() => {
                // Calcular estatísticas
                const totalQuizzes = quizGroups.length;

                let totalCorrect = 0;
                let totalQuestions = 0;
                let highestScore = 0;
                let highestScorer = null;
                const memberParticipation = {}; // userId -> count
                const memberCorrect = {}; // userId -> count

                quizGroups.forEach(qg => {
                  if (qg.ranking) {
                    qg.ranking.forEach(r => {
                      // Contabilizar participação
                      if (qg.rankingType === 'teams') {
                        r.teamMembers?.forEach(m => {
                          memberParticipation[m.userId] = (memberParticipation[m.userId] || 0) + 1;
                          // Simplificação: assumindo score do time para o membro ou ignorando
                        });
                      } else {
                        memberParticipation[r.userId] = (memberParticipation[r.userId] || 0) + 1;
                        memberCorrect[r.userId] = (memberCorrect[r.userId] || 0) + (r.correct || 0);

                        // Maior pontuação em um único quiz
                        if ((r.correct || 0) > highestScore) {
                          highestScore = r.correct || 0;
                          highestScorer = { name: r.name, photoURL: r.photoURL };
                        }
                      }

                      totalCorrect += (r.correct || r.totalCorrect || 0);
                    });
                  }
                  // Estimar total de questões (se cada quiz group tem média de 5 perguntas e X participantes)
                  // Melhor seria somar qg.quizzes.length * num_participantes
                  // Vamos usar uma métrica mais simples: Média de acertos por quiz
                });

                // Membro mais ativo
                let mostActiveMemberId = null;
                let maxParticipation = 0;
                Object.entries(memberParticipation).forEach(([uid, count]) => {
                  if (count > maxParticipation) {
                    maxParticipation = count;
                    mostActiveMemberId = uid;
                  }
                });

                const mostActiveMember = mostActiveMemberId
                  ? group.memberDetails?.find(m => m.uid === mostActiveMemberId)
                  : null;

                // Média de acertos (total acertos / total participações)
                const totalParticipations = Object.values(memberParticipation).reduce((a, b) => a + b, 0);
                const avgScore = totalParticipations > 0 ? (totalCorrect / totalParticipations).toFixed(1) : '0.0';

                return (
                  <View style={styles.statsGrid}>
                    {/* Card 1: Total de Quizzes */}
                    <View style={styles.statCard}>
                      <View style={[styles.statIconContainer, { backgroundColor: 'rgba(159, 99, 255, 0.15)' }]}>
                        <Trophy size={20} color={PRIMARY_PURPLE} />
                      </View>
                      <Text style={styles.statValue}>{totalQuizzes}</Text>
                      <Text style={styles.statLabel}>Quizzes Criados</Text>
                    </View>

                    {/* Card 2: Média de Acertos */}
                    <View style={styles.statCard}>
                      <View style={[styles.statIconContainer, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                        <Target size={20} color="#4CAF50" />
                      </View>
                      <Text style={styles.statValue}>{avgScore}</Text>
                      <Text style={styles.statLabel}>Média de Acertos</Text>
                    </View>

                    {/* Card 3: Membro Mais Ativo */}
                    <View style={[styles.statCard, styles.statCardWide]}>
                      <View style={styles.statCardHeader}>
                        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 107, 53, 0.15)' }]}>
                          <Zap size={20} color="#FF6B35" />
                        </View>
                        <Text style={styles.statLabel}>Membro Mais Ativo</Text>
                      </View>
                      {mostActiveMember ? (
                        <View style={styles.activeMemberInfo}>
                          <AvatarCircle
                            name={mostActiveMember.displayName || 'User'}
                            size={40}
                            photoURL={mostActiveMember.photoURL}
                          />
                          <View>
                            <Text style={styles.activeMemberName}>{mostActiveMember.displayName}</Text>
                            <Text style={styles.activeMemberSub}>{maxParticipation} quizzes</Text>
                          </View>
                        </View>
                      ) : (
                        <Text style={styles.emptyStatText}>Ainda não há dados</Text>
                      )}
                    </View>

                    {/* Card 4: Recorde */}
                    <View style={[styles.statCard, styles.statCardWide]}>
                      <View style={styles.statCardHeader}>
                        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 193, 7, 0.15)' }]}>
                          <Crown size={20} color="#FFC107" />
                        </View>
                        <Text style={styles.statLabel}>Maior Pontuação</Text>
                      </View>
                      {highestScorer ? (
                        <View style={styles.activeMemberInfo}>
                          <AvatarCircle
                            name={highestScorer.name || 'User'}
                            size={40}
                            photoURL={highestScorer.photoURL}
                          />
                          <View>
                            <Text style={styles.activeMemberName}>{highestScore} acertos</Text>
                            <Text style={styles.activeMemberSub}>por {highestScorer.name}</Text>
                          </View>
                        </View>
                      ) : (
                        <Text style={styles.emptyStatText}>Ainda não há dados</Text>
                      )}
                    </View>
                  </View>
                );
              })()}
            </View>
          </View>
        )}

        {activeTab === 'ranking' && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ranking do Grupo</Text>

              {(() => {
                const quizGroupsWithRanking = quizGroups.filter(
                  qg => qg.ranking && qg.ranking.length > 0
                );
                const latestRanking = quizGroupsWithRanking.sort((a, b) => {
                  const aTime = a.endTime?.toDate ? a.endTime.toDate() : new Date(a.endTime);
                  const bTime = b.endTime?.toDate ? b.endTime.toDate() : new Date(b.endTime);
                  return bTime - aTime;
                })[0];

                if (latestRanking) {
                  const sortedRanking = [...latestRanking.ranking].sort((a, b) => {
                    if (latestRanking.rankingType === 'teams') {
                      return b.totalCorrect - a.totalCorrect;
                    }
                    return b.correct - a.correct;
                  });
                  const userRank = sortedRanking.findIndex(
                    r => r.userId === currentUser?.uid ||
                      (latestRanking.rankingType === 'teams' &&
                        r.teamMembers?.some(m => m.userId === currentUser?.uid))
                  );

                  return (
                    <>
                      <TouchableOpacity
                        style={styles.rankingCard}
                        onPress={() => {
                          navigation.navigate('Ranking', {
                            quizGroupId: latestRanking.id,
                            groupId: group.id,
                            groupName: group.name,
                            quizGroupTitle: latestRanking.title,
                          });
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.rankingCardHeader}>
                          <View style={styles.rankingCardIcon}>
                            <Trophy size={28} color="#FFD700" />
                            <Crown size={20} color="#FF6B35" style={styles.rankingCardCrown} />
                          </View>
                          <View style={styles.rankingCardContent}>
                            <Text style={styles.rankingCardTitle}>Último Ranking</Text>
                            <Text style={styles.rankingCardSubtitle}>{latestRanking.title}</Text>
                          </View>
                          <ArrowRight size={24} color={PRIMARY_PURPLE} />
                        </View>
                        <View style={styles.rankingCardPreview}>
                          {userRank >= 0 && (
                            <View style={styles.rankingCardUserPosition}>
                              <View style={styles.rankingPositionBadge}>
                                <Text style={styles.rankingPositionNumber}>{userRank + 1}</Text>
                                <Text style={styles.rankingPositionLabel}>º lugar</Text>
                              </View>
                              <Text style={styles.rankingCardStats}>
                                {sortedRanking[userRank].correct || sortedRanking[userRank].totalCorrect || 0} acertos
                              </Text>
                            </View>
                          )}
                          <View style={styles.rankingCardTop3}>
                            {sortedRanking.slice(0, 3).map((member, index) => {
                              const displayName = latestRanking.rankingType === 'teams'
                                ? member.teamMembers?.map(m => m.name).join(', ') || 'Time'
                                : member.name || 'Usuário';

                              return (
                                <View key={member.userId || index} style={styles.rankingCardTop3Item}>
                                  {index === 0 && (
                                    <Crown size={14} color="#FF6B35" style={styles.rankingCardTop3Crown} />
                                  )}
                                  <AvatarCircle
                                    name={displayName}
                                    size={28}
                                    style={styles.rankingCardTop3Avatar}
                                  />
                                  <Text style={styles.rankingCardTop3Name} numberOfLines={1}>
                                    {displayName}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.viewAllRankingButton}
                        onPress={() => {
                          const quizGroupsWithRanking = quizGroups.filter(
                            qg => qg.ranking && qg.ranking.length > 0
                          );
                          if (quizGroupsWithRanking.length > 0) {
                            const latestRanking = quizGroupsWithRanking.sort((a, b) => {
                              const aTime = a.endTime?.toDate ? a.endTime.toDate() : new Date(a.endTime);
                              const bTime = b.endTime?.toDate ? b.endTime.toDate() : new Date(b.endTime);
                              return bTime - aTime;
                            })[0];

                            navigation.navigate('Ranking', {
                              quizGroupId: latestRanking.id,
                              groupId: group.id,
                              groupName: group.name,
                              quizGroupTitle: 'Ranking Geral do Grupo',
                            });
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.viewAllRankingButtonText}>Ver Ranking Completo</Text>
                        <ChevronRight size={20} color={PRIMARY_PURPLE} />
                      </TouchableOpacity>
                    </>
                  );
                }

                return (
                  <View style={styles.emptyRankingContainer}>
                    <Trophy size={48} color="#71717a" />
                    <Text style={styles.emptyRankingText}>Nenhum ranking disponível ainda</Text>
                    <Text style={styles.emptyRankingSubtext}>
                      Complete um grupo de quiz para ver o ranking
                    </Text>
                  </View>
                );
              })()}
            </View>
          </View>
        )}

        {activeTab === 'badges' && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Badges do Grupo</Text>
              <View style={styles.emptyContainer}>
                <Award size={48} color="#71717a" />
                <Text style={styles.emptyText}>Badges em breve</Text>
                <Text style={styles.emptySubtext}>
                  Esta funcionalidade estará disponível em breve
                </Text>
              </View>
            </View>
          </View>
        )}

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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY_PURPLE,
    backgroundColor: PRIMARY_PURPLE_ALPHA_12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
    backgroundColor: PRIMARY_PURPLE,
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
    backgroundColor: PRIMARY_PURPLE,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 10,
    shadowColor: PRIMARY_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createQuizButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  rankingCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  rankingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  rankingCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rankingCardCrown: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  rankingCardContent: {
    flex: 1,
  },
  rankingCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  rankingCardSubtitle: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  rankingCardPreview: {
    gap: 12,
  },
  rankingCardUserPosition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: PRIMARY_PURPLE_ALPHA_15,
    borderRadius: 12,
  },
  rankingPositionBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: PRIMARY_PURPLE_ALPHA_30,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE,
  },
  rankingPositionNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: PRIMARY_PURPLE,
  },
  rankingPositionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY_PURPLE,
    marginLeft: 2,
  },
  rankingCardStats: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rankingCardTop3: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  rankingCardTop3Item: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  rankingCardTop3Crown: {
    position: 'absolute',
    top: -8,
    zIndex: 1,
  },
  rankingCardTop3Avatar: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rankingCardTop3Name: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
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
  quizGroupMetaRow: {
    marginTop: 4,
  },
  quizGroupMode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    color: PRIMARY_PURPLE,
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
    backgroundColor: PRIMARY_PURPLE,
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
  addMembersContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#27272a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3f3f46',
    padding: 16,
    gap: 20,
  },
  searchSection: {
    gap: 12,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
  },
  searchResults: {
    gap: 8,
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  searchResultEmail: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  emailSection: {
    gap: 12,
  },
  emailInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  emailInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
  },
  addEmailButton: {
    backgroundColor: PRIMARY_PURPLE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addEmailButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emailList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emailTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  emailTagText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  selectedUsersSection: {
    gap: 12,
  },
  selectedUsersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedUsersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedUserTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  selectedUserText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  sendInvitesButton: {
    backgroundColor: PRIMARY_PURPLE,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  sendInvitesButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY_PURPLE,
  },
  emptyRankingContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderStyle: 'dashed',
  },
  emptyRankingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyRankingSubtext: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#27272a',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717a',
  },
  tabButtonTextActive: {
    color: PRIMARY_PURPLE,
  },
  tabContent: {
    marginBottom: 32,
  },
  viewAllRankingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  viewAllRankingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_PURPLE,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%', // Aprox metade menos o gap
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statCardWide: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  activeMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeMemberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activeMemberSub: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  emptyStatText: {
    color: '#71717a',
    fontSize: 14,
  },
});

