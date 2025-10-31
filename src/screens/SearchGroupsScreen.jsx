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
  Search,
  Users,
  Plus,
  UserPlus,
  Check
} from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';

export default function SearchGroupsScreen({ navigation, route }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [groups, setGroups] = useState([]);
  const [requestedGroups, setRequestedGroups] = useState(new Set());
  const { searchPublicGroups, sendJoinRequest, loading } = useGroups();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const results = await searchPublicGroups(searchTerm);
      setGroups(results);
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleSearch = () => {
    loadGroups();
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

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#71717a" />
            <TextInput
              style={styles.searchInput}
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Buscar grupos..."
              placeholderTextColor="#71717a"
              onSubmitEditing={handleSearch}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={handleSearch}>
                <Text style={styles.searchButtonText}>Buscar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Groups List */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
          </View>
        )}

        {!loading && groups.length === 0 && (
          <View style={styles.emptyContainer}>
            <Users size={64} color="#71717a" />
            <Text style={styles.emptyText}>Nenhum grupo encontrado</Text>
            <Text style={styles.emptySubtext}>
              Tente buscar com outro termo
            </Text>
          </View>
        )}

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
  searchButtonText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '600',
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
});

