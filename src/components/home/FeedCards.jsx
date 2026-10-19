import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const GAME_TYPE_LABELS = {
  draw: 'Desenho',
  telephone: 'Telefone',
  most_likely: 'Quem é mais provável?',
  obvious_mind: 'Na Minha Cabeça Era Óbvio',
  impostor: 'Impostor',
};

// Ações ao vivo (sala, palpite) usam o botão violeta; novidades usam o cinza.
const TYPE_CONFIG = {
  live_room: { emoji: '🎮', label: 'Ao vivo', cta: 'Entrar', primary: true },
  pending_quiz: { emoji: '🎯', label: 'Palpite', cta: 'Palpitar', primary: true },
  quiz_result: { emoji: '👑', label: 'Resultado', cta: 'Ver', primary: false },
  ranking_update: { emoji: '🏆', label: 'Ranking', cta: 'Ver', primary: false },
};

function FeedCard({ type, title, subtitle, timeString, onPress, index }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.pending_quiz;
  const meta = [subtitle, timeString].filter(Boolean).join(' · ');

  return (
    <Animated.View entering={FadeInDown.delay(60 + index * 80).springify().damping(18)}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.86} style={styles.card}>
        <Text style={styles.emoji}>{cfg.emoji}</Text>

        <View style={styles.body}>
          <Text style={styles.label}>{cfg.label}</Text>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {meta ? <Text style={styles.subtitle} numberOfLines={1}>{meta}</Text> : null}
        </View>

        <View style={[styles.ctaButton, !cfg.primary && styles.ctaButtonSecondary]}>
          <Text style={styles.ctaText}>{cfg.cta}</Text>
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
      subtitle={GAME_TYPE_LABELS[event.data?.gameType] || 'Jogo social'}
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
    gap: 12,
    backgroundColor: '#18181D',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.075)',
    padding: 16,
    marginBottom: 10,
  },
  emoji: {
    fontSize: 34,
    lineHeight: 42,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    color: '#8B8B96',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 3,
  },
  subtitle: {
    color: '#A1A1AA',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  ctaButton: {
    borderRadius: 999,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  ctaButtonSecondary: {
    backgroundColor: '#2A2A30',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
