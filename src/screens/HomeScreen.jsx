import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import {
  Trophy,
  Clock,
  Users,
  ChevronRight,
  ArrowRight,
  Crown,
  Sparkles,
  Eye,
  Ghost,
  Gift,
  Users2,
  Clock3,
  ListChecks,
  Plus,
  Search,
  FileText,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';
import { useGroups } from '../hooks/useGroups';
import AvatarCircle from '../components/AvatarCircle';
import Header from '../components/Header';
import UsernameSetupModal from '../components/UsernameSetupModal';
import SkeletonLoading from '../components/SkeletonLoading';

export default function HomeScreen({ navigation }) {
  const { currentUser } = useAuth();
  const { userData } = useUserData();
  const { getUserGroups, getGroupQuizGroups, getQuizGroupDetails } = useGroups();

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [activeQuizGroups, setActiveQuizGroups] = useState([]);
  const [completedQuizGroups, setCompletedQuizGroups] = useState([]);
  const [groupRanking, setGroupRanking] = useState(null);
  const [quizGroupRanking, setQuizGroupRanking] = useState(null);
  const [quizGroupsWithQuizzes, setQuizGroupsWithQuizzes] = useState([]);
  const [pendingQuiz, setPendingQuiz] = useState(null);

  // Estados para animações de cards
  const [pressedCard, setPressedCard] = useState(null);
  const cardScaleAnims = useState({})[0]; // Animações de escala por card

  // Animações
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    loadHomeData();
    animateEntrance();
  }, []);

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

  const schedulePushNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Você tem uma nova notificação! 📬",
        body: 'Aqui está o corpo da notificação de teste.',
        data: { data: 'goes here' },
      },
      trigger: { seconds: 2 },
    });
  };

  const loadHomeData = async () => {
    try {
      setLoading(true);

      // Buscar grupos do usuário
      const userGroups = await getUserGroups();
      setGroups(userGroups);

      if (userGroups.length > 0) {
        // Buscar quiz groups de todos os grupos em paralelo (otimização de performance)
        const allQuizGroups = [];
        const allCompletedQuizGroups = [];

        // Usar Promise.all para fazer queries em paralelo ao invés de sequencial
        const quizGroupsPromises = userGroups.map(group => getGroupQuizGroups(group.id));
        const quizGroupsResults = await Promise.all(quizGroupsPromises);

        // Processar resultados
        quizGroupsResults.forEach((quizGroups, index) => {
          const group = userGroups[index];

          // Separar ativos e encerrados
          const active = quizGroups.filter(qg => qg.isActive && qg.status === 'active');
          const completed = quizGroups.filter(qg => !qg.isActive || qg.status === 'completed');

          allQuizGroups.push(
            ...active.map(qg => ({
              ...qg,
              groupName: group.name,
              groupId: group.id,
              groupColor: group.color,
              groupBadge: group.badge,
            }))
          );

          allCompletedQuizGroups.push(
            ...completed.map(qg => ({
              ...qg,
              groupName: group.name,
              groupId: group.id,
              groupColor: group.color,
              groupBadge: group.badge,
            }))
          );
        });

        // Ordenar por mais recentes
        allQuizGroups.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bTime - aTime;
        });

        allCompletedQuizGroups.sort((a, b) => {
          const aTime = a.endTime?.toDate ? a.endTime.toDate() : (a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt));
          const bTime = b.endTime?.toDate ? b.endTime.toDate() : (b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt));
          return bTime - aTime;
        });

        setActiveQuizGroups(allQuizGroups.slice(0, 3)); // Top 3 mais recentes
        setCompletedQuizGroups(allCompletedQuizGroups);

        // Carregar detalhes dos quiz groups ativos com seus quizzes
        const quizGroupsDetailsPromises = allQuizGroups.slice(0, 5).map(async (quizGroup) => {
          try {
            const details = await getQuizGroupDetails(quizGroup.id);
            if (!details || !details.quizzesData || details.quizzesData.length === 0) {
              return null;
            }

            // Verificar quais quizzes precisam de resposta ou podem ter resposta adicionada
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
            console.error('Error loading quiz group details:', error);
            return null;
          }
        });

        const quizGroupsDetails = await Promise.all(quizGroupsDetailsPromises);
        const filteredQuizGroups = quizGroupsDetails
          .filter(qg => qg !== null && qg.hasAction)
          .slice(0, 3); // Top 3 com ações pendentes

        setQuizGroupsWithQuizzes(filteredQuizGroups);

        // Encontrar o primeiro quiz não respondido para o card destacado
        let firstPendingQuiz = null;
        for (const qg of quizGroupsDetails) {
          if (qg && qg.quizzes) {
            const unanswered = qg.quizzes.find(q => q.needsAnswer);
            if (unanswered) {
              // Calcular tempo restante
              const endTime = qg.endTime?.toDate ? qg.endTime.toDate() : new Date(qg.endTime);
              const now = new Date();
              const hoursLeft = Math.ceil((endTime - now) / (1000 * 60 * 60));
              const minutesLeft = Math.ceil((endTime - now) / (1000 * 60)) % 60;

              let timeLeft = '';
              if (hoursLeft > 24) {
                const daysLeft = Math.floor(hoursLeft / 24);
                timeLeft = `${daysLeft}d ${hoursLeft % 24}h`;
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
                timeLeft: timeLeft,
                hoursLeft: hoursLeft,
              };
              break;
            }
          }
        }
        setPendingQuiz(firstPendingQuiz);

        // Buscar ranking de grupo (quiz group mais recente com ranking)
        const allQuizGroupsWithRanking = [...allQuizGroups, ...allCompletedQuizGroups].filter(
          qg => qg.ranking && qg.ranking.length > 0
        );

        if (allQuizGroupsWithRanking.length > 0) {
          // Ordenar por data de término (mais recente primeiro)
          const sortedWithRanking = allQuizGroupsWithRanking.sort((a, b) => {
            const aTime = a.endTime?.toDate ? a.endTime.toDate() : (a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt));
            const bTime = b.endTime?.toDate ? b.endTime.toDate() : (b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt));
            return bTime - aTime;
          });

          const latestWithRanking = sortedWithRanking[0];
          const sortedRanking = [...latestWithRanking.ranking].sort((a, b) => {
            if (latestWithRanking.rankingType === 'teams') {
              return b.totalCorrect - a.totalCorrect;
            }
            return b.correct - a.correct;
          });

          const userRank = sortedRanking.findIndex(
            r =>
              r.userId === currentUser?.uid ||
              (latestWithRanking.rankingType === 'teams' &&
                r.teamMembers?.some(m => m.userId === currentUser?.uid))
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

        // Buscar ranking geral do grupo (soma de todos os quiz groups)
        // Reutilizar dados já carregados ao invés de fazer nova query
        const mainGroup = userGroups[0];
        if (mainGroup) {
          // Usar dados já carregados se disponíveis, senão buscar
          const mainGroupQuizGroups = quizGroupsResults[0] || await getGroupQuizGroups(mainGroup.id);
          const withRanking = mainGroupQuizGroups.filter(
            qg => qg.ranking && qg.ranking.length > 0
          );

          if (withRanking.length > 0) {
            // Calcular ranking geral (agregando scores de todos os quiz groups)
            const userScores = {};
            withRanking.forEach(quizGroup => {
              const sortedRanking = [...(quizGroup.ranking || [])].sort((a, b) => {
                if (quizGroup.rankingType === 'teams') {
                  return b.totalCorrect - a.totalCorrect;
                }
                return b.correct - a.correct;
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
              .map((entry, index) => ({
                ...entry,
                position: index + 1
              }));

            const userRank = overallRanking.findIndex(
              r => r.userId === currentUser?.uid
            );

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
    } finally {
      setLoading(false);
    }
  };

  const handleViewRanking = async () => {
    if (!groupRanking || !groupRanking.groupId) return;

    try {
      // Se já tiver overallRanking calculado, usar
      if (groupRanking.overallRanking && groupRanking.overallRanking.length > 0) {
        navigation.navigate('Ranking', {
          groupId: groupRanking.groupId,
          groupName: groupRanking.groupName,
          quizGroupTitle: 'Ranking Geral do Grupo',
          overallRanking: groupRanking.overallRanking,
        });
        return;
      }

      // Caso contrário, calcular na hora
      const allQuizGroups = await getGroupQuizGroups(groupRanking.groupId);
      const withRanking = allQuizGroups.filter(
        qg => qg.ranking && qg.ranking.length > 0
      );

      if (withRanking.length > 0) {
        const userScores = {};
        withRanking.forEach(quizGroup => {
          const sortedRanking = [...(quizGroup.ranking || [])].sort((a, b) => {
            if (quizGroup.rankingType === 'teams') {
              return b.totalCorrect - a.totalCorrect;
            }
            return b.correct - a.correct;
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
          .map((entry, index) => ({
            ...entry,
            position: index + 1
          }));

        navigation.navigate('Ranking', {
          groupId: groupRanking.groupId,
          groupName: groupRanking.groupName,
          quizGroupTitle: 'Ranking Geral do Grupo',
          overallRanking: overallRanking,
        });
      } else {
        // Se não houver ranking, navegar mesmo assim para mostrar estado vazio
        navigation.navigate('Ranking', {
          groupId: groupRanking.groupId,
          groupName: groupRanking.groupName,
          quizGroupTitle: 'Ranking Geral do Grupo',
          overallRanking: [],
        });
      }
    } catch (error) {
      console.error('Error navigating to ranking:', error);
      // Navegar mesmo em caso de erro
      navigation.navigate('Ranking', {
        groupId: groupRanking.groupId,
        groupName: groupRanking.groupName,
        quizGroupTitle: 'Ranking Geral do Grupo',
      });
    }
  };

  const handleViewAllRankings = () => {
    navigation.navigate('SelectGroupRanking');
  };

  const handlePendingQuizPress = () => {
    if (pendingQuiz && pendingQuiz.quizGroupId) {
      // Encontrar o grupo correto
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

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'normal': return <Eye size={16} color="#8A4F9E" />;
      case 'ghost': return <Ghost size={16} color="#8A4F9E" />;
      case 'challenge': return <Users2 size={16} color="#8A4F9E" />;
      default: return <Eye size={16} color="#8A4F9E" />;
    }
  };

  const handleViewQuizGroup = (quizGroup) => {
    navigation.navigate('QuizGroupDetail', {
      quizGroupId: quizGroup.id,
      groupName: quizGroup.groupName,
    });
  };

  const handleViewGroup = (groupId) => {
    navigation.navigate('GroupDetail', { groupId });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.content, { paddingTop: Platform.OS === 'ios' ? 60 : 40 }]}>
          {/* Header Skeleton */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingHorizontal: 20 }}>
            <View>
              <SkeletonLoading width={50} height={20} style={{ marginBottom: 8 }} />
              <SkeletonLoading width={120} height={24} />
            </View>
            <SkeletonLoading width={40} height={40} borderRadius={20} />
          </View>

          {/* Logo Skeleton */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <SkeletonLoading width={180} height={60} />
          </View>

          {/* Quick Actions Skeleton */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 32 }}>
            <SkeletonLoading width={100} height={80} borderRadius={16} />
            <SkeletonLoading width={100} height={80} borderRadius={16} />
            <SkeletonLoading width={100} height={80} borderRadius={16} />
          </View>

          {/* Big Card Skeleton */}
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <SkeletonLoading width="100%" height={180} borderRadius={24} />
          </View>

          {/* List Item Skeleton */}
          <View style={{ paddingHorizontal: 20 }}>
            <SkeletonLoading width="100%" height={80} borderRadius={16} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
          },
        ]}
      >
        {/* Hero: Saudação e logo */}
        <View style={styles.heroContainer}>
          {/* Saudação com avatar à direita */}
          <View style={styles.heroHeader}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroOlá}>Olá 👋</Text>
              <Text style={styles.heroName}>{userData?.displayName || 'Usuário'}</Text>
            </View>
            <View style={styles.heroAvatarContainer}>
              <AvatarCircle
                name={userData?.displayName || 'Usuário'}
                size={40}
                photoURL={userData?.photoURL}
                style={styles.heroAvatar}
              />
            </View>
          </View>

          {/* Logo Centralizado */}
          <View style={styles.logoContainer}>
            <Animated.Image
              source={require('../../assets/logo.png')}
              style={[styles.logo, { transform: [{ scale: scaleAnim }] }]}
              resizeMode="contain"
            />
          </View>

        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('CreateGroup')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <Plus size={24} color="#a78bfa" />
            </View>
            <Text style={styles.quickActionText}>Criar Grupo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('SearchGroups')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Search size={24} color="#60a5fa" />
            </View>
            <Text style={styles.quickActionText}>Buscar Grupo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('SelectGroupForQuiz')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <FileText size={24} color="#34d399" />
            </View>
            <Text style={styles.quickActionText}>Criar Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={schedulePushNotification}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(255, 99, 71, 0.1)' }]}>
              <Sparkles size={24} color="#FF6347" />
            </View>
            <Text style={styles.quickActionText}>Testar Notif.</Text>
          </TouchableOpacity>
        </View>

        {/* Card: Quiz Aguardando Você - Destaque Principal */}
        {pendingQuiz && (
          <Animated.View style={styles.cardWrapper}>
            <TouchableOpacity
              style={styles.pendingQuizCard}
              activeOpacity={0.9}
              onPress={handlePendingQuizPress}
            >
              {/* Gradiente de fundo */}
              <View style={styles.pendingQuizGradient} />

              {/* Efeito glow */}
              <View style={styles.pendingQuizGlow} />

              {/* Conteúdo */}
              <View style={styles.pendingQuizContent}>
                {/* Badge superior */}
                <View style={styles.pendingQuizBadge}>
                  <Clock size={16} color="#f7fee7" />
                  <Text style={styles.pendingQuizBadgeText}>QUIZ AGUARDANDO VOCÊ</Text>
                </View>

                {/* Pergunta principal */}
                <Text style={styles.pendingQuizQuestion} numberOfLines={2}>
                  {pendingQuiz.question}
                </Text>

                {/* Informações do grupo */}
                <View style={styles.pendingQuizGroupInfo}>
                  <View style={[styles.pendingQuizGroupBadge, { backgroundColor: pendingQuiz.groupColor + '20' }]}>
                    <Text style={styles.pendingQuizGroupEmoji}>{pendingQuiz.groupBadge}</Text>
                  </View>
                  <Text style={styles.pendingQuizGroupName}>{pendingQuiz.groupName}</Text>
                  <Text style={styles.pendingQuizGroupSeparator}>•</Text>
                  <Text style={styles.pendingQuizGroupTitle}>{pendingQuiz.quizGroupTitle}</Text>
                </View>

                {/* Footer com tempo e CTA */}
                <View style={styles.pendingQuizFooter}>
                  <View style={styles.pendingQuizTimeContainer}>
                    <Clock3 size={16} color="#f7fee7" />
                    <Text style={styles.pendingQuizTime}>{pendingQuiz.timeLeft}</Text>
                  </View>
                  <View style={styles.pendingQuizCtaContainer}>
                    <Text style={styles.pendingQuizCtaText}>Responder agora</Text>
                    <ChevronRight size={18} color="#fef9c3" />
                  </View>
                </View>
              </View>

              {/* Decoração - círculos no canto */}
              <View style={styles.pendingQuizDecoration1} />
              <View style={styles.pendingQuizDecoration2} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Card: Ranking do Quiz */}
        {quizGroupRanking && (
          <Animated.View style={styles.cardWrapper}>
            <TouchableOpacity
              style={styles.rankingCardContainer}
              onPress={handleViewQuizGroupRanking}
              onPressIn={() => {
                setPressedCard('quizRanking');
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              onPressOut={() => setPressedCard(null)}
              activeOpacity={0.95}
            >
              {/* Gradiente baseado na cor da categoria */}
              <View style={[styles.rankingCardGradient, {
                backgroundColor: quizGroupRanking.isActive
                  ? 'rgba(144, 97, 249, 0.15)'
                  : 'rgba(185, 192, 204, 0.08)'
              }]} />

              {/* Efeito glow suave no canto superior direito */}
              <View style={styles.rankingCardGlow} />

              {/* Conteúdo centralizado */}
              <View style={styles.rankingCardContent}>
                {/* Ícone central com fundo semitransparente */}
                <View style={styles.rankingCardIconContainer}>
                  <View style={styles.rankingCardIconBackground}>
                    <Trophy size={40} color="#9061F9" />
                  </View>
                </View>

                {/* Label e subtítulo centralizados */}
                <View style={styles.rankingCardTextContainer}>
                  <Text style={styles.rankingCardTitle}>Ranking do Quiz</Text>
                  <Text style={styles.rankingCardSubtitle}>
                    {quizGroupRanking.quizGroupTitle}
                  </Text>
                  <Text style={styles.rankingCardGroupName}>
                    {quizGroupRanking.groupName}
                  </Text>
                </View>

                {/* Posição do usuário */}
                <View style={styles.rankingCardUserPosition}>
                  <View style={styles.rankingCardPositionBadge}>
                    <Text style={styles.rankingCardPositionNumber}>
                      {quizGroupRanking.userPosition}
                    </Text>
                    <Text style={styles.rankingCardPositionLabel}>º lugar</Text>
                  </View>
                  <Text style={styles.rankingCardUserStats}>
                    {quizGroupRanking.userData?.correct || quizGroupRanking.userData?.totalCorrect || 0} acertos
                  </Text>
                </View>
              </View>

              {/* Emoji de trofeu grande em iOS style no canto inferior direito */}
              <View style={styles.rankingCardTrophyEmoji}>
                <Text style={styles.rankingCardTrophyText}>🏆</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Card: Quiz Groups em Andamento */}
        {quizGroupsWithQuizzes.length > 0 && (
          <Animated.View style={styles.cardWrapper}>
            <View style={[styles.leftStripCard, { borderLeftColor: '#9061F9' }]}>
              <View style={styles.stripCardContent}>
                <View style={styles.revampCardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.revampHeaderRow}>
                      <ListChecks size={18} color="#B9C0CC" />
                      <Text style={styles.revampHeaderSmall}>
                        {quizGroupsWithQuizzes.length} {quizGroupsWithQuizzes.length === 1 ? 'grupo de quiz' : 'grupos de quiz'} com ações pendentes
                      </Text>
                    </View>
                    <Text style={styles.revampCardTitle}>Quizzes em andamento</Text>
                    <Text style={styles.revampCardSub}>
                      Responda ou adicione a resposta correta
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 12 }}>
                  {quizGroupsWithQuizzes.map((qg, i) => {
                    const endTime = qg.endTime?.toDate ? qg.endTime.toDate() : new Date(qg.endTime);
                    const hoursLeft = Math.ceil((endTime - new Date()) / (1000 * 60 * 60));

                    return (
                      <TouchableOpacity
                        key={qg.id}
                        style={[styles.revampRow, i < quizGroupsWithQuizzes.length - 1 && styles.revampRowDivider]}
                        onPress={() => handleViewQuizGroup(qg)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.revampRowLeft}>
                          <View style={[styles.revampGroupDot, { backgroundColor: qg.groupColor || '#8A4F9E' }]}>
                            <Text style={{ fontSize: 18 }}>{qg.groupBadge || '👥'}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.revampRowTitle} numberOfLines={1}>
                              {qg.title}
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                              <Text style={styles.revampRowSub}>{qg.groupName}</Text>
                              {qg.unansweredCount > 0 && (
                                <View style={styles.quizBadge}>
                                  <Text style={styles.quizBadgeText}>
                                    {qg.unansweredCount} {qg.unansweredCount === 1 ? 'pendente' : 'pendentes'}
                                  </Text>
                                </View>
                              )}
                              {qg.canAddAnswerCount > 0 && (
                                <View style={[styles.quizBadge, styles.quizBadgeAnswer]}>
                                  <Text style={[styles.quizBadgeText, styles.quizBadgeAnswerText]}>
                                    +{qg.canAddAnswerCount} resposta
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                        <View style={styles.revampRowRight}>
                          <Text style={styles.revampTimeText}>{hoursLeft > 0 ? `${hoursLeft}h` : 'Expirado'}</Text>
                          <ChevronRight size={16} color="#B9C0CC" />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.revampCardFooter}>
                  <TouchableOpacity
                    style={styles.revampCtaPrimary}
                    activeOpacity={0.9}
                    onPress={() => quizGroupsWithQuizzes[0] && handleViewQuizGroup(quizGroupsWithQuizzes[0])}
                  >
                    <Text style={styles.revampCtaPrimaryText}>
                      {quizGroupsWithQuizzes[0]?.unansweredCount > 0 ? 'Responder agora' : 'Adicionar resposta'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Card: Rankings (Snapshot Centralizado) */}
        <Animated.View style={styles.cardWrapper}>
          <TouchableOpacity
            style={styles.snapshotCardContainer}
            onPress={handleViewAllRankings}
            activeOpacity={0.95}
          >
            {/* Fundo semitransparente */}
            <View style={styles.snapshotCardBackground} />

            {/* Efeito glow suave no canto superior direito */}
            <View style={styles.snapshotCardGlow} />

            {/* Conteúdo centralizado */}
            <View style={styles.snapshotCardContent}>
              {/* Label e subtítulo centralizados */}
              <View style={styles.snapshotCardTextContainer}>
                <Text style={styles.snapshotCardTitle}>Rankings</Text>
                <Text style={styles.snapshotCardSubtitle}>
                  Veja quem lidera no seu grupo
                </Text>
              </View>

              {/* Top 3 (snapshot) - centralizado */}
              {(groupRanking?.top3 || quizGroupRanking?.top3) && (
                <View style={styles.snapshotTop3Container}>
                  {(groupRanking?.top3 || quizGroupRanking?.top3 || []).slice(0, 3).map((m, idx) => (
                    <View key={m.userId || idx} style={styles.snapshotTop3Item}>
                      {idx === 0 && (
                        <Crown size={16} color="#9061F9" style={styles.snapshotCrown} />
                      )}
                      <AvatarCircle
                        name={m.name || 'Usuário'}
                        size={36}
                        photoURL={m.photoURL}
                        style={idx === 0 && styles.snapshotTop3AvatarHighlight}
                      />
                      <View style={styles.snapshotTop3Info}>
                        <Text style={[styles.snapshotTop3Name, idx === 0 && styles.snapshotTop3NameHighlight]} numberOfLines={1}>
                          {m.name || 'Usuário'}
                        </Text>
                        <Text style={styles.snapshotTop3Score}>
                          ✅ {m.totalCorrect ?? m.correct ?? 0}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Emoji de trofeu grande em iOS style no canto inferior direito */}
            <View style={styles.snapshotCardTrophyEmoji}>
              <Text style={styles.snapshotCardTrophyText}>🏆</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Card: Quiz em andamento (estilo Revamp) */}
        {activeQuizGroups.length > 0 && (
          <Animated.View style={styles.cardWrapper}>
            <View style={[styles.leftStripCard, { borderLeftColor: '#9061F9' }]}>
              <TouchableOpacity
                style={styles.stripCardContent}
                activeOpacity={0.9}
              >
                <View style={styles.revampCardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.revampHeaderRow}>
                      <Clock3 size={18} color="#B9C0CC" />
                      <Text style={styles.revampHeaderSmall}>
                        {activeQuizGroups.length} {activeQuizGroups.length === 1 ? 'grupo ativo' : 'grupos ativos'}
                      </Text>
                    </View>
                    <Text style={styles.revampCardTitle}>Quiz em andamento</Text>
                    <Text style={styles.revampCardSub}>
                      {activeQuizGroups[0]?.title || 'Quiz'} • {activeQuizGroups[0]?.groupName || 'Grupo'}
                    </Text>
                  </View>
                  <View style={styles.revampBadge}>
                    <Text style={styles.revampBadgeText}>
                      {(() => {
                        const endTime = activeQuizGroups[0]?.endTime?.toDate
                          ? activeQuizGroups[0].endTime.toDate()
                          : new Date(activeQuizGroups[0]?.endTime || Date.now());
                        const hoursLeft = Math.ceil((endTime - new Date()) / (1000 * 60 * 60));
                        return hoursLeft > 0 ? `${hoursLeft}h` : 'Expirado';
                      })()}
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 8 }}>
                  {activeQuizGroups.slice(0, 3).map((q, i) => {
                    const endTime = q.endTime?.toDate ? q.endTime.toDate() : new Date(q.endTime);
                    const hoursLeft = Math.ceil((endTime - new Date()) / (1000 * 60 * 60));

                    return (
                      <TouchableOpacity
                        key={q.id}
                        style={[styles.revampRow, i < Math.min(activeQuizGroups.length, 3) - 1 && styles.revampRowDivider]}
                        onPress={() => handleViewQuizGroup(q)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.revampRowLeft}>
                          <View style={[styles.revampGroupDot, { backgroundColor: q.groupColor || '#8A4F9E' }]}>
                            <Text style={{ fontSize: 18 }}>{q.groupBadge || '👥'}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.revampRowTitle} numberOfLines={1}>
                              {q.title}
                            </Text>
                            <Text style={styles.revampRowSub}>{q.groupName}</Text>
                          </View>
                        </View>
                        <View style={styles.revampRowRight}>
                          <Text style={styles.revampTimeText}>{hoursLeft > 0 ? `${hoursLeft}h` : 'Expirado'}</Text>
                          <ListChecks size={14} color="#9061F9" />
                          <ChevronRight size={16} color="#B9C0CC" />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.revampCardFooter}>
                  <TouchableOpacity
                    style={styles.revampCtaOutline}
                    activeOpacity={0.9}
                    onPress={handleViewAllRankings}
                  >
                    <Text style={styles.revampCtaOutlineText}>Ver todos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.revampCtaPrimary}
                    activeOpacity={0.9}
                    onPress={() => activeQuizGroups[0] && handleViewQuizGroup(activeQuizGroups[0])}
                  >
                    <Text style={styles.revampCtaPrimaryText}>Continuar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Card: Meus Grupos */}
        {groups.length > 0 && (
          <Animated.View style={styles.cardWrapper}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('groups')}
              onPressIn={() => setPressedCard('myGroups')}
              onPressOut={() => setPressedCard(null)}
              activeOpacity={1}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <View style={styles.cardTitleRow}>
                    <Users2 size={18} color="#9061F9" style={styles.cardTitleIcon} />
                    <Text style={styles.cardTitle}>Abrir grupos</Text>
                  </View>
                  <Text style={styles.cardSubtitle}>
                    {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'}
                  </Text>
                </View>
                <Animated.View style={styles.chevronContainer}>
                  <ChevronRight size={18} color="#B9C0CC" />
                </Animated.View>
              </View>

              {/* Preview dos grupos */}
              <View style={styles.groupsPreview}>
                {groups.slice(0, 3).map((group, index) => (
                  <View key={group.id} style={styles.groupPreviewItem}>
                    <View
                      style={[
                        styles.groupPreviewBadge,
                        { backgroundColor: group.color || '#8A4F9E' },
                      ]}
                    >
                      <Text style={styles.groupPreviewBadgeText}>
                        {group.badge || '👥'}
                      </Text>
                    </View>
                    <Text style={styles.groupPreviewName} numberOfLines={1}>
                      {group.name}
                    </Text>
                  </View>
                ))}
                {groups.length > 3 && (
                  <View style={styles.groupPreviewMore}>
                    <Text style={styles.groupPreviewMoreText}>+{groups.length - 3}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}


        {/* Empty State */}
        {groups.length === 0 && activeQuizGroups.length === 0 && !groupRanking && !quizGroupRanking && (
          <View style={styles.emptyContainer}>
            <Users size={64} color="#71717a" />
            <Text style={styles.emptyTitle}>Bem-vindo!</Text>
            <Text style={styles.emptyText}>
              Você ainda não está em nenhum grupo
            </Text>
            <Text style={styles.emptySubtext}>
              Crie um grupo ou entre em um existente para começar!
            </Text>
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

      {/* Modal de Configuração de Username */}
      <UsernameSetupModal
        visible={!!userData && !userData.username}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E10',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0E0E10',
  },
  loadingText: {
    color: '#B9C0CC',
    fontSize: 16,
    marginTop: 16,
  },
  // Hero
  heroContainer: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroOlá: {
    fontSize: 14,
    fontWeight: '400',
    color: '#B9C0CC',
    marginBottom: 6,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F5F7FB',
    letterSpacing: 0.3,
  },
  heroAvatarContainer: {
    position: 'relative',
    marginLeft: 16,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    paddingVertical: 24,
  },
  logo: {
    width: 200,
    height: 200,
  },
  heroAvatar: {
    shadowColor: '#9061F9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    paddingTop: 0,
    paddingBottom: 100,
    gap: 24,
  },
  // Cards
  cardWrapper: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#17171B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitleIcon: {
    marginRight: 4,
  },
  cardCrownSmall: {
    marginLeft: -4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#F5F7FB',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#B9C0CC',
  },
  chevronContainer: {
    marginLeft: 8,
  },
  // Estilos do novo card de ranking
  rankingCardContainer: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#17171B',
    borderRadius: 20,
    padding: 24,
    minHeight: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rankingCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  rankingCardGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(144, 97, 249, 0.2)',
    shadowColor: '#9061F9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
  },
  rankingCardContent: {
    position: 'relative',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 152,
  },
  rankingCardIconContainer: {
    marginBottom: 16,
  },
  rankingCardIconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(144, 97, 249, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(144, 97, 249, 0.3)',
  },
  rankingCardTextContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  rankingCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F5F7FB',
    marginBottom: 6,
    textAlign: 'center',
  },
  rankingCardSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F5F7FB',
    marginBottom: 4,
    textAlign: 'center',
  },
  rankingCardGroupName: {
    fontSize: 13,
    color: '#B9C0CC',
    textAlign: 'center',
  },
  rankingCardUserPosition: {
    alignItems: 'center',
    gap: 8,
  },
  rankingCardPositionBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(144, 97, 249, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(144, 97, 249, 0.4)',
  },
  rankingCardPositionNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#9061F9',
  },
  rankingCardPositionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#B9C0CC',
    marginLeft: 4,
  },
  rankingCardUserStats: {
    fontSize: 14,
    color: '#B9C0CC',
    fontWeight: '500',
  },
  rankingCardTrophyEmoji: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  rankingCardTrophyText: {
    fontSize: 80,
    lineHeight: 80,
    textAlign: 'center',
  },
  rankingPreview: {
    gap: 16,
  },
  rankingPosition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(144, 97, 249, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(144, 97, 249, 0.3)',
  },
  positionNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#9061F9',
  },
  positionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9061F9',
    marginLeft: 4,
  },
  rankingStats: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F5F7FB',
  },
  top3Preview: {
    gap: 10,
  },
  top3Item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  crownIcon: {
    marginRight: -2,
  },
  top3Avatar: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  top3AvatarHighlight: {
    borderColor: '#9061F9',
    borderWidth: 2.5,
  },
  top3Info: {
    flex: 1,
  },
  top3Name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F5F7FB',
    marginBottom: 2,
  },
  top3NameHighlight: {
    color: '#9061F9',
    fontWeight: '700',
  },
  top3Score: {
    fontSize: 12,
    color: '#B9C0CC',
  },
  quizGroupsList: {
    gap: 0,
    marginTop: 8,
  },
  quizGroupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  quizGroupItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  quizGroupItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  groupBadgeMini: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBadgeMiniText: {
    fontSize: 18,
  },
  quizGroupItemInfo: {
    flex: 1,
  },
  quizGroupItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F5F7FB',
    marginBottom: 4,
  },
  quizGroupItemGroup: {
    fontSize: 12,
    color: '#B9C0CC',
  },
  quizGroupItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quizGroupItemTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF7A59',
  },
  activeIndicator: {
    marginLeft: 4,
  },
  groupsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  groupPreviewItem: {
    alignItems: 'center',
    gap: 8,
    width: '30%',
  },
  groupPreviewBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupPreviewBadgeText: {
    fontSize: 24,
  },
  groupPreviewName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F5F7FB',
    textAlign: 'center',
  },
  groupPreviewMore: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupPreviewMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B9C0CC',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F5F7FB',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F5F7FB',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#B9C0CC',
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#9061F9',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#9061F9',
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
  revampCtaPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    gap: 12,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 32,
    // gap removed to allow space-between to handle spacing
  },
  quickActionButton: {
    width: '30%', // Reverted to 30% width
    backgroundColor: '#18181b', // Zinc-900
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27272a', // Zinc-800
    aspectRatio: 1, // Square-ish aspect ratio
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    // Removed solid background, using subtle tint in the component
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e5e7eb', // Gray-200
    textAlign: 'center',
  },
  quizGroupStatusBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(144, 97, 249, 0.15)',
  },
  quizGroupStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Estilos do card de snapshot centralizado
  snapshotCardContainer: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#17171B',
    borderRadius: 20,
    padding: 24,
    minHeight: 180,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  snapshotCardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  snapshotCardGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(144, 97, 249, 0.15)',
    shadowColor: '#9061F9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  snapshotCardContent: {
    position: 'relative',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotCardTextContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  snapshotCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F5F7FB',
    marginBottom: 6,
    textAlign: 'center',
  },
  snapshotCardSubtitle: {
    fontSize: 14,
    color: '#B9C0CC',
    textAlign: 'center',
  },
  snapshotTop3Container: {
    width: '100%',
    gap: 12,
  },
  snapshotTop3Item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  snapshotCrown: {
    marginRight: -4,
  },
  snapshotTop3AvatarHighlight: {
    borderWidth: 2,
    borderColor: '#9061F9',
  },
  snapshotTop3Info: {
    flex: 1,
  },
  snapshotTop3Name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F5F7FB',
    marginBottom: 4,
  },
  snapshotTop3NameHighlight: {
    color: '#9061F9',
    fontWeight: '700',
  },
  snapshotTop3Score: {
    fontSize: 13,
    color: '#B9C0CC',
    fontWeight: '500',
  },
  snapshotCardTrophyEmoji: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  snapshotCardTrophyText: {
    fontSize: 80,
    lineHeight: 80,
    textAlign: 'center',
  },
  // Estilos para cards estilo Revamp
  leftStripCard: {
    backgroundColor: '#17171B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderLeftWidth: 6,
  },
  stripCardContent: {
    width: '100%',
  },
  revampCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  revampHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  revampHeaderSmall: {
    fontSize: 12,
    color: '#B9C0CC',
  },
  revampCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F5F7FB',
    marginTop: 6,
  },
  revampCardSub: {
    fontSize: 13,
    color: '#B9C0CC',
    marginTop: 2,
  },
  revampBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,122,89,0.12)',
  },
  revampBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF7A59',
  },
  revampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  revampRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  revampRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  revampRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  revampGroupDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revampRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F5F7FB',
  },
  revampRowSub: {
    fontSize: 12,
    color: '#B9C0CC',
  },
  revampTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF7A59',
  },
  revampCardFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  revampCtaPrimary: {
    backgroundColor: '#9061F9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  revampCtaPrimaryText: {
    color: '#F5F7FB',
    fontWeight: '700',
    fontSize: 14,
  },
  revampCtaOutline: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  revampCtaOutlineText: {
    color: '#F5F7FB',
    fontWeight: '600',
    fontSize: 14,
  },
  quizBadge: {
    backgroundColor: 'rgba(255, 122, 89, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  quizBadgeAnswer: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  quizBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF7A59',
  },
  quizBadgeAnswerText: {
    color: '#FBBF24',
  },
  // Estilos para card "Quiz Aguardando Você"
  pendingQuizCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: '#17171B',
    minHeight: 200,
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  pendingQuizGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(147, 51, 234, 0.25)',
    borderRadius: 24,
  },
  pendingQuizGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
  },
  pendingQuizContent: {
    position: 'relative',
    zIndex: 10,
    padding: 24,
    gap: 16,
  },
  pendingQuizBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(22, 101, 52, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  pendingQuizBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f7fee7',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pendingQuizQuestion: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ede9fe',
    lineHeight: 30,
    marginTop: 4,
  },
  pendingQuizGroupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pendingQuizGroupBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pendingQuizGroupEmoji: {
    fontSize: 18,
  },
  pendingQuizGroupName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e9d5ff',
  },
  pendingQuizGroupSeparator: {
    fontSize: 14,
    color: '#c084fc',
    marginHorizontal: 4,
  },
  pendingQuizGroupTitle: {
    fontSize: 14,
    color: '#c084fc',
  },
  pendingQuizFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(192, 132, 252, 0.2)',
  },
  pendingQuizTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(22, 101, 52, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pendingQuizTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f7fee7',
  },
  pendingQuizCtaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(254, 249, 195, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(254, 249, 195, 0.3)',
  },
  pendingQuizCtaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fef9c3',
    letterSpacing: 0.3,
  },
  pendingQuizDecoration1: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
    zIndex: 1,
  },
  pendingQuizDecoration2: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(192, 132, 252, 0.1)',
    zIndex: 1,
  },
  // Estilos para card estilo Lurdinha
  lurdinhaCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#17171B',
    shadowColor: '#9061F9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
    minHeight: 180,
  },
  lurdinhaCardPurpleGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    backgroundColor: 'rgba(144, 97, 249, 0.1)',
  },
  lurdinhaCardPurpleGlow1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(144, 97, 249, 0.25)',
  },
  lurdinhaCardPurpleGlow2: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(144, 97, 249, 0.15)',
  },
  lurdinhaCardPurpleAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    backgroundColor: '#9061F9',
  },
  lurdinhaCardTopSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.10)',
    opacity: 0.6,
  },
  lurdinhaCardBottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 128,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: '#000000',
    opacity: 0.5,
  },
  lurdinhaCardRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  lurdinhaCardContent: {
    position: 'relative',
    zIndex: 10,
  },
  lurdinhaCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  lurdinhaCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.01,
    color: '#F5F7FB',
    marginBottom: 8,
  },
  lurdinhaCardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 24,
  },
  lurdinhaCardCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#9061F9',
    borderWidth: 0,
    shadowColor: '#9061F9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
    alignSelf: 'flex-start',
  },
  lurdinhaCardCTADot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  lurdinhaCardCTAText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  lurdinhaCardPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lurdinhaCardPillText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  lurdinhaCardCornerEmoji: {
    position: 'absolute',
    bottom: -24,
    right: -16,
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 40,
    elevation: 12,
    backgroundColor: '#17171B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lurdinhaCardEmojiText: {
    fontSize: 64,
    lineHeight: 64,
  },
  lurdinhaCardEmojiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 80,
  },
});

