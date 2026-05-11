import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
} from 'react-native';
import { ArrowRight, Info, X } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import LurdinhaBrandIcon from '../../components/LurdinhaBrandIcon';

const GAME_MODES = [
  {
    key: 'party',
    title: 'Sessão Completa',
    subtitle: 'Múltiplos minigames em sequência automática',
    emoji: '🎉',
    route: 'CreateRoom',
    params: { gameType: 'party' },
    color: '#EC4899',
    image: 'https://images.unsplash.com/photo-1618365908648-e71bd5716cba?q=80&w=300&auto=format&fit=crop',
    info: {
      headline: 'Uma playlist de jogos sociais.',
      body: 'Mistura vários modos em sequência para manter a sala viva sem o host precisar escolher toda hora.',
      bestFor: 'Ideal para grupo que quer jogar sem pensar muito na configuração.',
    },
  },
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
    tag: 'NOVO',
    tagColor: '#C4B5FD',
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
    title: 'Quem é mais provável?',
    subtitle: 'Vote em quem combina com a pergunta',
    emoji: '👀',
    route: 'CreateRoom',
    params: { gameType: 'most_likely' },
    tag: 'NOVO',
    tagColor: '#A78BFA',
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
];

const OFFLINE_GAME_MODES = [
  {
    key: 'impostor',
    title: 'Impostor',
    subtitle: 'Jogo local no mesmo aparelho',
    emoji: '🎭',
    route: 'ImpostorLobby',
    tag: 'OFFLINE',
    tagColor: '#F59E0B',
    color: '#7C3AED',
    image: require('../../../assets/impostor_card.png'),
    noFrame: true,
    info: {
      headline: 'Descubra quem está blefando.',
      body: 'Todos veem uma palavra, menos o impostor. O grupo precisa perceber quem não sabe do que está falando.',
      bestFor: 'Bom para jogar no mesmo aparelho, sem sala online.',
    },
  },
];

function GameModeCard({ mode, onPress, onInfoPress, delay }) {
  const color = mode.color || "#7C3AED";
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <TouchableOpacity
        style={styles.modeCard}
        activeOpacity={0.82}
        onPress={onPress}
      >
        {/* Background glow using LinearGradient instead of a solid circle */}
        <LinearGradient
          colors={['transparent', `${color}25`]}
          start={{ x: 0.4, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Content Container */}
        <View style={styles.modeCardContent}>
          <View style={styles.modeNameRow}>
            <Text style={styles.modeTitle} numberOfLines={1}>{mode.title}</Text>
            {mode.tag ? (
              <View style={[styles.modeTag, { backgroundColor: `${mode.tagColor}26` }]}>
                <Text style={[styles.modeTagText, { color: mode.tagColor }]}>{mode.tag}</Text>
              </View>
            ) : null}
            <TouchableOpacity
              onPress={onInfoPress}
              hitSlop={{top:15,bottom:15,left:10,right:10}}
              style={styles.modeTitleInfoBtn}
            >
              <Info size={16} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>
          <Text style={styles.modeSubtitle} numberOfLines={2}>
            {mode.subtitle}
          </Text>
          <View style={styles.modeActionRow}>
            <View style={styles.modeJogarBtn}>
              <Text style={styles.modeJogarText}>Jogar</Text>
            </View>
          </View>
        </View>

        {/* Visual / Right side */}
        <View style={styles.modeVisual}>
          {mode.image ? (
            mode.noFrame ? (
              <View style={styles.modeImageNoFrameWrapper}>
                <Image source={typeof mode.image === 'string' ? { uri: mode.image } : mode.image} style={styles.modeImageNoFrame} />
              </View>
            ) : (
              <View style={[styles.modeImageWrapper, { shadowColor: color }]}>
                <Image source={typeof mode.image === 'string' ? { uri: mode.image } : mode.image} style={styles.modeImage} />
                <LinearGradient 
                  colors={['transparent', 'rgba(0,0,0,0.6)']} 
                  style={StyleSheet.absoluteFill} 
                />
              </View>
            )
          ) : (
            <View style={[styles.modeImageWrapper, styles.modeEmojiWrapper, { shadowColor: color }]}>
               <Text style={styles.modeLargeEmoji}>{mode.emoji}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function GameInfoModal({ mode, onClose }) {
  return (
    <Modal
      visible={!!mode}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={styles.modalDismissArea} activeOpacity={1} onPress={onClose} />
        <View style={styles.infoModalCard}>
          <View style={styles.infoModalHeader}>
            <View style={styles.infoModalIconWrap}>
              <Text style={styles.infoModalEmoji}>{mode?.emoji}</Text>
            </View>
            <TouchableOpacity style={styles.infoModalClose} onPress={onClose} activeOpacity={0.78}>
              <X size={18} color="rgba(255,255,255,0.72)" />
            </TouchableOpacity>
          </View>

          <Text style={styles.infoModalTitle}>{mode?.title}</Text>
          <Text style={styles.infoModalHeadline}>{mode?.info?.headline}</Text>
          <Text style={styles.infoModalBody}>{mode?.info?.body}</Text>

          <View style={styles.infoModalCallout}>
            <Text style={styles.infoModalCalloutLabel}>Melhor para</Text>
            <Text style={styles.infoModalCalloutText}>{mode?.info?.bestFor}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function GameHomeScreen({ navigation }) {
  const [selectedInfoMode, setSelectedInfoMode] = useState(null);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View pointerEvents="none" style={styles.ambientGlowTop} />
        <View pointerEvents="none" style={styles.ambientGlowBottom} />

        <Animated.View entering={FadeInDown.duration(280)} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowRight size={20} color="#FFFFFF" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.pageTitle}>Jogar</Text>
            <Text style={styles.pageSubtitle}>Escolha um modo para começar</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(70).duration(300)} style={styles.hero}>
          <LinearGradient
            colors={['transparent', 'rgba(124,58,237,0.25)']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContentRow}>
            <View style={styles.heroTextContent}>
              <Text style={styles.heroTitle}>Jogos em Grupo</Text>
              <Text style={styles.heroSubtitle}>
                Convide a galera, crie uma sala e divirta-se.
              </Text>
            </View>
            <View style={styles.heroIconWrapper}>
              <Image source={require('../../../assets/logo.png')} style={{ width: 56, height: 56, resizeMode: 'contain' }} />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(130).duration(300)}>
          <Text style={styles.sectionLabel}>Já tenho um código</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(170).duration(300)}>
          <TouchableOpacity
            style={styles.joinCard}
            activeOpacity={0.82}
            onPress={() => navigation.navigate('JoinRoom')}
          >
            <LinearGradient
              colors={['rgba(16,185,129,0.15)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 0.6, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.joinCardEmoji}>🚪</Text>
            <View style={styles.joinCardTextWrap}>
              <Text style={styles.joinCardTitle}>Entrar em Sala</Text>
              <Text style={styles.joinCardSubtitle}>Digite o código de acesso da sala</Text>
            </View>
            <View style={styles.joinCardArrowShell}>
              <ArrowRight size={16} color="rgba(255,255,255,0.4)" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(230).duration(300)}>
          <Text style={styles.sectionLabel}>Criar nova sala</Text>
        </Animated.View>

        {GAME_MODES.map((mode, index) => (
          <GameModeCard
            key={mode.key}
            mode={mode}
            delay={250 + index * 50}
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
    backgroundColor: '#101014',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },
  ambientGlowTop: {
    position: 'absolute',
    top: 44,
    right: -72,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(124,58,237,0.12)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    left: -120,
    bottom: 160,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(139,92,246,0.08)',
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
  hero: {
    backgroundColor: '#17171B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextContent: {
    flex: 1,
    paddingRight: 16,
  },
  heroEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignSelf: 'flex-start',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroEyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A78BFA',
  },
  heroEyebrowText: {
    color: '#E4D4FF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#A1A1AA',
    lineHeight: 18,
  },
  heroIconWrapper: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '4deg' }],
  },
  heroLogo: {
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
    backgroundColor: '#17171B',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    gap: 14,
    overflow: 'hidden',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  joinCardEmoji: {
    fontSize: 28,
    width: 36,
    textAlign: 'center',
  },
  joinCardTextWrap: {
    flex: 1,
  },
  joinCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  joinCardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.44)',
  },
  joinCardArrowShell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeCard: {
    position: 'relative',
    width: '100%',
    height: 136,
    backgroundColor: '#17171B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  modeCardContent: {
    flex: 1,
    padding: 16,
    height: '100%',
    justifyContent: 'center',
    zIndex: 10,
    width: '60%',
  },
  modeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modeTitle: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modeSubtitle: {
    fontSize: 13,
    color: '#A1A1AA',
    fontWeight: '500',
    lineHeight: 17,
    marginBottom: 12,
    paddingRight: 8,
  },
  modeActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    gap: 8,
  },
  modeJogarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  modeJogarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modeVisual: {
    width: '40%',
    height: '100%',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeImageWrapper: {
    width: 110,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    transform: [{ rotate: '4deg' }],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modeImageNoFrameWrapper: {
    width: 195,
    height: 195,
    justifyContent: 'center',
    alignItems: 'center',
    right: -5,
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
  modeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modeLargeEmoji: {
    fontSize: 40,
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
    margin: 20,
    marginBottom: 28,
    borderRadius: 28,
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
    fontWeight: '600',
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
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  infoModalCalloutText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
});

