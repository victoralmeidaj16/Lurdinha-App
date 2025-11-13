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
import * as Haptics from 'expo-haptics';
import {
  Trophy,
  Clock,
  Users,
  ChevronRight,
  ArrowRight,
  Crown,
  Sparkles,
  Bell,
  Eye,
  Ghost,
  Gift,
  Users2,
  Clock3,
  ListChecks,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';
import { useGroups } from '../hooks/useGroups';
import AvatarCircle from '../components/AvatarCircle';
import Header from '../components/Header';

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
  const [notifications, setNotifications] = useState([]);
  
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
      
      // Mock de notificações (TODO: implementar sistema real)
      setNotifications([
        { id: '1', type: 'quiz_ended', message: 'Quiz "Família Silva" foi finalizado', time: '2h atrás', read: false },
        { id: '2', type: 'new_quiz', message: 'Novo quiz disponível no grupo "Amigos"', time: '5h atrás', read: false },
        { id: '3', type: 'ranking', message: 'Você alcançou o Top 3!', time: '1d atrás', read: true },
      ]);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A4F9E" />
        <Text style={styles.loadingText}>Carregando...</Text>
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

          {/* Botão temporário para Preview Revamp */}
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => navigation.navigate('HomeScreenRevamp')}
            activeOpacity={0.8}
          >
            <Text style={styles.previewButtonText}>🔍 Ver Preview Revamp</Text>
          </TouchableOpacity>

          {/* Botão temporário para Cards Lurdinha */}
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => navigation.navigate('HomeLurdinhaCards')}
            activeOpacity={0.8}
          >
            <Text style={styles.previewButtonText}>🎴 Ver Cards Lurdinha</Text>
          </TouchableOpacity>
          </View>

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

        {/* Card: Rankings do Grupo (estilo Lurdinha Cards) */}
        {groupRanking && groupRanking.top3 && groupRanking.top3.length > 0 && (
          <Animated.View style={styles.cardWrapper}>
            <TouchableOpacity
              style={styles.lurdinhaCard}
              onPress={handleViewRanking}
              activeOpacity={0.95}
            >
              <View style={styles.lurdinhaCardPurpleGradient} />
              <View style={styles.lurdinhaCardPurpleGlow1} />
              <View style={styles.lurdinhaCardPurpleGlow2} />
              <View style={styles.lurdinhaCardPurpleAccent} />
              <View style={styles.lurdinhaCardTopSheen} />
              <View style={styles.lurdinhaCardBottomVignette} />
              <View style={styles.lurdinhaCardRim} />
              
              <View style={styles.lurdinhaCardContent}>
                <View style={styles.lurdinhaCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lurdinhaCardTitle}>Rankings{"\n"}do grupo</Text>
                    <Text style={styles.lurdinhaCardSubtitle}>Veja o pódio e seus acertos</Text>
                    <TouchableOpacity 
                      style={styles.lurdinhaCardCTA}
                      activeOpacity={0.95}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleViewRanking();
                      }}
                    >
                      <View style={styles.lurdinhaCardCTADot} />
                      <Text style={styles.lurdinhaCardCTAText}>Ver ranking</Text>
        </TouchableOpacity>
        </View>
                  <View style={styles.lurdinhaCardPill}>
                    <Text style={styles.lurdinhaCardPillText}>Top 3</Text>
        </View>
        </View>
      </View>

              <View style={styles.lurdinhaCardCornerEmoji}>
                <Text style={styles.lurdinhaCardEmojiText}>🏆</Text>
                <View style={styles.lurdinhaCardEmojiOverlay} />
      </View>
        </TouchableOpacity>
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

        {/* Notificações */}
        {notifications.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <View style={styles.cardTitleRow}>
                  <Bell size={18} color="#9061F9" style={styles.cardTitleIcon} />
                  <Text style={styles.cardTitle}>Notificações</Text>
                </View>
                <Text style={styles.cardSubtitle}>
                  {notifications.filter(n => !n.read).length} não lidas
                </Text>
              </View>
            </View>

            <View style={styles.notificationsList}>
              {notifications.slice(0, 3).map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.read && styles.notificationItemUnread,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.notificationDot} />
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationMessage}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {notification.time}
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#B9C0CC" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
  previewButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(144, 97, 249, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(144, 97, 249, 0.4)',
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#9061F9',
    fontSize: 14,
    fontWeight: '600',
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
  notificationsList: {
    gap: 8,
    marginTop: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  notificationItemUnread: {
    backgroundColor: 'rgba(144, 97, 249, 0.1)',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9061F9',
    marginRight: 10,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F5F7FB',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#B9C0CC',
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

