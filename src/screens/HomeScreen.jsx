import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert,
  Image
} from 'react-native';
import { Search, Trophy, ArrowRight, Plus, LogOut } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';

export default function HomeScreen() {
  const { logout } = useAuth();
  const { userData, loading, getTopUsers } = useUserData();
  const [searchQuery, setSearchQuery] = useState('');
  const [topUsers, setTopUsers] = useState([]);

  useEffect(() => {
    loadTopUsers();
  }, []);

  const loadTopUsers = async () => {
    try {
      const users = await getTopUsers();
      setTopUsers(users);
    } catch (error) {
      console.error('Error loading top users:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao fazer logout');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.headerText}>
              <Text style={styles.greeting}>Olá, {userData?.displayName || 'Usuário'}! 👋</Text>
              <Text style={styles.subtitle}>Vamos descobrir o que pensa o mundo</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar enquetes..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userData?.stats?.acertos || 0}</Text>
          <Text style={styles.statLabel}>Acertos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userData?.stats?.fireStreak || 0}</Text>
          <Text style={styles.statLabel}>Sequência</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userData?.stats?.enquetesVotadas || 0}</Text>
          <Text style={styles.statLabel}>Enquetes</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Plus size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Criar Enquete</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Trophy size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Ranking</Text>
        </TouchableOpacity>
      </View>

      {/* Top Users */}
      <View style={styles.topUsersContainer}>
        <Text style={styles.sectionTitle}>Top 3 Usuários</Text>
        {topUsers.map((user, index) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.userRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user.displayName}</Text>
                <Text style={styles.userStats}>{user.stats?.acertos || 0} acertos</Text>
              </View>
            </View>
            <ArrowRight size={20} color="#9ca3af" />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerContent: {
    flex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  logoutButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    color: '#ffffff',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  topUsersContainer: {
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userStats: {
    color: '#9ca3af',
    fontSize: 14,
  },
});
