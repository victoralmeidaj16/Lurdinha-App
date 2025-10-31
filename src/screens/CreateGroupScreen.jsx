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
  Save,
  Eye,
  Users,
  Palette,
} from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';

const COLORS = [
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#FF6B35', label: 'Laranja' },
  { value: '#4CAF50', label: 'Verde' },
  { value: '#2196F3', label: 'Azul' },
  { value: '#F44336', label: 'Vermelho' },
  { value: '#FFC107', label: 'Amarelo' },
];

const BADGES = ['👥', '🎯', '🏆', '⭐', '🔥', '💎', '🎨', '🚀', '🎪', '🎭'];

export default function CreateGroupScreen({ navigation, route }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedColor, setSelectedColor] = useState('#8b5cf6');
  const [selectedBadge, setSelectedBadge] = useState('👥');
  const { createGroup, loading } = useGroups();

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite um nome para o grupo');
      return;
    }

    try {
      const newGroup = await createGroup({
        name: name.trim(),
        description: description.trim(),
        isPublic,
        color: selectedColor,
        badge: selectedBadge,
      });

      Alert.alert(
        'Sucesso',
        'Grupo criado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
              if (route.params?.onGroupCreated) {
                route.params.onGroupCreated();
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
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
              <Text style={styles.headerTitle}>Criar Grupo</Text>
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
          {/* Group Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome do Grupo</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Família Souza"
              placeholderTextColor="#71717a"
              maxLength={50}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição (opcional)</Text>
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Adicione uma descrição para o grupo..."
              placeholderTextColor="#71717a"
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          {/* Badge Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ícone do Grupo</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.badgeContainer}
            >
              {BADGES.map((badge) => (
                <TouchableOpacity
                  key={badge}
                  style={[
                    styles.badgeOption,
                    selectedBadge === badge && styles.badgeOptionSelected,
                    { backgroundColor: selectedBadge === badge ? selectedColor : '#27272a' }
                  ]}
                  onPress={() => setSelectedBadge(badge)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.badgeText}>{badge}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Color Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cor do Grupo</Text>
            <View style={styles.colorContainer}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color.value}
                  style={[
                    styles.colorOption,
                    selectedColor === color.value && styles.colorOptionSelected,
                    { backgroundColor: color.value }
                  ]}
                  onPress={() => setSelectedColor(color.value)}
                  activeOpacity={0.8}
                >
                  {selectedColor === color.value && (
                    <View style={styles.colorCheck} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Visibility */}
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              {isPublic ? (
                <Eye size={20} color="#8b5cf6" />
              ) : (
                <Users size={20} color="#8b5cf6" />
              )}
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Visibilidade</Text>
              <Text style={styles.settingDescription}>
                {isPublic 
                  ? 'Qualquer pessoa pode encontrar e solicitar entrada' 
                  : 'Apenas membros podem ver o grupo'}
              </Text>
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

        {/* Preview */}
        <View style={styles.previewContainer}>
          <Text style={styles.sectionTitle}>Prévia</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={[
                styles.previewBadge, 
                { backgroundColor: selectedColor }
              ]}>
                <Text style={styles.previewBadgeText}>{selectedBadge}</Text>
              </View>
              <View style={styles.previewDetails}>
                <Text style={styles.previewName}>
                  {name || 'Nome do grupo'}
                </Text>
                {description ? (
                  <Text style={styles.previewDescription}>{description}</Text>
                ) : (
                  <Text style={styles.previewDescriptionPlaceholder}>
                    Descrição do grupo...
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.previewStats}>
              <Text style={styles.previewStatText}>1 membro</Text>
              <Text style={styles.previewStatText}>0 quiz ativos</Text>
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
  input: {
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
  badgeContainer: {
    marginTop: 8,
  },
  badgeOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  badgeOptionSelected: {
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 24,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderColor: '#FFFFFF',
  },
  colorCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  previewCard: {
    backgroundColor: '#27272a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  previewBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBadgeText: {
    fontSize: 20,
  },
  previewDetails: {
    flex: 1,
  },
  previewName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  previewDescriptionPlaceholder: {
    fontSize: 14,
    color: '#71717a',
    fontStyle: 'italic',
  },
  previewStats: {
    flexDirection: 'row',
    gap: 16,
  },
  previewStatText: {
    fontSize: 14,
    color: '#B0B0B0',
  },
});

