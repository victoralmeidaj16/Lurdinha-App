import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const GAME_TYPE_LABELS = {
  draw: 'Desenho',
  lurdinha: 'Lurdinha',
  telephone: 'Telefone',
  most_likely: 'Quem é mais provável?',
  obvious_mind: 'Na Minha Cabeça Era Óbvio',
  impostor: 'Impostor',
};

const TYPE_CONFIG = {
  live_room: {
    emoji: '🎮',
    label: 'AO VIVO',
    accentColor: '#E91E63',
    badgeBg: 'rgba(233,30,99,0.14)',
    badgeText: '#FB7185',
  },
  pending_quiz: {
    emoji: '🎯',
    label: 'PALPITE',
    accentColor: '#8B5CF6',
    badgeBg: 'rgba(139,92,246,0.14)',
    badgeText: '#A78BFA',
  },
  quiz_result: {
    emoji: '👑',
    label: 'RESULTADO',
    accentColor: '#FFC107',
    badgeBg: 'rgba(255,193,7,0.12)',
    badgeText: '#FCD34D',
  },
  ranking_update: {
    emoji: '🏆',
    label: 'RANKING',
    accentColor: '#FF6B35',
    badgeBg: 'rgba(255,107,53,0.12)',
    badgeText: '#FB923C',
  },
};

function FeedCard({ type, title, subtitle, timeString, onPress, index }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.pending_quiz;

  return (
    <Animated.View entering={FadeInDown.delay(60 + index * 80).springify().damping(18)}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.card}>
        <View style={[styles.accentBar, { backgroundColor: cfg.accentColor }]} />

        <View style={[styles.emojiWrap, { backgroundColor: `${cfg.accentColor}18` }]}>
          <Text style={styles.emojiText}>{cfg.emoji}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.topRow}>
            <View style={[styles.typeBadge, { backgroundColor: cfg.badgeBg }]}>
              <Text style={[styles.typeBadgeText, { color: cfg.badgeText }]}>{cfg.label}</Text>
            </View>
            <Text style={styles.timeText}>{timeString}</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function LiveRoomCard({ event, onPress, index }) {
  return (
    <FeedCard
      type="live_room"
      title="Sala ao vivo"
      subtitle={GAME_TYPE_LABELS[event.data?.gameType] || 'Lurdinha'}
      timeString="Agora"
      onPress={onPress}
      index={index}
    />
  );
}

export function PendingQuizCard({ event, onPress, index }) {
  return (
    <FeedCard
      type="pending_quiz"
      title="Palpite em aberto"
      subtitle={event.data?.groupName}
      timeString={event.data?.timeLeft}
      onPress={onPress}
      index={index}
    />
  );
}

export function QuizResultCard({ event, onPress, index }) {
  return (
    <FeedCard
      type="quiz_result"
      title="Resultado revelado"
      subtitle={event.data?.groupName || 'Disputa encerrada'}
      timeString="Recentemente"
      onPress={onPress}
      index={index}
    />
  );
}

export function RankingUpdateCard({ event, onPress, index }) {
  return (
    <FeedCard
      type="ranking_update"
      title="Ranking atualizado"
      subtitle={event.data?.groupName || event.data?.quizGroupTitle}
      timeString="Novo!"
      onPress={onPress}
      index={index}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111116',
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    paddingRight: 16,
    paddingVertical: 13,
  },
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
    marginRight: 12,
  },
  emojiWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emojiText: {
    fontSize: 20,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  typeBadge: {
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  timeText: {
    fontSize: 11,
    color: '#7D7989',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: '#7D7989',
  },
});
