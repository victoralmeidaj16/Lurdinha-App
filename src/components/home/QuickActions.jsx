import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus, Search, FileText } from 'lucide-react-native';
import { colors } from '../../theme';

export default function QuickActions() {
  const navigation = useNavigation();

  return (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity
        style={styles.quickActionButton}
        onPress={() => navigation.navigate('CreateGroup')}
        activeOpacity={0.7}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
          <Plus size={24} color="#a78bfa" />
        </View>
        <Text style={styles.quickActionText}>Criar Grupo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickActionButton}
        onPress={() => navigation.navigate('SearchGroups')}
        activeOpacity={0.7}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
          <Search size={24} color="#60a5fa" />
        </View>
        <Text style={styles.quickActionText}>Buscar Grupo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickActionButton}
        onPress={() => navigation.navigate('SelectGroupForQuiz')}
        activeOpacity={0.7}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
          <FileText size={24} color="#34d399" />
        </View>
        <Text style={styles.quickActionText}>Criar Quiz</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  quickActionButton: {
    width: '30%',
    backgroundColor: '#18181b', // surfaceAlt could be used, but this is Zinc-900
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
    aspectRatio: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e5e7eb',
    textAlign: 'center',
  },
});
