import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Hash, ArrowRight, Sparkles } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Header from '../../components/Header';
import { useGame } from '../../hooks/useGame';

export default function CreateRoomScreen({ navigation }) {
    const { createRoom, loading, error } = useGame();

    const [timePerRound, setTimePerRound] = useState(20);
    const [totalRounds, setTotalRounds] = useState(5);
    const [theme, setTheme] = useState('');

    const handleCreate = async () => {
        try {
            await createRoom({
                timePerRound,
                totalRounds,
                theme: theme.trim() || 'Geral'
            });

            // Navigation is handled by the hook or we can do it here if hook returns roomId
            // In our hook implementation, createRoom returns roomId, but we need to catch it here
            // The previous implementation had navigation.replace inside handleCreate, let's keep it consistent
            // Wait, looking at previous code, I did: const roomId = await createRoom(...); navigation.replace(...)
            // So I should do that here too.
        } catch (err) {
            console.error(err);
        }
    };

    // Wrapper to handle the async result correctly since I can't see the hook's exact return right now but I recall it returns roomId
    const onCreatePress = async () => {
        try {
            const roomId = await createRoom({
                timePerRound,
                totalRounds,
                theme: theme.trim() || 'Geral'
            });
            if (roomId) {
                navigation.replace('Lobby', { roomId });
            }
        } catch (err) {
            // Error handled by hook state
        }
    };

    const OptionButton = ({ label, value, selected, onPress, delay }) => (
        <Animated.View entering={FadeInDown.delay(delay).springify()}>
            <TouchableOpacity
                style={[
                    styles.optionButton,
                    selected && styles.optionButtonSelected
                ]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <Text style={[
                    styles.optionText,
                    selected && styles.optionTextSelected
                ]}>{label}</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#4c1d95', '#2e1065']}
                style={styles.background}
            />

            <Header title="Criar Sala" transparent onBack={() => navigation.goBack()} />

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>

                <Animated.View entering={FadeInUp.delay(200)} style={styles.headerSection}>
                    <Text style={styles.headerTitle}>Personalize o Jogo</Text>
                    <Text style={styles.headerSubtitle}>Defina as regras para a sua galera.</Text>
                </Animated.View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Clock size={20} color="#a78bfa" />
                        <Text style={styles.sectionTitle}>Tempo para responder</Text>
                    </View>
                    <View style={styles.optionsRow}>
                        {[15, 20, 30, 45, 60].map((time, index) => (
                            <OptionButton
                                key={time}
                                label={`${time}s`}
                                value={time}
                                selected={timePerRound === time}
                                onPress={() => setTimePerRound(time)}
                                delay={300 + (index * 50)}
                            />
                        ))}
                    </View>
                    <Text style={styles.helperText}>
                        {timePerRound < 20 ? 'Rápido! Para quem pensa ágil.' : 'Mais tempo para pensar em estratégias.'}
                    </Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Hash size={20} color="#a78bfa" />
                        <Text style={styles.sectionTitle}>Quantidade de rodadas</Text>
                    </View>
                    <View style={styles.optionsRow}>
                        {[3, 5, 7, 10, 15].map((rounds, index) => (
                            <OptionButton
                                key={rounds}
                                label={`${rounds}`}
                                value={rounds}
                                selected={totalRounds === rounds}
                                onPress={() => setTotalRounds(rounds)}
                                delay={500 + (index * 50)}
                            />
                        ))}
                    </View>
                </View>

                <Animated.View entering={FadeInDown.delay(700)} style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Sparkles size={20} color="#a78bfa" />
                        <Text style={styles.sectionTitle}>Tema (Opcional)</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        value={theme}
                        onChangeText={setTheme}
                        placeholder="Ex: Filmes, Polêmica, Trabalho..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                    />
                    <Text style={styles.helperText}>
                        Ajuda os jogadores a saberem o que esperar.
                    </Text>
                </Animated.View>

                {error && (
                    <Animated.View entering={FadeInDown} style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </Animated.View>
                )}
            </ScrollView>

            <Animated.View entering={FadeInUp.delay(900)} style={styles.footer}>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={onCreatePress}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#8b5cf6', '#7c3aed']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.createButtonText}>Criar Sala</Text>
                                <ArrowRight size={24} color="#fff" />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
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
        paddingTop: 20,
    },
    headerSection: {
        marginBottom: 40,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    optionsRow: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
    },
    optionButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        minWidth: 60,
        alignItems: 'center',
    },
    optionButtonSelected: {
        backgroundColor: '#8b5cf6',
        borderColor: '#8b5cf6',
        transform: [{ scale: 1.05 }],
    },
    optionText: {
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '600',
        fontSize: 16,
    },
    optionTextSelected: {
        color: '#fff',
        fontWeight: '700',
    },
    helperText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginTop: 12,
        marginLeft: 4,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 16,
        color: '#fff',
        fontSize: 16,
    },
    errorContainer: {
        padding: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        marginBottom: 20,
    },
    errorText: {
        color: '#ef4444',
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 40,
        backgroundColor: 'rgba(46, 16, 101, 0.8)', // Semi-transparent background for footer
    },
    createButton: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#8b5cf6',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    gradientButton: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
});
