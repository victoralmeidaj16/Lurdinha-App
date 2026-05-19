import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { fontStyles } from '../../theme';
import { triggerImpact } from '../../utils/haptics';

export default function MainFocusCard({ event, onPress }) {
  if (!event) return null;
  const { type, data } = event;
  const handlePress = () => {
    if (!onPress) return;
    triggerImpact('medium');
    onPress();
  };

  if (type === 'live_room') {
    const playerCount = data?.playerCount || 0;

    return (
      <Animated.View entering={FadeInDown.delay(200).springify().damping(16)}>
        <TouchableOpacity onPress={handlePress} activeOpacity={0.88} style={styles.card}>
          <LinearGradient colors={['#1C0A13', '#160810', '#0F0810']} style={StyleSheet.absoluteFill} />
          <View style={[styles.ambientGlow, { backgroundColor: 'rgba(233,30,99,0.18)' }]} />

          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {playerCount === 0
                ? 'Sala esperando jogadores'
                : `${playerCount} pessoa${playerCount > 1 ? 's' : ''} jogando agora`}
            </Text>
            <View style={[styles.timeBadge, { backgroundColor: 'rgba(233,30,99,0.18)', borderColor: 'rgba(233,30,99,0.3)' }]}>
              <Text style={[styles.timeBadgeText, { color: '#FB7185' }]}>AO VIVO</Text>
            </View>
          </View>

          <Text style={styles.inlineStatsText} numberOfLines={1}>
            Entre agora e puxe a próxima rodada
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={['#E91E63', '#F43F5E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: '100%' }]}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.ctaButton} onPress={handlePress} activeOpacity={0.85}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGrad}
            >
              <Text style={styles.ctaButtonText}>{data.isOpen ? 'Entrar agora' : 'Ver sala'}</Text>
            </LinearGradient>
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

    let maxVotes = 0;
    const voteCounts = {};
    Object.values(votes).forEach(vote => {
      voteCounts[vote] = (voteCounts[vote] || 0) + 1;
      if (voteCounts[vote] > maxVotes) maxVotes = voteCounts[vote];
    });

    const barWidthPercentage = votesCount > 0 ? Math.round((maxVotes / votesCount) * 100) : 0;
    const barWidth = `${barWidthPercentage}%`;
    const subtitle = votesCount === 0 ? 'Ninguém respondeu ainda' : `${votesCount} pessoa${votesCount !== 1 ? 's' : ''} já deram palpite`;
    const progressText = votesCount > 0 ? 'das pessoas escolheram a opção mais votada' : 'Seja o primeiro a votar!';

    return (
      <Animated.View entering={FadeInDown.delay(200).springify().damping(16)}>
        <TouchableOpacity onPress={handlePress} activeOpacity={0.88} style={styles.card}>
          <LinearGradient colors={['#130F1C', '#0F0C18', '#0C0A14']} style={StyleSheet.absoluteFill} />
          <View style={[styles.ambientGlow, { backgroundColor: 'rgba(139,92,246,0.18)' }]} />

          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {question}
            </Text>
            {!isExpired && (
              <View style={[styles.timeBadge, { backgroundColor: 'rgba(139,92,246,0.18)', borderColor: 'rgba(139,92,246,0.3)' }]}>
                <Text style={[styles.timeBadgeText, { color: '#A78BFA' }]}>EM {data.timeLeft.toUpperCase()}</Text>
              </View>
            )}
          </View>

          <Text style={styles.inlineStatsText} numberOfLines={1}>
            {subtitle}
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={['#8B5CF6', '#A78BFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: barWidth }]}
              />
            </View>
            <Text style={styles.progressText}>
              {votesCount > 0 ? (
                <>
                  <Text style={{ fontWeight: 'bold', color: '#FFFFFF' }}>{barWidth}</Text>{' '}{progressText}
                </>
              ) : (
                progressText
              )}
            </Text>
          </View>

          <TouchableOpacity style={styles.ctaButton} onPress={handlePress} activeOpacity={0.85}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGrad}
            >
              <Text style={styles.ctaButtonText}>{isExpired ? 'Ver resultado' : 'Responder agora'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.giantEmoji, { transform: [{ rotate: '-10deg' }] }]}>👑</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Fallback / default CTA
  if (type === 'default_cta' || !['live_room', 'pending_quiz'].includes(type)) {
    return (
      <Animated.View entering={FadeInDown.delay(200).springify().damping(16)}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.card}>
          <LinearGradient colors={['#14101F', '#111119', '#0D0D14']} style={StyleSheet.absoluteFill} />
          <View style={[styles.ambientGlow, { backgroundColor: 'rgba(139,92,246,0.15)' }]} />

          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              O que vai rolar agora?
            </Text>
            <View style={[styles.timeBadge, { backgroundColor: 'rgba(139,92,246,0.18)', borderColor: 'rgba(139,92,246,0.3)' }]}>
              <Text style={[styles.timeBadgeText, { color: '#A78BFA' }]}>JOGAR AGORA</Text>
            </View>
          </View>

          <Text style={styles.inlineStatsText} numberOfLines={1}>
            Abra uma sala ou crie uma disputa para o grupo
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={['#8B5CF6', '#A78BFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: '40%' }]}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.ctaButton} onPress={onPress} activeOpacity={0.85}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGrad}
            >
              <Text style={styles.ctaButtonText}>Criar nova sala</Text>
            </LinearGradient>
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
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.18)',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 10,
  },
  ambientGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
  },
  timeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  inlineStatsText: {
    fontSize: 13,
    color: '#7D7989',
    fontWeight: '500',
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 20,
    width: '100%',
    paddingRight: 60,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#7D7989',
    fontWeight: '500',
  },
  ctaButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaGrad: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  giantEmoji: {
    position: 'absolute',
    bottom: -15,
    right: -15,
    fontSize: 90,
  },
});
