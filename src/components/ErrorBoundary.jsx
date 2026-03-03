import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { colors, shadows } from '../theme';

/**
 * ErrorBoundary — Captura erros de renderização em componentes filhos.
 * Exibe uma tela amigável com opção de retry em vez de crashar o app.
 * 
 * Uso:
 *   <ErrorBoundary>
 *     <SeuComponente />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log para debug (pode integrar com Sentry/Crashlytics futuramente)
        console.error('[ErrorBoundary] Erro capturado:', error);
        console.error('[ErrorBoundary] Info:', errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <View style={styles.content}>
                        <View style={styles.iconContainer}>
                            <AlertTriangle size={48} color={colors.warning} />
                        </View>

                        <Text style={styles.title}>Algo deu errado</Text>
                        <Text style={styles.message}>
                            {this.props.fallbackMessage ||
                                'Ocorreu um erro inesperado. Tente novamente.'}
                        </Text>

                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={this.handleRetry}
                            activeOpacity={0.8}
                        >
                            <RefreshCw size={18} color="#FFFFFF" />
                            <Text style={styles.retryText}>Tentar Novamente</Text>
                        </TouchableOpacity>

                        {__DEV__ && this.state.error && (
                            <Text style={styles.debugText}>
                                {this.state.error.toString()}
                            </Text>
                        )}
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
        maxWidth: 320,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 193, 7, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
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
    retryText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    debugText: {
        marginTop: 24,
        fontSize: 11,
        color: colors.error,
        fontFamily: 'Courier',
        textAlign: 'center',
        opacity: 0.7,
    },
});
