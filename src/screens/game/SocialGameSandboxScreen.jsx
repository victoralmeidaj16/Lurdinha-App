import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Brush, Eye, ListOrdered, MessageCircle, ShieldQuestion, Trophy } from 'lucide-react-native';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { playSound } from '../../utils/sounds';

const nowIso = () => new Date().toISOString();

const createPlayers = (currentUser) => {
  const me = {
    uid: currentUser?.uid || 'sandbox-user',
    name: currentUser?.displayName || 'Você',
    username: currentUser?.displayName || 'Você',
    photoURL: currentUser?.photoURL || null,
    score: 8,
  };

  return [
    me,
    { uid: 'sandbox-ana', name: 'Ana', username: 'Ana', photoURL: null, score: 6 },
    { uid: 'sandbox-caio', name: 'Caio', username: 'Caio', photoURL: null, score: 5 },
    { uid: 'sandbox-lia', name: 'Lia', username: 'Lia', photoURL: null, score: 3 },
  ];
};

const createBaseRoom = (currentUser, gameType) => {
  const players = createPlayers(currentUser);
  return {
    id: `sandbox-${gameType}`,
    roomId: `sandbox-${gameType}`,
    status: 'playing',
    hostId: players[0].uid,
    players,
    currentRound: 1,
    currentTurn: 1,
    settings: {
      gameType,
      totalRounds: 3,
      timePerRound: 600,
      theme: 'Modo teste',
    },
    roundData: {
      startTime: nowIso(),
      answers: {},
    },
  };
};

const createMockRoom = (currentUser, gameType) => {
  const room = createBaseRoom(currentUser, gameType);
  const [me, ana, caio, lia] = room.players;

  if (gameType === 'draw') {
    return {
      ...room,
      settings: {
        ...room.settings,
        contentMode: 'words',
        difficulty: 'normal',
        drawCategory: 'random',
      },
      roundData: {
        startTime: nowIso(),
        drawerId: me.uid,
        word: 'Pizza voadora',
        maskedWord: '_ _ _ _ _   _ _ _ _ _ _ _',
        hint: 'Comida que resolveu viajar pelo céu',
        hintsRevealed: 0,
        strokes: [],
        canvasFill: '#111827',
        chatMessages: [
          { id: 'm1', uid: ana.uid, name: ana.name, text: 'Parece uma nave?', createdAt: Date.now() - 9000 },
          { id: 'm2', uid: caio.uid, name: caio.name, text: 'Tem queijo nisso', createdAt: Date.now() - 5000 },
        ],
        correctlyGuessed: [],
        reports: {},
      },
    };
  }

  if (gameType === 'telephone') {
    return {
      ...room,
      currentTurn: 2,
      settings: { ...room.settings, gameType: 'telephone', totalRounds: 1 },
      roundData: {
        startTime: nowIso(),
        totalTurns: 3,
        turnType: 'drawing',
        readyPlayers: [],
        threads: {
          [me.uid]: [{ type: 'phrase', authorId: me.uid, turn: 1, text: 'Um robô tentando fazer café' }],
          [ana.uid]: [{ type: 'phrase', authorId: ana.uid, turn: 1, text: 'Uma pizza fugindo de bicicleta' }],
          [caio.uid]: [{ type: 'phrase', authorId: caio.uid, turn: 1, text: 'Um fantasma com medo de escuro' }],
          [lia.uid]: [{ type: 'phrase', authorId: lia.uid, turn: 1, text: 'Uma geladeira fazendo terapia' }],
        },
      },
    };
  }

  if (gameType === 'most_likely') {
    return {
      ...room,
      roundData: {
        startTime: nowIso(),
        question: 'Quem provavelmente esqueceria o próprio aniversário?',
        answers: {
          [ana.uid]: caio.uid,
        },
      },
    };
  }

  if (gameType === 'obvious_mind') {
    return {
      ...room,
      roundData: {
        startTime: nowIso(),
        question: {
          text: 'Uma comida que salva qualquer rolê',
          options: ['Pizza', 'Hambúrguer', 'Sushi', 'Brigadeiro'],
        },
        targetId: lia.uid,
        answers: {
          [ana.uid]: 'Pizza',
        },
      },
    };
  }

  if (gameType === 'tier_list') {
    return {
      ...room,
      settings: { ...room.settings, category: 'resenha' },
      roundData: {
        startTime: nowIso(),
        question: 'Quem é mais forte no rolê?',
        category: 'resenha',
        answers: {},
      },
    };
  }

  if (gameType === 'impostor') {
    return {
      ...room,
      settings: { ...room.settings, gameType: 'impostor' },
      roundData: {
        phase: 'discussion',
        category: 'Comida',
        word: 'Lasanha',
        impostorId: caio.uid,
        rolesRevealed: {
          [me.uid]: true,
          [ana.uid]: true,
          [caio.uid]: true,
          [lia.uid]: true,
        },
        answerOrder: [me.uid, ana.uid, caio.uid, lia.uid],
        currentAnswerTurnIndex: 0,
        clues: [
          { uid: ana.uid, name: ana.name, clue: 'Forno', createdAt: Date.now() - 10000 },
        ],
        reactions: [
          { id: 'sandbox-reaction-1', uid: ana.uid, targetUid: me.uid, emoji: '😂', createdAt: Date.now() },
        ],
        votes: {},
      },
    };
  }

  return {
    ...room,
    roundData: {
      startTime: nowIso(),
      question: 'Quem do grupo inventaria a desculpa mais absurda?',
      answers: {},
    },
  };
};

const SANDBOX_MODES = [
  { key: 'impostor', title: 'Impostor Online', subtitle: 'Cards, turno de resposta, reações e votação.', icon: ShieldQuestion, route: 'Game' },
  { key: 'telephone', title: 'Telefone Sem Fio', subtitle: 'Receber frase, desenhar e testar paleta.', icon: MessageCircle, route: 'Game' },
  { key: 'draw', title: 'Desenho', subtitle: 'Tela de desenho livre com cor, preenchimento e palpites.', icon: Brush, route: 'DrawGame' },
  { key: 'tier_list', title: 'Tier List', subtitle: 'Classificação numérica dos jogadores.', icon: ListOrdered, route: 'Game' },
  { key: 'most_likely', title: 'Mais Provável', subtitle: 'Votação social em outro jogador.', icon: Trophy, route: 'Game' },
  { key: 'obvious_mind', title: 'Óbvio', subtitle: 'Palpite sobre a resposta mais óbvia do grupo.', icon: Eye, route: 'Game' },
];

export default function SocialGameSandboxScreen({ navigation }) {
  const { currentUser } = useAuth();

  const openMode = (mode) => {
    playSound('ui_tap_soft');
    navigation.navigate(mode.route, {
      roomId: `sandbox-${mode.key}`,
      mockRoomData: createMockRoom(currentUser, mode.key),
      isSandbox: true,
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D0A14', '#151020', '#09090B']} style={StyleSheet.absoluteFill} />
      <Header title="Sandbox social" transparent showBack onBack={() => navigation.goBack()} showSoundToggle />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>DEV TOOLS</Text>
          <Text style={styles.title}>Abrir telas com jogadores falsos</Text>
          <Text style={styles.subtitle}>
            Use estes atalhos para ajustar layout e interações sem criar sala real nem depender de outros usuários.
          </Text>
        </View>

        <View style={styles.grid}>
          {SANDBOX_MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <TouchableOpacity key={mode.key} style={styles.card} activeOpacity={0.84} onPress={() => openMode(mode)}>
                <View style={styles.iconWrap}>
                  <Icon size={22} color="#C4B5FD" />
                </View>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>{mode.title}</Text>
                  <Text style={styles.cardSubtitle}>{mode.subtitle}</Text>
                </View>
                <ArrowRight size={18} color="rgba(255,255,255,0.48)" />
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.note}>
          Os envios nesta area sao locais. Nada e gravado no Firebase.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  content: {
    padding: 20,
    paddingBottom: 56,
  },
  hero: {
    marginTop: 12,
    marginBottom: 22,
  },
  kicker: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '900',
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  grid: {
    gap: 12,
  },
  card: {
    minHeight: 96,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.16)',
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  note: {
    marginTop: 18,
    color: 'rgba(255,255,255,0.36)',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
});
