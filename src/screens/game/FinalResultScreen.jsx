import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, Share2, Trophy } from 'lucide-react-native';
import Header from '../../components/Header';
import AvatarCircle from '../../components/AvatarCircle';
import { useGame } from '../../hooks/useGame';

export default function FinalResultScreen({ route, navigation }) {
    const { roomId } = route.params;
    const { listenToRoom, leaveRoom } = useGame();
    const [roomData, setRoomData] = useState(null);

    useEffect(() => {
        const unsubscribe = listenToRoom(roomId, (data) => {
            setRoomData(data);
        });

        return () => {
            unsubscribe();
            leaveRoom();
        };
    }, [roomId]);

    if (!roomData) return null;

    // Sort players by score (ascending: lower score is better)
    const sortedPlayers = [...roomData.players].sort((a, b) => (a.score || 0) - (b.score || 0));

    const winner = sortedPlayers[0];
    const loser = sortedPlayers[sortedPlayers.length - 1];

    return (
        <View style={styles.container}>
            <Header title="Fim de Jogo" transparent />

            <LinearGradient
                colors={['#4c1d95', '#2e1065']}
                style={styles.background}
            />

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Winner Section */}
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
                    <Text style={styles.winnerText}>VENCEDOR</Text>
                    <Text style={styles.winnerName}>{winner.name}</Text>
                    <Text style={styles.winnerScore}>
                        Apenas {winner.score || 0} Lurdinhas
                    </Text>
                </View>

                {/* Loser Section */}
                <View style={styles.loserCard}>
                    <Text style={styles.loserTitle}>👑 O REI DA LURDINHA</Text>
                    <View style={styles.loserRow}>
                        <AvatarCircle name={loser.name} photoURL={loser.photoURL} size={60} />
                        <View style={{ marginLeft: 16 }}>
                            <Text style={styles.loserName}>{loser.name}</Text>
                            <Text style={styles.loserScore}>{loser.score || 0} Lurdinhas acumuladas</Text>
                        </View>
                        <Text style={{ fontSize: 40 }}>🤡</Text>
                    </View>
                </View>

                {/* Ranking List */}
                <View style={styles.rankingList}>
                    <Text style={styles.sectionLabel}>RANKING COMPLETO</Text>
                    {sortedPlayers.map((player, index) => (
                        <View key={player.uid} style={styles.rankingRow}>
                            <Text style={styles.rankNumber}>#{index + 1}</Text>
                            <AvatarCircle name={player.name} photoURL={player.photoURL} size={40} />
                            <Text style={styles.rankName}>{player.name}</Text>
                            <Text style={styles.rankScore}>{player.score || 0} 😈</Text>
                        </View>
                    ))}
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={() => navigation.navigate('GameHome')}
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
    loserName: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    loserScore: {
        color: 'rgba(255,255,255,0.6)',
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
