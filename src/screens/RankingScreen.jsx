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
  ChevronLeft,
  Share2,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Crown,
  Sparkles,
  Users2,
  Flame,
} from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import AvatarCircle from '../components/AvatarCircle';
import Header from '../components/Header';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#121212',
  card: '#1E1E1E',
  purple: '#8A4F9E',
  orange: '#FF6B35',
  text: '#FFFFFF',
  text2: '#B0B0B0',
  green: '#4CAF50',
  red: '#E53935',
  glass: 'rgba(255,255,255,0.03)',
};

export default function RankingScreen({ navigation, route }) {
  const { quizGroupId, groupId, groupName: initialGroupName, quizGroupTitle, overallRanking } = route.params || {};
  const { currentUser } = useAuth();
  const { getQuizGroupDetails } = useGroups();

  const [quizGroup, setQuizGroup] = useState(null);
  const [groupName, setGroupName] = useState(initialGroupName || 'Grupo');
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState(overallRanking || null);
  const [tab, setTab] = useState('group'); // group | global
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
    if (overallRanking) {
      // Se overallRanking foi fornecido, usar diretamente
      setLoading(false);
      const userRank = overallRanking.findIndex(r => r.userId === currentUser?.uid);
      if (userRank <= 2 && userRank >= 0) {
        setShowConfetti(true);
      }
    } else if (quizGroupId) {
      loadRankingData();
    }
  }, [quizGroupId, overallRanking]);

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
      if (groupId && !initialGroupName) {
        try {
          const groupDoc = await getDoc(doc(db, 'groups', groupId));
          if (groupDoc.exists()) {
            setGroupName(groupDoc.data().name || 'Grupo');
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
  const myRank = sortedRanking.findIndex(
    r => r.userId === currentUser?.uid ||
      (quizGroup?.rankingType === 'teams' &&
        r.teamMembers?.some(m => m.userId === currentUser?.uid))
  );
  const me = myRank >= 0 ? sortedRanking[myRank] : null;
  const ahead = myRank > 0 ? sortedRanking[myRank - 1] : null;

  if (loading || (!quizGroup && !ranking)) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Header
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
          <Header
            title="Ranking"
            onBack={() => navigation.goBack()}
          />
          <View style={styles.emptyContainer}>
            <Trophy size={64} color={COLORS.text2} />
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
        <Header
          title="Ranking"
          onBack={() => navigation.goBack()}
        />

        {/* Nome do grupo */}
        <View style={styles.groupNameContainer}>
          <Users2 size={14} color={COLORS.text2} />
          <Text style={styles.groupNameText}>{groupName || 'Grupo'}</Text>
        </View>

        {/* Título do quiz group */}
        {quizGroupTitle && (
          <View style={styles.quizGroupTitleContainer}>
            <Text style={styles.quizGroupTitleText}>{quizGroupTitle}</Text>
          </View>
        )}

        {/* Abas */}
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

        {/* Pódio Top 3 */}
        <PodiumCard top3={top3} rankingType={ranking ? 'individual' : (quizGroup?.rankingType || 'individual')} />

        {/* Progresso até o próximo */}
        {me && ahead && (
          <ProgressToNext
            current={me.correct || me.totalCorrect || 0}
            next={ahead.correct || ahead.totalCorrect || 0}
          />
        )}

        {/* Lista completa */}
        <View style={styles.rankingListCard}>
          <View style={styles.rankingListHeader}>
            <Text style={styles.rankingListTitle}>Posições</Text>
            <Text style={styles.rankingListSubtitle}>Atualizado agora</Text>
          </View>
          <View style={styles.rankingList}>
            {sortedRanking.map((member, index) => {
              const rankingType = ranking ? 'individual' : (quizGroup?.rankingType || 'individual');
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
            <Share2 size={18} color={COLORS.text} />
            <Text style={styles.shareButtonText}>Compartilhar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.trophyButton} activeOpacity={0.8}>
            <Trophy size={18} color={COLORS.text} />
            <Text style={styles.trophyButtonText}>Ver conquistas</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confetti Effect */}
      {showConfetti && (
        <View style={styles.confettiContainer} pointerEvents="none">
          {confettiAnimations.map((anim, i) => {
            const confettiColors = [COLORS.orange, COLORS.purple, COLORS.green, '#FFC107'];
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
        <Animated.View
          style={styles.floatingBadge}
          entering={Animated.spring}
        >
          <Sparkles size={16} color={COLORS.text} />
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

function PodiumCard({ top3, rankingType }) {
  if (top3.length < 3) return null;

  const [first, second, third] = top3;
  const isTeamRanking = rankingType === 'teams';

  const getDisplayName = (member) => {
    if (isTeamRanking) {
      return member.teamMembers?.map(m => m.name).join(', ') || 'Time';
    }
    return member.name || 'Usuário';
  };

  const getCorrect = (member) => {
    return member.correct || member.totalCorrect || 0;
  };

  const getStreak = (member) => {
    // TODO: Implementar streak real do usuário
    return Math.floor(Math.random() * 5) + 1;
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
        <View style={styles.podiumItem}>
          <AvatarCircle
            name={getDisplayName(second)}
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
        </View>

        {/* 1º lugar */}
        <View style={styles.podiumItem}>
          <View style={styles.crownContainer}>
            <Animated.View
              style={styles.crownAnimation}
            >
              <Crown size={28} color={COLORS.orange} />
            </Animated.View>
          </View>
          <AvatarCircle
            name={getDisplayName(first)}
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
        </View>

        {/* 3º lugar */}
        <View style={styles.podiumItem}>
          <AvatarCircle
            name={getDisplayName(third)}
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

function Delta({ value }) {
  if (value === 0) {
    return <Text style={styles.deltaText}>—</Text>;
  }
  const up = value > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <View style={styles.deltaContainer}>
      <Icon size={14} color={up ? COLORS.green : COLORS.red} />
      <Text style={[styles.deltaText, { color: up ? COLORS.green : COLORS.red }]}>
        {Math.abs(value)}
      </Text>
    </View>
  );
}

function MemberRow({ index, member, highlight, rankingType }) {
  const isTeamRanking = rankingType === 'teams';
  const displayName = isTeamRanking
    ? member.teamMembers?.map(m => m.name).join(', ') || 'Time'
    : member.name || 'Usuário';
  const correct = member.correct || member.totalCorrect || 0;
  const streak = Math.floor(Math.random() * 5) + 1; // TODO: Real streak

  return (
    <View style={[styles.memberRow, highlight && styles.memberRowHighlight]}>
      <View style={styles.memberRowLeft}>
        <Text style={styles.memberRowPosition}>{index}.</Text>
        <AvatarCircle
          name={displayName}
          size={32}
          style={styles.memberRowAvatar}
        />
        <View style={styles.memberRowInfo}>
          <Text style={styles.memberRowName}>{displayName}</Text>
          <Text style={styles.memberRowStats}>
            ✅ {correct} acertos • 🔥 {streak}
          </Text>
        </View>
      </View>
      <Delta value={0} />
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
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text2,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
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
    fontSize: 12,
    color: COLORS.text2,
  },
  quizGroupTitleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  quizGroupTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
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
    backgroundColor: '#27272a',
  },
  segmentedButtonActive: {
    backgroundColor: COLORS.purple,
  },
  segmentedText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
  },
  segmentedTextActive: {
    color: COLORS.text,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text2,
    textAlign: 'center',
  },
  podiumCard: {
    backgroundColor: COLORS.card,
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
    backgroundColor: '#27272a',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  podiumBadgeText: {
    fontSize: 11,
    color: COLORS.text2,
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
  crownContainer: {
    marginBottom: 4,
  },
  crownAnimation: {
    // Animation handled by Animated API if needed
  },
  podiumAvatar: {
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  podiumAvatarWinner: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
  },
  podiumNameWinner: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
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
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    opacity: 0.25,
  },
  statChip: {
    backgroundColor: '#27272a',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'center',
  },
  statChipText: {
    fontSize: 11,
    color: COLORS.text,
  },
  progressCard: {
    backgroundColor: COLORS.card,
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
    fontSize: 12,
    color: COLORS.text2,
    flex: 1,
  },
  progressPercent: {
    fontSize: 12,
    color: COLORS.text2,
    marginLeft: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#27272a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.purple,
    borderRadius: 4,
  },
  progressHint: {
    fontSize: 11,
    color: COLORS.text2,
  },
  rankingListCard: {
    backgroundColor: COLORS.card,
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
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  rankingListSubtitle: {
    fontSize: 12,
    color: COLORS.text2,
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
    backgroundColor: '#27272a',
  },
  memberRowHighlight: {
    backgroundColor: 'rgba(138,79,158,0.18)',
  },
  memberRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberRowPosition: {
    width: 24,
    textAlign: 'right',
    fontSize: 12,
    color: COLORS.text2,
  },
  memberRowAvatar: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  memberRowInfo: {
    flex: 1,
  },
  memberRowName: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  memberRowStats: {
    fontSize: 11,
    color: COLORS.text2,
  },
  deltaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deltaText: {
    fontSize: 11,
    color: COLORS.text2,
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
    backgroundColor: COLORS.orange,
    borderRadius: 16,
    paddingVertical: 12,
  },
  shareButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  trophyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.purple,
    borderRadius: 16,
    paddingVertical: 12,
  },
  trophyButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
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
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
});

