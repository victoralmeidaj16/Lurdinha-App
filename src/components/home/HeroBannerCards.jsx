/**
 * HeroBannerCards
 * ─────────────────────────────────────────────────────────────
 * Carrossel horizontal de banners premium.
 *
 * ✦ AJUSTE DE IMAGEM POR SLIDE:
 *   Cada card possui um botão de engrenagem "⚙️" no canto superior direito.
 *   Ao clicar, abre um painel interativo de ajuste fino:
 *     - Botões ▲ ▼ ◀ ▶ para mover a imagem (top / left)
 *     - Botões W+ W- para ajustar a largura (width)
 *     - Botões H+ H- para ajustar a altura (height)
 *     - Copie o código gerado e substitua no array BANNERS abaixo.
 *
 * ✦ PERSISTÊNCIA AUTOMÁTICA:
 *   As edições são salvas automaticamente no AsyncStorage para evitar
 *   perda de dados ao recarregar (Reload) o app!
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography } from '../../theme';
import { INTERNAL_TEST_FEATURES_ENABLED } from '../../utils/internalFeatures';

const { width: W } = Dimensions.get('window');
const CARD_W = W - 48;
const CARD_H = 160;
const CARD_GAP = 12;

const STORAGE_KEY_PREFIX = '@lurdinha:bannerStyle:';

// ─── BANNERS — edite imageStyle por slide aqui ───────────────
const BANNERS = [
  {
    id: 'ranking',
    image: require('../../../assets/2.png'),
    badge: '🏆 Ranking',
    badgeColor: '#FFB800',
    title: 'Quem vai\ndominar o pódio?',
    subtitle: 'Jogue, acumule pontos e suba no ranking do grupo.',
    accentLeft: 'rgba(8,5,20,0.93)',
    accentMid: 'rgba(12,8,30,0.70)',
    imageStyle: { top: -130, left: -280, width: CARD_W * 2.35, height: CARD_H * 2.7 },
  },
  {
    id: 'friends',
    image: require('../../../assets/3.png'),
    badge: '😂 Caos garantido',
    badgeColor: '#A78BFA',
    title: 'Jogue com\nsua galera.',
    subtitle: 'Reações, emojis e momentos que ninguém esquece.',
    accentLeft: 'rgba(6,4,18,0.93)',
    accentMid: 'rgba(10,6,28,0.65)',
    imageStyle: { top: -130, left: -310, width: CARD_W * 2.35, height: CARD_H * 2.7 },
  },
  {
    id: 'night',
    image: require('../../../assets/4.png'),
    badge: '👑 Modo Night',
    badgeColor: '#8B5CF6',
    title: 'Noite de\njogos épica.',
    subtitle: 'Crie uma sala e chame todo mundo para uma rodada.',
    accentLeft: 'rgba(5,4,16,0.94)',
    accentMid: 'rgba(8,5,22,0.62)',
    imageStyle: { top: -130, left: -300, width: CARD_W * 2.35, height: CARD_H * 2.7 },
  },
  {
    id: 'lurdinha',
    image: require('../../../assets/5.png'),
    badge: '💛 Lurdinha',
    badgeColor: '#FF6B35',
    title: 'A queen\nde todas as rodadas.',
    subtitle: 'A mascote que vai te surpreender — e humilhar.',
    accentLeft: 'rgba(8,5,15,0.94)',
    accentMid: 'rgba(12,7,20,0.60)',
    imageStyle: { top: -135, left: -320, width: CARD_W * 2.35, height: CARD_H * 2.7 },
  },
];

// ─── BannerCard ───────────────────────────────────────────────
function BannerCard({ item, index, scrollX }) {
  const [isEditing, setIsEditing] = useState(false);
  const [styleState, setStyleState] = useState({
    top: item.imageStyle.top,
    left: item.imageStyle.left,
    width: Math.round(item.imageStyle.width),
    height: Math.round(item.imageStyle.height),
  });

  // Carregar do AsyncStorage ao montar
  useEffect(() => {
    const loadSavedStyle = async () => {
      if (!INTERNAL_TEST_FEATURES_ENABLED) {
        return;
      }
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY_PREFIX + item.id);
        if (saved) {
          setStyleState(JSON.parse(saved));
        }
      } catch (err) {
        console.warn('Erro ao carregar estilo do banner:', err);
      }
    };
    loadSavedStyle();
  }, [item.id]);

  const saveStyle = async (newStyle) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_PREFIX + item.id, JSON.stringify(newStyle));
    } catch (err) {
      console.warn('Erro ao salvar estilo do banner:', err);
    }
  };

  const resetToDefault = async () => {
    const defaults = {
      top: item.imageStyle.top,
      left: item.imageStyle.left,
      width: Math.round(item.imageStyle.width),
      height: Math.round(item.imageStyle.height),
    };
    setStyleState(defaults);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_PREFIX + item.id);
    } catch (err) {
      console.warn('Erro ao resetar estilo do banner:', err);
    }
  };

  const inputRange = [
    (index - 1) * (CARD_W + CARD_GAP),
    index * (CARD_W + CARD_GAP),
    (index + 1) * (CARD_W + CARD_GAP),
  ];

  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.96, 1, 0.96],
    extrapolate: 'clamp',
  });

  const adjust = (key, amount) => {
    const updated = {
      ...styleState,
      [key]: Math.round(styleState[key] + amount),
    };
    setStyleState(updated);
    saveStyle(updated); // salva automaticamente a cada clique
  };

  return (
    <Animated.View style={[styles.cardOuter, { transform: [{ scale }] }]}>
      <View style={styles.card}>
        {/* Hero image — usando o estado de ajuste fino */}
        <Image
          source={item.image}
          style={[
            styles.heroImage,
            {
              top: styleState.top,
              left: styleState.left,
              width: styleState.width,
              height: styleState.height,
            },
          ]}
          resizeMode="cover"
        />

        {/* Scrim esquerda → transparente */}
        <LinearGradient
          colors={[item.accentLeft, item.accentMid, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          locations={[0, 0.50, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Vinheta inferior */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          locations={[0.45, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Texto — lado esquerdo (escondido ou semi-transparente se editando para dar espaço) */}
        <View style={[styles.textLayer, isEditing && { opacity: 0.25 }]} pointerEvents="none">
          <View style={[styles.badge, { borderColor: item.badgeColor + '55' }]}>
            <Text style={[styles.badgeText, { color: item.badgeColor }]}>
              {item.badge}
            </Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>{item.subtitle}</Text>
        </View>

        {/* Botão de abrir ajuste (canto superior direito) */}
        {INTERNAL_TEST_FEATURES_ENABLED && !isEditing ? (
          <TouchableOpacity
            style={styles.editToggleBtn}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.editToggleText}>⚙️ Ajustar</Text>
          </TouchableOpacity>
        ) : null}

        {INTERNAL_TEST_FEATURES_ENABLED && isEditing ? (
          /* Painel de Controle de Ajuste Fino */
          <View style={styles.controlPanel}>
            {/* Controles de Posição (Setas) */}
            <View style={styles.dpadSection}>
              <Text style={styles.controlLabel}>Posição</Text>
              <View style={styles.dpad}>
                <View style={styles.dpadRow}>
                  <TouchableOpacity style={styles.btn} onPress={() => adjust('top', -5)}>
                    <Text style={styles.btnText}>▲</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.dpadRowSide}>
                  <TouchableOpacity style={styles.btn} onPress={() => adjust('left', -5)}>
                    <Text style={styles.btnText}>◀</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btn} onPress={() => adjust('left', 5)}>
                    <Text style={styles.btnText}>▶</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.dpadRow}>
                  <TouchableOpacity style={styles.btn} onPress={() => adjust('top', 5)}>
                    <Text style={styles.btnText}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Controles de Tamanho (+ e -) */}
            <View style={styles.sizeSection}>
              <Text style={styles.controlLabel}>Tamanho</Text>
              <View style={styles.sizeRow}>
                <Text style={styles.sizeLabel}>W:</Text>
                <TouchableOpacity style={styles.smallBtn} onPress={() => adjust('width', -10)}>
                  <Text style={styles.btnText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallBtn} onPress={() => adjust('width', 10)}>
                  <Text style={styles.btnText}>+</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.sizeRow}>
                <Text style={styles.sizeLabel}>H:</Text>
                <TouchableOpacity style={styles.smallBtn} onPress={() => adjust('height', -10)}>
                  <Text style={styles.btnText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallBtn} onPress={() => adjust('height', 10)}>
                  <Text style={styles.btnText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Botão de resetar */}
              <TouchableOpacity style={styles.resetBtn} onPress={resetToDefault}>
                <Text style={styles.resetBtnText}>Resetar</Text>
              </TouchableOpacity>
            </View>

            {/* Botão Fechar / Salvar */}
            <TouchableOpacity style={styles.doneBtn} onPress={() => setIsEditing(false)}>
              <Text style={styles.doneBtnText}>✓</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Exibição das coordenadas (copiável / visível) */}
        {INTERNAL_TEST_FEATURES_ENABLED && isEditing ? (
          <View style={styles.coordsOverlay}>
            <Text style={styles.coordsText} selectable={true}>
              {`imageStyle: { top: ${styleState.top}, left: ${styleState.left}, width: ${styleState.width}, height: ${styleState.height} }`}
            </Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ─── Dots ─────────────────────────────────────────────────────
function Dots({ total, scrollX }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => {
        const inputRange = [
          (i - 1) * (CARD_W + CARD_GAP),
          i * (CARD_W + CARD_GAP),
          (i + 1) * (CARD_W + CARD_GAP),
        ];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [5, 18, 5],
          extrapolate: 'clamp',
        });
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={i}
            style={[styles.dot, { width: dotWidth, opacity }]}
          />
        );
      })}
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function HeroBannerCards({ style }) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const mountAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(mountAnim, {
      toValue: 1,
      damping: 16,
      stiffness: 120,
      useNativeDriver: true,
    }).start();
  }, []);

  const mountTranslate = mountAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        style,
        { opacity: mountAnim, transform: [{ translateY: mountTranslate }] },
      ]}
    >
      {/* Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Descubra os modos</Text>
        <Text style={styles.sectionSub}>Deslize para ver</Text>
      </View>

      {/* Cards */}
      <Animated.FlatList
        data={BANNERS}
        horizontal
        pagingEnabled={false}
        snapToInterval={CARD_W + CARD_GAP}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <BannerCard item={item} index={index} scrollX={scrollX} />
        )}
      />

      {/* Dots */}
      <Dots total={BANNERS.length} scrollX={scrollX} />
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: { marginBottom: 8 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    color: colors.textPrimary,
    fontFamily: typography.headingFonts.bold,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: typography.fonts.medium,
  },

  listContent: {
    paddingHorizontal: 24,
    gap: CARD_GAP,
  },

  cardOuter: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 14,
  },
  card: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#0C0814',
  },

  heroImage: {
    position: 'absolute',
  },

  textLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '60%',
    justifyContent: 'center',
    paddingLeft: 18,
    paddingRight: 8,
    gap: 5,
  },

  badge: {
    alignSelf: 'flex-start',
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.35)',
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: typography.fonts.extrabold,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 20,
    lineHeight: 23,
    color: '#FFFFFF',
    fontFamily: typography.headingFonts.extrabold,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(255,255,255,0.60)',
    fontFamily: typography.fonts.medium,
  },

  // Botão de Ajustar
  editToggleBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(139,92,246,0.85)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  editToggleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: typography.fonts.bold,
  },

  // Painel de Controle de Ajuste Fino
  controlPanel: {
    position: 'absolute',
    top: 10,
    right: 10,
    bottom: 10,
    width: 175,
    backgroundColor: 'rgba(10, 8, 20, 0.92)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    flexDirection: 'row',
    padding: 8,
    gap: 8,
  },
  dpadSection: {
    flex: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeSection: {
    flex: 0.9,
    justifyContent: 'center',
    gap: 4,
  },
  controlLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
    marginBottom: 4,
  },
  dpad: {
    alignItems: 'center',
    gap: 3,
  },
  dpadRow: {
    alignItems: 'center',
  },
  dpadRowSide: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    width: 26,
    height: 26,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtn: {
    width: 20,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: typography.fonts.bold,
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  sizeLabel: {
    color: '#FFF',
    fontSize: 9,
    fontFamily: typography.fonts.bold,
    width: 12,
  },
  resetBtn: {
    marginTop: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 4,
    paddingVertical: 3,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#FCA5A5',
    fontSize: 9,
    fontFamily: typography.fonts.bold,
  },
  doneBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    backgroundColor: '#8B5CF6',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  doneBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Overlay de Coordenadas
  coordsOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: W * 0.45,
  },
  coordsText: {
    color: '#34D399',
    fontSize: 8.5,
    fontFamily: 'Courier',
  },

  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 12,
  },
  dot: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
});
