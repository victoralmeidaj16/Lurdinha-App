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
import { Brain, CheckCircle2, Clock, Send, Sparkles } from 'lucide-react-native';
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
import { playSound } from '../../utils/sounds';

const resolveStartTime = (value) => {
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function ObviousMindGameScreen({ roomId, gameState, isSandbox = false }) {
    const navigation = useNavigation();
    const { currentUser } = useAuth();
    const { submitAnswer, calculateRoundResults, removeFromRoom, leaveRoom } = useGame();
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(gameState?.settings?.timePerRound || 30);
    const isCalculating = useRef(false);
    const timerScale = useSharedValue(1);
    const timerProgress = useSharedValue(1);

    const players = gameState?.players || [];
    const answers = gameState?.roundData?.answers || {};
    const currentRound = gameState?.currentRound || 1;
    const totalRounds = gameState?.settings?.totalRounds || 5;
    const question = gameState?.roundData?.question || {};
    const targetId = gameState?.roundData?.targetId;
    const target = players.find((player) => player.uid === targetId);
    const isTarget = currentUser?.uid === targetId;
    const isHost = gameState?.hostId === currentUser?.uid;
    const allPlayersAnswered = players.length > 0 && Object.keys(answers).length >= players.length;

    useEffect(() => {
        setSelectedAnswer(null);
        setSubmitted(Boolean(answers[currentUser?.uid]));
        isCalculating.current = false;
    }, [currentRound, currentUser?.uid]);

    useEffect(() => {
        if (answers[currentUser?.uid]) {
            setSubmitted(true);
            setSelectedAnswer(answers[currentUser.uid]);
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
        if (isSandbox || !isHost || !allPlayersAnswered || isCalculating.current) return;
        isCalculating.current = true;
        calculateRoundResults(roomId, gameState).catch((err) => {
            console.error('Error calculating obvious mind results:', err);
            isCalculating.current = false;
        });
    }, [allPlayersAnswered, calculateRoundResults, gameState, isHost, roomId]);

    const handleTimeUp = async () => {
        if (Platform.OS === 'ios') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        if (!isSandbox && isHost && !isCalculating.current) {
            isCalculating.current = true;
            try {
                await calculateRoundResults(roomId, gameState);
            } catch (err) {
                console.error('Error calculating obvious mind results:', err);
                isCalculating.current = false;
            }
        }
    };

    const handleSubmit = async () => {
        if (!selectedAnswer || submitted || timeLeft === 0) return;

        try {
            setSubmitted(true);
            playSound('answer_submit');
            if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            if (!isSandbox) {
                await submitAnswer(roomId, selectedAnswer);
            }
            playSound('answer_success');
        } catch (err) {
            setSubmitted(false);
            playSound('answer_error');
            Alert.alert('Erro', 'Falha ao enviar resposta.');
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
                colors={['#0f0f12', '#15121f', '#25164a']}
                style={styles.background}
            />
            <View pointerEvents="none" style={styles.ambientGlowTop} />
            <View pointerEvents="none" style={styles.ambientGlowBottom} />

            <Header 
                title={`Rodada ${currentRound}/${totalRounds}`} 
                transparent 
                showExit={true}
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
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View entering={FadeInDown.delay(100)} style={styles.timerCard}>
                    <View style={styles.timerRow}>
                        <Clock size={16} color={timeLeft <= 8 ? '#F87171' : '#A78BFA'} />
                        <Text style={styles.timerLabel}>Tempo para pensar</Text>
                        <Animated.Text style={[styles.timerValue, timerTextStyle]}>{timeLeft}s</Animated.Text>
                    </View>
                    <View style={styles.timerTrack}>
                        <Animated.View style={[styles.timerFill, timerBarFillStyle]} />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(170)} style={styles.targetCard}>
                    <AvatarCircle name={target?.name || 'Alvo mental'} photoURL={target?.photoURL} size={58} />
                    <View style={styles.targetTextWrap}>
                        <Text style={styles.targetLabel}>ALVO MENTAL</Text>
                        <Text style={styles.targetName}>{target?.name || 'Jogador'}</Text>
                    </View>
                    <View style={styles.targetIcon}>
                        <Brain size={22} color="#C4B5FD" />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(230)} style={styles.questionCard}>
                    <View style={styles.questionIcon}>
                        <Sparkles size={24} color="#C4B5FD" />
                    </View>
                    <Text style={styles.questionLabel}>
                        {isTarget ? 'RESPONDA EM SEGREDO' : 'TENTE PENSAR IGUAL'}
                    </Text>
                    <Text style={styles.questionText}>{question.text || 'O que essa pessoa escolheria?'}</Text>
                    <Text style={styles.questionHint}>
                        {isTarget
                            ? 'Escolha sua resposta real. O grupo vai tentar adivinhar.'
                            : `Escolha o que você acha que ${target?.name || 'o alvo'} respondeu.`}
                    </Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(290)} style={styles.optionsSection}>
                    <Text style={styles.sectionLabel}>OPÇÕES</Text>
                    <View style={styles.optionsList}>
                        {(question.options || []).map((option) => {
                            const isSelected = selectedAnswer === option;
                            return (
                                <TouchableOpacity
                                    key={option}
                                    activeOpacity={0.84}
                                    disabled={submitted || timeLeft === 0}
                                    style={[
                                        styles.optionCard,
                                        isSelected && styles.optionCardSelected,
                                    ]}
                                    onPress={() => {
                                        playSound('ui_toggle');
                                        setSelectedAnswer(option);
                                    }}
                                >
                                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option}</Text>
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
                        <Brain size={28} color="#FDE68A" />
                        <Text style={styles.submittedTitle}>{isTarget ? 'Resposta escondida' : 'Palpite enviado'}</Text>
                        <Text style={styles.submittedText}>
                            {isTarget ? 'Aguardando o grupo tentar entrar na sua cabeça.' : 'Aguardando a revelação da rodada.'}
                        </Text>
                    </Animated.View>
                ) : (
                    <TouchableOpacity
                        style={[styles.submitButton, (!selectedAnswer || timeLeft === 0) && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={!selectedAnswer || timeLeft === 0}
                        activeOpacity={0.84}
                    >
                        <LinearGradient
                            colors={selectedAnswer ? ['#8B5CF6', '#7C3AED'] : ['#3A3A42', '#292930']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.submitGradient}
                        >
                            <Text style={styles.submitText}>{isTarget ? 'Responder em segredo' : 'Confirmar palpite'}</Text>
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
        marginBottom: 14,
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
    targetCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        borderRadius: 24,
        padding: 15,
        backgroundColor: 'rgba(18,18,24,0.88)',
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.18)',
        marginBottom: 16,
    },
    targetTextWrap: {
        flex: 1,
        minWidth: 0,
    },
    targetLabel: {
        color: '#A78BFA',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1.3,
        marginBottom: 3,
    },
    targetName: {
        color: '#fff',
        fontSize: 21,
        fontWeight: '900',
    },
    targetIcon: {
        width: 42,
        height: 42,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(139,92,246,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.24)',
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
        fontSize: 25,
        lineHeight: 32,
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
    optionsSection: {
        marginBottom: 18,
    },
    sectionLabel: {
        color: '#A78BFA',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1.8,
        marginBottom: 12,
    },
    optionsList: {
        gap: 10,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 22,
        padding: 16,
        backgroundColor: 'rgba(24,24,31,0.92)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    optionCardSelected: {
        borderColor: 'rgba(167,139,250,0.72)',
        backgroundColor: 'rgba(139,92,246,0.20)',
    },
    optionText: {
        flex: 1,
        color: '#E5E7EB',
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '800',
    },
    optionTextSelected: {
        color: '#fff',
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
        marginLeft: 12,
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
