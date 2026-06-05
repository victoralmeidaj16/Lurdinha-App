import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated as RNAnimated } from 'react-native';
import { Bell } from 'lucide-react-native';
import AvatarCircle from '../AvatarCircle';
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
              <Text style={styles.headerGreetingKicker} numberOfLines={1}>
                {greeting}
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
            <Text style={styles.headerUserName} numberOfLines={1}>
              {firstName}
            </Text>
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
  headerGreetingKicker: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 17,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  headerUserName: {
    fontSize: 18,
    lineHeight: 23,
    color: '#FFFFFF',
    ...fontStyles.headingBold,
    marginTop: 1,
  },
  waveEmoji: {
    fontSize: 17,
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

});
