import React, { useState, useEffect } from 'react';
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
  UserPlus,
  Mail,
  Search,
  X,
} from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../contexts/AuthContext';
import AvatarCircle from '../components/AvatarCircle';

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
  const [showAddUsers, setShowAddUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [inviteEmails, setInviteEmails] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const { createGroup, searchUsers, sendInvite, loading } = useGroups();
  const { currentUser } = useAuth();

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchUsers(searchQuery.trim());
      // Filtrar usuário atual e usuários já selecionados
      const filtered = results.filter(
        user => user.uid !== currentUser?.uid && 
        !selectedUsers.some(su => su.uid === user.uid)
      );
      setSearchResults(filtered);
      if (filtered.length === 0 && searchQuery.trim().length > 2) {
        // Mostrar mensagem se não encontrou resultados
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
      setSearchResults([]);
    }
  };

  // Debounce para busca
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        handleSearchUsers();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchResults(searchResults.filter(u => u.uid !== user.uid));
    setSearchQuery('');
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.uid !== userId));
  };

  const handleAddEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (email && email.includes('@') && !inviteEmails.includes(email)) {
      setInviteEmails([...inviteEmails, email]);
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (email) => {
    setInviteEmails(inviteEmails.filter(e => e !== email));
  };

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

      // Enviar convites para usuários selecionados
      if (selectedUsers.length > 0) {
        await Promise.all(
          selectedUsers.map(user => 
            sendInvite(newGroup.id, user.uid, 'username')
          )
        );
      }

      // Enviar convites por email
      if (inviteEmails.length > 0) {
        await Promise.all(
          inviteEmails.map(email => 
            sendInvite(newGroup.id, email, 'email')
          )
        );
      }

      Alert.alert(
        'Sucesso',
        `Grupo criado com sucesso!${(selectedUsers.length > 0 || inviteEmails.length > 0) ? ' Convites enviados.' : ''}`,
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

        {/* Add Users Section */}
        <View style={styles.addUsersContainer}>
          <TouchableOpacity
            style={styles.addUsersToggle}
            onPress={() => setShowAddUsers(!showAddUsers)}
            activeOpacity={0.8}
          >
            <View style={styles.addUsersToggleContent}>
              <View style={styles.addUsersToggleLeft}>
                <View style={styles.addUsersIcon}>
                  <UserPlus size={20} color="#8b5cf6" />
                </View>
                <View>
                  <Text style={styles.addUsersTitle}>Adicionar Usuários</Text>
                  <Text style={styles.addUsersSubtitle}>
                    {selectedUsers.length + inviteEmails.length > 0 
                      ? `${selectedUsers.length + inviteEmails.length} convite(s) pendente(s)`
                      : 'Enviar convites por username ou e-mail'}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {showAddUsers && (
            <View style={styles.addUsersContent}>
              {/* Search by Username */}
              <View style={styles.searchSection}>
                <Text style={styles.searchLabel}>Buscar por username/apelido</Text>
                <View style={styles.searchInputContainer}>
                  <Search size={20} color="#71717a" />
                  <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Digite o username ou apelido"
                    placeholderTextColor="#71717a"
                    onSubmitEditing={handleSearchUsers}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}>
                      <X size={20} color="#71717a" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <View style={styles.searchResults}>
                    {searchResults.map(user => (
                      <TouchableOpacity
                        key={user.uid}
                        style={styles.searchResultItem}
                        onPress={() => handleAddUser(user)}
                        activeOpacity={0.8}
                      >
                        <AvatarCircle
                          name={user.username || user.displayName || user.email?.substring(0, 2)}
                          size={40}
                        />
                        <View style={styles.searchResultInfo}>
                          <Text style={styles.searchResultName}>
                            {user.username || user.displayName || 'Usuário'}
                          </Text>
                          {user.email && (
                            <Text style={styles.searchResultEmail}>{user.email}</Text>
                          )}
                        </View>
                        <UserPlus size={20} color="#8b5cf6" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Invite by Email */}
              <View style={styles.emailSection}>
                <Text style={styles.searchLabel}>Ou convidar por e-mail</Text>
                <View style={styles.emailInputContainer}>
                  <Mail size={20} color="#71717a" />
                  <TextInput
                    style={styles.emailInput}
                    value={emailInput}
                    onChangeText={setEmailInput}
                    placeholder="Digite o e-mail"
                    placeholderTextColor="#71717a"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onSubmitEditing={handleAddEmail}
                  />
                  <TouchableOpacity
                    style={styles.addEmailButton}
                    onPress={handleAddEmail}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addEmailButtonText}>Adicionar</Text>
                  </TouchableOpacity>
                </View>

                {/* Email List */}
                {inviteEmails.length > 0 && (
                  <View style={styles.emailList}>
                    {inviteEmails.map((email, index) => (
                      <View key={index} style={styles.emailTag}>
                        <Text style={styles.emailTagText}>{email}</Text>
                        <TouchableOpacity onPress={() => handleRemoveEmail(email)}>
                          <X size={16} color="#71717a" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <View style={styles.selectedUsersSection}>
                  <Text style={styles.selectedUsersTitle}>Usuários selecionados</Text>
                  <View style={styles.selectedUsersList}>
                    {selectedUsers.map(user => (
                      <View key={user.uid} style={styles.selectedUserTag}>
                        <AvatarCircle
                          name={user.username || user.displayName || user.email?.substring(0, 2)}
                          size={32}
                        />
                        <Text style={styles.selectedUserText}>
                          {user.username || user.displayName || user.email}
                        </Text>
                        <TouchableOpacity onPress={() => handleRemoveUser(user.uid)}>
                          <X size={16} color="#71717a" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed CTA Button */}
      <View style={styles.fixedCTA}>
        <TouchableOpacity
          style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaButtonText}>Criar</Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 120,
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
  fixedCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121212',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  ctaButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addUsersContainer: {
    marginTop: 24,
    backgroundColor: '#27272a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  addUsersToggle: {
    padding: 16,
  },
  addUsersToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addUsersToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  addUsersIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addUsersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  addUsersSubtitle: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  addUsersContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 20,
  },
  searchSection: {
    gap: 12,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
  },
  searchResults: {
    gap: 8,
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  searchResultEmail: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  emailSection: {
    gap: 12,
  },
  emailInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  emailInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
  },
  addEmailButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addEmailButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emailList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emailTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  emailTagText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  selectedUsersSection: {
    gap: 12,
  },
  selectedUsersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedUsersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedUserTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  selectedUserText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

