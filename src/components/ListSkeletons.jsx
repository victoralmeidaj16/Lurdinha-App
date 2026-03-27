import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { colors } from '../theme';

function SkeletonShell({ children, style }) {
  return <View style={[styles.cardShell, style]}>{children}</View>;
}

export function GroupSelectionSkeleton({ count = 4 }) {
  return (
    <View style={styles.stack}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonShell key={index}>
          <View style={styles.row}>
            <SkeletonLoader width={48} height={48} radius={24} />
            <View style={styles.flex}>
              <SkeletonLoader width="58%" height={18} />
              <SkeletonLoader width="34%" height={12} style={styles.metaGap} />
            </View>
            <SkeletonLoader width={20} height={20} radius={10} />
          </View>
        </SkeletonShell>
      ))}
    </View>
  );
}

export function SearchResultsSkeleton({ count = 4 }) {
  return (
    <View style={styles.stack}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonShell key={index}>
          <View style={styles.rowTop}>
            <SkeletonLoader width={48} height={48} radius={24} />
            <View style={styles.flex}>
              <SkeletonLoader width="52%" height={18} />
              <SkeletonLoader width="92%" height={12} style={styles.metaGap} />
            </View>
          </View>
          <View style={styles.statsRow}>
            <SkeletonLoader width="28%" height={12} />
            <SkeletonLoader width="24%" height={12} />
          </View>
          <SkeletonLoader width="100%" height={44} radius={14} style={styles.buttonGap} />
        </SkeletonShell>
      ))}
    </View>
  );
}

export function QuizPollSkeletonList({ count = 3 }) {
  return (
    <View style={styles.stack}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonShell key={index} style={styles.pollShell}>
          <View style={styles.spaceBetween}>
            <SkeletonLoader width="26%" height={14} />
            <SkeletonLoader width="20%" height={12} />
          </View>
          <SkeletonLoader width="90%" height={22} style={styles.titleGap} />
          <SkeletonLoader width="70%" height={14} style={styles.metaGap} />
          <SkeletonLoader width="44%" height={12} style={styles.metaGap} />
          <View style={[styles.spaceBetween, styles.buttonGap]}>
            <SkeletonLoader width="24%" height={12} />
            <SkeletonLoader width={110} height={38} radius={16} />
          </View>
        </SkeletonShell>
      ))}
    </View>
  );
}

export function HistorySkeletonList({ count = 4 }) {
  return (
    <View style={styles.stack}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonShell key={index} style={styles.historyShell}>
          <View style={styles.spaceBetween}>
            <View style={styles.row}>
              <SkeletonLoader width={20} height={20} radius={10} />
              <SkeletonLoader width={180} height={16} style={styles.inlineGap} />
            </View>
            <SkeletonLoader width={56} height={20} radius={10} />
          </View>
          <SkeletonLoader width="58%" height={14} style={styles.titleGap} />
          <View style={[styles.spaceBetween, styles.buttonGap]}>
            <SkeletonLoader width="26%" height={12} />
            <SkeletonLoader width="20%" height={12} />
          </View>
        </SkeletonShell>
      ))}
    </View>
  );
}

export function RankingSelectionSkeleton({ count = 3, includeOverallCard = true }) {
  return (
    <View style={styles.stack}>
      {includeOverallCard ? (
        <SkeletonShell style={styles.overallShell}>
          <View style={styles.rowTop}>
            <SkeletonLoader width={56} height={56} radius={28} />
            <View style={styles.flex}>
              <SkeletonLoader width="56%" height={18} />
              <SkeletonLoader width="42%" height={12} style={styles.metaGap} />
            </View>
            <SkeletonLoader width={20} height={20} radius={10} />
          </View>
        </SkeletonShell>
      ) : null}

      {Array.from({ length: count }).map((_, index) => (
        <SkeletonShell key={index}>
          <View style={styles.rowTop}>
            <SkeletonLoader width={40} height={40} radius={20} />
            <View style={styles.flex}>
              <SkeletonLoader width="52%" height={18} />
              <SkeletonLoader width="68%" height={12} style={styles.metaGap} />
            </View>
            <SkeletonLoader width={20} height={20} radius={10} />
          </View>
          <View style={styles.previewBlock}>
            <SkeletonLoader width="100%" height={12} />
            <SkeletonLoader width="88%" height={12} style={styles.metaGap} />
            <SkeletonLoader width="76%" height={12} style={styles.metaGap} />
          </View>
        </SkeletonShell>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 16,
  },
  cardShell: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overallShell: {
    borderWidth: 2,
    borderColor: colors.primaryAlpha20,
  },
  pollShell: {
    borderRadius: 24,
  },
  historyShell: {
    borderRadius: 12,
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  previewBlock: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  flex: {
    flex: 1,
  },
  metaGap: {
    marginTop: 10,
  },
  titleGap: {
    marginTop: 14,
  },
  buttonGap: {
    marginTop: 16,
  },
  inlineGap: {
    marginLeft: 10,
  },
});
