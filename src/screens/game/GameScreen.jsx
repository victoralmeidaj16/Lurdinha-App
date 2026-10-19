import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import LiveConnectionModal from '../../components/LiveConnectionModal';
import { useGame } from '../../hooks/useGame';
import TelephoneGameScreen from './TelephoneGameScreen';
import MostLikelyGameScreen from './MostLikelyGameScreen';
import ObviousMindGameScreen from './ObviousMindGameScreen';
import TierListGameScreen from './TierListGameScreen';
import ImpostorOnlineGameScreen from './ImpostorOnlineGameScreen';
import { DEFAULT_GAME_TYPE } from '../../utils/socialGames';

export default function GameScreen({ route, navigation }) {
    const { roomId, mockRoomData, isSandbox = false } = route.params;
    const { listenToRoom } = useGame();

    const [roomData, setRoomData] = useState(mockRoomData || null);
    const [connectionState, setConnectionState] = useState('loading');
    const [connectionMessage, setConnectionMessage] = useState('');
    const hasRoutedRef = useRef(false);

    useEffect(() => {
        if (isSandbox && mockRoomData) {
            setConnectionState('online');
            setRoomData(mockRoomData);
            return undefined;
        }

        const unsubscribe = listenToRoom(roomId, (data, meta) => {
            if (meta?.error) {
                setConnectionState('error');
                setConnectionMessage(meta.message || 'Erro de conexao com a sala.');
                return;
            }

            if (!data) return;

            setConnectionState('online');
            setConnectionMessage('');
            setRoomData(data);
            if (meta?.fromCache) return;

            // Handle navigation based on status
            if (data.status === 'round_results' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                const gameType = data.settings?.gameType;
                if (gameType === 'telephone' || gameType === 'secret') {
                    navigation.replace('TelephoneResult', { roomId, gameState: data });
                } else if (gameType === 'tier_list') {
                    navigation.replace('TierListResult', { roomId });
                } else if (gameType === 'impostor') {
                    navigation.replace('ImpostorRoundResult', { roomId });
                } else {
                    navigation.replace('RoundResult', { roomId });
                }
            } else if (data.status === 'finished' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                navigation.replace('FinalResult', { roomId });
            }
        });

        return () => unsubscribe();
    }, [isSandbox, listenToRoom, mockRoomData, navigation, roomId]);

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

    const gameType = roomData.settings?.gameType || DEFAULT_GAME_TYPE;

    if (gameType === 'telephone' || gameType === 'secret') {
        return <TelephoneGameScreen roomId={roomId} gameState={roomData} isSandbox={isSandbox} />;
    }

    if (gameType === 'most_likely') {
        return <MostLikelyGameScreen roomId={roomId} gameState={roomData} isSandbox={isSandbox} />;
    }

    if (gameType === 'obvious_mind') {
        return <ObviousMindGameScreen roomId={roomId} gameState={roomData} isSandbox={isSandbox} />;
    }

    if (gameType === 'tier_list') {
        return <TierListGameScreen roomId={roomId} gameState={roomData} isSandbox={isSandbox} />;
    }

    if (gameType === 'impostor') {
        return <ImpostorOnlineGameScreen roomId={roomId} gameState={roomData} isSandbox={isSandbox} />;
    }

    // Modo não suportado (ex.: sala antiga de um jogo removido).
    return (
        <View style={styles.container}>
            <Text style={styles.unsupportedText}>Este modo de jogo não está mais disponível.</Text>
            <TouchableOpacity style={styles.unsupportedButton} onPress={() => navigation.replace('GameHome')}>
                <Text style={styles.unsupportedButtonText}>Voltar</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#110f17',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    unsupportedText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
    },
    unsupportedButton: {
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    unsupportedButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
});
