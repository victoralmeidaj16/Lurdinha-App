import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated2, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import AvatarCircle from './AvatarCircle';
import { colors } from '../theme';
import { playSound } from '../utils/sounds';

export default function OptionCard({
  option,
  index,
  selected,
  onSelect,
  mode = 'normal',
  correctAnswer = null,
  disabled = false,
  voterUserIds = [],
  voterDetails = [],
  totalVotes = 0,   // total votes across ALL options (for progress bar %)
}) {
  const isCorrect = correctAnswer !== null && index === correctAnswer;
  const showAvatars = mode === 'normal' && voterUserIds.length > 0;
  const showProgressBar = mode === 'normal' && totalVotes > 0;
  const votePercent = totalVotes > 0 ? voterUserIds.length / totalVotes : 0;
  const maxVisibleAvatars = 3;
  const remainingCount = voterUserIds.length > maxVisibleAvatars
    ? voterUserIds.length - maxVisibleAvatars
    : 0;

  // Progress bar animation
  const barWidth = useSharedValue(0);
  const barScaleY = useSharedValue(1);
  const prevVoteCount = useRef(voterUserIds.length);

  useEffect(() => {
    barWidth.value = withSpring(votePercent * 100, { damping: 16, stiffness: 140 });

    // Bump when new vote arrives
    if (voterUserIds.length > prevVoteCount.current) {
      barScaleY.value = withSequence(
        withTiming(1.8, { duration: 100 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
    }
    prevVoteCount.current = voterUserIds.length;
  }, [voterUserIds.length, votePercent]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
    transform: [{ scaleY: barScaleY.value }],
  }));

  // ─── Existing correct/wrong animations ─────────────────────
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (correctAnswer !== null) {
      if (selected && !isCorrect) {
        // Shake for wrong picked
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        playSound('answer_error');
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
      } else if (isCorrect) {
        // Pulse for correct
        if (selected) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          playSound('answer_success');
        }
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
        ]).start();
      }
    }
  }, [correctAnswer, isCorrect, selected]);

  return (
    <Animated.View style={{ transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={() => {
          if (!disabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            playSound('ui_toggle');
            onSelect(index);
          }
        }}
        disabled={disabled}
        style={[
          styles.optionCard,
          selected && styles.optionCardSelected,
          isCorrect && styles.optionCardCorrect,
          disabled && !isCorrect && !selected && styles.optionCardDisabled
        ]}
        activeOpacity={disabled ? 1 : 0.8}
      >
        <View style={styles.optionContent}>
          <View style={styles.optionLeft}>
            <View
              style={[
                styles.radioContainer,
                selected
                  ? { borderColor: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                  : { borderColor: '#B0B0B0', backgroundColor: 'rgba(30, 30, 30, 0.4)' },
                isCorrect && { borderColor: '#4CAF50' }
              ]}
            >
              <View
                style={[
                  styles.radioInner,
                  selected || isCorrect ? { backgroundColor: selected ? '#FFFFFF' : '#4CAF50' } : { backgroundColor: 'transparent' },
                ]}
              />
            </View>
            <Text
              style={[
                styles.optionText,
                selected ? { color: '#FFFFFF' } : { color: '#e4e4e7' },
                isCorrect && { color: '#FFFFFF' }
              ]}
            >
              {option}
            </Text>
          </View>

          {showAvatars && voterUserIds.length > 0 && (
            <View style={styles.avatarsContainer}>
              {voterUserIds.slice(0, maxVisibleAvatars).map((userId, idx) => {
                const userDetail = voterDetails.find(u => u.uid === userId || u.id === userId);
                const displayName = userDetail?.displayName || userDetail?.name || userId.substring(0, 2);

                return (
                  <AvatarCircle
                    key={`${userId}-${idx}`}
                    name={displayName}
                    size={24}
                    style={styles.avatar}
                  />
                );
              })}
              {remainingCount > 0 && (
                <View style={[styles.avatar, styles.moreAvatars]}>
                  <Text style={styles.moreAvatarsText}>+{remainingCount}</Text>
                </View>
              )}
            </View>
          )}

          {isCorrect && !selected && (
            <View style={styles.correctBadge}>
              <Text style={styles.correctBadgeText}>✓</Text>
            </View>
          )}
        </View>

        {/* ─── Vote progress bar ─────────────────────────────── */}
        {showProgressBar && (
          <View style={styles.progressTrack}>
            <Animated2.View
              style={[
                styles.progressFill,
                selected && styles.progressFillSelected,
                barStyle,
              ]}
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  optionCard: {
    flexDirection: 'column',
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 11,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 8,
  },
  optionCardCorrect: {
    borderColor: '#4ADE80',
    backgroundColor: '#166534',
    borderWidth: 2,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  optionCardDisabled: {
    opacity: 0.5,
    overflow: 'hidden',
  },
  progressTrack: {
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(167,139,250,0.6)',
  },
  progressFillSelected: {
    backgroundColor: '#FFFFFF',
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioContainer: {
    height: 34,
    width: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    height: 16,
    width: 16,
    borderRadius: 8,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: -8,
    marginLeft: 12,
  },
  avatar: {
    marginLeft: -8,
  },
  moreAvatars: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  moreAvatarsText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  correctBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  correctBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
