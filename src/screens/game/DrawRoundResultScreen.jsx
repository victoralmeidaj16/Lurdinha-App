import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Paintbrush, Sparkles } from 'lucide-react-native';
import Header from '../../components/Header';
import AvatarCircle from '../../components/AvatarCircle';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme';

export default function DrawRoundResultScreen({ route, navigation }) {
    const { roomId } = route.params;
    const { currentUser } = useAuth();
    const { listenToRoom, nextRound } = useGame();
    const [roomData, setRoomData] = useState(null);
    const [loadingNext, setLoadingNext] = useState(false);
    const hasRoutedRef = useRef(false);

    useEffect(() => {
        const unsubscribe = listenToRoom(roomId, (data, meta) => {
            setRoomData(data);
            if (meta?.fromCache) return;
            if (data.status === 'playing' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                navigation.replace('DrawGame', { roomId });
            } else if (data.status === 'finished' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                navigation.replace('FinalResult', { roomId });
            } else if (data.status === 'party_transition' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                navigation.replace('RoundTransition', { roomId });
            }
        });

        return () => unsubscribe();
    }, [navigation, roomId]);

    const playersById = useMemo(() => (
        Object.fromEntries((roomData?.players || []).map((player) => [player.uid, player]))
    ), [roomData?.players]);

    if (!roomData?.roundData?.results) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" />
            </View>
        );
    }

    const { results } = roomData.roundData;
    const guessedPlayers = results.guessedPlayers || [];
    const missedPlayerIds = results.missedPlayerIds || [];
    const drawerPenalty = results.drawerPenalty === true;
    const streakPlayers = results.streakPlayers || [];
    const isDifficultMode = results.difficulty === 'hard';
    const drawer = playersById[results.drawerId];
    const isHost = roomData.hostId === currentUser?.uid;

    const speedBadge = (speedBonus) => {
        if (speedBonus >= 4) return { label: '⚡ Relâmpago', color: '#FCD34D' };
        if (speedBonus >= 2) return { label: '🚀 Rápido', color: '#6EE7B7' };
        return null;
    };

    const handleNextRound = async () => {
        setLoadingNext(true);
        try {
            await nextRound(roomId, roomData.currentRound >= roomData.settings.totalRounds);
        } finally {
            setLoadingNext(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0F172A', '#1E1B4B']} style={styles.background} />
            <Header title="Resultado da Rodada" transparent />

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <View style={styles.heroCard}>
                    <View style={styles.heroIcon}>
                        <Paintbrush size={30} color="#C4B5FD" />
                    </View>
                    <Text style={styles.heroLabel}>PALAVRA CORRETA</Text>
                    <Text style={styles.heroWord}>{results.word}</Text>
                    <Text style={styles.heroSub}>
                        {drawer?.name || 'Desenhista'} foi o desenhista desta rodada.
                    </Text>
                    {isDifficultMode && (
                        <View style={styles.difficultyBadge}>
                            <Text style={styles.difficultyBadgeText}>🔥 Difícil — pontos ×1.5</Text>
                        </View>
                    )}
                </View>

                {drawerPenalty && (
                    <View style={styles.penaltyCard}>
                        <Text style={styles.penaltyIcon}>😬</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.penaltyTitle}>Ninguém acertou!</Text>
                            <Text style={styles.penaltySub}>
                                {drawer?.name || 'Desenhista'} perdeu 3 pontos por não ser entendido.
                            </Text>
                        </View>
                        <Text style={styles.penaltyPoints}>-3 pts</Text>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quem acertou</Text>
                    {guessedPlayers.length > 0 ? guessedPlayers.map((entry, index) => {
                        const player = playersById[entry.uid];
                        const badge = speedBadge(entry.speedBonus);
                        const hasStreak = streakPlayers.includes(entry.uid);
                        return (
                            <View key={entry.uid} style={styles.playerRow}>
                                <View style={styles.playerInfo}>
                                    <Text style={styles.placeBadge}>#{index + 1}</Text>
                                    <AvatarCircle
                                        name={player?.name || 'Jogador'}
                                        photoURL={player?.photoURL}
                                        size={42}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.playerName}>{player?.name || 'Jogador'}</Text>
                                        {badge && (
                                            <Text style={[styles.speedBadge, { color: badge.color }]}>
                                                {badge.label} +{entry.speedBonus}
                                            </Text>
                                        )}
                                        {hasStreak && (
                                            <Text style={styles.streakBadge}>🕵️ Detetive! +5 pts</Text>
                                        )}
                                    </View>
                                </View>
                                <Text style={styles.pointsText}>+{entry.points} pts</Text>
                            </View>
                        );
                    }) : (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>Ninguém acertou a palavra nesta rodada.</Text>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ainda não acertaram</Text>
                    {missedPlayerIds.length > 0 ? missedPlayerIds.map((uid) => {
                        const player = playersById[uid];
                        return (
                            <View key={uid} style={styles.playerRowMuted}>
                                <AvatarCircle
                                    name={player?.name || 'Jogador'}
                                    photoURL={player?.photoURL}
                                    size={40}
                                />
                                <Text style={styles.playerNameMuted}>{player?.name || 'Jogador'}</Text>
                            </View>
                        );
                    }) : (
                        <View style={styles.emptyCard}>
                            <Sparkles size={18} color="#86EFAC" />
                            <Text style={styles.emptyText}>Todos acertaram. Rodada perfeita.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                {isHost ? (
                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={handleNextRound}
                        disabled={loadingNext}
                        activeOpacity={0.85}
                    >
                        <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.nextButtonGradient}>
                            {loadingNext ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <>
                                    <Text style={styles.nextButtonText}>
                                        {roomData.partySession 
                                            ? 'Continuar Sessão' 
                                            : (roomData.currentRound >= roomData.settings.totalRounds ? 'Ver placar final' : 'Próxima rodada')}
                                    </Text>
                                    <ArrowRight size={18} color="#FFFFFF" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <Text style={styles.waitingText}>Aguardando o host iniciar a próxima rodada...</Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
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
        paddingHorizontal: 16,
    },
    contentContainer: {
        paddingBottom: 140,
        gap: 18,
    },
    heroCard: {
        marginTop: 8,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 22,
        alignItems: 'center',
        gap: 8,
    },
    heroIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(139, 92, 246, 0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroLabel: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    heroWord: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '900',
    },
    heroSub: {
        color: '#CBD5E1',
        fontSize: 14,
        textAlign: 'center',
    },
    section: {
        gap: 10,
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 18,
        padding: 14,
    },
    playerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    placeBadge: {
        color: '#C4B5FD',
        fontSize: 13,
        fontWeight: '800',
        width: 24,
    },
    playerName: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    pointsText: {
        color: '#86EFAC',
        fontSize: 15,
        fontWeight: '800',
    },
    playerRowMuted: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 18,
        padding: 14,
    },
    playerNameMuted: {
        color: '#CBD5E1',
        fontSize: 15,
        fontWeight: '600',
    },
    emptyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 18,
        padding: 14,
    },
    emptyText: {
        color: '#CBD5E1',
        fontSize: 14,
    },
    footer: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 28,
    },
    nextButton: {
        borderRadius: 18,
        overflow: 'hidden',
    },
    nextButtonGradient: {
        paddingVertical: 18,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    waitingText: {
        color: '#CBD5E1',
        textAlign: 'center',
        fontSize: 15,
    },
    penaltyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        padding: 16,
    },
    penaltyIcon: {
        fontSize: 28,
    },
    penaltyTitle: {
        color: '#FCA5A5',
        fontSize: 15,
        fontWeight: '800',
    },
    penaltySub: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 13,
        marginTop: 2,
    },
    penaltyPoints: {
        color: '#F87171',
        fontSize: 16,
        fontWeight: '900',
    },
    speedBadge: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
    },
    streakBadge: {
        fontSize: 12,
        fontWeight: '700',
        color: '#C4B5FD',
        marginTop: 2,
    },
    difficultyBadge: {
        marginTop: 4,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    difficultyBadgeText: {
        color: '#FCA5A5',
        fontSize: 13,
        fontWeight: '700',
    },
});
