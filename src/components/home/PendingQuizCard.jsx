import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Clock, Clock3, ChevronRight } from 'lucide-react-native';

export default function PendingQuizCard({ pendingQuiz, handlePendingQuizPress }) {
  if (!pendingQuiz) return null;

  return (
    <Animated.View style={styles.cardWrapper}>
      <TouchableOpacity
        style={styles.pendingQuizCard}
        activeOpacity={0.9}
        onPress={handlePendingQuizPress}
      >
        {/* Gradiente de fundo */}
        <View style={styles.pendingQuizGradient} />

        {/* Efeito glow */}
        <View style={styles.pendingQuizGlow} />

        {/* Conteúdo */}
        <View style={styles.pendingQuizContent}>
          {/* Badge superior */}
          <View style={styles.pendingQuizBadge}>
            <Clock size={16} color="#f7fee7" />
            <Text style={styles.pendingQuizBadgeText}>QUIZ AGUARDANDO VOCÊ</Text>
          </View>

          {/* Pergunta principal */}
          <Text style={styles.pendingQuizQuestion} numberOfLines={2}>
            {pendingQuiz.question}
          </Text>

          {/* Informações do grupo */}
          <View style={styles.pendingQuizGroupInfo}>
            <View style={[styles.pendingQuizGroupBadge, { backgroundColor: pendingQuiz.groupColor + '20' }]}>
              <Text style={styles.pendingQuizGroupEmoji}>{pendingQuiz.groupBadge}</Text>
            </View>
            <Text style={styles.pendingQuizGroupName}>{pendingQuiz.groupName}</Text>
            <Text style={styles.pendingQuizGroupSeparator}>•</Text>
            <Text style={styles.pendingQuizGroupTitle}>{pendingQuiz.quizGroupTitle}</Text>
          </View>

          {/* Footer com tempo e CTA */}
          <View style={styles.pendingQuizFooter}>
            <View style={styles.pendingQuizTimeContainer}>
              <Clock3 size={16} color="#f7fee7" />
              <Text style={styles.pendingQuizTime}>{pendingQuiz.timeLeft}</Text>
            </View>
            <View style={styles.pendingQuizCtaContainer}>
              <Text style={styles.pendingQuizCtaText}>Responder agora</Text>
              <ChevronRight size={18} color="#fef9c3" />
            </View>
          </View>
        </View>

        {/* Decoração - círculos no canto */}
        <View style={styles.pendingQuizDecoration1} />
        <View style={styles.pendingQuizDecoration2} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  pendingQuizCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: '#17171B',
    minHeight: 200,
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  pendingQuizGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(147, 51, 234, 0.25)',
    borderRadius: 24,
  },
  pendingQuizGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
  },
  pendingQuizContent: {
    position: 'relative',
    zIndex: 10,
    padding: 24,
    gap: 16,
  },
  pendingQuizBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(22, 101, 52, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  pendingQuizBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f7fee7',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pendingQuizQuestion: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ede9fe',
    lineHeight: 30,
    marginTop: 4,
  },
  pendingQuizGroupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pendingQuizGroupBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pendingQuizGroupEmoji: {
    fontSize: 18,
  },
  pendingQuizGroupName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e9d5ff',
  },
  pendingQuizGroupSeparator: {
    fontSize: 14,
    color: '#c084fc',
    marginHorizontal: 4,
  },
  pendingQuizGroupTitle: {
    fontSize: 14,
    color: '#c084fc',
  },
  pendingQuizFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(192, 132, 252, 0.2)',
  },
  pendingQuizTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(22, 101, 52, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pendingQuizTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f7fee7',
  },
  pendingQuizCtaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(254, 249, 195, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(254, 249, 195, 0.3)',
  },
  pendingQuizCtaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fef9c3',
    letterSpacing: 0.3,
  },
  pendingQuizDecoration1: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
    zIndex: 1,
  },
  pendingQuizDecoration2: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(192, 132, 252, 0.1)',
    zIndex: 1,
  },
});
