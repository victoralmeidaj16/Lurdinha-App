import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, Sparkles, X, Home, RefreshCw, Drama } from 'lucide-react-native';
import { colors } from '../../theme';
import LurdinhaBrandIcon from '../../components/LurdinhaBrandIcon';

export default function ImpostorGameScreen({ route, navigation }) {
    const { gameState } = route.params;
    const impostors = gameState.players.filter(p =>
        gameState.impostorIds
            ? gameState.impostorIds.includes(p.id)
            : p.id === gameState.impostorId
    );

    const handleExit = () => {
        Alert.alert(
            "Sair do jogo",
            "Você quer sair para a home mesmo?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Confirmar", style: "destructive", onPress: () => navigation.navigate('GameHome') }
            ]
        );
    };

    const handleBackToHome = () => {
        navigation.replace('MainTabs', { screen: 'home' });
    };

    const handlePlayAgain = () => {
        navigation.replace('ImpostorLobby', { previousPlayers: gameState.players });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleExit} style={styles.backButton} activeOpacity={0.78}>
                    <X size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerCopy}>
                    <Text style={styles.title}>Resultado</Text>
                    <Text style={styles.headerSubtitle}>Impostor revelado</Text>
                </View>
                <View style={styles.headerIconWrap}>
                    <Drama size={19} color={colors.primaryLight} />
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.revealCard}>
                    <View style={styles.brandBadge}>
                        <LurdinhaBrandIcon size={48} />
                    </View>

                    <View style={styles.resultIconWrap}>
                        <AlertCircle size={54} color="#FCA5A5" />
                    </View>

                    <Text style={styles.revealLabel}>
                        {impostors.length === 2 ? "Os impostores eram" : "O impostor era"}
                    </Text>
                    {impostors.map((imp) => (
                        <Text key={imp.id} style={styles.impostorName}>
                            {imp.name}
                        </Text>
                    ))}

                    <View style={styles.separator} />

                    <View style={styles.wordResultContainer}>
                        <View style={styles.wordIconWrap}>
                            <Sparkles size={20} color={colors.primaryLight} />
                        </View>
                        <Text style={styles.wordResultLabel}>Palavra secreta</Text>
                        <Text style={styles.wordResultValue}>{gameState.secretWord}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <View style={styles.revealedActions}>
                    <TouchableOpacity
                        style={styles.replayButton}
                        onPress={handlePlayAgain}
                        activeOpacity={0.86}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.primaryDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.replayGradient}
                        >
                            <RefreshCw size={21} color="#FFFFFF" />
                            <Text style={styles.replayButtonText}>Jogar de Novo</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.exitButton}
                        onPress={handleBackToHome}
                        activeOpacity={0.8}
                    >
                        <Home size={21} color="rgba(255,255,255,0.72)" />
                        <Text style={styles.exitButtonText}>Voltar ao Menu</Text>
                    </TouchableOpacity>
                </View>
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
        paddingBottom: 18,
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
    headerCopy: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 14,
        marginTop: 2,
        fontWeight: '600',
    },
    headerIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primaryAlpha12,
        borderWidth: 1,
        borderColor: colors.primaryAlpha20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    revealCard: {
        width: '100%',
        backgroundColor: '#18181D',
        borderRadius: 34,
        paddingHorizontal: 24,
        paddingVertical: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.16)',
    },
    brandBadge: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.primaryAlpha12,
        borderWidth: 1,
        borderColor: colors.primaryAlpha20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    resultIconWrap: {
        width: 94,
        height: 94,
        borderRadius: 47,
        backgroundColor: 'rgba(248,113,113,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(248,113,113,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 22,
    },
    revealLabel: {
        fontSize: 14,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.52)',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    impostorName: {
        fontSize: 40,
        fontWeight: '900',
        color: '#FCA5A5',
        textAlign: 'center',
    },
    separator: {
        width: '82%',
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginTop: 28,
        marginBottom: 24,
    },
    wordResultContainer: {
        alignItems: 'center',
        width: '100%',
    },
    wordIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: colors.primaryAlpha12,
        borderWidth: 1,
        borderColor: colors.primaryAlpha20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    wordResultLabel: {
        color: 'rgba(255,255,255,0.52)',
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 8,
    },
    wordResultValue: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '900',
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 6,
        paddingBottom: 18,
    },
    revealedActions: {
        gap: 12,
    },
    replayButton: {
        borderRadius: 22,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.24,
        shadowRadius: 18,
        elevation: 8,
    },
    replayGradient: {
        minHeight: 62,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
        gap: 10,
    },
    replayButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
    },
    exitButton: {
        minHeight: 58,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: '#18181D',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 10,
    },
    exitButtonText: {
        color: 'rgba(255,255,255,0.72)',
        fontSize: 16,
        fontWeight: '800',
    },
});
