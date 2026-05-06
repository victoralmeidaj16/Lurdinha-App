import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { ArrowRight, Info, X } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import LurdinhaBrandIcon from '../../components/LurdinhaBrandIcon';

const GAME_MODES = [
  {
    key: 'party',
    title: 'Sessão Completa',
    subtitle: 'Múltiplos minigames em sequência automática',
    emoji: '🎉',
    route: 'CreateRoom',
    params: { gameType: 'party' },
    tag: 'RECOMENDADO',
    tagColor: '#8B5CF6',
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
    info: {
      headline: 'Acerte como a galera pensa.',
      body: 'Cada rodada tem uma pergunta. Você ganha quando sua resposta combina com a maioria do grupo.',
      bestFor: 'Bom para descobrir padrões, manias e consensos engraçados da turma.',
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
    info: {
      headline: 'O grupo vota em quem mais combina.',
      body: 'A pergunta aparece e cada pessoa escolhe alguém do grupo. O resultado revela a percepção coletiva.',
      bestFor: 'Funciona bem para zoeira leve, identificação e pequenas polêmicas sociais.',
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
    info: {
      headline: 'Tente entrar na cabeça de alguém.',
      body: 'Um alvo responde em segredo. O resto tenta adivinhar o que essa pessoa escolheria.',
      bestFor: 'Bom para afinidade, revelações leves e descobrir quem pensa parecido.',
    },
  },
  {
    key: 'draw',
    title: 'Desenho',
    subtitle: 'Desenhe ao vivo e adivinhe a palavra',
    emoji: '✏️',
    route: 'CreateRoom',
    params: { gameType: 'draw' },
    info: {
      headline: 'Desenhe rápido, adivinhe ao vivo.',
      body: 'Um jogador recebe a palavra e desenha enquanto os outros tentam acertar antes do tempo acabar.',
      bestFor: 'Ideal para energia rápida, risada visual e competição direta.',
    },
  },
  {
    key: 'secret',
    title: 'Telefone Sem Fio',
    subtitle: 'Frase, desenho, interpretação em cadeia',
    emoji: '📖',
    route: 'CreateRoom',
    params: { gameType: 'secret' },
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
    info: {
      headline: 'Descubra quem está blefando.',
      body: 'Todos veem uma palavra, menos o impostor. O grupo precisa perceber quem não sabe do que está falando.',
      bestFor: 'Bom para jogar no mesmo aparelho, sem sala online.',
    },
  },
];

function GameModeCard({ mode, onPress, onInfoPress, delay }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)}>
      <TouchableOpacity
        style={styles.modeCard}
        activeOpacity={0.82}
        onPress={onPress}
      >
        <View pointerEvents="none" style={styles.modeOrb} />
        <Text style={styles.modeEmojiLeft}>{mode.emoji}</Text>

        <View style={styles.modeTextWrap}>
          <View style={styles.modeNameRow}>
            <Text style={styles.modeTitle} numberOfLines={1}>{mode.title}</Text>
            {mode.tag ? (
              <View style={[styles.modeTag, { backgroundColor: `${mode.tagColor}1f` }]}>
                <Text style={[styles.modeTagText, { color: mode.tagColor }]}>{mode.tag}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.modeSubtitle} numberOfLines={1}>
            {mode.subtitle}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.modeInfoButton}
          onPress={onInfoPress}
          activeOpacity={0.78}
          accessibilityLabel={`Informações sobre ${mode.title}`}
        >
          <Info size={16} color="#C4B5FD" />
        </TouchableOpacity>

        <View style={styles.modeArrowShell}>
          <ArrowRight size={16} color="rgba(255,255,255,0.32)" />
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
          <View style={styles.heroEyebrow}>
            <View style={styles.heroEyebrowDot} />
            <Text style={styles.heroEyebrowText}>Jogos sociais</Text>
          </View>
          <View pointerEvents="none" style={styles.heroOrb} />
          <LurdinhaBrandIcon size={86} style={styles.heroLogo} />
          <Text style={styles.heroTitle}>Jogos em Grupo</Text>
          <Text style={styles.heroSubtitle}>
            Convide a galera, crie uma sala e divirta-se.
          </Text>
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
            <View pointerEvents="none" style={styles.modeOrb} />
            <Text style={styles.modeEmojiLeft}>🚪</Text>
            <View style={styles.modeTextWrap}>
              <Text style={styles.modeTitle}>Entrar em Sala</Text>
              <Text style={styles.modeSubtitle}>Digite o código de acesso da sala</Text>
            </View>
            <View style={styles.modeArrowShell}>
              <ArrowRight size={16} color="rgba(255,255,255,0.32)" />
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
    alignItems: 'center',
    backgroundColor: '#17171C',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.16)',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 24,
    marginBottom: 34,
    overflow: 'hidden',
  },
  heroEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
    backgroundColor: 'rgba(139,92,246,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  heroEyebrowDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#A78BFA',
  },
  heroEyebrowText: {
    color: '#B79CFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroOrb: {
    position: 'absolute',
    right: -40,
    top: 36,
    width: 132,
    height: 132,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  heroLogo: {
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: '70%',
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
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181D',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.12)',
    marginBottom: 12,
    gap: 14,
    overflow: 'hidden',
  },
  joinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181D',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.12)',
    gap: 14,
    overflow: 'hidden',
    marginBottom: 30,
  },
  modeOrb: {
    position: 'absolute',
    right: -28,
    top: '24%',
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  modeEmojiLeft: {
    fontSize: 28,
    width: 36,
    textAlign: 'center',
  },
  modeTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  modeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  modeTitle: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
    color: 'rgba(255,255,255,0.44)',
  },
  modeInfoButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(139,92,246,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeArrowShell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
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
