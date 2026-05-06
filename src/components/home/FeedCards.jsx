import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AvatarCircle from '../../components/AvatarCircle';
import { fontStyles } from '../../theme';

function formatTimeLeft(timestampOrString) {
  if (typeof timestampOrString === 'string') return timestampOrString;
  if (!timestampOrString) return 'Agora';
  return '2h'; // simplified for mockup logic, can integrate real calculation if passed
}

function FeedListItem({ onPress, index, leftIcon, title, subtitle, timeString }) {
  return (
    <Animated.View entering={FadeInDown.delay(60 + index * 80).springify().damping(18)}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.itemContainer}>
        <View style={styles.cardAccentOrb} />
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
             {leftIcon}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          </View>
        </View>
        <View style={styles.rightMeta}>
          <Text style={styles.timeText}>{timeString}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const GAME_TYPE_LABELS = {
  draw: 'Desenho',
  lurdinha: 'Lurdinha',
  telephone: 'Telefone',
  most_likely: 'Quem é mais provável?',
  obvious_mind: 'Na Minha Cabeça Era Óbvio',
  impostor: 'Impostor',
};

export function LiveRoomCard({ event, onPress, index }) {
  const { data } = event;
  const gameLabel = GAME_TYPE_LABELS[data.gameType] || 'Lurdinha';
  
  return (
    <FeedListItem
      onPress={onPress}
      index={index}
      leftIcon={<Text style={styles.emojiIcon}>🎮</Text>}
      title={<Text style={styles.boldText}>Sala ao vivo</Text>}
      subtitle={gameLabel}
      timeString="Agora"
    />
  );
}

export function PendingQuizCard({ event, onPress, index }) {
  const { data } = event;
  
  return (
    <FeedListItem
      onPress={onPress}
      index={index}
      leftIcon={<Text style={styles.emojiIcon}>🎯</Text>}
      title={<Text style={styles.boldText}>Palpite em aberto</Text>}
      subtitle={data.groupName}
      timeString={data.timeLeft}
    />
  );
}

export function QuizResultCard({ event, onPress, index }) {
  const { data } = event;
  
  return (
    <FeedListItem
      onPress={onPress}
      index={index}
      leftIcon={<Text style={styles.emojiIcon}>👑</Text>}
      title={<Text style={styles.boldText}>Resultado</Text>}
      subtitle={data.groupName || 'revelado'}
      timeString="Recentemente"
    />
  );
}

export function RankingUpdateCard({ event, onPress, index }) {
  const { data } = event;
  
  return (
    <FeedListItem
      onPress={onPress}
      index={index}
      leftIcon={<Text style={styles.emojiIcon}>🏆</Text>}
      title={<Text style={styles.boldText}>Ranking atualizado</Text>}
      subtitle={data.groupName || data.quizGroupTitle}
      timeString="Novo!"
    />
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  cardAccentOrb: {
    position: 'absolute',
    right: -12,
    top: '50%',
    width: 44,
    height: 44,
    marginTop: -22,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiIcon: {
    fontSize: 18,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  boldText: {
    fontWeight: '600',
    color: '#F3F4F6',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  rightMeta: {
    minWidth: 58,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
});
