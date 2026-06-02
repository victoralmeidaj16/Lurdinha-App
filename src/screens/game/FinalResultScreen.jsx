import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Share, Alert, ActivityIndicator, Dimensions, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, RefreshCw, Share2 } from 'lucide-react-native';
import Animated, {
    FadeInDown, FadeInUp, ZoomIn, FadeOut, FadeIn,
    useSharedValue, useAnimatedStyle, withTiming, withRepeat,
    withDelay, Easing,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import AvatarCircle from '../../components/AvatarCircle';
import SoundMuteButton from '../../components/SoundMuteButton';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../contexts/AuthContext';
import { formatFinalResultShareMessage, sortPlayersForResults } from '../../utils/gameShare';
import HostWaitingIndicator from '../../components/HostWaitingIndicator';
import { playSound, startMusic, stopMusic } from '../../utils/sounds';
import { triggerImpact } from '../../utils/haptics';
import AnimatedPressable from '../../components/AnimatedPressable';
import { colors, borderRadius } from '../../theme';

const { width: SW, height: SH } = Dimensions.get('window');
const RAY_COUNT = 18;
const RAY_LENGTH = Math.max(SW, SH) * 1.6;
const CONFETTI_COUNT = 28;
const CONFETTI_COLORS = ['#FFC107', '#E91E63', '#38BDF8', '#4ADE80', '#FF6B35', '#C084FC', '#F472B6', '#FDE68A'];
const QUICK_REACTIONS = ['👍', '😍', '❤️', '😂', '🔥', '🤩'];
const CELEBRATION_DURATION_MS = 4500;

// ── Confetti piece ────────────────────────────────────────────────────────────

function ConfettiPiece({ color, x, delay, pieceWidth, pieceHeight, rotStart, duration }) {
    const ty = useSharedValue(-80);
    const rot = useSharedValue(rotStart);
    const op = useSharedValue(0);

    useEffect(() => {
        ty.value = withDelay(delay, withTiming(SH + 80, { duration, easing: Easing.out(Easing.quad) }));
        rot.value = withDelay(delay, withRepeat(
            withTiming(rotStart + 360, { duration: 1000, easing: Easing.linear }),
            -1, false,
        ));
        op.value = withDelay(delay, withTiming(1, { duration: 200 }));
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: ty.value }, { rotate: `${rot.value}deg` }],
        opacity: op.value,
    }));

    return (
        <Animated.View
            pointerEvents="none"
            style={[styles.confettiPiece, { left: x, width: pieceWidth, height: pieceHeight, backgroundColor: color }, style]}
        />
    );
}

// ── Floating reaction ─────────────────────────────────────────────────────────

function FloatingReaction({ emoji, x, y, id, onDone }) {
    const ty = useSharedValue(0);
    const op = useSharedValue(1);
    const sc = useSharedValue(0.4);

    useEffect(() => {
        sc.value = withTiming(1, { duration: 200 });
        ty.value = withTiming(-300, { duration: 2200, easing: Easing.out(Easing.quad) });
        op.value = withDelay(1500, withTiming(0, { duration: 700 }));
        const t = setTimeout(() => onDone(id), 2400);
        return () => clearTimeout(t);
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: ty.value }, { scale: sc.value }],
        opacity: op.value,
    }));

    return (
        <Animated.View pointerEvents="none" style={[styles.floatingReaction, { left: x, top: y }, style]}>
            <Text style={styles.floatingReactionEmoji}>{emoji}</Text>
        </Animated.View>
    );
}

// ── Sunburst ──────────────────────────────────────────────────────────────────

const SunburstBackground = ({ cy }) => {
    const cx = SW / 2;
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width={SW} height={SH}>
                {Array.from({ length: RAY_COUNT }).map((_, i) => {
                    const angle = (i * (360 / RAY_COUNT) * Math.PI) / 180;
                    return (
                        <Line
                            key={i}
                            x1={cx} y1={cy}
                            x2={cx + Math.cos(angle) * RAY_LENGTH}
                            y2={cy + Math.sin(angle) * RAY_LENGTH}
                            stroke="rgba(255,255,255,0.035)"
                            strokeWidth="32"
                        />
                    );
                })}
            </Svg>
        </View>
    );
};

// ── Confetti data (stable) ────────────────────────────────────────────────────

const CONFETTI_DATA = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * SW,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: Math.random() * 1800,
    pieceWidth: 8 + Math.random() * 10,
    pieceHeight: 4 + Math.random() * 6,
    rotStart: Math.random() * 360,
    duration: 2800 + Math.random() * 2000,
}));

// ── Mock data for preview ─────────────────────────────────────────────────────

const PREVIEW_ROOM = {
    hostId: 'preview-host',
    status: 'finished',
    settings: { gameType: 'lurdinha' },
    players: [
        { uid: 'me',  name: 'Você',       score: 200, photoURL: null },
        { uid: 'p2',  name: 'Reguacte',   score: 140, photoURL: null },
        { uid: 'p3',  name: 'Marquinhos', score: 95,  photoURL: null },
        { uid: 'p4',  name: 'Jujuba',     score: 60,  photoURL: null },
    ],
};

// ── Main ──────────────────────────────────────────────────────────────────────

export default function FinalResultScreen({ route, navigation }) {
    const { roomId, preview } = route.params;
    const { currentUser } = useAuth();
    const { listenToRoom, leaveRoom, restartRoom, resetRoomToSession, loading } = useGame();
    const [roomData, setRoomData] = useState(preview ? PREVIEW_ROOM : null);
    const [step, setStep] = useState('celebration'); // 'celebration' | 'ranking'
    const [floatingReactions, setFloatingReactions] = useState([]);
    const hasRoutedRef = useRef(false);
    const hasPlayedSoundRef = useRef(false);
    const reactionIdRef = useRef(0);

    useEffect(() => {
        if (preview) return;
        const unsubscribe = listenToRoom(roomId, (data, meta) => {
            setRoomData(data);
            if (meta?.fromCache) return;
            if (data?.status === 'waiting' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                navigation.replace('Lobby', { roomId });
            }
        });
        return () => { unsubscribe(); leaveRoom(); };
    }, [roomId, preview]);

    useEffect(() => {
        if (roomData && !hasPlayedSoundRef.current) {
            hasPlayedSoundRef.current = true;
            playSound('winner');
        }
    }, [roomData]);

    const hasRoomData = Boolean(roomData);

    useFocusEffect(
        useCallback(() => {
            if (!hasRoomData) return undefined;

            startMusic('ranking_theme');
            return () => stopMusic('ranking_theme');
        }, [hasRoomData])
    );

    // Auto-transition celebration → ranking
    useEffect(() => {
        const t = setTimeout(() => {
            triggerImpact('medium');
            setStep('ranking');
        }, CELEBRATION_DURATION_MS);
        return () => clearTimeout(t);
    }, []);

    const handleReaction = (emoji, index) => {
        triggerImpact('light');
        const id = reactionIdRef.current++;
        const baseX = (SW / QUICK_REACTIONS.length) * index + (SW / QUICK_REACTIONS.length) / 2 - 20;
        const x = baseX + (Math.random() - 0.5) * 40;
        setFloatingReactions((prev) => [...prev, { id, emoji, x, y: SH - 200 }]);
    };

    const removeReaction = (id) => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    };

    const handleShareResults = async () => {
        try { await Share.share({ message: formatFinalResultShareMessage({ roomId, roomData }) }); } catch {}
    };

    const handleRestartRoom = async () => {
        if (!isHost || loading) return;
        try { await resetRoomToSession(roomId); } catch (err) {
            Alert.alert('Erro', err?.message || 'Não foi possível continuar a sessão.');
        }
    };

    if (!roomData) return null;

    const gameType = roomData.settings?.gameType || 'lurdinha';
    const isSecretGame = gameType === 'secret' || gameType === 'telephone';
    const isDrawGame = gameType === 'draw';
    const isPointsGame = isDrawGame
        || isSecretGame
        || gameType === 'most_likely'
        || gameType === 'obvious_mind'
        || gameType === 'tier_list';
    const sortedPlayers = sortPlayersForResults(roomData.players, gameType);
    const winner = sortedPlayers[0];
    const isHost = roomData.hostId === currentUser?.uid;
    const isCurrentUserWinner = preview ? true : winner?.uid === currentUser?.uid;
    const currentUserRank = sortedPlayers.findIndex((p) => p.uid === currentUser?.uid) + 1;
    const scoreUnit = isPointsGame ? 'pts' : '😈';
    // Avatar should land at the visual center accounting for bottom UI (~180px)
    const heroCY = SH * 0.44;
    // avatarWrapper is 320px tall, avatar center at 160px from wrapper top
    const heroPaddingTop = Math.max(16, heroCY - 160);

    const medalFor = (rank) => {
        if (rank === 1) return { emoji: '🥇', color: '#FFC107' };
        if (rank === 2) return { emoji: '🥈', color: '#C0C0C0' };
        if (rank === 3) return { emoji: '🥉', color: '#CD7F32' };
        return { emoji: `#${rank}`, color: 'rgba(255,255,255,0.35)' };
    };

    // ── Ranking view ──────────────────────────────────────────────────────────

    const sessionScores = roomData?.sessionScores || {};
    const sessionGames = roomData?.sessionGames || [];
    const hasSession = sessionGames.length > 0;
    const sessionPlayersSorted = [...sortedPlayers].sort(
        (a, b) => (sessionScores[b.uid] || 0) - (sessionScores[a.uid] || 0)
    );

    const GAME_TYPE_LABELS = {
        lurdinha: 'Lurdinha',
        draw: 'Desenho',
        most_likely: 'Mais Provável',
        obvious_mind: 'Na Minha Cabeça',
        tier_list: 'Tier List',
        impostor: 'Impostor',
        telephone: 'Telefone',
        secret: 'Telefone',
    };

    if (step === 'ranking') {
        return (
            <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
                <LinearGradient colors={['#08080C', '#111116', '#1a0840']} style={StyleSheet.absoluteFill} />
                <View style={styles.soundToggleTop}>
                    <SoundMuteButton compact />
                </View>

                <ScrollView style={styles.scroll} contentContainerStyle={styles.rankingScrollContent} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <Animated.View entering={FadeInDown.duration(320)} style={styles.rankingHeader}>
                        <Text style={styles.rankingHeaderEmoji}>🏆</Text>
                        <Text style={styles.rankingHeaderTitle}>Resultado Final</Text>
                        <Text style={styles.rankingHeaderSub}>
                            {isCurrentUserWinner ? 'Você venceu essa rodada!' : `Você ficou em ${currentUserRank}º lugar`}
                        </Text>
                    </Animated.View>

                    {/* Players */}
                    <Animated.View entering={FadeInUp.delay(120).duration(320)} style={styles.rankingCard}>
                        {sortedPlayers.map((player, index) => {
                            const rank = index + 1;
                            const medal = medalFor(rank);
                            const isMe = player.uid === currentUser?.uid || (preview && rank === 1);
                            return (
                                <View key={player.uid} style={[styles.rankRow, isMe && styles.rankRowMe, rank === 1 && styles.rankRowFirst]}>
                                    <Text style={[styles.rankMedal, { color: medal.color }]}>{medal.emoji}</Text>
                                    <AvatarCircle name={player.name} photoURL={player.photoURL} size={38} />
                                    <Text style={[styles.rankName, isMe && styles.rankNameMe]} numberOfLines={1}>
                                        {player.name}{isMe ? ' (você)' : ''}
                                    </Text>
                                    <Text style={[styles.rankScore, rank <= 3 && { color: medal.color }]}>
                                        {player.score || 0} {scoreUnit}
                                    </Text>
                                </View>
                            );
                        })}
                    </Animated.View>

                    {/* Session ranking */}
                    {hasSession && (
                        <Animated.View entering={FadeInUp.delay(240).duration(320)} style={styles.sessionCard}>
                            <View style={styles.sessionHeader}>
                                <Text style={styles.sessionTitle}>🎮 Placar da Sessão</Text>
                                <View style={styles.sessionGamePills}>
                                    {sessionGames.map((g, i) => (
                                        <View key={i} style={styles.sessionGamePill}>
                                            <Text style={styles.sessionGamePillText}>
                                                {GAME_TYPE_LABELS[g.gameType] || g.gameType}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                            {sessionPlayersSorted.map((player, index) => {
                                const isMe = player.uid === currentUser?.uid;
                                const medal = medalFor(index + 1);
                                return (
                                    <View key={player.uid} style={[styles.sessionRow, isMe && styles.rankRowMe]}>
                                        <Text style={[styles.rankMedal, { color: medal.color }]}>{medal.emoji}</Text>
                                        <AvatarCircle name={player.name} photoURL={player.photoURL} size={32} />
                                        <Text style={[styles.sessionName, isMe && styles.rankNameMe]} numberOfLines={1}>
                                            {player.name}{isMe ? ' (você)' : ''}
                                        </Text>
                                        <Text style={[styles.sessionScore, index === 0 && { color: '#FFC107' }]}>
                                            {sessionScores[player.uid] || 0} pts
                                        </Text>
                                    </View>
                                );
                            })}
                        </Animated.View>
                    )}
                </ScrollView>

                {/* Footer */}
                <Animated.View entering={FadeInUp.delay(300)} style={styles.footer}>
                    {isHost ? (
                        <AnimatedPressable
                            style={[styles.primaryButton, loading && styles.disabled]}
                            onPress={handleRestartRoom}
                            disabled={loading}
                            haptic="medium"
                        >
                            <LinearGradient
                                colors={['#8B5CF6', '#7C3AED']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.primaryGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <RefreshCw size={20} color="#fff" />
                                        <Text style={styles.primaryButtonText}>Próximo Jogo</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </AnimatedPressable>
                    ) : (
                        <View style={styles.waitingContainer}>
                            <HostWaitingIndicator
                                hostName={roomData?.players?.find((p) => p.uid === roomData?.hostId)?.name}
                                message={`${roomData?.players?.find((p) => p.uid === roomData?.hostId)?.name || 'Host'} está preparando o próximo jogo...`}
                            />
                        </View>
                    )}

                    <View style={styles.actionRow}>
                        <AnimatedPressable style={styles.secondaryButton} onPress={handleShareResults} haptic="light">
                            <Share2 size={18} color="#fff" />
                            <Text style={styles.secondaryButtonText}>Compartilhar</Text>
                        </AnimatedPressable>

                        <AnimatedPressable
                            style={styles.secondaryButton}
                            onPress={() => navigation.navigate('MainTabs', { screen: 'home' })}
                            haptic="medium"
                        >
                            <Home size={18} color="#fff" />
                            <Text style={styles.secondaryButtonText}>Voltar ao Início</Text>
                        </AnimatedPressable>
                    </View>
                </Animated.View>
            </Animated.View>
        );
    }

    // ── Celebration view ──────────────────────────────────────────────────────

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={isCurrentUserWinner ? ['#1E0A48', '#2A1060', '#0D0520'] : ['#08080C', '#111116', '#0D0520']}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.soundToggleTop}>
                <SoundMuteButton compact />
            </View>
            <SunburstBackground cy={heroCY} />

            {isCurrentUserWinner && CONFETTI_DATA.map((p) => <ConfettiPiece key={p.id} {...p} />)}
            {floatingReactions.map((r) => <FloatingReaction key={r.id} {...r} onDone={removeReaction} />)}

            <View style={styles.heroContainer}>
                <Animated.View entering={FadeInDown.duration(400)} style={[styles.hero, { paddingTop: heroPaddingTop }]}>

                    {/* Avatar with neon purple glow + crown on top */}
                    <Animated.View entering={ZoomIn.delay(200).springify()} style={styles.avatarWrapper}>
                        <View style={styles.glowRing3} />
                        <View style={styles.glowRing2} />
                        <View style={styles.glowRing1} />
                        <View style={styles.avatarGlowOuter}>
                            <View style={styles.avatarGlowInner}>
                                <AvatarCircle name={winner?.name || '?'} photoURL={winner?.photoURL} size={110} />
                            </View>
                        </View>
                        {/* Crown last = renders above glow and avatar */}
                        <Animated.Text entering={ZoomIn.delay(350).springify()} style={styles.crown}>
                            👑
                        </Animated.Text>
                    </Animated.View>

                    {/* Score badge */}
                    <Animated.View entering={FadeInDown.delay(420).springify()} style={styles.scoreBadge}>
                        <Text style={styles.scoreStar}>⭐</Text>
                        <Text style={styles.scoreValue}>{winner?.score || 0}</Text>
                    </Animated.View>

                    {/* Winner name */}
                    <Animated.Text entering={FadeInDown.delay(480)} style={styles.winnerName}>
                        {winner?.name}
                    </Animated.Text>

                    {/* Main title */}
                    <Animated.Text entering={FadeInUp.delay(560).springify()} style={[
                        styles.victoryTitle,
                        !isCurrentUserWinner && styles.victoryTitleSecondary,
                    ]}>
                        {isCurrentUserWinner ? 'Vitória!' : 'Fim de Jogo!'}
                    </Animated.Text>

                    {!isCurrentUserWinner && (
                        <Animated.Text entering={FadeInUp.delay(640)} style={styles.rankCaption}>
                            Você ficou em {currentUserRank}º lugar
                        </Animated.Text>
                    )}

                    {/* Tap to skip hint */}
                    <Animated.Text entering={FadeInUp.delay(1200)} style={styles.skipHint}>
                        Ranking em instantes...
                    </Animated.Text>
                </Animated.View>
            </View>

            {/* Bottom dark vignette */}
            <LinearGradient
                colors={['transparent', '#0A0519']}
                style={styles.bottomVignette}
                pointerEvents="none"
            />

            {/* Reaction bar */}
            <Animated.View entering={FadeInUp.delay(800)} style={styles.reactionBar}>
                <View style={styles.reactionRow}>
                    {QUICK_REACTIONS.map((emoji, i) => (
                        <AnimatedPressable
                            key={emoji}
                            style={styles.reactionBtn}
                            onPress={() => handleReaction(emoji, i)}
                            haptic="light"
                            activeScale={0.85}
                        >
                            <Text style={styles.reactionBtnEmoji}>{emoji}</Text>
                        </AnimatedPressable>
                    ))}
                </View>
            </Animated.View>

            {/* Skip button */}
            <Animated.View entering={FadeInUp.delay(900)} style={styles.skipRow}>
                <AnimatedPressable
                    onPress={() => { triggerImpact('light'); setStep('ranking'); }}
                    style={styles.skipButton}
                    haptic="light"
                >
                    <Text style={styles.skipButtonText}>Ver Ranking →</Text>
                </AnimatedPressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D0520' },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 240 },

    // ── Hero ──────────────────────────────────────────────────────────────────
    heroContainer: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
    },
    hero: {
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    crown: {
        position: 'absolute',
        // avatarGlowOuter top = (320-136)/2 = 92px; overlap 5% of 110px ≈ 6px → bottom at 98px; crown ~92px tall → top ≈ 6px
        top: 6,
        left: 0,
        right: 0,
        fontSize: 88,
        textAlign: 'center',
        transform: [{ rotate: '14deg' }],
        zIndex: 10,
    },
    avatarWrapper: {
        // negative margin pulls score/name/title up by the empty space below avatar in wrapper
        // avatarGlowOuter bottom sits at 228px of 320px wrapper → 92px empty below → pull up ~78px
        marginBottom: -78,
        width: 320,
        height: 320,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowRing1: {
        position: 'absolute',
        width: 170,
        height: 170,
        borderRadius: 85,
        backgroundColor: 'rgba(139,92,246,0.18)',
        shadowColor: '#9B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 55,
        elevation: 0,
    },
    glowRing2: {
        position: 'absolute',
        width: 230,
        height: 230,
        borderRadius: 115,
        backgroundColor: 'rgba(120,60,230,0.08)',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 75,
        elevation: 0,
    },
    glowRing3: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(100,40,200,0.04)',
        shadowColor: '#6D28D9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 95,
        elevation: 0,
    },
    avatarGlowOuter: {
        width: 136,
        height: 136,
        borderRadius: 68,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(139,92,246,0.22)',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 32,
        elevation: 20,
    },
    avatarGlowInner: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(196,181,253,0.5)',
        overflow: 'hidden',
    },
    bottomVignette: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: SH * 0.38,
        pointerEvents: 'none',
    },
    scoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.primary,
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: borderRadius.full,
        marginBottom: 10,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    scoreStar: { fontSize: 16 },
    scoreValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
    winnerName: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginBottom: 14, letterSpacing: 0.2 },
    victoryTitle: {
        fontSize: 72,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -2,
        textAlign: 'center',
        textShadowColor: 'rgba(139,92,246,0.5)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 24,
    },
    victoryTitleSecondary: { fontSize: 52, color: colors.textSecondary, textShadowColor: 'transparent' },
    rankCaption: { marginTop: 8, color: colors.textMuted, fontSize: 16, fontWeight: '500' },
    skipHint: {
        marginTop: 28,
        color: 'rgba(255,255,255,0.28)',
        fontSize: 13,
        fontWeight: '500',
        letterSpacing: 0.3,
    },

    // ── Floating reactions ────────────────────────────────────────────────────
    floatingReaction: { position: 'absolute', zIndex: 100 },
    floatingReactionEmoji: { fontSize: 40 },
    confettiPiece: { position: 'absolute', top: 0, borderRadius: 2 },

    // ── Reaction bar ──────────────────────────────────────────────────────────
    reactionBar: { position: 'absolute', bottom: 110, left: 0, right: 0, paddingHorizontal: 20 },
    reactionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(20,12,40,0.88)',
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    reactionBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.full },
    reactionBtnEmoji: { fontSize: 26 },

    // ── Skip ──────────────────────────────────────────────────────────────────
    skipRow: { position: 'absolute', bottom: Platform.OS === 'ios' ? 50 : 34, left: 0, right: 0, alignItems: 'center' },
    skipButton: { paddingHorizontal: 22, paddingVertical: 10 },
    skipButtonText: { color: 'rgba(196,181,253,0.65)', fontSize: 14, fontWeight: '700' },
    soundToggleTop: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 58 : 36,
        right: 18,
        zIndex: 20,
    },

    // ── Ranking view ──────────────────────────────────────────────────────────
    rankingScrollContent: { paddingBottom: 200, paddingTop: Platform.OS === 'ios' ? 64 : 44 },
    rankingHeader: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 28 },
    rankingHeaderEmoji: { fontSize: 52, marginBottom: 10 },
    rankingHeaderTitle: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginBottom: 6 },
    rankingHeaderSub: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
    rankingCard: {
        marginHorizontal: 20,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.card,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        padding: 16,
        gap: 8,
    },
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    rankRowMe: {
        backgroundColor: colors.primaryAlpha12,
        borderWidth: 1,
        borderColor: colors.borderStrong,
    },
    rankRowFirst: { backgroundColor: 'rgba(255,193,7,0.08)' },
    rankMedal: { fontSize: 20, width: 28, textAlign: 'center' },
    rankName: { flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
    rankNameMe: { color: colors.primaryLight },
    rankScore: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },

    // ── Footer ────────────────────────────────────────────────────────────────
    footer: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        gap: 10,
        backgroundColor: 'rgba(8,5,20,0.94)',
        borderTopWidth: 1,
        borderTopColor: colors.borderSoft,
    },
    actionRow: { flexDirection: 'row', gap: 10 },
    secondaryButton: {
        flex: 1,
        minHeight: 52,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        backgroundColor: 'rgba(255,255,255,0.07)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
    },
    secondaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    primaryButton: { borderRadius: borderRadius.md, overflow: 'hidden', width: '100%', marginBottom: 4 },
    primaryGradient: { padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    waitingContainer: { width: '100%', minHeight: 56, justifyContent: 'center', alignItems: 'center', borderRadius: borderRadius.md, backgroundColor: 'rgba(15,23,42,0.4)', borderWidth: 1, borderColor: colors.borderSoft, paddingHorizontal: 16, marginBottom: 4 },
    disabled: { opacity: 0.6 },

    // ── Session ranking ───────────────────────────────────────────────────────
    sessionCard: {
        marginHorizontal: 20,
        marginTop: 14,
        backgroundColor: 'rgba(139,92,246,0.07)',
        borderRadius: borderRadius.card,
        borderWidth: 1,
        borderColor: 'rgba(139,92,246,0.22)',
        padding: 16,
        gap: 8,
    },
    sessionHeader: { marginBottom: 4 },
    sessionTitle: { color: '#C4B5FD', fontSize: 13, fontWeight: '900', letterSpacing: 0.8, marginBottom: 8 },
    sessionGamePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    sessionGamePill: {
        backgroundColor: 'rgba(139,92,246,0.18)',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: 'rgba(139,92,246,0.3)',
    },
    sessionGamePillText: { color: '#DDD6FE', fontSize: 11, fontWeight: '700' },
    sessionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    sessionName: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600' },
    sessionScore: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '800' },
});
