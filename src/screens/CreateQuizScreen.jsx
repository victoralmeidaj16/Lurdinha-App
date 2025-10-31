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
} from 'react-native';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save,
  Eye,
  Users,
  Clock
} from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';

export default function CreateQuizScreen({ navigation, route }) {
  const { groupId } = route.params || {};
  const { createGroupQuiz, loading } = useGroups();
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [timeLimit, setTimeLimit] = useState('24');
  const [isPublic, setIsPublic] = useState(true);

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSave = async () => {
    if (!quizTitle.trim()) {
      Alert.alert('Erro', 'Digite um título para o quiz');
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      Alert.alert('Erro', 'Adicione pelo menos 2 opções');
      return;
    }

    if (groupId) {
      // Criar quiz no grupo
      try {
        await createGroupQuiz(groupId, {
          title: quizTitle.trim(),
          description: quizDescription.trim(),
          options: validOptions,
          timeLimit: timeLimit
        });
        Alert.alert(
          'Sucesso',
          'Quiz criado com sucesso!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } catch (error) {
        Alert.alert('Erro', error.message);
      }
    } else {
      // Criar quiz sem grupo (funcionalidade futura)
      Alert.alert('Sucesso', 'Quiz criado com sucesso!');
    }
  };

  const handleBack = () => {
    navigation.goBack();
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
              onPress={handleBack}
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
              <Text style={styles.headerTitle}>Criar Quiz</Text>
            </View>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Save size={24} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Quiz Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título do Quiz</Text>
            <TextInput
              style={styles.titleInput}
              value={quizTitle}
              onChangeText={setQuizTitle}
              placeholder="Ex: O que o Zé vai fazer na festa?"
              placeholderTextColor="#71717a"
              maxLength={100}
            />
          </View>

          {/* Quiz Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição (opcional)</Text>
            <TextInput
              style={styles.descriptionInput}
              value={quizDescription}
              onChangeText={setQuizDescription}
              placeholder="Adicione uma descrição para o seu quiz..."
              placeholderTextColor="#71717a"
              multiline
              numberOfLines={3}
              maxLength={300}
            />
          </View>

          {/* Options */}
          <View style={styles.inputGroup}>
            <View style={styles.optionsHeader}>
              <Text style={styles.label}>Opções de Resposta</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={addOption}
                activeOpacity={0.8}
                disabled={options.length >= 6}
              >
                <Plus size={20} color="#8b5cf6" />
                <Text style={styles.addButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
            
            {options.map((option, index) => (
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
                {options.length > 2 && (
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeOption(index)}
                    activeOpacity={0.8}
                  >
                    <Trash2 size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Settings */}
          <View style={styles.settingsContainer}>
            <Text style={styles.sectionTitle}>Configurações</Text>
            
            {/* Time Limit */}
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Clock size={20} color="#8b5cf6" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Tempo limite</Text>
                <Text style={styles.settingDescription}>Quanto tempo o quiz ficará ativo</Text>
              </View>
              <View style={styles.timeSelector}>
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => setTimeLimit('1')}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.timeButtonText,
                    timeLimit === '1' && styles.timeButtonTextActive
                  ]}>1h</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => setTimeLimit('24')}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.timeButtonText,
                    timeLimit === '24' && styles.timeButtonTextActive
                  ]}>24h</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => setTimeLimit('168')}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.timeButtonText,
                    timeLimit === '168' && styles.timeButtonTextActive
                  ]}>7d</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Visibility */}
            <View style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Users size={20} color="#8b5cf6" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Visibilidade</Text>
                <Text style={styles.settingDescription}>Quem pode ver e participar do quiz</Text>
              </View>
              <View style={styles.visibilitySelector}>
                <TouchableOpacity 
                  style={styles.visibilityButton}
                  onPress={() => setIsPublic(true)}
                  activeOpacity={0.8}
                >
                  <Eye size={16} color={isPublic ? "#ffffff" : "#71717a"} />
                  <Text style={[
                    styles.visibilityButtonText,
                    isPublic && styles.visibilityButtonTextActive
                  ]}>Público</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.visibilityButton}
                  onPress={() => setIsPublic(false)}
                  activeOpacity={0.8}
                >
                  <Users size={16} color={!isPublic ? "#ffffff" : "#71717a"} />
                  <Text style={[
                    styles.visibilityButtonText,
                    !isPublic && styles.visibilityButtonTextActive
                  ]}>Privado</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Preview */}
        <View style={styles.previewContainer}>
          <Text style={styles.sectionTitle}>Prévia</Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>
              {quizTitle || 'Título do quiz aparecerá aqui'}
            </Text>
            {quizDescription ? (
              <Text style={styles.previewDescription}>{quizDescription}</Text>
            ) : null}
            <View style={styles.previewOptions}>
              {options.filter(opt => opt.trim()).map((option, index) => (
                <View key={index} style={styles.previewOption}>
                  <View style={styles.previewOptionRadio} />
                  <Text style={styles.previewOptionText}>
                    {option || `Opção ${index + 1}`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
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
    color: '#ffffff',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    color: '#ffffff',
  },
  titleInput: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  descriptionInput: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3f3f46',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  addButtonText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '500',
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
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
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
  settingsContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#a1a1aa',
  },
  timeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  timeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#3f3f46',
    borderWidth: 1,
    borderColor: '#52525b',
  },
  timeButtonText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '500',
  },
  timeButtonTextActive: {
    color: '#ffffff',
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  visibilitySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#3f3f46',
    borderWidth: 1,
    borderColor: '#52525b',
  },
  visibilityButtonText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '500',
  },
  visibilityButtonTextActive: {
    color: '#ffffff',
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  previewContainer: {
    marginTop: 24,
    gap: 12,
  },
  previewCard: {
    backgroundColor: '#27272a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 16,
  },
  previewOptions: {
    gap: 12,
  },
  previewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewOptionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#71717a',
  },
  previewOptionText: {
    fontSize: 16,
    color: '#e4e4e7',
  },
});
