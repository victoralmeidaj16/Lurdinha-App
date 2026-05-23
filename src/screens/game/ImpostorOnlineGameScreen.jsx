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
    Send,
    Skull,
    Users,
    VoteIcon,
} from 'lucide-react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
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

const resolveTime = (value) => {
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function ImpostorOnlineGameScreen({ roomId, gameState }) {
    const navigation = useNavigation();
    const { currentUser } = useAuth();
    const {
        markImpostorRoleViewed,
        submitImpostorClue,
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

    // Reset state on round change
    useEffect(() => {
        setRoleRevealed(Boolean(roundData.rolesRevealed?.[myUid]));
        setClue('');
        setClueSubmitted(Boolean(roundData.clues?.some(c => c.uid === myUid)));
        setSelectedVote(roundData.votes?.[myUid] || null);
        setVoteSubmitted(Boolean(roundData.votes?.[myUid]));
        holdProgress.value = 0;
        isAdvancing.current = false;
    }, [currentRound, myUid]);

    // Sync submitted states from Firebase
    useEffect(() => {
        if (roundData.rolesRevealed?.[myUid]) setRoleRevealed(true);
        if (roundData.clues?.some(c => c.uid === myUid)) setClueSubmitted(true);
        if (roundData.votes?.[myUid]) {
            setVoteSubmitted(true);
            setSelectedVote(roundData.votes[myUid]);
        }
    }, [roundData.rolesRevealed, roundData.clues, roundData.votes, myUid]);

    // Timer for discussion phase
    useEffect(() => {
        if (phase !== 'discussion' || !roundData.startTime) return undefined;
        const startTime = resolveTime(roundData.startTime);
        if (!startTime) return undefined;
        const totalTime = gameState.settings?.timePerRound || 90;
        const endTime = new Date(startTime.getTime() + totalTime * 1000);

        const tick = () => {
            const diff = Math.ceil((endTime - new Date()) / 1000);
            if (diff <= 0) {
                setTimeLeft(0);
                timerProgress.value = withTiming(0, { duration: 400 });
                handleDiscussionEnd();
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
    }, [phase, roundData.startTime]);

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
        if (allRevealed && !isAdvancing.current) {
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
        if (allVoted && !isAdvancing.current) {
            isAdvancing.current = true;
            calculateRoundResults(roomId, gameState).catch(() => {
                isAdvancing.current = false;
            });
        }
    }, [roundData.votes, phase, isHost, players]);

    const handleDiscussionEnd = async () => {
        if (!isHost || isAdvancing.current) return;
        isAdvancing.current = true;
        if (Platform.OS === 'ios') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        try {
            await advanceImpostorPhase(roomId, 'voting');
        } catch {
            isAdvancing.current = false;
        }
    };

    const handleVotingEnd = async () => {
        if (!isHost || isAdvancing.current) return;
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
            playSound('answer_submit');
            await markImpostorRoleViewed(roomId);
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
            await submitImpostorClue(roomId, clue.trim());
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
            await submitImpostorVote(roomId, selectedVote);
            playSound('answer_success');
        } catch {
            setVoteSubmitted(false);
        }
    };

    const timerBarFillStyle = useAnimatedStyle(() => {
        const color = interpolateColor(
            timerProgress.value,
            [0, 0.3, 0.6, 1],
            ['#ef4444', '#f97316', '#eab308', '#ef4444'],
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
                    onConfirmExit={async () => {
                        await removeFromRoom(roomId);
                        leaveRoom();
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
                                        <Text style={styles.roleTitle}>ALDEÃO</Text>
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
        const myClue = clues.find(c => c.uid === myUid);

        return (
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <LinearGradient colors={['#0d0a14', '#130c1e', '#1a0d2e']} style={StyleSheet.absoluteFill} />
                <View style={styles.glow1} />

                <Header
                    title={`Rodada ${currentRound}/${totalRounds}`}
                    transparent
                    showExit
                    onConfirmExit={async () => {
                        await removeFromRoom(roomId);
                        leaveRoom();
                        navigation.navigate('GameHome');
                    }}
                />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Timer */}
                    <Animated.View entering={FadeInDown} style={styles.timerBox}>
                        <View style={styles.timerRow}>
                            <Clock size={16} color="#a78bfa" />
                            <Animated.Text style={[styles.timerText, timerTextStyle]}>
                                {timeLeft}s
                            </Animated.Text>
                            <Text style={styles.timerLabel}>DISCUSSÃO</Text>
                        </View>
                        <View style={styles.timerTrack}>
                            <Animated.View style={[styles.timerFill, timerBarFillStyle]} />
                        </View>
                    </Animated.View>

                    {/* Role reminder */}
                    <Animated.View entering={FadeInDown.delay(100)} style={[
                        styles.roleReminder,
                        isImpostor ? styles.roleReminderImpostor : styles.roleReminderVillager,
                    ]}>
                        {isImpostor ? (
                            <>
                                <Skull size={18} color="#ef4444" />
                                <Text style={styles.roleReminderText}>
                                    Você é o <Text style={{ color: '#ef4444', fontWeight: '800' }}>IMPOSTOR</Text>
                                    {'  '}· Categoria: <Text style={{ fontWeight: '700' }}>{roundData.category}</Text>
                                </Text>
                            </>
                        ) : (
                            <>
                                <Eye size={18} color="#a78bfa" />
                                <Text style={styles.roleReminderText}>
                                    Palavra: <Text style={{ color: '#a78bfa', fontWeight: '800' }}>{roundData.word}</Text>
                                </Text>
                            </>
                        )}
                    </Animated.View>

                    {/* Clues list */}
                    <Animated.View entering={FadeInDown.delay(200)} style={styles.cluesSection}>
                        <Text style={styles.sectionTitle}>
                            <Users size={14} color="rgba(255,255,255,0.5)" /> DICAS DA GALERA
                        </Text>
                        {clues.length === 0 ? (
                            <Text style={styles.emptyCluels}>Nenhuma dica ainda...</Text>
                        ) : (
                            clues.map((c, i) => (
                                <Animated.View
                                    key={`${c.uid}-${i}`}
                                    entering={FadeIn.delay(i * 60)}
                                    style={styles.clueItem}
                                >
                                    <AvatarCircle
                                        name={c.name}
                                        photoURL={c.photoURL}
                                        size={32}
                                    />
                                    <View style={styles.clueContent}>
                                        <Text style={styles.clueName}>{c.name}</Text>
                                        <Text style={styles.clueText}>{c.text}</Text>
                                    </View>
                                </Animated.View>
                            ))
                        )}
                    </Animated.View>

                    {/* Clue input */}
                    {!clueSubmitted ? (
                        <Animated.View entering={FadeInUp.delay(300)} style={styles.inputSection}>
                            <Text style={styles.inputHint}>
                                {isImpostor
                                    ? 'Blefe: dê uma dica vaga sobre a categoria'
                                    : 'Dê uma dica sobre a palavra sem entregá-la'}
                            </Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.clueInput}
                                    value={clue}
                                    onChangeText={setClue}
                                    placeholder="Sua dica..."
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
                        </Animated.View>
                    ) : (
                        <Animated.View entering={FadeInUp} style={styles.clueSubmittedBadge}>
                            <CheckCircle2 size={18} color="#10b981" />
                            <Text style={styles.clueSubmittedText}>
                                Sua dica: "<Text style={{ fontStyle: 'italic' }}>{myClue?.text || clue}</Text>"
                            </Text>
                        </Animated.View>
                    )}

                    {isHost && (
                        <TouchableOpacity
                            style={styles.hostAdvanceBtn}
                            onPress={handleDiscussionEnd}
                        >
                            <Text style={styles.hostAdvanceBtnText}>Ir para votação agora →</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    // ── Phase: Voting ──────────────────────────────────────────────
    if (phase === 'voting') {
        const votableCount = Object.keys(roundData.votes || {}).length;

        return (
            <View style={styles.container}>
                <LinearGradient colors={['#0d0a14', '#130c1e', '#1e0d14']} style={StyleSheet.absoluteFill} />
                <View style={[styles.glow2, { backgroundColor: 'rgba(239,68,68,0.1)' }]} />

                <Header
                    title={`Rodada ${currentRound}/${totalRounds}`}
                    transparent
                    showExit
                    onConfirmExit={async () => {
                        await removeFromRoom(roomId);
                        leaveRoom();
                        navigation.navigate('GameHome');
                    }}
                />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Timer */}
                    <Animated.View entering={FadeInDown} style={styles.timerBox}>
                        <View style={styles.timerRow}>
                            <Clock size={16} color="#ef4444" />
                            <Animated.Text style={[styles.timerText, timerTextStyle, { color: '#ef4444' }]}>
                                {timeLeft}s
                            </Animated.Text>
                            <Text style={[styles.timerLabel, { color: '#ef4444' }]}>VOTAÇÃO</Text>
                        </View>
                        <View style={styles.timerTrack}>
                            <Animated.View style={[styles.timerFill, timerBarFillStyle]} />
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(100)} style={styles.voteHeader}>
                        <VoteIcon size={22} color="#ef4444" />
                        <Text style={styles.voteTitle}>Quem é o Impostor?</Text>
                        <Text style={styles.voteSubtitle}>
                            {votableCount}/{players.length} votaram
                        </Text>
                    </Animated.View>

                    {/* Clues review */}
                    {(roundData.clues || []).length > 0 && (
                        <Animated.View entering={FadeInDown.delay(150)} style={styles.cluesReview}>
                            <Text style={styles.cluesReviewTitle}>Dicas dadas:</Text>
                            {(roundData.clues || []).map((c, i) => (
                                <Text key={i} style={styles.clueReviewItem}>
                                    <Text style={{ color: '#fff', fontWeight: '700' }}>{c.name}:</Text>
                                    {' '}{c.text}
                                </Text>
                            ))}
                        </Animated.View>
                    )}

                    {/* Player list to vote */}
                    {!voteSubmitted ? (
                        <>
                            <View style={styles.playerVoteList}>
                                {players
                                    .filter(p => p.uid !== myUid)
                                    .map((player, i) => (
                                        <Animated.View
                                            key={player.uid}
                                            entering={FadeInDown.delay(200 + i * 60)}
                                        >
                                            <TouchableOpacity
                                                style={[
                                                    styles.playerVoteCard,
                                                    selectedVote === player.uid && styles.playerVoteCardSelected,
                                                ]}
                                                onPress={() => {
                                                    if (Platform.OS === 'ios') Haptics.selectionAsync();
                                                    setSelectedVote(player.uid);
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                <AvatarCircle name={player.name} photoURL={player.photoURL} size={44} />
                                                <Text style={styles.playerVoteName}>{player.name}</Text>
                                                {selectedVote === player.uid && (
                                                    <Animated.View entering={ZoomIn} style={styles.selectedCheck}>
                                                        <CheckCircle2 size={22} color="#ef4444" />
                                                    </Animated.View>
                                                )}
                                            </TouchableOpacity>
                                        </Animated.View>
                                    ))}
                            </View>

                            <Animated.View entering={FadeInUp.delay(300)}>
                                <TouchableOpacity
                                    style={[styles.voteSubmitBtn, !selectedVote && styles.voteSubmitBtnDisabled]}
                                    onPress={handleVoteSubmit}
                                    disabled={!selectedVote}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={selectedVote ? ['#dc2626', '#991b1b'] : ['#374151', '#1f2937']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.voteSubmitGradient}
                                    >
                                        <Text style={styles.voteSubmitText}>
                                            {selectedVote
                                                ? `Votar em ${players.find(p => p.uid === selectedVote)?.name}`
                                                : 'Escolha um suspeito'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        </>
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

    // Role reminder
    roleReminder: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        marginBottom: 18,
    },
    roleReminderImpostor: {
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
    },
    roleReminderVillager: {
        backgroundColor: 'rgba(139,92,246,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(139,92,246,0.2)',
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
        gap: 10,
        alignItems: 'center',
    },
    clueInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: '#fff',
        fontSize: 16,
    },
    sendBtn: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#7c3aed',
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
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
    },
    clueSubmittedText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        flex: 1,
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
});
