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
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, Clock, Crown, Send, Users } from 'lucide-react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
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

const resolveStartTime = (value) => {
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function MostLikelyGameScreen({ roomId, gameState }) {
    const { currentUser } = useAuth();
    const { submitAnswer, calculateRoundResults } = useGame();
    const [selectedUid, setSelectedUid] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(gameState?.settings?.timePerRound || 30);
    const isCalculating = useRef(false);
    const timerScale = useSharedValue(1);
    const timerProgress = useSharedValue(1);

    const players = gameState?.players || [];
    const answers = gameState?.roundData?.answers || {};
    const currentRound = gameState?.currentRound || 1;
    const totalRounds = gameState?.settings?.totalRounds || 5;
    const question = gameState?.roundData?.question || 'Quem é mais provável?';
    const isHost = gameState?.hostId === currentUser?.uid;
    const allPlayersAnswered = players.length > 0 && Object.keys(answers).length >= players.length;

    useEffect(() => {
        setSelectedUid(null);
        setSubmitted(Boolean(answers[currentUser?.uid]));
        isCalculating.current = false;
    }, [currentRound, currentUser?.uid]);

    useEffect(() => {
        if (answers[currentUser?.uid]) {
            setSubmitted(true);
            setSelectedUid(answers[currentUser.uid]);
        }
    }, [answers, currentUser?.uid]);

    useEffect(() => {
        if (!gameState?.roundData?.startTime) return undefined;

        const startTime = resolveStartTime(gameState.roundData.startTime);
        const totalTime = gameState.settings?.timePerRound || 30;
        if (!startTime) {
            setTimeLeft(totalTime);
            return undefined;
        }

        const endTime = new Date(startTime.getTime() + totalTime * 1000);
        const updateRemainingTime = () => {
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

        updateRemainingTime();
        const interval = setInterval(() => {
            if (!updateRemainingTime()) clearInterval(interval);
        }, 1000);

        return () => clearInterval(interval);
    }, [gameState?.roundData?.startTime]);

    useEffect(() => {
        if (!isHost || !allPlayersAnswered || isCalculating.current) return;
        isCalculating.current = true;
        calculateRoundResults(roomId, gameState).catch((err) => {
            console.error('Error calculating most likely results:', err);
            isCalculating.current = false;
        });
    }, [allPlayersAnswered, calculateRoundResults, gameState, isHost, roomId]);

    const handleTimeUp = async () => {
        if (Platform.OS === 'ios') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        if (isHost && !isCalculating.current) {
            isCalculating.current = true;
            try {
                await calculateRoundResults(roomId, gameState);
            } catch (err) {
                console.error('Error calculating most likely results:', err);
                isCalculating.current = false;
            }
        }
    };

    const handleSubmit = async () => {
        if (!selectedUid || submitted || timeLeft === 0) return;
        if (selectedUid === currentUser?.uid) {
            Alert.alert('Escolha outra pessoa', 'Neste modo, o voto precisa ser em alguém do grupo.');
            return;
        }

        try {
            setSubmitted(true);
            if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            await submitAnswer(roomId, selectedUid);
        } catch (err) {
            setSubmitted(false);
            Alert.alert('Erro', 'Falha ao enviar voto.');
        }
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
        return {
            width: `${timerProgress.value * 100}%`,
            backgroundColor: color,
        };
    });

    if (!gameState) {
        return (
            <View style={styles.container}>
                <ActivityIndicator color="#fff" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f0f12', '#14121d', '#21143e']}
                style={styles.background}
            />
            <View pointerEvents="none" style={styles.ambientGlowTop} />
            <View pointerEvents="none" style={styles.ambientGlowBottom} />

            <Header title={`Rodada ${currentRound}/${totalRounds}`} transparent />

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View entering={FadeInDown.delay(100)} style={styles.timerCard}>
                    <View style={styles.timerRow}>
                        <Clock size={16} color={timeLeft <= 8 ? '#F87171' : '#A78BFA'} />
                        <Text style={styles.timerLabel}>Tempo para votar</Text>
                        <Animated.Text style={[styles.timerValue, timerTextStyle]}>{timeLeft}s</Animated.Text>
                    </View>
                    <View style={styles.timerTrack}>
                        <Animated.View style={[styles.timerFill, timerBarFillStyle]} />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(180)} style={styles.questionCard}>
                    <View style={styles.questionIcon}>
                        <Users size={24} color="#C4B5FD" />
                    </View>
                    <Text style={styles.questionLabel}>QUEM É MAIS PROVÁVEL?</Text>
                    <Text style={styles.questionText}>{question}</Text>
                    <Text style={styles.questionHint}>
                        Vote em uma pessoa do grupo. O resultado é a percepção coletiva.
                    </Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(260)} style={styles.playersSection}>
                    <Text style={styles.sectionLabel}>ESCOLHA UMA PESSOA</Text>
                    <View style={styles.playersList}>
                        {players.map((player) => {
                            const isMe = player.uid === currentUser?.uid;
                            const isSelected = selectedUid === player.uid;
                            const hasVoted = Boolean(answers[player.uid]);

                            return (
                                <TouchableOpacity
                                    key={player.uid}
                                    activeOpacity={0.82}
                                    disabled={submitted || timeLeft === 0 || isMe}
                                    style={[
                                        styles.playerCard,
                                        isSelected && styles.playerCardSelected,
                                        isMe && styles.playerCardDisabled,
                                    ]}
                                    onPress={() => setSelectedUid(player.uid)}
                                >
                                    <AvatarCircle name={player.name} photoURL={player.photoURL} size={46} />
                                    <View style={styles.playerTextWrap}>
                                        <Text style={styles.playerName}>{player.name}</Text>
                                        <Text style={styles.playerStatus}>
                                            {isMe ? 'Você' : hasVoted ? 'Já votou' : 'Disponível'}
                                        </Text>
                                    </View>
                                    <View style={[styles.selectionDot, isSelected && styles.selectionDotSelected]}>
                                        {isSelected ? <CheckCircle2 size={18} color="#fff" /> : null}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>

                {submitted ? (
                    <Animated.View entering={FadeInUp} style={styles.submittedCard}>
                        <Crown size={28} color="#FDE68A" />
                        <Text style={styles.submittedTitle}>Voto enviado</Text>
                        <Text style={styles.submittedText}>Aguardando o grupo revelar a verdade social.</Text>
                    </Animated.View>
                ) : (
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (!selectedUid || selectedUid === currentUser?.uid || timeLeft === 0) && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={!selectedUid || selectedUid === currentUser?.uid || timeLeft === 0}
                        activeOpacity={0.84}
                    >
                        <LinearGradient
                            colors={selectedUid && selectedUid !== currentUser?.uid ? ['#8B5CF6', '#7C3AED'] : ['#3A3A42', '#292930']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.submitGradient}
                        >
                            <Text style={styles.submitText}>Confirmar voto</Text>
                            <Send size={18} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f12',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    ambientGlowTop: {
        position: 'absolute',
        top: 96,
        right: -72,
        width: 220,
        height: 220,
        borderRadius: 999,
        backgroundColor: 'rgba(139,92,246,0.16)',
    },
    ambientGlowBottom: {
        position: 'absolute',
        left: -96,
        bottom: 90,
        width: 220,
        height: 220,
        borderRadius: 999,
        backgroundColor: 'rgba(168,85,247,0.10)',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 42,
    },
    timerCard: {
        borderRadius: 20,
        padding: 16,
        backgroundColor: 'rgba(17,17,23,0.76)',
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.16)',
        marginBottom: 18,
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    timerLabel: {
        flex: 1,
        color: 'rgba(255,255,255,0.64)',
        fontSize: 13,
        fontWeight: '700',
    },
    timerValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '900',
        fontVariant: ['tabular-nums'],
    },
    timerTrack: {
        height: 9,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.09)',
        overflow: 'hidden',
    },
    timerFill: {
        height: '100%',
        borderRadius: 999,
    },
    questionCard: {
        alignItems: 'center',
        borderRadius: 28,
        padding: 24,
        backgroundColor: 'rgba(18,18,24,0.94)',
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.18)',
        marginBottom: 22,
        overflow: 'hidden',
    },
    questionIcon: {
        width: 58,
        height: 58,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(139,92,246,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.26)',
        marginBottom: 18,
    },
    questionLabel: {
        color: '#A78BFA',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1.8,
        marginBottom: 12,
    },
    questionText: {
        color: '#fff',
        fontSize: 27,
        lineHeight: 34,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 14,
    },
    questionHint: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    playersSection: {
        marginBottom: 18,
    },
    sectionLabel: {
        color: '#A78BFA',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1.8,
        marginBottom: 12,
    },
    playersList: {
        gap: 10,
    },
    playerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 22,
        padding: 14,
        backgroundColor: 'rgba(24,24,31,0.92)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    playerCardSelected: {
        borderColor: 'rgba(167,139,250,0.72)',
        backgroundColor: 'rgba(139,92,246,0.20)',
    },
    playerCardDisabled: {
        opacity: 0.56,
    },
    playerTextWrap: {
        flex: 1,
        marginLeft: 12,
    },
    playerName: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 3,
    },
    playerStatus: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 13,
        fontWeight: '600',
    },
    selectionDot: {
        width: 30,
        height: 30,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    selectionDotSelected: {
        backgroundColor: '#8B5CF6',
        borderColor: '#A78BFA',
    },
    submittedCard: {
        alignItems: 'center',
        borderRadius: 24,
        padding: 22,
        backgroundColor: 'rgba(250,204,21,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(253,230,138,0.22)',
    },
    submittedTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '900',
        marginTop: 10,
        marginBottom: 4,
    },
    submittedText: {
        color: 'rgba(255,255,255,0.58)',
        fontSize: 14,
        textAlign: 'center',
    },
    submitButton: {
        borderRadius: 24,
        overflow: 'hidden',
        marginTop: 2,
        marginBottom: 16,
    },
    submitButtonDisabled: {
        opacity: 0.65,
    },
    submitGradient: {
        paddingVertical: 19,
        paddingHorizontal: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    submitText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
    },
});
