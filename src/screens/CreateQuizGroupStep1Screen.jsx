import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { 
  ArrowLeft, 
  ChevronRight,
  Eye,
  Ghost,
  Gift,
  Users,
  Clock,
  UserCheck,
  UserX,
  Shuffle,
  Users2,
} from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../contexts/AuthContext';

export default function CreateQuizGroupStep1Screen({ navigation, route }) {
  const { groupId } = route.params;
  const { currentUser } = useAuth();
  const { getGroupDetails, setupChallengeTeams, loading } = useGroups();
  
  const [quizType, setQuizType] = useState(1); // 1 ou 2
  const [mode, setMode] = useState('normal'); // normal, ghost, surprise, challenge
  const [timeLimit, setTimeLimit] = useState('24'); // horas
  const [allowEveryoneToMarkCorrect, setAllowEveryoneToMarkCorrect] = useState(true);
  const [challengeTeamSelection, setChallengeTeamSelection] = useState('random'); // random ou manual
  const [groupMembers, setGroupMembers] = useState([]);
  const [manualTeams, setManualTeams] = useState({ team1: [], team2: [] });

  useEffect(() => {
    loadGroupMembers();
  }, []);

  const loadGroupMembers = async () => {
    try {
      const group = await getGroupDetails(groupId);
      if (group.memberDetails) {
        setGroupMembers(group.memberDetails);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar membros do grupo');
    }
  };

  const handleToggleMemberTeam = (memberId) => {
    setManualTeams(prev => {
      const isInTeam1 = prev.team1.includes(memberId);
      const isInTeam2 = prev.team2.includes(memberId);
      
      if (isInTeam1) {
        return {
          team1: prev.team1.filter(id => id !== memberId),
          team2: prev.team2
        };
      } else if (isInTeam2) {
        return {
          team1: prev.team1,
          team2: prev.team2.filter(id => id !== memberId)
        };
      } else {
        // Adicionar ao time com menos membros
        const team1Count = prev.team1.length;
        const team2Count = prev.team2.length;
        
        if (team1Count <= team2Count) {
          return {
            team1: [...prev.team1, memberId],
            team2: prev.team2
          };
        } else {
          return {
            team1: prev.team1,
            team2: [...prev.team2, memberId]
          };
        }
      }
    });
  };

  const handleContinue = () => {
    if (mode === 'challenge' && challengeTeamSelection === 'manual') {
      const allMembersInTeams = manualTeams.team1.length + manualTeams.team2.length === groupMembers.length;
      if (!allMembersInTeams) {
        Alert.alert('Atenção', 'Todos os membros precisam estar em um time');
        return;
      }
      if (manualTeams.team1.length === 0 || manualTeams.team2.length === 0) {
        Alert.alert('Atenção', 'Cada time precisa ter pelo menos um membro');
        return;
      }
    }

    navigation.navigate('CreateQuizGroupStep2', {
      groupId,
      quizType,
      mode,
      timeLimit,
      allowEveryoneToMarkCorrect,
      challengeConfig: mode === 'challenge' ? {
        teamSelection: challengeTeamSelection,
        teams: challengeTeamSelection === 'manual' ? [manualTeams.team1, manualTeams.team2] : null
      } : null
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
              <Image 
                source={require('../../assets/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.headerTitle}>Criar Grupo de Quiz</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
          <Text style={styles.headerSubtitle}>Passo 1 de 2: Configurações</Text>
        </View>

        {/* Tipo de Quiz */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Quiz</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[
                styles.typeCard,
                quizType === 1 && styles.typeCardActive
              ]}
              onPress={() => setQuizType(1)}
              activeOpacity={0.8}
            >
              <Text style={styles.typeNumber}>1</Text>
              <Text style={styles.typeTitle}>Evento Futuro</Text>
              <Text style={styles.typeDescription}>
                Sem resposta definida{'\n'}Resposta será marcada depois
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeCard,
                quizType === 2 && styles.typeCardActive
              ]}
              onPress={() => setQuizType(2)}
              activeOpacity={0.8}
            >
              <Text style={styles.typeNumber}>2</Text>
              <Text style={styles.typeTitle}>Resposta Definida</Text>
              <Text style={styles.typeDescription}>
                Com resposta correta{'\n'}já conhecida
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modo</Text>
          <View style={styles.modesGrid}>
            <TouchableOpacity
              style={[
                styles.modeCard,
                mode === 'normal' && styles.modeCardActive
              ]}
              onPress={() => setMode('normal')}
              activeOpacity={0.8}
            >
              <Eye size={32} color={mode === 'normal' ? '#8A4F9E' : '#71717a'} />
              <Text style={[
                styles.modeTitle,
                mode === 'normal' && styles.modeTitleActive
              ]}>Normal</Text>
              <Text style={styles.modeDescription}>Avatares visíveis</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeCard,
                mode === 'ghost' && styles.modeCardActive
              ]}
              onPress={() => setMode('ghost')}
              activeOpacity={0.8}
            >
              <Ghost size={32} color={mode === 'ghost' ? '#8A4F9E' : '#71717a'} />
              <Text style={[
                styles.modeTitle,
                mode === 'ghost' && styles.modeTitleActive
              ]}>Ghost</Text>
              <Text style={styles.modeDescription}>Votos ocultos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeCard,
                mode === 'surprise' && styles.modeCardActive
              ]}
              onPress={() => setMode('surprise')}
              activeOpacity={0.8}
            >
              <Gift size={32} color={mode === 'surprise' ? '#8A4F9E' : '#71717a'} />
              <Text style={[
                styles.modeTitle,
                mode === 'surprise' && styles.modeTitleActive
              ]}>Surpresa</Text>
              <Text style={styles.modeDescription}>Resultados depois</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeCard,
                mode === 'challenge' && styles.modeCardActive
              ]}
              onPress={() => setMode('challenge')}
              activeOpacity={0.8}
            >
              <Users2 size={32} color={mode === 'challenge' ? '#8A4F9E' : '#71717a'} />
              <Text style={[
                styles.modeTitle,
                mode === 'challenge' && styles.modeTitleActive
              ]}>Desafios</Text>
              <Text style={styles.modeDescription}>Modo por times</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Configuração de Times (se modo Desafios) */}
        {mode === 'challenge' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Divisão de Times</Text>
            <View style={styles.teamSelectionRow}>
              <TouchableOpacity
                style={[
                  styles.teamSelectionButton,
                  challengeTeamSelection === 'random' && styles.teamSelectionButtonActive
                ]}
                onPress={() => setChallengeTeamSelection('random')}
                activeOpacity={0.8}
              >
                <Shuffle size={20} color={challengeTeamSelection === 'random' ? '#FFFFFF' : '#71717a'} />
                <Text style={[
                  styles.teamSelectionText,
                  challengeTeamSelection === 'random' && styles.teamSelectionTextActive
                ]}>Aleatório</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.teamSelectionButton,
                  challengeTeamSelection === 'manual' && styles.teamSelectionButtonActive
                ]}
                onPress={() => setChallengeTeamSelection('manual')}
                activeOpacity={0.8}
              >
                <Users size={20} color={challengeTeamSelection === 'manual' ? '#FFFFFF' : '#71717a'} />
                <Text style={[
                  styles.teamSelectionText,
                  challengeTeamSelection === 'manual' && styles.teamSelectionTextActive
                ]}>Manual</Text>
              </TouchableOpacity>
            </View>

            {challengeTeamSelection === 'manual' && (
              <View style={styles.manualTeamsContainer}>
                <View style={styles.teamSection}>
                  <Text style={styles.teamLabel}>Time 1 ({manualTeams.team1.length})</Text>
                  <View style={styles.membersList}>
                    {groupMembers.map(member => {
                      const isInTeam1 = manualTeams.team1.includes(member.uid);
                      return (
                        <TouchableOpacity
                          key={member.uid}
                          style={[
                            styles.memberTag,
                            isInTeam1 && styles.memberTagActive
                          ]}
                          onPress={() => handleToggleMemberTeam(member.uid)}
                          activeOpacity={0.8}
                        >
                          <Text style={[
                            styles.memberTagText,
                            isInTeam1 && styles.memberTagTextActive
                          ]}>
                            {member.displayName || 'Usuário'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.teamSection}>
                  <Text style={styles.teamLabel}>Time 2 ({manualTeams.team2.length})</Text>
                  <View style={styles.membersList}>
                    {groupMembers.map(member => {
                      const isInTeam2 = manualTeams.team2.includes(member.uid);
                      return (
                        <TouchableOpacity
                          key={member.uid}
                          style={[
                            styles.memberTag,
                            isInTeam2 && styles.memberTagActive
                          ]}
                          onPress={() => handleToggleMemberTeam(member.uid)}
                          activeOpacity={0.8}
                        >
                          <Text style={[
                            styles.memberTagText,
                            isInTeam2 && styles.memberTagTextActive
                          ]}>
                            {member.displayName || 'Usuário'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Prazo Limite */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prazo Limite</Text>
          <View style={styles.timeSelector}>
            <TouchableOpacity
              style={[
                styles.timeButton,
                timeLimit === '1' && styles.timeButtonActive
              ]}
              onPress={() => setTimeLimit('1')}
              activeOpacity={0.8}
            >
              <Clock size={20} color={timeLimit === '1' ? '#FFFFFF' : '#71717a'} />
              <Text style={[
                styles.timeButtonText,
                timeLimit === '1' && styles.timeButtonTextActive
              ]}>1 hora</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.timeButton,
                timeLimit === '24' && styles.timeButtonActive
              ]}
              onPress={() => setTimeLimit('24')}
              activeOpacity={0.8}
            >
              <Clock size={20} color={timeLimit === '24' ? '#FFFFFF' : '#71717a'} />
              <Text style={[
                styles.timeButtonText,
                timeLimit === '24' && styles.timeButtonTextActive
              ]}>24 horas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.timeButton,
                timeLimit === '168' && styles.timeButtonActive
              ]}
              onPress={() => setTimeLimit('168')}
              activeOpacity={0.8}
            >
              <Clock size={20} color={timeLimit === '168' ? '#FFFFFF' : '#71717a'} />
              <Text style={[
                styles.timeButtonText,
                timeLimit === '168' && styles.timeButtonTextActive
              ]}>7 dias</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quem pode marcar resposta correta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marcar Resposta Correta</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                allowEveryoneToMarkCorrect && styles.toggleOptionActive
              ]}
              onPress={() => setAllowEveryoneToMarkCorrect(true)}
              activeOpacity={0.8}
            >
              <UserCheck size={20} color={allowEveryoneToMarkCorrect ? '#FFFFFF' : '#71717a'} />
              <Text style={[
                styles.toggleText,
                allowEveryoneToMarkCorrect && styles.toggleTextActive
              ]}>Todos podem marcar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleOption,
                !allowEveryoneToMarkCorrect && styles.toggleOptionActive
              ]}
              onPress={() => setAllowEveryoneToMarkCorrect(false)}
              activeOpacity={0.8}
            >
              <UserX size={20} color={!allowEveryoneToMarkCorrect ? '#FFFFFF' : '#71717a'} />
              <Text style={[
                styles.toggleText,
                !allowEveryoneToMarkCorrect && styles.toggleTextActive
              ]}>Só criador</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Continuar</Text>
              <ChevronRight size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
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
  header: {
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    backgroundColor: '#27272a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  typeCardActive: {
    borderColor: '#8A4F9E',
    backgroundColor: 'rgba(138, 79, 158, 0.1)',
  },
  typeNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8A4F9E',
    marginBottom: 8,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  typeDescription: {
    fontSize: 12,
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 16,
  },
  modesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modeCard: {
    width: '48%',
    backgroundColor: '#27272a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeCardActive: {
    borderColor: '#8A4F9E',
    backgroundColor: 'rgba(138, 79, 158, 0.1)',
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#71717a',
    marginTop: 12,
    marginBottom: 4,
  },
  modeTitleActive: {
    color: '#FFFFFF',
  },
  modeDescription: {
    fontSize: 12,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  teamSelectionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  teamSelectionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teamSelectionButtonActive: {
    borderColor: '#8A4F9E',
    backgroundColor: 'rgba(138, 79, 158, 0.1)',
  },
  teamSelectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#71717a',
  },
  teamSelectionTextActive: {
    color: '#FFFFFF',
  },
  manualTeamsContainer: {
    marginTop: 16,
    gap: 16,
  },
  teamSection: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
  },
  teamLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  membersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  memberTagActive: {
    backgroundColor: '#8A4F9E',
    borderColor: '#8A4F9E',
  },
  memberTagText: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  memberTagTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeButtonActive: {
    borderColor: '#8A4F9E',
    backgroundColor: 'rgba(138, 79, 158, 0.1)',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717a',
  },
  timeButtonTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  toggleOptionActive: {
    borderColor: '#8A4F9E',
    backgroundColor: 'rgba(138, 79, 158, 0.1)',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717a',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8A4F9E',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

