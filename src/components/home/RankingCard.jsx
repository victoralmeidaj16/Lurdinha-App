import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AvatarCircle from '../../components/AvatarCircle';
import { Crown } from 'lucide-react-native';
import { colors } from '../../theme';

export function QuizRankingCard({ quizGroupRanking, handleViewQuizGroupRanking, setPressedCard }) {
  if (!quizGroupRanking) return null;

  return (
    <Animated.View style={styles.cardWrapper}>
      <TouchableOpacity
        style={styles.rankingCardContainer}
        onPress={handleViewQuizGroupRanking}
        onPressIn={() => {
          if (setPressedCard) setPressedCard('quizRanking');
          if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressOut={() => {
          if (setPressedCard) setPressedCard(null);
        }}
        activeOpacity={0.95}
      >
        {/* Gradiente baseado na cor da categoria */}
        <View
          style={[
            styles.rankingCardGradient,
            {
              backgroundColor: quizGroupRanking.isActive
                ? 'rgba(144, 97, 249, 0.15)'
                : 'rgba(185, 192, 204, 0.08)',
            },
          ]}
        />

        <View style={styles.rankingCardGlow} />

        <View style={styles.rankingCardContent}>
          <View style={styles.rankingCardIconContainer}>
            <View style={styles.rankingCardIconBackground}>
              <Trophy size={40} color={colors.primaryMuted} />
            </View>
          </View>

          <View style={styles.rankingCardTextContainer}>
            <Text style={styles.rankingCardTitle}>Ranking do Quiz</Text>
            <Text style={styles.rankingCardSubtitle}>
              {quizGroupRanking.quizGroupTitle}
            </Text>
            <Text style={styles.rankingCardGroupName}>
              {quizGroupRanking.groupName}
            </Text>
          </View>

          <View style={styles.rankingCardUserPosition}>
            <View style={styles.rankingCardPositionBadge}>
              <Text style={styles.rankingCardPositionNumber}>
                {quizGroupRanking.userPosition}
              </Text>
              <Text style={styles.rankingCardPositionLabel}>º lugar</Text>
            </View>
            <Text style={styles.rankingCardUserStats}>
              {quizGroupRanking.userData?.correct || quizGroupRanking.userData?.totalCorrect || 0} acertos
            </Text>
          </View>
        </View>

        <View style={styles.rankingCardTrophyEmoji}>
          <Text style={styles.rankingCardTrophyText}>🏆</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function SnapshotRankingCard({ groupRanking, quizGroupRanking, handleViewAllRankings }) {
  if (!groupRanking?.top3 && !quizGroupRanking?.top3) return null;

  return (
    <Animated.View style={styles.cardWrapper}>
      <TouchableOpacity
        style={styles.snapshotCardContainer}
        onPress={handleViewAllRankings}
        activeOpacity={0.95}
      >
        <View style={styles.snapshotCardBackground} />
        <View style={styles.snapshotCardGlow} />

        <View style={styles.snapshotCardContent}>
          <View style={styles.snapshotCardTextContainer}>
            <Text style={styles.snapshotCardTitle}>Rankings</Text>
            <Text style={styles.snapshotCardSubtitle}>
              Veja quem lidera no seu grupo
            </Text>
          </View>

          <View style={styles.snapshotTop3Container}>
            {(groupRanking?.top3 || quizGroupRanking?.top3 || []).slice(0, 3).map((m, idx) => (
              <View key={m.userId || idx} style={styles.snapshotTop3Item}>
                {idx === 0 && (
                  <Crown size={16} color={colors.primaryMuted} style={styles.snapshotCrown} />
                )}
                <AvatarCircle
                  name={m.name || 'Usuário'}
                  size={36}
                  photoURL={m.photoURL}
                  style={idx === 0 && styles.snapshotTop3AvatarHighlight}
                />
                <View style={styles.snapshotTop3Info}>
                  <Text
                    style={[
                      styles.snapshotTop3Name,
                      idx === 0 && styles.snapshotTop3NameHighlight,
                    ]}
                    numberOfLines={1}
                  >
                    {m.name || 'Usuário'}
                  </Text>
                  <Text style={styles.snapshotTop3Score}>
                    ✅ {m.totalCorrect ?? m.correct ?? 0}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.snapshotCardTrophyEmoji}>
          <Text style={styles.snapshotCardTrophyText}>🏆</Text>
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
  rankingCardContainer: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    padding: 24,
    minHeight: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rankingCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  rankingCardGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(144, 97, 249, 0.2)',
    shadowColor: colors.primaryMuted,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
  },
  rankingCardContent: {
    position: 'relative',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 152,
  },
  rankingCardIconContainer: {
    marginBottom: 16,
  },
  rankingCardIconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(144, 97, 249, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(144, 97, 249, 0.3)',
  },
  rankingCardTextContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  rankingCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 6,
    textAlign: 'center',
  },
  rankingCardSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textLight,
    marginBottom: 4,
    textAlign: 'center',
  },
  rankingCardGroupName: {
    fontSize: 13,
    color: colors.textAlt,
    textAlign: 'center',
  },
  rankingCardUserPosition: {
    alignItems: 'center',
    gap: 8,
  },
  rankingCardPositionBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(144, 97, 249, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(144, 97, 249, 0.4)',
  },
  rankingCardPositionNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryMuted,
  },
  rankingCardPositionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textAlt,
    marginLeft: 4,
  },
  rankingCardUserStats: {
    fontSize: 14,
    color: colors.textAlt,
    fontWeight: '500',
  },
  rankingCardTrophyEmoji: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  rankingCardTrophyText: {
    fontSize: 80,
    lineHeight: 80,
    textAlign: 'center',
  },
  snapshotCardContainer: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    padding: 24,
    minHeight: 180,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  snapshotCardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  snapshotCardGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(144, 97, 249, 0.15)',
    shadowColor: colors.primaryMuted,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  snapshotCardContent: {
    position: 'relative',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotCardTextContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  snapshotCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 6,
    textAlign: 'center',
  },
  snapshotCardSubtitle: {
    fontSize: 14,
    color: colors.textAlt,
    textAlign: 'center',
  },
  snapshotTop3Container: {
    width: '100%',
    gap: 12,
  },
  snapshotTop3Item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  snapshotCrown: {
    marginRight: -4,
  },
  snapshotTop3AvatarHighlight: {
    borderWidth: 2,
    borderColor: colors.primaryMuted,
  },
  snapshotTop3Info: {
    flex: 1,
  },
  snapshotTop3Name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 4,
  },
  snapshotTop3NameHighlight: {
    color: colors.primaryMuted,
    fontWeight: '700',
  },
  snapshotTop3Score: {
    fontSize: 13,
    color: colors.textAlt,
    fontWeight: '500',
  },
  snapshotCardTrophyEmoji: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  snapshotCardTrophyText: {
    fontSize: 80,
    lineHeight: 80,
    textAlign: 'center',
  },
});
