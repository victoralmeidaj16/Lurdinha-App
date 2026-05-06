import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

export default function LiveConnectionModal({ status, message, onLeave }) {
    const isError = status === 'error';
    const isVisible = status === 'reconnecting' || isError;

    return (
        <Modal visible={isVisible} transparent animationType="fade">
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <View style={[styles.iconShell, isError && styles.iconShellError]}>
                        {isError ? (
                            <AlertCircle size={28} color="#FCA5A5" />
                        ) : (
                            <ActivityIndicator color="#FFFFFF" />
                        )}
                    </View>

                    <Text style={styles.title}>
                        {isError ? 'Conexao instavel' : 'Tentando reconectar...'}
                    </Text>
                    <Text style={styles.description}>
                        {message || (
                            isError
                                ? 'Nao foi possivel manter a conexao com a sala.'
                                : 'A partida continua aberta. Assim que a conexao voltar, o jogo atualiza sozinho.'
                        )}
                    </Text>

                    {isError && onLeave && (
                        <TouchableOpacity style={styles.button} onPress={onLeave} activeOpacity={0.85}>
                            <Text style={styles.buttonText}>Voltar para salas</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: 'rgba(5, 8, 18, 0.62)',
    },
    card: {
        width: '100%',
        maxWidth: 360,
        alignItems: 'center',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
    },
    iconShell: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        backgroundColor: 'rgba(139, 92, 246, 0.24)',
    },
    iconShellError: {
        backgroundColor: 'rgba(239, 68, 68, 0.16)',
    },
    title: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 8,
    },
    description: {
        color: 'rgba(226, 232, 240, 0.78)',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    button: {
        marginTop: 20,
        minHeight: 46,
        paddingHorizontal: 18,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8B5CF6',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
});
