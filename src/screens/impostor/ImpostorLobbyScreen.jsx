import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Plus, Minus, User, Play, ChevronLeft } from 'lucide-react-native';
import { colors } from '../../theme';
import { IMPOSTOR_CATEGORIES, getRandomWord } from '../../utils/impostorWords';

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 8; // Extending to 8 just to be safe, but default is 4

export default function ImpostorLobbyScreen({ navigation }) {
    const [players, setPlayers] = useState([
        { id: 1, name: 'Jogador 1' },
        { id: 2, name: 'Jogador 2' },
        { id: 3, name: 'Jogador 3' },
        { id: 4, name: 'Jogador 4' },
    ]);
    const [selectedCategory, setSelectedCategory] = useState('Aleatória');

    const allCategories = ['Aleatória', ...IMPOSTOR_CATEGORIES.map(c => c.category)];

    const addPlayer = () => {
        if (players.length < MAX_PLAYERS) {
            setPlayers([
                ...players,
                { id: Date.now(), name: `Jogador ${players.length + 1}` },
            ]);
        }
    };

    const removePlayer = (id) => {
        if (players.length > MIN_PLAYERS) {
            setPlayers(players.filter(p => p.id !== id));
        }
    };

    const updatePlayerName = (id, newName) => {
        setPlayers(players.map(p => p.id === id ? { ...p, name: newName } : p));
    };

    const startGame = () => {
        // Basic validation
        if (players.some(p => p.name.trim() === '')) {
            alert('Todos os jogadores precisam ter um nome!');
            return;
        }

        // 1. Sort Impostor
        const impostorIndex = Math.floor(Math.random() * players.length);
        const impostor = players[impostorIndex];

        // 2. Sort Word
        const { category, word } = getRandomWord(selectedCategory);

        // 3. Prepare game state
        const gameState = {
            players,
            impostorId: impostor.id,
            category,
            secretWord: word,
            currentPlayerIndex: 0,
            turnOrder: [...players].sort(() => Math.random() - 0.5), // Randomize turn order
            hints: {}, // { playerId: "hint" }
        };

        // 4. Navigate to standard Roles Screen
        navigation.navigate('ImpostorRole', { gameState });
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : null}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Lobby do Impostor</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.sectionTitle}>Categoria da Palavra</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryScroll}
                    >
                        {allCategories.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setSelectedCategory(cat)}
                                style={[
                                    styles.categoryPill,
                                    selectedCategory === cat && styles.categoryPillActive
                                ]}
                            >
                                <Text style={[
                                    styles.categoryPillText,
                                    selectedCategory === cat && styles.categoryPillTextActive
                                ]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Jogadores</Text>
                    <Text style={styles.subtitle}>
                        Adicione de {MIN_PLAYERS} a {MAX_PLAYERS} jogadores. Um de vocês será o impostor.
                    </Text>

                    {players.map((player, index) => (
                        <View key={player.id} style={styles.playerInputRow}>
                            <View style={styles.avatarIcon}>
                                <User size={20} color={colors.primary} />
                            </View>
                            <TextInput
                                style={styles.input}
                                value={player.name}
                                onChangeText={(text) => updatePlayerName(player.id, text)}
                                onFocus={() => {
                                    if (player.name.startsWith('Jogador ')) {
                                        updatePlayerName(player.id, '');
                                    }
                                }}
                                onBlur={() => {
                                    if (player.name.trim() === '') {
                                        updatePlayerName(player.id, `Jogador ${index + 1}`);
                                    }
                                }}
                                placeholder={`Nome do Jogador ${index + 1}`}
                                placeholderTextColor={colors.textMuted}
                                maxLength={15}
                            />
                            {players.length > MIN_PLAYERS && (
                                <TouchableOpacity
                                    onPress={() => removePlayer(player.id)}
                                    style={styles.removeButton}
                                >
                                    <Minus size={20} color={colors.error} />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}

                    {players.length < MAX_PLAYERS && (
                        <TouchableOpacity onPress={addPlayer} style={styles.addButton}>
                            <Plus size={20} color={colors.primary} />
                            <Text style={styles.addButtonText}>Adicionar Jogador</Text>
                        </TouchableOpacity>
                    )}

                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.startButton, players.length < MIN_PLAYERS && styles.disabledButton]}
                        onPress={startGame}
                        disabled={players.length < MIN_PLAYERS}
                    >
                        <Text style={styles.startButtonText}>Iniciar Jogo</Text>
                        <Play size={20} color={colors.background} fill={colors.background} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    content: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 12,
    },
    categoryScroll: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    categoryPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.surfaceLight,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: 8,
    },
    categoryPillActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    categoryPillText: {
        color: colors.textSecondary,
        fontWeight: '600',
    },
    categoryPillTextActive: {
        color: colors.textPrimary,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
        color: colors.textMuted,
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 22,
    },
    playerInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceLight,
        borderRadius: 12,
        marginBottom: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: colors.border || 'rgba(255,255,255,0.08)',
    },
    avatarIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primaryAlpha20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: 18,
        paddingVertical: 20,
    },
    removeButton: {
        padding: 8,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.primaryAlpha20,
        borderStyle: 'dashed',
        marginTop: 8,
    },
    addButtonText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
    },
    startButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 16,
        gap: 8,
    },
    disabledButton: {
        opacity: 0.5,
    },
    startButtonText: {
        color: colors.background,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
