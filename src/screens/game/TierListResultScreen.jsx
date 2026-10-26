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
import { ArrowRight } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    FadeIn,
    FadeInDown,
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
    const { listenToRoom, nextRound, showRoundScoreboard, removeFromRoom, leaveRoom } = useGame();

    const [roomData, setRoomData] = useState(null);
    const [loadingNext, setLoadingNext] = useState(false);
    const [loadingScoreboard, setLoadingScoreboard] = useState(false);
    const [footerHeight, setFooterHeight] = useState(120);
    const insets = useSafeAreaInsets();
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

    const handleShowScoreboard = async () => {
        if (loadingScoreboard) return;
        setLoadingScoreboard(true);
        triggerImpact('medium');
        playSound('ui_toggle');
        try {
            await showRoundScoreboard(roomId);
        } finally {
            setLoadingScoreboard(false);
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
    // Etapas: veredito → placar (sincronizado pelo host) → próxima rodada.
    // Na última rodada o placar completo já aparece no resultado final.
    const showingScoreboard = !!roomData.roundData?.showScoreboard && !isLastRound;
    const rankedPlayers = [...roomData.players].sort((a, b) => (b.score || 0) - (a.score || 0));

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0f0f12', '#17131f', '#1e0f3a']} style={styles.background} />
            <View pointerEvents="none" style={styles.glowTop} />
            <View pointerEvents="none" style={styles.glowBottom} />

            <Header title={showingScoreboard ? 'Placar atual' : 'Veredito do grupo'} transparent showExit showSoundToggle onConfirmExit={handleConfirmExit} />

            <ScrollView
                key={showingScoreboard ? 'scoreboard' : 'verdict'}
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: footerHeight + 24 }]}
                showsVerticalScrollIndicator={false}
            >
                {showingScoreboard ? (
                    <>
                        <Animated.View entering={FadeInDown.delay(40).duration(320)} style={styles.heroBlock}>
                            <Text style={styles.heroKicker}>
                                PLACAR · RODADA {currentRound}/{totalRounds}
                            </Text>
                            <Text style={styles.heroQuestion}>Como está a disputa</Text>
                        </Animated.View>

                        <View style={styles.groupedList}>
                            {rankedPlayers.map((player, i) => {
                                const isMe = player.uid === currentUser?.uid;
                                const roundPoints = playerResults[player.uid]?.pointsAwarded || 0;
                                return (
                                    <Animated.View
                                        key={player.uid}
                                        entering={FadeInDown.delay(120 + i * 70).duration(300)}
                                        style={[
                                            styles.scoreRow,
                                            i < rankedPlayers.length - 1 && styles.rowSeparator,
                                            isMe && styles.scoreRowMe,
                                        ]}
                                    >
                                        <Text style={[styles.scorePos, i === 0 && styles.scorePosLeader]}>{i + 1}</Text>
                                        <AvatarCircle name={player.name} photoURL={player.photoURL} size={40} />
                                        <View style={styles.scoreNameBlock}>
                                            <Text style={styles.scoreName} numberOfLines={1}>
                                                {isMe ? 'Você' : player.name}
                                            </Text>
                                            <Text style={[styles.scoreRoundPoints, roundPoints > 0 && styles.scoreRoundPointsUp]}>
                                                {roundPoints > 0 ? `+${roundPoints} nesta rodada` : 'Sem pontos nesta rodada'}
                                            </Text>
                                        </View>
                                        <Text style={styles.scoreValue}>{player.score || 0} pts</Text>
                                    </Animated.View>
                                );
                            })}
                        </View>
                    </>
                ) : (
                    <>
                        {/* Pergunta da rodada */}
                        <Animated.View entering={FadeInDown.delay(60).duration(320)} style={styles.heroBlock}>
                            <Text style={styles.heroKicker}>
                                TIER LIST DA GALERA · RODADA {currentRound}/{totalRounds}
                            </Text>
                            <Text style={styles.heroQuestion}>{roomData.roundData?.question}</Text>
                        </Animated.View>

                        {/* Resultado pessoal */}
                        {myTierDef ? (() => {
                            // Sem votos, o jogo te coloca no nível do meio; mostramos isso como estado neutro.
                            const hasVotes = myResult.voteCount > 0;
                            return (
                                <Animated.View
                                    entering={FadeInDown.delay(160).duration(320)}
                                    style={styles.myResultCard}
                                >
                                    <View style={[styles.myTierBadge, hasVotes && { backgroundColor: myTierDef.bg }]}>
                                        <Text style={[styles.myTierNumber, { color: hasVotes ? myTierDef.color : 'rgba(255,255,255,0.45)' }]}>
                                            {hasVotes ? myTierDef.key : '–'}
                                        </Text>
                                    </View>
                                    <View style={styles.myResultText}>
                                        <Text style={styles.myResultKicker}>{hasVotes ? 'O GRUPO TE COLOCOU EM' : 'SEU RESULTADO'}</Text>
                                        <Text
                                            style={[styles.myTierDescription, { color: hasVotes ? myTierDef.color : '#fff' }]}
                                            numberOfLines={1}
                                        >
                                            {hasVotes ? myTierDef.description : 'Ninguém votou em você'}
                                        </Text>
                                    </View>
                                    <View style={[styles.myPointsPill, myPoints > 0 && { backgroundColor: myTierDef.bg }]}>
                                        <Text style={[styles.myPointsText, myPoints > 0 && { color: myTierDef.color }]}>
                                            {myPoints > 0 ? `+${myPoints} pts` : '0 pts'}
                                        </Text>
                                    </View>
                                </Animated.View>
                            );
                        })() : null}

                        {/* Tier rows */}
                        <Animated.View entering={FadeInDown.delay(240).duration(320)} style={styles.tierListBlock}>
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

                                        {/* Altura fixa: se tiver muita gente, a linha rola para o lado. */}
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            style={styles.tierPlayersScroll}
                                            contentContainerStyle={styles.tierPlayers}
                                        >
                                            {tierPlayers.length === 0 ? (
                                                <Text style={styles.emptyTierText}>—</Text>
                                            ) : (
                                                tierPlayers.map((p) => (
                                                    <Animated.View
                                                        key={p.uid}
                                                        entering={FadeIn.delay(400 + tierIndex * 100)}
                                                        style={styles.tierPlayerItem}
                                                    >
                                                        <View style={[styles.tierAvatarRing, p.uid === currentUser?.uid && { borderColor: tier.color }]}>
                                                            <AvatarCircle name={p.name} photoURL={p.photoURL} size={34} />
                                                        </View>
                                                        <Text
                                                            style={[styles.tierPlayerName, p.uid === currentUser?.uid && { color: tier.color }]}
                                                            numberOfLines={1}
                                                        >
                                                            {p.uid === currentUser?.uid ? 'Você' : p.name}
                                                        </Text>
                                                    </Animated.View>
                                                ))
                                            )}
                                        </ScrollView>
                                    </Animated.View>
                                );
                            })}
                        </Animated.View>

                    </>
                )}
            </ScrollView>

            {/* Ação fixa embaixo; o conteúdo rola por trás do vidro. */}
            <View
                style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}
                onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
            >
                <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.footerTint} />
                {isHost ? (
                    <TouchableOpacity
                        style={styles.ctaBtn}
                        onPress={showingScoreboard || isLastRound ? handleNextRound : handleShowScoreboard}
                        disabled={loadingNext || loadingScoreboard}
                        activeOpacity={0.84}
                    >
                        <LinearGradient
                            colors={['#8b5cf6', '#7c3aed']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.ctaGradient}
                        >
                            <Text style={styles.ctaText}>
                                {loadingNext || loadingScoreboard
                                    ? 'Aguarde...'
                                    : isLastRound
                                        ? 'Ver resultado final'
                                        : showingScoreboard ? 'Próxima rodada' : 'Ver placar'}
                            </Text>
                            <ArrowRight size={18} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <HostWaitingIndicator
                        message={isLastRound
                            ? 'Aguardando o host encerrar a partida...'
                            : showingScoreboard ? 'Aguardando o host avançar...' : 'Aguardando o host mostrar o placar...'}
                    />
                )}
            </View>
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
    scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

    heroBlock: {
        alignItems: 'center',
        borderRadius: 24,
        paddingVertical: 22,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(18,18,24,0.94)',
        borderWidth: 1, borderColor: 'rgba(167,139,250,0.22)',
        marginBottom: 18,
    },
    heroKicker: {
        color: '#A78BFA', fontSize: 11, fontWeight: '800',
        letterSpacing: 1.2, marginBottom: 10, textAlign: 'center',
    },
    heroQuestion: {
        color: '#fff', fontSize: 25, fontWeight: '800',
        lineHeight: 31, letterSpacing: -0.4, textAlign: 'center',
    },

    myResultCard: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 10, paddingHorizontal: 10,
        backgroundColor: 'rgba(18,18,24,0.94)',
        marginBottom: 22,
    },
    myTierBadge: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center', justifyContent: 'center',
    },
    myTierNumber: { fontSize: 20, fontWeight: '900' },
    myResultText: { flex: 1 },
    myResultKicker: {
        color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800',
        letterSpacing: 1.2, marginBottom: 2,
    },
    myTierDescription: { fontSize: 15, fontWeight: '800' },
    myPointsPill: {
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    myPointsText: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '800' },

    sectionLabel: {
        color: '#A78BFA', fontSize: 11, fontWeight: '900',
        letterSpacing: 1.6, marginBottom: 10, marginLeft: 4,
    },
    groupedList: {
        borderRadius: 20,
        backgroundColor: 'rgba(18,18,24,0.94)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        marginBottom: 26,
    },
    rowSeparator: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },

    tierListBlock: { marginBottom: 26 },
    tierRow: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 16, borderWidth: 1, marginBottom: 8,
        backgroundColor: '#141219',
        overflow: 'hidden', height: 66,
    },
    tierAvatarRing: {
        borderRadius: 999, borderWidth: 2, borderColor: 'transparent', padding: 1,
    },
    tierLabelBox: {
        width: 64, alignSelf: 'stretch',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 0, borderRightWidth: 1,
        paddingVertical: 10,
    },
    tierLabelText: { fontSize: 22, fontWeight: '900', lineHeight: 26 },
    tierLabelSub: { fontSize: 10, fontWeight: '800', opacity: 0.9, textAlign: 'center' },
    tierPlayersScroll: { flex: 1, alignSelf: 'stretch' },
    tierPlayers: {
        flexGrow: 1, flexDirection: 'row',
        gap: 10, paddingHorizontal: 12, alignItems: 'center',
    },
    tierPlayerItem: { alignItems: 'center', gap: 2, maxWidth: 60 },
    tierPlayerName: {
        color: '#fff', fontSize: 11, fontWeight: '700',
        textAlign: 'center', maxWidth: 60,
    },
    emptyTierText: { color: 'rgba(255,255,255,0.3)', fontSize: 18, paddingLeft: 4 },

    scoreRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 12, paddingHorizontal: 14,
    },
    scoreNameBlock: { flex: 1, minWidth: 0 },
    scoreRoundPoints: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', marginTop: 1 },
    scoreRoundPointsUp: { color: '#86EFAC' },
    scorePosLeader: { color: '#FDE68A' },
    scoreRowMe: { backgroundColor: 'rgba(139,92,246,0.14)' },
    scorePos: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '800', width: 18, textAlign: 'center' },
    scoreName: { color: '#fff', fontSize: 15, fontWeight: '700' },
    scoreValue: { color: '#C4B5FD', fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },

    footer: {
        position: 'absolute', left: 0, right: 0, bottom: 0,
        paddingTop: 14, paddingHorizontal: 20,
        overflow: 'hidden',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.12)',
    },
    footerTint: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15,12,24,0.82)',
    },
    ctaBtn: { borderRadius: 16, overflow: 'hidden' },
    ctaGradient: {
        height: 56, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    ctaText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
