import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Header from '../../components/Header';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme';
import AvatarCircle from '../../components/AvatarCircle';
import HostWaitingIndicator from '../../components/HostWaitingIndicator';
import GameStartCountdownOverlay, {
    GAME_START_NAV_DELAY_MS,
    GAME_START_STEP_MS,
} from '../../components/GameStartCountdownOverlay';

// Mapeamento dinâmico para os nomes na UI
const GAME_NAMES = {
    lurdinha: 'Lurdinha (Respostas rápidas)',
    draw: 'Desenho & Adivinhação',
    most_likely: 'Quem é mais provável?',
    obvious_mind: 'Na Minha Cabeça Era Óbvio',
    telephone: 'Telefone Sem Fio',
    secret: 'Telefone Sem Fio',
    impostor: 'O Impostor'
};

export default function RoundTransitionScreen({ route, navigation }) {
    const { roomId } = route.params;
    const { listenToRoom, continuePartySession, leaveRoom } = useGame();
    const { currentUser } = useAuth();

    const [roomData, setRoomData] = useState(null);
    const [countdown, setCountdown] = useState(null);
    const countdownRef = useRef(null);
    const hasRoutedRef = useRef(false);

    const startCountdown = useCallback((gameType) => {
        if (countdownRef.current !== null) return;

        [3, 2, 1, 'mascot'].forEach((step, index) => {
            setTimeout(() => {
                countdownRef.current = step;
                setCountdown(step);
                if (Platform.OS === 'ios') {
                    Haptics.impactAsync(
                        step === 'mascot' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light
                    );
                }
            }, index * GAME_START_STEP_MS);
        });

        setTimeout(() => {
            navigation.replace(gameType === 'draw' ? 'DrawGame' : 'Game', { roomId });
        }, GAME_START_NAV_DELAY_MS);
    }, [navigation, roomId]);

    useEffect(() => {
        const unsubscribe = listenToRoom(roomId, (data, meta) => {
            if (!data) return;
            setRoomData(data);
            if (meta?.fromCache) return;

            // Quando host manda continuar, o status muda pra 'playing'
            if (data.status === 'playing' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                startCountdown(data.settings?.gameType);
            }
            if (data.status === 'finished' && !hasRoutedRef.current) {
                 hasRoutedRef.current = true;
                 navigation.replace('FinalResult', { roomId });
            }
        });

        return () => {
            leaveRoom();
        };
    }, [roomId, startCountdown]);

    if (!roomData || !roomData.partySession) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={['#4c1d95', '#2e1065']} style={styles.background} />
                <Header title="Próxima Rodada" transparent showBack={false} />
            </View>
        );
    }

    const session = roomData.partySession;
    const isHost = roomData.hostId === currentUser?.uid;
    const currentGameType = session.gamesSequence[session.currentGameIndex];
    const uiGameName = GAME_NAMES[currentGameType] || 'Próximo Jogo';

    // Obter jogadores formatados e ranqueados por globalScore
    const rankedPlayers = [...roomData.players]
        .map(p => ({
            ...p,
            totalScore: session.globalScores[p.uid] || 0
        }))
        .sort((a, b) => b.totalScore - a.totalScore);

    const handleStartNext = async () => {
        if (!isHost) return;
        try {
            await continuePartySession(roomId);
        } catch(err) {
            console.error('Error continuing session:', err);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#4c1d95', '#2e1065']} style={styles.background} />
            <GameStartCountdownOverlay phase={countdown} />
            <Header title="Rodada Party" transparent onBack={() => {}} />

            <View style={styles.content}>
                <Animated.View entering={FadeInDown.delay(200)} style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>RODADA {session.currentGameIndex + 1} DE {session.gamesSequence.length}</Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300)}>
                     <Text style={styles.titleText}>PREPAREM-SE</Text>
                     <Text style={styles.subText}>O próximo jogo é:</Text>
                     <Text style={styles.gameNameText}>{uiGameName}</Text>
                </Animated.View>

                <Animated.View entering={FadeIn.delay(500)} style={styles.rankingContainer}>
                     <Text style={styles.rankingTitle}>🏆 Ranking Global da Sessão</Text>
                     {rankedPlayers.slice(0, 3).map((player, index) => (
                         <View key={player.uid} style={styles.rankingRow}>
                             <Text style={styles.rankNumber}>{index + 1}º</Text>
                             <AvatarCircle name={player.name} photoURL={player.photoURL} size={40} />
                             <Text style={styles.rankName} numberOfLines={1}>{player.name}</Text>
                             <Text style={styles.rankScore}>{player.totalScore} pts</Text>
                         </View>
                     ))}
                </Animated.View>
            </View>

            <View style={styles.footer}>
                 {isHost ? (
                     <Animated.View entering={FadeInUp.delay(800)}>
                         <TouchableOpacity
                             style={styles.startButton}
                             onPress={handleStartNext}
                             activeOpacity={0.8}
                         >
                             <LinearGradient
                                 colors={['#8b5cf6', '#7c3aed']}
                                 start={{ x: 0, y: 0 }}
                                 end={{ x: 1, y: 0 }}
                                 style={styles.gradientButton}
                             >
                                 <Text style={styles.startButtonText}>Começar Rodada</Text>
                                 <Play size={24} color="#fff" fill="#fff" />
                             </LinearGradient>
                         </TouchableOpacity>
                     </Animated.View>
                 ) : (
                     <Animated.View entering={FadeInUp.delay(800)}>
                         <HostWaitingIndicator hostName={roomData?.players?.find(p => p.uid === roomData?.hostId)?.name} />
                     </Animated.View>
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
        top: 0, left: 0, right: 0, bottom: 0,
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        paddingTop: 40,
    },
    badgeContainer: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginBottom: 32,
    },
    badgeText: {
        color: '#a78bfa',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    titleText: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    subText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: 4,
    },
    gameNameText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fcd34d',
        textAlign: 'center',
        marginBottom: 48,
    },
    rankingContainer: {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 24,
        padding: 20,
    },
    rankingTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    rankingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    rankNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#a78bfa',
        width: 30,
    },
    rankName: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    rankScore: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
    },
    startButton: {
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
    startButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    waitingText: {
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        fontSize: 16,
        fontStyle: 'italic',
    }
});
