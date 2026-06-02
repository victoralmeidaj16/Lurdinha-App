import React, { useEffect, useRef, useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Skull, Trophy, Users } from 'lucide-react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    SlideInDown,
    ZoomIn,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
    useAnimatedStyle,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import AvatarCircle from '../../components/AvatarCircle';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../hooks/useGame';
import { playSound } from '../../utils/sounds';

export default function ImpostorRoundResultScreen({ route, navigation }) {
    const { roomId } = route.params;
    const { currentUser } = useAuth();
    const { listenToRoom, nextRound, removeFromRoom, leaveRoom } = useGame();
    const [roomData, setRoomData] = useState(null);
    const [revealStep, setRevealStep] = useState(0); // 0=votes, 1=impostor, 2=scores
    const isAdvancing = useRef(false);

    const revealScale = useSharedValue(0.5);
    const revealOpacity = useSharedValue(0);

    useEffect(() => {
        const unsub = listenToRoom(roomId, (data) => {
            if (!data) return;
            setRoomData(data);
            if (data.status === 'playing') {
                navigation.replace('Game', { roomId });
            } else if (data.status === 'finished') {
                navigation.replace('FinalResult', { roomId });
            }
        });
        return () => unsub();
    }, [roomId]);

    useEffect(() => {
        if (!roomData) return;
        // Auto-progress the reveal sequence
        const t1 = setTimeout(() => {
            setRevealStep(1);
            playSound('mockingjay_whistle');
        }, 1200);
        const t2 = setTimeout(() => {
            setRevealStep(2);
            if (Platform.OS === 'ios') {
                Haptics.notificationAsync(
                    results?.impostorCaught
                        ? Haptics.NotificationFeedbackType.Success
                        : Haptics.NotificationFeedbackType.Error,
                );
            }
            playSound(results?.impostorCaught ? 'answer_success' : 'answer_error');
        }, 2600);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [roomData?.roundData?.results]);

    if (!roomData) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={['#0d0a14', '#130c1e']} style={StyleSheet.absoluteFill} />
            </View>
        );
    }

    const results = roomData.roundData?.results || {};
    const players = roomData.players || [];
    const isHost = roomData.hostId === currentUser?.uid;
    const currentRound = roomData.currentRound || 1;
    const totalRounds = roomData.settings?.totalRounds || 3;
    const isLastRound = currentRound >= totalRounds;

    const impostorPlayer = players.find(p => p.uid === results.impostorId);
    const { impostorCaught, voteDistribution = [], votes = {} } = results;

    const handleNext = async () => {
        if (!isHost || isAdvancing.current) return;
        isAdvancing.current = true;
        try {
            await nextRound(roomId, isLastRound);
        } catch {
            isAdvancing.current = false;
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={impostorCaught
                    ? ['#0d1a0d', '#0a1a14', '#0d1428']
                    : ['#1a0d0d', '#1a0a0d', '#1a0d28']}
                style={StyleSheet.absoluteFill}
            />
            <View style={[styles.ambientGlow, {
                backgroundColor: impostorCaught
                    ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.14)',
            }]} />

            <Header
                title={`Resultado – Rodada ${currentRound}/${totalRounds}`}
                transparent
                showSoundToggle
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Outcome banner */}
                {revealStep >= 1 && (
                    <Animated.View
                        entering={ZoomIn.springify().damping(14)}
                        style={[
                            styles.outcomeBanner,
                            impostorCaught ? styles.outcomeCaught : styles.outcomeEscaped,
                        ]}
                    >
                        {impostorCaught ? (
                            <>
                                <Crown size={32} color="#10b981" />
                                <Text style={[styles.outcomeTitle, { color: '#10b981' }]}>
                                    Impostor Pego!
                                </Text>
                                <Text style={styles.outcomeSubtitle}>Os aldeões venceram esta rodada</Text>
                            </>
                        ) : (
                            <>
                                <Skull size={32} color="#ef4444" />
                                <Text style={[styles.outcomeTitle, { color: '#ef4444' }]}>
                                    Impostor Escapou!
                                </Text>
                                <Text style={styles.outcomeSubtitle}>O impostor enganou a todos</Text>
                            </>
                        )}
                    </Animated.View>
                )}

                {/* Impostor reveal */}
                {revealStep >= 1 && impostorPlayer && (
                    <Animated.View
                        entering={FadeInDown.delay(200)}
                        style={styles.impostorReveal}
                    >
                        <Text style={styles.impostorRevealLabel}>O IMPOSTOR ERA</Text>
                        <View style={styles.impostorRevealCard}>
                            <AvatarCircle
                                name={impostorPlayer.name}
                                photoURL={impostorPlayer.photoURL}
                                size={64}
                            />
                            <Text style={styles.impostorName}>{impostorPlayer.name}</Text>
                            <View style={styles.wordRevealBadge}>
                                <Text style={styles.wordRevealLabel}>Palavra secreta</Text>
                                <Text style={styles.wordRevealValue}>{results.word}</Text>
                                <Text style={styles.wordRevealCategory}>({results.category})</Text>
                            </View>
                        </View>
                    </Animated.View>
                )}

                {/* Vote distribution */}
                {revealStep >= 1 && voteDistribution.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(400)} style={styles.voteSection}>
                        <Text style={styles.voteSectionTitle}>VOTOS</Text>
                        {voteDistribution.map((entry, i) => {
                            const isImpostor = entry.uid === results.impostorId;
                            const votePercent = players.length > 0
                                ? (entry.count / players.length) * 100
                                : 0;
                            return (
                                <Animated.View
                                    key={entry.uid}
                                    entering={FadeIn.delay(400 + i * 100)}
                                    style={styles.voteRow}
                                >
                                    <AvatarCircle name={entry.name} photoURL={entry.photoURL} size={36} />
                                    <View style={styles.voteBarWrap}>
                                        <View style={styles.voteBarHeader}>
                                            <Text style={styles.voteBarName}>
                                                {entry.name}
                                                {isImpostor && (
                                                    <Text style={{ color: '#ef4444' }}> 🎭</Text>
                                                )}
                                            </Text>
                                            <Text style={styles.voteBarCount}>{entry.count} voto(s)</Text>
                                        </View>
                                        <View style={styles.voteBarTrack}>
                                            <Animated.View
                                                entering={FadeIn.delay(600 + i * 100)}
                                                style={[
                                                    styles.voteBarFill,
                                                    {
                                                        width: `${votePercent}%`,
                                                        backgroundColor: isImpostor ? '#ef4444' : '#6d28d9',
                                                    },
                                                ]}
                                            />
                                        </View>
                                    </View>
                                </Animated.View>
                            );
                        })}
                    </Animated.View>
                )}

                {/* Score deltas */}
                {revealStep >= 2 && (
                    <Animated.View entering={FadeInDown.delay(200)} style={styles.scoresSection}>
                        <Text style={styles.scoresSectionTitle}>PONTUAÇÃO</Text>
                        {players.map((player, i) => {
                            const isImpostorPlayer = player.uid === results.impostorId;
                            const voted = votes[player.uid];
                            let delta = 0;
                            if (isImpostorPlayer && !impostorCaught) delta = 5;
                            else if (!isImpostorPlayer && voted === results.impostorId) {
                                delta = results.allVotedImpostor ? 4 : 3;
                            }
                            return (
                                <Animated.View
                                    key={player.uid}
                                    entering={FadeIn.delay(i * 80)}
                                    style={styles.scoreRow}
                                >
                                    <AvatarCircle name={player.name} photoURL={player.photoURL} size={36} />
                                    <Text style={styles.scorePlayerName}>
                                        {player.name}
                                        {isImpostorPlayer && <Text style={{ color: '#ef4444' }}> 🎭</Text>}
                                    </Text>
                                    <View style={styles.scoreRight}>
                                        <Text style={styles.scoreTotal}>{player.score} pts</Text>
                                        {delta > 0 && (
                                            <Animated.View entering={ZoomIn.delay(300 + i * 80)}>
                                                <Text style={styles.scoreDelta}>+{delta}</Text>
                                            </Animated.View>
                                        )}
                                    </View>
                                </Animated.View>
                            );
                        })}
                    </Animated.View>
                )}

                {/* Host action */}
                {isHost && revealStep >= 2 && (
                    <Animated.View entering={FadeInUp.delay(400)}>
                        <TouchableOpacity
                            style={styles.nextBtn}
                            onPress={handleNext}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#7c3aed', '#5b21b6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.nextBtnGradient}
                            >
                                <Text style={styles.nextBtnText}>
                                    {isLastRound ? 'Ver Resultado Final' : 'Próxima Rodada'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {!isHost && revealStep >= 2 && (
                    <Animated.View entering={FadeInUp.delay(400)} style={styles.waitingHost}>
                        <Text style={styles.waitingHostText}>Aguardando o host...</Text>
                    </Animated.View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0a14',
    },
    ambientGlow: {
        position: 'absolute',
        top: 80,
        left: '50%',
        marginLeft: -120,
        width: 240,
        height: 240,
        borderRadius: 120,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 52,
        gap: 20,
    },

    outcomeBanner: {
        alignItems: 'center',
        borderRadius: 20,
        padding: 24,
        gap: 8,
        borderWidth: 1,
    },
    outcomeCaught: {
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderColor: 'rgba(16,185,129,0.3)',
    },
    outcomeEscaped: {
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderColor: 'rgba(239,68,68,0.3)',
    },
    outcomeTitle: {
        fontSize: 26,
        fontWeight: '900',
    },
    outcomeSubtitle: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 14,
        textAlign: 'center',
    },

    impostorReveal: {
        alignItems: 'center',
        gap: 10,
    },
    impostorRevealLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2.5,
    },
    impostorRevealCard: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 20,
        padding: 24,
        gap: 10,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
    },
    impostorName: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
    },
    wordRevealBadge: {
        alignItems: 'center',
        backgroundColor: 'rgba(167,139,250,0.1)',
        borderRadius: 14,
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 2,
    },
    wordRevealLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    wordRevealValue: {
        color: '#a78bfa',
        fontSize: 22,
        fontWeight: '900',
    },
    wordRevealCategory: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
    },

    voteSection: {
        gap: 10,
    },
    voteSectionTitle: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2,
    },
    voteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    voteBarWrap: {
        flex: 1,
        gap: 4,
    },
    voteBarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    voteBarName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    voteBarCount: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
    },
    voteBarTrack: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    voteBarFill: {
        height: '100%',
        borderRadius: 3,
    },

    scoresSection: {
        gap: 8,
    },
    scoresSectionTitle: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 4,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        padding: 12,
    },
    scorePlayerName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
    scoreRight: {
        alignItems: 'flex-end',
        gap: 2,
    },
    scoreTotal: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '700',
    },
    scoreDelta: {
        color: '#10b981',
        fontSize: 13,
        fontWeight: '800',
    },

    nextBtn: {
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
    },
    nextBtnGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    nextBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
    },
    waitingHost: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    waitingHostText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 14,
    },
});
