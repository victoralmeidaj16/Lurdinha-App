import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated as RNAnimated } from 'react-native';
import { Bell } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AvatarCircle from '../AvatarCircle';
import LurdinhaBrandIcon from '../LurdinhaBrandIcon';
import { fontStyles } from '../../theme';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

export default function HeroSection({ userData, navigation, notificationCount = 0 }) {
  const greeting = getGreeting();
  const firstName = (userData?.displayName || 'Jogador').split(' ')[0];
  const waveAnim = useRef(new RNAnimated.Value(0)).current;

  // Example subtext, could be dynamic depending on feedEvents length
  const subtext = notificationCount > 0
    ? `${notificationCount} novas atualizações desde a última vez`
    : `O que vamos jogar hoje?`;

  useEffect(() => {
    RNAnimated.sequence([
      RNAnimated.timing(waveAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
      RNAnimated.timing(waveAnim, { toValue: -1, duration: 160, useNativeDriver: true }),
      RNAnimated.timing(waveAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
      RNAnimated.timing(waveAnim, { toValue: -1, duration: 160, useNativeDriver: true }),
      RNAnimated.timing(waveAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [waveAnim]);

  const waveRotate = waveAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-18deg', '0deg', '18deg'],
  });

  return (
    <View style={styles.wrapper}>
      {/* ── Header ──────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.greetingHeaderLeft}>
          <TouchableOpacity
            onPress={() => navigation?.navigate?.('profile')}
            activeOpacity={0.85}
            style={styles.avatarBorder}
          >
            <AvatarCircle
              name={userData?.displayName || 'U'}
              size={54}
              photoURL={userData?.photoURL}
            />
          </TouchableOpacity>

          <View style={styles.headerGreetingCopy}>
            <View style={styles.headerGreetingRow}>
              <Text style={styles.headerGreetingHeadline} numberOfLines={1}>
                {greeting}, {firstName}
              </Text>
              <RNAnimated.Text
                style={[
                  styles.waveEmoji,
                  { transform: [{ rotate: waveRotate }, { scale: waveAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [1.06, 1, 1.06] }) }] },
                ]}
              >
                👋
              </RNAnimated.Text>
            </View>
            <Text style={styles.headerGreetingMuted} numberOfLines={1}>
              {subtext}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bellBtn}
          activeOpacity={0.8}
          onPress={() => navigation?.navigate?.('Notifications')}
        >
          <Bell size={24} color="#9CA3AF" />
          {/* Badge */}
          {notificationCount > 0 && (
            <View style={styles.bellBadge} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Brand ─────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(60).springify().damping(18)} style={styles.greetingBlock}>
        <View style={styles.brandHero}>
          <View style={styles.brandGlow} />
          <LurdinhaBrandIcon size={104} style={styles.brandIcon} />
          <View style={styles.brandCopy}>
            <Text style={styles.brandName}>Lurdinha</Text>
            <Text style={styles.brandTagline}>jogos, palpites e ranking da galera</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 12,
  },
  greetingHeaderLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBorder: {
    padding: 1,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  headerGreetingCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerGreetingHeadline: {
    flexShrink: 1,
    fontSize: 21,
    lineHeight: 27,
    color: '#FFFFFF',
    ...fontStyles.headingBold,
  },
  waveEmoji: {
    fontSize: 22,
  },
  headerGreetingMuted: {
    fontSize: 13,
    color: '#9CA3AF',
    ...fontStyles.regular,
    marginTop: 2,
  },
  bellBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#09090B',
  },

  // ── Greeting
  greetingBlock: {
    marginBottom: 26,
  },
  brandHero: {
    minHeight: 120,
    paddingVertical: 8,
    paddingRight: 4,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    position: 'relative',
  },
  brandGlow: {
    position: 'absolute',
    left: -18,
    top: 6,
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(168,85,247,0.1)',
  },
  brandIcon: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  brandCopy: {
    flex: 1,
    minWidth: 0,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    ...fontStyles.headingBold,
  },
  brandTagline: {
    color: '#C4B5FD',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 4,
  },
});
