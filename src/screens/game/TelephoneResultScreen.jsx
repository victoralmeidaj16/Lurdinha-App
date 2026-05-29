import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, X, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../hooks/useGame';
import AvatarCircle from '../../components/AvatarCircle';
import { triggerImpact } from '../../utils/haptics';
import { playSound } from '../../utils/sounds';
import { colors, borderRadius } from '../../theme';

const VIRTUAL_CANVAS_WIDTH = 320;
const VIRTUAL_CANVAS_HEIGHT = 420;

const renderDrawingEntry = (entry) => (
    <View style={[styles.drawingFrame, { backgroundColor: entry?.canvasFill || '#0F172A' }]}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${VIRTUAL_CANVAS_WIDTH} ${VIRTUAL_CANVAS_HEIGHT}`}>
            {(entry?.strokes || []).map((stroke) => (
                <Path
                    key={stroke.id}
                    d={stroke.path}
                    stroke={stroke.color}
                    strokeWidth={stroke.width || 7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />
            ))}
        </Svg>
    </View>
);

export default function TelephoneResultScreen({ route, navigation }) {
    const { roomId } = route.params;
    const { currentUser } = useAuth();
    const { nextRound, listenToRoom, leaveRoom } = useGame();
    const [gameState, setGameState] = useState(route.params?.gameState || null);
    const [currentStep, setCurrentStep] = useState(1);
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

    // Flatten all steps into a clean list to easily calculate indices and avoid render hacks
    const flattenedSteps = useMemo(() => {
        const stepsList = [];
        Object.keys(threads).forEach((authorId) => {
            const originalAuthor = playerById[authorId];
            const entries = threads[authorId] || [];
            entries.forEach((entry, index) => {
                stepsList.push({
                    threadAuthorId: authorId,
                    threadAuthor: originalAuthor,
                    entry,
                    indexInThread: index,
                    globalIndex: stepsList.length + 1
                });
            });
        });
        return stepsList;
    }, [threads, playerById]);

    const totalSteps = flattenedSteps.length;

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

    const handleNextStep = () => {
        if (currentStep < totalSteps) {
            triggerImpact('medium');
            playSound('ui_tap_soft');
            setCurrentStep(c => c + 1);
            // Smoothly scroll down to keep the new block in view
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 150);
        }
    };

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
            <LinearGradient colors={['#07070A', '#111026', '#090514']} style={StyleSheet.absoluteFill} />

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

                {totalSteps > 0 && (
                    <View style={styles.progressTracker}>
                        <Text style={styles.progressText}>
                            Passo <Text style={styles.progressHighlight}>{currentStep}</Text> de {totalSteps}
                        </Text>
                        <View style={styles.progressBarTrack}>
                            <View style={[styles.progressBarFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
                        </View>
                    </View>
                )}
            </View>

            <ScrollView 
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.subtitle}>
                    Prepare-se para rir! Acompanhe como cada história foi se transformando passo a passo.
                </Text>

                {Object.keys(threads).map((authorId) => {
                    const originalAuthor = playerById[authorId];
                    const entries = threads[authorId] || [];

                    // Filter entries in this specific thread that are currently revealed
                    const revealedEntries = entries.filter((_, idx) => {
                        const stepObj = flattenedSteps.find(
                            s => s.threadAuthorId === authorId && s.indexInThread === idx
                        );
                        return stepObj && stepObj.globalIndex <= currentStep;
                    });

                    if (revealedEntries.length === 0) return null;

                    return (
                        <Animated.View
                            key={authorId}
                            entering={FadeInUp.springify().damping(14)}
                            style={styles.storyCard}
                        >
                            {/* Card Decorative Accent */}
                            <View style={styles.cardAccentLine} />

                            <View style={styles.storyHeader}>
                                <AvatarCircle
                                    name={originalAuthor?.name || 'Pessoa'}
                                    photoURL={originalAuthor?.photoURL}
                                    size={42}
                                />
                                <View style={styles.storyHeaderCopy}>
                                    <Text style={styles.storyTitle}>
                                        Cadeia de {originalAuthor?.name || 'alguém'}
                                    </Text>
                                    <Text style={styles.storyCaption}>Iniciou o telefone sem fio</Text>
                                </View>
                            </View>

                            <View style={styles.storyBody}>
                                {revealedEntries.map((entry, index) => {
                                    const isPhrase = entry.type === 'phrase';
                                    const isOriginalPhrase = isPhrase && entry.turn === 1;
                                    const entryTypeLabel = isOriginalPhrase 
                                        ? 'Frase Original' 
                                        : isPhrase 
                                            ? 'Interpretação' 
                                            : 'Desenho';
                                    const contributor = playerById[entry.authorId];

                                    return (
                                        <Animated.View
                                            key={`${entry.turn}-${index}`}
                                            entering={FadeInUp.springify().damping(12)}
                                            style={styles.entryBlock}
                                        >
                                            {/* Connector Line linking cards */}
                                            {index > 0 && <View style={styles.connectorLine} />}

                                            <View style={styles.entryCardContainer}>
                                                <View style={styles.entryMeta}>
                                                    <AvatarCircle
                                                        name={contributor?.name || '?'}
                                                        photoURL={contributor?.photoURL}
                                                        size={32}
                                                    />
                                                    <View style={styles.entryMetaText}>
                                                        <Text style={styles.entryContributorName}>
                                                            {contributor?.name || 'Jogador'}
                                                        </Text>
                                                        <Text style={[
                                                            styles.entryType, 
                                                            isOriginalPhrase && styles.entryTypeOriginal
                                                        ]}>
                                                            {entryTypeLabel} • Turno {entry.turn}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {isPhrase ? (
                                                    <View style={styles.phraseBubble}>
                                                        <Text style={styles.phraseText}>
                                                            “{entry.text}”
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <View style={styles.drawingOuterFrame}>
                                                        <View style={styles.drawingFrameHeader}>
                                                            <View style={styles.artDot} />
                                                            <View style={styles.artDot} />
                                                            <View style={styles.artDot} />
                                                        </View>
                                                        {renderDrawingEntry(entry)}
                                                    </View>
                                                )}
                                            </View>
                                        </Animated.View>
                                    );
                                })}
                            </View>
                        </Animated.View>
                    );
                })}
            </ScrollView>

            {/* Bottom Vignette */}
            <LinearGradient
                colors={['transparent', '#090514']}
                style={styles.bottomVignette}
                pointerEvents="none"
            />

            {/* Footer Control Panel */}
            <View style={styles.footer}>
                {currentStep < totalSteps ? (
                    <TouchableOpacity 
                        style={styles.nextStepButton} 
                        onPress={handleNextStep} 
                        activeOpacity={0.88}
                    >
                        <LinearGradient 
                            colors={['#8B5CF6', '#7C3AED']} 
                            start={{ x: 0, y: 0 }} 
                            end={{ x: 1, y: 0 }}
                            style={styles.btnGradient}
                        >
                            <Text style={styles.btnText}>Revelar Próximo Passo</Text>
                            <ChevronRight size={20} color="#FFFFFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                ) : !isHost ? (
                    <View style={styles.waitingContainer}>
                        <ActivityIndicator size="small" color="#A78BFA" />
                        <Text style={styles.waitingText}>Aguardando o host encerrar a sala...</Text>
                    </View>
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
        backgroundColor: '#090514',
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
    entryBlock: {
        width: '100%',
    },
    connectorLine: {
        width: 3,
        height: 28,
        backgroundColor: '#8B5CF6',
        alignSelf: 'center',
        opacity: 0.5,
        marginVertical: 4,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
    },
    entryCardContainer: {
        backgroundColor: 'rgba(30, 25, 50, 0.65)',
        borderColor: 'rgba(168, 85, 247, 0.22)',
        borderWidth: 1,
        borderRadius: 20,
        padding: 16,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 4,
    },
    entryMeta: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    entryMetaText: {
        flex: 1,
    },
    entryContributorName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    entryType: {
        fontSize: 11,
        fontWeight: '600',
        color: '#A78BFA',
        marginTop: 1,
    },
    entryTypeOriginal: {
        color: '#FBBF24',
    },
    phraseBubble: {
        padding: 18,
        borderRadius: 16,
        backgroundColor: 'rgba(139, 92, 246, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.18)',
    },
    phraseText: {
        fontSize: 19,
        lineHeight: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    drawingOuterFrame: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.25)',
        backgroundColor: '#0A0515',
        overflow: 'hidden',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
    },
    drawingFrameHeader: {
        height: 28,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderBottomWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    artDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    drawingFrame: {
        width: '100%',
        aspectRatio: 0.76,
        backgroundColor: '#0F172A',
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
