import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Keyboard, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Send } from 'lucide-react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Header from '../../components/Header';
import LiveConnectionModal from '../../components/LiveConnectionModal';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme';
import TelephoneGameScreen from './TelephoneGameScreen';
import MostLikelyGameScreen from './MostLikelyGameScreen';
import ObviousMindGameScreen from './ObviousMindGameScreen';

export default function GameScreen({ route, navigation }) {
    const { roomId } = route.params;
    const { listenToRoom, submitAnswer, calculateRoundResults } = useGame();
    const { currentUser } = useAuth();

    const [roomData, setRoomData] = useState(null);
    const [answer, setAnswer] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [connectionState, setConnectionState] = useState('loading');
    const [connectionMessage, setConnectionMessage] = useState('');
    const isCalculating = useRef(false);
    const hasRoutedRef = useRef(false);
    const scrollRef = useRef(null);

    const resolveStartTime = (value) => {
        if (!value) return null;
        if (typeof value?.toDate === 'function') return value.toDate();
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    // Animation values
    const timerScale = useSharedValue(1);
    const timerProgress = useSharedValue(1); // 1 = full, 0 = empty

    useEffect(() => {
        const unsubscribe = listenToRoom(roomId, (data, meta) => {
            if (meta?.error) {
                setConnectionState('error');
                setConnectionMessage(meta.message || 'Erro de conexao com a sala.');
                return;
            }

            if (!data) return;

            setConnectionState(meta?.fromCache ? 'reconnecting' : 'online');
            setConnectionMessage('');
            setRoomData(data);
            if (meta?.fromCache) return;

            // Handle navigation based on status
            if (data.status === 'round_results' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                const gameType = data.settings?.gameType;
                if (gameType === 'telephone' || gameType === 'secret') {
                    navigation.replace('TelephoneResult', { roomId, gameState: data });
                } else if (gameType === 'draw') {
                    // Note: DrawResult doesn't exist in original code here but keeping structure
                    navigation.replace('RoundResult', { roomId }); // Usually RoundResult handles Draw or Lurdinha
                } else {
                    navigation.replace('RoundResult', { roomId });
                }
            } else if (data.status === 'finished' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                navigation.replace('FinalResult', { roomId });
            }
        });

        return () => unsubscribe();
    }, [navigation, roomId]);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSubscription = Keyboard.addListener(showEvent, () => {
            setIsKeyboardVisible(true);
            setTimeout(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
            }, 40);
        });

        const hideSubscription = Keyboard.addListener(hideEvent, () => {
            setIsKeyboardVisible(false);
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    // Timer Logic & Animation
    useEffect(() => {
        if (roomData?.roundData?.startTime) {
            const startTime = resolveStartTime(roomData.roundData.startTime);
            const totalTime = roomData.settings.timePerRound;
            if (!startTime) {
                setTimeLeft(totalTime);
                return undefined;
            }
            const endTime = new Date(startTime.getTime() + totalTime * 1000);

            const updateRemainingTime = () => {
                const now = new Date();
                const diff = Math.ceil((endTime - now) / 1000);

                if (diff <= 0) {
                    setTimeLeft(0);
                    timerProgress.value = withTiming(0, { duration: 400 });
                    handleTimeUp();
                    return false;
                }

                setTimeLeft(diff);
                timerProgress.value = withTiming(diff / totalTime, { duration: 900 });

                if (diff <= 10) {
                    timerScale.value = withSequence(
                        withTiming(1.25, { duration: 100 }),
                        withTiming(1, { duration: 100 })
                    );
                }

                return true;
            };

            updateRemainingTime();

            const interval = setInterval(() => {
                const shouldContinue = updateRemainingTime();
                if (!shouldContinue) {
                    clearInterval(interval);
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [roomData?.roundData?.startTime]);

    const timerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: timerScale.value }],
        color: timeLeft <= 5 ? '#ef4444' : '#fff',
    }));

    const timerBarFillStyle = useAnimatedStyle(() => {
        const color = interpolateColor(
            timerProgress.value,
            [0, 0.3, 0.6, 1],
            ['#ef4444', '#f97316', '#eab308', '#a78bfa']
        );
        return {
            width: `${timerProgress.value * 100}%`,
            backgroundColor: color,
        };
    });

    const timerGlowStyle = useAnimatedStyle(() => {
        const shadowColor = interpolateColor(
            timerProgress.value,
            [0, 0.3, 1],
            ['#ef4444', '#f97316', '#a78bfa']
        );
        return { shadowColor };
    });

    const handleTimeUp = async () => {
        // Haptic burst so every player physically feels the deadline
        if (Platform.OS === 'ios') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 150);
        }

        // Only host triggers calculation to avoid race conditions
        if (roomData?.hostId === currentUser?.uid && !isCalculating.current) {
            isCalculating.current = true;
            try {
                await calculateRoundResults(roomId, roomData);
            } catch (err) {
                console.error("Error calculating results:", err);
                isCalculating.current = false;
            }
        }
    };

    const handleSubmit = async () => {
        if (!answer.trim() || timeLeft === 0 || submitted) return;

        try {
            setSubmitted(true);
            Keyboard.dismiss();

            if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }

            await submitAnswer(roomId, answer);

            if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (err) {
            if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
            setSubmitted(false);
            Alert.alert('Erro', 'Falha ao enviar resposta.');
        }
    };

    const handleInputFocus = () => {
        requestAnimationFrame(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
        });
    };

    if (!roomData) {
        return (
            <View style={styles.container}>
                <ActivityIndicator color="#fff" />
                <LiveConnectionModal
                    status={connectionState}
                    message={connectionMessage}
                    onLeave={() => navigation.replace('GameHome')}
                />
            </View>
        );
    }

    const gameType = roomData.settings?.gameType || 'lurdinha';

    if (gameType === 'telephone' || gameType === 'secret') {
        return <TelephoneGameScreen roomId={roomId} gameState={roomData} />;
    }

    if (gameType === 'most_likely') {
        return <MostLikelyGameScreen roomId={roomId} gameState={roomData} />;
    }

    if (gameType === 'obvious_mind') {
        return <ObviousMindGameScreen roomId={roomId} gameState={roomData} />;
    }

    const currentRound = roomData.currentRound;
    const totalRounds = roomData.settings.totalRounds;
    const question = roomData.roundData?.question || 'Carregando pergunta...';

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <LiveConnectionModal
                    status={connectionState}
                    message={connectionMessage}
                    onLeave={() => navigation.replace('GameHome')}
                />
                <Header title={`Rodada ${currentRound}/${totalRounds}`} transparent />

                <LinearGradient
                    colors={['#110f17', '#161323', '#22144a']}
                    style={styles.background}
                />
                <View pointerEvents="none" style={styles.ambientGlowTop} />
                <View pointerEvents="none" style={styles.ambientGlowBottom} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
                >
                    <ScrollView
                        ref={scrollRef}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.scrollContent}
                    >
                        <Animated.View entering={FadeInDown.delay(200)} style={styles.timerWrapper}>
                            <View style={styles.timerTopRow}>
                                <Clock size={16} color={timeLeft <= 10 ? '#ef4444' : '#a78bfa'} />
                                <Animated.Text style={[styles.timerText, timerAnimatedStyle]}>
                                    {timeLeft}s
                                </Animated.Text>
                                <Animated.Text style={[styles.timerPercent, timerAnimatedStyle]}>
                                    {roomData?.settings?.timePerRound
                                        ? Math.round((timeLeft / roomData.settings.timePerRound) * 100)
                                        : 100}%
                                </Animated.Text>
                            </View>

                            <Animated.View style={[styles.timerBarTrack, timerGlowStyle]}>
                                <Animated.View style={[styles.timerBarFill, timerBarFillStyle]} />
                            </Animated.View>
                        </Animated.View>

                        <Animated.View
                            key={question}
                            entering={FadeIn.duration(260)}
                            style={[
                                styles.questionCard,
                                isKeyboardVisible && styles.questionCardKeyboard,
                            ]}
                        >
                            <LinearGradient
                                colors={['rgba(18,18,24,0.96)', 'rgba(32,20,58,0.84)']}
                                style={[
                                    styles.questionGradient,
                                    isKeyboardVisible && styles.questionGradientKeyboard,
                                ]}
                            >
                                <Text style={styles.questionLabel}>PERGUNTA</Text>
                                <Text
                                    style={[
                                        styles.questionText,
                                        isKeyboardVisible && styles.questionTextKeyboard,
                                    ]}
                                >
                                    {question}
                                </Text>
                            </LinearGradient>
                        </Animated.View>

                        <View style={[styles.inputSection, isKeyboardVisible && styles.inputSectionKeyboard]}>
                            {submitted ? (
                                <Animated.View entering={FadeInUp} style={styles.submittedContainer}>
                                    <View style={styles.submittedIcon}>
                                        <Send size={32} color="#fff" />
                                    </View>
                                    <Text style={styles.submittedTitle}>Resposta Enviada!</Text>
                                    <Text style={styles.submittedText}>
                                        Aguardando os outros jogadores...
                                    </Text>
                                    <View style={styles.myAnswerContainer}>
                                        <Text style={styles.myAnswerLabel}>Sua resposta:</Text>
                                        <Text style={styles.myAnswer}>"{answer}"</Text>
                                    </View>
                                </Animated.View>
                            ) : (
                                <Animated.View entering={FadeInUp.delay(600)} style={{ width: '100%' }}>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={[styles.input, isKeyboardVisible && styles.inputKeyboard]}
                                            value={answer}
                                            onChangeText={setAnswer}
                                            placeholder="Digite sua resposta..."
                                            placeholderTextColor="rgba(255,255,255,0.3)"
                                            multiline
                                            maxLength={100}
                                            autoFocus
                                            onFocus={handleInputFocus}
                                        />
                                        <View style={styles.charCount}>
                                            <Text style={styles.charCountText}>{answer.length}/100</Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.submitButton, !answer.trim() && styles.submitButtonDisabled]}
                                        onPress={handleSubmit}
                                        disabled={!answer.trim() || timeLeft === 0}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={answer.trim() ? ['#8b5cf6', '#7c3aed'] : ['#4b5563', '#374151']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.gradientButton}
                                        >
                                            <Text style={styles.submitButtonText}>Enviar Resposta</Text>
                                            <Send size={20} color="#fff" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Animated.View>
                            )}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#110f17',
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
        top: 88,
        right: -64,
        width: 220,
        height: 220,
        borderRadius: 999,
        backgroundColor: 'rgba(139,92,246,0.16)',
    },
    ambientGlowBottom: {
        position: 'absolute',
        left: -100,
        bottom: 120,
        width: 220,
        height: 220,
        borderRadius: 999,
        backgroundColor: 'rgba(168,85,247,0.12)',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
        minHeight: '100%',
    },
    timerWrapper: {
        marginTop: 10,
        marginBottom: 22,
        width: '100%',
        backgroundColor: 'rgba(10,10,14,0.38)',
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.14)',
    },
    timerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingHorizontal: 2,
    },
    timerText: {
        fontSize: 22,
        fontWeight: '900',
        color: '#fff',
        fontVariant: ['tabular-nums'],
        letterSpacing: -0.5,
    },
    timerPercent: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.45)',
        fontVariant: ['tabular-nums'],
    },
    timerBarTrack: {
        width: '100%',
        height: 10,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.09)',
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 8,
        elevation: 4,
    },
    timerBarFill: {
        height: '100%',
        borderRadius: 6,
    },
    questionCard: {
        marginBottom: 22,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.16)',
        shadowColor: '#6D28D9',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 10,
    },
    questionCardKeyboard: {
        marginBottom: 14,
    },
    questionGradient: {
        paddingHorizontal: 26,
        paddingVertical: 24,
        alignItems: 'center',
        borderRadius: 24,
    },
    questionGradientKeyboard: {
        paddingHorizontal: 22,
        paddingVertical: 18,
    },
    questionLabel: {
        color: '#a78bfa',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 16,
    },
    questionText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        lineHeight: 31,
    },
    questionTextKeyboard: {
        fontSize: 20,
        lineHeight: 26,
    },
    inputSection: {
        marginTop: 'auto',
        paddingTop: 10,
    },
    inputSectionKeyboard: {
        marginTop: 12,
        paddingTop: 0,
    },
    inputContainer: {
        backgroundColor: 'rgba(15,15,20,0.72)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.16)',
        marginBottom: 16,
        overflow: 'hidden',
    },
    input: {
        padding: 24,
        fontSize: 20,
        color: '#fff',
        textAlign: 'center',
        minHeight: 140,
        textAlignVertical: 'top',
        paddingTop: 30,
    },
    inputKeyboard: {
        minHeight: 110,
        paddingTop: 22,
    },
    charCount: {
        position: 'absolute',
        bottom: 12,
        right: 16,
    },
    charCountText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
    },
    helperContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 32,
    },
    helperText: {
        color: '#fbbf24',
        fontSize: 14,
        fontWeight: '600',
    },
    submitButton: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    submitButtonDisabled: {
        opacity: 0.6,
        shadowOpacity: 0,
    },
    gradientButton: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    submittedContainer: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: 'rgba(15,15,20,0.72)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.16)',
    },
    submittedIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    submittedTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
    },
    submittedText: {
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginBottom: 24,
        fontSize: 16,
    },
    myAnswerContainer: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        padding: 16,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
    },
    myAnswerLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginBottom: 4,
    },
    myAnswer: {
        color: '#a78bfa',
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
    },
});
