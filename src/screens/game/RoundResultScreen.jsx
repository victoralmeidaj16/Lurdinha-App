import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn, useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Header from '../../components/Header';
import AvatarCircle from '../../components/AvatarCircle';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../contexts/AuthContext';

export default function RoundResultScreen({ route, navigation }) {
    const { roomId } = route.params;
    const { listenToRoom, nextRound, error } = useGame();
    const { currentUser } = useAuth();
    const [roomData, setRoomData] = useState(null);
    const [loadingNext, setLoadingNext] = useState(false);

    useEffect(() => {
        const unsubscribe = listenToRoom(roomId, (data) => {
            setRoomData(data);
            if (data.status === 'playing') {
                navigation.replace('Game', { roomId });
            } else if (data.status === 'finished') {
                navigation.replace('FinalResult', { roomId });
            }
        });

        return () => unsubscribe();
    }, [roomId]);

    const handleNextRound = async () => {
        if (!roomData) return;
        setLoadingNext(true);

        const isLastRound = roomData.currentRound >= roomData.settings.totalRounds;
        // Simple next question logic - handled by server now
        try {
            await nextRound(roomId, isLastRound);
        } catch (err) {
            setLoadingNext(false);
        }
    };

    if (!roomData || !roomData.roundData?.results) {
        return <View style={styles.container}><ActivityIndicator color="#fff" /></View>;
    }

    const { results, answers } = roomData.roundData;
    const majorityAnswers = results.majorityAnswers || [];
    const lurdinhaVictims = results.lurdinhaVictims || [];

    const isHost = roomData.hostId === currentUser?.uid;
    const myUid = currentUser?.uid;
    const iGotLurdinha = lurdinhaVictims.includes(myUid);

    return (
        <View style={styles.container}>
            <Header title="Resultado da Rodada" transparent />

            <LinearGradient
                colors={iGotLurdinha ? ['#7f1d1d', '#450a0a'] : ['#4c1d95', '#2e1065']}
                style={styles.background}
            />

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
                <Animated.View entering={ZoomIn.delay(200)} style={styles.resultHeader}>
                    {iGotLurdinha ? (
                        <>
                            <View style={styles.iconContainer}>
                                <AlertTriangle size={64} color="#ef4444" />
                            </View>
                            <Text style={styles.resultTitle}>LURDINHA!</Text>
                            <Text style={styles.resultSubtitle}>Você não pensou como o grupo.</Text>
                        </>
                    ) : (
                        <>
                            <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                                <CheckCircle2 size={64} color="#10b981" />
                            </View>
                            <Text style={styles.resultTitle}>SAFE!</Text>
                            <Text style={styles.resultSubtitle}>Você seguiu o fluxo.</Text>
                        </>
                    )}
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(400)} style={styles.majoritySection}>
                    <Text style={styles.sectionLabel}>RESPOSTA DA MAIORIA</Text>
                    <View style={styles.majorityCard}>
                        <Text style={styles.majorityText}>
                            "{majorityAnswers[0]?.toUpperCase()}"
                        </Text>
                    </View>
                </Animated.View>

                <View style={styles.answersList}>
                    <Text style={styles.sectionLabel}>QUEM RESPONDEU O QUÊ</Text>
                    {roomData.players.map((player, index) => {
                        const playerAnswer = answers[player.uid] || 'Não respondeu';
                        const isVictim = lurdinhaVictims.includes(player.uid);

                        return (
                            <Animated.View
                                key={player.uid}
                                entering={FadeInDown.delay(600 + (index * 100))}
                                style={[styles.playerRow, isVictim && styles.playerRowVictim]}
                            >
                                <View style={styles.playerInfo}>
                                    <AvatarCircle name={player.name} photoURL={player.photoURL} size={40} />
                                    <View style={{ marginLeft: 12, flex: 1 }}>
                                        <Text style={styles.playerName}>{player.name}</Text>
                                        <Text style={[styles.playerAnswer, isVictim && styles.playerAnswerVictim]}>
                                            "{playerAnswer}"
                                        </Text>
                                    </View>
                                </View>
                                {isVictim && (
                                    <View style={styles.lurdinhaBadge}>
                                        <Text style={styles.lurdinhaText}>+1 😈</Text>
                                    </View>
                                )}
                            </Animated.View>
                        );
                    })}
                </View>
            </ScrollView>

            {isHost ? (
                <Animated.View entering={FadeInUp.delay(1000)} style={styles.footer}>
                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={handleNextRound}
                        disabled={loadingNext}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#8b5cf6', '#7c3aed']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            {loadingNext ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.nextButtonText}>
                                        {roomData.currentRound >= roomData.settings.totalRounds ? 'Ver Resultado Final' : 'Próxima Rodada'}
                                    </Text>
                                    <ArrowRight size={20} color="#fff" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            ) : (
                <View style={styles.footer}>
                    <Text style={styles.waitingText}>Aguardando o host...</Text>
                </View>
            )}
        </View>
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
    resultHeader: {
        alignItems: 'center',
        marginVertical: 32,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    resultTitle: {
        fontSize: 40,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 8,
    },
    resultSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 18,
    },
    majoritySection: {
        marginBottom: 32,
    },
    sectionLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 12,
        letterSpacing: 1,
    },
    majorityCard: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    majorityText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
    },
    answersList: {
        gap: 12,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    playerRowVictim: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    playerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    playerName: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        marginBottom: 2,
    },
    playerAnswer: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    playerAnswerVictim: {
        color: '#fca5a5',
    },
    lurdinhaBadge: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    lurdinhaText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 12,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 40,
        backgroundColor: 'rgba(46, 16, 101, 0.8)',
    },
    nextButton: {
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
    gradientButton: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    waitingText: {
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        fontSize: 16,
        fontStyle: 'italic',
    },
});
