import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, AlertTriangle, Brain, CheckCircle2, Crown, Sparkles, XCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn, useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Header from '../../components/Header';
import AvatarCircle from '../../components/AvatarCircle';
import LurdinhaBrandIcon from '../../components/LurdinhaBrandIcon';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { colors, shadows } from '../../theme';
import HostWaitingIndicator from '../../components/HostWaitingIndicator';
import { triggerImpact } from '../../utils/haptics';

function MostLikelyRoundResult({
    roomData,
    currentUser,
    isHost,
    loadingNext,
    handleNextRound,
    onConfirmExit,
}) {
    const results = roomData.roundData?.results || {};
    const answers = roomData.roundData?.answers || {};
    const playerById = Object.fromEntries((roomData.players || []).map((player) => [player.uid, player]));
    const ranking = results.ranking || [];
    const winnerIds = results.winnerIds || [];
    const winners = winnerIds.map((uid) => playerById[uid]?.name).filter(Boolean);
    const myVotedWinner = results.votersOnWinners?.includes(currentUser?.uid);
    const isPublicVote = roomData.settings?.voteMode === 'public';
    const winnerText = winners.length
        ? winners.join(' e ')
        : 'Sem vencedor';

    return (
        <View style={styles.container}>
            <Header title="Verdade social" transparent showExit showSoundToggle onConfirmExit={onConfirmExit} />

            <LinearGradient
                colors={['#0f0f12', '#17131f', '#2e1065']}
                style={styles.background}
            />

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
                <Animated.View entering={ZoomIn.delay(120)} style={styles.resultHeader}>
                    <LurdinhaBrandIcon size={74} style={styles.resultLogo} />
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(139,92,246,0.20)' }]}>
                        <Crown size={62} color="#FDE68A" />
                    </View>
                    <Text style={styles.resultTitle}>Resultado do grupo</Text>
                    <Text style={styles.resultSubtitle}>
                        {myVotedWinner ? 'Você leu o grupo e ganhou +2 pts.' : 'A percepção coletiva falou mais alto.'}
                    </Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(240)} style={styles.majoritySection}>
                    <Text style={styles.sectionLabel}>PERGUNTA</Text>
                    <View style={styles.majorityCard}>
                        <Text style={styles.majorityText}>{roomData.roundData?.question}</Text>
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(320)} style={styles.majoritySection}>
                    <Text style={styles.sectionLabel}>MAIS VOTADO</Text>
                    <View style={styles.mostLikelyWinnerCard}>
                        <Text style={styles.mostLikelyWinnerName}>{winnerText}</Text>
                        <Text style={styles.mostLikelyWinnerHint}>
                            {winners.length > 1 ? 'Empate no topo da rodada.' : 'Essa foi a verdade social desta pergunta.'}
                        </Text>
                    </View>
                </Animated.View>

                <View style={styles.answersList}>
                    <Text style={styles.sectionLabel}>RANKING DA RODADA</Text>
                    {ranking.length ? ranking.map((entry, index) => (
                        <Animated.View
                            key={entry.uid}
                            entering={FadeInDown.delay(380 + (index * 90)).duration(420)}
                            style={[styles.playerRow, winnerIds.includes(entry.uid) && styles.mostLikelyWinnerRow]}
                        >
                            <View style={styles.playerInfo}>
                                <View style={styles.positionBadge}>
                                    <Text style={styles.positionText}>#{index + 1}</Text>
                                </View>
                                <AvatarCircle name={entry.name} photoURL={entry.photoURL} size={40} />
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <Text style={styles.playerAnswer}>{entry.name}</Text>
                                    <Text style={styles.playerName}>{entry.votes} voto{entry.votes === 1 ? '' : 's'}</Text>
                                </View>
                            </View>
                            {winnerIds.includes(entry.uid) ? (
                                <View style={styles.lurdinhaBadge}>
                                    <Text style={styles.lurdinhaText}>👑</Text>
                                </View>
                            ) : null}
                        </Animated.View>
                    )) : (
                        <View style={styles.emptyResultCard}>
                            <Text style={styles.resultSubtitle}>Ninguém votou nesta rodada.</Text>
                        </View>
                    )}
                </View>

                {isPublicVote ? (
                    <View style={[styles.answersList, { marginTop: 28 }]}>
                        <Text style={styles.sectionLabel}>VOTOS REVELADOS</Text>
                        {(roomData.players || []).map((player, index) => {
                            const target = playerById[answers[player.uid]];
                            return (
                                <Animated.View
                                    key={player.uid}
                                    entering={FadeInDown.delay(520 + (index * 80)).duration(360)}
                                    style={styles.playerRow}
                                >
                                    <View style={styles.playerInfo}>
                                        <AvatarCircle name={player.name} photoURL={player.photoURL} size={38} />
                                        <View style={{ marginLeft: 12, flex: 1 }}>
                                            <Text style={styles.playerName}>{player.name} votou em</Text>
                                            <Text style={styles.playerAnswer}>{target?.name || 'Ninguém'}</Text>
                                        </View>
                                    </View>
                                </Animated.View>
                            );
                        })}
                    </View>
                ) : null}
            </ScrollView>

            {isHost ? (
                <Animated.View entering={FadeInUp.delay(680)} style={styles.footer}>
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
                                        {roomData.partySession
                                            ? 'Continuar Sessão'
                                            : (roomData.currentRound >= roomData.settings.totalRounds ? 'Ver Resultado Final' : 'Próxima Pergunta')}
                                    </Text>
                                    <ArrowRight size={20} color="#fff" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            ) : (
                <View style={styles.footer}>
                    <HostWaitingIndicator hostName={roomData?.players?.find(p => p.uid === roomData?.hostId)?.name} />
                </View>
            )}
        </View>
    );
}

function ObviousMindRoundResult({
    roomData,
    currentUser,
    isHost,
    loadingNext,
    handleNextRound,
    onConfirmExit,
}) {
    const results = roomData.roundData?.results || {};
    const answers = roomData.roundData?.answers || {};
    const players = roomData.players || [];
    const playerById = Object.fromEntries(players.map((player) => [player.uid, player]));
    const target = playerById[results.targetId];
    const correctGuessers = results.correctGuessers || [];
    const targetAnswer = results.targetAnswer || 'Sem resposta';
    const myUid = currentUser?.uid;
    const iMatched = correctGuessers.includes(myUid);
    const iAmTarget = results.targetId === myUid;

    return (
        <View style={styles.container}>
            <Header title="Na Minha Cabeça Era Óbvio" transparent showExit showSoundToggle onConfirmExit={onConfirmExit} />

            <LinearGradient
                colors={['#0f0f12', '#17131f', '#2e1065']}
                style={styles.background}
            />

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
                <Animated.View entering={ZoomIn.delay(120)} style={styles.resultHeader}>
                    <LurdinhaBrandIcon size={74} style={styles.resultLogo} />
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(139,92,246,0.20)' }]}>
                        <Brain size={62} color="#FDE68A" />
                    </View>
                    <Text style={styles.resultTitle}>
                        {iAmTarget
                            ? (results.targetStumpedGroup ? 'Ninguém entrou na sua cabeça' : 'Revelaram sua mente')
                            : (iMatched ? 'Mente parecida' : 'Não era tão óbvio')}
                    </Text>
                    <Text style={styles.resultSubtitle}>
                        {iMatched
                            ? `Você acertou ${target?.name || 'o alvo'} e ganhou +${results.pointsForMatch || 2} pts.`
                            : results.targetStumpedGroup
                            ? `${target?.name || 'O alvo'} ganhou bônus porque ninguém acertou.`
                            : 'A resposta revelou quem pensou parecido.'}
                    </Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(220)} style={styles.majoritySection}>
                    <Text style={styles.sectionLabel}>ALVO MENTAL</Text>
                    <View style={styles.obviousTargetCard}>
                        <AvatarCircle name={target?.name || 'Alvo'} photoURL={target?.photoURL} size={48} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.playerAnswer}>{target?.name || 'Jogador'}</Text>
                            <Text style={styles.playerName}>Resposta secreta revelada</Text>
                        </View>
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(300)} style={styles.majoritySection}>
                    <Text style={styles.sectionLabel}>PERGUNTA</Text>
                    <View style={styles.majorityCard}>
                        <Text style={styles.majorityText}>{roomData.roundData?.question?.text}</Text>
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(380)} style={styles.majoritySection}>
                    <Text style={styles.sectionLabel}>RESPOSTA DO ALVO</Text>
                    <View style={styles.mostLikelyWinnerCard}>
                        <Text style={styles.mostLikelyWinnerName}>{targetAnswer}</Text>
                        <Text style={styles.mostLikelyWinnerHint}>
                            {correctGuessers.length
                                ? `${correctGuessers.length} pessoa${correctGuessers.length > 1 ? 's' : ''} pensou igual.`
                                : 'Ninguém acertou essa resposta.'}
                        </Text>
                    </View>
                </Animated.View>

                <View style={styles.answersList}>
                    <Text style={styles.sectionLabel}>QUEM PENSOU PARECIDO</Text>
                    {players.map((player, index) => {
                        const isTargetPlayer = player.uid === results.targetId;
                        const guessedCorrectly = correctGuessers.includes(player.uid);
                        const answer = answers[player.uid] || 'Sem resposta';
                        const badge = player.obviousMindBadges?.menteGemea;

                        return (
                            <Animated.View
                                key={player.uid}
                                entering={FadeInDown.delay(440 + (index * 80)).duration(380)}
                                style={[styles.playerRow, guessedCorrectly && styles.mostLikelyWinnerRow]}
                            >
                                <View style={styles.playerInfo}>
                                    <AvatarCircle name={player.name} photoURL={player.photoURL} size={40} />
                                    <View style={{ marginLeft: 12, flex: 1 }}>
                                        <Text style={styles.playerAnswer}>
                                            {player.name}{isTargetPlayer ? ' · alvo' : ''}
                                        </Text>
                                        <Text style={styles.playerName}>{answer}</Text>
                                    </View>
                                </View>
                                {badge ? (
                                    <View style={styles.mindTwinBadge}>
                                        <Sparkles size={12} color="#FDE68A" />
                                        <Text style={styles.mindTwinBadgeText}>Mente Gêmea</Text>
                                    </View>
                                ) : guessedCorrectly ? (
                                    <View style={styles.lurdinhaBadge}>
                                        <Text style={styles.lurdinhaText}>+{results.pointsForMatch || 2}</Text>
                                    </View>
                                ) : null}
                            </Animated.View>
                        );
                    })}
                </View>
            </ScrollView>

            {isHost ? (
                <Animated.View entering={FadeInUp.delay(680)} style={styles.footer}>
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
                                        {roomData.partySession
                                            ? 'Continuar Sessão'
                                            : (roomData.currentRound >= roomData.settings.totalRounds ? 'Ver Resultado Final' : 'Próxima Pergunta')}
                                    </Text>
                                    <ArrowRight size={20} color="#fff" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            ) : (
                <View style={styles.footer}>
                    <HostWaitingIndicator hostName={roomData?.players?.find(p => p.uid === roomData?.hostId)?.name} />
                </View>
            )}
        </View>
    );
}

export default function RoundResultScreen({ route, navigation }) {
    const { roomId } = route.params;
    const { listenToRoom, nextRound, error, removeFromRoom, leaveRoom } = useGame();
    const { currentUser } = useAuth();
    const [roomData, setRoomData] = useState(null);
    const [loadingNext, setLoadingNext] = useState(false);
    const hasRoutedRef = useRef(false);

    useEffect(() => {
        const unsubscribe = listenToRoom(roomId, (data, meta) => {
            setRoomData(data);
            if (!data) return;
            if (meta?.fromCache) return;
            if (data.status === 'playing' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                navigation.replace('Game', { roomId });
            } else if (data.status === 'finished' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                navigation.replace('FinalResult', { roomId });
            } else if (data.status === 'party_transition' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                navigation.replace('RoundTransition', { roomId });
            }
        });

        return () => unsubscribe();
    }, [roomId]);

    const handleNextRound = async () => {
        if (!roomData) return;
        triggerImpact('medium');
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

    const gameType = roomData.settings?.gameType || 'lurdinha';
    const isHost = roomData.hostId === currentUser?.uid;

    if (gameType === 'most_likely') {
        return (
            <MostLikelyRoundResult
                roomData={roomData}
                currentUser={currentUser}
                isHost={isHost}
                loadingNext={loadingNext}
                handleNextRound={handleNextRound}
                onConfirmExit={async () => {
                    await removeFromRoom(roomId);
                    leaveRoom();
                    navigation.navigate('GameHome');
                }}
            />
        );
    }

    if (gameType === 'obvious_mind') {
        return (
            <ObviousMindRoundResult
                roomData={roomData}
                currentUser={currentUser}
                isHost={isHost}
                loadingNext={loadingNext}
                handleNextRound={handleNextRound}
                onConfirmExit={async () => {
                    await removeFromRoom(roomId);
                    leaveRoom();
                    navigation.navigate('GameHome');
                }}
            />
        );
    }

    const { results, answers } = roomData.roundData;
    const majorityAnswers = results.majorityAnswers || [];
    const lurdinhaVictims = results.lurdinhaVictims || [];

    const myUid = currentUser?.uid;
    const iGotLurdinha = lurdinhaVictims.includes(myUid);

    return (
        <View style={styles.container}>
            <Header 
                title="Resultado da Rodada" 
                transparent 
                showExit 
                showSoundToggle
                onConfirmExit={async () => {
                    await removeFromRoom(roomId);
                    leaveRoom();
                    navigation.navigate('GameHome');
                }}
            />

            <LinearGradient
                colors={iGotLurdinha ? ['#7f1d1d', '#450a0a'] : ['#4c1d95', '#2e1065']}
                style={styles.background}
            />

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
                <Animated.View entering={ZoomIn.delay(200)} style={styles.resultHeader}>
                    <LurdinhaBrandIcon size={72} style={styles.resultLogo} />
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
                                entering={FadeInDown.delay(400 + (index * 150)).duration(600).springify()}
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
                                        {roomData.partySession
                                            ? 'Continuar Sessão'
                                            : (roomData.currentRound >= roomData.settings.totalRounds ? 'Ver Resultado Final' : 'Próxima Rodada')}
                                    </Text>
                                    <ArrowRight size={20} color="#fff" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            ) : (
                <View style={styles.footer}>
                    <HostWaitingIndicator hostName={roomData?.players?.find(p => p.uid === roomData?.hostId)?.name} />
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
    resultLogo: {
        marginBottom: 18,
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
    mostLikelyWinnerCard: {
        backgroundColor: 'rgba(139,92,246,0.16)',
        padding: 24,
        borderRadius: 22,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.32)',
    },
    mostLikelyWinnerName: {
        fontSize: 27,
        lineHeight: 34,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    mostLikelyWinnerHint: {
        color: 'rgba(255,255,255,0.62)',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    obviousTargetCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(139,92,246,0.13)',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.25)',
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
    mostLikelyWinnerRow: {
        backgroundColor: 'rgba(139,92,246,0.18)',
        borderColor: 'rgba(167,139,250,0.36)',
    },
    playerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    positionBadge: {
        width: 34,
        height: 34,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(167,139,250,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.22)',
        marginRight: 10,
    },
    positionText: {
        color: '#C4B5FD',
        fontSize: 12,
        fontWeight: '900',
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
    emptyResultCard: {
        padding: 20,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
    },
    mindTwinBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(250,204,21,0.16)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(253,230,138,0.22)',
    },
    mindTwinBadgeText: {
        color: '#FDE68A',
        fontSize: 11,
        fontWeight: '900',
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
        shadowColor: colors.primary,
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
