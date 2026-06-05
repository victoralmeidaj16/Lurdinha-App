import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart3, ChevronLeft, Crown, Target, Trophy } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useGroups } from '../hooks/useGroups';
import AvatarCircle from '../components/AvatarCircle';
import SoundMuteButton from '../components/SoundMuteButton';
import { colors, fontStyles } from '../theme';

const HERO_GRADIENT = ['#8B5CF6', '#7C3AED'];

const getPlayerTitle = (index) => {
  if (index === 0) return 'Mestre da Previsão';
  if (index === 1) return 'Vidente';
  if (index === 2) return 'Profeta';
  return 'Adivinho';
};

export default function QuizGroupSummaryScreen({ navigation, route }) {
  const { quizGroupId, groupName, quizGroupTitle } = route.params || {};
  const { currentUser } = useAuth();
  const { getQuizGroupDetails } = useGroups();
  const [quizGroup, setQuizGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      if (!quizGroupId) {
        Alert.alert('Erro', 'Grupo de quiz não informado.');
        navigation.goBack();
        return;
      }

      setLoading(true);
      try {
        const data = await getQuizGroupDetails(quizGroupId);
        setQuizGroup(data);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar o resumo final.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [quizGroupId]);

  const players = useMemo(() => {
    const quizzes = quizGroup?.quizzesData || [];
    const ranking = Array.isArray(quizGroup?.ranking) ? quizGroup.ranking : [];
    const detailsByUser = {};

    quizzes.forEach((quiz) => {
      (quiz.voterDetails || []).forEach((user) => {
        const uid = user.uid || user.id;
        if (!uid) return;
        detailsByUser[uid] = user;
      });
    });

    const statsByUser = {};
    quizzes.forEach((quiz) => {
      Object.entries(quiz.votes || {}).forEach(([userId, optionIndex]) => {
        if (!statsByUser[userId]) {
          statsByUser[userId] = {
            userId,
            correct: 0,
            total: 0,
            photoURL: detailsByUser[userId]?.photoURL || null,
            username: detailsByUser[userId]?.username || null,
            name: detailsByUser[userId]?.username || detailsByUser[userId]?.displayName || 'Usuário',
          };
        }

        statsByUser[userId].total += 1;
        if (quiz.correctAnswer !== null && quiz.correctAnswer !== undefined && optionIndex === quiz.correctAnswer) {
          statsByUser[userId].correct += 1;
        }
      });
    });

    ranking.forEach((entry) => {
      if (quizGroup?.rankingType === 'teams') {
        (entry.teamMembers || []).forEach((member) => {
          if (!statsByUser[member.userId]) {
            statsByUser[member.userId] = {
              userId: member.userId,
              correct: entry.totalCorrect || 0,
              total: entry.totalVotes || 0,
              name: member.name || 'Usuário',
              photoURL: member.photoURL || null,
            };
          }
        });
        return;
      }

      statsByUser[entry.userId] = {
        ...(statsByUser[entry.userId] || {}),
        ...entry,
        userId: entry.userId,
        correct: entry.correct || statsByUser[entry.userId]?.correct || 0,
        total: entry.total || statsByUser[entry.userId]?.total || 0,
        name: entry.name || statsByUser[entry.userId]?.name || 'Usuário',
        photoURL: entry.photoURL || statsByUser[entry.userId]?.photoURL || null,
      };
    });

    return Object.values(statsByUser)
      .filter((player) => player.total > 0)
      .sort((first, second) => {
        if (second.correct !== first.correct) return second.correct - first.correct;
        return second.total - first.total;
      })
      .map((player, index) => ({
        ...player,
        position: index + 1,
        points: player.correct,
        accuracy: player.total > 0 ? Math.round((player.correct / player.total) * 100) : 0,
        title: player.title || getPlayerTitle(index),
        isCurrentUser: player.userId === currentUser?.uid,
      }));
  }, [currentUser?.uid, quizGroup]);

  const me = players.find((player) => player.isCurrentUser) || null;
  const totalQuestions = quizGroup?.quizzesData?.length || 0;
  const displayTitle = quizGroup?.title || quizGroupTitle || 'Grupo de quiz';

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando resumo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton} activeOpacity={0.82}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resumo Final</Text>
        <SoundMuteButton compact />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={HERO_GRADIENT} style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Crown size={17} color="#FDE68A" />
            <Text style={styles.heroBadgeText}>
              {me?.position ? `${me.position}º lugar` : 'Seu resumo'}
            </Text>
          </View>

          <Text style={styles.heroTitle}>Resumo da rodada</Text>
          <Text style={styles.heroSubtitle}>{displayTitle} concluído.</Text>

          <View style={styles.heroStatsGrid}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{me?.correct || 0}</Text>
              <Text style={styles.heroStatLabel}>acertos</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{me?.accuracy || 0}%</Text>
              <Text style={styles.heroStatLabel}>precisão</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{me?.total || totalQuestions}</Text>
              <Text style={styles.heroStatLabel}>respondidas</Text>
            </View>
          </View>
        </LinearGradient>

        {me ? (
          <View style={styles.meCard}>
            <View style={styles.meAccent} />
            <AvatarCircle size={72} name={me.name} photoURL={me.photoURL} />
            <View style={styles.meRankBadge}>
              <Text style={styles.meRankText}>{me.position}</Text>
            </View>
            <Text style={styles.meName}>{me.name}</Text>
            <Text style={styles.meTitle}>{me.title}</Text>
            <View style={styles.meStatsRow}>
              <View style={styles.meStatPill}>
                <Trophy size={15} color="#FFD84D" />
                <Text style={styles.meStatText}>{me.points} pts</Text>
              </View>
              <View style={styles.meStatPill}>
                <Target size={15} color="#A78BFA" />
                <Text style={styles.meStatText}>{me.accuracy}%</Text>
              </View>
              <View style={styles.meStatPill}>
                <BarChart3 size={15} color="#34D399" />
                <Text style={styles.meStatText}>{me.total}/{totalQuestions}</Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Resumo da galera</Text>
          <Text style={styles.sectionMeta}>{players.length} jogadores</Text>
        </View>

        <View style={styles.playersList}>
          {players.map((player) => (
            <View key={player.userId} style={[styles.playerRow, player.isCurrentUser && styles.playerRowMe]}>
              <Text style={[styles.playerPosition, player.position <= 3 && styles.playerPositionTop]}>
                {player.position}º
              </Text>
              <AvatarCircle size={46} name={player.name} photoURL={player.photoURL} />
              <View style={styles.playerInfo}>
                <Text style={styles.playerName} numberOfLines={1}>
                  {player.isCurrentUser ? `${player.name} · você` : player.name}
                </Text>
                <Text style={styles.playerTitle} numberOfLines={1}>{player.title}</Text>
              </View>
              <View style={styles.playerStats}>
                <Text style={[styles.playerPoints, player.isCurrentUser && styles.playerPointsMe]}>
                  {player.points} pts
                </Text>
                <Text style={styles.playerAccuracy}>{player.correct}/{player.total} · {player.accuracy}%</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.finishButton}
          onPress={() => navigation.navigate('MainTabs', { screen: 'home' })}
          activeOpacity={0.85}
        >
          <Text style={styles.finishButtonText}>Voltar para o início</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#08080C',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 15,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#232326',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...fontStyles.extrabold,
    color: '#FFFFFF',
    fontSize: 22,
    letterSpacing: -0.4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 190,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(76,29,149,0.42)',
    marginBottom: 34,
  },
  heroBadgeText: {
    ...fontStyles.extrabold,
    color: '#FFFFFF',
    fontSize: 13,
  },
  heroTitle: {
    ...fontStyles.extrabold,
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.7,
  },
  heroSubtitle: {
    ...fontStyles.regular,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 16,
    lineHeight: 22,
    marginTop: 6,
  },
  heroStatsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 26,
  },
  heroStatItem: {
    flex: 1,
    minHeight: 78,
    borderRadius: 18,
    backgroundColor: 'rgba(76,29,149,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatValue: {
    ...fontStyles.extrabold,
    color: '#FFFFFF',
    fontSize: 26,
  },
  heroStatLabel: {
    ...fontStyles.bold,
    color: 'rgba(255,255,255,0.76)',
    fontSize: 12,
    marginTop: 3,
  },
  meCard: {
    backgroundColor: '#17140D',
    borderWidth: 1,
    borderColor: 'rgba(255,216,77,0.32)',
    borderRadius: 28,
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 26,
    overflow: 'hidden',
  },
  meAccent: {
    position: 'absolute',
    top: -58,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,216,77,0.08)',
  },
  meRankBadge: {
    marginTop: -18,
    marginLeft: 58,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meRankText: {
    ...fontStyles.extrabold,
    color: '#FFFFFF',
    fontSize: 13,
  },
  meName: {
    ...fontStyles.extrabold,
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 8,
  },
  meTitle: {
    ...fontStyles.regular,
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 3,
  },
  meStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  meStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  meStatText: {
    ...fontStyles.bold,
    color: '#FFFFFF',
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    ...fontStyles.extrabold,
    color: '#FFFFFF',
    fontSize: 22,
    letterSpacing: -0.4,
  },
  sectionMeta: {
    ...fontStyles.regular,
    color: colors.textMuted,
    fontSize: 12,
  },
  playersList: {
    gap: 10,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111116',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  playerRowMe: {
    backgroundColor: 'rgba(139,92,246,0.18)',
    borderColor: 'rgba(167,139,250,0.52)',
  },
  playerPosition: {
    ...fontStyles.extrabold,
    width: 32,
    color: colors.textMuted,
    fontSize: 14,
  },
  playerPositionTop: {
    color: '#FFD84D',
  },
  playerInfo: {
    flex: 1,
    minWidth: 0,
  },
  playerName: {
    ...fontStyles.extrabold,
    color: '#FFFFFF',
    fontSize: 16,
  },
  playerTitle: {
    ...fontStyles.regular,
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  playerStats: {
    alignItems: 'flex-end',
  },
  playerPoints: {
    ...fontStyles.extrabold,
    color: colors.primaryLight,
    fontSize: 15,
  },
  playerPointsMe: {
    color: '#FFD84D',
  },
  playerAccuracy: {
    ...fontStyles.regular,
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  finishButton: {
    marginTop: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    paddingVertical: 15,
    alignItems: 'center',
  },
  finishButtonText: {
    ...fontStyles.extrabold,
    color: '#FFFFFF',
    fontSize: 16,
  },
});
