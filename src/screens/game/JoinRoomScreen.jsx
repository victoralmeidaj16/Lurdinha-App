import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import Header from '../../components/Header';
import LurdinhaBrandIcon from '../../components/LurdinhaBrandIcon';
import { useGame } from '../../hooks/useGame';

import * as Clipboard from 'expo-clipboard';
import { colors, typography } from '../../theme';
import AnimatedPressable from '../../components/AnimatedPressable';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { triggerImpact } from '../../utils/haptics';

function getRoomRoute(roomData) {
    const gameType = roomData?.settings?.gameType;
    if (roomData?.status === 'waiting') return 'Lobby';
    if (roomData?.status === 'party_transition') return 'RoundTransition';
    if (roomData?.status === 'playing') return gameType === 'draw' ? 'DrawGame' : 'Game';
    if (roomData?.status === 'round_results') {
        if (gameType === 'draw') return 'DrawRoundResult';
        if (gameType === 'telephone' || gameType === 'secret') return 'TelephoneResult';
        return 'RoundResult';
    }
    if (roomData?.status === 'finished') return 'FinalResult';
    return 'Lobby';
}

export default function JoinRoomScreen({ navigation, route }) {
    const { joinRoom, loading, error } = useGame();
    const [code, setCode] = useState(route.params?.roomId || '');
    const [detectedClipboardCode, setDetectedClipboardCode] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (route.params?.roomId) {
            setCode(route.params.roomId.slice(0, 5));
        }
    }, [route.params?.roomId]);

    useEffect(() => {
        const checkClipboard = async () => {
            try {
                const text = await Clipboard.getStringAsync();
                if (text) {
                    const cleanText = text.trim();
                    // Lurdinha room codes are exactly 5 digits (numbers only)
                    if (/^\d{5}$/.test(cleanText)) {
                        setDetectedClipboardCode(cleanText);
                    }
                }
            } catch (err) {
                console.warn('Erro ao ler clipboard:', err);
            }
        };

        const timer = setTimeout(checkClipboard, 500);
        return () => clearTimeout(timer);
    }, []);

    const handleJoin = async () => {
        if (code.length !== 5) return;

        try {
            const roomData = await joinRoom(code);
            navigation.replace(getRoomRoute(roomData), { roomId: code });
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
                colors={['#111016', '#161321', '#211245']}
                style={styles.background}
            />
            <View pointerEvents="none" style={styles.ambientGlowTop} />
            <View pointerEvents="none" style={styles.ambientGlowBottom} />

            <Header title="Entrar na Sala" transparent onBack={() => navigation.goBack()} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.mainSection}>
                    <View style={styles.heroTopRow}>
                        <LurdinhaBrandIcon size={62} />
                        <View style={styles.heroBadge}>
                            <View style={styles.heroBadgeDot} />
                            <Text style={styles.heroBadgeText}>Acesso rapido</Text>
                        </View>
                    </View>

                    <Text style={styles.label}>Digite o código da sala</Text>
                    <Text style={styles.subtitle}>
                        Entre direto pelo convite do host sem precisar criar uma nova sala.
                    </Text>

                    {detectedClipboardCode && detectedClipboardCode !== code && (
                        <Animated.View entering={FadeInDown.duration(240)} style={styles.clipboardBanner}>
                            <View style={styles.clipboardInfo}>
                                <Text style={styles.clipboardLabel}>Código copiado detectado</Text>
                                <Text style={styles.clipboardCodeText}>{detectedClipboardCode}</Text>
                            </View>
                            <View style={styles.clipboardActions}>
                                <AnimatedPressable
                                    onPress={() => {
                                        setCode(detectedClipboardCode);
                                        setDetectedClipboardCode(null);
                                    }}
                                    style={styles.clipboardUseBtn}
                                    haptic="medium"
                                >
                                    <Text style={styles.clipboardUseBtnText}>Colar</Text>
                                </AnimatedPressable>
                                <AnimatedPressable
                                    onPress={() => setDetectedClipboardCode(null)}
                                    style={styles.clipboardDiscardBtn}
                                    haptic="light"
                                >
                                    <Text style={styles.clipboardDiscardBtnText}>Ignorar</Text>
                                </AnimatedPressable>
                            </View>
                        </Animated.View>
                    )}

                    <View style={styles.codeCard}>
                        <View pointerEvents="none" style={styles.codeOrb} />
                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            value={code}
                            onChangeText={(text) => {
                                const clean = text.replace(/[^0-9]/g, '').slice(0, 5);
                                setCode(clean);
                                triggerImpact('light');
                                if (clean.length === 5) Keyboard.dismiss();
                            }}
                            placeholder="00000"
                            placeholderTextColor="rgba(255,255,255,0.18)"
                            keyboardType="number-pad"
                            maxLength={5}
                            autoFocus
                        />

                        <AnimatedPressable onPress={handlePaste} style={styles.pasteButton} haptic="light" activeScale={0.95}>
                            <Text style={styles.pasteButtonText}>Colar código copiado</Text>
                        </AnimatedPressable>

                        <Text style={styles.helperText}>Peça o código de 5 dígitos para o host</Text>

                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.footerShell}>
                    <AnimatedPressable
                        style={[styles.joinButton, code.length !== 5 && styles.joinButtonDisabled]}
                        onPress={handleJoin}
                        disabled={code.length !== 5 || loading}
                        haptic="medium"
                    >
                        <LinearGradient
                            colors={code.length === 5 ? ['#9B6BFF', '#7C3AED'] : ['#4b5563', '#374151']}
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
                    </AnimatedPressable>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111016',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    ambientGlowTop: {
        position: 'absolute',
        top: -60,
        right: -80,
        width: 320,
        height: 320,
        borderRadius: 160,
        backgroundColor: '#7C3AED',
        opacity: 0.08,
    },
    ambientGlowBottom: {
        position: 'absolute',
        left: -120,
        bottom: -60,
        width: 340,
        height: 340,
        borderRadius: 170,
        backgroundColor: '#FF6B35',
        opacity: 0.06,
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
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 18,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 8,
        backgroundColor: 'rgba(139,92,246,0.14)',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.22)',
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    heroBadgeDot: {
        width: 8,
        height: 8,
        borderRadius: 999,
        backgroundColor: '#A78BFA',
    },
    heroBadgeText: {
        color: '#C4B5FD',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    label: {
        fontSize: 34,
        lineHeight: 40,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
        color: 'rgba(255,255,255,0.56)',
        marginBottom: 26,
        maxWidth: 320,
    },
    codeCard: {
        backgroundColor: '#17171C',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.14)',
        padding: 24,
        overflow: 'hidden',
    },
    codeOrb: {
        position: 'absolute',
        right: -34,
        top: 28,
        width: 120,
        height: 120,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    input: {
        fontSize: 52,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 12,
        textAlign: 'center',
        width: '100%',
        marginBottom: 18,
    },
    helperText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.44)',
        textAlign: 'center',
    },
    errorContainer: {
        marginTop: 18,
        padding: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 14,
    },
    errorText: {
        color: '#fca5a5',
        textAlign: 'center',
    },
    footerShell: {
        paddingTop: 20,
    },
    joinButton: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.28,
        shadowRadius: 14,
        elevation: 8,
    },
    joinButtonDisabled: {
        opacity: 0.72,
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
        alignSelf: 'center',
        backgroundColor: 'rgba(139,92,246,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        marginBottom: 18,
    },
    pasteButtonText: {
        color: '#c4b5fd',
        fontSize: 14,
        fontWeight: '700',
    },
    clipboardBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(139,92,246,0.18)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.3)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 20,
        gap: 12,
    },
    clipboardInfo: {
        flex: 1,
    },
    clipboardLabel: {
        fontSize: 12,
        fontFamily: typography.fonts.medium,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 2,
    },
    clipboardCodeText: {
        fontSize: 16,
        fontFamily: typography.headingFonts.bold,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    clipboardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    clipboardUseBtn: {
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
    },
    clipboardUseBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontFamily: typography.fonts.bold,
    },
    clipboardDiscardBtn: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    clipboardDiscardBtnText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        fontFamily: typography.fonts.medium,
    },
});
