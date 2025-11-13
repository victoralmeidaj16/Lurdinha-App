import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Trophy, Users, ChevronRight } from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';
import Header from '../components/Header';

const COLORS = {
  bg: '#0E0E10',
  card: '#17171B',
  purple: '#9061F9',
  text: '#F5F7FB',
  text2: '#B9C0CC',
  border: 'rgba(255,255,255,0.08)',
};

export default function SelectGroupForQuizScreen({ navigation, route }) {
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
    navigation.navigate('CreateQuizGroupStep1', {
      groupId: group.id,
      groupName: group.name,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.purple} />
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
          subtitle="Escolha um grupo para criar o grupo de quiz"
          onBack={() => navigation.goBack()}
        />

        {groups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={64} color={COLORS.text2} />
            <Text style={styles.emptyText}>Você não está em nenhum grupo</Text>
            <Text style={styles.emptySubtext}>
              Entre em um grupo para criar um grupo de quiz
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('groups')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>Ver Grupos</Text>
            </TouchableOpacity>
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
                    <View style={[styles.groupBadge, { backgroundColor: group.color || COLORS.purple }]}>
                      <Text style={styles.groupBadgeText}>{group.badge || '👥'}</Text>
                    </View>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <View style={styles.groupMeta}>
                        <Users size={14} color={COLORS.text2} />
                        <Text style={styles.groupMetaText}>{memberCount} membros</Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color={COLORS.text2} />
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
    backgroundColor: COLORS.bg,
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
    backgroundColor: COLORS.bg,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text2,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  groupsContainer: {
    gap: 16,
    marginTop: 24,
  },
  groupCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.text,
    marginBottom: 4,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupMetaText: {
    fontSize: 14,
    color: COLORS.text2,
  },
});

