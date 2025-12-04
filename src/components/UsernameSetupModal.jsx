import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { AtSign } from 'lucide-react-native';
import { useUserData } from '../hooks/useUserData';

export default function UsernameSetupModal({ visible, onSuccess }) {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { saveUsername } = useUserData();

    const handleSubmit = async () => {
        if (!username.trim()) {
            return setError('Por favor, escolha um nome de usuário');
        }

        if (username.trim().length < 3) {
            return setError('O usuário deve ter pelo menos 3 caracteres');
        }

        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username.trim())) {
            return setError('O usuário deve conter apenas letras, números e underline');
        }

        try {
            setError('');
            setLoading(true);
            await saveUsername(username.trim());
            if (onSuccess) {
                onSuccess();
            }
            // Modal will close automatically when parent component detects username in userData
        } catch (err) {
            setError(err.message || 'Erro ao salvar nome de usuário');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.emoji}>👋</Text>
                        <Text style={styles.title}>Bem-vindo(a)!</Text>
                        <Text style={styles.subtitle}>
                            Para continuar, escolha um nome de usuário único para seu perfil.
                        </Text>
                    </View>

                    {error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Nome de usuário</Text>
                        <View style={styles.inputWrapper}>
                            <AtSign size={20} color="#9ca3af" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={username}
                                onChangeText={(text) => {
                                    setUsername(text.toLowerCase());
                                    setError('');
                                }}
                                placeholder="seu_usuario"
                                placeholderTextColor="#52525b"
                                autoCapitalize="none"
                                autoCorrect={false}
                                maxLength={20}
                            />
                        </View>
                        <Text style={styles.helperText}>
                            Apenas letras, números e underline. Mínimo 3 caracteres.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.buttonText}>Continuar</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        padding: 24,
    },
    content: {
        backgroundColor: '#18181b', // Zinc-900
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#27272a', // Zinc-800
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    emoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#a1a1aa', // Zinc-400
        textAlign: 'center',
        lineHeight: 24,
    },
    errorContainer: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
    },
    errorText: {
        color: '#f87171',
        fontSize: 14,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#e4e4e7', // Zinc-200
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#09090b', // Zinc-950
        borderWidth: 1,
        borderColor: '#27272a', // Zinc-800
        borderRadius: 16,
        height: 56,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        color: '#ffffff',
        fontSize: 16,
    },
    helperText: {
        fontSize: 12,
        color: '#71717a', // Zinc-500
        marginTop: 8,
        marginLeft: 4,
    },
    button: {
        backgroundColor: '#8b5cf6', // Violet-500
        borderRadius: 16,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
