import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Send, AlertCircle, Sparkles } from 'lucide-react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    ZoomIn
} from 'react-native-reanimated';
import Header from '../../components/Header';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../contexts/AuthContext';

export default function GameScreen({ route, navigation }) {
    const { roomId } = route.params;
    const { listenToRoom, submitAnswer, calculateRoundResults, error } = useGame();
    const { currentUser } = useAuth();

    const [roomData, setRoomData] = useState(null);
    const [answer, setAnswer] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isCalculating, setIsCalculating] = useState(false);

    // Animation values
    const timerScale = useSharedValue(1);
    const timerColor = useSharedValue('#a78bfa');

    useEffect(() => {
        const unsubscribe = listenToRoom(roomId, (data) => {
            setRoomData(data);

            // Handle navigation based on status
            if (data.status === 'round_results') {
                navigation.replace('RoundResult', { roomId });
            } else if (data.status === 'finished') {
                navigation.replace('FinalResult', { roomId });
            }
        });

        return () => unsubscribe();
    }, [roomId]);

    // Timer Logic & Animation
    useEffect(() => {
        if (roomData?.roundData?.startTime) {
            const startTime = roomData.roundData.startTime.toDate ? roomData.roundData.startTime.toDate() : new Date(roomData.roundData.startTime);
            const endTime = new Date(startTime.getTime() + roomData.settings.timePerRound * 1000);

            const interval = setInterval(() => {
                const now = new Date();
                const diff = Math.ceil((endTime - now) / 1000);

                if (diff <= 0) {
                    setTimeLeft(0);
                    clearInterval(interval);
                    handleTimeUp();
                } else {
                    setTimeLeft(diff);

                    // Urgent animation when time < 10s
                    if (diff <= 10) {
                        timerScale.value = withSequence(
                            withTiming(1.2, { duration: 100 }),
                            withTiming(1, { duration: 100 })
                        );
                    }
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [roomData?.roundData?.startTime]);

    const timerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: timerScale.value }],
        color: timeLeft <= 5 ? '#ef4444' : '#fff'
    }));

    const handleTimeUp = async () => {
        // Only host triggers calculation to avoid race conditions
        if (roomData?.hostId === currentUser?.uid && !isCalculating) {
            setIsCalculating(true);
            try {
                await calculateRoundResults(roomId, roomData);
            } catch (err) {
                console.error("Error calculating results:", err);
                setIsCalculating(false);
            }
        }
    };

    const handleSubmit = async () => {
        if (!answer.trim()) return;

        try {
            setSubmitted(true);
            Keyboard.dismiss();
            await submitAnswer(roomId, answer);
        } catch (err) {
            setSubmitted(false);
            Alert.alert('Erro', 'Falha ao enviar resposta.');
        }
    };

    if (!roomData) return <View style={styles.container}><ActivityIndicator color="#fff" /></View>;

    const currentRound = roomData.currentRound;
    const totalRounds = roomData.settings.totalRounds;
    const question = roomData.roundData?.question || 'Carregando pergunta...';

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <Header title={`Rodada ${currentRound}/${totalRounds}`} transparent />

                <LinearGradient
                    colors={['#4c1d95', '#2e1065']}
                    style={styles.background}
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    {/* Timer */}
                    <Animated.View entering={FadeInDown.delay(200)} style={styles.timerWrapper}>
                        <View style={[styles.timerContainer, timeLeft <= 5 && styles.timerContainerUrgent]}>
                            <Clock size={20} color={timeLeft <= 5 ? '#ef4444' : '#a78bfa'} />
                            <Animated.Text style={[styles.timerText, timerAnimatedStyle]}>
                                {timeLeft}s
                            </Animated.Text>
                        </View>
                    </Animated.View>

                    {/* Question Card */}
                    <Animated.View entering={ZoomIn.delay(400)} style={styles.questionCard}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                            style={styles.questionGradient}
                        >
                            <Text style={styles.questionLabel}>PERGUNTA</Text>
                            <Text style={styles.questionText}>{question}</Text>
                        </LinearGradient>
                    </Animated.View>

                    {/* Input Section */}
                    <View style={styles.inputSection}>
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
                                        style={styles.input}
                                        value={answer}
                                        onChangeText={setAnswer}
                                        placeholder="Digite sua resposta..."
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        multiline
                                        maxLength={100}
                                        autoFocus
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
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2e1065',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    timerWrapper: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.3)',
    },
    timerContainerUrgent: {
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    timerText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        fontVariant: ['tabular-nums'],
    },
    questionCard: {
        marginBottom: 30,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    questionGradient: {
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 24,
    },
    questionLabel: {
        color: '#a78bfa',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 16,
    },
    questionText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        lineHeight: 36,
    },
    inputSection: {
        flex: 1,
        justifyContent: 'center',
    },
    inputContainer: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginBottom: 16,
        overflow: 'hidden',
    },
    input: {
        padding: 24,
        fontSize: 20,
        color: '#fff',
        textAlign: 'center',
        minHeight: 140,
        textAlignVertical: 'center',
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
        shadowColor: '#8b5cf6',
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
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
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
        backgroundColor: 'rgba(0,0,0,0.2)',
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
