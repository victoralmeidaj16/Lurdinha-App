import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { colors, shadows } from '../theme';

/**
 * NetworkRetry — Tela de erro de rede com retry automático.
 * Exibe quando uma chamada ao Firebase/API falha por problemas de conexão.
 * 
 * Props:
 *   onRetry     — Função de callback para tentar novamente
 *   message     — Mensagem customizada (opcional)
 *   loading     — Se está carregando (disable button)
 *   compact     — Se true, exibe versão inline/compacta
 * 
 * Uso:
 *   <NetworkRetry onRetry={loadData} />
 *   <NetworkRetry onRetry={loadData} compact message="Erro ao carregar grupos" />
 */
export default function NetworkRetry({
    onRetry,
    message,
    loading = false,
    compact = false
}) {
    if (compact) {
        return (
            <View style={styles.compactContainer}>
                <WifiOff size={16} color={colors.textMuted} />
                <Text style={styles.compactMessage}>
                    {message || 'Falha na conexão'}
                </Text>
                <TouchableOpacity
                    onPress={onRetry}
                    disabled={loading}
                    style={styles.compactButton}
                    activeOpacity={0.7}
                >
                    <RefreshCw size={14} color={colors.primary} />
                    <Text style={styles.compactButtonText}>
                        {loading ? 'Tentando...' : 'Tentar'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <WifiOff size={40} color={colors.textMuted} />
                </View>

                <Text style={styles.title}>Sem conexão</Text>
                <Text style={styles.message}>
                    {message || 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'}
                </Text>

                <TouchableOpacity
                    style={[styles.retryButton, loading && styles.retryButtonDisabled]}
                    onPress={onRetry}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <RefreshCw size={18} color="#FFFFFF" />
                    <Text style={styles.retryText}>
                        {loading ? 'Reconectando...' : 'Tentar Novamente'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // Full screen layout
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
        maxWidth: 300,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 16,
        ...shadows.primary,
    },
    retryButtonDisabled: {
        opacity: 0.5,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

    // Compact inline layout
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginVertical: 8,
    },
    compactMessage: {
        flex: 1,
        fontSize: 13,
        color: colors.textMuted,
    },
    compactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    compactButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
    },
});
