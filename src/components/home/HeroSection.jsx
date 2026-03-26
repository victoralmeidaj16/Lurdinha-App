import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import AvatarCircle from '../../components/AvatarCircle';
import { colors } from '../../theme';

export default function HeroSection({ userData, scaleAnim }) {
  return (
    <View style={styles.heroContainer}>
      <View style={styles.heroHeader}>
        <View style={styles.heroTextContainer}>
          <Text style={styles.heroOlá}>Olá 👋</Text>
          <Text style={styles.heroName}>{userData?.displayName || 'Usuário'}</Text>
        </View>
        <View style={styles.heroAvatarContainer}>
          <AvatarCircle
            name={userData?.displayName || 'Usuário'}
            size={40}
            photoURL={userData?.photoURL}
            style={styles.heroAvatar}
          />
        </View>
      </View>

      <View style={styles.logoContainer}>
        <Animated.Image
          source={require('../../../assets/logo.png')}
          style={[styles.logo, { transform: [{ scale: scaleAnim }] }]}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroOlá: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textAlt,
    marginBottom: 6,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textLight,
    letterSpacing: 0.3,
  },
  heroAvatarContainer: {
    position: 'relative',
    marginLeft: 16,
  },
  heroAvatar: {
    shadowColor: colors.primaryMuted,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    paddingVertical: 24,
  },
  logo: {
    width: 200,
    height: 200,
  },
});
