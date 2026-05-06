import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  Share,
  Platform,
} from 'react-native';
import {
  ArrowRight,
  Share2,
  Star,
  Trophy,
  Crown,
  Sparkles,
  Users2,
  ChevronRight,
  Clock,
} from 'lucide-react-native';
import Reanimated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import AvatarCircle from '../components/AvatarCircle';
import { colors, fontStyles } from '../theme';

const { width } = Dimensions.get('window');

function RankingHeader({ title = 'Ranking', subtitle, onBack }) {
  return (
    <View style={styles.rankingHeader}>
      <TouchableOpacity style={styles.rankingBackBtn} onPress={onBack} activeOpacity={0.82}>
        <ArrowRight size={20} color="#FFFFFF" style={{ transform: [{ rotate: '180deg' }] }} />
      </TouchableOpacity>
      <View style={styles.rankingHeaderText}>
        <Text style={styles.rankingPageTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rankingPageSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const SOCIAL_GAME_RANKINGS = {
  lurdinha: {
    title: 'Lurdinha',
    subtitle: 'Vitórias no modo Lurdinha',
    emoji: '😈',
    scoreLabel: 'vitórias',
    getScore: (socialGames = {}) => socialGames.lurdinhaWins || 0,
    getPlayed: (socialGames = {}) => socialGames.lurdinhaPlayed || 0,
  },
  draw: {
    title: 'Desenho',
    subtitle: 'Melhor pontuação no modo desenho',
    emoji: '✏️',
    scoreLabel: 'pts',
    getScore: (socialGames = {}) => socialGames.bestDrawScore || 0,
    getPlayed: (socialGames = {}) => socialGames.drawPlayed || 0,
  },
  telephone: {
    title: 'Telefone Sem Fio',
    subtitle: 'Vitórias em cadeias secretas',
    emoji: '📖',
    scoreLabel: 'vitórias',
    getScore: (socialGames = {}) => socialGames.secretWins || 0,
    getPlayed: (socialGames = {}) => socialGames.secretPlayed || 0,
  },
  most_likely: {
    title: 'Quem é mais provável?',
    subtitle: 'Vitórias na percepção coletiva',
    emoji: '👀',
    scoreLabel: 'vitórias',
    getScore: (socialGames = {}) => socialGames.mostLikelyWins || 0,
    getPlayed: (socialGames = {}) => socialGames.mostLikelyPlayed || 0,
  },
  obvious_mind: {
    title: 'Na Minha Cabeça Era Óbvio',
    subtitle: 'Vitórias tentando pensar igual ao alvo',
    emoji: '🧠',
    scoreLabel: 'vitórias',
    getScore: (socialGames = {}) => socialGames.obviousMindWins || 0,
    getPlayed: (socialGames = {}) => socialGames.obviousMindPlayed || 0,
  },
};

function RankingShowcaseAnimation({
  title = 'Ranking da galera',
  subtitle = 'O topo aparece com energia de disputa.',
  entries = [],
}) {
  const mainScale = useSharedValue(0.55);
  const mainOpacity = useSharedValue(0);
  const mainY = useSharedValue(36);
  const secondX = useSharedValue(0);
  const secondY = useSharedValue(0);
  const secondOpacity = useSharedValue(0);
  const thirdX = useSharedValue(0);
  const thirdY = useSharedValue(0);
  const thirdOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.65);
  const glowOpacity = useSharedValue(0);
  const floatY = useSharedValue(0);
  const shineX = useSharedValue(-90);

  useEffect(() => {
    mainScale.value = 0.55;
    mainOpacity.value = 0;
    mainY.value = 36;
    secondX.value = 0;
    secondY.value = 0;
    secondOpacity.value = 0;
    thirdX.value = 0;
    thirdY.value = 0;
    thirdOpacity.value = 0;
    glowScale.value = 0.65;
    glowOpacity.value = 0;
    floatY.value = 0;
    shineX.value = -90;

    mainOpacity.value = withTiming(1, { duration: 160 });
    mainScale.value = withSequence(
      withTiming(1.12, { duration: 180 }),
      withSpring(1, { damping: 12, stiffness: 180 })
    );
    glowOpacity.value = withDelay(220, withTiming(0.76, { duration: 380 }));
    glowScale.value = withDelay(220, withTiming(1.12, { duration: 380 }));
    shineX.value = withDelay(420, withTiming(110, { duration: 540 }));

    mainY.value = withDelay(840, withSpring(-18, { damping: 16, stiffness: 120 }));
    secondOpacity.value = withDelay(1040, withTiming(1, { duration: 240 }));
    secondX.value = withDelay(1040, withSpring(-82, { damping: 15, stiffness: 120 }));
    secondY.value = withDelay(1040, withSpring(8, { damping: 15, stiffness: 120 }));
    thirdOpacity.value = withDelay(1140, withTiming(1, { duration: 240 }));
    thirdX.value = withDelay(1140, withSpring(82, { damping: 15, stiffness: 120 }));
    thirdY.value = withDelay(1140, withSpring(20, { damping: 15, stiffness: 120 }));

    floatY.value = withDelay(
      1320,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 1400 }),
          withTiming(0, { duration: 1400 })
        ),
        -1,
        true
      )
    );
  }, [
    entries.length,
    floatY,
    glowOpacity,
    glowScale,
    mainOpacity,
    mainScale,
    mainY,
    secondOpacity,
    secondX,
    secondY,
    shineX,
    thirdOpacity,
    thirdX,
    thirdY,
  ]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const mainStyle = useAnimatedStyle(() => ({
    opacity: mainOpacity.value,
    transform: [
      { translateY: mainY.value + floatY.value },
      { scale: mainScale.value },
    ],
  }));

  const secondStyle = useAnimatedStyle(() => ({
    opacity: secondOpacity.value,
    transform: [
      { translateX: secondX.value },
      { translateY: secondY.value + floatY.value },
    ],
  }));

  const thirdStyle = useAnimatedStyle(() => ({
    opacity: thirdOpacity.value,
    transform: [
      { translateX: thirdX.value },
      { translateY: thirdY.value + floatY.value },
    ],
  }));

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shineX.value }, { rotate: '18deg' }],
  }));

  const rows = entries.slice(0, 5);

  return (
    <View style={styles.rankingShowcaseCard}>
      <View pointerEvents="none" style={styles.rankingShowcaseOrb} />
      <Reanimated.View pointerEvents="none" style={[styles.rankingShowcaseGlow, glowStyle]} />

      <View style={styles.rankingMedalStage}>
        <Reanimated.View style={[styles.sideMedalWrap, secondStyle]}>
          <View style={[styles.sideMedal, styles.sideMedalSilver]}>
            <Star size={26} color="#94A3B8" fill="#94A3B8" />
            <Text style={styles.sideMedalText}>2º</Text>
          </View>
        </Reanimated.View>

        <Reanimated.View style={[styles.sideMedalWrap, thirdStyle]}>
          <View style={[styles.sideMedal, styles.sideMedalBronze]}>
            <Star size={23} color="#EA580C" fill="#EA580C" />
            <Text style={[styles.sideMedalText, styles.sideMedalBronzeText]}>3º</Text>
          </View>
        </Reanimated.View>

        <Reanimated.View style={[styles.mainMedalWrap, mainStyle]}>
          <View style={styles.mainMedal}>
            <View pointerEvents="none" style={styles.mainMedalInnerShine} />
            <Crown size={54} color="#EAB308" fill="#EAB308" />
            <Reanimated.View pointerEvents="none" style={[styles.mainMedalShine, shineStyle]} />
          </View>
          <View style={styles.mainMedalShadow} />
        </Reanimated.View>
      </View>

      <View style={styles.rankingShowcaseCopy}>
        <Text style={styles.rankingShowcaseTitle}>{title}</Text>
        <Text style={styles.rankingShowcaseSubtitle}>{subtitle}</Text>
      </View>

      {rows.length > 0 ? (
        <View style={styles.rankingShowcaseRows}>
          {rows.map((entry, index) => (
            <Reanimated.View
              key={entry.id || `${entry.name}-${index}`}
              entering={FadeInDown.delay(820 + index * 90).springify().damping(18)}
              style={[
                styles.rankingShowcaseRow,
                entry.isUser && styles.rankingShowcaseRowActive,
              ]}
            >
              <Text style={[
                styles.rankingShowcasePosition,
                entry.isUser && styles.rankingShowcasePositionActive,
              ]}>
                {index + 1}º
              </Text>
              {entry.badge ? (
                <View style={[
                  styles.rankingShowcaseBadgeAvatar,
                  { backgroundColor: entry.color || colors.primary },
                ]}>
                  <Text style={styles.rankingShowcaseBadgeText}>{entry.badge}</Text>
                </View>
              ) : (
                <AvatarCircle
                  name={entry.name}
                  photoURL={entry.photoURL}
                  size={36}
                  style={styles.rankingShowcaseAvatar}
                />
              )}
              <Text style={styles.rankingShowcaseName} numberOfLines={1}>
                {entry.name}
              </Text>
              <Text style={[
                styles.rankingShowcaseScore,
                entry.isUser && styles.rankingShowcaseScoreActive,
              ]}>
                {entry.score}
              </Text>
            </Reanimated.View>
          ))}
        </View>
      ) : (
        <Reanimated.View entering={FadeInDown.delay(860)} style={styles.rankingShowcaseEmpty}>
          <Text style={styles.rankingShowcaseEmptyText}>Os nomes aparecem aqui quando a disputa começar.</Text>
        </Reanimated.View>
      )}
    </View>
  );
}

export default function RankingScreen({ navigation, route }) {
  const { quizGroupId, groupId, groupName: initialGroupName, quizGroupTitle, overallRanking, socialGameType } = route.params || {};
  const { currentUser } = useAuth();
  const { userData } = useUserData();
  const { getQuizGroupDetails, getUserGroups } = useGroups();
  const isSocialGameRanking = Boolean(socialGameType);
  const isGroupDirectory = !quizGroupId && !groupId && !overallRanking && !isSocialGameRanking;
  const socialGameConfig = SOCIAL_GAME_RANKINGS[socialGameType];
  const currentSocialGames = userData?.stats?.socialGames || {};

  const [quizGroup, setQuizGroup] = useState(null);
  const [groupName, setGroupName] = useState(initialGroupName || 'Grupo');
  const [loading, setLoading] = useState(true);
  const [userGroups, setUserGroups] = useState([]);
  const [groupsError, setGroupsError] = useState(false);
  const [socialRanking, setSocialRanking] = useState([]);
  const [ranking, setRanking] = useState(overallRanking || null);
  const [tab, setTab] = useState(overallRanking || (groupId && !quizGroupId) ? 'global' : 'group'); // group | global
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiAnimations] = useState(
    Array.from({ length: 24 }, () => ({
      y: new Animated.Value(-20),
      x: new Animated.Value(Math.random() * width),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  );

  useEffect(() => {
    if (isGroupDirectory) {
      loadUserGroupsForRanking();
    } else if (isSocialGameRanking) {
      loadSocialGameRanking();
    } else if (overallRanking) {
      // Se overallRanking foi fornecido, usar diretamente e manter a aba geral aberta
      setTab('global');
      setLoading(false);
      const userRank = overallRanking.findIndex(r => r.userId === currentUser?.uid);
      if (userRank <= 2 && userRank >= 0) {
        setShowConfetti(true);
      }
      if (quizGroupId) {
        loadCurrentQuizGroup();
      }
    } else if (quizGroupId || groupId) {
      if (groupId && !quizGroupId) {
        setTab('global');
      }
      loadRankingData();
    } else {
      setLoading(false);
    }
  }, [isGroupDirectory, isSocialGameRanking, socialGameType, quizGroupId, groupId, overallRanking]);

  const loadUserGroupsForRanking = async () => {
    try {
      setLoading(true);
      setGroupsError(false);
      const groups = await getUserGroups();
      setUserGroups(groups);
    } catch (error) {
      console.error('Error loading ranking groups:', error);
      setGroupsError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentQuizGroup = async () => {
    try {
      const data = await getQuizGroupDetails(quizGroupId);
      setQuizGroup(data);
    } catch (error) {
      console.error('Error loading current quiz group:', error);
    }
  };

  const loadSocialGameRanking = async () => {
    if (!socialGameConfig) {
      setSocialRanking([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'users'));
      const users = snapshot.docs.map((userDoc) => {
        const user = userDoc.data();
        const socialGames = user.stats?.socialGames || {};
        return {
          userId: user.uid || userDoc.id,
          name: user.displayName || user.username || 'Usuário',
          photoURL: user.photoURL || null,
          score: socialGameConfig.getScore(socialGames),
          played: socialGameConfig.getPlayed(socialGames),
        };
      });

      const sorted = users
        .filter((user) => user.played > 0 || user.score > 0)
        .sort((a, b) => (b.score - a.score) || (b.played - a.played));

      setSocialRanking(sorted);

      const userRank = sorted.findIndex(user => user.userId === currentUser?.uid);
      if (userRank <= 2 && userRank >= 0) {
        setShowConfetti(true);
      }
    } catch (error) {
      console.error('Error loading social game ranking:', error);
      setSocialRanking([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showConfetti) {
      confettiAnimations.forEach((anim, i) => {
        Animated.parallel([
          Animated.timing(anim.y, {
            toValue: Dimensions.get('window').height + 20,
            duration: 1200 + Math.random() * 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            delay: 800,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: 360,
            duration: 1200 + Math.random() * 400,
            useNativeDriver: true,
          }),
        ]).start();
      });

      setTimeout(() => setShowConfetti(false), 2000);
    }
  }, [showConfetti]);

  const loadRankingData = async () => {
    try {
      setLoading(true);

      // Buscar nome do grupo se não foi passado
      if (groupId) {
        try {
          const groupDoc = await getDoc(doc(db, 'groups', groupId));
          if (groupDoc.exists()) {
            setGroupName(initialGroupName || groupDoc.data().name || 'Grupo');
          }
        } catch (error) {
          console.error('Error loading group name:', error);
        }
      }

      // Carregar dados do Quiz Group atual
      if (quizGroupId) {
        const data = await getQuizGroupDetails(quizGroupId);
        setQuizGroup(data);

        // Verificar se usuário está no top 3 do quiz
        if (data.ranking && data.ranking.length > 0) {
          const sorted = [...data.ranking].sort((a, b) => {
            if (data.rankingType === 'teams') {
              return b.totalCorrect - a.totalCorrect;
            }
            return b.correct - a.correct;
          });
          const userRank = sorted.findIndex(
            r => r.userId === currentUser?.uid ||
              (data.rankingType === 'teams' &&
                r.teamMembers?.some(m => m.userId === currentUser?.uid))
          );
          if (userRank <= 2 && userRank >= 0) {
            setShowConfetti(true);
          }
        }
      }

      // Carregar Ranking Geral se não foi passado
      if (!overallRanking && groupId) {
        await fetchOverallRanking();
      }

    } catch (error) {
      console.error('Error loading ranking:', error);
      setRanking([]);
      Alert.alert('Erro', 'Não foi possível carregar o ranking');
    } finally {
      setLoading(false);
    }
  };

  const fetchOverallRanking = async () => {
    try {
      // Buscar todos os quiz groups do grupo
      const q = query(collection(db, 'quizGroups'), where('groupId', '==', groupId));
      const snapshot = await getDocs(q);

      const userScores = {}; // userId -> { name, photoURL, totalCorrect }

      snapshot.docs.forEach(doc => {
        const qgData = doc.data();
        if (qgData.ranking) {
          qgData.ranking.forEach(r => {
            if (qgData.rankingType === 'teams') {
              // Para times, distribuir pontos ou tratar conforme regra. 
              // Simplificação: ignorar times no ranking geral individual por enquanto ou somar para membros
              if (r.teamMembers) {
                r.teamMembers.forEach(member => {
                  if (!userScores[member.userId]) {
                    userScores[member.userId] = {
                      userId: member.userId,
                      name: member.name,
                      photoURL: member.photoURL,
                      totalCorrect: 0
                    };
                  }
                  // Assumindo que r.totalCorrect é do time, talvez dividir? 
                  // Ou usar r.correct se disponível por membro.
                  // Se não tiver detalhe por membro, usamos o total do time.
                  userScores[member.userId].totalCorrect += (r.totalCorrect || 0);
                });
              }
            } else {
              // Individual
              if (!userScores[r.userId]) {
                userScores[r.userId] = {
                  userId: r.userId,
                  name: r.name,
                  photoURL: r.photoURL,
                  totalCorrect: 0
                };
              }
              userScores[r.userId].totalCorrect += (r.correct || 0);
            }
          });
        }
      });

      const sortedOverall = Object.values(userScores).sort((a, b) => b.totalCorrect - a.totalCorrect);
      setRanking(sortedOverall);

    } catch (error) {
      console.error('Error fetching overall ranking:', error);
      setRanking([]);
    }
  };

  const handleShare = async () => {
    try {
      const message = `🏆 Confira o ranking do grupo de quiz "${quizGroupTitle || 'Quiz'}":\n\n` +
        (quizGroup?.ranking?.slice(0, 3).map((r, i) =>
          `${i + 1}. ${r.name || r.teamMembers?.map(m => m.name).join(', ')} - ${r.correct || r.totalCorrect} acertos`
        ).join('\n') || '');

      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(message);
        Alert.alert('Sucesso', 'Ranking copiado para a área de transferência!');
      } else {
        await Share.share({ message });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const sortedRanking = useMemo(() => {
    if (tab === 'global') {
      return ranking || [];
    }
    // Tab 'group' agora representa o Quiz Ranking
    if (!quizGroup?.ranking) return [];
    return [...quizGroup.ranking].sort((a, b) => {
      if (quizGroup.rankingType === 'teams') {
        return b.totalCorrect - a.totalCorrect;
      }
      return b.correct - a.correct;
    });
  }, [quizGroup?.ranking, quizGroup?.rankingType, ranking, tab]);

  const top3 = sortedRanking.slice(0, 3);
  const activeRankingType = ranking ? 'individual' : (quizGroup?.rankingType || 'individual');
  const myRank = sortedRanking.findIndex(
    r => r.userId === currentUser?.uid ||
      (quizGroup?.rankingType === 'teams' &&
        r.teamMembers?.some(m => m.userId === currentUser?.uid))
  );
  const me = myRank >= 0 ? sortedRanking[myRank] : null;
  const directoryPreviewEntries = useMemo(() => (
    userGroups.slice(0, 5).map((group) => ({
      id: group.id,
      name: group.name || 'Grupo',
      badge: group.badge || '👥',
      color: group.color || colors.primary,
      score: `${group.stats?.totalMembers || group.members?.length || 0} membros`,
    }))
  ), [userGroups]);
  const socialPreviewEntries = useMemo(() => (
    socialRanking.slice(0, 5).map((member) => ({
      id: member.userId,
      name: member.name,
      photoURL: member.photoURL,
      score: `${member.score} ${socialGameConfig?.scoreLabel || 'pts'}`,
      isUser: member.userId === currentUser?.uid,
    }))
  ), [currentUser?.uid, socialGameConfig?.scoreLabel, socialRanking]);
  const rankingPreviewEntries = useMemo(() => (
    sortedRanking.slice(0, 5).map((member, index) => {
      const isTeamRanking = activeRankingType === 'teams';
      const displayName = isTeamRanking
        ? member.teamMembers?.map(m => m.name).join(', ') || 'Time'
        : member.name || 'Usuário';
      const photoURL = isTeamRanking
        ? member.teamMembers?.[0]?.photoURL || null
        : member.photoURL || null;
      const isUser = member.userId === currentUser?.uid ||
        (isTeamRanking && member.teamMembers?.some(m => m.userId === currentUser?.uid));

      return {
        id: member.userId || member.teamIndex || index,
        name: displayName,
        photoURL,
        score: `${member.correct || member.totalCorrect || 0} acertos`,
        isUser,
      };
    })
  ), [activeRankingType, currentUser?.uid, sortedRanking]);

  const handleGroupRankingPress = (group) => {
    navigation.push('Ranking', {
      groupId: group.id,
      groupName: group.name,
    });
  };

  if (isGroupDirectory) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.directoryContent} showsVerticalScrollIndicator={false}>
          <RankingHeader
            title="Ranking"
            subtitle="Escolha um grupo social para ver o ranking"
            onBack={() => navigation.goBack()}
          />

          <RankingShowcaseAnimation
            title="Rankings dos seus grupos"
            subtitle="Compare pontuações, acertos e disputas dentro de cada círculo."
            entries={directoryPreviewEntries}
          />

          <View style={styles.directorySectionHeader}>
            <Text style={styles.directorySectionTitle}>Grupos sociais</Text>
            {!loading && !groupsError ? (
              <View style={styles.directoryCountPill}>
                <Text style={styles.directoryCountText}>{userGroups.length}</Text>
              </View>
            ) : null}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Carregando seus grupos...</Text>
            </View>
          ) : groupsError ? (
            <View style={styles.emptyContainer}>
              <Trophy size={56} color={colors.textAlt} />
              <Text style={styles.emptyText}>Não foi possível carregar</Text>
              <Text style={styles.emptySubtext}>Tente abrir o ranking novamente em alguns instantes.</Text>
            </View>
          ) : userGroups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users2 size={56} color={colors.textAlt} />
              <Text style={styles.emptyText}>Você ainda não tem grupos</Text>
              <Text style={styles.emptySubtext}>Entre ou crie um grupo para acompanhar rankings sociais.</Text>
            </View>
          ) : (
            <View style={styles.groupRankingList}>
              {userGroups.map((group) => (
                <GroupRankingCard
                  key={group.id}
                  group={group}
                  onPress={() => handleGroupRankingPress(group)}
                />
              ))}
            </View>
          )}

          {!loading && !groupsError && (
            <>
              <View style={styles.directorySectionHeader}>
                <Text style={styles.directorySectionTitle}>Jogos sociais</Text>
                <View style={styles.directoryCountPill}>
                  <Text style={styles.directoryCountText}>{Object.keys(SOCIAL_GAME_RANKINGS).length}</Text>
                </View>
              </View>

              <View style={styles.groupRankingList}>
                {Object.entries(SOCIAL_GAME_RANKINGS).map(([type, config]) => (
                  <SocialGameRankingCard
                    key={type}
                    config={config}
                    played={config.getPlayed(currentSocialGames)}
                    score={config.getScore(currentSocialGames)}
                    onPress={() => navigation.push('Ranking', { socialGameType: type })}
                  />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  if (isSocialGameRanking) {
    const mySocialRank = socialRanking.findIndex(user => user.userId === currentUser?.uid);

    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.directoryContent} showsVerticalScrollIndicator={false}>
          <RankingHeader
            title={socialGameConfig?.title || 'Ranking'}
            subtitle="Ranking de jogos sociais"
            onBack={() => navigation.goBack()}
          />

          <RankingShowcaseAnimation
            title={socialGameConfig?.title || 'Ranking social'}
            subtitle={socialGameConfig?.subtitle || 'Acompanhe quem está no topo.'}
            entries={socialPreviewEntries}
          />

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Carregando ranking...</Text>
            </View>
          ) : socialRanking.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Trophy size={56} color={colors.textAlt} />
              <Text style={styles.emptyText}>Ranking ainda não disponível</Text>
              <Text style={styles.emptySubtext}>
                Jogue {socialGameConfig?.title} para aparecer neste ranking.
              </Text>
            </View>
          ) : (
            <View style={styles.socialRankingCard}>
              <View style={styles.rankingListHeader}>
                <Text style={styles.rankingListTitle}>Posições</Text>
                {mySocialRank >= 0 ? (
                  <Text style={styles.rankingListSubtitle}>Você está em #{mySocialRank + 1}</Text>
                ) : (
                  <Text style={styles.rankingListSubtitle}>Atualizado agora</Text>
                )}
              </View>
              <View style={styles.rankingList}>
                {socialRanking.map((member, index) => (
                  <SocialRankingRow
                    key={member.userId || index}
                    index={index + 1}
                    member={member}
                    config={socialGameConfig}
                    highlight={member.userId === currentUser?.uid}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  if (loading || (!quizGroup && !ranking && groupId)) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <RankingHeader
            title="Ranking"
            onBack={() => navigation.goBack()}
          />
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando ranking...</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!sortedRanking || sortedRanking.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <RankingHeader
            title="Ranking"
            onBack={() => navigation.goBack()}
          />
          <View style={styles.emptyContainer}>
            <Trophy size={64} color={colors.textAlt} />
            <Text style={styles.emptyText}>Ranking ainda não disponível</Text>
            <Text style={styles.emptySubtext}>
              O ranking será gerado após todas as respostas corretas serem marcadas
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <RankingHeader
          title="Ranking"
          onBack={() => navigation.goBack()}
        />

        {/* Nome do grupo */}
        <View style={styles.groupNameContainer}>
          <Users2 size={14} color={colors.textAlt} />
          <Text style={styles.groupNameText}>{groupName || 'Grupo'}</Text>
        </View>

        {/* Título do quiz group */}
        {quizGroupTitle && (
          <View style={styles.quizGroupTitleContainer}>
            <Text style={styles.quizGroupTitleText}>{quizGroupTitle}</Text>
          </View>
        )}

        <RankingShowcaseAnimation
          title="Top da galera"
          subtitle="A disputa ganha forma antes da lista completa."
          entries={rankingPreviewEntries}
        />

        {/* Abas */}
        {quizGroup ? (
          <View style={styles.segmentedContainer}>
            <TouchableOpacity
              style={[styles.segmentedButton, tab === 'group' && styles.segmentedButtonActive]}
              onPress={() => setTab('group')}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentedText, tab === 'group' && styles.segmentedTextActive]}>
                {quizGroupTitle || 'Quiz'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentedButton, tab === 'global' && styles.segmentedButtonActive]}
              onPress={() => setTab('global')}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentedText, tab === 'global' && styles.segmentedTextActive]}>
                Ranking geral
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.rankingModePill}>
            <Trophy size={14} color={colors.primaryLight} />
            <Text style={styles.rankingModePillText}>Ranking geral do grupo</Text>
          </View>
        )}

        {/* Pódio Top 3 */}
        <PodiumCard top3={top3} rankingType={activeRankingType} />


        {/* Lista completa */}
        <View style={styles.rankingListCard}>
          <View style={styles.rankingListHeader}>
            <Text style={styles.rankingListTitle}>Posições</Text>
            <Text style={styles.rankingListSubtitle}>Atualizado agora</Text>
          </View>
          <View style={styles.rankingList}>
            {sortedRanking.map((member, index) => {
              const rankingType = activeRankingType;
              const isMe = member.userId === currentUser?.uid ||
                (rankingType === 'teams' &&
                  member.teamMembers?.some(m => m.userId === currentUser?.uid));
              return (
                <MemberRow
                  key={member.userId || member.teamIndex || index}
                  index={index + 1}
                  member={member}
                  highlight={isMe}
                  rankingType={rankingType}
                />
              );
            })}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.8}>
            <Share2 size={18} color={colors.textLight} />
            <Text style={styles.shareButtonText}>Compartilhar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.trophyButton} activeOpacity={0.8}>
            <Trophy size={18} color={colors.textLight} />
            <Text style={styles.trophyButtonText}>Ver conquistas</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confetti Effect */}
      {showConfetti && (
        <View style={styles.confettiContainer} pointerEvents="none">
          {confettiAnimations.map((anim, i) => {
            const confettiColors = [colors.orange, colors.primary, colors.success, colors.warning];
            return (
              <Animated.View
                key={i}
                style={[
                  styles.confettiPiece,
                  {
                    backgroundColor: confettiColors[i % 4],
                    transform: [
                      { translateY: anim.y },
                      { translateX: anim.x },
                      {
                        rotate: anim.rotate.interpolate({
                          inputRange: [0, 360],
                          outputRange: ['0deg', '360deg'],
                        })
                      },
                    ],
                    opacity: anim.opacity,
                  },
                ]}
              />
            );
          })}
        </View>
      )}

      {/* Badge flutuante top 3 */}
      {me && myRank <= 2 && (
        <Animated.View style={styles.floatingBadge}>
          <Sparkles size={16} color={colors.textLight} />
          <Text style={styles.floatingBadgeText}>Mandou bem! Top 3 do grupo 🎉</Text>
        </Animated.View>
      )}
    </View>
  );
}

function PodiumBlock({ height, place }) {
  return (
    <View style={[styles.podiumBlock, { height }]}>
      <View style={styles.podiumBlockShine} />
      <Text style={styles.podiumBlockNumber}>{place}</Text>
    </View>
  );
}

function GroupRankingCard({ group, onPress }) {
  const memberCount = group.stats?.totalMembers || group.members?.length || 0;
  const activeQuizzes = group.stats?.activeQuizzes || 0;

  return (
    <TouchableOpacity style={styles.groupRankingCard} onPress={onPress} activeOpacity={0.82}>
      <View pointerEvents="none" style={styles.groupRankingOrb} />
      <View style={styles.groupRankingHeader}>
        <View style={[styles.groupRankingBadge, { backgroundColor: group.color || colors.primary }]}>
          <Text style={styles.groupRankingBadgeText}>{group.badge || '👥'}</Text>
        </View>
        <View style={styles.groupRankingInfo}>
          <Text style={styles.groupRankingName} numberOfLines={1}>{group.name || 'Grupo'}</Text>
          {group.description ? (
            <Text style={styles.groupRankingDescription} numberOfLines={1}>
              {group.description}
            </Text>
          ) : (
            <Text style={styles.groupRankingDescription} numberOfLines={1}>
              Ranking social do grupo
            </Text>
          )}
        </View>
        <View style={styles.groupRankingChevron}>
          <ChevronRight size={17} color={colors.textMuted} />
        </View>
      </View>

      <View style={styles.groupRankingStats}>
        <View style={styles.groupRankingStatPill}>
          <Users2 size={14} color={colors.textMuted} />
          <Text style={styles.groupRankingStatText}>{memberCount} membros</Text>
        </View>
        <View style={styles.groupRankingStatPill}>
          <Clock size={14} color={colors.textMuted} />
          <Text style={styles.groupRankingStatText}>{activeQuizzes} quiz ativos</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function SocialGameRankingCard({ config, played, score, onPress }) {
  return (
    <TouchableOpacity style={styles.socialGameRankingCard} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.socialGameEmojiWrap}>
        <Text style={styles.socialGameEmoji}>{config.emoji}</Text>
      </View>
      <View style={styles.groupRankingInfo}>
        <Text style={styles.groupRankingName} numberOfLines={1}>{config.title}</Text>
        <Text style={styles.groupRankingDescription} numberOfLines={1}>{config.subtitle}</Text>
        <View style={styles.socialGameUserPill}>
          <Text style={styles.socialGameUserPillText}>
            Você: {played || 0} partidas • {score || 0} {config.scoreLabel}
          </Text>
        </View>
      </View>
      <View style={styles.groupRankingChevron}>
        <ChevronRight size={17} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function SocialRankingRow({ index, member, config, highlight }) {
  return (
    <View style={[styles.memberRow, highlight && styles.memberRowHighlight]}>
      <View style={styles.memberRowLeft}>
        <Text style={styles.memberRowPosition}>{index}.</Text>
        <AvatarCircle
          name={member.name}
          photoURL={member.photoURL}
          size={34}
          style={styles.memberRowAvatar}
        />
        <View style={styles.memberRowInfo}>
          <Text style={styles.memberRowName}>{member.name}</Text>
          <Text style={styles.memberRowStats}>
            {member.score} {config.scoreLabel} • {member.played} partidas
          </Text>
        </View>
      </View>
    </View>
  );
}

function PodiumCard({ top3, rankingType }) {
  if (top3.length === 0) return null;

  const first = top3[0] || null;
  const second = top3[1] || null;
  const third = top3[2] || null;
  const isTeamRanking = rankingType === 'teams';

  const getDisplayName = (member) => {
    if (!member) return '';
    if (isTeamRanking) {
      return member.teamMembers?.map(m => m.name).join(', ') || 'Time';
    }
    return member.name || 'Usuário';
  };

  const getCorrect = (member) => {
    if (!member) return 0;
    return member.correct || member.totalCorrect || 0;
  };

  const getStreak = (member) => {
    if (!member) return 0;
    return member.streak || 0;
  };

  const getPhotoURL = (member) => {
    if (!member) return null;
    if (isTeamRanking) {
      return member.teamMembers?.[0]?.photoURL || null;
    }
    return member.photoURL || null;
  };

  return (
    <View style={styles.podiumCard}>
      <View style={styles.podiumCardHeader}>
        <View style={styles.podiumBadge}>
          <Text style={styles.podiumBadgeText}>Top 3 do grupo</Text>
        </View>
      </View>

      <View style={styles.podiumGrid}>
        {/* 2º lugar */}
        <View style={[styles.podiumItem, !second && styles.podiumItemHidden]}>
          {second ? (
            <>
              <AvatarCircle
                name={getDisplayName(second)}
                photoURL={getPhotoURL(second)}
                size={56}
                style={styles.podiumAvatar}
              />
              <PodiumBlock height={120} place={2} />
              <Text style={styles.podiumName}>{getDisplayName(second)}</Text>
              <View style={styles.podiumStats}>
                <StatChip>
                  {getCorrect(second)} acertos • 🔥 {getStreak(second)}
                </StatChip>
              </View>
            </>
          ) : (
            <View style={styles.podiumPlaceholder} />
          )}
        </View>

        {/* 1º lugar */}
        <View style={styles.podiumItem}>
          {first && (
            <>
              <View style={styles.crownContainer}>
                <Animated.View
                  style={styles.crownAnimation}
                >
                  <Crown size={28} color={colors.orange} />
                </Animated.View>
              </View>
              <AvatarCircle
                name={getDisplayName(first)}
                photoURL={getPhotoURL(first)}
                size={64}
                style={styles.podiumAvatarWinner}
              />
              <PodiumBlock height={150} place={1} />
              <Text style={styles.podiumNameWinner}>{getDisplayName(first)}</Text>
              <View style={styles.podiumStats}>
                <StatChip>
                  {getCorrect(first)} acertos • 🔥 {getStreak(first)}
                </StatChip>
              </View>
            </>
          )}
        </View>

        {/* 3º lugar */}
        <View style={[styles.podiumItem, !third && styles.podiumItemHidden]}>
          {third ? (
            <>
              <AvatarCircle
                name={getDisplayName(third)}
                photoURL={getPhotoURL(third)}
                size={56}
                style={styles.podiumAvatar}
              />
              <PodiumBlock height={102} place={3} />
              <Text style={styles.podiumName}>{getDisplayName(third)}</Text>
              <View style={styles.podiumStats}>
                <StatChip>
                  {getCorrect(third)} acertos • 🔥 {getStreak(third)}
                </StatChip>
              </View>
            </>
          ) : (
            <View style={styles.podiumPlaceholder} />
          )}
        </View>
      </View>
    </View>
  );
}

function StatChip({ children }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statChipText}>{children}</Text>
    </View>
  );
}

function MemberRow({ index, member, highlight, rankingType }) {
  const isTeamRanking = rankingType === 'teams';
  const displayName = isTeamRanking
    ? member.teamMembers?.map(m => m.name).join(', ') || 'Time'
    : member.name || 'Usuário';
  const correct = member.correct || member.totalCorrect || 0;
  const photoURL = isTeamRanking
    ? member.teamMembers?.[0]?.photoURL || null
    : member.photoURL || null;

  return (
    <View style={[styles.memberRow, highlight && styles.memberRowHighlight]}>
      <View style={styles.memberRowLeft}>
        <Text style={styles.memberRowPosition}>{index}.</Text>
        <AvatarCircle
          name={displayName}
          photoURL={photoURL}
          size={32}
          style={styles.memberRowAvatar}
        />
        <View style={styles.memberRowInfo}>
          <Text style={styles.memberRowName}>{displayName}</Text>
          <Text style={styles.memberRowStats}>
            ✅ {correct} acertos
          </Text>
        </View>
      </View>
    </View>
  );
}

function ProgressToNext({ current, next }) {
  const total = Math.max(1, next - current);
  const pct = Math.min(100, Math.round((current / next) * 100));

  return (
    <View style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>
          Faltam {total} acertos para alcançar o próximo
        </Text>
        <Text style={styles.progressPercent}>{pct}%</Text>
      </View>
      <View style={styles.progressBar}>
        <Animated.View
          style={[styles.progressBarFill, { width: `${pct}%` }]}
        />
      </View>
      <Text style={styles.progressHint}>
        Dica: responda 2 enquetes hoje para ultrapassar 👀
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101014',
  },
  rankingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 60,
    marginBottom: 28,
  },
  rankingBackBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#232326',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankingHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  rankingPageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  rankingPageSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.46)',
    marginTop: 3,
    lineHeight: 19,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...fontStyles.regular,
    color: colors.textAlt,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  directoryContent: {
    paddingBottom: 120,
  },
  rankingShowcaseCard: {
    marginHorizontal: 16,
    marginTop: -8,
    marginBottom: 28,
    backgroundColor: '#14131A',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.18)',
    padding: 18,
    overflow: 'hidden',
  },
  rankingShowcaseOrb: {
    position: 'absolute',
    right: -52,
    top: -42,
    width: 152,
    height: 152,
    borderRadius: 76,
    backgroundColor: 'rgba(139,92,246,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.10)',
  },
  rankingShowcaseGlow: {
    position: 'absolute',
    top: 34,
    alignSelf: 'center',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(139,92,246,0.28)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 34,
    elevation: 14,
  },
  rankingMedalStage: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainMedalWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  mainMedal: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#FAFAFA',
    borderWidth: 5,
    borderColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#EAB308',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.34,
    shadowRadius: 20,
    elevation: 12,
  },
  mainMedalInnerShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  mainMedalShine: {
    position: 'absolute',
    width: 42,
    top: -18,
    bottom: -18,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  mainMedalShadow: {
    width: 86,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.28)',
    marginTop: 8,
    opacity: 0.8,
  },
  sideMedalWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  sideMedal: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    overflow: 'hidden',
  },
  sideMedalSilver: {
    backgroundColor: '#E2E8F0',
    borderColor: '#94A3B8',
  },
  sideMedalBronze: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FED7AA',
    borderColor: '#FB923C',
  },
  sideMedalText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    marginTop: -1,
  },
  sideMedalBronzeText: {
    color: '#C2410C',
    fontSize: 10,
  },
  rankingShowcaseCopy: {
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 16,
  },
  rankingShowcaseTitle: {
    ...fontStyles.extrabold,
    color: colors.textLight,
    fontSize: 25,
    textAlign: 'center',
    lineHeight: 31,
  },
  rankingShowcaseSubtitle: {
    ...fontStyles.medium,
    color: colors.textAlt,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 280,
  },
  rankingShowcaseRows: {
    gap: 8,
  },
  rankingShowcaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 10,
  },
  rankingShowcaseRowActive: {
    backgroundColor: 'rgba(139,92,246,0.24)',
    borderColor: 'rgba(196,181,253,0.35)',
  },
  rankingShowcasePosition: {
    width: 28,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.48)',
    fontWeight: '900',
    fontSize: 13,
  },
  rankingShowcasePositionActive: {
    color: '#DDD6FE',
  },
  rankingShowcaseAvatar: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  rankingShowcaseBadgeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankingShowcaseBadgeText: {
    fontSize: 18,
  },
  rankingShowcaseName: {
    ...fontStyles.extrabold,
    flex: 1,
    color: colors.textLight,
    fontSize: 14,
  },
  rankingShowcaseScore: {
    ...fontStyles.extrabold,
    color: colors.primaryLight,
    fontSize: 13,
  },
  rankingShowcaseScoreActive: {
    color: '#FDE68A',
  },
  rankingShowcaseEmpty: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
  },
  rankingShowcaseEmptyText: {
    ...fontStyles.medium,
    color: colors.textAlt,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  directoryHero: {
    marginHorizontal: 16,
    marginTop: -6,
    marginBottom: 28,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.16)',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
  },
  directoryHeroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryAlpha12,
    borderWidth: 1,
    borderColor: colors.primaryAlpha20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directoryHeroCopy: {
    flex: 1,
  },
  directoryHeroTitle: {
    ...fontStyles.extrabold,
    color: colors.textLight,
    fontSize: 21,
    lineHeight: 26,
  },
  directoryHeroSubtitle: {
    ...fontStyles.medium,
    color: colors.textAlt,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  directorySectionHeader: {
    marginHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  directorySectionTitle: {
    ...fontStyles.extrabold,
    color: colors.textLight,
    fontSize: 22,
  },
  directoryCountPill: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryAlpha12,
    borderWidth: 1,
    borderColor: colors.primaryAlpha20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  directoryCountText: {
    ...fontStyles.extrabold,
    color: colors.primaryLight,
    fontSize: 14,
  },
  groupRankingList: {
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 28,
  },
  groupRankingCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    overflow: 'hidden',
  },
  groupRankingOrb: {
    position: 'absolute',
    right: -38,
    top: -28,
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.08)',
  },
  groupRankingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupRankingBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupRankingBadgeText: {
    fontSize: 25,
  },
  groupRankingInfo: {
    flex: 1,
    minWidth: 0,
  },
  groupRankingName: {
    ...fontStyles.extrabold,
    color: colors.textLight,
    fontSize: 17,
    marginBottom: 3,
  },
  groupRankingDescription: {
    ...fontStyles.medium,
    color: colors.textAlt,
    fontSize: 13,
  },
  groupRankingChevron: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupRankingStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  groupRankingStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  groupRankingStatText: {
    ...fontStyles.semibold,
    color: colors.textAlt,
    fontSize: 12,
  },
  socialGameRankingCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.13)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialGameEmojiWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.primaryAlpha12,
    borderWidth: 1,
    borderColor: colors.primaryAlpha20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialGameEmoji: {
    fontSize: 25,
  },
  socialGameUserPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryAlpha08,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginTop: 8,
  },
  socialGameUserPillText: {
    ...fontStyles.extrabold,
    color: colors.primaryLight,
    fontSize: 11,
  },
  socialGameHeroEmojiWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryAlpha12,
    borderWidth: 1,
    borderColor: colors.primaryAlpha20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialGameHeroEmoji: {
    fontSize: 30,
  },
  socialRankingCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 28,
  },
  groupNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: -8,
    marginBottom: 8,
  },
  groupNameText: {
    ...fontStyles.regular,
    fontSize: 12,
    color: colors.textAlt,
  },
  quizGroupTitleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  quizGroupTitleText: {
    ...fontStyles.semibold,
    fontSize: 16,
    color: colors.textLight,
  },
  segmentedContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
    justifyContent: 'center',
  },
  segmentedButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
  },
  segmentedButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentedText: {
    ...fontStyles.medium,
    fontSize: 12,
    color: colors.textLight,
  },
  segmentedTextActive: {
    color: colors.textLight,
  },
  rankingModePill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.primaryAlpha12,
    borderWidth: 1,
    borderColor: colors.primaryAlpha20,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 24,
  },
  rankingModePillText: {
    ...fontStyles.extrabold,
    color: colors.primaryLight,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    ...fontStyles.semibold,
    fontSize: 18,
    color: colors.textLight,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    ...fontStyles.regular,
    fontSize: 14,
    color: colors.textAlt,
    textAlign: 'center',
  },
  podiumCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  podiumCardHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  podiumBadge: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  podiumBadgeText: {
    ...fontStyles.regular,
    fontSize: 11,
    color: colors.textAlt,
  },
  podiumGrid: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 16,
  },
  podiumItem: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  podiumItemHidden: {
    opacity: 0.45,
  },
  podiumPlaceholder: {
    height: 240,
    width: '100%',
  },
  crownContainer: {
    marginBottom: 4,
  },
  crownAnimation: {
    // Animation handled by Animated API if needed
  },
  podiumAvatar: {
    borderWidth: 2,
    borderColor: colors.surfaceAlt,
  },
  podiumAvatarWinner: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  podiumName: {
    ...fontStyles.medium,
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
  },
  podiumNameWinner: {
    ...fontStyles.semibold,
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  podiumStats: {
    marginTop: 4,
  },
  podiumBlock: {
    width: 96,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 10,
  },
  podiumBlockShine: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  podiumBlockNumber: {
    ...fontStyles.extrabold,
    fontSize: 24,
    color: colors.textLight,
    opacity: 0.25,
  },
  statChip: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'center',
  },
  statChipText: {
    ...fontStyles.regular,
    fontSize: 11,
    color: colors.textLight,
  },
  progressCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    ...fontStyles.regular,
    fontSize: 12,
    color: colors.textAlt,
    flex: 1,
  },
  progressPercent: {
    ...fontStyles.regular,
    fontSize: 12,
    color: colors.textAlt,
    marginLeft: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressHint: {
    ...fontStyles.regular,
    fontSize: 11,
    color: colors.textAlt,
  },
  rankingListCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  rankingListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankingListTitle: {
    ...fontStyles.semibold,
    fontSize: 14,
    color: colors.textLight,
  },
  rankingListSubtitle: {
    ...fontStyles.regular,
    fontSize: 12,
    color: colors.textAlt,
  },
  rankingList: {
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
  },
  memberRowHighlight: {
    backgroundColor: colors.primaryAlpha15,
  },
  memberRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberRowPosition: {
    ...fontStyles.regular,
    width: 24,
    textAlign: 'right',
    fontSize: 12,
    color: colors.textAlt,
  },
  memberRowAvatar: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  memberRowInfo: {
    flex: 1,
  },
  memberRowName: {
    ...fontStyles.medium,
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 2,
  },
  memberRowStats: {
    ...fontStyles.regular,
    fontSize: 11,
    color: colors.textAlt,
  },
  deltaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deltaText: {
    ...fontStyles.regular,
    fontSize: 11,
    color: colors.textAlt,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 100,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.orange,
    borderRadius: 16,
    paddingVertical: 12,
  },
  shareButtonText: {
    ...fontStyles.semibold,
    color: colors.textLight,
    fontSize: 14,
  },
  trophyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 12,
  },
  trophyButtonText: {
    ...fontStyles.semibold,
    color: colors.textLight,
    fontSize: 14,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  floatingBadge: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    transform: [{ translateX: -120 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingBadgeText: {
    ...fontStyles.semibold,
    color: colors.textLight,
    fontSize: 14,
  },
});
