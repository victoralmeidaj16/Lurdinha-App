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
  RefreshControl,
} from 'react-native';
import { 
  Plus, 
  Users, 
  Crown, 
  Trophy,
  Star,
  Clock,
  ChevronRight,
  Settings,
  Search
} from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';
import { useUserData } from '../hooks/useUserData';
import Header from '../components/Header';

export default function GroupsScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getUserGroups } = useGroups();
  const { userData } = useUserData();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const userGroups = await getUserGroups();
      setGroups(userGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
      Alert.alert('Erro', 'Não foi possível carregar os grupos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup', {
      onGroupCreated: () => {
        loadGroups();
      }
    });
  };

  const handleJoinGroup = () => {
    navigation.navigate('SearchGroups');
  };

  const handleGroupPress = (group) => {
    navigation.navigate('GroupDetail', { groupId: group.id });
  };

  const calculateUserStats = () => {
    const totalPoints = userData?.stats?.totalPoints || 0;
    const acertos = userData?.stats?.acertos || 0;
    const enquetesVotadas = userData?.stats?.enquetesVotadas || 0;
    const accuracy = enquetesVotadas > 0 ? Math.round((acertos / enquetesVotadas) * 100) : 0;
    const titles = 0; // Pode ser calculado depois

    return { totalPoints, accuracy, titles };
  };

  const stats = calculateUserStats();

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
          title="Meus Grupos"
          subtitle="Preveja comportamentos e ganhe pontos com seus grupos"
          rightAction={() => navigation.navigate('Settings')}
          rightActionIcon={Settings}
        >
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Header>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Trophy size={20} color="#FF6B35" />
            </View>
            <Text style={styles.statNumber}>{stats.totalPoints.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Pontos Totais</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Star size={20} color="#FF6B35" />
            </View>
            <Text style={styles.statNumber}>{stats.accuracy}%</Text>
            <Text style={styles.statLabel}>Taxa de Acerto</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Crown size={20} color="#FF6B35" />
            </View>
            <Text style={styles.statNumber}>{stats.titles}</Text>
            <Text style={styles.statLabel}>Títulos</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleCreateGroup}
            activeOpacity={0.8}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Criar Grupo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleJoinGroup}
            activeOpacity={0.8}
          >
            <Users size={20} color="#8A4F9E" />
            <Text style={styles.secondaryButtonText}>Entrar em Grupo</Text>
          </TouchableOpacity>
        </View>

        {/* Groups List */}
        <View style={styles.groupsContainer}>
          <Text style={styles.sectionTitle}>Seus Grupos</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
          ) : groups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={64} color="#71717a" />
              <Text style={styles.emptyText}>Você ainda não está em nenhum grupo</Text>
              <Text style={styles.emptySubtext}>
                Crie um grupo ou entre em um existente para começar!
              </Text>
            </View>
          ) : (
            groups.map((group) => {
              const memberCount = group.stats?.totalMembers || group.members?.length || 0;
              const activeQuizzes = group.stats?.activeQuizzes || 0;
              
              return (
                <TouchableOpacity
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => handleGroupPress(group)}
                  activeOpacity={0.8}
                >
                  <View style={styles.groupHeader}>
                    <View style={styles.groupInfo}>
                      <View style={[styles.groupBadge, { backgroundColor: group.color || '#8b5cf6' }]}>
                        <Text style={styles.groupBadgeText}>{group.badge || '👥'}</Text>
                      </View>
                      <View style={styles.groupDetails}>
                        <Text style={styles.groupName}>{group.name}</Text>
                        {group.description ? (
                          <Text style={styles.groupDescription} numberOfLines={1}>
                            {group.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <ChevronRight size={20} color="#B0B0B0" />
                  </View>

                  <View style={styles.groupStats}>
                    <View style={styles.groupStat}>
                      <Users size={16} color="#B0B0B0" />
                      <Text style={styles.groupStatText}>{memberCount} membros</Text>
                    </View>
                    <View style={styles.groupStat}>
                      <Clock size={16} color="#B0B0B0" />
                      <Text style={styles.groupStatText}>{activeQuizzes} quiz ativos</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
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
    paddingTop: 0,
    paddingBottom: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  logo: {
    width: 48,
    height: 48,
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
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#B0B0B0',
    marginTop: 8,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  secondaryButtonText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '600',
  },
  groupsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  groupCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  },
  groupStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  groupStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupStatText: {
    fontSize: 14,
    color: '#B0B0B0',
  },
});
