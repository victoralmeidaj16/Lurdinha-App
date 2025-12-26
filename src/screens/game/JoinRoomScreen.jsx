import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import Header from '../../components/Header';
import { useGame } from '../../hooks/useGame';

import * as Clipboard from 'expo-clipboard';

export default function JoinRoomScreen({ navigation }) {
    const { joinRoom, loading, error } = useGame();
    const [code, setCode] = useState('');

    const handleJoin = async () => {
        if (code.length !== 5) return;

        try {
            await joinRoom(code);
            navigation.replace('Lobby', { roomId: code });
        } catch (err) {
            // Error handled by hook
        }
    };

    const handlePaste = async () => {
        const text = await Clipboard.getStringAsync();
        if (text) {
            // Filter only numbers and slice
            const cleanText = text.replace(/[^0-9]/g, '').slice(0, 5);
            setCode(cleanText);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#4c1d95', '#2e1065']}
                style={styles.background}
            />

            <Header title="Entrar na Sala" transparent onBack={() => navigation.goBack()} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.mainSection}>
                    <Text style={styles.label}>Digite o código da sala</Text>
                    <TextInput
                        style={styles.input}
                        value={code}
                        onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 5))}
                        placeholder="00000"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        keyboardType="number-pad"
                        maxLength={5}
                        autoFocus
                    />

                    <TouchableOpacity onPress={handlePaste} style={styles.pasteButton}>
                        <Text style={styles.pasteButtonText}>Colar código copiado</Text>
                    </TouchableOpacity>

                    <Text style={styles.helperText}>Peça o código de 5 dígitos para o host</Text>

                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.joinButton, code.length !== 5 && styles.joinButtonDisabled]}
                    onPress={handleJoin}
                    disabled={code.length !== 5 || loading}
                >
                    <LinearGradient
                        colors={code.length === 5 ? ['#8b5cf6', '#7c3aed'] : ['#4b5563', '#374151']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.joinButtonText}>Entrar</Text>
                                <ArrowRight size={20} color="#fff" />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2e1065',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
        paddingBottom: 40,
    },
    mainSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 18,
        color: '#e9d5ff',
        marginBottom: 24,
    },
    input: {
        fontSize: 48,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 8,
        textAlign: 'center',
        width: '100%',
        marginBottom: 16,
    },
    helperText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.4)',
    },
    errorContainer: {
        marginTop: 24,
        padding: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
    },
    errorText: {
        color: '#ef4444',
        textAlign: 'center',
    },
    joinButton: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#8b5cf6',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    joinButtonDisabled: {
        opacity: 0.7,
        shadowOpacity: 0,
    },
    gradientButton: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    joinButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    pasteButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 24,
    },
    pasteButtonText: {
        color: '#a78bfa',
        fontSize: 14,
        fontWeight: '600',
    },
});
