import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Trophy } from 'lucide-react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Header from '../../components/Header';
import AvatarCircle from '../../components/AvatarCircle';
import HostWaitingIndicator from '../../components/HostWaitingIndicator';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../hooks/useGame';
import { TIERS } from '../../hooks/game/tierList';
import { triggerImpact } from '../../utils/haptics';
import { playSound } from '../../utils/sounds';

export default function TierListResultScreen({ route }) {
    const { roomId } = route.params;
    const navigation = useNavigation();
    const { currentUser } = useAuth();
    const { listenToRoom, nextRound, removeFromRoom, leaveRoom } = useGame();

    const [roomData, setRoomData] = useState(null);
    const [loadingNext, setLoadingNext] = useState(false);
    const hasRoutedRef = useRef(false);

    useEffect(() => {
        const unsubscribe = listenToRoom(roomId, (data) => {
            if (!data) return;
            setRoomData(data);

            if (data.status === 'playing' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                navigation.replace('Game', { roomId });
            } else if (data.status === 'finished' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                navigation.replace('FinalResult', { roomId });
            }
        });
        return () => unsubscribe();
    }, [roomId]);

    useEffect(() => {
        if (roomData?.roundData?.results) {
            playSound('reveal');
            if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        }
    }, [!!roomData?.roundData?.results]);

    const handleNextRound = async () => {
        if (loadingNext || !roomData) return;
        setLoadingNext(true);
        triggerImpact('medium');
        playSound('ui_toggle');
        try {
            const currentRound = roomData.currentRound || 1;
            const totalRounds = roomData.settings?.totalRounds || 5;
            const isLastRound = currentRound >= totalRounds;
            await nextRound(roomId, isLastRound);
        } catch {
            setLoadingNext(false);
        }
    };

    const handleConfirmExit = async () => {
        await removeFromRoom(roomId);
        leaveRoom();
        navigation.navigate('GameHome');
    };

    if (!roomData) {
        return (
            <View style={styles.container}>
                <ActivityIndicator color="#fff" />
            </View>
        );
    }

    const results = roomData.roundData?.results || {};
    const tierGroups = results.tierGroups || {};
    const playerResults = results.playerResults || {};
    const currentRound = roomData.currentRound || 1;
    const totalRounds = roomData.settings?.totalRounds || 5;
    const isHost = roomData.hostId === currentUser?.uid;
    const isLastRound = currentRound >= totalRounds;
    const myResult = playerResults[currentUser?.uid];
    const myTierDef = myResult ? TIERS.find((t) => t.key === myResult.tier) : null;
    const myPoints = myResult?.pointsAwarded || 0;

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0f0f12', '#17131f', '#1e0f3a']} style={styles.background} />
            <View pointerEvents="none" style={styles.glowTop} />
            <View pointerEvents="none" style={styles.glowBottom} />

            <Header title="Veredito do grupo" transparent showExit showSoundToggle onConfirmExit={handleConfirmExit} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header block */}
                <Animated.View entering={ZoomIn.delay(80)} style={styles.heroBlock}>
                    <View style={styles.trophyShell}>
                        <Trophy size={36} color="#FDE68A" />
                    </View>
                    <Text style={styles.heroTitle}>Tier List da Galera</Text>
                    <Text style={styles.heroQuestion}>{roomData.roundData?.question}</Text>
                </Animated.View>

                {/* Personal result badge */}
                {myTierDef ? (
                    <Animated.View entering={FadeInDown.delay(200)} style={[styles.myResultCard, { backgroundColor: myTierDef.bg, borderColor: myTierDef.border }]}>
                        <View style={[styles.myTierBadge, { borderColor: myTierDef.border }]}>
                            <Text style={[styles.myTierLetter, { color: myTierDef.color }]}>{myTierDef.key}</Text>
                        </View>
                        <View style={styles.myResultText}>
                            <Text style={[styles.myTierDescription, { color: myTierDef.color }]}>
                                {myResult.voteCount > 0 ? myTierDef.description : 'Sem votos recebidos'}
                            </Text>
                            <Text style={styles.myPointsLine}>
                                {myPoints > 0 ? `+${myPoints} pts` : 'Sem pontos desta rodada'}
                            </Text>
                        </View>
                        <Text style={styles.myResultEmoji}>
                            {myTierDef.key === '5' ? '🏆' : myTierDef.key === '4' ? '🔥' : myTierDef.key === '3' ? '💪' : myTierDef.key === '2' ? '👍' : '💀'}
                        </Text>
                    </Animated.View>
                ) : null}

                {/* Tier rows */}
                <Animated.View entering={FadeInDown.delay(280)} style={styles.tierListBlock}>
                    <Text style={styles.sectionLabel}>RESULTADO COLETIVO</Text>
                    {TIERS.map((tier, tierIndex) => {
                        const tierPlayers = tierGroups[tier.key] || [];
                        return (
                            <Animated.View
                                key={tier.key}
                                entering={FadeInDown.delay(340 + tierIndex * 100).duration(350)}
                                style={[styles.tierRow, { borderColor: tier.border }]}
                            >
                                <View style={[styles.tierLabelBox, { backgroundColor: tier.bg, borderColor: tier.border }]}>
                                    <Text style={[styles.tierLabelText, { color: tier.color }]}>{tier.key}</Text>
                                    <Text style={[styles.tierLabelSub, { color: tier.color }]}>{tier.description}</Text>
                                </View>

                                <View style={styles.tierPlayers}>
                                    {tierPlayers.length === 0 ? (
                                        <Text style={styles.emptyTierText}>—</Text>
                                    ) : (
                                        tierPlayers.map((p) => (
                                            <Animated.View
                                                key={p.uid}
                                                entering={FadeIn.delay(400 + tierIndex * 100)}
                                                style={styles.tierPlayerItem}
                                            >
                                                <AvatarCircle name={p.name} photoURL={p.photoURL} size={38} />
                                                <Text style={styles.tierPlayerName} numberOfLines={1}>{p.name}</Text>
                                            </Animated.View>
                                        ))
                                    )}
                                </View>
                            </Animated.View>
                        );
                    })}
                </Animated.View>

                {/* Score summary */}
                <Animated.View entering={FadeInUp.delay(860)} style={styles.scoresBlock}>
                    <Text style={styles.sectionLabel}>PLACAR ATUAL</Text>
                    {[...roomData.players]
                        .sort((a, b) => (b.score || 0) - (a.score || 0))
                        .map((player, i) => (
                            <View key={player.uid} style={[styles.scoreRow, player.uid === currentUser?.uid && styles.scoreRowMe]}>
                                <Text style={styles.scorePos}>{i + 1}</Text>
                                <AvatarCircle name={player.name} photoURL={player.photoURL} size={34} />
                                <Text style={styles.scoreName} numberOfLines={1}>{player.name}</Text>
                                <Text style={styles.scoreValue}>{player.score || 0} pts</Text>
                            </View>
                        ))}
                </Animated.View>

                {/* CTA */}
                <Animated.View entering={FadeInUp.delay(940)} style={styles.footer}>
                    {isHost ? (
                        <Animated.View>
                            <TouchableOpacity
                                style={styles.ctaBtn}
                                onPress={handleNextRound}
                                disabled={loadingNext}
                                activeOpacity={0.84}
                            >
                                <LinearGradient
                                    colors={['#A78BFA', '#7C3AED']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.ctaGradient}
                                >
                                    <Text style={styles.ctaText}>
                                        {loadingNext ? 'Aguarde...' : isLastRound ? 'Ver resultado final' : 'Próxima rodada'}
                                    </Text>
                                    <ArrowRight size={20} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        <HostWaitingIndicator message={isLastRound ? 'Aguardando o host encerrar a partida...' : 'Aguardando o host avançar...'} />
                    )}
                </Animated.View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f12' },
    background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    glowTop: {
        position: 'absolute', top: 80, right: -80,
        width: 240, height: 240, borderRadius: 999,
        backgroundColor: 'rgba(139,92,246,0.14)',
    },
    glowBottom: {
        position: 'absolute', left: -80, bottom: 80,
        width: 240, height: 240, borderRadius: 999,
        backgroundColor: 'rgba(168,85,247,0.09)',
    },
    scroll: { flex: 1 },
    scrollContent: { padding: 24, paddingBottom: 60 },

    heroBlock: {
        alignItems: 'center', marginBottom: 18,
        borderRadius: 28, padding: 24,
        backgroundColor: 'rgba(18,18,24,0.94)',
        borderWidth: 1, borderColor: 'rgba(167,139,250,0.18)',
    },
    trophyShell: {
        width: 64, height: 64, borderRadius: 22,
        backgroundColor: 'rgba(253,230,138,0.12)',
        borderWidth: 1, borderColor: 'rgba(253,230,138,0.28)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
    },
    heroTitle: {
        color: '#A78BFA', fontSize: 12, fontWeight: '900',
        letterSpacing: 1.8, marginBottom: 10,
    },
    heroQuestion: {
        color: '#fff', fontSize: 20, fontWeight: '900',
        textAlign: 'center', lineHeight: 27,
    },

    myResultCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        borderRadius: 22, padding: 16, borderWidth: 1, marginBottom: 20,
    },
    myTierBadge: {
        width: 54, height: 54, borderRadius: 16, borderWidth: 1.5,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    myTierLetter: { fontSize: 28, fontWeight: '900' },
    myResultText: { flex: 1 },
    myTierDescription: { fontSize: 16, fontWeight: '900' },
    myPointsLine: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2, fontWeight: '600' },
    myResultEmoji: { fontSize: 28 },

    sectionLabel: {
        color: '#A78BFA', fontSize: 11, fontWeight: '900',
        letterSpacing: 1.8, marginBottom: 12,
    },

    tierListBlock: { marginBottom: 20 },
    tierRow: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 18, borderWidth: 1, marginBottom: 8,
        backgroundColor: 'rgba(18,18,24,0.88)',
        overflow: 'hidden', minHeight: 60,
    },
    tierLabelBox: {
        width: 64, alignSelf: 'stretch',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 0, borderRightWidth: 1,
        paddingVertical: 10,
    },
    tierLabelText: { fontSize: 22, fontWeight: '900' },
    tierLabelSub: { fontSize: 8, fontWeight: '700', opacity: 0.85, textAlign: 'center' },
    tierPlayers: {
        flex: 1, flexDirection: 'row', flexWrap: 'wrap',
        gap: 10, padding: 12, alignItems: 'center',
    },
    tierPlayerItem: { alignItems: 'center', gap: 4, maxWidth: 60 },
    tierPlayerName: {
        color: '#fff', fontSize: 10, fontWeight: '700',
        textAlign: 'center', maxWidth: 60,
    },
    emptyTierText: { color: 'rgba(255,255,255,0.22)', fontSize: 18, paddingLeft: 4 },

    scoresBlock: { marginBottom: 20 },
    scoreRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderRadius: 16, padding: 12,
        backgroundColor: 'rgba(24,24,31,0.9)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        marginBottom: 8,
    },
    scoreRowMe: { borderColor: 'rgba(167,139,250,0.42)', backgroundColor: 'rgba(139,92,246,0.10)' },
    scorePos: { color: 'rgba(255,255,255,0.38)', fontSize: 13, fontWeight: '800', width: 20, textAlign: 'center' },
    scoreName: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '700' },
    scoreValue: { color: '#A78BFA', fontSize: 15, fontWeight: '900' },

    footer: { marginTop: 4 },
    ctaBtn: { borderRadius: 24, overflow: 'hidden' },
    ctaGradient: {
        paddingVertical: 19, paddingHorizontal: 22,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    ctaText: { color: '#fff', fontSize: 17, fontWeight: '900' },
});
