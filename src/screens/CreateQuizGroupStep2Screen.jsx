import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Share,
} from 'react-native';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save,
  ChevronRight,
  Check,
  Share2,
  Copy,
} from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';

export default function CreateQuizGroupStep2Screen({ navigation, route }) {
  const { groupId, quizType, mode, timeLimit, allowEveryoneToMarkCorrect, challengeConfig } = route.params;
  const { createQuizGroup, addQuizzesToGroup, loading } = useGroups();

  const [quizGroupTitle, setQuizGroupTitle] = useState('');
  const [quizzes, setQuizzes] = useState([
    { question: '', options: ['', ''], correctAnswer: null }
  ]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [showShareLink, setShowShareLink] = useState(false);
  const [shareLink, setShareLink] = useState('');

  const updateCurrentQuiz = (field, value) => {
    const updated = [...quizzes];
    updated[currentQuizIndex] = { ...updated[currentQuizIndex], [field]: value };
    setQuizzes(updated);
  };

  const updateOption = (index, value) => {
    const updated = [...quizzes];
    const options = [...updated[currentQuizIndex].options];
    options[index] = value;
    updated[currentQuizIndex].options = options;
    setQuizzes(updated);
  };

  const addOption = () => {
    const updated = [...quizzes];
    if (updated[currentQuizIndex].options.length < 6) {
      updated[currentQuizIndex].options.push('');
      setQuizzes(updated);
    }
  };

  const removeOption = (index) => {
    const updated = [...quizzes];
    if (updated[currentQuizIndex].options.length > 2) {
      updated[currentQuizIndex].options = updated[currentQuizIndex].options.filter((_, i) => i !== index);
      setQuizzes(updated);
    }
  };

  const handleYesNo = () => {
    const updated = [...quizzes];
    updated[currentQuizIndex].options = ['Sim', 'Não'];
    setQuizzes(updated);
  };

  const handleAddQuiz = () => {
    const current = quizzes[currentQuizIndex];
    if (!current.question.trim()) {
      Alert.alert('Erro', 'Digite uma pergunta para esta enquete');
      return;
    }
    const validOptions = current.options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      Alert.alert('Erro', 'Adicione pelo menos 2 opções');
      return;
    }

    if (quizType === 2 && current.correctAnswer === null) {
      Alert.alert('Erro', 'Selecione a resposta correta (Tipo 2)');
      return;
    }

    // Atualizar as opções do quiz atual com apenas as válidas
    const updated = [...quizzes];
    updated[currentQuizIndex] = {
      ...current,
      options: validOptions
    };
    
    setQuizzes([...updated, { question: '', options: ['', ''], correctAnswer: null }]);
    setCurrentQuizIndex(quizzes.length);
  };

  const handleFinish = async () => {
    // Validar todas as enquetes
    for (let i = 0; i < quizzes.length; i++) {
      const quiz = quizzes[i];
      if (!quiz.question.trim()) {
        Alert.alert('Erro', `Digite uma pergunta para a enquete ${i + 1}`);
        setCurrentQuizIndex(i);
        return;
      }
      const validOptions = quiz.options.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        Alert.alert('Erro', `Adicione pelo menos 2 opções na enquete ${i + 1}`);
        setCurrentQuizIndex(i);
        return;
      }
      if (quizType === 2 && quiz.correctAnswer === null) {
        Alert.alert('Erro', `Selecione a resposta correta na enquete ${i + 1}`);
        setCurrentQuizIndex(i);
        return;
      }
    }

    if (quizzes.length < 1) {
      Alert.alert('Erro', 'Adicione pelo menos uma enquete');
      return;
    }

    try {
      // Preparar título
      const finalTitle = quizGroupTitle.trim() || 
        (quizzes.length > 0 && quizzes[0].question 
          ? quizzes[0].question.substring(0, 30) + (quizzes[0].question.length > 30 ? '...' : '')
          : `Grupo de Quiz ${new Date().toLocaleDateString()}`);
      
      // Criar grupo de quiz
      const quizGroup = await createQuizGroup(groupId, {
        title: finalTitle,
        type: quizType,
        mode: mode,
        timeLimit: timeLimit,
        allowEveryoneToMarkCorrect: allowEveryoneToMarkCorrect,
        challengeConfig: challengeConfig
      });

      // Preparar quizzes para adicionar
      const quizzesToAdd = quizzes.map(q => ({
        question: q.question.trim(),
        options: q.options.filter(opt => opt.trim()),
        type: quizType,
        correctAnswer: quizType === 2 ? q.correctAnswer : null
      }));

      // Adicionar quizzes
      await addQuizzesToGroup(quizGroup.id, quizzesToAdd);

      // Gerar link de compartilhamento
      const link = `lurdinha://quizgroup/${quizGroup.id}`;
      setShareLink(link);
      setShowShareLink(true);
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleCopyLink = async () => {
    try {
      await Share.share({
        message: shareLink,
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível copiar o link');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Participe do meu grupo de quiz no Lurdinha: ${shareLink}`,
        title: 'Grupo de Quiz'
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar');
    }
  };

  const currentQuiz = quizzes[currentQuizIndex];
  const validOptions = currentQuiz.options.filter(opt => opt.trim());

  if (showShareLink) {
    return (
      <View style={styles.container}>
        <View style={styles.shareCard}>
          <Text style={styles.shareTitle}>Grupo de Quiz Criado!</Text>
          <Text style={styles.shareDescription}>
            Compartilhe o link com seus amigos para participarem
          </Text>
          
          <View style={styles.linkContainer}>
            <Text style={styles.linkText} numberOfLines={2}>{shareLink}</Text>
          </View>

          <View style={styles.shareButtons}>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyLink}
              activeOpacity={0.8}
            >
              <Copy size={20} color="#8A4F9E" />
              <Text style={styles.copyButtonText}>Copiar Link</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Share2 size={20} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Compartilhar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => navigation.navigate('GroupDetail', { groupId })}
            activeOpacity={0.8}
          >
            <Text style={styles.finishButtonText}>Finalizar</Text>
          </TouchableOpacity>
        </View>
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
              <Text style={styles.headerTitle}>Criar Enquetes</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
          <Text style={styles.headerSubtitle}>
            Passo 2 de 2: {currentQuizIndex + 1} de {quizzes.length}
          </Text>
        </View>

        {/* Lista de enquetes criadas */}
        {quizzes.length > 1 && (
          <View style={styles.quizzesList}>
            <Text style={styles.quizzesListTitle}>Enquetes Criadas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quizzes.map((quiz, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.quizPreview,
                    index === currentQuizIndex && styles.quizPreviewActive
                  ]}
                  onPress={() => setCurrentQuizIndex(index)}
                  activeOpacity={0.8}
                >
                  {index === currentQuizIndex && (
                    <View style={styles.currentIndicator} />
                  )}
                  <Text style={styles.quizPreviewNumber}>{index + 1}</Text>
                  {quiz.question.trim() && (
                    <Check size={12} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Formulário */}
        <View style={styles.form}>
          {/* Título do Grupo de Quiz */}
          {currentQuizIndex === 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Título do Grupo de Quiz (opcional)</Text>
              <TextInput
                style={styles.titleInput}
                value={quizGroupTitle}
                onChangeText={setQuizGroupTitle}
                placeholder="Ex: Enquetes do Churrasco"
                placeholderTextColor="#71717a"
                maxLength={50}
              />
            </View>
          )}
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pergunta {currentQuizIndex + 1}</Text>
            <TextInput
              style={styles.questionInput}
              value={currentQuiz.question}
              onChangeText={(value) => updateCurrentQuiz('question', value)}
              placeholder="Ex: O que o Zé vai fazer na festa?"
              placeholderTextColor="#71717a"
              multiline
              maxLength={200}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.optionsHeader}>
              <Text style={styles.label}>Opções de Resposta</Text>
              <TouchableOpacity
                style={styles.yesNoButton}
                onPress={handleYesNo}
                activeOpacity={0.8}
              >
                <Text style={styles.yesNoButtonText}>Sim/Não</Text>
              </TouchableOpacity>
            </View>

            {currentQuiz.options.map((option, index) => (
              <View key={index} style={styles.optionRow}>
                <View style={styles.optionNumber}>
                  <Text style={styles.optionNumberText}>{index + 1}</Text>
                </View>
                <TextInput
                  style={styles.optionInput}
                  value={option}
                  onChangeText={(value) => updateOption(index, value)}
                  placeholder={`Opção ${index + 1}`}
                  placeholderTextColor="#71717a"
                  maxLength={100}
                />
                {currentQuiz.options.length > 2 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeOption(index)}
                    activeOpacity={0.8}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {currentQuiz.options.length < 6 && (
              <TouchableOpacity
                style={styles.addOptionButton}
                onPress={addOption}
                activeOpacity={0.8}
              >
                <Plus size={20} color="#8b5cf6" />
                <Text style={styles.addOptionText}>Adicionar Opção</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Seleção de resposta correta (Tipo 2) */}
          {quizType === 2 && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Resposta Correta</Text>
              <View style={styles.correctAnswerGrid}>
                {validOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.correctAnswerOption,
                      currentQuiz.correctAnswer === index && styles.correctAnswerOptionActive
                    ]}
                    onPress={() => updateCurrentQuiz('correctAnswer', index)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.correctAnswerText,
                      currentQuiz.correctAnswer === index && styles.correctAnswerTextActive
                    ]}>
                      {option || `Opção ${index + 1}`}
                    </Text>
                    {currentQuiz.correctAnswer === index && (
                      <Check size={20} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Botões de ação */}
        <View style={styles.actionsContainer}>
          {quizzes.length > 1 && (
            <TouchableOpacity
              style={styles.nextQuizButton}
              onPress={handleAddQuiz}
              activeOpacity={0.8}
            >
              <Text style={styles.nextQuizButtonText}>Próxima Enquete</Text>
              <ChevronRight size={20} color="#8b5cf6" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinish}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.finishButtonText}>Finalizar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  quizzesList: {
    marginBottom: 24,
  },
  quizzesListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  quizPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    gap: 4,
  },
  quizPreviewActive: {
    borderColor: '#8A4F9E',
    backgroundColor: 'rgba(138, 79, 158, 0.1)',
  },
  currentIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8A4F9E',
  },
  quizPreviewNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  questionInput: {
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
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yesNoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(138, 79, 158, 0.1)',
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  yesNoButtonText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  addOptionText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '600',
  },
  correctAnswerGrid: {
    gap: 8,
  },
  correctAnswerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  correctAnswerOptionActive: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  correctAnswerText: {
    flex: 1,
    fontSize: 16,
    color: '#B0B0B0',
  },
  correctAnswerTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionsContainer: {
    marginTop: 32,
    gap: 12,
  },
  nextQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  nextQuizButtonText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '600',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8A4F9E',
    borderRadius: 12,
    padding: 16,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  shareCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  shareTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  shareDescription: {
    fontSize: 16,
    color: '#B0B0B0',
    marginBottom: 32,
    textAlign: 'center',
  },
  linkContainer: {
    width: '100%',
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  linkText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#8A4F9E',
  },
  copyButtonText: {
    color: '#8A4F9E',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8A4F9E',
    borderRadius: 12,
    padding: 16,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

