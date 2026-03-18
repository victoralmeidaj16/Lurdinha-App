import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { Users, AlertCircle, Sparkles, ChevronLeft, Home } from 'lucide-react-native';
import { colors } from '../../theme';

export default function ImpostorGameScreen({ route, navigation }) {
    const { gameState } = route.params;
    const [isRevealed, setIsRevealed] = useState(false);

    const impostor = gameState.players.find(p => p.id === gameState.impostorId);

    const handleExit = () => {
        navigation.navigate('ImpostorLobby');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleExit} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Jogo em Andamento</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {!isRevealed ? (
                    <>
                        <View style={styles.gameInfoCard}>
                            <Users size={64} color={colors.primary} style={{ marginBottom: 24 }} />
                            <Text style={styles.gameStatusTitle}>A rodada começou!</Text>
                            <Text style={styles.gameStatusDesc}>
                                Falem suas dicas em voz alta, seguindo a ordem dos jogadores.
                                Tentem descobrir quem é o impostor!
                            </Text>
                            <View style={styles.categoryContainer}>
                                <Text style={styles.categoryLabel}>Categoria:</Text>
                                <Text style={styles.categoryValue}>{gameState.category}</Text>
                            </View>
                        </View>

                        <Text style={styles.waitingText}>
                            Quando terminarem de debater e votar...
                        </Text>
                    </>
                ) : (
                    <View style={styles.revealCard}>
                        <AlertCircle size={80} color={colors.error} style={{ marginBottom: 20 }} />
                        <Text style={styles.revealTitle}>O IMPOSTOR ERA:</Text>
                        <Text style={styles.impostorName}>{impostor.name}</Text>

                        <View style={styles.separator} />

                        <View style={styles.wordResultContainer}>
                            <Sparkles size={24} color={colors.primary} />
                            <Text style={styles.wordResultLabel}>A palavra era:</Text>
                            <Text style={styles.wordResultValue}>{gameState.secretWord}</Text>
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                {!isRevealed ? (
                    <TouchableOpacity
                        style={styles.revealButton}
                        onPress={() => setIsRevealed(true)}
                    >
                        <Text style={styles.revealButtonText}>Revelar Impostor</Text>
                        <AlertCircle size={24} color={colors.background} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.exitButton}
                        onPress={handleExit}
                    >
                        <Home size={24} color={colors.textPrimary} />
                        <Text style={styles.exitButtonText}>Voltar ao Menu</Text>
                    </TouchableOpacity>
                )}
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
        padding: 16,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gameInfoCard: {
        width: '100%',
        backgroundColor: colors.surfaceLight,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border || 'rgba(255,255,255,0.08)',
    },
    gameStatusTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: colors.textPrimary,
        marginBottom: 16,
        textAlign: 'center',
    },
    gameStatusDesc: {
        fontSize: 18,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 28,
        marginBottom: 32,
    },
    categoryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 16,
    },
    categoryLabel: {
        color: colors.textMuted,
        marginRight: 8,
        fontWeight: '600',
    },
    categoryValue: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 18,
    },
    waitingText: {
        marginTop: 40,
        color: colors.textMuted,
        fontSize: 16,
        fontWeight: '600',
    },
    revealCard: {
        width: '100%',
        backgroundColor: colors.surfaceLight,
        borderRadius: 32,
        padding: 40,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.error,
    },
    revealTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: 2,
        marginBottom: 8,
    },
    impostorName: {
        fontSize: 40,
        fontWeight: '900',
        color: colors.error,
        textAlign: 'center',
        marginBottom: 24,
    },
    separator: {
        width: '60%',
        height: 1,
        backgroundColor: colors.border || 'rgba(255,255,255,0.08)',
        marginBottom: 24,
    },
    wordResultContainer: {
        alignItems: 'center',
    },
    wordResultLabel: {
        color: colors.textSecondary,
        fontSize: 14,
        marginBottom: 4,
    },
    wordResultValue: {
        color: colors.textPrimary,
        fontSize: 28,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    footer: {
        padding: 24,
    },
    revealButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 20,
        gap: 12,
    },
    revealButtonText: {
        color: colors.background,
        fontSize: 22,
        fontWeight: '900',
    },
    exitButton: {
        borderWidth: 2,
        borderColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 18,
        gap: 12,
    },
    exitButtonText: {
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
