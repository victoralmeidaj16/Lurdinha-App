import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert
} from 'react-native';
import { ChevronDown, X, Flame, Star, Smile, Users, LogOut } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';

function StatCard({ icon, title, value, right, glow }) {
  const Icon = icon;
  return (
    <View style={[styles.statCard, glow && styles.statCardGlow]}>
      <View style={styles.statCardHeader}>
        <Icon size={20} color={glow ? '#fbbf24' : '#9ca3af'} />
        <Text style={[styles.statCardTitle, glow && styles.statCardTitleGlow]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.statCardValue, glow && styles.statCardValueGlow]}>
        {value}
      </Text>
      {right && (
        <View style={styles.statCardRight}>
          <Text style={styles.statCardRightText}>{right}</Text>
        </View>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const { logout } = useAuth();
  const { userData, loading } = useUserData();
  const [showStats, setShowStats] = useState(true);

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
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userData?.displayName?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userData?.displayName || 'Usuário'}</Text>
            <Text style={styles.userEmail}>{userData?.email}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Stats Toggle */}
      <TouchableOpacity 
        style={styles.statsToggle}
        onPress={() => setShowStats(!showStats)}
      >
        <Text style={styles.statsToggleText}>Suas Estatísticas</Text>
        <ChevronDown 
          size={20} 
          color="#9ca3af" 
          style={[styles.chevron, showStats && styles.chevronRotated]} 
        />
      </TouchableOpacity>

      {/* Stats Cards */}
      {showStats && (
        <View style={styles.statsContainer}>
          <StatCard
            icon={Flame}
            title="Sequência de Fogo"
            value={userData?.stats?.fireStreak || 0}
            right="dias"
            glow={userData?.stats?.fireStreak > 0}
          />
          <StatCard
            icon={Star}
            title="Acertos"
            value={userData?.stats?.acertos || 0}
            right="total"
            glow={userData?.stats?.acertos > 0}
          />
          <StatCard
            icon={Smile}
            title="Enquetes Votadas"
            value={userData?.stats?.enquetesVotadas || 0}
            right="votos"
          />
          <StatCard
            icon={Users}
            title="Grupos"
            value={userData?.stats?.grupos || 0}
            right="grupos"
          />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Editar Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Configurações</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Histórico</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#9ca3af',
  },
  logoutButton: {
    padding: 8,
  },
  statsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statsToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  statsContainer: {
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statCardGlow: {
    borderWidth: 1,
    borderColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCardTitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 8,
  },
  statCardTitleGlow: {
    color: '#fbbf24',
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statCardValueGlow: {
    color: '#fbbf24',
  },
  statCardRight: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  statCardRightText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionsContainer: {
    marginBottom: 100,
  },
  actionButton: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});
