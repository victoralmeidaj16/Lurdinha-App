import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image,
} from 'react-native';
import { Eye, EyeOff, Users, AlertCircle, Sparkles, ChevronLeft } from 'lucide-react-native';
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

    const handleNext = () => {
        if (isLastPlayer) {
            // All have seen, start the round!
            navigation.replace('ImpostorGame', { gameState });
        } else {
            // Next player
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
                <TouchableOpacity onPress={() => navigation.navigate('ImpostorLobby')} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                        Jogador {gameState.currentPlayerIndex + 1} de {gameState.players.length}
                    </Text>
                </View>
                <View style={{ width: 40 }} />
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
                    {showRole ? (
                        <View style={styles.roleContent}>
                            {isImpostor ? (
                                <>
                                    <AlertCircle size={64} color={colors.error} style={{ marginBottom: 16 }} />
                                    <Text style={[styles.roleTitle, { color: colors.error }]}>VOCÊ É O IMPOSTOR!</Text>
                                    <Text style={styles.roleSub}>Categoria: {gameState.category}</Text>
                                    <Text style={styles.roleDesc}>
                                        Finja saber qual é a palavra e tente descobrir através das dicas dos outros!
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={64} color={colors.primary} style={{ marginBottom: 16 }} />
                                    <Text style={[styles.roleTitle, { color: colors.primary }]}>VOCÊ SABE A PALAVRA</Text>
                                    <Text style={styles.roleSub}>Categoria: {gameState.category}</Text>
                                    <View style={styles.wordBox}>
                                        <Text style={styles.secretWord}>{gameState.secretWord}</Text>
                                    </View>
                                    <Text style={styles.roleDesc}>
                                        Dê uma dica não muito óbvia para que o impostor não descubra.
                                    </Text>
                                </>
                            )}
                        </View>
                    ) : (
                        <View style={styles.roleContent}>
                            <View style={styles.avatarIcon}>
                                <Image
                                    source={require('../../../assets/logo.png')}
                                    style={{ width: 50, height: 50 }}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.cardPlayerName}>{currentPlayer.name}</Text>
                            <Text style={styles.pressAndHold}>
                                Pressione e segure para revelar sua carta secreta
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
                >
                    <Text style={styles.nextButtonText}>
                        {isLastPlayer ? 'Começar Rodada de Dicas' : `Passar para ${nextPlayer.name}`}
                    </Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    progressContainer: {
        alignItems: 'center',
    },
    progressText: {
        color: colors.textMuted,
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    cardPlayerName: {
        fontSize: 32,
        fontWeight: '900',
        color: colors.textPrimary,
        marginBottom: 24,
        textAlign: 'center',
    },
    revealArea: {
        width: '100%',
        minHeight: 320,
        backgroundColor: colors.surfaceLight,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: colors.border || 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    revealAreaActive: {
        borderColor: colors.primary,
        backgroundColor: colors.surfaceLight,
    },
    roleContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressAndHold: {
        fontSize: 20,
        color: colors.textSecondary,
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 28,
    },
    roleTitle: {
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 12,
        textAlign: 'center',
    },
    roleSub: {
        fontSize: 18,
        color: colors.textMuted,
        marginBottom: 16,
    },
    wordBox: {
        backgroundColor: colors.background,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.primaryAlpha20,
    },
    secretWord: {
        fontSize: 32,
        fontWeight: '900',
        color: colors.textPrimary,
        textTransform: 'uppercase',
    },
    roleDesc: {
        fontSize: 16,
        color: colors.textPrimary,
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        padding: 24,
    },
    nextButton: {
        backgroundColor: colors.primary,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.3,
    },
    nextButtonText: {
        color: colors.background,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
