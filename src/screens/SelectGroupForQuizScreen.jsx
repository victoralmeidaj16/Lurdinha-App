import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Users, ChevronRight } from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';
import AnimatedPressable from '../components/AnimatedPressable';
import Header from '../components/Header';
import { GroupSelectionSkeleton } from '../components/ListSkeletons';
import { colors, fontStyles } from '../theme';

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
          <View style={styles.groupsContainer}>
            <GroupSelectionSkeleton count={4} />
          </View>
        </ScrollView>
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
            <Users size={64} color={colors.textAlt} />
            <Text style={styles.emptyText}>Você não está em nenhum grupo</Text>
            <Text style={styles.emptySubtext}>
              Entre em um grupo para criar um grupo de quiz
            </Text>
            <AnimatedPressable
              style={styles.emptyButton}
              onPress={() => navigation.navigate('groups')}
              activeScale={0.96}
            >
              <Text style={styles.emptyButtonText}>Ver Grupos</Text>
            </AnimatedPressable>
          </View>
        ) : (
          <View style={styles.groupsContainer}>
            {groups.map((group) => {
              const memberCount = group.stats?.totalMembers || group.members?.length || 0;
              
              return (
                <AnimatedPressable
                  key={group.id}
                  style={styles.groupCard}
                  onPress={() => handleGroupSelect(group)}
                  activeScale={0.985}
                >
                  <View style={styles.groupHeader}>
                    <View style={[styles.groupBadge, { backgroundColor: group.color || colors.primary }]}>
                      <Text style={styles.groupBadgeText}>{group.badge || '👥'}</Text>
                    </View>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <View style={styles.groupMeta}>
                        <Users size={14} color={colors.textAlt} />
                        <Text style={styles.groupMetaText}>{memberCount} membros</Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color={colors.textAlt} />
                  </View>
                </AnimatedPressable>
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
    backgroundColor: colors.surfaceDark,
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
    backgroundColor: colors.surfaceDark,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    ...fontStyles.semibold,
    fontSize: 18,
    color: colors.textLight,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    ...fontStyles.regular,
    fontSize: 14,
    color: colors.textAlt,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    ...fontStyles.semibold,
    color: colors.textPrimary,
    fontSize: 16,
  },
  groupsContainer: {
    gap: 16,
    marginTop: 24,
  },
  groupCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
    ...fontStyles.bold,
    fontSize: 18,
    color: colors.textLight,
    marginBottom: 4,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupMetaText: {
    ...fontStyles.regular,
    fontSize: 14,
    color: colors.textAlt,
  },
});
