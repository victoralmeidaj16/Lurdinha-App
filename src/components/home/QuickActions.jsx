import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plus, Radio, BarChart2, Users } from 'lucide-react-native';
import { fontStyles } from '../../theme';

const QUICK_ACTIONS = [
  {
    id: 'create_quiz',
    icon: Plus,
    label: 'Criar palpite',
    route: 'GameHome',
    iconColor: '#8B5CF6',
  },
  {
    id: 'join_room',
    icon: Radio,
    label: 'Sala ao vivo',
    route: 'JoinRoom',
    iconColor: '#8B5CF6',
  },
  {
    id: 'ranking',
    icon: BarChart2,
    label: 'Ranking',
    route: 'SelectGroupRanking',
    iconColor: '#8B5CF6',
  },
  {
    id: 'groups',
    icon: Users,
    label: 'Grupos',
    route: 'groups',
    iconColor: '#9CA3AF',
  },
];

export default function QuickActions({ navigation }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(260).springify().damping(18)}
      style={styles.wrapper}
    >
      <Text style={styles.sectionTitle}>Ações rápidas</Text>

      <View style={styles.grid}>
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;

          return (
            <TouchableOpacity
              key={action.id}
              activeOpacity={0.82}
              onPress={() => {
                if (action.route === 'groups') {
                  navigation?.navigate?.('MainTabs', { screen: 'groups' });
                } else {
                  navigation?.navigate?.(action.route);
                }
              }}
              style={styles.actionButton}
            >
              <View style={styles.actionAccentOrb} />
              <View style={styles.actionLeft}>
                <Icon size={20} color={action.iconColor} />
                <Text style={styles.actionLabel}>
                  {action.label}
                </Text>
              </View>
              <View style={styles.actionRightGlyph}>
                <View style={styles.actionRightLine} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    width: '48%', // using slightly less than 50% for the gap
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  actionAccentOrb: {
    position: 'absolute',
    right: -14,
    top: '50%',
    width: 52,
    height: 52,
    marginTop: -26,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5E7EB',
  },
  actionRightGlyph: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRightLine: {
    width: 10,
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
