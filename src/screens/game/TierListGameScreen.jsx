import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, Clock, Send } from 'lucide-react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    FadeOut,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Header from '../../components/Header';
import AvatarCircle from '../../components/AvatarCircle';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../hooks/useGame';
import { TIERS } from '../../hooks/game/tierList';
import { playSound } from '../../utils/sounds';

const resolveStartTime = (value) => {
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function TierListGameScreen({ roomId, gameState }) {
    const navigation = useNavigation();
    const { currentUser } = useAuth();
    const { submitAnswer, calculateRoundResults, removeFromRoom, leaveRoom } = useGame();

    const [placements, setPlacements] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [phase, setPhase] = useState('classifying'); // 'classifying' | 'summary' | 'submitted'
    const [timeLeft, setTimeLeft] = useState(gameState?.settings?.timePerRound || 30);
    const isCalculating = useRef(false);
    const timerScale = useSharedValue(1);
    const timerProgress = useSharedValue(1);

    const players = gameState?.players || [];
    const answers = gameState?.roundData?.answers || {};
    const currentRound = gameState?.currentRound || 1;
    const totalRounds = gameState?.settings?.totalRounds || 5;
    const question = gameState?.roundData?.question || 'Quem se destaca mais?';
    const isHost = gameState?.hostId === currentUser?.uid;

    const otherPlayers = players.filter((p) => p.uid !== currentUser?.uid);
    const allPlayersAnswered = players.length > 0 && players.every((player) => Boolean(answers[player.uid]));
    const allClassified = otherPlayers.length > 0 && otherPlayers.every((p) => placements[p.uid]);
    const currentPlayer = otherPlayers[currentIndex];

    // Reset when round changes
    useEffect(() => {
        setPlacements({});
        setCurrentIndex(0);
        setPhase(answers[currentUser?.uid] ? 'submitted' : 'classifying');
        isCalculating.current = false;
    }, [currentRound, currentUser?.uid]);

    // Detect already-submitted answer
    useEffect(() => {
        if (answers[currentUser?.uid]) {
            setPhase('submitted');
        }
    }, [answers, currentUser?.uid]);

    // Timer
    useEffect(() => {
        if (!gameState?.roundData?.startTime) return undefined;
        const startTime = resolveStartTime(gameState.roundData.startTime);
        const totalTime = gameState.settings?.timePerRound || 30;
        if (!startTime) { setTimeLeft(totalTime); return undefined; }

        const endTime = new Date(startTime.getTime() + totalTime * 1000);
        const tick = () => {
            const diff = Math.ceil((endTime - new Date()) / 1000);
            if (diff <= 0) {
                setTimeLeft(0);
                timerProgress.value = withTiming(0, { duration: 300 });
                handleTimeUp();
                return false;
            }
            setTimeLeft(diff);
            timerProgress.value = withTiming(diff / totalTime, { duration: 850 });
            if (diff <= 8) {
                timerScale.value = withSequence(
                    withTiming(1.18, { duration: 100 }),
                    withTiming(1, { duration: 100 })
                );
            }
            return true;
        };

        tick();
        const interval = setInterval(() => { if (!tick()) clearInterval(interval); }, 1000);
        return () => clearInterval(interval);
    }, [gameState?.roundData?.startTime]);

    // Auto-calculate when all submitted
    useEffect(() => {
        if (!isHost || !allPlayersAnswered || isCalculating.current) return;
        isCalculating.current = true;
        calculateRoundResults(roomId, gameState).catch(() => { isCalculating.current = false; });
    }, [allPlayersAnswered]);

    const handleTimeUp = async () => {
        if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        if (isHost && !isCalculating.current) {
            isCalculating.current = true;
            try { await calculateRoundResults(roomId, gameState); }
            catch { isCalculating.current = false; }
        }
    };

    const handleTierSelect = (tier) => {
        if (!currentPlayer || phase !== 'classifying' || timeLeft === 0) return;
        playSound('ui_toggle');
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const next = { ...placements, [currentPlayer.uid]: tier };
        setPlacements(next);

        const nextIndex = currentIndex + 1;
        if (nextIndex >= otherPlayers.length) {
            setPhase('summary');
        } else {
            setCurrentIndex(nextIndex);
        }
    };

    const handleSubmit = async () => {
        if (!allClassified || phase !== 'summary' || timeLeft === 0) return;
        try {
            const sanitizedPlacements = Object.fromEntries(
                otherPlayers
                    .map((player) => [player.uid, placements[player.uid]])
                    .filter(([, tier]) => Boolean(tier))
            );
            setPhase('submitted');
            playSound('answer_submit');
            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await submitAnswer(roomId, sanitizedPlacements);
            playSound('answer_success');
        } catch {
            setPhase('summary');
            playSound('answer_error');
            Alert.alert('Erro', 'Falha ao enviar classificações.');
        }
    };

    const handleReClassify = (playerUid) => {
        const idx = otherPlayers.findIndex((p) => p.uid === playerUid);
        if (idx === -1) return;
        setCurrentIndex(idx);
        setPhase('classifying');
    };

    const timerTextStyle = useAnimatedStyle(() => ({
        transform: [{ scale: timerScale.value }],
        color: timeLeft <= 8 ? '#F87171' : '#FFFFFF',
    }));

    const timerBarFillStyle = useAnimatedStyle(() => {
        const color = interpolateColor(
            timerProgress.value,
            [0, 0.35, 1],
            ['#EF4444', '#F59E0B', '#A78BFA']
        );
        return { width: `${timerProgress.value * 100}%`, backgroundColor: color };
    });

    if (!gameState) {
        return <View style={styles.container}><ActivityIndicator color="#fff" /></View>;
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0f0f12', '#14121d', '#1a0f2e']} style={styles.background} />
            <View pointerEvents="none" style={styles.glowTop} />
            <View pointerEvents="none" style={styles.glowBottom} />

            <Header
                title={`Rodada ${currentRound}/${totalRounds}`}
                transparent
                showExit
                showSoundToggle
                onConfirmExit={async () => {
                    await removeFromRoom(roomId);
                    leaveRoom();
                    navigation.navigate('GameHome');
                }}
            />

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Timer */}
                <Animated.View entering={FadeInDown.delay(80)} style={styles.timerCard}>
                    <View style={styles.timerRow}>
                        <Clock size={15} color={timeLeft <= 8 ? '#F87171' : '#A78BFA'} />
                        <Text style={styles.timerLabel}>Tempo para classificar</Text>
                        <Animated.Text style={[styles.timerValue, timerTextStyle]}>{timeLeft}s</Animated.Text>
                    </View>
                    <View style={styles.timerTrack}>
                        <Animated.View style={[styles.timerFill, timerBarFillStyle]} />
                    </View>
                </Animated.View>

                {/* Question */}
                <Animated.View entering={FadeInDown.delay(160)} style={styles.questionCard}>
                    <Text style={styles.questionLabel}>🏆 TIER LIST</Text>
                    <Text style={styles.questionText}>{question}</Text>
                </Animated.View>

                {/* Main content area */}
                {phase === 'submitted' ? (
                    <Animated.View entering={FadeIn} style={styles.submittedCard}>
                        <CheckCircle2 size={36} color="#6BCB77" />
                        <Text style={styles.submittedTitle}>Classificações enviadas!</Text>
                        <Text style={styles.submittedSub}>Aguardando o grupo revelar o veredito.</Text>
                        <View style={styles.submittedPlacements}>
                            {otherPlayers.map((p) => {
                                const myAnswer = answers[currentUser?.uid];
                                const tier = myAnswer?.[p.uid] || placements[p.uid];
                                const tierDef = TIERS.find((t) => t.key === tier);
                                return (
                                    <View key={p.uid} style={styles.submittedRow}>
                                        <AvatarCircle name={p.name} photoURL={p.photoURL} size={32} />
                                        <Text style={styles.submittedName} numberOfLines={1}>{p.name}</Text>
                                        {tierDef ? (
                                            <View style={[styles.tierBadgeSmall, { backgroundColor: tierDef.bg, borderColor: tierDef.border }]}>
                                                <Text style={[styles.tierBadgeSmallText, { color: tierDef.color }]}>{tierDef.key}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                );
                            })}
                        </View>
                    </Animated.View>
                ) : phase === 'summary' ? (
                    <Animated.View entering={FadeIn} style={styles.summarySection}>
                        <Text style={styles.sectionLabel}>RESUMO — CONFIRME ANTES DE ENVIAR</Text>
                        {otherPlayers.map((p, i) => {
                            const tier = placements[p.uid];
                            const tierDef = TIERS.find((t) => t.key === tier);
                            return (
                                <Animated.View key={p.uid} entering={FadeInDown.delay(i * 60)}>
                                    <TouchableOpacity
                                        style={styles.summaryRow}
                                        onPress={() => handleReClassify(p.uid)}
                                        activeOpacity={0.75}
                                    >
                                        <AvatarCircle name={p.name} photoURL={p.photoURL} size={42} />
                                        <View style={styles.summaryInfo}>
                                            <Text style={styles.summaryName}>{p.name}</Text>
                                            <Text style={styles.summaryHint}>Toque para reclassificar</Text>
                                        </View>
                                        {tierDef ? (
                                            <View style={[styles.tierBadge, { backgroundColor: tierDef.bg, borderColor: tierDef.border }]}>
                                                <Text style={[styles.tierBadgeText, { color: tierDef.color }]}>{tierDef.key}</Text>
                                            </View>
                                        ) : null}
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        })}

                        <Animated.View entering={FadeInUp.delay(otherPlayers.length * 60 + 60)}>
                            <TouchableOpacity
                                style={[styles.submitBtn, (!allClassified || timeLeft === 0) && styles.submitBtnDisabled]}
                                onPress={handleSubmit}
                                disabled={!allClassified || timeLeft === 0}
                                activeOpacity={0.84}
                            >
                                <LinearGradient
                                    colors={allClassified && timeLeft > 0 ? ['#8B5CF6', '#7C3AED'] : ['#3A3A42', '#292930']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.submitGradient}
                                >
                                    <Text style={styles.submitText}>Confirmar classificações</Text>
                                    <Send size={18} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </Animated.View>
                ) : (
                    /* Classifying phase */
                    <Animated.View entering={FadeInDown.delay(240)} style={styles.classifySection}>
                        <Text style={styles.sectionLabel}>
                            {currentIndex + 1} / {otherPlayers.length} JOGADORES
                        </Text>

                        {currentPlayer ? (
                            <Animated.View key={currentPlayer.uid} entering={FadeIn.duration(220)} style={styles.playerCard}>
                                <AvatarCircle name={currentPlayer.name} photoURL={currentPlayer.photoURL} size={72} />
                                <Text style={styles.playerName}>{currentPlayer.name}</Text>
                                <Text style={styles.playerHint}>Escolha o tier desta pessoa</Text>
                            </Animated.View>
                        ) : null}

                        <View style={styles.tiersRow}>
                            {TIERS.map((tier) => (
                                <TouchableOpacity
                                    key={tier.key}
                                    style={[styles.tierBtn, { backgroundColor: tier.bg, borderColor: tier.border }]}
                                    onPress={() => handleTierSelect(tier.key)}
                                    disabled={timeLeft === 0}
                                    activeOpacity={0.78}
                                >
                                    <Text style={[styles.tierBtnLetter, { color: tier.color }]}>{tier.key}</Text>
                                    <Text style={[styles.tierBtnDesc, { color: tier.color }]}>{tier.description}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Progress dots */}
                        <View style={styles.progressDots}>
                            {otherPlayers.map((p, i) => (
                                <View
                                    key={p.uid}
                                    style={[
                                        styles.dot,
                                        placements[p.uid] && styles.dotDone,
                                        i === currentIndex && styles.dotActive,
                                    ]}
                                />
                            ))}
                        </View>
                    </Animated.View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f12' },
    background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    glowTop: {
        position: 'absolute', top: 96, right: -72,
        width: 220, height: 220, borderRadius: 999,
        backgroundColor: 'rgba(139,92,246,0.14)',
    },
    glowBottom: {
        position: 'absolute', left: -96, bottom: 90,
        width: 220, height: 220, borderRadius: 999,
        backgroundColor: 'rgba(168,85,247,0.09)',
    },
    content: { flex: 1 },
    scrollContent: { padding: 24, paddingBottom: 48 },

    timerCard: {
        borderRadius: 20, padding: 16, marginBottom: 16,
        backgroundColor: 'rgba(17,17,23,0.76)',
        borderWidth: 1, borderColor: 'rgba(167,139,250,0.16)',
    },
    timerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    timerLabel: { flex: 1, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '700' },
    timerValue: { color: '#fff', fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] },
    timerTrack: { height: 9, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.09)', overflow: 'hidden' },
    timerFill: { height: '100%', borderRadius: 999 },

    questionCard: {
        borderRadius: 24, padding: 20, marginBottom: 20,
        backgroundColor: 'rgba(18,18,24,0.94)',
        borderWidth: 1, borderColor: 'rgba(167,139,250,0.18)',
        alignItems: 'center',
    },
    questionLabel: {
        color: '#A78BFA', fontSize: 11, fontWeight: '900',
        letterSpacing: 1.8, marginBottom: 10,
    },
    questionText: {
        color: '#fff', fontSize: 22, fontWeight: '900',
        textAlign: 'center', lineHeight: 29,
    },

    sectionLabel: {
        color: '#A78BFA', fontSize: 11, fontWeight: '900',
        letterSpacing: 1.8, marginBottom: 14,
    },

    classifySection: { gap: 0 },

    playerCard: {
        alignItems: 'center', borderRadius: 28, padding: 28,
        backgroundColor: 'rgba(24,18,38,0.92)',
        borderWidth: 1, borderColor: 'rgba(167,139,250,0.18)',
        marginBottom: 18,
    },
    playerName: {
        color: '#fff', fontSize: 22, fontWeight: '900',
        marginTop: 14, marginBottom: 4, textAlign: 'center',
    },
    playerHint: { color: 'rgba(255,255,255,0.42)', fontSize: 13, textAlign: 'center' },

    tiersRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    tierBtn: {
        flex: 1, borderRadius: 16, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14,
    },
    tierBtnLetter: { fontSize: 22, fontWeight: '900' },
    tierBtnDesc: { fontSize: 9, fontWeight: '700', marginTop: 2, textAlign: 'center', opacity: 0.85 },

    progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.12)' },
    dotDone: { backgroundColor: '#8B5CF6' },
    dotActive: { backgroundColor: '#A78BFA', width: 20 },

    summarySection: { gap: 10 },
    summaryRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderRadius: 20, padding: 14,
        backgroundColor: 'rgba(24,24,31,0.92)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    },
    summaryInfo: { flex: 1 },
    summaryName: { color: '#fff', fontSize: 16, fontWeight: '800' },
    summaryHint: { color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 1 },

    tierBadge: {
        width: 44, height: 44, borderRadius: 12, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center',
    },
    tierBadgeText: { fontSize: 20, fontWeight: '900' },

    submitBtn: { borderRadius: 24, overflow: 'hidden', marginTop: 8 },
    submitBtnDisabled: { opacity: 0.6 },
    submitGradient: {
        paddingVertical: 19, paddingHorizontal: 22,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    submitText: { color: '#fff', fontSize: 17, fontWeight: '900' },

    submittedCard: {
        alignItems: 'center', borderRadius: 28, padding: 24,
        backgroundColor: 'rgba(107,203,119,0.08)',
        borderWidth: 1, borderColor: 'rgba(107,203,119,0.22)',
    },
    submittedTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 12, marginBottom: 4 },
    submittedSub: { color: 'rgba(255,255,255,0.55)', fontSize: 14, textAlign: 'center', marginBottom: 18 },
    submittedPlacements: { width: '100%', gap: 10 },
    submittedRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 10,
    },
    submittedName: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '700' },
    tierBadgeSmall: {
        width: 34, height: 34, borderRadius: 10, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center',
    },
    tierBadgeSmallText: { fontSize: 15, fontWeight: '900' },
});
