import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Crown, Trophy, Clock, ChevronRight, Award } from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';
import Header from '../components/Header';
import AvatarCircle from '../components/AvatarCircle';

export default function SelectQuizGroupRankingScreen({ navigation, route }) {
  const { groupId, groupName } = route.params || {};
  const { getGroupQuizGroups, getQuizGroupDetails } = useGroups();
  const [quizGroups, setQuizGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizGroups();
  }, [groupId]);

  const loadQuizGroups = async () => {
    try {
      setLoading(true);
      const groups = await getGroupQuizGroups(groupId);
      
      // Filtrar apenas grupos com ranking
      const withRanking = groups.filter(qg => qg.ranking && qg.ranking.length > 0);
      setQuizGroups(withRanking);
    } catch (error) {
      console.error('Error loading quiz groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizGroupSelect = (quizGroup) => {
    navigation.navigate('Ranking', {
      quizGroupId: quizGroup.id,
      groupId: groupId,
      groupName: groupName,
      quizGroupTitle: quizGroup.title,
    });
  };

  const handleOverallRanking = async () => {
    try {
      // Calcular ranking geral do grupo
      const allQuizGroups = await getGroupQuizGroups(groupId);
      const withRanking = allQuizGroups.filter(qg => qg.ranking && qg.ranking.length > 0);
      
      if (withRanking.length === 0) {
        return;
      }

      // Agregar scores de todos os quiz groups
      const userScores = {};
      withRanking.forEach(quizGroup => {
        const sortedRanking = [...(quizGroup.ranking || [])].sort((a, b) => {
          if (quizGroup.rankingType === 'teams') {
            return b.totalCorrect - a.totalCorrect;
          }
          return b.correct - a.correct;
        });
        
        sortedRanking.forEach((entry, index) => {
          const userId = quizGroup.rankingType === 'teams' 
            ? entry.teamMembers?.map(m => m.userId).join('_') 
            : entry.userId;
          
          if (!userScores[userId]) {
            userScores[userId] = {
              userId: entry.userId || userId,
              name: entry.name || 'Usuário',
              totalCorrect: 0,
              totalQuizzes: 0,
              positions: []
            };
          }
          
          userScores[userId].totalCorrect += (entry.correct || entry.totalCorrect || 0);
          userScores[userId].totalQuizzes += 1;
          userScores[userId].positions.push(index + 1);
        });
      });

      const overallRanking = Object.values(userScores)
        .sort((a, b) => b.totalCorrect - a.totalCorrect)
        .map((entry, index) => ({
          ...entry,
          position: index + 1
        }));

      // Usar o último quiz group como base para navegação
      const latestRanking = withRanking.sort((a, b) => {
        const aTime = a.endTime?.toDate ? a.endTime.toDate() : new Date(a.endTime);
        const bTime = b.endTime?.toDate ? b.endTime.toDate() : new Date(b.endTime);
        return bTime - aTime;
      })[0];

      navigation.navigate('Ranking', {
        quizGroupId: latestRanking.id,
        groupId: groupId,
        groupName: groupName,
        quizGroupTitle: 'Ranking Geral do Grupo',
        overallRanking: overallRanking,
      });
    } catch (error) {
      console.error('Error calculating overall ranking:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header
          title={groupName || 'Ranking'}
          subtitle="Selecione um quiz ou veja o ranking geral"
          onBack={() => navigation.goBack()}
        />

        {/* Card Ranking Geral */}
        <TouchableOpacity
          style={[styles.quizGroupCard, styles.overallCard]}
          onPress={handleOverallRanking}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Trophy size={32} color="#FFD700" />
              <Crown size={24} color="#FF6B35" style={styles.crownOverlay} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Ranking Geral do Grupo</Text>
              <Text style={styles.cardSubtitle}>
                Soma de todos os rankings
              </Text>
            </View>
            <ChevronRight size={20} color="#B0B0B0" />
          </View>
        </TouchableOpacity>

        {/* Lista de Quiz Groups */}
        {quizGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Trophy size={64} color="#71717a" />
            <Text style={styles.emptyText}>Nenhum ranking disponível</Text>
            <Text style={styles.emptySubtext}>
              Complete um grupo de quiz para ver rankings
            </Text>
          </View>
        ) : (
          <View style={styles.quizGroupsContainer}>
            <Text style={styles.sectionTitle}>Rankings de Quiz Groups</Text>
            {quizGroups.map((quizGroup) => {
              const sortedRanking = [...(quizGroup.ranking || [])].sort((a, b) => {
                if (quizGroup.rankingType === 'teams') {
                  return b.totalCorrect - a.totalCorrect;
                }
                return b.correct - a.correct;
              });
              
              return (
                <TouchableOpacity
                  key={quizGroup.id}
                  style={styles.quizGroupCard}
                  onPress={() => handleQuizGroupSelect(quizGroup)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIconContainerSmall}>
                      <Trophy size={24} color="#8A4F9E" />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{quizGroup.title}</Text>
                      <View style={styles.cardMeta}>
                        <Clock size={14} color="#B0B0B0" />
                        <Text style={styles.cardMetaText}>
                          {quizGroup.endTime?.toDate 
                            ? new Date(quizGroup.endTime.toDate()).toLocaleDateString('pt-BR')
                            : 'Encerrado'}
                        </Text>
                        <Text style={styles.cardMetaSeparator}>•</Text>
                        <Text style={styles.cardMetaText}>
                          {sortedRanking.length} participantes
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color="#B0B0B0" />
                  </View>
                  
                  {/* Preview Top 3 */}
                  <View style={styles.top3Preview}>
                    {sortedRanking.slice(0, 3).map((member, index) => {
                      const displayName = quizGroup.rankingType === 'teams'
                        ? member.teamMembers?.map(m => m.name).join(', ') || 'Time'
                        : member.name || 'Usuário';
                      
                      return (
                        <View key={member.userId || index} style={styles.top3Item}>
                          {index === 0 && (
                            <Crown size={14} color="#FF6B35" style={styles.crownIcon} />
                          )}
                          <AvatarCircle
                            name={displayName}
                            size={28}
                            style={styles.top3Avatar}
                          />
                          <Text style={styles.top3Name} numberOfLines={1}>
                            {displayName}
                          </Text>
                          <Text style={styles.top3Score}>
                            {member.correct || member.totalCorrect || 0}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    marginTop: 8,
  },
  quizGroupsContainer: {
    gap: 16,
    marginTop: 24,
  },
  quizGroupCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  overallCard: {
    borderColor: '#8A4F9E',
    borderWidth: 2,
    backgroundColor: 'rgba(138, 79, 158, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardIconContainerSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(138, 79, 158, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownOverlay: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardMetaText: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  cardMetaSeparator: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  top3Preview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    gap: 8,
  },
  top3Item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  crownIcon: {
    marginRight: -4,
  },
  top3Avatar: {
    marginRight: -8,
  },
  top3Name: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  top3Score: {
    fontSize: 14,
    color: '#8A4F9E',
    fontWeight: '600',
  },
});




