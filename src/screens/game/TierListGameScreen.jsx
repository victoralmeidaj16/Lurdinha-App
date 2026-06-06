import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    PanResponder,
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
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Header from '../../components/Header';
import AvatarCircle from '../../components/AvatarCircle';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../hooks/useGame';
import { TIERS } from '../../hooks/game/tierList';
import { playSound } from '../../utils/sounds';

const TIER_LETTERS = { '5': 'S', '4': 'A', '3': 'B', '2': 'C', '1': 'D' };

const resolveStartTime = (value) => {
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

function PlayerChip({
    player,
    isSelected,
    onPress,
    onDragStart,
    onDragMove,
    onDragEnd,
    onDragCancel,
    size = 52,
    tierColor = '#A78BFA',
}) {
    const scale = useSharedValue(1);
    const playerRef = useRef(player);
    const handlersRef = useRef({ onPress, onDragStart, onDragMove, onDragEnd, onDragCancel });
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        playerRef.current = player;
    }, [player]);

    useEffect(() => {
        handlersRef.current = { onPress, onDragStart, onDragMove, onDragEnd, onDragCancel };
    }, [onPress, onDragStart, onDragMove, onDragEnd, onDragCancel]);

    useEffect(() => {
        if (isSelected) {
            scale.value = withSpring(1.08, { damping: 12, stiffness: 200 });
        } else {
            scale.value = withSpring(1, { damping: 14, stiffness: 200 });
        }
    }, [isSelected]);

    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_event, gestureState) => (
            Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4
        ),
        onMoveShouldSetPanResponderCapture: (_event, gestureState) => (
            Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4
        ),
        onPanResponderGrant: () => {
            setDragging(true);
            handlersRef.current.onDragStart?.(playerRef.current);
        },
        onPanResponderMove: (_event, gestureState) => {
            handlersRef.current.onDragMove?.(playerRef.current, gestureState);
        },
        onPanResponderRelease: (_event, gestureState) => {
            setDragging(false);
            const dragged = Math.abs(gestureState.dx) > 8 || Math.abs(gestureState.dy) > 8;
            if (dragged) {
                handlersRef.current.onDragEnd?.(playerRef.current.uid, gestureState);
            } else {
                handlersRef.current.onDragCancel?.();
                handlersRef.current.onPress?.();
            }
        },
        onPanResponderTerminate: () => {
            setDragging(false);
            handlersRef.current.onDragCancel?.();
        },
        onShouldBlockNativeResponder: () => true,
    })).current;

    return (
        <View
            {...panResponder.panHandlers}
            style={[
                styles.draggableChip,
                dragging && styles.draggableChipActive,
            ]}
        >
            <Animated.View style={[styles.playerChip, isSelected && styles.playerChipSelected, animStyle, { width: size }]}>
                <AvatarCircle name={player.name} photoURL={player.photoURL} size={size - 12} />
                <Text style={styles.playerChipName} numberOfLines={1}>
                    {player.name.split(' ')[0]}
                </Text>
                {isSelected && <View style={[styles.selectedRing, { borderColor: tierColor }]} />}
            </Animated.View>
        </View>
    );
}

export default function TierListGameScreen({ roomId, gameState, isSandbox = false }) {
    const navigation = useNavigation();
    const { currentUser } = useAuth();
    const { submitAnswer, calculateRoundResults, removeFromRoom, leaveRoom } = useGame();

    const [placements, setPlacements] = useState({});
    const [selectedUid, setSelectedUid] = useState(null);
    const [phase, setPhase] = useState('classifying');
    const [timeLeft, setTimeLeft] = useState(gameState?.settings?.timePerRound || 60);
    const [dragPreview, setDragPreview] = useState(null);
    const isCalculating = useRef(false);
    const timerScale = useSharedValue(1);
    const timerProgress = useSharedValue(1);

    const players = gameState?.players || [];
    const answers = gameState?.roundData?.answers || {};
    const currentRound = gameState?.currentRound || 1;
    const totalRounds = gameState?.settings?.totalRounds || 5;
    const question = gameState?.roundData?.question || 'Quem se destaca mais?';
    const isHost = gameState?.hostId === currentUser?.uid;
    const tierRefs = useRef({});

    const otherPlayers = players.filter((p) => p.uid !== currentUser?.uid);
    const poolPlayers = otherPlayers.filter((p) => !placements[p.uid]);
    const allClassified = otherPlayers.length > 0 && otherPlayers.every((p) => placements[p.uid]);
    const allPlayersAnswered = players.length > 0 && players.every((player) => Boolean(answers[player.uid]));

    useEffect(() => {
        setPlacements({});
        setSelectedUid(null);
        setPhase(answers[currentUser?.uid] ? 'submitted' : 'classifying');
        isCalculating.current = false;
    }, [currentRound, currentUser?.uid]);

    useEffect(() => {
        if (answers[currentUser?.uid]) setPhase('submitted');
    }, [answers, currentUser?.uid]);

    useEffect(() => {
        if (!gameState?.roundData?.startTime) return undefined;
        const startTime = resolveStartTime(gameState.roundData.startTime);
        const totalTime = gameState.settings?.timePerRound || 60;
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
            if (diff <= 10) {
                timerScale.value = withSequence(withTiming(1.15, { duration: 100 }), withTiming(1, { duration: 100 }));
            }
            return true;
        };

        tick();
        const interval = setInterval(() => { if (!tick()) clearInterval(interval); }, 1000);
        return () => clearInterval(interval);
    }, [gameState?.roundData?.startTime]);

    useEffect(() => {
        if (isSandbox || !isHost || !allPlayersAnswered || isCalculating.current) return;
        isCalculating.current = true;
        calculateRoundResults(roomId, gameState).catch(() => { isCalculating.current = false; });
    }, [allPlayersAnswered]);

    const handleTimeUp = async () => {
        if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        if (!isSandbox && isHost && !isCalculating.current) {
            isCalculating.current = true;
            try { await calculateRoundResults(roomId, gameState); }
            catch { isCalculating.current = false; }
        }
    };

    const handleSelectFromPool = (uid) => {
        if (phase !== 'classifying' || timeLeft === 0) return;
        playSound('ui_toggle');
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedUid((prev) => (prev === uid ? null : uid));
    };

    const handlePickUpFromTier = (uid) => {
        if (phase !== 'classifying' || timeLeft === 0) return;
        playSound('ui_toggle');
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPlacements((prev) => { const next = { ...prev }; delete next[uid]; return next; });
        setSelectedUid(uid);
    };

    const handleDropOnTier = (tierKey) => {
        if (!selectedUid || phase !== 'classifying' || timeLeft === 0) return;
        playSound('ui_toggle');
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setPlacements((prev) => ({ ...prev, [selectedUid]: tierKey }));
        setSelectedUid(null);
    };

    const handleDragStart = (player) => {
        if (phase !== 'classifying' || timeLeft === 0) return;
        setSelectedUid(null);
        setDragPreview({ player, x: null, y: null });
    };

    const handleDragMove = (player, gestureState) => {
        if (phase !== 'classifying' || timeLeft === 0) return;
        setDragPreview({
            player,
            x: gestureState.moveX,
            y: gestureState.moveY,
        });
    };

    const handleDragCancel = () => {
        setDragPreview(null);
    };

    const placePlayerOnTier = (uid, tierKey) => {
        if (!uid || phase !== 'classifying' || timeLeft === 0) return;
        playSound('ui_toggle');
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setPlacements((prev) => ({ ...prev, [uid]: tierKey }));
        setSelectedUid(null);
    };

    const handleDragEnd = (uid, gestureState) => {
        if (phase !== 'classifying' || timeLeft === 0) {
            setDragPreview(null);
            return;
        }

        const dropX = gestureState.moveX;
        const dropY = gestureState.moveY;
        const tierKeys = TIERS.map((tier) => tier.key);
        let pendingMeasurements = tierKeys.length;
        let matchedTierKey = null;

        const finish = () => {
            setDragPreview(null);
            if (matchedTierKey) {
                placePlayerOnTier(uid, matchedTierKey);
            } else {
                setSelectedUid(uid);
                if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        };

        tierKeys.forEach((tierKey) => {
            const ref = tierRefs.current[tierKey];
            if (!ref?.measureInWindow) {
                pendingMeasurements -= 1;
                if (pendingMeasurements === 0) finish();
                return;
            }

            ref.measureInWindow((x, y, width, height) => {
                const isInside = dropX >= x && dropX <= x + width && dropY >= y && dropY <= y + height;
                if (isInside) matchedTierKey = tierKey;
                pendingMeasurements -= 1;
                if (pendingMeasurements === 0) finish();
            });
        });
    };

    const handleSubmit = async () => {
        if (!allClassified || phase !== 'submitted_ready' || timeLeft === 0) return;
        try {
            const sanitized = Object.fromEntries(
                otherPlayers.map((p) => [p.uid, placements[p.uid]]).filter(([, t]) => Boolean(t))
            );
            setPhase('submitted');
            playSound('answer_submit');
            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (!isSandbox) await submitAnswer(roomId, sanitized);
            playSound('answer_success');
        } catch {
            setPhase('classifying');
            playSound('answer_error');
            Alert.alert('Erro', 'Falha ao enviar classificações.');
        }
    };

    const handleConfirmSubmit = () => {
        if (!allClassified || timeLeft === 0) return;
        playSound('answer_submit');
        if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPhase('submitted_ready');

        const sanitized = Object.fromEntries(
            otherPlayers.map((p) => [p.uid, placements[p.uid]]).filter(([, t]) => Boolean(t))
        );
        setPhase('submitted');
        playSound('answer_success');
        if (!isSandbox) {
            submitAnswer(roomId, sanitized).catch(() => {
                setPhase('classifying');
                playSound('answer_error');
                Alert.alert('Erro', 'Falha ao enviar classificações.');
            });
        }
    };

    const timerTextStyle = useAnimatedStyle(() => ({
        transform: [{ scale: timerScale.value }],
        color: timeLeft <= 10 ? '#F87171' : '#FFFFFF',
    }));

    const timerBarFillStyle = useAnimatedStyle(() => {
        const color = interpolateColor(timerProgress.value, [0, 0.35, 1], ['#EF4444', '#F59E0B', '#A78BFA']);
        return { width: `${timerProgress.value * 100}%`, backgroundColor: color };
    });

    if (!gameState) {
        return <View style={styles.container}><ActivityIndicator color="#fff" /></View>;
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0f0f12', '#14121d', '#1a0f2e']} style={styles.background} />

            <Header
                title={`Rodada ${currentRound}/${totalRounds}`}
                transparent
                showExit
                showSoundToggle
                onConfirmExit={async () => {
                    if (!isSandbox) { await removeFromRoom(roomId); leaveRoom(); }
                    navigation.navigate('GameHome');
                }}
            />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Timer + question */}
                <Animated.View entering={FadeInDown.delay(60)} style={styles.topSection}>
                    <View style={styles.timerRow}>
                        <Clock size={14} color={timeLeft <= 10 ? '#F87171' : '#A78BFA'} />
                        <View style={styles.timerTrack}>
                            <Animated.View style={[styles.timerFill, timerBarFillStyle]} />
                        </View>
                        <Animated.Text style={[styles.timerValue, timerTextStyle]}>{timeLeft}s</Animated.Text>
                    </View>
                    <View style={styles.questionCard}>
                        <Text style={styles.questionLabel}>🏆 TIER LIST DA GALERA</Text>
                        <Text style={styles.questionText}>{question}</Text>
                    </View>
                </Animated.View>

                {phase === 'submitted' ? (
                    <Animated.View entering={FadeIn} style={styles.submittedCard}>
                        <CheckCircle2 size={40} color="#6BCB77" />
                        <Text style={styles.submittedTitle}>Tier list enviada!</Text>
                        <Text style={styles.submittedSub}>Aguardando o grupo revelar o veredito.</Text>
                        <View style={styles.submittedPreview}>
                            {TIERS.map((tier) => {
                                const placed = otherPlayers.filter((p) => {
                                    const myAnswer = answers[currentUser?.uid];
                                    return (myAnswer?.[p.uid] || placements[p.uid]) === tier.key;
                                });
                                if (!placed.length) return null;
                                return (
                                    <View key={tier.key} style={styles.submittedTierRow}>
                                        <View style={[styles.submittedTierLabel, { backgroundColor: tier.bg, borderColor: tier.border }]}>
                                            <Text style={[styles.submittedTierLetter, { color: tier.color }]}>{TIER_LETTERS[tier.key]}</Text>
                                        </View>
                                        <View style={styles.submittedAvatars}>
                                            {placed.map((p) => (
                                                <AvatarCircle key={p.uid} name={p.name} photoURL={p.photoURL} size={36} />
                                            ))}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </Animated.View>
                ) : (
                    <>
                        {/* Hint */}
                        <Animated.View entering={FadeInDown.delay(120)}>
                            {selectedUid ? (
                                <View style={styles.hintBar}>
                                    <Text style={styles.hintText}>
                                        👆 Toque em uma linha para colocar{' '}
                                        <Text style={styles.hintName}>
                                            {otherPlayers.find((p) => p.uid === selectedUid)?.name?.split(' ')[0]}
                                        </Text>
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.hintBar}>
                                    <Text style={styles.hintText}>
                                        {poolPlayers.length > 0
                                            ? '👇 Arraste um avatar para uma posição'
                                            : allClassified
                                            ? '✅ Todos classificados — confirme abaixo'
                                            : 'Arraste ou toque em um jogador para reposicionar'}
                                    </Text>
                                </View>
                            )}
                        </Animated.View>

                        {/* Tier list rows */}
                        <Animated.View entering={FadeInDown.delay(180)} style={styles.tierList}>
                            {TIERS.map((tier) => {
                                const placedInTier = otherPlayers.filter((p) => placements[p.uid] === tier.key);
                                const isDroppable = Boolean(selectedUid) || Boolean(dragPreview);
                                return (
                                    <TouchableOpacity
                                        ref={(node) => { tierRefs.current[tier.key] = node; }}
                                        collapsable={false}
                                        key={tier.key}
                                        style={[
                                            styles.tierRow,
                                            isDroppable && styles.tierRowDroppable,
                                            { borderColor: isDroppable ? tier.border : 'rgba(255,255,255,0.06)' },
                                        ]}
                                        onPress={() => handleDropOnTier(tier.key)}
                                        activeOpacity={isDroppable ? 0.65 : 1}
                                    >
                                        {/* Tier label cell */}
                                        <View style={[styles.tierLabelCell, { backgroundColor: tier.bg }]}>
                                            <Text style={[styles.tierLetter, { color: tier.color }]}>
                                                {TIER_LETTERS[tier.key]}
                                            </Text>
                                            <Text style={[styles.tierDesc, { color: tier.color }]} numberOfLines={2}>
                                                {tier.description}
                                            </Text>
                                        </View>

                                        {/* Player slots */}
                                        <View style={styles.tierSlots}>
                                            {placedInTier.map((p) => (
                                                <View
                                                    key={p.uid}
                                                    style={[styles.slotChip, selectedUid === p.uid && styles.slotChipSelected]}
                                                >
                                                    <PlayerChip
                                                        player={p}
                                                        isSelected={selectedUid === p.uid}
                                                        onPress={() => handlePickUpFromTier(p.uid)}
                                                        onDragStart={handleDragStart}
                                                        onDragMove={handleDragMove}
                                                        onDragEnd={handleDragEnd}
                                                        onDragCancel={handleDragCancel}
                                                        size={50}
                                                        tierColor={tier.color}
                                                    />
                                                </View>
                                            ))}
                                            {/* Drop zone ghost */}
                                            {isDroppable && (
                                                <View style={[styles.dropZone, { borderColor: tier.border }]}>
                                                    <Text style={[styles.dropZoneText, { color: tier.color }]}>+</Text>
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </Animated.View>

                        {/* Unclassified pool */}
                        {poolPlayers.length > 0 && (
                            <Animated.View entering={FadeInDown.delay(240)} style={styles.pool}>
                                <View style={styles.poolHeader}>
                                    <Text style={styles.poolLabel}>SEM TIER</Text>
                                    <Text style={styles.poolCount}>{poolPlayers.length} restante{poolPlayers.length !== 1 ? 's' : ''}</Text>
                                </View>
                                <ScrollView
                                    horizontal
                                    scrollEnabled={!dragPreview}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.poolRow}
                                >
                                    {poolPlayers.map((p) => (
                                        <PlayerChip
                                            key={p.uid}
                                            player={p}
                                            isSelected={selectedUid === p.uid}
                                            onPress={() => handleSelectFromPool(p.uid)}
                                            onDragStart={handleDragStart}
                                            onDragMove={handleDragMove}
                                            onDragEnd={handleDragEnd}
                                            onDragCancel={handleDragCancel}
                                        />
                                    ))}
                                </ScrollView>
                            </Animated.View>
                        )}

                        {/* Submit */}
                        {allClassified && (
                            <Animated.View entering={FadeIn} style={styles.submitWrap}>
                                <TouchableOpacity
                                    style={styles.submitBtn}
                                    onPress={handleConfirmSubmit}
                                    disabled={timeLeft === 0}
                                    activeOpacity={0.84}
                                >
                                    <LinearGradient
                                        colors={timeLeft > 0 ? ['#8B5CF6', '#7C3AED'] : ['#3A3A42', '#292930']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.submitGradient}
                                    >
                                        <Text style={styles.submitText}>Confirmar tier list</Text>
                                        <Send size={18} color="#fff" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        )}
                    </>
                )}
            </ScrollView>

            {dragPreview?.player && dragPreview?.x && dragPreview?.y ? (
                <View
                    pointerEvents="none"
                    style={[
                        styles.dragPreview,
                        {
                            left: dragPreview.x - 36,
                            top: dragPreview.y - 40,
                        },
                    ]}
                >
                    <AvatarCircle
                        name={dragPreview.player.name}
                        photoURL={dragPreview.player.photoURL}
                        size={60}
                    />
                    <Text style={styles.dragPreviewName} numberOfLines={1}>
                        {dragPreview.player.name.split(' ')[0]}
                    </Text>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f12' },
    background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 48 },

    topSection: { marginBottom: 10 },
    timerRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 10, paddingHorizontal: 4,
    },
    timerTrack: {
        flex: 1, height: 6, borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
    },
    timerFill: { height: '100%', borderRadius: 999 },
    timerValue: { color: '#fff', fontSize: 16, fontWeight: '900', fontVariant: ['tabular-nums'], minWidth: 36, textAlign: 'right' },

    questionCard: {
        borderRadius: 20, paddingVertical: 16, paddingHorizontal: 18,
        backgroundColor: 'rgba(18,18,28,0.95)',
        borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)',
        alignItems: 'center', marginBottom: 2,
    },
    questionLabel: { color: '#A78BFA', fontSize: 10, fontWeight: '900', letterSpacing: 1.8, marginBottom: 8 },
    questionText: { color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center', lineHeight: 26 },

    hintBar: {
        alignItems: 'center', paddingVertical: 8, marginBottom: 8,
    },
    hintText: { color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center' },
    hintName: { color: '#A78BFA', fontWeight: '800' },

    tierList: { gap: 3, marginBottom: 12 },
    tierRow: {
        flexDirection: 'row', borderRadius: 10, overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(18,18,26,0.85)',
        minHeight: 60,
    },
    tierRowDroppable: {
        borderWidth: 1.5,
    },
    tierLabelCell: {
        width: 68, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 8, paddingHorizontal: 6,
        borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.08)',
    },
    tierLetter: { fontSize: 20, fontWeight: '900' },
    tierDesc: { fontSize: 9, fontWeight: '700', textAlign: 'center', marginTop: 2, opacity: 0.85 },

    tierSlots: {
        flex: 1, flexDirection: 'row', flexWrap: 'wrap',
        alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, gap: 6,
    },
    slotChip: {
        alignItems: 'center', width: 52, position: 'relative',
    },
    slotChipSelected: { opacity: 0.6 },
    slotChipName: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '700', marginTop: 3, textAlign: 'center' },
    slotRing: {
        position: 'absolute', top: -2, left: -2, right: -2,
        width: 46, height: 46, borderRadius: 23, borderWidth: 2,
    },
    dropZone: {
        width: 42, height: 42, borderRadius: 21,
        borderWidth: 1.5, borderStyle: 'dashed',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    dropZoneText: { fontSize: 20, fontWeight: '300' },

    pool: {
        borderRadius: 16, padding: 14,
        backgroundColor: 'rgba(18,18,28,0.85)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
        marginBottom: 14,
    },
    poolHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    poolLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
    poolCount: { color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: '700' },
    poolRow: { gap: 10, paddingBottom: 2 },

    draggableChip: {
        zIndex: 1,
    },
    draggableChipActive: {
        zIndex: 50,
        elevation: 18,
        opacity: 0.35,
    },
    dragPreview: {
        position: 'absolute',
        zIndex: 1000,
        elevation: 30,
        width: 72,
        alignItems: 'center',
        paddingVertical: 4,
        borderRadius: 18,
        backgroundColor: 'rgba(15,15,18,0.82)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
    },
    dragPreviewName: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        marginTop: 3,
        maxWidth: 64,
        textAlign: 'center',
    },
    playerChip: {
        alignItems: 'center', position: 'relative',
        paddingVertical: 2,
    },
    playerChipSelected: {},
    playerChipName: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700', marginTop: 4, textAlign: 'center' },
    selectedRing: {
        position: 'absolute', top: -3, left: -3,
        width: 50, height: 50, borderRadius: 25,
        borderWidth: 2.5, borderColor: '#A78BFA',
    },

    submitWrap: { marginTop: 4 },
    submitBtn: { borderRadius: 20, overflow: 'hidden' },
    submitGradient: {
        paddingVertical: 17, paddingHorizontal: 22,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '900' },

    submittedCard: {
        alignItems: 'center', borderRadius: 24, padding: 24,
        backgroundColor: 'rgba(107,203,119,0.07)',
        borderWidth: 1, borderColor: 'rgba(107,203,119,0.2)',
        marginTop: 8,
    },
    submittedTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 12, marginBottom: 4 },
    submittedSub: { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', marginBottom: 20 },
    submittedPreview: { width: '100%', gap: 6 },
    submittedTierRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderRadius: 10, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)',
    },
    submittedTierLabel: {
        width: 52, height: 52, alignItems: 'center', justifyContent: 'center',
        borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)',
    },
    submittedTierLetter: { fontSize: 18, fontWeight: '900' },
    submittedAvatars: { flex: 1, flexDirection: 'row', gap: 8, paddingVertical: 7, paddingRight: 10, flexWrap: 'wrap' },
});
