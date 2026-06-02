import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    CheckCircle2,
    Clock,
    Eye,
    LockKeyhole,
    Send,
    Skull,
    VoteIcon,
} from 'lucide-react-native';

import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    FadeInUp,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
    ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Header from '../../components/Header';
import AvatarCircle from '../../components/AvatarCircle';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../hooks/useGame';
import { IMPOSTOR_VOTING_TIME } from '../../hooks/game/impostor';
import { playSound } from '../../utils/sounds';

const QUICK_IMPOSTOR_REACTIONS = ['😂', '😳', '🤔', '👀', '🔥', '💀', '👑'];

const resolveTime = (value) => {
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

function FloatingCardReaction({ emoji, index = 0 }) {
    const translateY = useSharedValue(8);
    const translateX = useSharedValue((index % 3) * 10);
    const opacity = useSharedValue(1);
    const scale = useSharedValue(0.45);

    useEffect(() => {
        scale.value = withTiming(1, { duration: 180 });
        translateY.value = withTiming(-74, { duration: 1800, easing: Easing.out(Easing.quad) });
        translateX.value = withTiming(((index % 2) === 0 ? -1 : 1) * (12 + (index % 3) * 8), { duration: 1800 });
        opacity.value = withDelay(1050, withTiming(0, { duration: 650 }));
    }, [index]);

    const style = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    return (
        <Animated.View pointerEvents="none" style={[styles.cardFloatingReaction, style]}>
            <Text style={styles.cardFloatingReactionEmoji}>{emoji}</Text>
        </Animated.View>
    );
}

function TypingDots() {
    const op1 = useSharedValue(0.3);
    const op2 = useSharedValue(0.3);
    const op3 = useSharedValue(0.3);

    useEffect(() => {
        const animate = () => {
            op1.value = withSequence(
                withTiming(1, { duration: 350 }),
                withDelay(300, withTiming(0.3, { duration: 350 })),
            );
            op2.value = withDelay(180, withSequence(
                withTiming(1, { duration: 350 }),
                withDelay(300, withTiming(0.3, { duration: 350 })),
            ));
            op3.value = withDelay(360, withSequence(
                withTiming(1, { duration: 350 }),
                withDelay(300, withTiming(0.3, { duration: 350 })),
            ));
        };
        animate();
        const id = setInterval(animate, 1400);
        return () => clearInterval(id);
    }, []);

    const s1 = useAnimatedStyle(() => ({ opacity: op1.value }));
    const s2 = useAnimatedStyle(() => ({ opacity: op2.value }));
    const s3 = useAnimatedStyle(() => ({ opacity: op3.value }));

    return (
        <View style={styles.typingDots}>
            <Animated.View style={[styles.typingDot, s1]} />
            <Animated.View style={[styles.typingDot, s2]} />
            <Animated.View style={[styles.typingDot, s3]} />
        </View>
    );
}

function ImpostorRoundHeader({ currentRound, totalRounds, subtitle, phaseTone = 'violet', onExit }) {
    const progressItems = Array.from({ length: Math.max(totalRounds, 1) });

    return (
        <Animated.View entering={FadeInDown} style={styles.gameTopHeader}>
            <Pressable onPress={onExit} style={styles.gameHeaderExit} hitSlop={10}>
                <Text style={styles.gameHeaderExitText}>×</Text>
            </Pressable>
            <View style={styles.mascotBadge}>
                <Text style={styles.mascotBadgeArc}>LURDINHA</Text>
                <Text style={styles.mascotBadgeEmoji}>👵🏽</Text>
            </View>
            <View style={styles.gameHeaderCopy}>
                <Text style={styles.gameHeaderTitle}>Impostor Online</Text>
                <Text style={styles.gameHeaderSubtitle}>{subtitle}</Text>
            </View>
            <Text style={styles.roundProgressLabel}>
                Rodada {currentRound}/{totalRounds}
            </Text>
            <View style={styles.roundProgressTrack}>
                {progressItems.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.roundProgressSegment,
                            index < currentRound && styles.roundProgressSegmentActive,
                            phaseTone === 'danger' && index < currentRound && styles.roundProgressSegmentDanger,
                        ]}
                    />
                ))}
            </View>
        </Animated.View>
    );
}

export default function ImpostorOnlineGameScreen({ roomId, gameState, isSandbox = false }) {
    const navigation = useNavigation();
    const { currentUser } = useAuth();
    const {
        markImpostorRoleViewed,
        submitImpostorClue,
        submitImpostorReaction,
        submitImpostorVote,
        advanceImpostorPhase,
        calculateRoundResults,
        removeFromRoom,
        leaveRoom,
    } = useGame();

    const phase = gameState?.roundData?.phase || 'role_reveal';
    const roundData = gameState?.roundData || {};
    const players = gameState?.players || [];
    const isHost = gameState?.hostId === currentUser?.uid;
    const impostorId = roundData.impostorId;
    const isImpostor = currentUser?.uid === impostorId;
    const myUid = currentUser?.uid;

    // Role reveal state
    const [roleRevealed, setRoleRevealed] = useState(false);
    const [isHolding, setIsHolding] = useState(false);
    const holdTimer = useRef(null);
    const holdProgress = useSharedValue(0);

    // Discussion state
    const [clue, setClue] = useState('');
    const [clueSubmitted, setClueSubmitted] = useState(false);
    const [turnElapsed, setTurnElapsed] = useState(0);

    useEffect(() => {
        if (phase !== 'discussion') return undefined;
        setTurnElapsed(0);
        const id = setInterval(() => setTurnElapsed(prev => prev + 1), 1000);
        return () => clearInterval(id);
    }, [phase, roundData.currentAnswerTurnIndex]);

    // Voting state
    const [selectedVote, setSelectedVote] = useState(null);
    const [voteSubmitted, setVoteSubmitted] = useState(false);

    // Timer state
    const [timeLeft, setTimeLeft] = useState(0);
    const timerProgress = useSharedValue(1);
    const timerScale = useSharedValue(1);
    const isAdvancing = useRef(false);

    // Card reveal animation
    const cardScale = useSharedValue(1);
    const cardOpacity = useSharedValue(1);

    const currentRound = gameState?.currentRound || 1;
    const totalRounds = gameState?.settings?.totalRounds || 3;
    const handleExitGame = () => {
        Alert.alert(
            'Sair do jogo',
            'Você quer sair para a home mesmo?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    style: 'destructive',
                    onPress: async () => {
                        if (!isSandbox) {
                            await removeFromRoom(roomId);
                            leaveRoom();
                        }
                        navigation.navigate('GameHome');
                    },
                },
            ],
        );
    };

    // Reset state on round or phase change
    useEffect(() => {
        setRoleRevealed(Boolean(roundData.rolesRevealed?.[myUid]));
        setClue('');
        setClueSubmitted(Boolean(roundData.clues?.some(c => c.uid === myUid)));
        setSelectedVote(roundData.votes?.[myUid] || null);
        setVoteSubmitted(Boolean(roundData.votes?.[myUid]));
        holdProgress.value = 0;
        isAdvancing.current = false;
    }, [currentRound, phase, myUid]);

    // Sync submitted states from Firebase
    useEffect(() => {
        if (roundData.rolesRevealed?.[myUid]) setRoleRevealed(true);
        if (roundData.clues?.some(c => c.uid === myUid)) setClueSubmitted(true);
        if (roundData.votes?.[myUid]) {
            setVoteSubmitted(true);
            setSelectedVote(roundData.votes[myUid]);
        }
    }, [roundData.rolesRevealed, roundData.clues, roundData.votes, myUid]);

    // Timer for voting phase
    useEffect(() => {
        if (phase !== 'voting' || !roundData.votingStartTime) return undefined;
        const startTime = resolveTime(roundData.votingStartTime);
        if (!startTime) return undefined;
        const totalTime = IMPOSTOR_VOTING_TIME;
        const endTime = new Date(startTime.getTime() + totalTime * 1000);

        const tick = () => {
            const diff = Math.ceil((endTime - new Date()) / 1000);
            if (diff <= 0) {
                setTimeLeft(0);
                timerProgress.value = withTiming(0, { duration: 400 });
                handleVotingEnd();
                return false;
            }
            setTimeLeft(diff);
            timerProgress.value = withTiming(diff / totalTime, { duration: 900 });
            if (diff <= 10) {
                timerScale.value = withSequence(
                    withTiming(1.2, { duration: 80 }),
                    withTiming(1, { duration: 80 }),
                );
            }
            return true;
        };

        tick();
        const interval = setInterval(() => {
            if (!tick()) clearInterval(interval);
        }, 1000);
        return () => clearInterval(interval);
    }, [phase, roundData.votingStartTime]);

    // Auto-advance to discussion when all roles revealed
    useEffect(() => {
        if (phase !== 'role_reveal' || !isHost) return;
        const revealed = roundData.rolesRevealed || {};
        const allRevealed = players.length > 0 && players.every(p => revealed[p.uid]);
        if (!isSandbox && allRevealed && !isAdvancing.current) {
            isAdvancing.current = true;
            advanceImpostorPhase(roomId, 'discussion').catch(() => {
                isAdvancing.current = false;
            });
        }
    }, [roundData.rolesRevealed, phase, isHost, players]);

    // Auto-advance to results when all votes in
    useEffect(() => {
        if (phase !== 'voting' || !isHost) return;
        const voteCount = Object.keys(roundData.votes || {}).length;
        const allVoted = players.length > 0 && voteCount >= players.length;
        if (!isSandbox && allVoted && !isAdvancing.current) {
            isAdvancing.current = true;
            calculateRoundResults(roomId, gameState).catch(() => {
                isAdvancing.current = false;
            });
        }
    }, [roundData.votes, phase, isHost, players]);

    const handleVotingEnd = async () => {
        if (isSandbox || !isHost || isAdvancing.current) return;
        isAdvancing.current = true;
        if (Platform.OS === 'ios') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        try {
            await calculateRoundResults(roomId, gameState);
        } catch {
            isAdvancing.current = false;
        }
    };

    // Press-and-hold to reveal role
    const startHold = () => {
        if (roleRevealed) return;
        setIsHolding(true);
        holdProgress.value = withTiming(1, { duration: 700 });
        holdTimer.current = setTimeout(async () => {
            setIsHolding(false);
            setRoleRevealed(true);
            cardScale.value = withSpring(1.05, { damping: 12 }, () => {
                cardScale.value = withSpring(1);
            });
            if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }
            playSound(isImpostor ? 'mockingjay_whistle' : 'answer_submit');
            if (!isSandbox) {
                await markImpostorRoleViewed(roomId);
            }
        }, 700);
    };

    const cancelHold = () => {
        clearTimeout(holdTimer.current);
        setIsHolding(false);
        holdProgress.value = withTiming(0, { duration: 200 });
    };

    const handleClueSubmit = async () => {
        if (!clue.trim() || clueSubmitted) return;
        try {
            setClueSubmitted(true);
            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (!isSandbox) {
                await submitImpostorClue(roomId, clue.trim());
            }
            playSound('answer_success');
        } catch {
            setClueSubmitted(false);
        }
    };

    const handleVoteSubmit = async () => {
        if (!selectedVote || voteSubmitted) return;
        try {
            setVoteSubmitted(true);
            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (!isSandbox) {
                await submitImpostorVote(roomId, selectedVote);
            }
            playSound('answer_success');
        } catch {
            setVoteSubmitted(false);
        }
    };

    const handleImpostorReaction = async (targetUid, emoji) => {
        if (!targetUid || !emoji) return;
        try {
            if (Platform.OS === 'ios') Haptics.selectionAsync();
            playSound('ui_tap_soft');
            if (!isSandbox) {
                await submitImpostorReaction(roomId, targetUid, emoji);
            }
        } catch {
            playSound('answer_error');
        }
    };

    const timerBarFillStyle = useAnimatedStyle(() => {
        const color = interpolateColor(
            timerProgress.value,
            [0, 0.3, 0.6, 1],
            ['#ef4444', '#f97316', '#eab308', '#10b981'],
        );
        return { width: `${timerProgress.value * 100}%`, backgroundColor: color };
    });

    const timerTextStyle = useAnimatedStyle(() => ({
        transform: [{ scale: timerScale.value }],
    }));

    const holdRingStyle = useAnimatedStyle(() => ({
        opacity: holdProgress.value,
        transform: [{ scale: 0.9 + holdProgress.value * 0.1 }],
    }));

    const holdBorderWidth = useAnimatedStyle(() => ({
        borderBottomWidth: 4 * holdProgress.value,
    }));

    const revealedCardScale = useAnimatedStyle(() => ({
        transform: [{ scale: cardScale.value }],
    }));

    // ── Phase: Role Reveal ──────────────────────────────────────────
    if (phase === 'role_reveal') {
        const revealed = roundData.rolesRevealed || {};
        const confirmedCount = Object.keys(revealed).length;

        return (
            <View style={styles.container}>
                <LinearGradient colors={['#0d0a14', '#130c1e', '#1a0d2e']} style={StyleSheet.absoluteFill} />
                <View style={styles.glow1} />
                <View style={styles.glow2} />

                <Header
                    title={`Rodada ${currentRound}/${totalRounds}`}
                    transparent
                    showExit
                    showSoundToggle
                    onConfirmExit={async () => {
                        if (!isSandbox) {
                            await removeFromRoom(roomId);
                            leaveRoom();
                        }
                        navigation.navigate('GameHome');
                    }}
                />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeInDown.delay(100)} style={styles.phaseHeader}>
                        <Text style={styles.phaseLabel}>REVELAR PAPEL</Text>
                        <Text style={styles.phaseTitle}>Veja sua função em segredo</Text>
                        <Text style={styles.phaseSubtitle}>Não mostre para ninguém!</Text>
                    </Animated.View>

                    <Animated.View entering={FadeIn.delay(300)} style={[styles.roleCardWrapper, revealedCardScale]}>
                        {!roleRevealed ? (
                            <Pressable
                                onPressIn={startHold}
                                onPressOut={cancelHold}
                                style={styles.roleCardHidden}
                            >
                                <Animated.View style={[styles.holdRing, holdRingStyle]} />
                                <View style={styles.roleCardHiddenInner}>
                                    <Text style={styles.roleCardLockIcon}>🎭</Text>
                                    <Text style={styles.roleCardHiddenText}>Segure para revelar</Text>
                                    <Animated.View style={[styles.holdProgressBar, holdBorderWidth]} />
                                </View>
                            </Pressable>
                        ) : (
                            <Animated.View
                                entering={ZoomIn.springify()}
                                style={[
                                    styles.roleCardRevealed,
                                    isImpostor ? styles.roleCardImpostor : styles.roleCardVillager,
                                ]}
                            >
                                {isImpostor ? (
                                    <>
                                        <View style={styles.roleIconWrap}>
                                            <Skull size={48} color="#ef4444" />
                                        </View>
                                        <Text style={styles.roleTitle}>IMPOSTOR</Text>
                                        <Text style={styles.roleSubtitle}>Você não sabe a palavra</Text>
                                        <View style={styles.roleDivider} />
                                        <Text style={styles.roleCategoryLabel}>CATEGORIA</Text>
                                        <Text style={styles.roleCategoryValue}>{roundData.category}</Text>
                                        <Text style={styles.roleHint}>
                                            Dê uma dica vaga. Não deixe ninguém perceber!
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <View style={styles.roleIconWrap}>
                                            <Eye size={40} color="#a78bfa" />
                                        </View>
                                        <Text style={styles.roleSubtitle}>Você conhece a palavra secreta</Text>
                                        <View style={styles.roleDivider} />
                                        <Text style={styles.roleCategoryLabel}>PALAVRA</Text>
                                        <Text style={styles.roleWordValue}>{roundData.word}</Text>
                                        <Text style={[styles.roleCategoryLabel, { marginTop: 4 }]}>CATEGORIA: {roundData.category}</Text>
                                        <Text style={styles.roleHint}>
                                            Dê uma dica sutil. Não entregue a palavra!
                                        </Text>
                                    </>
                                )}
                            </Animated.View>
                        )}
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(400)} style={styles.confirmRow}>
                        <Text style={styles.confirmCount}>
                            {confirmedCount}/{players.length} jogadores confirmaram
                        </Text>
                        <View style={styles.confirmDots}>
                            {players.map(p => (
                                <View
                                    key={p.uid}
                                    style={[
                                        styles.confirmDot,
                                        revealed[p.uid] && styles.confirmDotActive,
                                    ]}
                                />
                            ))}
                        </View>
                        {roleRevealed && !roundData.rolesRevealed?.[myUid] && (
                            <Text style={styles.confirmPending}>Sincronizando...</Text>
                        )}
                        {roleRevealed && roundData.rolesRevealed?.[myUid] && (
                            <View style={styles.confirmedBadge}>
                                <CheckCircle2 size={16} color="#10b981" />
                                <Text style={styles.confirmedText}>Confirmado</Text>
                            </View>
                        )}
                    </Animated.View>
                </ScrollView>
            </View>
        );
    }

    // ── Phase: Discussion ──────────────────────────────────────────
    if (phase === 'discussion') {
        const clues = roundData.clues || [];
        const answerOrder = roundData.answerOrder?.length
            ? roundData.answerOrder
            : players.map(player => player.uid);
        const currentAnswerTurnIndex = roundData.currentAnswerTurnIndex || 0;
        const activeAnswerUid = answerOrder[currentAnswerTurnIndex];
        const activeAnswerPlayer = players.find(player => player.uid === activeAnswerUid);
        const isMyAnswerTurn = activeAnswerUid === myUid && !clueSubmitted;
        const answeredCount = clues.length;
        const clueByUid = clues.reduce((acc, item) => {
            acc[item.uid] = item;
            return acc;
        }, {});
        const recentReactions = (roundData.reactions || []).filter((reaction) => (
            Date.now() - (reaction.createdAt || 0) <= 4500
        ));
        const orderedPlayers = answerOrder
            .map(uid => players.find(player => player.uid === uid))
            .filter(Boolean);

        const formatTurnTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

        return (
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <LinearGradient colors={['#0d0a14', '#130c1e', '#1a0d2e']} style={StyleSheet.absoluteFill} />
                <View style={styles.glow1} />
                <View style={styles.glowVioletLine} />

                <ScrollView
                    contentContainerStyle={styles.scrollContentDiscussion}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <ImpostorRoundHeader
                        currentRound={currentRound}
                        totalRounds={totalRounds}
                        subtitle={`Fase 2 · Respostas da ${currentRound} rodada`}
                        onExit={handleExitGame}
                    />

                    <Animated.View entering={FadeInDown.delay(80)} style={styles.turnBox}>
                        <View style={styles.turnAvatarWrap}>
                            {activeAnswerPlayer ? (
                                <AvatarCircle
                                    name={activeAnswerPlayer.name}
                                    photoURL={activeAnswerPlayer.photoURL}
                                    size={72}
                                />
                            ) : null}
                        </View>
                        <View style={styles.turnPlayerRow}>
                            <View style={styles.turnPlayerCopy}>
                                <Text style={styles.turnPlayerName}>
                                    {activeAnswerPlayer?.name || 'Aguardando...'}
                                </Text>
                                <Text style={styles.turnPlayerHint}>
                                    É a vez dele responder
                                </Text>
                            </View>
                            <View style={styles.turnCountPill}>
                                <Text style={styles.turnCount}>{answeredCount}/{players.length}</Text>
                            </View>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(140)} style={styles.secretWordCard}>
                        <View style={styles.secretLockBadge}>
                            <LockKeyhole size={24} color="#c4b5fd" />
                        </View>
                        {isImpostor ? (
                            <>
                                <Text style={styles.secretWordTitle}>Sua pista</Text>
                                <Text style={styles.secretWordText}>{roundData.category || 'Lugar escuro'}</Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.secretWordTitle}>Sua palavra</Text>
                                <Text style={styles.secretWordText}>{roundData.word || 'Cinema'}</Text>
                            </>
                        )}
                    </Animated.View>

                    {/* 2-column player grid */}
                    <Animated.View entering={FadeInDown.delay(180)} style={styles.playerGrid}>
                        {orderedPlayers.map((player, i) => {
                            const playerClue = clueByUid[player.uid];
                            const isActivePlayer = player.uid === activeAnswerUid && !playerClue;
                            const isCurrentUserCard = player.uid === myUid;
                            const playerReactions = recentReactions
                                .filter(reaction => reaction.targetUid === player.uid)
                                .slice(-4);

                            return (
                                <Animated.View
                                    key={player.uid}
                                    entering={FadeIn.delay(i * 60)}
                                    style={[
                                        styles.playerGridCard,
                                        isActivePlayer && styles.playerGridCardActive,
                                        playerClue && styles.playerGridCardAnswered,
                                        isCurrentUserCard && styles.playerGridCardMine,
                                    ]}
                                >
                                    <View pointerEvents="none" style={styles.cardReactionLayerGrid}>
                                        {playerReactions.map((reaction, reactionIndex) => (
                                            <FloatingCardReaction
                                                key={reaction.id}
                                                emoji={reaction.emoji}
                                                index={reactionIndex}
                                            />
                                        ))}
                                    </View>

                                    {/* number badge top-left */}
                                    <View style={[styles.gridBadge, isActivePlayer && styles.gridBadgeActive]}>
                                        <Text style={styles.gridBadgeText}>{i + 1}</Text>
                                    </View>

                                    {/* timer badge top-right — only on active turn */}
                                    {isActivePlayer && (
                                        <View style={styles.gridTimerBadge}>
                                            <Clock size={10} color="#fff" />
                                            <Text style={styles.gridTimerBadgeText}>{formatTurnTime(turnElapsed)}</Text>
                                        </View>
                                    )}

                                    <AvatarCircle
                                        name={player.name}
                                        photoURL={player.photoURL}
                                        size={46}
                                    />

                                    <Text style={styles.gridPlayerName} numberOfLines={1}>
                                        {player.name}
                                    </Text>

                                    {playerClue ? (
                                        <Text style={styles.gridAnswerText} numberOfLines={3}>
                                            {playerClue.text}
                                        </Text>
                                    ) : isActivePlayer && isMyAnswerTurn ? (
                                        <View style={styles.gridInlineInputRow}>
                                            <TextInput
                                                style={styles.gridInlineInput}
                                                value={clue}
                                                onChangeText={setClue}
                                                placeholder="Digite sua resposta..."
                                                placeholderTextColor="rgba(255,255,255,0.35)"
                                                maxLength={40}
                                                returnKeyType="send"
                                                onSubmitEditing={handleClueSubmit}
                                            />
                                            <TouchableOpacity
                                                style={[styles.gridInlineSend, !clue.trim() && styles.gridInlineSendDisabled]}
                                                onPress={handleClueSubmit}
                                                disabled={!clue.trim()}
                                            >
                                                <Send size={14} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : isActivePlayer ? (
                                        <TypingDots />
                                    ) : (
                                        <Text style={styles.gridWaitText}>Aguardando</Text>
                                    )}
                                </Animated.View>
                            );
                        })}
                        {orderedPlayers.length === 0 && (
                            <Text style={styles.gridWaitText}>Aguardando jogadores...</Text>
                        )}
                    </Animated.View>
                </ScrollView>

                {/* Fixed bottom dock: input/status + emoji bar */}
                <View style={styles.bottomDock}>
                    <View pointerEvents="none" style={styles.reactionGlowLines}>
                        <View style={styles.reactionGlowLine} />
                        <View style={[styles.reactionGlowLine, styles.reactionGlowLineShort]} />
                        <View style={styles.reactionParticle} />
                        <View style={[styles.reactionParticle, styles.reactionParticleTwo]} />
                    </View>
                    <View style={styles.emojiBar}>
                        {QUICK_IMPOSTOR_REACTIONS.map((emoji) => (
                            <TouchableOpacity
                                key={emoji}
                                style={styles.emojiBarBtn}
                                onPress={() => handleImpostorReaction(activeAnswerUid, emoji)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.emojiBarBtnText}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {!clueSubmitted && isMyAnswerTurn ? (
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.clueInput}
                                value={clue}
                                onChangeText={setClue}
                                placeholder="Digite sua resposta..."
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                maxLength={40}
                                returnKeyType="send"
                                onSubmitEditing={handleClueSubmit}
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, !clue.trim() && styles.sendBtnDisabled]}
                                onPress={handleClueSubmit}
                                disabled={!clue.trim()}
                            >
                                <Send size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ) : clueSubmitted ? (
                        <View style={styles.clueSubmittedBadge}>
                            <CheckCircle2 size={18} color="#10b981" />
                            <Text style={styles.clueSubmittedText}>
                                Resposta registrada
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.waitTurnBox}>
                            <Text style={styles.waitTurnText}>
                                Aguardando {activeAnswerPlayer?.name || 'jogador'}...
                            </Text>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        );
    }

    // ── Phase: Voting ──────────────────────────────────────────────
    if (phase === 'voting') {
        const votableCount = Object.keys(roundData.votes || {}).length;
        const clueByUid = (roundData.clues || []).reduce((acc, item) => {
            acc[item.uid] = item;
            return acc;
        }, {});
        const suspectedPlayer = players.find(p => p.uid === selectedVote);

        return (
            <View style={styles.container}>
                <LinearGradient colors={['#0d0a14', '#130c1e', '#1e0d14']} style={StyleSheet.absoluteFill} />
                <View style={[styles.glow2, { backgroundColor: 'rgba(239,68,68,0.1)' }]} />
                <View style={[styles.glowVioletLine, { backgroundColor: 'rgba(239,68,68,0.22)' }]} />

                <ScrollView
                    contentContainerStyle={styles.scrollContentVoting}
                    showsVerticalScrollIndicator={false}
                >
                    <ImpostorRoundHeader
                        currentRound={currentRound}
                        totalRounds={totalRounds}
                        subtitle={`Fase 3 · Votação da ${currentRound} rodada`}
                        phaseTone="danger"
                        onExit={handleExitGame}
                    />

                    <Animated.View entering={FadeInDown.delay(80)} style={[styles.turnBox, styles.voteTurnBox]}>
                        <View style={styles.voteIconBadge}>
                            <VoteIcon size={30} color="#fecaca" />
                        </View>
                        <View style={styles.turnPlayerRow}>
                            <View style={styles.turnPlayerCopy}>
                                <Text style={styles.turnPlayerName}>Quem é o Impostor?</Text>
                                <Text style={styles.turnPlayerHint}>Analise as respostas e escolha um suspeito</Text>
                            </View>
                            <View style={[styles.turnCountPill, styles.voteCountPill]}>
                                <Animated.Text style={[styles.turnCount, timerTextStyle, { color: '#fff' }]}>
                                    {timeLeft}s
                                </Animated.Text>
                            </View>
                        </View>
                        <View style={styles.timerTrack}>
                            <Animated.View style={[styles.timerFill, timerBarFillStyle]} />
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(140)} style={styles.secretWordCard}>
                        <View style={[styles.secretLockBadge, styles.voteLockBadge]}>
                            <Skull size={24} color="#fecaca" />
                        </View>
                        <Text style={[styles.secretWordTitle, { color: '#fca5a5' }]}>Votos registrados</Text>
                        <Text style={styles.secretWordText}>{votableCount}/{players.length}</Text>
                    </Animated.View>

                    {!voteSubmitted ? (
                        <Animated.View entering={FadeInDown.delay(180)} style={styles.playerGrid}>
                            {players.map((player, i) => {
                                const playerClue = clueByUid[player.uid];
                                const isCurrentUserCard = player.uid === myUid;
                                const isSelected = selectedVote === player.uid;

                                return (
                                    <TouchableOpacity
                                        key={player.uid}
                                        style={[
                                            styles.playerGridCard,
                                            styles.voteGridCard,
                                            isSelected && styles.voteGridCardSelected,
                                            isCurrentUserCard && styles.voteGridCardMine,
                                        ]}
                                        onPress={() => {
                                            if (isCurrentUserCard) return;
                                            if (Platform.OS === 'ios') Haptics.selectionAsync();
                                            setSelectedVote(player.uid);
                                        }}
                                        activeOpacity={isCurrentUserCard ? 1 : 0.78}
                                    >
                                        <View style={[styles.gridBadge, isSelected && styles.voteBadgeSelected]}>
                                            <Text style={styles.gridBadgeText}>{i + 1}</Text>
                                        </View>
                                        {isSelected && (
                                            <Animated.View entering={ZoomIn} style={styles.voteSelectedMark}>
                                                <CheckCircle2 size={18} color="#fff" />
                                            </Animated.View>
                                        )}
                                        <AvatarCircle name={player.name} photoURL={player.photoURL} size={52} />
                                        <Text style={styles.gridPlayerName} numberOfLines={1}>
                                            {player.name}
                                        </Text>
                                        <Text style={styles.gridAnswerText} numberOfLines={2}>
                                            {isCurrentUserCard ? 'Você' : playerClue?.text || 'Sem resposta'}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </Animated.View>
                    ) : (
                        <Animated.View entering={ZoomIn} style={styles.voteConfirmed}>
                            <CheckCircle2 size={40} color="#ef4444" />
                            <Text style={styles.voteConfirmedTitle}>Voto registrado</Text>
                            <Text style={styles.voteConfirmedSub}>
                                Você votou em{' '}
                                <Text style={{ color: '#ef4444', fontWeight: '800' }}>
                                    {players.find(p => p.uid === selectedVote)?.name || ''}
                                </Text>
                            </Text>
                            <Text style={styles.waitingText}>
                                Aguardando {players.length - votableCount} jogador(es)...
                            </Text>
                        </Animated.View>
                    )}
                </ScrollView>

                <View style={[styles.bottomDock, styles.voteBottomDock]}>
                    <TouchableOpacity
                        style={[styles.voteSubmitBtn, (!selectedVote || voteSubmitted) && styles.voteSubmitBtnDisabled]}
                        onPress={handleVoteSubmit}
                        disabled={!selectedVote || voteSubmitted}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={selectedVote && !voteSubmitted ? ['#ef4444', '#7f1d1d'] : ['#374151', '#1f2937']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.voteSubmitGradient}
                        >
                            <Text style={styles.voteSubmitText}>
                                {voteSubmitted
                                    ? 'Voto registrado'
                                    : selectedVote
                                        ? `Votar em ${suspectedPlayer?.name}`
                                        : 'Escolha um suspeito'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0a14',
    },
    glow1: {
        position: 'absolute',
        top: 80,
        right: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(139,92,246,0.12)',
    },
    glow2: {
        position: 'absolute',
        bottom: 100,
        left: -80,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(99,38,246,0.1)',
    },
    glowVioletLine: {
        position: 'absolute',
        bottom: 92,
        alignSelf: 'center',
        width: 180,
        height: 120,
        borderRadius: 90,
        backgroundColor: 'rgba(139,92,246,0.14)',
        opacity: 0.9,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 48,
    },

    // Phase header
    phaseHeader: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 28,
    },
    phaseLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2.5,
        marginBottom: 6,
    },
    phaseTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
        textAlign: 'center',
    },
    phaseSubtitle: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 14,
        marginTop: 4,
        textAlign: 'center',
    },

    // Role card
    roleCardWrapper: {
        alignItems: 'center',
        marginBottom: 24,
    },
    roleCardHidden: {
        width: 280,
        height: 320,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: 'rgba(139,92,246,0.4)',
        backgroundColor: 'rgba(15,10,25,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    holdRing: {
        position: 'absolute',
        width: 280,
        height: 320,
        borderRadius: 24,
        borderWidth: 3,
        borderColor: '#a78bfa',
    },
    roleCardHiddenInner: {
        alignItems: 'center',
        gap: 12,
    },
    roleCardLockIcon: {
        fontSize: 52,
    },
    roleCardHiddenText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 15,
        fontWeight: '600',
    },
    holdProgressBar: {
        width: 80,
        borderBottomColor: '#a78bfa',
        borderRadius: 2,
        marginTop: 8,
    },
    roleCardRevealed: {
        width: 280,
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        gap: 8,
    },
    roleCardImpostor: {
        backgroundColor: 'rgba(30,8,8,0.96)',
        borderWidth: 2,
        borderColor: 'rgba(239,68,68,0.5)',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    roleCardVillager: {
        backgroundColor: 'rgba(10,8,30,0.96)',
        borderWidth: 2,
        borderColor: 'rgba(139,92,246,0.5)',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    roleIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    roleTitle: {
        color: '#fff',
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: 2,
    },
    roleSubtitle: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 13,
        textAlign: 'center',
    },
    roleDivider: {
        width: 48,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.12)',
        marginVertical: 10,
    },
    roleCategoryLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    roleCategoryValue: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 18,
        fontWeight: '700',
    },
    roleWordValue: {
        color: '#a78bfa',
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
    },
    roleHint: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 18,
    },

    // Confirm row
    confirmRow: {
        alignItems: 'center',
        gap: 10,
    },
    confirmCount: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
    },
    confirmDots: {
        flexDirection: 'row',
        gap: 6,
    },
    confirmDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    confirmDotActive: {
        backgroundColor: '#10b981',
    },
    confirmPending: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 12,
    },
    confirmedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(16,185,129,0.12)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    confirmedText: {
        color: '#10b981',
        fontSize: 13,
        fontWeight: '700',
    },

    // Timer
    timerBox: {
        backgroundColor: 'rgba(10,8,20,0.6)',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.12)',
        marginBottom: 16,
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    timerText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '900',
        fontVariant: ['tabular-nums'],
        flex: 1,
    },
    timerLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    timerTrack: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    timerFill: {
        height: '100%',
        borderRadius: 3,
    },
    gameTopHeader: {
        paddingTop: Platform.OS === 'ios' ? 58 : 30,
        paddingBottom: 18,
        alignItems: 'center',
        position: 'relative',
    },
    gameHeaderExit: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 54 : 26,
        left: 0,
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    gameHeaderExitText: {
        color: 'rgba(255,255,255,0.72)',
        fontSize: 24,
        lineHeight: 26,
        fontWeight: '300',
    },
    mascotBadge: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 66 : 38,
        left: 52,
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '-10deg' }],
    },
    mascotBadgeArc: {
        position: 'absolute',
        top: 5,
        color: '#fff',
        fontSize: 7,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    mascotBadgeEmoji: {
        fontSize: 24,
        marginTop: 8,
    },
    gameHeaderCopy: {
        alignItems: 'center',
        paddingHorizontal: 70,
    },
    gameHeaderTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
    },
    gameHeaderSubtitle: {
        color: 'rgba(255,255,255,0.52)',
        fontSize: 18,
        marginTop: 6,
        textAlign: 'center',
    },
    roundProgressLabel: {
        alignSelf: 'stretch',
        color: 'rgba(255,255,255,0.58)',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 28,
        marginBottom: 10,
    },
    roundProgressTrack: {
        alignSelf: 'stretch',
        flexDirection: 'row',
        gap: 6,
    },
    roundProgressSegment: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    roundProgressSegmentActive: {
        backgroundColor: '#a78bfa',
        shadowColor: '#a78bfa',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 8,
    },
    roundProgressSegmentDanger: {
        backgroundColor: '#fb7185',
        shadowColor: '#ef4444',
    },
    turnBox: {
        backgroundColor: 'rgba(24,20,42,0.96)',
        borderRadius: 24,
        padding: 22,
        borderWidth: 2,
        borderColor: '#a78bfa',
        marginBottom: 26,
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.45,
        shadowRadius: 22,
        elevation: 8,
    },
    turnAvatarWrap: {
        position: 'absolute',
        left: 24,
        top: 22,
    },
    turnHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    turnLabel: {
        color: 'rgba(255,255,255,0.42)',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    turnCount: {
        color: '#a78bfa',
        fontSize: 22,
        fontWeight: '900',
        fontVariant: ['tabular-nums'],
    },
    turnPlayerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 74,
    },
    turnPlayerCopy: {
        flex: 1,
        paddingLeft: 88,
    },
    turnPlayerName: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
    },
    turnPlayerHint: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 17,
        marginTop: 5,
    },
    turnCountPill: {
        minWidth: 66,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(139,92,246,0.45)',
        borderWidth: 1,
        borderColor: 'rgba(196,181,253,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    voteTurnBox: {
        borderColor: 'rgba(248,113,113,0.8)',
        shadowColor: '#ef4444',
        gap: 14,
    },
    voteIconBadge: {
        position: 'absolute',
        left: 24,
        top: 24,
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239,68,68,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(248,113,113,0.3)',
    },
    voteCountPill: {
        backgroundColor: '#ef4444',
        borderColor: 'rgba(254,202,202,0.45)',
    },
    secretWordCard: {
        marginTop: 10,
        marginBottom: 30,
        minHeight: 150,
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 54,
        paddingBottom: 26,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(28,25,39,0.98)',
        borderWidth: 1.5,
        borderColor: 'rgba(139,92,246,0.42)',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.38,
        shadowRadius: 22,
        elevation: 7,
    },
    secretLockBadge: {
        position: 'absolute',
        top: -28,
        width: 58,
        height: 58,
        borderRadius: 29,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#5b36b7',
        borderWidth: 2,
        borderColor: 'rgba(196,181,253,0.35)',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
    },
    voteLockBadge: {
        backgroundColor: '#7f1d1d',
        borderColor: 'rgba(254,202,202,0.35)',
        shadowColor: '#ef4444',
    },
    secretWordTitle: {
        color: '#a78bfa',
        fontSize: 20,
        fontWeight: '900',
        textAlign: 'center',
    },
    secretWordText: {
        color: '#fff',
        fontSize: 34,
        fontWeight: '900',
        marginTop: 8,
        textAlign: 'center',
    },

    // Role reminder
    roleReminder: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        marginBottom: 12,
    },
    roleReminderImpostor: {
        backgroundColor: '#3d1212',
        borderWidth: 1.5,
        borderColor: '#7a2020',
    },
    roleReminderVillager: {
        backgroundColor: '#201c3e',
        borderWidth: 1.5,
        borderColor: '#4a3e84',
    },
    roleReminderText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        flex: 1,
    },

    // Clues section
    cluesSection: {
        marginBottom: 18,
    },
    sectionTitle: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 12,
    },
    emptyCluels: {
        color: 'rgba(255,255,255,0.25)',
        fontSize: 13,
        textAlign: 'center',
        paddingVertical: 16,
    },
    clueItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 10,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        padding: 10,
    },
    clueContent: {
        flex: 1,
    },
    clueName: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 2,
    },
    clueText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    answerCardsSection: {
        marginBottom: 18,
    },
    answerCardsList: {
        gap: 10,
    },
    answerCard: {
        backgroundColor: 'rgba(255,255,255,0.045)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 12,
        gap: 12,
        position: 'relative',
    },
    answerCardActive: {
        backgroundColor: 'rgba(139,92,246,0.12)',
        borderColor: 'rgba(167,139,250,0.45)',
    },
    answerCardAnswered: {
        backgroundColor: 'rgba(16,185,129,0.075)',
        borderColor: 'rgba(16,185,129,0.22)',
    },
    answerCardMine: {
        borderColor: 'rgba(255,255,255,0.18)',
    },
    answerCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    answerCardIdentity: {
        flex: 1,
    },
    answerCardName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },
    answerCardStatus: {
        color: 'rgba(255,255,255,0.38)',
        fontSize: 12,
        marginTop: 2,
        fontWeight: '700',
    },
    answerCardStatusActive: {
        color: '#c4b5fd',
    },
    answerCardStatusAnswered: {
        color: '#6ee7b7',
    },
    answerCardResponse: {
        backgroundColor: 'rgba(0,0,0,0.18)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 42,
        justifyContent: 'center',
    },
    answerCardResponseEmpty: {
        backgroundColor: 'rgba(255,255,255,0.035)',
    },
    answerCardResponseText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        lineHeight: 20,
    },
    answerCardResponseTextEmpty: {
        color: 'rgba(255,255,255,0.28)',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
    },
    cardReactionLayer: {
        position: 'absolute',
        right: 36,
        top: 58,
        zIndex: 20,
        elevation: 20,
    },
    cardFloatingReaction: {
        position: 'absolute',
        right: 0,
        top: 0,
        width: 42,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardFloatingReactionEmoji: {
        fontSize: 31,
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    reactionPickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    reactionPill: {
        width: 38,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.065)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
    },
    reactionPillText: {
        fontSize: 20,
    },

    // Clue input
    inputSection: {
        marginBottom: 16,
    },
    inputHint: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginBottom: 8,
        textAlign: 'center',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.11)',
        paddingLeft: 16,
        paddingRight: 5,
        minHeight: 58,
    },
    clueInput: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingVertical: 13,
        color: '#fff',
        fontSize: 16,
    },
    sendBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#9b6dff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    clueSubmittedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    clueSubmittedText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        flex: 1,
    },
    waitTurnBox: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 18,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    waitTurnText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '600',
    },

    // Host advance
    hostAdvanceBtn: {
        alignItems: 'center',
        paddingVertical: 10,
        marginTop: 8,
    },
    hostAdvanceBtnText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 13,
        textDecorationLine: 'underline',
    },

    // Voting
    voteHeader: {
        alignItems: 'center',
        gap: 6,
        marginBottom: 20,
    },
    voteTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
    },
    voteSubtitle: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
    },
    cluesReview: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 18,
        gap: 6,
    },
    cluesReviewTitle: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    clueReviewItem: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 13,
        lineHeight: 20,
    },
    playerVoteList: {
        gap: 10,
        marginBottom: 20,
    },
    playerVoteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        gap: 14,
    },
    playerVoteCardSelected: {
        backgroundColor: 'rgba(239,68,68,0.12)',
        borderColor: 'rgba(239,68,68,0.4)',
    },
    playerVoteName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
    },
    selectedCheck: {
        marginLeft: 'auto',
    },
    voteSubmitBtn: {
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
    },
    voteSubmitBtnDisabled: {
        shadowOpacity: 0,
    },
    voteSubmitGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    voteSubmitText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
    },
    voteConfirmed: {
        alignItems: 'center',
        gap: 10,
        padding: 32,
        backgroundColor: 'rgba(239,68,68,0.08)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
    },
    voteConfirmedTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
    },
    voteConfirmedSub: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 15,
        textAlign: 'center',
    },
    waitingText: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 13,
        marginTop: 4,
    },

    // Discussion grid
    scrollContentDiscussion: {
        paddingHorizontal: 22,
        paddingBottom: 190,
    },
    scrollContentVoting: {
        paddingHorizontal: 22,
        paddingBottom: 128,
    },
    playerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 8,
    },
    playerGridCard: {
        width: '48.5%',
        backgroundColor: 'rgba(38,35,46,0.94)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        padding: 12,
        alignItems: 'center',
        gap: 8,
        position: 'relative',
        minHeight: 128,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.32,
        shadowRadius: 10,
        elevation: 5,
    },
    playerGridCardActive: {
        backgroundColor: 'rgba(58,45,104,0.98)',
        borderColor: '#a78bfa',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.55,
        shadowRadius: 16,
        elevation: 9,
    },
    playerGridCardAnswered: {
        backgroundColor: 'rgba(28,46,39,0.94)',
        borderColor: 'rgba(34,197,94,0.18)',
    },
    playerGridCardMine: {
        backgroundColor: 'rgba(33,28,58,0.96)',
    },
    gridBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridBadgeActive: {
        backgroundColor: '#fb923c',
    },
    gridBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '900',
    },
    gridTimerBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#f97316',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 10,
    },
    gridTimerBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '900',
        fontVariant: ['tabular-nums'],
    },
    gridPlayerName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
        textAlign: 'center',
        maxWidth: '100%',
    },
    gridAnswerText: {
        color: 'rgba(255,255,255,0.68)',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 18,
    },
    gridWaitText: {
        color: 'rgba(255,255,255,0.42)',
        fontSize: 13,
        fontWeight: '700',
    },
    typingDots: {
        flexDirection: 'row',
        gap: 5,
        alignItems: 'center',
        paddingVertical: 2,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#a78bfa',
    },
    cardReactionLayerGrid: {
        position: 'absolute',
        right: 20,
        top: 40,
        zIndex: 20,
        elevation: 20,
    },
    gridInlineInputRow: {
        width: '100%',
        minHeight: 34,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 1,
    },
    gridInlineInput: {
        flex: 1,
        minWidth: 0,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(0,0,0,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        color: '#fff',
        fontSize: 11,
        paddingHorizontal: 10,
    },
    gridInlineSend: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8b5cf6',
    },
    gridInlineSendDisabled: {
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    voteGridCard: {
        minHeight: 134,
    },
    voteGridCardSelected: {
        backgroundColor: 'rgba(127,29,29,0.78)',
        borderColor: '#fb7185',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
    },
    voteGridCardMine: {
        opacity: 0.56,
    },
    voteBadgeSelected: {
        backgroundColor: '#ef4444',
    },
    voteSelectedMark: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ef4444',
    },

    // Bottom dock
    bottomDock: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(18,15,25,0.98)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(167,139,250,0.16)',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        gap: 10,
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
        elevation: 16,
    },
    voteBottomDock: {
        borderTopColor: 'rgba(248,113,113,0.18)',
        shadowColor: '#ef4444',
    },
    emojiBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 4,
    },
    emojiBarBtn: {
        flex: 1,
        height: 44,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
    },
    emojiBarBtnText: {
        fontSize: 21,
    },
    reactionGlowLines: {
        position: 'absolute',
        top: -58,
        left: 0,
        right: 0,
        height: 70,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    reactionGlowLine: {
        width: 120,
        height: 1,
        backgroundColor: 'rgba(167,139,250,0.34)',
        transform: [{ rotate: '48deg' }],
        marginBottom: 16,
    },
    reactionGlowLineShort: {
        width: 90,
        transform: [{ rotate: '-52deg' }],
        marginTop: -28,
        marginBottom: 8,
    },
    reactionParticle: {
        position: 'absolute',
        bottom: 22,
        left: '42%',
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#a78bfa',
        shadowColor: '#a78bfa',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
    },
    reactionParticleTwo: {
        bottom: 38,
        left: '58%',
        width: 5,
        height: 5,
    },
});
