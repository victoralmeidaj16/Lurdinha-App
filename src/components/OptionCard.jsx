import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AvatarCircle from './AvatarCircle';

export default function OptionCard({ 
  option, 
  index, 
  selected, 
  onSelect, 
  mode = 'normal',
  correctAnswer = null,
  disabled = false,
  voterUserIds = [],
  voterDetails = []
}) {

  const isCorrect = correctAnswer !== null && index === correctAnswer;
  const showAvatars = mode === 'normal' && voterUserIds.length > 0;
  const maxVisibleAvatars = 3;
  const remainingCount = voterUserIds.length > maxVisibleAvatars 
    ? voterUserIds.length - maxVisibleAvatars 
    : 0;

  return (
    <TouchableOpacity
      onPress={() => !disabled && onSelect(index)}
      disabled={disabled}
      style={[
        styles.optionCard,
        selected && styles.optionCardSelected,
        isCorrect && styles.optionCardCorrect,
        disabled && styles.optionCardDisabled
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
              isCorrect && !selected && { color: '#4CAF50' }
            ]}
            numberOfLines={2}
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    borderColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 8,
  },
  optionCardCorrect: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  optionCardDisabled: {
    opacity: 0.6,
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
    height: 36,
    width: 36,
    borderRadius: 18,
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
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#8b5cf6',
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

