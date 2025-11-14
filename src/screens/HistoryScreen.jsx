import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  MessageSquare,
  Users,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import Header from '../components/Header';

const PRIMARY_PURPLE = '#9F63FF';

export default function HistoryScreen({ navigation }) {
  const { currentUser } = useAuth();
  const { userData } = useUserData();
  const [activeTab, setActiveTab] = useState('quizGroups');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para cada tipo de histórico
  const [createdQuizGroups, setCreatedQuizGroups] = useState([]);
  const [participatedQuizGroups, setParticipatedQuizGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [votedQuizzes, setVotedQuizzes] = useState([]);

  useEffect(() => {
    loadHistory();
  }, [currentUser, activeTab]);

  const loadHistory = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      if (activeTab === 'quizGroups') {
        await loadQuizGroups();
      } else if (activeTab === 'groups') {
        await loadGroups();
      } else if (activeTab === 'quizzes') {
        await loadVotedQuizzes();
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuizGroups = async () => {
    try {
      // Quiz groups criados pelo usuário
      const createdQuery = query(
        collection(db, 'quizGroups'),
        where('createdBy', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const createdSnapshot = await getDocs(createdQuery);
      const created = createdSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Quiz groups em que o usuário participou (votou em algum quiz)
      const allQuizGroupsQuery = query(
        collection(db, 'quizGroups'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const allQuizGroupsSnapshot = await getDocs(allQuizGroupsQuery);
      const participated = [];

      for (const quizGroupDoc of allQuizGroupsSnapshot.docs) {
        const quizGroupData = quizGroupDoc.data();
        if (quizGroupData.createdBy === currentUser.uid) continue; // Já está em created

        // Verificar se o usuário votou em algum quiz deste grupo
        if (quizGroupData.quizzes && quizGroupData.quizzes.length > 0) {
          for (const quizId of quizGroupData.quizzes) {
            const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
            if (quizDoc.exists()) {
              const quizData = quizDoc.data();
              if (quizData.votes && quizData.votes[currentUser.uid] !== undefined) {
                participated.push({
                  id: quizGroupDoc.id,
                  ...quizGroupData,
                });
                break; // Já encontrou participação, não precisa verificar outros quizzes
              }
            }
          }
        }
      }

      setCreatedQuizGroups(created);
      setParticipatedQuizGroups(participated);
    } catch (error) {
      console.error('Error loading quiz groups:', error);
    }
  };

  const loadGroups = async () => {
    try {
      if (!userData?.groups || userData.groups.length === 0) {
        setUserGroups([]);
        return;
      }

      const groupsPromises = userData.groups.map((groupId) =>
        getDoc(doc(db, 'groups', groupId))
      );
      const groupsDocs = await Promise.all(groupsPromises);

      const groups = groupsDocs
        .filter((doc) => doc.exists())
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime - aTime;
        });

      setUserGroups(groups);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadVotedQuizzes = async () => {
    try {
      // Buscar todos os quizzes que o usuário votou
      const allQuizzesQuery = query(
        collection(db, 'quizzes'),
        orderBy('createdAt', 'desc'),
        limit(200)
      );
      const allQuizzesSnapshot = await getDocs(allQuizzesQuery);

      const voted = [];
      for (const quizDoc of allQuizzesSnapshot.docs) {
        const quizData = quizDoc.data();
        if (quizData.votes && quizData.votes[currentUser.uid] !== undefined) {
          // Buscar informações do quiz group
          let quizGroupData = null;
          if (quizData.quizGroupId) {
            const quizGroupDoc = await getDoc(doc(db, 'quizGroups', quizData.quizGroupId));
            if (quizGroupDoc.exists()) {
              quizGroupData = {
                id: quizGroupDoc.id,
                ...quizGroupDoc.data(),
              };
            }
          }

          voted.push({
            id: quizDoc.id,
            ...quizData,
            quizGroupData,
          });
        }
      }

      setVotedQuizzes(voted);
    } catch (error) {
      console.error('Error loading voted quizzes:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Data não disponível';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    if (days < 30) return `${Math.floor(days / 7)} semanas atrás`;
    if (days < 365) return `${Math.floor(days / 30)} meses atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const handleQuizGroupPress = (quizGroupId, groupName) => {
    navigation.navigate('QuizGroupDetail', {
      quizGroupId,
      groupName,
    });
  };

  const handleGroupPress = (groupId) => {
    navigation.navigate('GroupDetail', { groupId });
  };

  const renderQuizGroupCard = (quizGroup, isCreated = false) => {
    const endTime = quizGroup.endTime?.toDate?.() || new Date(quizGroup.endTime);
    const createdAt = quizGroup.createdAt?.toDate?.() || new Date(quizGroup.createdAt);
    const isActive = endTime > new Date();

    return (
      <TouchableOpacity
        key={quizGroup.id}
        style={styles.card}
        onPress={() => handleQuizGroupPress(quizGroup.id, quizGroup.groupName || 'Grupo')}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <MessageSquare size={20} color={PRIMARY_PURPLE} />
            <Text style={styles.cardTitle} numberOfLines={1}>
              {quizGroup.title || 'Grupo de Quiz'}
            </Text>
          </View>
          {isCreated && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Criado</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardSubtitle} numberOfLines={2}>
          {quizGroup.groupName || 'Grupo'}
        </Text>
        <View style={styles.cardFooter}>
          <View style={styles.cardFooterItem}>
            <Clock size={14} color="#9ca3af" />
            <Text style={styles.cardFooterText}>
              {formatDate(createdAt)}
            </Text>
          </View>
          {isActive ? (
            <View style={[styles.statusBadge, styles.statusActive]}>
              <Text style={styles.statusText}>Ativo</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, styles.statusEnded]}>
              <Text style={styles.statusText}>Encerrado</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroupCard = (group) => {
    const createdAt = group.createdAt?.toDate?.() || new Date(group.createdAt);
    const isAdmin = group.admins?.includes(currentUser.uid);

    return (
      <TouchableOpacity
        key={group.id}
        style={styles.card}
        onPress={() => handleGroupPress(group.id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Users size={20} color={PRIMARY_PURPLE} />
            <Text style={styles.cardTitle} numberOfLines={1}>
              {group.name || 'Grupo'}
            </Text>
          </View>
          {isAdmin && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Admin</Text>
            </View>
          )}
        </View>
        {group.description && (
          <Text style={styles.cardSubtitle} numberOfLines={2}>
            {group.description}
          </Text>
        )}
        <View style={styles.cardFooter}>
          <View style={styles.cardFooterItem}>
            <Users size={14} color="#9ca3af" />
            <Text style={styles.cardFooterText}>
              {group.members?.length || 0} membros
            </Text>
          </View>
          <View style={styles.cardFooterItem}>
            <Calendar size={14} color="#9ca3af" />
            <Text style={styles.cardFooterText}>
              {formatDate(createdAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderQuizCard = (quiz) => {
    const createdAt = quiz.createdAt?.toDate?.() || new Date(quiz.createdAt);
    const userVote = quiz.votes?.[currentUser.uid];

    return (
      <TouchableOpacity
        key={quiz.id}
        style={styles.card}
        onPress={() =>
          quiz.quizGroupData &&
          handleQuizGroupPress(quiz.quizGroupId, quiz.quizGroupData.groupName || 'Grupo')
        }
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <CheckCircle2 size={20} color={PRIMARY_PURPLE} />
            <Text style={styles.cardTitle} numberOfLines={1}>
              {quiz.question || 'Quiz'}
            </Text>
          </View>
        </View>
        {quiz.quizGroupData && (
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {quiz.quizGroupData.title} • {quiz.quizGroupData.groupName}
          </Text>
        )}
        <View style={styles.cardFooter}>
          <View style={styles.cardFooterItem}>
            <Text style={styles.cardFooterText}>
              Sua resposta: {quiz.options?.[userVote] || 'N/A'}
            </Text>
          </View>
          <View style={styles.cardFooterItem}>
            <Calendar size={14} color="#9ca3af" />
            <Text style={styles.cardFooterText}>
              {formatDate(createdAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={PRIMARY_PURPLE} />
          <Text style={styles.loadingText}>Carregando histórico...</Text>
        </View>
      );
    }

    if (activeTab === 'quizGroups') {
      const allQuizGroups = [
        ...createdQuizGroups.map((qg) => ({ ...qg, isCreated: true })),
        ...participatedQuizGroups,
      ];

      if (allQuizGroups.length === 0) {
        return (
          <View style={styles.centerContainer}>
            <MessageSquare size={48} color="#6b7280" />
            <Text style={styles.emptyText}>Nenhum grupo de quiz encontrado</Text>
            <Text style={styles.emptySubtext}>
              Crie ou participe de grupos de quiz para ver seu histórico
            </Text>
          </View>
        );
      }

      return (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY_PURPLE} />
          }
        >
          {createdQuizGroups.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Criados por você</Text>
              {createdQuizGroups.map((qg) => renderQuizGroupCard(qg, true))}
            </View>
          )}
          {participatedQuizGroups.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Participações</Text>
              {participatedQuizGroups.map((qg) => renderQuizGroupCard(qg, false))}
            </View>
          )}
        </ScrollView>
      );
    }

    if (activeTab === 'groups') {
      if (userGroups.length === 0) {
        return (
          <View style={styles.centerContainer}>
            <Users size={48} color="#6b7280" />
            <Text style={styles.emptyText}>Nenhum grupo encontrado</Text>
            <Text style={styles.emptySubtext}>
              Crie ou participe de grupos para ver seu histórico
            </Text>
          </View>
        );
      }

      return (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY_PURPLE} />
          }
        >
          {userGroups.map((group) => renderGroupCard(group))}
        </ScrollView>
      );
    }

    if (activeTab === 'quizzes') {
      if (votedQuizzes.length === 0) {
        return (
          <View style={styles.centerContainer}>
            <CheckCircle2 size={48} color="#6b7280" />
            <Text style={styles.emptyText}>Nenhum quiz votado</Text>
            <Text style={styles.emptySubtext}>
              Vote em quizzes para ver seu histórico
            </Text>
          </View>
        );
      }

      return (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY_PURPLE} />
          }
        >
          {votedQuizzes.map((quiz) => renderQuizCard(quiz))}
        </ScrollView>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <Header
        title="Histórico"
        onBack={() => navigation.goBack()}
      />

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'quizGroups' && styles.tabActive]}
          onPress={() => setActiveTab('quizGroups')}
          activeOpacity={0.8}
        >
          <MessageSquare
            size={18}
            color={activeTab === 'quizGroups' ? PRIMARY_PURPLE : '#9ca3af'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'quizGroups' && styles.tabTextActive,
            ]}
          >
            Grupos de Quiz
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'groups' && styles.tabActive]}
          onPress={() => setActiveTab('groups')}
          activeOpacity={0.8}
        >
          <Users
            size={18}
            color={activeTab === 'groups' ? PRIMARY_PURPLE : '#9ca3af'}
          />
          <Text
            style={[styles.tabText, activeTab === 'groups' && styles.tabTextActive]}
          >
            Grupos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'quizzes' && styles.tabActive]}
          onPress={() => setActiveTab('quizzes')}
          activeOpacity={0.8}
        >
          <CheckCircle2
            size={18}
            color={activeTab === 'quizzes' ? PRIMARY_PURPLE : '#9ca3af'}
          />
          <Text
            style={[styles.tabText, activeTab === 'quizzes' && styles.tabTextActive]}
          >
            Quizzes
          </Text>
        </TouchableOpacity>
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: PRIMARY_PURPLE,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  badge: {
    backgroundColor: PRIMARY_PURPLE,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardFooterText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  statusEnded: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#9ca3af',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

