import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
  FlatList,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, fontStyles } from '../theme';

const { width: W, height: H } = Dimensions.get('window');

// ─── Slide Data ───────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 'welcome',
    headline: 'A festa\ncomeça aqui.',
    sub: 'Jogos, amigos e momentos que você não vai esquecer.',
    accent: '#8B5CF6',
    accentGlow: 'rgba(139,92,246,0.55)',
    heroBg: require('../../assets/3.png'),
    cards: [],
  },
  {
    id: 'games',
    headline: 'Jogos que\nexplodem grupos.',
    sub: 'Modo impostor, quiz, draw — cada rodada é um caos bom.',
    accent: '#FF6B35',
    accentGlow: 'rgba(255,107,53,0.55)',
    heroBg: require('../../assets/4.png'),
    cards: [],
  },
  {
    id: 'cta',
    headline: 'Seu grupo\nvai te chamar.',
    sub: 'Cria sua conta grátis e entra na rodada.',
    accent: '#A78BFA',
    accentGlow: 'rgba(167,139,250,0.55)',
    heroBg: require('../../assets/5.png'),
    cards: [],
  },
];

// ─── Tilted Card Layer ─────────────────────────────────────────────────────────
function CardCollage({ cards, animProgress }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {cards.map((card, i) => {
        const translateY = animProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [40 + i * 16, 0],
        });
        const opacity = animProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.cardWrapper,
              {
                top: card.top,
                left: card.left,
                zIndex: card.z,
                transform: [
                  { rotate: card.rotate },
                  { scale: card.scale },
                  { translateY },
                ],
                opacity,
              },
            ]}
          >
            <Image source={card.img} style={styles.mockupCard} resizeMode="cover" />
            {/* depth shadow overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.45)']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}

// ─── Single Slide ──────────────────────────────────────────────────────────────
function Slide({ item, index, currentIndex, onFinish }) {
  const animProgress = useRef(new Animated.Value(0)).current;
  const headlineAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentIndex === index) {
      animProgress.setValue(0);
      headlineAnim.setValue(0);
      ctaAnim.setValue(0);

      Animated.sequence([
        Animated.timing(animProgress, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(headlineAnim, {
            toValue: 1,
            damping: 14,
            stiffness: 140,
            useNativeDriver: true,
          }),
          Animated.timing(ctaAnim, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [currentIndex]);

  const headlineTranslate = headlineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [32, 0],
  });
  const ctaTranslate = ctaAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });
  const isLast = index === SLIDES.length - 1;

  return (
    <View style={[styles.slide]}>
      {/* Dark base */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#07070B' }]} />

      {/* Hero background image — full bleed */}
      {item.heroBg && (
        <Image
          source={item.heroBg}
          style={styles.heroBgImage}
          resizeMode="cover"
        />
      )}

      {/* Radial glow bloom */}
      <View
        style={[
          styles.glowBloom,
          {
            backgroundColor: item.accentGlow,
            top: H * 0.08,
            left: W * 0.1,
          },
        ]}
      />
      <View
        style={[
          styles.glowBloom,
          {
            backgroundColor: item.accentGlow,
            width: W * 0.6,
            height: W * 0.6,
            top: H * 0.22,
            left: W * 0.35,
            opacity: 0.25,
          },
        ]}
      />

      {/* Card collage */}
      <CardCollage cards={item.cards} animProgress={animProgress} />

      {/* Bottom scrim — makes text readable */}
      <LinearGradient
        colors={[
          'transparent',
          'rgba(7,7,11,0.15)',
          'rgba(7,7,11,0.72)',
          'rgba(7,7,11,0.96)',
          '#07070B',
        ]}
        locations={[0.0, 0.32, 0.52, 0.72, 1.0]}
        style={styles.scrim}
      />

      {/* Content */}
      <View style={styles.contentArea}>
        {/* Logo pill */}
        <View style={styles.logoPill}>
          <Image source={require('../../assets/logo.png')} style={styles.logoSmall} />
          <Text style={styles.logoPillText}>lurdinha</Text>
        </View>

        {/* Headline */}
        <Animated.Text
          style={[
            styles.headline,
            {
              opacity: headlineAnim,
              transform: [{ translateY: headlineTranslate }],
            },
          ]}
        >
          {item.headline}
        </Animated.Text>

        {/* Sub */}
        <Animated.Text
          style={[
            styles.sub,
            {
              opacity: headlineAnim,
              transform: [{ translateY: headlineTranslate }],
            },
          ]}
        >
          {item.sub}
        </Animated.Text>

        {/* CTA Pill — only on last slide */}
        {isLast ? (
          <Animated.View
            style={[
              styles.ctaStack,
              {
                opacity: ctaAnim,
                transform: [{ translateY: ctaTranslate }],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.ctaPrimary, { shadowColor: item.accent }]}
              activeOpacity={0.88}
              onPress={() => onFinish({ isLogin: false })}
            >
              <LinearGradient
                colors={[item.accent, item.accent + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaPrimaryText}>Criar conta grátis ✦</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ctaGhost}
              activeOpacity={0.7}
              onPress={() => onFinish({ isLogin: true })}
            >
              <Text style={styles.ctaGhostText}>Já tenho uma conta</Text>
            </TouchableOpacity>

            <Text style={styles.legalText}>
              Ao continuar, você concorda com os{' '}
              <Text style={{ color: 'rgba(255,255,255,0.5)' }}>Termos</Text> e{' '}
              <Text style={{ color: 'rgba(255,255,255,0.5)' }}>Privacidade</Text>.
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

// ─── Dots ──────────────────────────────────────────────────────────────────────
function Dots({ total, current, accent }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === current
              ? { width: 22, backgroundColor: accent }
              : { width: 6, backgroundColor: 'rgba(255,255,255,0.2)' },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Main Onboarding ───────────────────────────────────────────────────────────
export default function OnboardingScreen({ onFinish }) {
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isLast = currentIndex === SLIDES.length - 1;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const accent = SLIDES[currentIndex]?.accent ?? colors.primary;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Swipeable slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item, index }) => (
          <Slide
            item={item}
            index={index}
            currentIndex={currentIndex}
            onFinish={onFinish}
          />
        )}
      />

      {/* Fixed bottom nav (dots + Next button) — hidden on last slide */}
      {!isLast && (
        <View style={[styles.bottomNav, { paddingBottom: Platform.OS === 'ios' ? 48 : 32 }]}>
          <Dots total={SLIDES.length} current={currentIndex} accent={accent} />
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: accent, shadowColor: accent }]}
            activeOpacity={0.85}
            onPress={handleNext}
          >
            <Text style={styles.nextBtnText}>Próximo →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dots overlay on last slide */}
      {isLast && (
        <View style={styles.dotsOnlyRow}>
          <Dots total={SLIDES.length} current={currentIndex} accent={accent} />
        </View>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07070B',
  },
  slide: {
    width: W,
    height: H,
    overflow: 'hidden',
  },

  // ── Glow blooms ──
  // ── Hero BG image ──
  heroBgImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: W,
    height: H * 0.62,
    opacity: 0.88,
  },

  // ── Glow blooms ──
  glowBloom: {
    position: 'absolute',
    width: W * 0.75,
    height: W * 0.75,
    borderRadius: W * 0.4,
    opacity: 0.35,
    // blurRadius not available on RN views — we use opacity + size to fake soft glow
  },

  // ── Cards ──
  cardWrapper: {
    position: 'absolute',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 20,
  },
  mockupCard: {
    width: W * 0.62,
    height: H * 0.36,
    borderRadius: 24,
  },

  // ── Scrim ──
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },

  // ── Content ──
  contentArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 160 : 140,
  },
  logoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 99,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  logoSmall: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
  logoPillText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontFamily: typography.headingFonts.bold,
    letterSpacing: 0.5,
  },
  headline: {
    fontSize: 52,
    lineHeight: 56,
    color: '#FFFFFF',
    fontFamily: typography.headingFonts.extrabold,
    letterSpacing: -1.5,
    marginBottom: 14,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  sub: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.58)',
    fontFamily: typography.fonts.medium,
    letterSpacing: 0.1,
    marginBottom: 36,
  },

  // ── CTA Stack (last slide) ──
  ctaStack: {
    gap: 12,
  },
  ctaPrimary: {
    borderRadius: 99,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 16,
  },
  ctaGradient: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 99,
  },
  ctaPrimaryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: typography.headingFonts.extrabold,
    letterSpacing: 0.2,
  },
  ctaGhost: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaGhostText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    fontFamily: typography.fonts.semibold,
  },
  legalText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.28)',
    fontSize: 11,
    lineHeight: 17,
    fontFamily: typography.fonts.regular,
    marginTop: 4,
  },

  // ── Bottom nav ──
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  nextBtn: {
    borderRadius: 99,
    paddingVertical: 14,
    paddingHorizontal: 28,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: typography.fonts.extrabold,
    letterSpacing: 0.2,
  },

  // ── Dots on last slide ──
  dotsOnlyRow: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 52 : 36,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
