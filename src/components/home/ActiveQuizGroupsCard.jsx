import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Clock3, ChevronRight, ListChecks } from 'lucide-react-native';
import { colors } from '../../theme';

export default function ActiveQuizGroupsCard({
  activeQuizGroups,
  handleViewQuizGroup,
  handleViewAllRankings,
}) {
  if (!activeQuizGroups || activeQuizGroups.length === 0) return null;

  return (
    <Animated.View style={styles.cardWrapper}>
      <View style={[styles.leftStripCard, { borderLeftColor: '#9061F9' }]}>
        <TouchableOpacity style={styles.stripCardContent} activeOpacity={0.9}>
          <View style={styles.revampCardHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.revampHeaderRow}>
                <Clock3 size={18} color="#B9C0CC" />
                <Text style={styles.revampHeaderSmall}>
                  {activeQuizGroups.length} {activeQuizGroups.length === 1 ? 'grupo ativo' : 'grupos ativos'}
                </Text>
              </View>
              <Text style={styles.revampCardTitle}>Quiz em andamento</Text>
              <Text style={styles.revampCardSub}>
                {activeQuizGroups[0]?.title || 'Quiz'} • {activeQuizGroups[0]?.groupName || 'Grupo'}
              </Text>
            </View>
            <View style={styles.revampBadge}>
              <Text style={styles.revampBadgeText}>
                {(() => {
                  const endTime = activeQuizGroups[0]?.endTime?.toDate
                    ? activeQuizGroups[0].endTime.toDate()
                    : new Date(activeQuizGroups[0]?.endTime || Date.now());
                  const hoursLeft = Math.ceil((endTime - new Date()) / (1000 * 60 * 60));
                  return hoursLeft > 0 ? `${hoursLeft}h` : 'Expirado';
                })()}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 8 }}>
            {activeQuizGroups.slice(0, 3).map((q, i) => {
              const endTime = q.endTime?.toDate ? q.endTime.toDate() : new Date(q.endTime);
              const hoursLeft = Math.ceil((endTime - new Date()) / (1000 * 60 * 60));

              return (
                <TouchableOpacity
                  key={q.id}
                  style={[
                    styles.revampRow,
                    i < Math.min(activeQuizGroups.length, 3) - 1 && styles.revampRowDivider,
                  ]}
                  onPress={() => handleViewQuizGroup(q)}
                  activeOpacity={0.7}
                >
                  <View style={styles.revampRowLeft}>
                    <View style={[styles.revampGroupDot, { backgroundColor: q.groupColor || '#8A4F9E' }]}>
                      <Text style={{ fontSize: 18 }}>{q.groupBadge || '👥'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.revampRowTitle} numberOfLines={1}>
                        {q.title}
                      </Text>
                      <Text style={styles.revampRowSub}>{q.groupName}</Text>
                    </View>
                  </View>
                  <View style={styles.revampRowRight}>
                    <Text style={styles.revampTimeText}>
                      {hoursLeft > 0 ? `${hoursLeft}h` : 'Expirado'}
                    </Text>
                    <ListChecks size={14} color={colors.primaryMuted} />
                    <ChevronRight size={16} color="#B9C0CC" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.revampCardFooter}>
            <TouchableOpacity
              style={styles.revampCtaOutline}
              activeOpacity={0.9}
              onPress={handleViewAllRankings}
            >
              <Text style={styles.revampCtaOutlineText}>Ver todos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.revampCtaPrimary}
              activeOpacity={0.9}
              onPress={() => activeQuizGroups[0] && handleViewQuizGroup(activeQuizGroups[0])}
            >
              <Text style={styles.revampCtaPrimaryText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  leftStripCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderLeftWidth: 6,
  },
  stripCardContent: {
    width: '100%',
  },
  revampCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  revampHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  revampHeaderSmall: {
    fontSize: 12,
    color: colors.textAlt,
  },
  revampCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textLight,
    marginTop: 6,
  },
  revampCardSub: {
    fontSize: 13,
    color: colors.textAlt,
    marginTop: 2,
  },
  revampBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,122,89,0.12)',
  },
  revampBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF7A59',
  },
  revampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  revampRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  revampRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  revampRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  revampGroupDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revampRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textLight,
  },
  revampRowSub: {
    fontSize: 12,
    color: colors.textAlt,
  },
  revampTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF7A59',
  },
  revampCardFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  revampCtaPrimary: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  revampCtaPrimaryText: {
    color: '#F5F7FB',
    fontWeight: '700',
    fontSize: 14,
  },
  revampCtaOutline: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  revampCtaOutlineText: {
    color: '#F5F7FB',
    fontWeight: '600',
    fontSize: 14,
  },
});
