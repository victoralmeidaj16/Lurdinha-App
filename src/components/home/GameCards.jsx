import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ghost, Users2 } from 'lucide-react-native';

export default function GameCards() {
  const navigation = useNavigation();

  return (
    <>
      {/* Game Card - Lurdinha */}
      <Animated.View style={styles.cardWrapper}>
        <TouchableOpacity
          style={styles.gameCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('GameHome')}
        >
          <LinearGradient
            colors={['#4c1d95', '#6d28d9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Background Pattern */}
          <View style={styles.patternGhost}>
            <Ghost size={180} color="#fff" />
          </View>

          <View style={styles.cardContent}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NOVO</Text>
                </View>
                <Text style={styles.gameTypeText}>JOGO SOCIAL</Text>
              </View>
              <Text style={styles.gameTitle}>Lurdinha</Text>
              <Text style={styles.gameDescription}>
                Pense como o grupo ou leve uma Lurdinha.
              </Text>
            </View>

            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 28 }}>😈</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Game Card - Impostor Secreto */}
      <Animated.View style={styles.cardWrapper}>
        <TouchableOpacity
          style={styles.gameCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('ImpostorLobby')}
        >
          <LinearGradient
            colors={['#6d28d9', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Background Pattern */}
          <View style={styles.patternUsers}>
            <Users2 size={180} color="#fff" />
          </View>

          <View style={styles.cardContent}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NOVO</Text>
                </View>
                <Text style={styles.gameTypeImpostor}>PARTY GAME</Text>
              </View>
              <Text style={styles.gameTitleImpostor}>Impostor</Text>
              <Text style={styles.gameDescriptionImpostor}>
                Descubra quem é o farsante no grupo!
              </Text>
            </View>

            <View style={styles.iconCircle}>
              <Image
                source={require('../../../assets/logo.png')}
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
              />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 16,
    paddingHorizontal: 16, // Adjusted slightly to match HomeScreen wrapping
  },
  gameCard: {
    marginHorizontal: 4, // Was 20, but paddingHorizontal 16 covers most of it
    marginBottom: 8,
    height: 140,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  patternGhost: {
    position: 'absolute',
    right: -20,
    top: -20,
    opacity: 0.1,
  },
  patternUsers: {
    position: 'absolute',
    right: -20,
    top: -20,
    opacity: 0.1,
  },
  cardContent: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  newBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  gameTypeText: {
    color: '#e9d5ff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  gameTypeImpostor: {
    color: '#bfdbfe',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  gameTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  gameTitleImpostor: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  gameDescription: {
    color: '#ddd6fe',
    fontSize: 14,
    maxWidth: '90%',
  },
  gameDescriptionImpostor: {
    color: '#ede9fe',
    fontSize: 16,
    maxWidth: '90%',
    lineHeight: 22,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
