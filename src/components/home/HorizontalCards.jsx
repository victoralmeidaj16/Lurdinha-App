import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.44;
const CARD_HEIGHT = 134;

const CARD_CONFIGS = {
  ranking_update: {
    emoji: '🏆',
    label: 'RANKING',
    gradColors: ['#1C1408', '#121008'],
    glowColor: 'rgba(255,193,7,0.22)',
    accentColor: '#FFC107',
    badgeBg: 'rgba(255,193,7,0.15)',
    badgeText: '#FCD34D',
  },
  pending_quiz: {
    emoji: '🎯',
    label: 'PALPITE',
    gradColors: ['#130F1C', '#0F0C16'],
    glowColor: 'rgba(139,92,246,0.22)',
    accentColor: '#8B5CF6',
    badgeBg: 'rgba(139,92,246,0.15)',
    badgeText: '#A78BFA',
  },
  live_room: {
    emoji: '🎮',
    label: 'AO VIVO',
    gradColors: ['#1C0A13', '#160810'],
    glowColor: 'rgba(233,30,99,0.22)',
    accentColor: '#E91E63',
    badgeBg: 'rgba(233,30,99,0.15)',
    badgeText: '#FB7185',
  },
  quiz_result: {
    emoji: '👑',
    label: 'RESULTADO',
    gradColors: ['#0E1218', '#0A0E14'],
    glowColor: 'rgba(56,189,248,0.18)',
    accentColor: '#38BDF8',
    badgeBg: 'rgba(56,189,248,0.12)',
    badgeText: '#7DD3FC',
  },
};

function CarouselCard({ type, title, subtitle, onPress }) {
  const cfg = CARD_CONFIGS[type] || CARD_CONFIGS.pending_quiz;

  return (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={styles.cardWrapper}>
      <LinearGradient colors={cfg.gradColors} style={StyleSheet.absoluteFill} />
      <View style={[styles.cardGlow, { backgroundColor: cfg.glowColor }]} />
      <View style={[styles.cardTopAccent, { backgroundColor: cfg.accentColor }]} />

      <View style={[styles.cardBadge, { backgroundColor: cfg.badgeBg }]}>
        <Text style={[styles.cardBadgeText, { color: cfg.badgeText }]}>{cfg.label}</Text>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
      {subtitle ? <Text style={styles.cardSubtitle} numberOfLines={1}>{subtitle}</Text> : null}

      <Text style={styles.cardEmoji}>{cfg.emoji}</Text>
    </TouchableOpacity>
  );
}

export function CarouselRankingCard({ data, onPress }) {
  return (
    <CarouselCard
      type="ranking_update"
      title="Ranking do grupo"
      subtitle={data.groupName || data.quizGroupTitle}
      onPress={onPress}
    />
  );
}

export function CarouselQuizCard({ data, onPress }) {
  return (
    <CarouselCard
      type={data.isOpen ? 'live_room' : 'pending_quiz'}
      title={data.isOpen ? 'Sala ao vivo' : 'Novo quiz'}
      subtitle={data.question || data.groupName || 'Quiz pendente'}
      onPress={onPress}
    />
  );
}

export function CarouselResultCard({ data, onPress }) {
  return (
    <CarouselCard
      type="quiz_result"
      title="Resultado revelado"
      subtitle={data.groupName || 'Veja quem ganhou'}
      onPress={onPress}
    />
  );
}

export default function HorizontalCards({ events, getEventHandler }) {
  if (!events || events.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
      >
        {events.map((event, index) => {
          const key = `carousel-${index}-${event.type}`;
          const onPress = getEventHandler(event);

          if (event.type === 'ranking_update') {
            return <CarouselRankingCard key={key} data={event.data} onPress={onPress} />;
          }
          if (event.type === 'pending_quiz' || event.type === 'live_room') {
            return <CarouselQuizCard key={key} data={event.data} onPress={onPress} />;
          }
          if (event.type === 'quiz_result') {
            return <CarouselResultCard key={key} data={event.data} onPress={onPress} />;
          }
          return null;
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 18,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  cardGlow: {
    position: 'absolute',
    top: -28,
    right: -28,
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  cardTopAccent: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 2,
    opacity: 0.55,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 8,
    marginTop: 4,
  },
  cardBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 19,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.38)',
    lineHeight: 15,
  },
  cardEmoji: {
    position: 'absolute',
    bottom: -12,
    right: -4,
    fontSize: 44,
    opacity: 0.82,
  },
});
