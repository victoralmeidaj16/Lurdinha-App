import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { fontStyles } from '../../theme';

export default function MainFocusCard({ event, onPress }) {
  if (!event) return null;
  const { type, data } = event;

  if (type === 'live_room') {
    const playerCount = data?.playerCount || 0;

    return (
      <Animated.View entering={FadeInDown.delay(200).springify().damping(16)}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {playerCount === 0
                ? 'Sala esperando jogadores'
                : `${playerCount} pessoa${playerCount > 1 ? 's' : ''} jogando agora`}
            </Text>
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>AO VIVO</Text>
            </View>
          </View>

          <Text style={styles.inlineStatsText} numberOfLines={1}>
            Entre agora e puxe a próxima rodada
          </Text>

          <View style={styles.progressContainer}>
             <View style={styles.progressBarBg}>
               <View style={[styles.progressBarFill, { width: '100%', backgroundColor: '#8B5CF6' }]} />
             </View>
          </View>

          <TouchableOpacity style={styles.ctaButton} onPress={onPress}>
            <Text style={styles.ctaButtonText}>{data.isOpen ? 'Entrar agora' : 'Ver sala'}</Text>
          </TouchableOpacity>

          <Text style={[styles.giantEmoji, { transform: [{ rotate: '-12deg' }] }]}>⚔️</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (type === 'pending_quiz') {
    const isExpired = data?.timeLeft === 'Expirado';
    const question = data?.question || 'Palpite pendente';
    
    const votes = data?.votes || {};
    const votesCount = Object.keys(votes).length;
    
    // Contagem da resposta mais votada (para a barra de progresso)
    let maxVotes = 0;
    const voteCounts = {};
    Object.values(votes).forEach(vote => {
      voteCounts[vote] = (voteCounts[vote] || 0) + 1;
      if (voteCounts[vote] > maxVotes) maxVotes = voteCounts[vote];
    });
    
    const barWidthPercentage = votesCount > 0 ? Math.round((maxVotes / votesCount) * 100) : 0;
    const barWidth = `${barWidthPercentage}%`;
    const subtitle = votesCount === 0 ? "Ninguém respondeu ainda" : `${votesCount} pessoa${votesCount !== 1 ? 's' : ''} já deram palpite`;
    const progressText = votesCount > 0 ? `das pessoas escolheram a opção mais votada` : "Seja o primeiro a votar!";
    
    return (
      <Animated.View entering={FadeInDown.delay(200).springify().damping(16)}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {question}
            </Text>
            {!isExpired && (
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>RESULTADO EM {data.timeLeft.toUpperCase()}</Text>
              </View>
            )}
          </View>

          <Text style={styles.inlineStatsText} numberOfLines={1}>
            {subtitle}
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: barWidth }]} />
            </View>
            <Text style={styles.progressText}>
              {votesCount > 0 ? (
                <>
                  <Text style={{ fontWeight: 'bold', color: '#FFFFFF' }}>{barWidth}</Text> {progressText}
                </>
              ) : (
                progressText
              )}
            </Text>
          </View>

          <TouchableOpacity style={styles.ctaButton} onPress={onPress}>
            <Text style={styles.ctaButtonText}>{isExpired ? 'Ver resultado' : 'Responder agora'}</Text>
          </TouchableOpacity>

          <Text style={[styles.giantEmoji, { transform: [{ rotate: '-10deg' }] }]}>👑</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Fallback / default CTA
  const isCta = type === 'default_cta' || (!['live_room', 'pending_quiz'].includes(type));
  if (isCta) {
    return (
      <Animated.View entering={FadeInDown.delay(200).springify().damping(16)}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              O que vai rolar agora?
            </Text>
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>JOGAR AGORA</Text>
            </View>
          </View>

          <Text style={styles.inlineStatsText} numberOfLines={1}>
            Abra uma sala ou crie uma disputa para o grupo
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '40%', backgroundColor: '#8B5CF6' }]} />
            </View>
          </View>

          <TouchableOpacity style={styles.ctaButton} onPress={onPress}>
            <Text style={styles.ctaButtonText}>Criar nova sala</Text>
          </TouchableOpacity>

          <Text style={[styles.giantEmoji, { transform: [{ rotate: '-10deg' }] }]}>🚀</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181B',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    flex: 1,
    fontSize: 22,
    lineHeight: 28,
    color: '#FFFFFF',
    ...fontStyles.headingBold,
    marginRight: 12,
  },
  timeBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  timeBadgeText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  inlineStatsText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 20,
    width: '100%',
    paddingRight: 60, // Keep text and bar away from giant emoji
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  ctaButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 99,
  },
  ctaButtonText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '700',
  },
  giantEmoji: {
    position: 'absolute',
    bottom: -15,
    right: -15,
    fontSize: 90,
  },
});
