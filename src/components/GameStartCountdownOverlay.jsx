import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import LurdinhaBrandIcon from './LurdinhaBrandIcon';

export const GAME_START_STEP_MS = 780;
export const GAME_START_NAV_DELAY_MS = GAME_START_STEP_MS * 4 + 260;

export default function GameStartCountdownOverlay({ phase }) {
  const glowScale = useSharedValue(0.9);
  const glowOpacity = useSharedValue(0.34);

  useEffect(() => {
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 760 }),
        withTiming(0.98, { duration: 760 })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.52, { duration: 760 }),
        withTiming(0.22, { duration: 760 })
      ),
      -1,
      true
    );
  }, [glowOpacity, glowScale]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  if (phase === null || phase === undefined) return null;

  const isMascot = phase === 'mascot';

  return (
    <Animated.View
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(180)}
      style={styles.overlay}
      pointerEvents="auto"
    >
      <LinearGradient
        colors={['#050507', '#101014', '#1B1031']}
        style={StyleSheet.absoluteFill}
      />
      {!isMascot ? (
        <Animated.View style={[styles.glow, glowStyle]} />
      ) : null}

      {isMascot ? (
        <Animated.View
          key="mascot"
          entering={ZoomIn.springify().damping(11).stiffness(170)}
          exiting={ZoomOut.duration(180)}
          style={styles.mascotWrap}
        >
          <View pointerEvents="none" style={styles.mascotRing} />
          <LurdinhaBrandIcon size={176} style={styles.mascotIcon} />
          <Text style={styles.mascotText}>VALENDO!</Text>
        </Animated.View>
      ) : (
        <Animated.View
          key={String(phase)}
          entering={ZoomIn.springify().damping(13).stiffness(260)}
          exiting={ZoomOut.duration(180)}
          style={styles.numberWrap}
        >
          <View pointerEvents="none" style={styles.numberRing} />
          <Text style={styles.countdownText}>{phase}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 224,
    height: 224,
    borderRadius: 112,
    backgroundColor: 'rgba(139,92,246,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(196,181,253,0.44)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 18,
  },
  numberWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: 'rgba(196,181,253,0.42)',
    backgroundColor: 'transparent',
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 126,
    fontWeight: '800',
    letterSpacing: 0,
    textShadowColor: 'rgba(196,181,253,0.82)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  mascotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotRing: {
    position: 'absolute',
    width: 214,
    height: 214,
    borderRadius: 107,
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: 'rgba(196,181,253,0.62)',
  },
  mascotIcon: {
    borderWidth: 4,
    borderColor: '#8B5CF6',
    shadowOpacity: 0.28,
    shadowRadius: 18,
  },
  mascotText: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 22,
    textShadowColor: '#8B5CF6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
});
