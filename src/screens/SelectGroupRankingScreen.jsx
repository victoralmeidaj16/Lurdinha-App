import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Crown, Trophy, Users, ChevronRight } from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';
import Header from '../components/Header';
import AvatarCircle from '../components/AvatarCircle';

export default function SelectGroupRankingScreen({ navigation, route }) {
  const { getUserGroups } = useGroups();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelect = (group) => {
    navigation.navigate('SelectQuizGroupRanking', {
      groupId: group.id,
      groupName: group.name,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
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
        <Header
          title="Selecionar Grupo"
          subtitle="Escolha um grupo para visualizar o ranking"
          onBack={() => navigation.goBack()}
        />

        {groups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={64} color="#71717a" />
            <Text style={styles.emptyText}>Você não está em nenhum grupo</Text>
            <Text style={styles.emptySubtext}>
              Entre em um grupo para ver rankings
            </Text>
          </View>
        ) : (
          <View style={styles.groupsContainer}>
            {groups.map((group) => {
              const memberCount = group.stats?.totalMembers || group.members?.length || 0;
              
              return (
                <TouchableOpacity
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => handleGroupSelect(group)}
                  activeOpacity={0.8}
                >
                  <View style={styles.groupHeader}>
                    <View style={[styles.groupBadge, { backgroundColor: group.color || '#8b5cf6' }]}>
                      <Text style={styles.groupBadgeText}>{group.badge || '👥'}</Text>
                    </View>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <View style={styles.groupMeta}>
                        <Users size={14} color="#B0B0B0" />
                        <Text style={styles.groupMetaText}>{memberCount} membros</Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color="#B0B0B0" />
                  </View>
                </TouchableOpacity>
              );
            })}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  groupsContainer: {
    gap: 16,
    marginTop: 24,
  },
  groupCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupMetaText: {
    fontSize: 14,
    color: '#B0B0B0',
  },
});




