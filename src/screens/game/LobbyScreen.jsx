import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Share, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Play, Copy, Share2 } from 'lucide-react-native';
import Header from '../../components/Header';
import AvatarCircle from '../../components/AvatarCircle';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../contexts/AuthContext';
import * as Clipboard from 'expo-clipboard';

export default function LobbyScreen({ route, navigation }) {
    const { roomId } = route.params;
    const { listenToRoom, startGame, leaveRoom } = useGame();
    const { currentUser } = useAuth();
    const [roomData, setRoomData] = useState(null);

    useEffect(() => {
        const unsubscribe = listenToRoom(roomId, (data) => {
            setRoomData(data);
            if (data.status === 'playing') {
                navigation.replace('Game', { roomId });
            }
        });

        return () => {
            unsubscribe();
            leaveRoom();
        };
    }, [roomId]);

    const handleStartGame = async () => {
        if (!roomData) return;

        // Check if enough players (min 2 for a real game, but 1 for testing is fine)
        if (roomData.players.length < 1) {
            Alert.alert('Aguarde', 'É necessário pelo menos 1 jogador para iniciar (idealmente 3+).');
            return;
        }

        try {
            // Start with pre-generated questions using room settings
            await startGame(roomId, roomData.settings.totalRounds, roomData.settings.theme);
        } catch (err) {
            Alert.alert('Erro', 'Não foi possível iniciar a partida.');
        }
    };

    const handleCopyCode = async () => {
        await Clipboard.setStringAsync(roomId);
        Alert.alert('Sucesso', 'Código copiado para a área de transferência!');
    };

    const handleShareCode = async () => {
        try {
            await Share.share({
                message: `Entre na minha sala do Lurdinha! Código: ${roomId}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const isHost = roomData?.hostId === currentUser?.uid;

    if (!roomData) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={['#4c1d95', '#2e1065']} style={styles.background} />
                <Header title="Carregando..." transparent showBack />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Entrando na sala...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#4c1d95', '#2e1065']}
                style={styles.background}
            />

            <Header title="Lobby" transparent onBack={() => navigation.goBack()} />

            <View style={styles.content}>
                <View style={styles.codeSection}>
                    <Text style={styles.codeLabel}>CÓDIGO DA SALA</Text>

                    <View style={styles.codeRow}>
                        <View style={styles.codeDisplay}>
                            <Text style={styles.codeText}>{roomId}</Text>
                        </View>
                    </View>

                    <View style={styles.actionButtonsRow}>
                        <TouchableOpacity style={styles.actionButton} onPress={handleCopyCode}>
                            <Copy size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Copiar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={handleShareCode}>
                            <Share2 size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Enviar</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.settingsText}>
                        {roomData.settings.totalRounds} rodadas • {roomData.settings.timePerRound}s/rodada
                    </Text>
                </View>

                <View style={styles.playersSection}>
                    <View style={styles.playersHeader}>
                        <Users size={20} color="#a78bfa" />
                        <Text style={styles.playersTitle}>
                            Jogadores ({roomData.players.length})
                        </Text>
                    </View>

                    <FlatList
                        data={roomData.players}
                        keyExtractor={item => item.uid}
                        numColumns={3}
                        columnWrapperStyle={styles.playersGrid}
                        renderItem={({ item }) => (
                            <View style={styles.playerItem}>
                                <AvatarCircle
                                    name={item.name}
                                    photoURL={item.photoURL}
                                    size={64}
                                    style={styles.playerAvatar}
                                />
                                <Text style={styles.playerName} numberOfLines={1}>
                                    {item.name}
                                    {item.uid === roomData.hostId && ' 👑'}
                                </Text>
                            </View>
                        )}
                    />
                </View>

                {isHost ? (
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={handleStartGame}
                        >
                            <LinearGradient
                                colors={['#8b5cf6', '#7c3aed']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientButton}
                            >
                                <Text style={styles.startButtonText}>Iniciar Partida</Text>
                                <Play size={24} color="#fff" fill="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.footer}>
                        <Text style={styles.waitingText}>Aguardando o host iniciar...</Text>
                    </View>
                )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 20,
    },
    codeSection: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 10,
    },
    codeRow: {
        marginBottom: 16,
    },
    codeDisplay: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    codeText: {
        fontSize: 36,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 6,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        gap: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    settingsText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
    },
    playersSection: {
        flex: 1,
    },
    playersHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 8,
    },
    playersTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    playersGrid: {
        gap: 16,
        justifyContent: 'flex-start',
    },
    playerItem: {
        alignItems: 'center',
        width: '30%',
        marginBottom: 24,
    },
    playerAvatar: {
        marginBottom: 8,
        borderWidth: 2,
        borderColor: '#a78bfa',
    },
    playerName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    footer: {
        paddingVertical: 20,
    },
    startButton: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#8b5cf6',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    gradientButton: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    waitingText: {
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        fontSize: 16,
        fontStyle: 'italic',
    },
});
