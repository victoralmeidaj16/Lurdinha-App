import React, { useState, useEffect, useMemo } from 'react';
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
  Clock,
  Trophy,
  Eye,
  Ghost,
  Users2,
  ChevronRight,
  Plus,
  CheckCircle2,
  Share2,
  Clock3,
} from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

const COLORS = {
  bg: '#0E0E10',
  card: '#17171B',
  purple: '#9061F9',
  orange: '#FF7A59',
  text: '#F5F7FB',
  text2: '#B9C0CC',
  green: '#32D583',
  border: 'rgba(255,255,255,0.08)',
};

const TYPES = {
  normal: { label: 'Normal', icon: Eye },
  ghost: { label: 'Ghost', icon: Ghost },
  challenge: { label: 'Desafio', icon: Trophy },
};

function GroupBadge({ name, color, badge }) {
  return (
    <View style={styles.groupBadge}>
      <Text style={styles.groupBadgeEmoji}>{badge || '👥'}</Text>
      <Text style={styles.groupBadgeText}>{name}</Text>
    </View>
  );
}

function SegmentedControl({ value, onChange, items }) {
  return (
    <View style={styles.segmentedContainer}>
      {items.map((item) => {
        const IconComponent = item.icon;
        const isSelected = value === item.value;
        
        return (
          <TouchableOpacity
            key={item.value}
            onPress={() => onChange(item.value)}
            style={[
              styles.segmentedButton,
              isSelected && styles.segmentedButtonActive,
            ]}
            activeOpacity={0.7}
          >
            <IconComponent size={14} color={isSelected ? COLORS.text : COLORS.text2} />
            <Text style={[
              styles.segmentedButtonText,
              isSelected && styles.segmentedButtonTextActive,
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function PollCard({ poll, onAnswer, onShare }) {
  const TypeIcon = TYPES[poll.type]?.icon || Eye;
  const typeLabel = TYPES[poll.type]?.label || 'Normal';
  const shouldShowAnswerHint = poll.hasVoted && poll.isActive;

  return (
    <View style={styles.pollCard}>
      <View style={styles.pollHeader}>
        <View style={styles.pollType}>
          <TypeIcon size={16} color={COLORS.text2} />
          <Text style={styles.pollTypeText}>{typeLabel}</Text>
        </View>
        <View style={styles.pollTime}>
          <Clock3 size={14} color={COLORS.text2} />
          <Text style={styles.pollTimeText}>{poll.timeLeft}</Text>
        </View>
      </View>

      <Text style={styles.pollTitle}>{poll.question}</Text>

      <View style={styles.pollGroupInfo}>
        <GroupBadge 
          name={poll.groupName} 
          color={poll.groupColor}
          badge={poll.groupBadge}
        />
        <Text style={styles.pollGroupName}>• {poll.quizGroupTitle}</Text>
        <Text style={styles.pollParticipants}>
          {poll.participants} participando agora
        </Text>
      </View>

      <View style={styles.pollFooter}>
        <View style={styles.pollFooterLeft}>
          <View style={styles.pollStreak}>
            <CheckCircle2 size={16} color={COLORS.green} />
            <Text style={styles.pollStreakText}>+{poll.streakImpact || 1} streak</Text>
          </View>
          {shouldShowAnswerHint && (
            <TouchableOpacity
              style={styles.addAnswerButton}
              onPress={() => onAnswer(poll)}
              activeOpacity={0.8}
            >
              <Text style={styles.addAnswerText}>Adicionar resposta correta</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.pollActions}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => onShare(poll)}
            activeOpacity={0.7}
          >
            <Share2 size={16} color={COLORS.text} />
            <Text style={styles.shareButtonText}>Compartilhar</Text>
          </TouchableOpacity>
          {!shouldShowAnswerHint && (
            <TouchableOpacity
              style={styles.answerButton}
              onPress={() => onAnswer(poll)}
              activeOpacity={0.8}
            >
              <Text style={styles.answerButtonText}>Responder</Text>
              <ChevronRight size={16} color={COLORS.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

function EmptyState({ onCreateGroup }) {
  return (
    <View style={styles.emptyContainer}>
      <Ghost size={44} color={COLORS.text2} />
      <Text style={styles.emptyTitle}>Nada por aqui… ainda</Text>
      <Text style={styles.emptyText}>
        Crie ou entre em um grupo para ver enquetes ativas da sua galera.
      </Text>
      <TouchableOpacity
        style={styles.createGroupButton}
        onPress={onCreateGroup}
        activeOpacity={0.8}
      >
        <Plus size={18} color={COLORS.text} />
        <Text style={styles.createGroupButtonText}>Criar grupo</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function QuizGroupsScreen({ navigation }) {
  const { currentUser } = useAuth();
  const { getUserGroups, getGroupQuizGroups, getQuizGroupDetails } = useGroups();
  
  const [filter, setFilter] = useState('todas');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allQuizzes, setAllQuizzes] = useState([]);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const userGroups = await getUserGroups();
      
      // Buscar todos os quizGroups de cada grupo
      const quizGroupsPromises = userGroups.map(group => 
        getGroupQuizGroups(group.id)
      );
      
      const quizGroupsArrays = await Promise.all(quizGroupsPromises);
      
      // Para cada quizGroup, buscar os detalhes e os quizzes
      const allQuizGroups = [];
      
      userGroups.forEach((group, groupIndex) => {
        quizGroupsArrays[groupIndex].forEach((quizGroup) => {
          allQuizGroups.push({ quizGroup, group });
        });
      });

      // Buscar detalhes de todos os quizGroups
      const quizzesPromises = allQuizGroups.map(async ({ quizGroup, group }) => {
        try {
          const details = await getQuizGroupDetails(quizGroup.id);
          if (!details || !details.quizzesData || details.quizzesData.length === 0) {
            return [];
          }

          const endTime = details.endTime?.toDate 
            ? details.endTime.toDate() 
            : details.endTime 
              ? new Date(details.endTime) 
              : null;
          
          let timeLeft = '';
          if (endTime) {
            const diff = endTime - new Date();
            if (diff > 0) {
              const hours = Math.floor(diff / (1000 * 60 * 60));
              const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              if (hours > 0) {
                timeLeft = `${hours}h ${minutes}m`;
              } else {
                timeLeft = `${minutes}m`;
              }
            } else {
              timeLeft = 'Expirado';
            }
          } else if (details.timeDescription) {
            timeLeft = details.timeDescription;
          } else {
            timeLeft = 'Sem prazo';
          }

          return details.quizzesData.map((quiz) => {
            const userVote = quiz.votes && quiz.votes[currentUser?.uid] !== undefined;
            const participants = Object.keys(quiz.votes || {}).length;

            return {
              id: quiz.id,
              quizGroupId: quizGroup.id,
              question: quiz.question,
              quizGroupTitle: details.title,
              groupName: group.name,
              groupColor: group.color,
              groupBadge: group.badge,
              timeLeft,
              type: details.mode,
              participants,
              hasVoted: userVote,
              isActive: details.status === 'active',
              endTime: endTime,
            };
          });
        } catch (error) {
          console.error('Error loading quiz group details:', error);
          return [];
        }
      });

      // Aguardar todas as promessas e flatten
      const quizzesArrays = await Promise.all(quizzesPromises);
      const quizzes = quizzesArrays.flat();
      
      // Ordenar por mais recentes/ativos
      quizzes.sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        if (a.endTime && b.endTime) {
          return a.endTime - b.endTime;
        }
        return 0;
      });

      setAllQuizzes(quizzes);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuizzes();
    setRefreshing(false);
  };

  const filteredQuizzes = useMemo(() => {
    let filtered = allQuizzes;

    if (filter !== 'todas') {
      filtered = filtered.filter((poll) => poll.type === filter);
    }

    return filtered;
  }, [allQuizzes, filter]);

  const answeredQuizzes = filteredQuizzes.filter(q => q.hasVoted);
  const unansweredQuizzes = filteredQuizzes.filter(q => !q.hasVoted);

  const handleAnswer = (poll) => {
    navigation.navigate('QuizGroupDetail', { 
      quizGroupId: poll.quizGroupId,
      groupName: poll.groupName,
    });
  };

  const handleShare = (poll) => {
    // Implementar compartilhamento
    // Share poll functionality
  };

  const handleCreateGroup = () => {
    // Navegar para grupos primeiro, depois o usuário pode criar um grupo de quiz
    navigation.navigate('groups');
  };

  const handleCreateQuizGroup = () => {
    // Navegar para seleção de grupo para criar quiz group
    navigation.navigate('SelectGroupForQuiz');
  };

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
          title="Enquetes ativas"
          subtitle="Escolha, aposte no seu feeling e descubra se até a Lurdinha sabia…"
        />

        {/* Segmented Control */}
        <View style={styles.segmentedSection}>
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            items={[
              { value: 'todas', label: 'Todas', icon: Users2 },
              { value: 'normal', label: 'Normais', icon: Eye },
              { value: 'ghost', label: 'Ghost', icon: Ghost },
              { value: 'challenge', label: 'Desafio', icon: Trophy },
            ]}
          />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.secondaryLink}
            onPress={handleCreateQuizGroup}
            activeOpacity={0.85}
          >
            <Plus size={18} color={COLORS.purple} />
            <Text style={styles.secondaryLinkText}>Criar grupo de quiz</Text>
          </TouchableOpacity>
        </View>

        {/* Loading */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.purple} />
          </View>
        ) : filteredQuizzes.length === 0 ? (
          <EmptyState onCreateGroup={handleCreateGroup} />
        ) : (
          <>
            {/* Não Respondidas */}
            {unansweredQuizzes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Não respondidas ({unansweredQuizzes.length})
                </Text>
                <View style={styles.quizzesList}>
                  {unansweredQuizzes.map((poll) => (
                    <PollCard
                      key={poll.id}
                      poll={poll}
                      onAnswer={handleAnswer}
                      onShare={handleShare}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Respondidas */}
            {answeredQuizzes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Respondidas ({answeredQuizzes.length})
                </Text>
                <View style={styles.quizzesList}>
                  {answeredQuizzes.map((poll) => (
                    <PollCard
                      key={poll.id}
                      poll={poll}
                      onAnswer={handleAnswer}
                      onShare={handleShare}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  highlightCard: {
    marginTop: 20,
    backgroundColor: 'rgba(147, 51, 234, 0.22)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.35)',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 6,
    gap: 12,
  },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(22, 101, 52, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  highlightBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f7fee7',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  highlightTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ede9fe',
    lineHeight: 24,
  },
  highlightSubtitle: {
    fontSize: 14,
    color: '#e9d5ff',
  },
  highlightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  highlightTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  highlightTimeText: {
    fontSize: 12,
    color: '#f7fee7',
  },
  highlightCta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fef9c3',
  },
  segmentedSection: {
    marginTop: 16,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
  },
  segmentedButtonActive: {
    backgroundColor: COLORS.purple,
  },
  segmentedButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text2,
  },
  segmentedButtonTextActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  actionRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  secondaryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(144, 97, 249, 0.3)',
    backgroundColor: 'rgba(144, 97, 249, 0.08)',
  },
  secondaryLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.purple,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  quizzesList: {
    gap: 12,
  },
  pollCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pollType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pollTypeText: {
    fontSize: 13,
    color: COLORS.text2,
  },
  pollTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pollTimeText: {
    fontSize: 12,
    color: COLORS.text2,
  },
  pollTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 24,
  },
  pollGroupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  groupBadgeEmoji: {
    fontSize: 14,
  },
  groupBadgeText: {
    fontSize: 12,
    color: COLORS.text2,
  },
  pollGroupName: {
    fontSize: 12,
    color: COLORS.text2,
  },
  pollParticipants: {
    fontSize: 12,
    color: COLORS.text2,
  },
  pollFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  pollFooterLeft: {
    flex: 1,
    gap: 8,
  },
  pollStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pollStreakText: {
    fontSize: 12,
    color: COLORS.text2,
  },
  pollActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addAnswerButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.24)',
  },
  addAnswerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#facc15',
    letterSpacing: 0.2,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  answerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.purple,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  answerButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text2,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 24,
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.purple,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  createGroupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});
