import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, Sparkles, ChevronLeft, LockKeyhole, ArrowRight } from 'lucide-react-native';
import { colors } from '../../theme';

export default function ImpostorRoleScreen({ route, navigation }) {
    const { gameState } = route.params;
    const [showRole, setShowRole] = useState(false);
    const [hasViewed, setHasViewed] = useState(false);

    useEffect(() => {
        setShowRole(false);
        setHasViewed(false);
    }, [gameState.currentPlayerIndex]);

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const isImpostor = currentPlayer.id === gameState.impostorId;
    const isLastPlayer = gameState.currentPlayerIndex === gameState.players.length - 1;
    const nextPlayer = isLastPlayer ? null : gameState.players[gameState.currentPlayerIndex + 1];
    const progress = (gameState.currentPlayerIndex + 1) / gameState.players.length;
    const shouldShowCategory = !gameState.hideCategory;

    const handleNext = () => {
        if (isLastPlayer) {
            navigation.replace('ImpostorGame', { gameState });
        } else {
            const nextGameState = {
                ...gameState,
                currentPlayerIndex: gameState.currentPlayerIndex + 1,
            };
            navigation.replace('ImpostorRole', { gameState: nextGameState });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('ImpostorLobby')} style={styles.backButton} activeOpacity={0.78}>
                    <ChevronLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Carta secreta</Text>
                    <Text style={styles.progressText}>
                        Jogador {gameState.currentPlayerIndex + 1} de {gameState.players.length}
                    </Text>
                </View>
                <View style={styles.progressPill}>
                    <Text style={styles.progressPillText}>{Math.round(progress * 100)}%</Text>
                </View>
            </View>

            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>

            <View style={styles.content}>
                <TouchableOpacity
                    style={[styles.revealArea, showRole && styles.revealAreaActive]}
                    onPressIn={() => {
                        setShowRole(true);
                        setHasViewed(true);
                    }}
                    onPressOut={() => setShowRole(false)}
                    activeOpacity={1}
                >
                    <View style={styles.cardTopBar}>
                        <View style={styles.cardBadge}>
                            <LockKeyhole size={13} color={colors.primaryLight} />
                            <Text style={styles.cardBadgeText}>Privado</Text>
                        </View>
                        <Text style={styles.cardStep}>{gameState.currentPlayerIndex + 1}/{gameState.players.length}</Text>
                    </View>

                    {showRole ? (
                        <View style={styles.roleContent}>
                            {isImpostor ? (
                                <>
                                    <View style={[styles.roleIconWrap, styles.impostorIconWrap]}>
                                        <AlertCircle size={46} color="#FCA5A5" />
                                    </View>
                                    <Text style={[styles.roleTitle, styles.impostorTitle]}>Você é o Impostor</Text>
                                    {shouldShowCategory && (
                                        <Text style={styles.roleSub}>Categoria: {gameState.category}</Text>
                                    )}
                                    <Text style={styles.roleDesc}>
                                        Guarde seu papel em segredo até todos terminarem de ver suas cartas.
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <View style={styles.roleIconWrap}>
                                        <Sparkles size={46} color={colors.primaryLight} />
                                    </View>
                                    <Text style={styles.roleTitle}>Você sabe a palavra</Text>
                                    {shouldShowCategory && (
                                        <Text style={styles.roleSub}>Categoria: {gameState.category}</Text>
                                    )}
                                    <View style={styles.wordBox}>
                                        <Text style={styles.secretWord}>{gameState.secretWord}</Text>
                                    </View>
                                    <Text style={styles.roleDesc}>
                                        Guarde a palavra em segredo até todos terminarem de ver suas cartas.
                                    </Text>
                                </>
                            )}
                        </View>
                    ) : (
                        <View style={styles.roleContent}>
                            <LinearGradient
                                colors={[colors.primaryAlpha20, 'rgba(139,92,246,0.04)']}
                                style={styles.logoShell}
                            >
                                <Image
                                    source={require('../../../assets/logo.png')}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </LinearGradient>
                            <Text style={styles.cardPlayerName}>{currentPlayer.name}</Text>
                            <Text style={styles.pressAndHold}>
                                Pressione e segure para revelar sua carta
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.nextButton, (!hasViewed || showRole) && styles.disabledButton]}
                    onPress={handleNext}
                    disabled={!hasViewed || showRole}
                    activeOpacity={0.86}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.nextGradient}
                    >
                        <Text style={styles.nextButtonText}>
                            {isLastPlayer ? 'Revelar Resultado' : `Passar para ${nextPlayer.name}`}
                        </Text>
                        <ArrowRight size={19} color="#FFFFFF" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#101014',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 16,
        gap: 14,
    },
    backButton: {
        width: 50,
        height: 50,
        borderRadius: 18,
        backgroundColor: '#232326',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '900',
    },
    progressText: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 13,
        fontWeight: '700',
        marginTop: 3,
    },
    progressPill: {
        height: 38,
        borderRadius: 19,
        backgroundColor: colors.primaryAlpha12,
        borderWidth: 1,
        borderColor: colors.primaryAlpha20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    progressPillText: {
        color: colors.primaryLight,
        fontSize: 13,
        fontWeight: '900',
    },
    progressTrack: {
        height: 5,
        marginHorizontal: 20,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.07)',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: colors.primary,
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    revealArea: {
        width: '100%',
        minHeight: 430,
        backgroundColor: '#18181D',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.16)',
        padding: 18,
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    revealAreaActive: {
        borderColor: colors.primaryAlpha30,
        backgroundColor: '#1A1721',
    },
    cardTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.primaryAlpha12,
        borderWidth: 1,
        borderColor: colors.primaryAlpha20,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    cardBadgeText: {
        color: colors.primaryLight,
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    cardStep: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 13,
        fontWeight: '800',
    },
    roleContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    logoShell: {
        width: 112,
        height: 112,
        borderRadius: 56,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.primaryAlpha20,
        marginBottom: 22,
    },
    logoImage: {
        width: 66,
        height: 66,
    },
    cardPlayerName: {
        fontSize: 34,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 14,
        textAlign: 'center',
    },
    pressAndHold: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.58)',
        textAlign: 'center',
        fontWeight: '700',
        lineHeight: 23,
        maxWidth: 260,
    },
    roleIconWrap: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: colors.primaryAlpha12,
        borderWidth: 1,
        borderColor: colors.primaryAlpha20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    impostorIconWrap: {
        backgroundColor: 'rgba(248,113,113,0.12)',
        borderColor: 'rgba(248,113,113,0.2)',
    },
    roleTitle: {
        fontSize: 30,
        fontWeight: '900',
        marginBottom: 10,
        textAlign: 'center',
        color: colors.primaryLight,
    },
    impostorTitle: {
        color: '#FCA5A5',
    },
    roleSub: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.52)',
        marginBottom: 16,
        fontWeight: '800',
    },
    wordBox: {
        backgroundColor: '#101014',
        paddingHorizontal: 22,
        paddingVertical: 14,
        borderRadius: 20,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: colors.primaryAlpha20,
        maxWidth: '100%',
    },
    secretWord: {
        fontSize: 29,
        fontWeight: '900',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    roleDesc: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.72)',
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '600',
        maxWidth: 290,
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 18,
    },
    nextButton: {
        borderRadius: 22,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.24,
        shadowRadius: 18,
        elevation: 8,
    },
    nextGradient: {
        minHeight: 62,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    disabledButton: {
        opacity: 0.34,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '900',
        textAlign: 'center',
    },
});
