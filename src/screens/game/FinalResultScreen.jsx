import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, RefreshCw, Share2, Trophy } from 'lucide-react-native';
import Header from '../../components/Header';
import AvatarCircle from '../../components/AvatarCircle';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../contexts/AuthContext';
import {
    formatFinalResultShareMessage,
    sortPlayersForResults,
} from '../../utils/gameShare';

export default function FinalResultScreen({ route, navigation }) {
    const { roomId } = route.params;
    const { currentUser } = useAuth();
    const {
        listenToRoom,
        leaveRoom,
        restartRoom,
        loading,
    } = useGame();
    const [roomData, setRoomData] = useState(null);
    const hasRoutedRef = useRef(false);

    useEffect(() => {
        const unsubscribe = listenToRoom(roomId, (data) => {
            setRoomData(data);

            if (data.status === 'waiting' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                navigation.replace('Lobby', { roomId });
            }
        });

        return () => {
            unsubscribe();
            leaveRoom();
        };
    }, [roomId]);

    if (!roomData) return null;

    const isDrawGame = roomData.settings?.gameType === 'draw';
    const sortedPlayers = sortPlayersForResults(roomData.players, roomData.settings?.gameType);
    const winner = sortedPlayers[0];
    const loser = sortedPlayers[sortedPlayers.length - 1];
    const isHost = roomData.hostId === currentUser?.uid;

    const handleShareResults = async () => {
        try {
            await Share.share({
                message: formatFinalResultShareMessage({
                    roomId,
                    roomData,
                }),
            });
        } catch (error) {
            console.error('Erro ao compartilhar resultado:', error);
        }
    };

    const handleRestartRoom = async () => {
        if (!isHost || loading) return;

        try {
            await restartRoom(roomId);
        } catch (error) {
            Alert.alert('Erro', error?.message || 'Não foi possível abrir a revanche.');
        }
    };

    return (
        <View style={styles.container}>
            <Header title="Fim de Jogo" transparent />

            <LinearGradient
                colors={['#4c1d95', '#2e1065']}
                style={styles.background}
            />

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <View style={styles.winnerSection}>
                    <View style={styles.crownContainer}>
                        <Trophy size={40} color="#fbbf24" />
                    </View>
                    <AvatarCircle
                        name={winner.name}
                        photoURL={winner.photoURL}
                        size={120}
                        style={styles.winnerAvatar}
                    />
                    <Text style={styles.winnerText}>{isDrawGame ? 'MESTRE DO RABISCO' : 'VENCEDOR'}</Text>
                    <Text style={styles.winnerName}>{winner.name}</Text>
                    <Text style={styles.winnerScore}>
                        {isDrawGame ? `${winner.score || 0} pontos` : `Apenas ${winner.score || 0} Lurdinhas`}
                    </Text>
                </View>

                <View style={styles.loserCard}>
                    <Text style={styles.loserTitle}>
                        {isDrawGame ? '🫠 QUEM MAIS SOFREU' : '👑 O REI DA LURDINHA'}
                    </Text>
                    <View style={styles.loserRow}>
                        <AvatarCircle name={loser.name} photoURL={loser.photoURL} size={60} />
                        <View style={styles.loserMeta}>
                            <Text style={styles.loserName}>{loser.name}</Text>
                            <Text style={styles.loserScore}>
                                {isDrawGame ? `${loser.score || 0} pontos no total` : `${loser.score || 0} Lurdinhas acumuladas`}
                            </Text>
                        </View>
                        <Text style={styles.loserEmoji}>{isDrawGame ? '🎨' : '🤡'}</Text>
                    </View>
                </View>

                <View style={styles.rankingList}>
                    <Text style={styles.sectionLabel}>RANKING COMPLETO</Text>
                    {sortedPlayers.map((player, index) => (
                        <View key={player.uid} style={styles.rankingRow}>
                            <Text style={styles.rankNumber}>#{index + 1}</Text>
                            <AvatarCircle name={player.name} photoURL={player.photoURL} size={40} />
                            <Text style={styles.rankName}>{player.name}</Text>
                            <Text style={styles.rankScore}>{player.score || 0} {isDrawGame ? 'pts' : '😈'}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.secondaryButton, styles.shareButton]}
                        onPress={handleShareResults}
                        activeOpacity={0.85}
                    >
                        <Share2 size={18} color="#fff" />
                        <Text style={styles.secondaryButtonText}>Compartilhar</Text>
                    </TouchableOpacity>

                    {isHost ? (
                        <TouchableOpacity
                            style={[styles.secondaryButton, styles.rematchButton, loading && styles.secondaryButtonDisabled]}
                            onPress={handleRestartRoom}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <RefreshCw size={18} color="#fff" />
                                    <Text style={styles.secondaryButtonText}>Jogar de novo</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.secondaryButton, styles.rematchWaitingCard]}>
                            <Text style={styles.rematchWaitingText}>Aguardando o host abrir a revanche</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={() => navigation.navigate('MainTabs', { screen: 'home' })}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={['#8b5cf6', '#7c3aed']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Home size={20} color="#fff" />
                        <Text style={styles.homeButtonText}>Voltar ao Início</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
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
    contentContainer: {
        paddingBottom: 220,
    },
    winnerSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    crownContainer: {
        marginBottom: -20,
        zIndex: 1,
    },
    winnerAvatar: {
        borderWidth: 4,
        borderColor: '#fbbf24',
        marginBottom: 16,
    },
    winnerText: {
        color: '#fbbf24',
        fontWeight: '800',
        letterSpacing: 2,
        fontSize: 14,
        marginBottom: 4,
    },
    winnerName: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 4,
        textAlign: 'center',
    },
    winnerScore: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
    },
    loserCard: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 24,
        padding: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    loserTitle: {
        color: '#ef4444',
        fontWeight: '800',
        fontSize: 12,
        letterSpacing: 1,
        marginBottom: 16,
    },
    loserRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loserMeta: {
        marginLeft: 16,
        flex: 1,
    },
    loserName: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    loserScore: {
        color: 'rgba(255,255,255,0.6)',
    },
    loserEmoji: {
        fontSize: 40,
    },
    sectionLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 12,
        letterSpacing: 1,
    },
    rankingList: {
        gap: 12,
    },
    rankingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 16,
    },
    rankNumber: {
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '700',
        fontSize: 16,
        width: 40,
    },
    rankName: {
        color: '#fff',
        flex: 1,
        marginLeft: 12,
        fontWeight: '600',
    },
    rankScore: {
        color: '#ef4444',
        fontWeight: '700',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 40,
        gap: 12,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    secondaryButton: {
        flex: 1,
        minHeight: 58,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.08)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
    },
    shareButton: {
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    rematchButton: {
        backgroundColor: 'rgba(139, 92, 246, 0.28)',
        borderColor: 'rgba(167, 139, 250, 0.36)',
    },
    secondaryButtonDisabled: {
        opacity: 0.65,
    },
    secondaryButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    rematchWaitingCard: {
        backgroundColor: 'rgba(15, 23, 42, 0.38)',
        borderColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 12,
    },
    rematchWaitingText: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 16,
    },
    homeButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    gradientButton: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    homeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
