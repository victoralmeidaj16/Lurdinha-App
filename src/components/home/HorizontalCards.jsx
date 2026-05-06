import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { fontStyles } from '../../theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.38;
const CARD_HEIGHT = CARD_WIDTH * 0.73;

export function CarouselRankingCard({ data, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.cardWrapper}>
      <Text style={styles.title} numberOfLines={2}>Ranking do grupo</Text>
      <Text style={styles.subtitle} numberOfLines={2}>
        {data.groupName || data.quizGroupTitle}
      </Text>
      <Text style={styles.giantEmoji}>🏆</Text>
    </TouchableOpacity>
  );
}

export function CarouselQuizCard({ data, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.cardWrapper}>
      <Text style={styles.title} numberOfLines={2}>Novo quiz</Text>
      <Text style={styles.subtitle} numberOfLines={3}>
        {data.question || data.groupName || 'Quiz pendente'}
      </Text>
      <Text style={styles.giantEmoji}>🎯</Text>
    </TouchableOpacity>
  );
}

export function CarouselResultCard({ data, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.cardWrapper}>
      <Text style={styles.title} numberOfLines={2}>Resultado revelado</Text>
      <Text style={styles.subtitle} numberOfLines={3}>
        {data.groupName || 'Veja quem ganhou'}
      </Text>
      <Text style={styles.giantEmoji}>👑</Text>
    </TouchableOpacity>
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
    marginBottom: 32,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#18181B',
    borderRadius: 20,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    ...fontStyles.headingBold,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 2,
    lineHeight: 18,
  },
  subtitle: {
    ...fontStyles.medium,
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 16,
  },
  giantEmoji: {
    position: 'absolute',
    bottom: -10,
    right: -6,
    fontSize: 40,
  },
});
