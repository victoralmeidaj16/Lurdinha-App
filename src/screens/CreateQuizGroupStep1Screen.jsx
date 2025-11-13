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
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  ArrowLeft, 
  ChevronRight,
  Eye,
  Ghost,
  Users,
  Clock,
  UserCheck,
  Shuffle,
  Users2,
} from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

const PRIMARY_PURPLE = '#9F63FF';
const PRIMARY_PURPLE_RGB = '159, 99, 255';
const PRIMARY_PURPLE_ALPHA_08 = `rgba(${PRIMARY_PURPLE_RGB}, 0.08)`;
const PRIMARY_PURPLE_ALPHA_10 = `rgba(${PRIMARY_PURPLE_RGB}, 0.1)`;
const PRIMARY_PURPLE_ALPHA_12 = `rgba(${PRIMARY_PURPLE_RGB}, 0.12)`;
const PRIMARY_PURPLE_ALPHA_15 = `rgba(${PRIMARY_PURPLE_RGB}, 0.15)`;
const PRIMARY_PURPLE_ALPHA_20 = `rgba(${PRIMARY_PURPLE_RGB}, 0.2)`;
const PRIMARY_PURPLE_ALPHA_25 = `rgba(${PRIMARY_PURPLE_RGB}, 0.25)`;

export default function CreateQuizGroupStep1Screen({ navigation, route }) {
  const { groupId } = route.params;
  const { currentUser } = useAuth();
  const { getGroupDetails, setupChallengeTeams, loading } = useGroups();
  
  const [quizGroupTitle, setQuizGroupTitle] = useState('');
  const [quizType, setQuizType] = useState(1); // 1 ou 2
  const [mode, setMode] = useState('normal'); // normal, ghost, challenge
  const [endDateTime, setEndDateTime] = useState(null); // Data/hora de término
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDescription, setShowDescription] = useState(false); // Mostrar campo de descrição
  const [timeDescription, setTimeDescription] = useState(''); // Descrição do prazo
  const [allowEveryoneToMarkCorrect, setAllowEveryoneToMarkCorrect] = useState(true);
  const [challengeTeamSelection, setChallengeTeamSelection] = useState('random'); // random ou manual
  const [groupMembers, setGroupMembers] = useState([]);
  const [manualTeams, setManualTeams] = useState({ team1: [], team2: [] });

  useEffect(() => {
    loadGroupMembers();
    // Inicializar com data/hora padrão (24h a partir de agora)
    const defaultDate = new Date();
    defaultDate.setHours(defaultDate.getHours() + 24);
    setEndDateTime(defaultDate);
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
    if (!quizGroupTitle.trim()) {
      Alert.alert('Erro', 'Digite um título para o grupo de quiz');
      return;
    }

    if (!endDateTime || endDateTime <= new Date()) {
      Alert.alert('Erro', 'O prazo limite deve ser uma data/hora futura');
      return;
    }

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

    // Calcular timeLimit em horas a partir de endDateTime
    const hoursUntilEnd = Math.ceil((endDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60));

    navigation.navigate('CreateQuizGroupStep2', {
      groupId,
      quizGroupTitle: quizGroupTitle.trim(),
      quizType,
      mode,
      timeLimit: hoursUntilEnd.toString(),
      endDateTime: endDateTime.toISOString(),
      timeDescription: timeDescription.trim(),
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
        <Header
          title="Criar Grupo de Quiz"
          subtitle="Passo 1 de 2: Configurações"
          onBack={() => navigation.goBack()}
        />

        {/* Título do Grupo de Quiz */}
        <View style={[styles.section, styles.firstSection]}>
          <Text style={styles.sectionTitle}>Título do Grupo de Quiz</Text>
          <TextInput
            style={styles.titleInput}
            value={quizGroupTitle}
            onChangeText={setQuizGroupTitle}
            placeholder="Ex: Enquetes do Churrasco"
            placeholderTextColor="#71717a"
            maxLength={50}
          />
        </View>

        {/* Tipo de Quiz */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Quiz</Text>
          <View style={styles.typeCardsColumn}>
            <TouchableOpacity
              style={[
                styles.typeCard,
                quizType === 1 && styles.typeCardActive
              ]}
              onPress={() => setQuizType(1)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.typeTitle,
                quizType === 1 && styles.typeTitleActive
              ]}>Evento Futuro</Text>
              <Text style={[
                styles.typeDescription,
                quizType === 1 && styles.typeDescriptionActive
              ]}>
                Sem resposta definida{'\n'}Resposta será marcada depois
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeCard,
                quizType === 2 && styles.typeCardActive
              ]}
              onPress={() => setQuizType(2)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.typeTitle,
                quizType === 2 && styles.typeTitleActive
              ]}>Resposta Definida</Text>
              <Text style={[
                styles.typeDescription,
                quizType === 2 && styles.typeDescriptionActive
              ]}>
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
              <Eye size={20} color={mode === 'normal' ? PRIMARY_PURPLE : '#71717a'} />
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
              activeOpacity={0.7}
            >
              <Ghost size={20} color={mode === 'ghost' ? PRIMARY_PURPLE : '#71717a'} />
              <Text style={[
                styles.modeTitle,
                mode === 'ghost' && styles.modeTitleActive
              ]}>Ghost</Text>
              <Text style={styles.modeDescription}>Votos ocultos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeCard,
                mode === 'challenge' && styles.modeCardActive
              ]}
              onPress={() => setMode('challenge')}
              activeOpacity={0.7}
            >
              <Users2 size={20} color={mode === 'challenge' ? PRIMARY_PURPLE : '#71717a'} />
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
          
          {/* Data */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Data</Text>
            <TouchableOpacity
              style={styles.dateTimeInput}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dateTimeInputText}>
                {endDateTime ? endDateTime.toLocaleDateString('pt-BR') : 'Selecione a data'}
              </Text>
              <Clock size={20} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Hora */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hora</Text>
            <TouchableOpacity
              style={styles.dateTimeInput}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dateTimeInputText}>
                {endDateTime ? endDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Selecione a hora'}
              </Text>
              <Clock size={20} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Botão Adicionar Descrição */}
          {!showDescription && (
            <TouchableOpacity
              style={styles.addDescriptionButton}
              onPress={() => setShowDescription(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addDescriptionButtonText}>+ Adicionar Descrição</Text>
            </TouchableOpacity>
          )}

          {/* Descrição do Prazo - Só aparece se mostrar */}
          {showDescription && (
            <View style={styles.inputGroup}>
              <View style={styles.descriptionHeader}>
                <Text style={styles.inputLabel}>Descrição do Prazo</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowDescription(false);
                    setTimeDescription('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.removeDescriptionText}>Remover</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.descriptionInput}
                value={timeDescription}
                onChangeText={setTimeDescription}
                placeholder="Ex: até amanhã as 10h ou até uma hora antes do começo do churrasco"
                placeholderTextColor="#71717a"
                multiline
                maxLength={100}
              />
            </View>
          )}
        </View>

        {/* DateTime Pickers */}
        {showDatePicker && (
          <DateTimePicker
            value={endDateTime || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                const newDate = selectedDate;
                if (endDateTime) {
                  newDate.setHours(endDateTime.getHours());
                  newDate.setMinutes(endDateTime.getMinutes());
                }
                setEndDateTime(newDate);
              }
            }}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={endDateTime || new Date()}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (selectedTime) {
                const newDate = endDateTime || new Date();
                newDate.setHours(selectedTime.getHours());
                newDate.setMinutes(selectedTime.getMinutes());
                setEndDateTime(newDate);
              }
            }}
          />
        )}

        {/* Quem pode marcar resposta correta */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabelContainer}>
          <UserCheck size={20} color={PRIMARY_PURPLE} />
              <Text style={styles.switchLabel}>Todos podem marcar resposta correta</Text>
            </View>
            <Switch
              value={allowEveryoneToMarkCorrect}
              onValueChange={setAllowEveryoneToMarkCorrect}
              trackColor={{ false: '#3f3f46', true: PRIMARY_PURPLE }}
              thumbColor="#FFFFFF"
            />
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
  firstSection: {
    marginTop: 24,
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
  typeCardsColumn: {
    flexDirection: 'column',
    gap: 12,
  },
  typeCard: {
    width: '100%',
    backgroundColor: '#27272a',
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    position: 'relative',
    overflow: 'hidden',
  },
  typeCardActive: {
    borderColor: PRIMARY_PURPLE,
    backgroundColor: PRIMARY_PURPLE_ALPHA_15,
    shadowColor: PRIMARY_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  typeNumberContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY_PURPLE_ALPHA_10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: PRIMARY_PURPLE_ALPHA_20,
  },
  typeNumberContainerActive: {
    backgroundColor: PRIMARY_PURPLE_ALPHA_25,
    borderColor: PRIMARY_PURPLE,
    shadowColor: PRIMARY_PURPLE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  typeNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: PRIMARY_PURPLE,
  },
  typeNumberActive: {
    color: '#FFFFFF',
  },
  typeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  typeTitleActive: {
    color: '#F5F7FB',
  },
  typeDescription: {
    fontSize: 11,
    color: '#B9C0CC',
    textAlign: 'center',
    lineHeight: 14,
  },
  typeDescriptionActive: {
    color: '#E5E7EB',
  },
  modesGrid: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  modeCard: {
    flex: 1,
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 95,
  },
  modeCardActive: {
    borderColor: PRIMARY_PURPLE,
    backgroundColor: PRIMARY_PURPLE_ALPHA_15,
    shadowColor: PRIMARY_PURPLE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B9C0CC',
    marginTop: 6,
    marginBottom: 2,
  },
  modeTitleActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modeDescription: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 12,
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
    borderColor: PRIMARY_PURPLE,
    backgroundColor: PRIMARY_PURPLE_ALPHA_12,
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
    backgroundColor: PRIMARY_PURPLE,
    borderColor: PRIMARY_PURPLE,
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
    borderColor: PRIMARY_PURPLE,
    backgroundColor: PRIMARY_PURPLE_ALPHA_12,
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717a',
  },
  timeButtonTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  dateTimeInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  dateTimeInputText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  descriptionInput: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3f3f46',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  titleInput: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  addDescriptionButton: {
    backgroundColor: PRIMARY_PURPLE_ALPHA_10,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 8,
  },
  addDescriptionButtonText: {
    color: PRIMARY_PURPLE,
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  removeDescriptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_PURPLE,
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

