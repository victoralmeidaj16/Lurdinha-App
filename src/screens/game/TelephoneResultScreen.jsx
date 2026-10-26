import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, X, ChevronRight } from 'lucide-react-native';
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import TelephoneRevealEntry, { REVEAL_EASE } from '../../components/TelephoneRevealEntry';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../hooks/useGame';
import AvatarCircle from '../../components/AvatarCircle';
import { triggerImpact } from '../../utils/haptics';
import { playSound } from '../../utils/sounds';
import { colors, borderRadius } from '../../theme';

// Troca de cadeia como uma virada de página: a anterior sai subindo e some,
// a nova chega de baixo, levemente menor, e assenta sem quicar.
const chainEntering = () => {
    'worklet';
    return {
        initialValues: { opacity: 0, transform: [{ translateY: 36 }, { scale: 0.96 }] },
        animations: {
            opacity: withTiming(1, { duration: 380, easing: REVEAL_EASE }),
            transform: [
                { translateY: withTiming(0, { duration: 520, easing: REVEAL_EASE }) },
                { scale: withTiming(1, { duration: 520, easing: REVEAL_EASE }) },
            ],
        },
    };
};

const chainExiting = () => {
    'worklet';
    return {
        initialValues: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
        animations: {
            opacity: withTiming(0, { duration: 200 }),
            transform: [
                { translateY: withTiming(-24, { duration: 240, easing: REVEAL_EASE }) },
                { scale: withTiming(0.98, { duration: 240, easing: REVEAL_EASE }) },
            ],
        },
    };
};

export default function TelephoneResultScreen({ route, navigation }) {
    const { roomId } = route.params;
    const { currentUser } = useAuth();
    const { nextRound, listenToRoom, leaveRoom, updateTelephoneReveal } = useGame();
    const [gameState, setGameState] = useState(route.params?.gameState || null);
    const [revealPending, setRevealPending] = useState(false);
    const reduceMotion = useReducedMotion();
    const progressValue = useSharedValue(0);
    const scrollViewRef = useRef(null);

    useEffect(() => {
        const unsubscribe = listenToRoom(roomId, (data, meta) => {
            setGameState(data);
            if (meta?.fromCache) return;
            if (data.status === 'finished') {
                navigation.replace('MainTabs', { screen: 'home' });
            }
        });

        return () => {
            unsubscribe();
            leaveRoom();
        };
    }, [navigation, roomId]);

    const isHost = gameState?.hostId === currentUser?.uid;
    const players = gameState?.players || [];
    const threads = gameState?.roundData?.threads || {};

    const playerById = useMemo(
        () => Object.fromEntries(players.map((player) => [player.uid, player])),
        [players]
    );

    // Ordem estável das cadeias para todos os aparelhos: ordem da sala, depois o resto.
    const chainAuthorIds = useMemo(() => {
        const ids = Object.keys(threads);
        const byPlayerOrder = players.map((p) => p.uid).filter((uid) => ids.includes(uid));
        const rest = ids.filter((uid) => !byPlayerOrder.includes(uid)).sort();
        return [...byPlayerOrder, ...rest];
    }, [threads, players]);

    // O host conduz a revelação; o estado fica na sala para todos verem o mesmo passo.
    const totalChains = chainAuthorIds.length;
    const chainIndex = Math.min(gameState?.roundData?.revealChain ?? 0, Math.max(totalChains - 1, 0));
    const chainAuthorId = chainAuthorIds[chainIndex];
    const chainAuthor = playerById[chainAuthorId];
    const chainEntries = threads[chainAuthorId] || [];
    const revealedCount = Math.min(gameState?.roundData?.revealStep ?? 1, chainEntries.length);
    const revealedEntries = chainEntries.slice(0, revealedCount);
    const isChainComplete = revealedCount >= chainEntries.length;
    const isLastChain = chainIndex >= totalChains - 1;

    const handleCloseRoom = async () => {
        if (!isHost) return;
        playSound('ui_toggle');
        triggerImpact('medium');
        try {
            await nextRound(roomId, true);
        } catch (error) {
            console.error(error);
        }
    };

    const pushReveal = async (next) => {
        if (!isHost || revealPending) return;
        setRevealPending(true);
        try {
            await updateTelephoneReveal(roomId, next);
        } catch (error) {
            console.error(error);
        } finally {
            setRevealPending(false);
        }
    };

    const handleNextStep = () => {
        pushReveal({ chain: chainIndex, step: revealedCount + 1 });
    };

    const handleNextChain = () => {
        pushReveal({ chain: chainIndex + 1, step: 1 });
    };

    // Cada passo novo rola até o fim da cadeia atual (depois que o card começou a subir).
    useEffect(() => {
        const timer = setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 220);
        return () => clearTimeout(timer);
    }, [revealedCount]);

    // Barra de progresso desliza até o novo valor em vez de pular.
    useEffect(() => {
        progressValue.value = withTiming(
            revealedCount / Math.max(chainEntries.length, 1),
            { duration: reduceMotion ? 0 : 520, easing: REVEAL_EASE },
        );
    }, [revealedCount, chainEntries.length, chainIndex]);

    // Som e vibração no mesmo instante em todos os aparelhos, não só no do host.
    // O último passo da cadeia (o "punchline") ganha um som próprio.
    const lastFeedbackKeyRef = useRef(null);
    useEffect(() => {
        if (!gameState || chainEntries.length === 0) return;
        const key = `${chainIndex}-${revealedCount}`;
        if (lastFeedbackKeyRef.current === null) {
            lastFeedbackKeyRef.current = key;
            return;
        }
        if (lastFeedbackKeyRef.current === key) return;
        lastFeedbackKeyRef.current = key;

        if (revealedCount >= chainEntries.length && revealedCount > 1) {
            playSound('reveal');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } else if (revealedCount === 1) {
            playSound('ui_toggle');
            triggerImpact('medium');
        } else {
            playSound('ui_tap_soft');
            triggerImpact('light');
        }
    }, [chainIndex, revealedCount, chainEntries.length]);

    const progressStyle = useAnimatedStyle(() => ({ width: `${progressValue.value * 100}%` }));

    if (!gameState) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient colors={['#0F172A', '#1E1B4B']} style={StyleSheet.absoluteFill} />
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Carregando resultados...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#181528', '#0F0F12', '#0A0A0C']} style={StyleSheet.absoluteFill} />

            {/* Glowing Accent Orb */}
            <View style={styles.topAccentOrb} pointerEvents="none" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <Eye size={26} color="#A78BFA" />
                    <View>
                        <Text style={styles.headerTitle}>Revelação Final</Text>
                        <Text style={styles.headerSubtitle}>Telefone Sem Fio 🎙️</Text>
                    </View>
                </View>

                {totalChains > 0 && (
                    <View style={styles.progressTracker}>
                        <Text style={styles.progressText}>
                            Frase <Text style={styles.progressHighlight}>{chainIndex + 1}</Text> de {totalChains}
                            {'  ·  '}Passo <Text style={styles.progressHighlight}>{revealedCount}</Text> de {chainEntries.length}
                        </Text>
                        <View style={styles.progressBarTrack}>
                            <Animated.View style={[styles.progressBarFill, progressStyle]} />
                        </View>
                    </View>
                )}
            </View>

            <Animated.View
                key={`chain-${chainIndex}`}
                style={styles.chainPage}
                entering={reduceMotion ? FadeIn.duration(200) : chainEntering}
                exiting={reduceMotion ? undefined : chainExiting}
            >
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {chainIndex === 0 ? (
                    <Text style={styles.subtitle}>
                        Prepare-se para rir! Acompanhe como cada história foi se transformando passo a passo.
                    </Text>
                ) : null}

                {chainAuthorId ? (
                    <View style={styles.storyCard}>
                        {/* Card Decorative Accent */}
                        <View style={styles.cardAccentLine} />

                        <View style={styles.storyHeader}>
                            <AvatarCircle
                                name={chainAuthor?.name || 'Pessoa'}
                                photoURL={chainAuthor?.photoURL}
                                size={42}
                            />
                            <View style={styles.storyHeaderCopy}>
                                <Text style={styles.storyTitle}>
                                    Cadeia de {chainAuthor?.name || 'alguém'}
                                </Text>
                                <Text style={styles.storyCaption}>Iniciou o telefone sem fio</Text>
                            </View>
                        </View>

                        <View style={styles.storyBody}>
                            {revealedEntries.map((entry, index) => {
                                const isPhrase = entry.type === 'phrase';
                                const isOriginalPhrase = isPhrase && entry.turn === 1;
                                return (
                                    <TelephoneRevealEntry
                                        key={`${entry.turn}-${index}`}
                                        entry={entry}
                                        contributor={playerById[entry.authorId]}
                                        label={isOriginalPhrase ? 'Frase Original' : isPhrase ? 'Interpretação' : 'Desenho'}
                                        isOriginal={isOriginalPhrase}
                                        showConnector={index > 0}
                                        animate={index === revealedCount - 1}
                                        isPunchline={index === chainEntries.length - 1 && index > 0}
                                        reduceMotion={reduceMotion}
                                    />
                                );
                            })}
                        </View>
                    </View>
                ) : null}
            </ScrollView>
            </Animated.View>

            {/* Bottom Vignette */}
            <LinearGradient
                colors={['transparent', '#090514']}
                style={styles.bottomVignette}
                pointerEvents="none"
            />

            {/* Footer Control Panel */}
            <View style={styles.footer}>
                {!isHost ? (
                    <View style={styles.waitingContainer}>
                        <ActivityIndicator size="small" color="#A78BFA" />
                        <Text style={styles.waitingText}>
                            {!isChainComplete
                                ? 'Aguardando o host revelar o próximo passo...'
                                : !isLastChain
                                    ? 'Aguardando o host abrir a próxima frase...'
                                    : 'Aguardando o host encerrar a sala...'}
                        </Text>
                    </View>
                ) : !isChainComplete || !isLastChain ? (
                    <TouchableOpacity
                        style={styles.nextStepButton}
                        onPress={!isChainComplete ? handleNextStep : handleNextChain}
                        disabled={revealPending}
                        activeOpacity={0.88}
                    >
                        <LinearGradient
                            colors={['#8B5CF6', '#7C3AED']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.btnGradient}
                        >
                            <Animated.Text
                                key={!isChainComplete ? 'step' : 'chain'}
                                entering={FadeIn.duration(260)}
                                style={styles.btnText}
                            >
                                {!isChainComplete ? 'Revelar Próximo Passo' : 'Próxima Frase Inicial'}
                            </Animated.Text>
                            <ChevronRight size={20} color="#FFFFFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleCloseRoom}
                        activeOpacity={0.88}
                    >
                        <LinearGradient
                            colors={['#EF4444', '#DC2626']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.btnGradient}
                        >
                            <Text style={styles.btnText}>Voltar ao Início</Text>
                            <X size={20} color="#FFFFFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0C',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        color: '#DDD6FE',
        fontSize: 16,
        fontWeight: '600',
    },
    topAccentOrb: {
        position: 'absolute',
        top: -120,
        left: '25%',
        width: '50%',
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 100,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: 'rgba(9, 5, 20, 0.75)',
        gap: 14,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#C4B5FD',
        marginTop: 1,
    },
    progressTracker: {
        gap: 6,
    },
    progressText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#A78BFA',
    },
    progressHighlight: {
        fontWeight: '800',
        color: '#FFFFFF',
    },
    progressBarTrack: {
        height: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: '#8B5CF6',
    },
    chainPage: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 140,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 22,
        color: '#DDD6FE',
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 12,
        opacity: 0.9,
    },
    storyCard: {
        marginBottom: 28,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: 'rgba(20, 16, 38, 0.8)',
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.16)',
    },
    cardAccentLine: {
        height: 4,
        width: '100%',
        backgroundColor: '#8B5CF6',
    },
    storyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 18,
        backgroundColor: 'rgba(168, 85, 247, 0.08)',
        borderBottomWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.08)',
    },
    storyHeaderCopy: {
        flex: 1,
    },
    storyTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    storyCaption: {
        fontSize: 11,
        color: '#C4B5FD',
        marginTop: 2,
        fontWeight: '500',
    },
    storyBody: {
        padding: 16,
        gap: 0, // timeline gap controlled by connector
    },
    bottomVignette: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        pointerEvents: 'none',
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: 20,
        paddingBottom: 36,
        backgroundColor: 'rgba(7, 4, 18, 0.94)',
        borderTopWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    nextStepButton: {
        borderRadius: borderRadius.md,
        overflow: 'hidden',
    },
    closeButton: {
        borderRadius: borderRadius.md,
        overflow: 'hidden',
    },
    btnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
    },
    btnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    waitingContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 16,
    },
    waitingText: {
        color: '#DDD6FE',
        fontWeight: '700',
        fontSize: 14,
    },
});
