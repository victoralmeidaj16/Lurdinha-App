import React, { useState, useEffect, useCallback } from 'react';
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
  Search,
  Users,
  Plus,
  UserPlus,
  Check
} from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';
import AvatarCircle from '../components/AvatarCircle';

export default function SearchGroupsScreen({ navigation, route }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [groups, setGroups] = useState([]);
  const [requestedGroups, setRequestedGroups] = useState(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('groups'); // 'groups' | 'users'
  const [users, setUsers] = useState([]);
  const { searchPublicGroups, sendJoinRequest, searchUsers, loading } = useGroups();

  const handleSearch = useCallback(async (term) => {
    if (!term || term.trim().length === 0) {
      setGroups([]);
      setUsers([]);
      return;
    }

    try {
      setIsSearching(true);
      if (activeTab === 'groups') {
        const results = await searchPublicGroups(term.trim());
        setGroups(results);
      } else {
        const results = await searchUsers(term.trim());
        setUsers(results);
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
      setGroups([]);
      setUsers([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchPublicGroups, searchUsers, activeTab]);

  // Busca em tempo real com debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        handleSearch(searchTerm);
      } else if (searchTerm.length === 0) {
        // Se o campo estiver vazio, limpar resultados
        setGroups([]);
        setUsers([]);
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm, activeTab]); // Removido handleSearch para evitar re-renders infinitos

  const handleSearchTermChange = (text) => {
    setSearchTerm(text);
  };

  const handleSendRequest = async (groupId) => {
    try {
      await sendJoinRequest(groupId);
      setRequestedGroups(prev => new Set(prev).add(groupId));
      Alert.alert('Sucesso', 'Solicitação enviada com sucesso!');
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
              <Text style={styles.headerTitle}>Buscar Grupos</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'groups' && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab('groups');
              setSearchTerm('');
              setGroups([]);
            }}
          >
            <Users size={20} color={activeTab === 'groups' ? '#ffffff' : '#71717a'} />
            <Text style={[styles.tabButtonText, activeTab === 'groups' && styles.tabButtonTextActive]}>
              Grupos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'users' && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab('users');
              setSearchTerm('');
              setUsers([]);
            }}
          >
            <Search size={20} color={activeTab === 'users' ? '#ffffff' : '#71717a'} />
            <Text style={[styles.tabButtonText, activeTab === 'users' && styles.tabButtonTextActive]}>
              Usuários
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#71717a" />
            <TextInput
              style={styles.searchInput}
              value={searchTerm}
              onChangeText={handleSearchTermChange}
              placeholder={activeTab === 'groups' ? "Digite o nome do grupo..." : "Digite o username..."}
              placeholderTextColor="#71717a"
              autoFocus={true}
              returnKeyType="search"
              onSubmitEditing={() => handleSearch(searchTerm)}
            />
            {isSearching && (
              <ActivityIndicator size="small" color="#8b5cf6" />
            )}
          </View>
          {searchTerm.length > 0 && (
            <Text style={styles.searchHint}>
              {groups.length > 0
                ? `${groups.length} grupo(s) encontrado(s)`
                : isSearching
                  ? 'Buscando...'
                  : activeTab === 'groups' ? 'Nenhum grupo encontrado' : 'Nenhum usuário encontrado'
              }
            </Text>
          )}
        </View>

        {/* Groups List */}
        {searchTerm.length === 0 && (
          <View style={styles.emptyContainer}>
            <Search size={64} color="#71717a" />
            <Text style={styles.emptyText}>
              {activeTab === 'groups' ? 'Buscar Grupos' : 'Buscar Usuários'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'groups'
                ? 'Digite o nome do grupo para começar a buscar'
                : 'Digite o username para encontrar pessoas'}
            </Text>
          </View>
        )}

        {isSearching && searchTerm.length > 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
          </View>
        )}

        {!isSearching && searchTerm.length > 0 && groups.length === 0 && (
          <View style={styles.emptyContainer}>
            <Users size={64} color="#71717a" />
            <Text style={styles.emptyText}>
              {activeTab === 'groups' ? 'Nenhum grupo encontrado' : 'Nenhum usuário encontrado'}
            </Text>
            <Text style={styles.emptySubtext}>
              Tente buscar com outro termo
            </Text>
          </View>
        )}

        {!isSearching && activeTab === 'groups' && groups.length > 0 && (
          <View style={styles.groupsContainer}>
            {groups.map((group) => {
              const hasRequested = requestedGroups.has(group.id);

              return (
                <View key={group.id} style={styles.groupCard}>
                  <View style={styles.groupHeader}>
                    <View style={[styles.groupBadge, { backgroundColor: group.color || '#8b5cf6' }]}>
                      <Text style={styles.groupBadgeText}>
                        {group.badge || '👥'}
                      </Text>
                    </View>
                    <View style={styles.groupDetails}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      {group.description ? (
                        <Text style={styles.groupDescription} numberOfLines={2}>
                          {group.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.groupStats}>
                    <View style={styles.statItem}>
                      <Users size={16} color="#B0B0B0" />
                      <Text style={styles.statText}>
                        {group.stats?.totalMembers || group.members?.length || 0} membros
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statText}>
                        {group.stats?.activeQuizzes || 0} quiz ativos
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.joinButton,
                      hasRequested && styles.joinButtonRequested
                    ]}
                    onPress={() => handleSendRequest(group.id)}
                    disabled={hasRequested || loading}
                    activeOpacity={0.8}
                  >
                    {hasRequested ? (
                      <>
                        <Check size={20} color="#4CAF50" />
                        <Text style={styles.joinButtonTextRequested}>
                          Solicitação Enviada
                        </Text>
                      </>
                    ) : (
                      <>
                        <UserPlus size={20} color="#FFFFFF" />
                        <Text style={styles.joinButtonText}>
                          Enviar Solicitação
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Users List */}
        {!isSearching && activeTab === 'users' && users.length > 0 && (
          <View style={styles.groupsContainer}>
            {users.map((user) => (
              <TouchableOpacity
                key={user.uid}
                style={styles.userCard}
                onPress={() => navigation.navigate('UserProfile', { userId: user.uid })}
                activeOpacity={0.8}
              >
                <AvatarCircle
                  name={user.displayName || 'Usuário'}
                  size={50}
                  photoURL={user.photoURL}
                />
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{user.displayName || 'Usuário'}</Text>
                  <Text style={styles.userEmail}>
                    Membro desde {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'Data desconhecida'}
                  </Text>
                </View>
                <ArrowLeft size={20} color="#71717a" style={{ transform: [{ rotate: '180deg' }] }} />
              </TouchableOpacity>
            ))}
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
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3f3f46',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  searchHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#71717a',
    marginLeft: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#B0B0B0',
    marginTop: 8,
    textAlign: 'center',
  },
  groupsContainer: {
    gap: 16,
  },
  groupCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  groupBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBadgeText: {
    fontSize: 20,
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#B0B0B0',
    lineHeight: 20,
  },
  groupStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  joinButtonRequested: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  joinButtonTextRequested: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: '#3f3f46',
  },
  tabButtonText: {
    color: '#71717a',
    fontSize: 14,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
    color: '#B0B0B0',
  },
});

