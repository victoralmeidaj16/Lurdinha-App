import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { Users2, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';

export default function MyGroupsCard({ groups, setPressedCard }) {
  const navigation = useNavigation();

  if (!groups || groups.length === 0) return null;

  return (
    <Animated.View style={styles.cardWrapper}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('groups')}
        onPressIn={() => {
          if (setPressedCard) setPressedCard('myGroups');
        }}
        onPressOut={() => {
          if (setPressedCard) setPressedCard(null);
        }}
        activeOpacity={1}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderText}>
            <View style={styles.cardTitleRow}>
              <Users2 size={18} color={colors.primaryMuted} style={styles.cardTitleIcon} />
              <Text style={styles.cardTitle}>Abrir grupos</Text>
            </View>
            <Text style={styles.cardSubtitle}>
              {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'}
            </Text>
          </View>
          <Animated.View style={styles.chevronContainer}>
            <ChevronRight size={18} color="#B9C0CC" />
          </Animated.View>
        </View>

        {/* Preview dos grupos */}
        <View style={styles.groupsPreview}>
          {groups.slice(0, 3).map((group) => (
            <View key={group.id} style={styles.groupPreviewItem}>
              <View
                style={[
                  styles.groupPreviewBadge,
                  { backgroundColor: group.color || '#8A4F9E' },
                ]}
              >
                <Text style={styles.groupPreviewBadgeText}>
                  {group.badge || '👥'}
                </Text>
              </View>
              <Text style={styles.groupPreviewName} numberOfLines={1}>
                {group.name}
              </Text>
            </View>
          ))}
          {groups.length > 3 && (
            <View style={styles.groupPreviewMore}>
              <Text style={styles.groupPreviewMoreText}>+{groups.length - 3}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitleIcon: {
    marginRight: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textLight,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textAlt,
  },
  chevronContainer: {
    marginLeft: 8,
  },
  groupsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  groupPreviewItem: {
    alignItems: 'center',
    gap: 8,
    width: '30%',
  },
  groupPreviewBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupPreviewBadgeText: {
    fontSize: 24,
  },
  groupPreviewName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textLight,
    textAlign: 'center',
  },
  groupPreviewMore: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupPreviewMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textAlt,
  },
});
