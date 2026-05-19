import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Zap,
  Trophy,
  Users,
  Flame,
  Star,
  Play,
  ChevronRight,
  Gamepad2,
  Sparkles,
  Clock,
  TrendingUp,
  Settings,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.72;

// ─── Mock data ────────────────────────────────────────────────
const FEATURED_GAME = {
  title: 'Lurdinha',
  subtitle: 'Responda igual à maioria e sobreviva',
  tag: 'MAIS JOGADO',
  players: 312,
  image: require('../../assets/lurdinha_card.png'),
};

const GAME_MODES = [
  {
    key: 'draw',
    title: 'Desenho',
    emoji: '✏️',
    color: '#10B981',
    glow: 'rgba(16,185,129,0.25)',
    image: require('../../assets/draw_card.png'),
    tag: null,
  },
  {
    key: 'obvious',
    title: 'Na Minha Cabeça',
    emoji: '🧠',
    color: '#F59E0B',
    glow: 'rgba(245,158,11,0.25)',
    image: require('../../assets/obvious_mind_card.png'),
    tag: 'NOVO',
  },
  {
    key: 'secret',
    title: 'Segredo',
    emoji: '🤫',
    color: '#EC4899',
    glow: 'rgba(236,72,153,0.25)',
    image: require('../../assets/secret_card.png'),
    tag: null,
  },
  {
    key: 'impostor',
    title: 'Impostor',
    emoji: '🕵️',
    color: '#8B5CF6',
    glow: 'rgba(139,92,246,0.25)',
    image: require('../../assets/impostor_card.png'),
    tag: null,
  },
];

const ACTIVITY_FEED = [
  { id: '1', type: 'live', user: 'Gabriel', action: 'está jogando Desenho', time: 'agora', avatar: '🐯' },
  { id: '2', type: 'result', user: 'Ana + 4', action: 'terminaram uma rodada de Lurdinha', time: '2 min', avatar: '🦊' },
  { id: '3', type: 'ranking', user: 'Você', action: 'subiu para #3 no ranking do grupo', time: '15 min', avatar: '🐺' },
  { id: '4', type: 'invite', user: 'Pedro', action: 'abriu uma sala. Entre já!', time: '18 min', avatar: '🐻' },
];

const STATS = [
  { label: 'Vitórias', value: '24', icon: Trophy, color: '#F59E0B' },
  { label: 'Rodadas', value: '143', icon: Gamepad2, color: '#8B5CF6' },
  { label: 'Sequência', value: '7🔥', icon: Flame, color: '#EF4444', raw: true },
];

// ─── Pulse glow component ─────────────────────────────────────
function PulseGlow({ color = '#8B5CF6', size = 220 }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.18, duration: 2200, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 2200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.15, duration: 2200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.35, duration: 2200, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        transform: [{ scale }],
        opacity,
        top: -size * 0.3,
        right: -size * 0.25,
      }}
    />
  );
}

// ─── Featured game hero card ──────────────────────────────────
function FeaturedCard() {
  const scale = useRef(new Animated.Value(1)).current;

  const onPress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress} style={styles.featuredOuter}>
      <Animated.View style={[styles.featuredCard, { transform: [{ scale }] }]}>
        {/* Background glow */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <PulseGlow color="#7C3AED" size={260} />
        </View>

        <LinearGradient
          colors={['#1A1025', '#120D1E', '#0D0D0D']}
          style={StyleSheet.absoluteFill}
        />

        {/* Border gradient overlay */}
        <LinearGradient
          colors={['rgba(139,92,246,0.4)', 'rgba(124,58,237,0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.featuredBorderGrad]}
        />

        <View style={styles.featuredContent}>
          <View style={styles.featuredLeft}>
            <View style={styles.featuredTagRow}>
              <Zap size={10} color="#A78BFA" fill="#A78BFA" />
              <Text style={styles.featuredTag}>{FEATURED_GAME.tag}</Text>
            </View>
            <Text style={styles.featuredTitle}>{FEATURED_GAME.title}</Text>
            <Text style={styles.featuredSubtitle}>{FEATURED_GAME.subtitle}</Text>

            <View style={styles.featuredMeta}>
              <Users size={12} color="rgba(255,255,255,0.4)" />
              <Text style={styles.featuredMetaText}>{FEATURED_GAME.players} jogando agora</Text>
            </View>

            <View style={styles.featuredPlayBtn}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.featuredPlayGrad}
              >
                <Play size={13} color="#fff" fill="#fff" />
                <Text style={styles.featuredPlayText}>Jogar agora</Text>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.featuredRight}>
            <Image source={FEATURED_GAME.image} style={styles.featuredImage} resizeMode="contain" />
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Stats row ────────────────────────────────────────────────
function StatsRow() {
  return (
    <View style={styles.statsRow}>
      {STATS.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <View key={stat.label} style={[styles.statCard, i === 1 && styles.statCardCenter]}>
            <View style={[styles.statIconWrap, { backgroundColor: `${stat.color}20` }]}>
              <Icon size={14} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Section label ────────────────────────────────────────────
function SectionHeader({ title, icon: Icon, iconColor = '#8B5CF6', action }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLeft}>
        {Icon && <Icon size={14} color={iconColor} style={{ marginRight: 6 }} />}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action && (
        <TouchableOpacity activeOpacity={0.7} style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{action}</Text>
          <ChevronRight size={12} color="rgba(139,92,246,0.8)" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Game mode card (horizontal scroll) ──────────────────────
function GameModeCard({ mode }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.gameModeCard}>
      <LinearGradient
        colors={['#1C1C22', '#141418']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.gameModeGlow, { backgroundColor: mode.glow }]} />

      <Image source={mode.image} style={styles.gameModeImage} resizeMode="contain" />

      <View style={styles.gameModeFooter}>
        {mode.tag && (
          <View style={styles.gameModeTag}>
            <Text style={styles.gameModeTagText}>{mode.tag}</Text>
          </View>
        )}
        <Text style={styles.gameModeTitle}>{mode.title}</Text>
      </View>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.gameModeScrim}
      />
    </TouchableOpacity>
  );
}

// ─── Activity feed item ───────────────────────────────────────
function ActivityItem({ item }) {
  const dotColor = item.type === 'live' ? '#10B981'
    : item.type === 'ranking' ? '#F59E0B'
    : item.type === 'invite' ? '#8B5CF6'
    : '#9CA3AF';

  return (
    <View style={styles.activityItem}>
      <View style={styles.activityAvatarWrap}>
        <Text style={styles.activityAvatar}>{item.avatar}</Text>
        {item.type === 'live' && <View style={styles.activityLiveDot} />}
      </View>

      <View style={styles.activityBody}>
        <Text style={styles.activityText} numberOfLines={2}>
          <Text style={styles.activityUser}>{item.user} </Text>
          {item.action}
        </Text>
        <View style={styles.activityMeta}>
          <View style={[styles.activityDot, { backgroundColor: dotColor }]} />
          <Text style={styles.activityTime}>{item.time}</Text>
        </View>
      </View>

      {item.type === 'invite' && (
        <TouchableOpacity activeOpacity={0.8} style={styles.activityJoinBtn}>
          <Text style={styles.activityJoinText}>Entrar</Text>
        </TouchableOpacity>
      )}
      {item.type === 'live' && (
        <TouchableOpacity activeOpacity={0.8} style={styles.activityJoinBtn}>
          <Text style={styles.activityJoinText}>Ver</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Quick action pills ───────────────────────────────────────
function QuickActionRow() {
  const actions = [
    { label: 'Criar sala', icon: Zap, color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
    { label: 'Entrar', icon: Play, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'Ranking', icon: TrendingUp, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    { label: 'Grupos', icon: Users, color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  ];

  return (
    <View style={styles.quickRow}>
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <TouchableOpacity key={a.label} activeOpacity={0.75} style={[styles.quickPill, { backgroundColor: a.bg, borderColor: `${a.color}30` }]}>
            <Icon size={15} color={a.color} />
            <Text style={[styles.quickLabel, { color: a.color }]}>{a.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Daily challenge card ─────────────────────────────────────
const CHALLENGE_REACTIONS = [
  { id: '1', user: 'Peg', action: 'Que jogada incrível 🤩😅😄', time: '5h', emoji: '🦊' },
  { id: '2', user: 'Rog', action: 'Todo mundo acertou e chocou geral 😄😄😡', time: '7h', emoji: '🐯' },
  { id: '3', user: 'Ana', action: 'Ganhei de novo nessa rodada ✈️', time: '7h', emoji: '🐻' },
];

function DailyChallengeCard() {
  const [activeTab, setActiveTab] = useState(0);
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: 0.73,
      duration: 900,
      delay: 400,
      useNativeDriver: false,
    }).start();
  }, []);

  const tabs = ['Progresso', 'Sequência', 'Recompensas'];

  return (
    <View style={styles.dailyCard}>
      <View style={styles.dailyCardHeader}>
        <Text style={styles.dailyCardTitle}>Desafios diários</Text>
        <TouchableOpacity style={styles.dailySettingsBtn} activeOpacity={0.7}>
          <Settings size={15} color="#7D7989" />
        </TouchableOpacity>
      </View>

      <View style={styles.dailyTabStrip}>
        {tabs.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(i)}
            style={[styles.dailyTabItem, activeTab === i && styles.dailyTabItemActive]}
            activeOpacity={0.75}
          >
            <Text style={[styles.dailyTabText, activeTab === i && styles.dailyTabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.dailyChallengeRow}>
        <View style={styles.dailyChallengeInfo}>
          <Text style={styles.dailyChallengeName}>Charade</Text>
          <View style={styles.dailyProgressTrack}>
            <Animated.View
              style={[styles.dailyProgressFill, {
                width: progressWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              }]}
            />
          </View>
        </View>
        <View style={styles.dailyChallengeCount}>
          <Zap size={13} color="#FFC107" fill="#FFC107" />
          <Text style={styles.dailyChallengeCountText}>/ 15</Text>
        </View>
      </View>

      <View style={styles.microRewardsRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.microRewardsTitle}>Micro Rewards</Text>
          <Text style={styles.microRewardsSub}>Complete desafios e ganhe recompensas.</Text>
        </View>
        <View style={styles.microRewardsIconWrap}>
          <LinearGradient
            colors={['rgba(255,107,53,0.2)', 'rgba(255,193,7,0.1)']}
            style={styles.microRewardsIconGrad}
          >
            <Text style={{ fontSize: 26 }}>🎁</Text>
          </LinearGradient>
        </View>
      </View>

      <View style={styles.reactionsListWrap}>
        {CHALLENGE_REACTIONS.map((r, i) => (
          <View key={r.id} style={[styles.reactionFeedItem, i > 0 && styles.reactionFeedItemBorder]}>
            <View style={styles.reactionFeedAvatarWrap}>
              <Text style={styles.reactionFeedAvatar}>{r.emoji}</Text>
            </View>
            <View style={styles.reactionFeedBody}>
              <View style={styles.reactionFeedHeader}>
                <View style={styles.reactionTypeBadge}>
                  <Text style={styles.reactionFeedType}>Reação</Text>
                </View>
                <Text style={styles.reactionFeedUser}>{r.user}</Text>
                <Text style={styles.reactionFeedTime}>{r.time}</Text>
              </View>
              <Text style={styles.reactionFeedText} numberOfLines={2}>{r.action}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Create room hero card ────────────────────────────────────
function CreateRoomCard({ navigation }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start(() => navigation?.navigate('GameHome'));
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={styles.createRoomOuter}>
      <Animated.View style={[styles.createRoomCard, { transform: [{ scale }] }]}>
        <LinearGradient
          colors={['#14101F', '#1A1430', '#0F0C18']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.createRoomGlow} pointerEvents="none" />
        <View style={styles.createRoomGlowRight} pointerEvents="none" />

        <View style={styles.createRoomIllustration} pointerEvents="none">
          <View style={[styles.createRoomOrb, { width: 70, height: 70, backgroundColor: 'rgba(139,92,246,0.18)', top: 8, left: '28%' }]} />
          <View style={[styles.createRoomOrb, { width: 40, height: 40, backgroundColor: 'rgba(167,139,250,0.14)', top: 38, left: '8%' }]} />
          <View style={[styles.createRoomOrb, { width: 30, height: 30, backgroundColor: 'rgba(255,107,53,0.15)', bottom: 12, right: '18%' }]} />
          <View style={[styles.createRoomOrb, { width: 20, height: 20, backgroundColor: 'rgba(255,193,7,0.12)', top: 14, right: '22%' }]} />

          <View style={styles.createRoomIconShadow}>
            <LinearGradient
              colors={['#9D72FF', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.createRoomIconGrad}
            >
              <Gamepad2 size={26} color="#fff" />
            </LinearGradient>
          </View>
        </View>

        <View style={styles.createRoomContent}>
          <Text style={styles.createRoomTitle}>Criar sala</Text>
          <Text style={styles.createRoomSub}>
            Reúna a galera, escolha o modo e comece a jogar agora.
          </Text>
          <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={styles.createRoomBtnOuter}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createRoomBtnGrad}
            >
              <Text style={styles.createRoomBtnText}>Criar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────
export default function NewHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(contentY, { toValue: 0, duration: 480, delay: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      {/* Background ambient glow */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      {/* ── Header ── */}
      <Animated.View style={[styles.header, { paddingTop: insets.top + 8, opacity: headerOpacity }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
          style={styles.backBtn}
        >
          <ArrowLeft size={18} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Sparkles size={13} color="#A78BFA" style={{ marginRight: 5 }} />
          <Text style={styles.headerLabel}>Nova Home</Text>
          <View style={styles.headerBeta}>
            <Text style={styles.headerBetaText}>TESTE</Text>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.75} style={styles.notifBtn}>
          <Star size={18} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ transform: [{ translateY: contentY }] }}>

          {/* Greeting */}
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greetingHi}>Boa tarde, Victor 👋</Text>
              <Text style={styles.greetingLine}>O grupo tá esperando você.</Text>
            </View>
            <View style={styles.greetingAvatarWrap}>
              <LinearGradient colors={['#7C3AED', '#4C1D95']} style={styles.greetingAvatar}>
                <Text style={styles.greetingAvatarText}>V</Text>
              </LinearGradient>
              <View style={styles.greetingOnline} />
            </View>
          </View>

          {/* Stats */}
          <StatsRow />

          {/* Daily challenges */}
          <DailyChallengeCard />

          {/* Featured game */}
          <SectionHeader title="Em destaque" icon={Flame} iconColor="#EF4444" />
          <FeaturedCard />

          {/* Quick actions */}
          <SectionHeader title="Ações rápidas" icon={Zap} iconColor="#8B5CF6" />
          <QuickActionRow />

          {/* Create room CTA */}
          <CreateRoomCard navigation={navigation} />

          {/* Game modes */}
          <SectionHeader title="Modos de jogo" icon={Gamepad2} iconColor="#A78BFA" action="Ver todos" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gameModesScroll}
          >
            {GAME_MODES.map((mode) => (
              <GameModeCard key={mode.key} mode={mode} />
            ))}
          </ScrollView>

          {/* Activity feed */}
          <SectionHeader title="Atividade recente" icon={Clock} iconColor="#9CA3AF" action="Ver tudo" />
          <View style={styles.feedCard}>
            {ACTIVITY_FEED.map((item, i) => (
              <View key={item.id}>
                <ActivityItem item={item} />
                {i < ACTIVITY_FEED.length - 1 && <View style={styles.feedDivider} />}
              </View>
            ))}
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  ambientGlow: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(124,58,237,0.12)',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.3,
  },
  headerBeta: {
    marginLeft: 6,
    backgroundColor: 'rgba(139,92,246,0.2)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
  },
  headerBetaText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: 0.8,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  // Greeting
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingHi: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  greetingLine: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  greetingAvatarWrap: { position: 'relative' },
  greetingAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  greetingOnline: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#0D0D0D',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statCardCenter: {
    borderColor: 'rgba(139,92,246,0.2)',
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sectionActionText: {
    fontSize: 12,
    color: 'rgba(139,92,246,0.8)',
    fontWeight: '500',
  },

  // Featured card
  featuredOuter: { marginBottom: 24 },
  featuredCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 180,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
  },
  featuredBorderGrad: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  featuredContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  featuredLeft: { flex: 1, zIndex: 2 },
  featuredTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  featuredTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: 1.2,
  },
  featuredTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.8,
    lineHeight: 30,
  },
  featuredSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 4,
    lineHeight: 16,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  featuredMetaText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
  },
  featuredPlayBtn: { marginTop: 14, alignSelf: 'flex-start' },
  featuredPlayGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  featuredPlayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  featuredRight: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredImage: {
    width: 110,
    height: 140,
  },

  // Quick actions
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Game modes
  gameModesScroll: {
    paddingRight: 16,
    gap: 10,
    marginBottom: 24,
  },
  gameModeCard: {
    width: 130,
    height: 170,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    position: 'relative',
  },
  gameModeGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  gameModeImage: {
    width: '100%',
    height: 110,
    marginTop: 8,
  },
  gameModeScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  gameModeFooter: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  gameModeTag: {
    backgroundColor: 'rgba(139,92,246,0.85)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 3,
  },
  gameModeTagText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.8,
  },
  gameModeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 15,
  },

  // Activity feed
  feedCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  feedDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  activityAvatarWrap: { position: 'relative' },
  activityAvatar: {
    fontSize: 26,
    lineHeight: 32,
  },
  activityLiveDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#111111',
  },
  activityBody: { flex: 1 },
  activityText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  activityUser: {
    fontWeight: '700',
    color: '#fff',
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  activityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  activityTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
  },
  activityJoinBtn: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activityJoinText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A78BFA',
  },

  // ─── Daily Challenge Card ──────────────────────────────────
  dailyCard: {
    backgroundColor: '#111116',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  dailyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  dailyCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  dailySettingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyTabStrip: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 4,
    marginBottom: 14,
  },
  dailyTabItem: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 10,
  },
  dailyTabItemActive: {
    backgroundColor: 'rgba(139,92,246,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.28)',
  },
  dailyTabText: {
    fontSize: 12,
    color: '#7D7989',
    fontWeight: '600',
  },
  dailyTabTextActive: {
    color: '#A78BFA',
  },
  dailyChallengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#1A1826',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  dailyChallengeInfo: {
    flex: 1,
  },
  dailyChallengeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 9,
  },
  dailyProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  dailyProgressFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: '#8B5CF6',
  },
  dailyChallengeCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dailyChallengeCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
  },
  microRewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#1A1826',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.1)',
  },
  microRewardsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  microRewardsSub: {
    fontSize: 11,
    color: '#7D7989',
    lineHeight: 16,
  },
  microRewardsIconWrap: {},
  microRewardsIconGrad: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionsListWrap: {
    paddingTop: 2,
    paddingBottom: 4,
  },
  reactionFeedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 10,
  },
  reactionFeedItemBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  reactionFeedAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionFeedAvatar: {
    fontSize: 20,
    lineHeight: 24,
  },
  reactionFeedBody: {
    flex: 1,
  },
  reactionFeedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  reactionTypeBadge: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  reactionFeedType: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A78BFA',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  reactionFeedUser: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B8B5C4',
    flex: 1,
  },
  reactionFeedTime: {
    fontSize: 11,
    color: '#7D7989',
  },
  reactionFeedText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
  },

  // ─── Create Room Card ──────────────────────────────────────
  createRoomOuter: {
    marginBottom: 24,
  },
  createRoomCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.22)',
    minHeight: 230,
  },
  createRoomGlow: {
    position: 'absolute',
    top: -50,
    left: '35%',
    marginLeft: -90,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(124,58,237,0.22)',
  },
  createRoomGlowRight: {
    position: 'absolute',
    bottom: -30,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(167,139,250,0.1)',
  },
  createRoomIllustration: {
    height: 130,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRoomOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  createRoomIconShadow: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 12,
  },
  createRoomIconGrad: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRoomContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  createRoomTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  createRoomSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.38)',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  createRoomBtnOuter: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
  },
  createRoomBtnGrad: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRoomBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
