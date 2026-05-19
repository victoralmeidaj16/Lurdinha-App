import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, X } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../hooks/useGame';
import AvatarCircle from '../../components/AvatarCircle';
import { triggerImpact } from '../../utils/haptics';

const VIRTUAL_CANVAS_WIDTH = 320;
const VIRTUAL_CANVAS_HEIGHT = 420;

const renderDrawingEntry = (entry) => (
    <View style={[styles.drawingFrame, { backgroundColor: entry?.canvasFill || '#F8FAFC' }]}>
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
    const [gameState, setGameState] = React.useState(route.params?.gameState || null);
    const [currentStep, setCurrentStep] = React.useState(1);

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

    const totalSteps = useMemo(() => {
        return Object.values(threads).reduce((acc, curr) => acc + curr.length, 0);
    }, [threads]);

    const handleCloseRoom = async () => {
        if (!isHost) return;
        try {
            await nextRound(roomId, true);
        } catch (error) {
            console.error(error);
        }
    };

    const handleNextStep = () => {
        if (currentStep < totalSteps) {
            triggerImpact('medium');
            setCurrentStep(c => c + 1);
        }
    };

    let absoluteIndex = 0;

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0F172A', '#312E81', '#111827']} style={styles.background} />

            <View style={styles.header}>
                <View style={styles.brandAccentRow}>
                    <View style={styles.brandAccentGlow} />
                    <View style={styles.brandAccentLine} />
                </View>
                <View style={styles.headerTitleRow}>
                    <Eye size={28} color="#C4B5FD" />
                    <Text style={styles.headerTitle}>Revelação Final</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.subtitle}>
                    Acompanhe como a frase original foi distorcida a cada passo!
                </Text>

                {Object.keys(threads).map((authorId) => {
                    const originalAuthor = playerById[authorId];
                    const entries = threads[authorId] || [];
                    
                    const threadStartIndex = absoluteIndex;
                    if (currentStep <= threadStartIndex) return null;

                    return (
                        <Animated.View
                            key={authorId}
                            entering={FadeInUp.springify()}
                            style={styles.storyCard}
                        >
                            <View style={styles.cardAccentOrb} />
                            <View style={styles.storyHeader}>
                                <AvatarCircle
                                    name={originalAuthor?.name || 'Pessoa'}
                                    photoURL={originalAuthor?.photoURL}
                                    size={40}
                                />
                                <View style={styles.storyHeaderCopy}>
                                    <Text style={styles.storyTitle}>
                                        Cadeia de {originalAuthor?.name || 'alguém'}
                                    </Text>
                                    <Text style={styles.storySubtitle}>Perda total de contexto em câmera lenta.</Text>
                                </View>
                            </View>

                            <View style={styles.storyBody}>
                                {entries.map((entry, index) => {
                                    const entryAbsoluteIndex = threadStartIndex + 1 + index;
                                    absoluteIndex += 1;
                                    
                                    if (currentStep < entryAbsoluteIndex) return null;

                                    const contributor = playerById[entry.authorId];
                                    const isPhrase = entry.type === 'phrase';
                                    const isOriginalPhrase = isPhrase && entry.turn === 1;
                                    const entryTypeLabel = isOriginalPhrase ? 'Frase original' : isPhrase ? 'Interpretação' : 'Desenho';

                                    return (
                                        <Animated.View
                                            key={`${entry.turn}-${index}`}
                                            entering={FadeInUp.springify()}
                                            style={styles.entryBlock}
                                        >
                                            <View style={styles.entryMeta}>
                                                <Text style={styles.entryStep}>Passo {entry.turn}</Text>
                                                <Text style={[styles.entryType, isOriginalPhrase && styles.entryTypeOriginal]}>{entryTypeLabel}</Text>
                                                <Text style={styles.entryContributor}>{contributor?.name || 'Pessoa'}</Text>
                                            </View>

                                            {isPhrase ? (
                                                <View style={styles.phraseBubble}>
                                                    <Text style={styles.phraseText}>{entry.text}</Text>
                                                </View>
                                            ) : (
                                                renderDrawingEntry(entry)
                                            )}
                                        </Animated.View>
                                    );
                                })}
                            </View>
                        </Animated.View>
                    );
                })}
            </ScrollView>

            <View style={styles.footer}>
                {currentStep < totalSteps ? (
                    <TouchableOpacity style={styles.nextStepButton} onPress={handleNextStep} activeOpacity={0.85}>
                        <LinearGradient colors={['#A855F7', '#7E22CE']} style={styles.closeGradient}>
                            <Text style={styles.closeText}>Revelar Próximo Passo</Text>
                            <Eye size={18} color="#FFFFFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                ) : !isHost ? (
                    <Text style={styles.waitingText}>Aguardando o host fechar a sala.</Text>
                ) : (
                    <TouchableOpacity style={styles.closeButton} onPress={handleCloseRoom} activeOpacity={0.85}>
                        <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.closeGradient}>
                            <Text style={styles.closeText}>Encerrar sala</Text>
                            <X size={18} color="#FFFFFF" />
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
        backgroundColor: '#111827',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 18,
    },
    brandAccentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    brandAccentGlow: {
        width: 10,
        height: 10,
        borderRadius: 999,
        backgroundColor: '#A855F7',
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 5,
    },
    brandAccentLine: {
        width: 64,
        height: 4,
        borderRadius: 999,
        backgroundColor: '#8B5CF6',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 120,
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        color: '#DDD6FE',
        textAlign: 'center',
        marginBottom: 20,
    },
    storyCard: {
        marginBottom: 20,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#18181B',
        borderWidth: 1,
        borderColor: 'rgba(168,85,247,0.16)',
        position: 'relative',
    },
    cardAccentOrb: {
        position: 'absolute',
        right: -18,
        top: '50%',
        width: 76,
        height: 76,
        marginTop: -38,
        borderRadius: 38,
        backgroundColor: 'rgba(255,255,255,0.025)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    storyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        backgroundColor: 'rgba(168,85,247,0.12)',
    },
    storyHeaderCopy: {
        flex: 1,
    },
    storyTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    storySubtitle: {
        fontSize: 12,
        color: '#DDD6FE',
        marginTop: 2,
    },
    storyBody: {
        padding: 16,
        gap: 16,
    },
    entryBlock: {
        gap: 8,
    },
    entryMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
    },
    entryStep: {
        fontSize: 12,
        fontWeight: '800',
        color: '#E9D5FF',
    },
    entryType: {
        fontSize: 12,
        fontWeight: '700',
        color: '#C4B5FD',
    },
    entryTypeOriginal: {
        color: '#FDE68A',
    },
    entryContributor: {
        fontSize: 12,
        color: '#C4B5FD',
    },
    phraseBubble: {
        padding: 16,
        borderRadius: 18,
        backgroundColor: 'rgba(88,28,135,0.22)',
        borderWidth: 1,
        borderColor: 'rgba(196,181,253,0.12)',
    },
    phraseText: {
        fontSize: 18,
        lineHeight: 26,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    drawingFrame: {
        width: '100%',
        aspectRatio: 0.76,
        borderRadius: 18,
        overflow: 'hidden',
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: 20,
        paddingBottom: 34,
        backgroundColor: 'rgba(17,17,23,0.92)',
    },
    waitingText: {
        textAlign: 'center',
        color: '#C4B5FD',
        fontWeight: '600',
    },
    nextStepButton: {
        borderRadius: 18,
        overflow: 'hidden',
    },
    closeButton: {
        borderRadius: 18,
        overflow: 'hidden',
    },
    closeGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
    },
    closeText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});
