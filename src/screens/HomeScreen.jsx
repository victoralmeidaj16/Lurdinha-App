import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Users } from 'lucide-react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';
import { useGroups } from '../hooks/useGroups';
import UsernameSetupModal from '../components/UsernameSetupModal';
import SkeletonLoading from '../components/SkeletonLoading';
import NetworkRetry from '../components/NetworkRetry';
import { colors } from '../theme';

// ─── Sub-Components ──────────────────────────────────────────
import HeroSection from '../components/home/HeroSection';
import QuickActions from '../components/home/QuickActions';
import AdminNotificationBanner from '../components/home/AdminNotificationBanner';
import GameCards from '../components/home/GameCards';
import PendingQuizCard from '../components/home/PendingQuizCard';
import { QuizRankingCard, SnapshotRankingCard } from '../components/home/RankingCard';
import ActiveQuizGroupsCard from '../components/home/ActiveQuizGroupsCard';
import MyGroupsCard from '../components/home/MyGroupsCard';

export default function HomeScreen({ navigation }) {
  const { currentUser } = useAuth();
  const { userData, refreshUserData } = useUserData();
  const { getUserGroups, getGroupQuizGroups, getQuizGroupDetails, acceptJoinRequest, rejectJoinRequest } = useGroups();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [groups, setGroups] = useState([]);
  const [activeQuizGroups, setActiveQuizGroups] = useState([]);
  const [completedQuizGroups, setCompletedQuizGroups] = useState([]);
  const [groupRanking, setGroupRanking] = useState(null);
  const [quizGroupRanking, setQuizGroupRanking] = useState(null);
  const [quizGroupsWithQuizzes, setQuizGroupsWithQuizzes] = useState([]);
  const [pendingQuiz, setPendingQuiz] = useState(null);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [pressedCard, setPressedCard] = useState(null);

  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    loadHomeData();
    animateEntrance();
  }, [userData?.groups]);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const processAdminNotifications = async (groups) => {
    if (!currentUser) return;
    const adminGroups = groups.filter(g => g.admins && g.admins.includes(currentUser.uid));

    if (adminGroups.length === 0) {
      setAdminNotifications([]);
      return;
    }

    const notifications = [];
    for (const group of adminGroups) {
      if (group.pendingRequests && group.pendingRequests.length > 0) {
        const userIds = group.pendingRequests.filter(req => typeof req === 'string');
        if (userIds.length > 0) {
          const userPromises = userIds.map(uid => getDoc(doc(db, 'users', uid)));
          const userDocs = await Promise.all(userPromises);

          userDocs.forEach(docSnap => {
            if (docSnap.exists()) {
              const uData = docSnap.data();
              notifications.push({
                type: 'join_request',
                id: `${group.id}_${docSnap.id}`,
                groupId: group.id,
                groupName: group.name,
                groupColor: group.color || '#8b5cf6',
                userId: docSnap.id,
                userName: uData.username || uData.displayName || 'Usuário',
                userPhoto: uData.photoURL,
                timestamp: new Date(),
              });
            }
          });
        }
      }
    }
    setAdminNotifications(notifications);
  };

  const loadHomeData = async () => {
    try {
      setError(false);
      setLoading(true);

      const userGroups = await getUserGroups();
      setGroups(userGroups);

      if (userGroups.length > 0) {
        processAdminNotifications(userGroups);

        const allQuizGroups = [];
        const allCompletedQuizGroups = [];

        const quizGroupsPromises = userGroups.map(group => getGroupQuizGroups(group.id));
        const quizGroupsResults = await Promise.all(quizGroupsPromises);

        quizGroupsResults.forEach((quizGroups, index) => {
          const group = userGroups[index];
          const active = quizGroups.filter(qg => qg.isActive && qg.status === 'active');
          const completed = quizGroups.filter(qg => !qg.isActive || qg.status === 'completed');

          const mapGroupData = qg => ({
            ...qg,
            groupName: group.name,
            groupId: group.id,
            groupColor: group.color,
            groupBadge: group.badge,
          });

          allQuizGroups.push(...active.map(mapGroupData));
          allCompletedQuizGroups.push(...completed.map(mapGroupData));
        });

        allQuizGroups.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bTime - aTime;
        });

        allCompletedQuizGroups.sort((a, b) => {
          const aTime = a.endTime?.toDate ? a.endTime.toDate() : new Date(a.createdAt || 0);
          const bTime = b.endTime?.toDate ? b.endTime.toDate() : new Date(b.createdAt || 0);
          return bTime - aTime;
        });

        setActiveQuizGroups(allQuizGroups.slice(0, 3));
        setCompletedQuizGroups(allCompletedQuizGroups);

        const quizGroupsDetailsPromises = allQuizGroups.slice(0, 5).map(async (quizGroup) => {
          try {
            const details = await getQuizGroupDetails(quizGroup.id);
            if (!details || !details.quizzesData || details.quizzesData.length === 0) return null;

            const quizzesWithStatus = details.quizzesData.map((quiz) => {
              const userVote = quiz.votes && quiz.votes[currentUser?.uid] !== undefined;
              const hasCorrectAnswer = quiz.correctAnswer !== null && quiz.correctAnswer !== undefined;
              const isActive = details.status === 'active';

              return {
                ...quiz,
                hasVoted: userVote,
                hasCorrectAnswer,
                needsAnswer: !userVote && isActive,
                canAddAnswer: userVote && !hasCorrectAnswer && isActive,
              };
            });

            const unansweredQuizzes = quizzesWithStatus.filter(q => q.needsAnswer);
            const canAddAnswerQuizzes = quizzesWithStatus.filter(q => q.canAddAnswer);

            return {
              ...quizGroup,
              quizzes: quizzesWithStatus,
              unansweredCount: unansweredQuizzes.length,
              canAddAnswerCount: canAddAnswerQuizzes.length,
              hasAction: unansweredQuizzes.length > 0 || canAddAnswerQuizzes.length > 0,
            };
          } catch (error) {
            return null;
          }
        });

        const quizGroupsDetails = await Promise.all(quizGroupsDetailsPromises);
        const filteredQuizGroups = quizGroupsDetails.filter(qg => qg !== null && qg.hasAction).slice(0, 3);
        setQuizGroupsWithQuizzes(filteredQuizGroups);

        let firstPendingQuiz = null;
        for (const qg of quizGroupsDetails) {
          if (qg && qg.quizzes) {
            const unanswered = qg.quizzes.find(q => q.needsAnswer);
            if (unanswered) {
              const endTime = qg.endTime?.toDate ? qg.endTime.toDate() : new Date(qg.endTime);
              const now = new Date();
              const hoursLeft = Math.ceil((endTime - now) / (1000 * 60 * 60));
              const minutesLeft = Math.ceil((endTime - now) / (1000 * 60)) % 60;

              let timeLeft = '';
              if (hoursLeft > 24) {
                timeLeft = `${Math.floor(hoursLeft / 24)}d ${hoursLeft % 24}h`;
              } else if (hoursLeft > 0) {
                timeLeft = `${hoursLeft}h ${minutesLeft > 0 ? minutesLeft + 'm' : ''}`;
              } else if (minutesLeft > 0) {
                timeLeft = `${minutesLeft}m`;
              } else {
                timeLeft = 'Expirado';
              }

              firstPendingQuiz = {
                ...unanswered,
                quizGroupId: qg.id,
                groupId: qg.groupId,
                quizGroupTitle: qg.title,
                groupName: qg.groupName,
                groupBadge: qg.groupBadge || '👥',
                groupColor: qg.groupColor || '#8A4F9E',
                timeLeft,
                hoursLeft,
              };
              break;
            }
          }
        }
        setPendingQuiz(firstPendingQuiz);

        const allQuizGroupsWithRanking = [...allQuizGroups, ...allCompletedQuizGroups].filter(
          qg => qg.ranking && qg.ranking.length > 0
        );

        if (allQuizGroupsWithRanking.length > 0) {
          const sortedWithRanking = allQuizGroupsWithRanking.sort((a, b) => {
            const aTime = a.endTime?.toDate ? a.endTime.toDate() : new Date(a.createdAt || 0);
            const bTime = b.endTime?.toDate ? b.endTime.toDate() : new Date(b.createdAt || 0);
            return bTime - aTime;
          });

          const latestWithRanking = sortedWithRanking[0];
          const sortedRanking = [...latestWithRanking.ranking].sort((a, b) => {
            return latestWithRanking.rankingType === 'teams'
              ? b.totalCorrect - a.totalCorrect
              : b.correct - a.correct;
          });

          const userRank = sortedRanking.findIndex(r =>
            r.userId === currentUser?.uid ||
            (latestWithRanking.rankingType === 'teams' && r.teamMembers?.some(m => m.userId === currentUser?.uid))
          );

          if (userRank >= 0) {
            setQuizGroupRanking({
              groupName: latestWithRanking.groupName,
              groupId: latestWithRanking.groupId,
              quizGroupId: latestWithRanking.id,
              quizGroupTitle: latestWithRanking.title,
              isActive: latestWithRanking.isActive,
              userPosition: userRank + 1,
              totalParticipants: sortedRanking.length,
              userData: sortedRanking[userRank],
              top3: sortedRanking.slice(0, 3),
              rankingType: latestWithRanking.rankingType,
            });
          }
        }

        const mainGroup = userGroups[0];
        if (mainGroup) {
          const mainGroupQuizGroups = quizGroupsResults[0] || await getGroupQuizGroups(mainGroup.id);
          const withRanking = mainGroupQuizGroups.filter(qg => qg.ranking && qg.ranking.length > 0);

          if (withRanking.length > 0) {
            const userScores = {};
            withRanking.forEach(quizGroup => {
              const sortedRanking = [...(quizGroup.ranking || [])].sort((a, b) => {
                return quizGroup.rankingType === 'teams'
                  ? b.totalCorrect - a.totalCorrect
                  : b.correct - a.correct;
              });

              sortedRanking.forEach((entry) => {
                const userId = quizGroup.rankingType === 'teams'
                  ? entry.teamMembers?.map(m => m.userId).join('_')
                  : entry.userId;

                if (!userScores[userId]) {
                  userScores[userId] = {
                    userId: entry.userId || userId,
                    name: entry.name || 'Usuário',
                    totalCorrect: 0,
                    totalQuizzes: 0,
                  };
                }
                userScores[userId].totalCorrect += (entry.correct || entry.totalCorrect || 0);
                userScores[userId].totalQuizzes += 1;
              });
            });

            const overallRanking = Object.values(userScores)
              .sort((a, b) => b.totalCorrect - a.totalCorrect)
              .map((entry, index) => ({ ...entry, position: index + 1 }));

            const userRank = overallRanking.findIndex(r => r.userId === currentUser?.uid);

            if (userRank >= 0 || overallRanking.length > 0) {
              setGroupRanking({
                groupName: mainGroup.name,
                groupId: mainGroup.id,
                userPosition: userRank >= 0 ? userRank + 1 : null,
                totalParticipants: overallRanking.length,
                userData: userRank >= 0 ? overallRanking[userRank] : null,
                top3: overallRanking.slice(0, 3),
                overallRanking: overallRanking,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading home data:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePendingQuizPress = () => {
    if (pendingQuiz && pendingQuiz.quizGroupId) {
      const quizGroup = activeQuizGroups.find(qg => qg.id === pendingQuiz.quizGroupId) ||
        completedQuizGroups.find(qg => qg.id === pendingQuiz.quizGroupId);

      navigation.navigate('QuizGroupDetail', {
        quizGroupId: pendingQuiz.quizGroupId,
        groupId: quizGroup?.groupId || pendingQuiz.groupId || groups[0]?.id,
        groupName: pendingQuiz.groupName,
      });
    }
  };

  const handleViewQuizGroupRanking = () => {
    if (quizGroupRanking) {
      navigation.navigate('Ranking', {
        quizGroupId: quizGroupRanking.quizGroupId,
        groupId: quizGroupRanking.groupId,
        groupName: quizGroupRanking.groupName,
        quizGroupTitle: quizGroupRanking.quizGroupTitle,
      });
    }
  };

  const handleViewAllRankings = () => {
    navigation.navigate('SelectGroupRanking');
  };

  const handleViewQuizGroup = (quizGroup) => {
    navigation.navigate('QuizGroupDetail', {
      quizGroupId: quizGroup.id,
      groupName: quizGroup.groupName,
    });
  };

  const handleAcceptRequest = async (notification) => {
    try {
      await acceptJoinRequest(notification.groupId, notification.userId);
      setAdminNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (error) {
      console.error('Erro ao aceitar:', error);
    }
  };

  const handleRejectRequest = async (notification) => {
    try {
      await rejectJoinRequest(notification.groupId, notification.userId);
      setAdminNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (error) {
      console.error('Erro ao recusar:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[{ paddingTop: Platform.OS === 'ios' ? 60 : 40 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingHorizontal: 20 }}>
            <View>
              <SkeletonLoading width={50} height={20} style={{ marginBottom: 8 }} />
              <SkeletonLoading width={120} height={24} />
            </View>
            <SkeletonLoading width={40} height={40} borderRadius={20} />
          </View>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <SkeletonLoading width={180} height={60} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 32 }}>
            <SkeletonLoading width={100} height={80} borderRadius={16} />
            <SkeletonLoading width={100} height={80} borderRadius={16} />
            <SkeletonLoading width={100} height={80} borderRadius={16} />
          </View>
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <SkeletonLoading width="100%" height={180} borderRadius={24} />
          </View>
          <View style={{ paddingHorizontal: 20 }}>
            <SkeletonLoading width="100%" height={80} borderRadius={16} />
          </View>
        </View>
      </View>
    );
  }

  if (error) {
    return <NetworkRetry onRetry={loadHomeData} message="Erro ao carregar os dados. Verifique a internet e tente novamente." />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View
        style={[
          { paddingBottom: 100 },
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
          },
        ]}
      >
        <HeroSection userData={userData} scaleAnim={scaleAnim} />
        <QuickActions />

        <AdminNotificationBanner
          adminNotifications={adminNotifications}
          handleAcceptRequest={handleAcceptRequest}
          handleRejectRequest={handleRejectRequest}
        />

        <GameCards />

        <PendingQuizCard
          pendingQuiz={pendingQuiz}
          handlePendingQuizPress={handlePendingQuizPress}
        />

        <QuizRankingCard
          quizGroupRanking={quizGroupRanking}
          handleViewQuizGroupRanking={handleViewQuizGroupRanking}
          setPressedCard={setPressedCard}
        />

        <ActiveQuizGroupsCard
          activeQuizGroups={activeQuizGroups}
          handleViewQuizGroup={handleViewQuizGroup}
          handleViewAllRankings={handleViewAllRankings}
        />

        <SnapshotRankingCard
          groupRanking={groupRanking}
          quizGroupRanking={quizGroupRanking}
          handleViewAllRankings={handleViewAllRankings}
        />

        <MyGroupsCard
          groups={groups}
          setPressedCard={setPressedCard}
        />

        {/* Empty State */}
        {groups.length === 0 && activeQuizGroups.length === 0 && !groupRanking && !quizGroupRanking && (
          <View style={styles.emptyContainer}>
            <Users size={64} color="#71717a" />
            <Text style={styles.emptyTitle}>Bem-vindo!</Text>
            <Text style={styles.emptyText}>Você ainda não está em nenhum grupo</Text>
            <Text style={styles.emptySubtext}>Crie um grupo ou entre em um existente para começar!</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('groups')}
              activeOpacity={0.9}
            >
              <Text style={styles.emptyButtonText}>Ver Grupos</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      <UsernameSetupModal
        visible={!!userData && !userData.username}
        onSuccess={refreshUserData}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textLight,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textLight,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textAlt,
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: colors.primaryMuted,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
