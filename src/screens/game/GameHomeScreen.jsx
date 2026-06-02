import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  Image,
  TouchableOpacity,
  PanResponder,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowRight, Info, Minus, Plus, RotateCcw, Save, SlidersHorizontal, TestTube2, X } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedPressable from '../../components/AnimatedPressable';
import SoundMuteButton from '../../components/SoundMuteButton';
import { INTERNAL_TEST_FEATURES_ENABLED } from '../../utils/internalFeatures';
import { typography } from '../../theme';
import { playSound } from '../../utils/sounds';

const { width: W } = Dimensions.get('window');

const DEFAULT_NIGHT_IMAGE_STYLE = {
  top: -15,
  left: 70,
  width: (W - 48) * 0.9,
  height: 160 + 30,
};

const GAME_MODES = [
  {
    key: 'lurdinha',
    title: 'Lurdinha',
    subtitle: 'Responda igual à maioria e sobreviva',
    emoji: '😈',
    route: 'CreateRoom',
    params: { gameType: 'lurdinha' },
    color: '#7C3AED',
    image: require('../../../assets/lurdinha_card.png'),
    noFrame: true,
    info: {
      headline: 'Acerte como a galera pensa.',
      body: 'Cada rodada tem uma pergunta. Você ganha quando sua resposta combina com a maioria do grupo.',
      bestFor: 'Bom para descobrir padrões, manias e consensos engraçados da turma.',
    },
  },
  {
    key: 'draw',
    title: 'Desenho',
    subtitle: 'Desenhe ao vivo e adivinhe a palavra',
    emoji: '✏️',
    route: 'CreateRoom',
    params: { gameType: 'draw' },
    color: '#10B981',
    image: require('../../../assets/draw_card.png'),
    noFrame: true,
    info: {
      headline: 'Desenhe rápido, adivinhe ao vivo.',
      body: 'Um jogador recebe a palavra e desenha enquanto os outros tentam acertar antes do tempo acabar.',
      bestFor: 'Ideal para energia rápida, risada visual e competição direta.',
    },
  },
  {
    key: 'obvious_mind',
    title: 'Na Minha Cabeça Era Óbvio',
    subtitle: 'Tente pensar igual ao alvo da rodada',
    emoji: '🧠',
    route: 'CreateRoom',
    params: { gameType: 'obvious_mind' },
    color: '#F59E0B',
    image: require('../../../assets/obvious_mind_card.png'),
    noFrame: true,
    info: {
      headline: 'Tente entrar na cabeça de alguém.',
      body: 'Um alvo responde em segredo. O resto tenta adivinhar o que essa pessoa escolheria.',
      bestFor: 'Bom para afinidade, revelações leves e descobrir quem pensa parecido.',
    },
  },
  {
    key: 'most_likely',
    title: 'Mais Provável',
    subtitle: 'Vote em quem combina com a pergunta',
    emoji: '👀',
    route: 'CreateRoom',
    params: { gameType: 'most_likely' },
    color: '#3B82F6',
    image: require('../../../assets/most_likely_card.png'),
    noFrame: true,
    info: {
      headline: 'O grupo vota em quem mais combina.',
      body: 'A pergunta aparece e cada pessoa escolhe alguém do grupo. O resultado revela a percepção coletiva.',
      bestFor: 'Funciona bem para zoeira leve, identificação e pequenas polêmicas sociais.',
    },
  },
  {
    key: 'secret',
    title: 'Telefone Sem Fio',
    subtitle: 'Frase, desenho, interpretação em cadeia',
    emoji: '📖',
    route: 'CreateRoom',
    params: { gameType: 'secret' },
    color: '#F43F5E',
    image: require('../../../assets/secret_card.png'),
    noFrame: true,
    info: {
      headline: 'Uma cadeia que vai ficando absurda.',
      body: 'Uma frase vira desenho, depois interpretação, e assim por diante até a revelação final.',
      bestFor: 'Perfeito para caos leve e comparações engraçadas entre começo e fim.',
    },
  },
  {
    key: 'tier_list',
    title: 'Tier List da Galera',
    subtitle: 'Classifique o grupo e veja o veredito coletivo',
    emoji: '🏆',
    route: 'CreateRoom',
    params: { gameType: 'tier_list' },
    color: '#FF6B35',
    noFrame: false,
    info: {
      headline: 'Quem é nota 5 no grupo?',
      body: 'Cada pessoa classifica todos os outros de 5 a 1. O app revela a média coletiva e você descobre como a galera te vê.',
      bestFor: 'Perfeito para grupos que querem zoeira leve, rankings absurdos e screenshots compartilháveis.',
    },
  },
  {
    key: 'impostor',
    title: 'Impostor',
    subtitle: 'Descubra quem está blefando no grupo',
    emoji: '🎭',
    route: 'CreateRoom',
    params: { gameType: 'impostor' },
    color: '#DC2626',
    image: require('../../../assets/impostor_card.png'),
    noFrame: true,
    info: {
      headline: 'Descubra quem está blefando.',
      body: 'Todos recebem uma palavra secreta, menos o impostor. Deem dicas, votem no suspeito e descubram quem está enganando o grupo.',
      bestFor: 'Ótimo para grupos que curtem dedução social, tensão e blefe.',
    },
  },
];

const OFFLINE_GAME_MODES = [
  {
    key: 'impostor_local',
    title: 'Impostor (Local)',
    subtitle: 'Jogo no mesmo aparelho',
    emoji: '🎭',
    route: 'ImpostorLobby',
    tag: 'OFFLINE',
    tagColor: '#F59E0B',
    color: '#7C3AED',
    noFrame: true,
    info: {
      headline: 'Versão offline do Impostor.',
      body: 'Passem o celular entre si. Cada um vê seu papel em segredo antes de começar a discussão.',
      bestFor: 'Bom para jogar no mesmo aparelho, sem sala online.',
    },
  },
];

const ALL_GAME_MODES = [...GAME_MODES, ...OFFLINE_GAME_MODES];
const CARD_IMAGE_EDIT_STORAGE_KEY = '@lurdinha:gameCardImageEdits';

const MODE_SYMBOL_PATTERNS = {
  lurdinha: ['?', '✓', 'A/B', 'C', '?'],
  draw: ['╱', '⌁', '✎', '⌇', '╲'],
  obvious_mind: ['?', '✓', 'A/B', 'C', '?'],
  most_likely: ['↗', '●', '↔', '◦', '✓'],
  secret: ['✎', '→', '⌁', '✦', '→'],
  tier_list: ['5', '4', '3', '2', '✓'],
  impostor: ['◉', '!', '🎭', '⌾', '!'],
  impostor_local: ['◉', '!', '🎭', '⌾', '!'],
};

const DEFAULT_SYMBOL_PATTERN = ['?', '✓', 'A/B', 'C', '?'];

const clampRotation = (value) => Math.max(-24, Math.min(24, value));
const clampScale = (value) => Math.max(0.72, Math.min(1.32, value));

const getDefaultCardImageEdit = (mode) => ({
  rotation: mode?.noFrame ? -3 : 4,
  scale: 1,
});

function RotatableCardImage({ mode, color, edit, editable, selected, onSelect, onChange }) {
  const rotationRef = useRef(edit.rotation);
  const gestureStartRotationRef = useRef(edit.rotation);

  useEffect(() => {
    rotationRef.current = edit.rotation;
  }, [edit.rotation]);

  const updateRotation = (nextRotation) => {
    const clampedRotation = clampRotation(nextRotation);
    rotationRef.current = clampedRotation;
    onChange?.({ rotation: clampedRotation });
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => editable,
    onMoveShouldSetPanResponder: (_event, gestureState) => (
      editable && (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3)
    ),
    onPanResponderGrant: () => {
      onSelect?.();
      gestureStartRotationRef.current = rotationRef.current;
    },
    onPanResponderMove: (_event, gestureState) => {
      updateRotation(gestureStartRotationRef.current + gestureState.dx / 5);
    },
    onPanResponderRelease: (_event, gestureState) => {
      if (Math.abs(gestureState.dx) < 4 && Math.abs(gestureState.dy) < 4) {
        onSelect?.();
      }
    },
  });

  const transformStyle = { transform: [{ rotate: `${edit.rotation}deg` }, { scale: edit.scale }] };
  const editableStyle = editable && selected ? styles.modeImageEditingSelected : null;

  if (!mode.image) {
    return (
      <View
        {...panResponder.panHandlers}
        style={[styles.modeEmojiBox, { borderColor: `${color}44`, shadowColor: color }, transformStyle, editableStyle]}
      >
        <Text style={styles.modeLargeEmoji}>{mode.emoji}</Text>
      </View>
    );
  }

  const imageSource = typeof mode.image === 'string' ? { uri: mode.image } : mode.image;

  if (mode.noFrame) {
    return (
      <View
        {...panResponder.panHandlers}
        style={[styles.modeImageNoFrameWrapper, transformStyle, editableStyle]}
      >
        <Image source={imageSource} style={styles.modeImageNoFrame} />
      </View>
    );
  }

  return (
    <View
      {...panResponder.panHandlers}
      style={[styles.modeImageWrapper, { shadowColor: color }, transformStyle, editableStyle]}
    >
      <Image source={imageSource} style={styles.modeImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function GameModeCard({
  mode,
  onPress,
  onInfoPress,
  delay,
  imageEdit,
  editMode,
  selected,
  onSelect,
  onImageEditChange,
}) {
  const color = mode.color || "#7C3AED";
  const symbols = MODE_SYMBOL_PATTERNS[mode.key] || DEFAULT_SYMBOL_PATTERN;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <AnimatedPressable
        style={styles.modeCard}
        haptic="medium"
        onPress={() => {
          playSound('ui_tap_soft');
          if (editMode) {
            onSelect();
          } else {
            onPress();
          }
        }}
      >
        <LinearGradient
          colors={['#2A1A50', '#3D2070']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(192,132,252,0.26)', 'rgba(167,139,250,0.10)', 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.1, y: 1 }}
          locations={[0, 0.42, 1]}
          style={styles.modeVioletGlow}
          pointerEvents="none"
        />
        <View pointerEvents="none" style={[styles.modeGlowOrb, { backgroundColor: `${color}18` }]} />
        <View pointerEvents="none" style={styles.modePatternLayer}>
          {symbols.map((symbol, index) => (
            <Text
              key={`${mode.key}-symbol-${index}`}
              style={[
                styles.modePatternSymbol,
                styles[`modePatternSymbol${index + 1}`],
                index % 2 === 0 && styles.modePatternSymbolViolet,
              ]}
            >
              {symbol}
            </Text>
          ))}
        </View>

        {/* Content Container */}
        <View style={styles.modeCardContent}>
          <View style={styles.modeNameRow}>
            <Text style={styles.modeTitle} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.55}>{mode.title}</Text>
            <AnimatedPressable
              onPress={() => {
                playSound('ui_toggle');
                onInfoPress();
              }}
              hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
              style={styles.modeTitleInfoBtn}
              haptic="light"
              activeScale={0.93}
            >
              <Info size={16} color="rgba(255,255,255,0.5)" />
            </AnimatedPressable>
          </View>
          <Text style={styles.modeSubtitle} numberOfLines={2}>
            {mode.subtitle}
          </Text>
        </View>

        {/* Visual / Right side */}
        <View style={styles.modeVisual}>
          <RotatableCardImage
            mode={mode}
            color={color}
            edit={imageEdit}
            editable={editMode}
            selected={selected}
            onSelect={onSelect}
            onChange={onImageEditChange}
          />
        </View>

        {mode.tag ? (
          <View style={[styles.modeTagBadge, { backgroundColor: `${mode.tagColor}22`, borderColor: `${mode.tagColor}55` }]}>
            <Text style={[styles.modeTagBadgeText, { color: mode.tagColor }]}>{mode.tag}</Text>
          </View>
        ) : null}
      </AnimatedPressable>
    </Animated.View>
  );
}

function GameInfoModal({ mode, onClose }) {
  const handleClose = () => {
    playSound('ui_toggle');
    onClose();
  };

  return (
    <Modal
      visible={!!mode}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View entering={FadeIn.duration(200)} style={styles.modalBackdrop}>
        <TouchableOpacity style={styles.modalDismissArea} activeOpacity={1} onPress={handleClose} />
        <Animated.View entering={SlideInDown.duration(250)} style={styles.infoModalCard}>
          <View style={styles.infoModalHeader}>
            <View style={styles.infoModalIconWrap}>
              <Text style={styles.infoModalEmoji}>{mode?.emoji}</Text>
            </View>
            <AnimatedPressable style={styles.infoModalClose} onPress={handleClose} haptic="light" activeScale={0.93}>
              <X size={18} color="rgba(255,255,255,0.72)" />
            </AnimatedPressable>
          </View>

          <Text style={styles.infoModalTitle}>{mode?.title}</Text>
          <Text style={styles.infoModalHeadline}>{mode?.info?.headline}</Text>
          <Text style={styles.infoModalBody}>{mode?.info?.body}</Text>

          <View style={styles.infoModalCallout}>
            <Text style={styles.infoModalCalloutLabel}>Melhor para</Text>
            <Text style={styles.infoModalCalloutText}>{mode?.info?.bestFor}</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default function GameHomeScreen({ navigation }) {
  const [selectedInfoMode, setSelectedInfoMode] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedModeKey, setSelectedModeKey] = useState(GAME_MODES[0]?.key);
  const [imageEdits, setImageEdits] = useState({});
  const [hasUnsavedImageEdits, setHasUnsavedImageEdits] = useState(false);
  const isEditingCardImages = INTERNAL_TEST_FEATURES_ENABLED && editMode;

  const [nightImageStyle, setNightImageStyle] = useState(DEFAULT_NIGHT_IMAGE_STYLE);

  useEffect(() => {
    const loadSavedNightStyle = async () => {
      try {
        const saved = await AsyncStorage.getItem('@lurdinha:bannerStyle:night');
        if (saved) {
          setNightImageStyle(JSON.parse(saved));
        }
      } catch (err) {
        console.warn('Erro ao carregar estilo do banner night em GameHomeScreen:', err);
      }
    };
    loadSavedNightStyle();

    const unsubscribe = navigation.addListener('focus', () => {
      loadSavedNightStyle();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (!INTERNAL_TEST_FEATURES_ENABLED) return;

    const loadSavedImageEdits = async () => {
      try {
        const rawEdits = await AsyncStorage.getItem(CARD_IMAGE_EDIT_STORAGE_KEY);
        if (rawEdits) setImageEdits(JSON.parse(rawEdits));
      } catch (error) {
        console.warn('[GameHomeScreen] failed to load card image edits:', error);
      }
    };

    loadSavedImageEdits();
  }, []);

  const getModeImageEdit = (mode) => ({
    ...getDefaultCardImageEdit(mode),
    ...(INTERNAL_TEST_FEATURES_ENABLED ? imageEdits[mode.key] || {} : {}),
  });

  const updateModeImageEdit = (mode, patch) => {
    if (!INTERNAL_TEST_FEATURES_ENABLED) return;

    setSelectedModeKey(mode.key);
    setHasUnsavedImageEdits(true);
    setImageEdits((currentEdits) => {
      const currentModeEdit = {
        ...getDefaultCardImageEdit(mode),
        ...(currentEdits[mode.key] || {}),
      };

      return {
        ...currentEdits,
        [mode.key]: {
          ...currentModeEdit,
          ...patch,
        },
      };
    });
  };

  const resetSelectedImageEdit = () => {
    const selectedMode = ALL_GAME_MODES.find((mode) => mode.key === selectedModeKey);
    if (!selectedMode) return;
    playSound('ui_toggle');
    updateModeImageEdit(selectedMode, getDefaultCardImageEdit(selectedMode));
  };

  const adjustSelectedImageEdit = (patchBuilder) => {
    const selectedMode = ALL_GAME_MODES.find((mode) => mode.key === selectedModeKey);
    if (!selectedMode) return;
    playSound('ui_tap_soft');

    const currentEdit = getModeImageEdit(selectedMode);
    updateModeImageEdit(selectedMode, patchBuilder(currentEdit));
  };

  const handleSaveImageEdits = async () => {
    if (!INTERNAL_TEST_FEATURES_ENABLED) return;
    playSound('ui_tap_primary');

    try {
      await AsyncStorage.setItem(CARD_IMAGE_EDIT_STORAGE_KEY, JSON.stringify(imageEdits));
      setHasUnsavedImageEdits(false);
      setEditMode(false);
      Alert.alert('Salvo', 'As imagens dos cards foram atualizadas.');
    } catch (error) {
      console.warn('[GameHomeScreen] failed to save card image edits:', error);
      Alert.alert('Erro', 'Não foi possível salvar os ajustes dos cards.');
    }
  };

  const selectedMode = ALL_GAME_MODES.find((mode) => mode.key === selectedModeKey);
  const selectedImageEdit = selectedMode ? getModeImageEdit(selectedMode) : null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0E0B16', '#111016', '#13101E', '#0F0F14']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >

        <Animated.View entering={FadeInDown.duration(280)} style={styles.header}>
          <AnimatedPressable style={styles.backBtn} onPress={() => { playSound('ui_toggle'); navigation.goBack(); }} haptic="light">
            <ArrowRight size={20} color="#FFFFFF" style={{ transform: [{ rotate: '180deg' }] }} />
          </AnimatedPressable>
          <View style={styles.headerText}>
            <Text style={styles.pageTitle}>Jogar</Text>
            <Text style={styles.pageSubtitle}>Escolha um modo para começar</Text>
          </View>
          <View style={styles.headerActions}>
            <SoundMuteButton compact />
            {INTERNAL_TEST_FEATURES_ENABLED ? (
              <AnimatedPressable
                style={styles.devSandboxButton}
                onPress={() => { playSound('ui_toggle'); navigation.navigate('SocialGameSandbox'); }}
                haptic="light"
                activeScale={0.94}
              >
                <TestTube2 size={18} color="#C4B5FD" />
              </AnimatedPressable>
            ) : null}
            {INTERNAL_TEST_FEATURES_ENABLED ? (
              <AnimatedPressable
                style={[styles.editCardsButton, isEditingCardImages && styles.editCardsButtonActive]}
                onPress={() => { playSound('ui_toggle'); setEditMode((isEditing) => !isEditing); }}
                haptic="light"
                activeScale={0.94}
              >
                <SlidersHorizontal size={18} color={isEditingCardImages ? '#FFFFFF' : '#C4B5FD'} />
                <Text style={[styles.editCardsButtonText, isEditingCardImages && styles.editCardsButtonTextActive]}>
                  {isEditingCardImages ? 'Fechar' : 'Editar'}
                </Text>
              </AnimatedPressable>
            ) : null}
          </View>
        </Animated.View>

        {isEditingCardImages && selectedMode ? (
          <Animated.View entering={FadeInDown.duration(220)} style={styles.imageEditorPanel}>
            <View style={styles.imageEditorHeader}>
              <Text style={styles.imageEditorTitle}>{selectedMode.title}</Text>
              {hasUnsavedImageEdits ? <Text style={styles.imageEditorDirty}>Não salvo</Text> : null}
            </View>

            <View style={styles.imageEditorControls}>
              <View style={styles.imageEditorControlGroup}>
                <Text style={styles.imageEditorLabel}>Tamanho</Text>
                <View style={styles.imageEditorStepper}>
                  <AnimatedPressable
                    style={styles.imageEditorIconButton}
                    onPress={() => adjustSelectedImageEdit((edit) => ({ scale: clampScale(edit.scale - 0.08) }))}
                    haptic="light"
                    activeScale={0.9}
                  >
                    <Minus size={16} color="#FFFFFF" />
                  </AnimatedPressable>
                  <Text style={styles.imageEditorValue}>{Math.round((selectedImageEdit?.scale || 1) * 100)}%</Text>
                  <AnimatedPressable
                    style={styles.imageEditorIconButton}
                    onPress={() => adjustSelectedImageEdit((edit) => ({ scale: clampScale(edit.scale + 0.08) }))}
                    haptic="light"
                    activeScale={0.9}
                  >
                    <Plus size={16} color="#FFFFFF" />
                  </AnimatedPressable>
                </View>
              </View>

              <View style={styles.imageEditorControlGroup}>
                <Text style={styles.imageEditorLabel}>Giro</Text>
                <View style={styles.imageEditorStepper}>
                  <AnimatedPressable
                    style={styles.imageEditorIconButton}
                    onPress={() => adjustSelectedImageEdit((edit) => ({ rotation: clampRotation(edit.rotation - 4) }))}
                    haptic="light"
                    activeScale={0.9}
                  >
                    <Minus size={16} color="#FFFFFF" />
                  </AnimatedPressable>
                  <Text style={styles.imageEditorValue}>{Math.round(selectedImageEdit?.rotation || 0)}°</Text>
                  <AnimatedPressable
                    style={styles.imageEditorIconButton}
                    onPress={() => adjustSelectedImageEdit((edit) => ({ rotation: clampRotation(edit.rotation + 4) }))}
                    haptic="light"
                    activeScale={0.9}
                  >
                    <Plus size={16} color="#FFFFFF" />
                  </AnimatedPressable>
                </View>
              </View>
            </View>

            <View style={styles.imageEditorActions}>
              <AnimatedPressable style={styles.imageEditorSecondaryButton} onPress={resetSelectedImageEdit} haptic="light" activeScale={0.96}>
                <RotateCcw size={16} color="#DDD6FE" />
                <Text style={styles.imageEditorSecondaryText}>Resetar</Text>
              </AnimatedPressable>
              <AnimatedPressable style={styles.imageEditorSaveButton} onPress={handleSaveImageEdits} haptic="medium" activeScale={0.96}>
                <Save size={16} color="#FFFFFF" />
                <Text style={styles.imageEditorSaveText}>Salvar</Text>
              </AnimatedPressable>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(70).duration(300)}>
          <AnimatedPressable
            style={styles.promoHero}
            haptic="medium"
            activeScale={0.985}
            onPress={() => {
              playSound('ui_tap_soft');
              navigation.navigate('CreateRoom', { gameType: 'lurdinha' });
            }}
          >
            {/* Hero background image */}
            <Image
              source={require('../../../assets/4.png')}
              style={[
                styles.promoHeroBgImage,
                {
                  top: nightImageStyle.top,
                  left: nightImageStyle.left,
                  width: nightImageStyle.width,
                  height: nightImageStyle.height,
                }
              ]}
              resizeMode="cover"
            />

            {/* Left scrim */}
            <LinearGradient
              colors={['rgba(5,4,16,0.95)', 'rgba(8,5,22,0.65)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              locations={[0, 0.50, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            {/* Bottom vignette */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.5)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              locations={[0.45, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            {/* Content copy */}
            <View style={styles.promoCopy}>
              <View style={styles.promoBadge}>
                <Text style={styles.promoBadgeText}>👑 Modo Night</Text>
              </View>
              <Text style={styles.promoTitle}>Noite de{"\n"}jogos épica.</Text>
              <Text style={styles.promoSubtitle}>Crie uma sala e chame todo mundo para uma rodada.</Text>
            </View>
          </AnimatedPressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(130).duration(300)}>
          <Text style={styles.sectionLabel}>Já tenho um código</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(170).duration(300)}>
          <AnimatedPressable
            style={styles.joinCard}
            haptic="medium"
            onPress={() => {
              playSound('ui_tap_soft');
              navigation.navigate('JoinRoom');
            }}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.joinCardIconBox}>
              <Text style={styles.joinCardEmoji}>🚪</Text>
            </View>
            <View style={styles.joinCardTextWrap}>
              <Text style={styles.joinCardTitle}>Entrar com Código</Text>
              <Text style={styles.joinCardSubtitle}>Tem um convite? Junte-se à rodada</Text>
            </View>
            <View style={styles.joinCardArrowShell}>
              <ArrowRight size={16} color="#FFFFFF" />
            </View>
          </AnimatedPressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(230).duration(300)}>
          <Text style={styles.sectionLabel}>Criar nova sala</Text>
        </Animated.View>

        {GAME_MODES.map((mode, index) => (
          <GameModeCard
            key={mode.key}
            mode={mode}
            delay={250 + index * 50}
            imageEdit={getModeImageEdit(mode)}
            editMode={isEditingCardImages}
            selected={selectedModeKey === mode.key}
            onSelect={() => setSelectedModeKey(mode.key)}
            onImageEditChange={(patch) => updateModeImageEdit(mode, patch)}
            onPress={() => navigation.navigate(mode.route, mode.params)}
            onInfoPress={() => setSelectedInfoMode(mode)}
          />
        ))}

        <Animated.View entering={FadeInDown.delay(480).duration(300)}>
          <Text style={[styles.sectionLabel, styles.offlineSectionLabel]}>Jogos offline</Text>
        </Animated.View>

        {OFFLINE_GAME_MODES.map((mode, index) => (
          <GameModeCard
            key={mode.key}
            mode={mode}
            delay={510 + index * 50}
            imageEdit={getModeImageEdit(mode)}
            editMode={isEditingCardImages}
            selected={selectedModeKey === mode.key}
            onSelect={() => setSelectedModeKey(mode.key)}
            onImageEditChange={(patch) => updateModeImageEdit(mode, patch)}
            onPress={() => navigation.navigate(mode.route, mode.params)}
            onInfoPress={() => setSelectedInfoMode(mode)}
          />
        ))}
      </ScrollView>

      <GameInfoModal mode={selectedInfoMode} onClose={() => setSelectedInfoMode(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0B16',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 28,
  },
  backBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#232326',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.46)',
    marginTop: 3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  devSandboxButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(167,139,250,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCardsButton: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(167,139,250,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  editCardsButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: 'rgba(255,255,255,0.16)',
  },
  editCardsButtonText: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '800',
  },
  editCardsButtonTextActive: {
    color: '#FFFFFF',
  },
  imageEditorPanel: {
    backgroundColor: '#18181D',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.16)',
    padding: 14,
    marginBottom: 18,
  },
  imageEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  imageEditorTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  imageEditorDirty: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
  },
  imageEditorControls: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  imageEditorControlGroup: {
    flex: 1,
    minWidth: 0,
  },
  imageEditorLabel: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 7,
  },
  imageEditorStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 4,
  },
  imageEditorIconButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(124,58,237,0.50)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageEditorValue: {
    flex: 1,
    minWidth: 42,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  imageEditorActions: {
    flexDirection: 'row',
    gap: 10,
  },
  imageEditorSecondaryButton: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageEditorSecondaryText: {
    color: '#DDD6FE',
    fontSize: 13,
    fontWeight: '900',
  },
  imageEditorSaveButton: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageEditorSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  promoHero: {
    height: 160,
    borderRadius: 22,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 14,
    backgroundColor: '#0C0814',
  },
  promoHeroBgImage: {
    position: 'absolute',
  },
  promoGlowWash: {
    position: 'absolute',
    left: -34,
    right: -34,
    bottom: -28,
    height: 112,
    backgroundColor: 'rgba(255,255,255,0.22)',
    transform: [{ rotate: '-8deg' }],
  },
  promoCopy: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '60%',
    justifyContent: 'center',
    paddingLeft: 18,
    paddingRight: 8,
    gap: 5,
    zIndex: 10,
  },
  promoBadge: {
    alignSelf: 'flex-start',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    backgroundColor: 'rgba(0,0,0,0.22)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 5,
  },
  promoBadgeText: {
    color: '#8B5CF6',
    fontSize: 9,
    fontFamily: typography.fonts.extrabold,
    letterSpacing: 0.3,
  },
  promoTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 23,
    fontFamily: typography.headingFonts.extrabold,
    letterSpacing: -0.2,
  },
  promoSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    lineHeight: 14,
    fontFamily: typography.fonts.medium,
  },
  promoCta: {
    alignSelf: 'flex-start',
    height: 38,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    shadowColor: '#2A174E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 4,
    marginTop: 6,
  },
  promoCtaText: {
    color: '#2A174E',
    fontSize: 12,
    fontFamily: typography.fonts.bold,
  },
  promoStage: {
    position: 'absolute',
    right: 0,
    top: 18,
    bottom: 10,
    width: '42%',
    zIndex: 3,
  },
  promoPhoneShadow: {
    position: 'absolute',
    right: 4,
    bottom: 14,
    width: 104,
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(42,23,78,0.22)',
    transform: [{ rotate: '-8deg' }],
  },
  promoPhoneCard: {
    position: 'absolute',
    right: 14,
    top: 36,
    width: 106,
    height: 142,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    overflow: 'hidden',
    padding: 12,
    transform: [{ rotate: '-10deg' }],
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  promoPhoneHeader: {
    width: 38,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(76,29,149,0.20)',
    marginBottom: 18,
  },
  promoMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 14,
  },
  promoMiniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  promoMiniBar: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(76,29,149,0.16)',
  },
  promoPercentPill: {
    height: 46,
    borderRadius: 18,
    backgroundColor: '#2A174E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoPercentText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },
  promoCrownObject: {
    position: 'absolute',
    right: 76,
    top: 8,
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '14deg' }],
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 7,
  },
  promoCrownEmoji: {
    fontSize: 34,
  },
  promoBubbleObject: {
    position: 'absolute',
    right: 8,
    top: 4,
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-11deg' }],
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },
  promoBubbleText: {
    color: '#FF6B35',
    fontSize: 20,
    fontWeight: '900',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.42)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  offlineSectionLabel: {
    marginTop: 18,
  },
  joinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    borderWidth: 0,
    gap: 14,
    overflow: 'hidden',
    marginBottom: 30,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  joinCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinCardEmoji: {
    fontSize: 20,
  },
  joinCardTextWrap: {
    flex: 1,
  },
  joinCardTitle: {
    fontSize: 16,
    fontFamily: typography.headingFonts.bold,
    color: '#FFFFFF',
    marginBottom: 3,
  },
  joinCardSubtitle: {
    fontSize: 12,
    fontFamily: typography.fonts.medium,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  joinCardArrowShell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeCard: {
    position: 'relative',
    width: '100%',
    height: 122,
    backgroundColor: '#1A1130',
    borderRadius: 18,
    borderWidth: 0,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  modeVioletGlow: {
    position: 'absolute',
    top: -28,
    right: -24,
    width: 190,
    height: 150,
    opacity: 0.9,
  },
  modeGlowOrb: {
    position: 'absolute',
    top: -46,
    right: -42,
    width: 156,
    height: 156,
    borderRadius: 78,
    opacity: 0.72,
  },
  modePatternLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  modePatternSymbol: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.055)',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
  },
  modePatternSymbolViolet: {
    color: 'rgba(196,181,253,0.075)',
  },
  modePatternSymbol1: {
    top: 10,
    right: 130,
    transform: [{ rotate: '-12deg' }],
  },
  modePatternSymbol2: {
    top: 17,
    right: 34,
    fontSize: 34,
    transform: [{ rotate: '10deg' }],
  },
  modePatternSymbol3: {
    right: 102,
    bottom: 12,
    fontSize: 20,
    transform: [{ rotate: '8deg' }],
  },
  modePatternSymbol4: {
    right: 12,
    bottom: 16,
    fontSize: 24,
    transform: [{ rotate: '-8deg' }],
  },
  modePatternSymbol5: {
    top: 55,
    right: 166,
    fontSize: 18,
    transform: [{ rotate: '15deg' }],
  },
  modeCardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    zIndex: 10,
    width: '60%',
  },
  modeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  modeTitle: {
    flexShrink: 1,
    fontSize: 22,
    fontFamily: typography.headingFonts.extrabold,
    color: '#FFFFFF',
    lineHeight: 23,
    letterSpacing: -0.2,
  },
  modeTitleInfoBtn: {
    padding: 4,
  },
  modeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  modeTagText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modeSubtitle: {
    fontSize: 11.5,
    fontFamily: typography.fonts.medium,
    color: '#A1A1AA',
    lineHeight: 14.5,
    paddingRight: 6,
  },
  modeVisual: {
    width: '40%',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  modeImageWrapper: {
    width: 64,
    height: 84,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modeImageNoFrameWrapper: {
    width: 100,
    height: 142,
    justifyContent: 'center',
    alignItems: 'center',
    right: 2,
  },
  modeImageEditingSelected: {
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  modeImageNoFrame: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  modeEmojiWrapper: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeEmojiBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modeLargeEmoji: {
    fontSize: 28,
  },
  modeTagBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
    borderWidth: 1,
  },
  modeTagBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  infoModalCard: {
    marginHorizontal: 0,
    marginBottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: '#18181D',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.18)',
    padding: 20,
  },
  infoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  infoModalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModalEmoji: {
    fontSize: 26,
  },
  infoModalClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModalTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  infoModalHeadline: {
    color: '#C4B5FD',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    marginBottom: 10,
  },
  infoModalBody: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  infoModalCallout: {
    marginTop: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 14,
  },
  infoModalCalloutLabel: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  infoModalCalloutText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
  },
});
