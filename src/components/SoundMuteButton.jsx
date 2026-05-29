import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Volume2, VolumeX } from 'lucide-react-native';
import AnimatedPressable from './AnimatedPressable';
import {
  isSoundMuted,
  subscribeToSoundMute,
  toggleSoundMuted,
} from '../utils/sounds';

export default function SoundMuteButton({ compact = false }) {
  const [muted, setMuted] = useState(isSoundMuted());
  const Icon = muted ? VolumeX : Volume2;

  useEffect(() => subscribeToSoundMute(setMuted), []);

  return (
    <AnimatedPressable
      style={[styles.button, compact && styles.buttonCompact]}
      onPress={() => setMuted(toggleSoundMuted())}
      haptic="light"
      activeScale={0.92}
      accessibilityRole="button"
      accessibilityLabel={muted ? 'Ativar sons' : 'Silenciar sons'}
    >
      <Icon size={compact ? 16 : 18} color={muted ? '#A1A1AA' : '#C4B5FD'} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(36, 36, 36, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: {
    width: 34,
    height: 34,
    borderRadius: 12,
  },
});
