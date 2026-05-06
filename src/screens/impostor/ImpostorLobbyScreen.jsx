import React, { useEffect, useRef, useState } from 'react';
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
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Minus, User, Play, ChevronLeft, Drama, Users, EyeOff } from 'lucide-react-native';
import { colors } from '../../theme';
import LurdinhaBrandIcon from '../../components/LurdinhaBrandIcon';
import { IMPOSTOR_CATEGORIES, getRandomWord } from '../../utils/impostorWords';

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 8;

export default function ImpostorLobbyScreen({ navigation, route }) {
    const previousPlayers = route?.params?.previousPlayers;
    const [players, setPlayers] = useState(
        previousPlayers && previousPlayers.length >= MIN_PLAYERS
            ? previousPlayers.map((p, i) => ({ id: p.id || Date.now() + i, name: p.name || `Jogador ${i + 1}` }))
            : [
                { id: 1, name: 'Jogador 1' },
                { id: 2, name: 'Jogador 2' },
                { id: 3, name: 'Jogador 3' },
                { id: 4, name: 'Jogador 4' },
            ]
    );
    const [selectedCategory, setSelectedCategory] = useState('Aleatória');
    const [hideCategory, setHideCategory] = useState(false);
    const inputRefs = useRef({});
    const pendingFocusPlayerId = useRef(null);

    const allCategories = ['Aleatória', ...IMPOSTOR_CATEGORIES.map(c => c.category)];

    const addPlayer = () => {
        if (players.length < MAX_PLAYERS) {
            const newPlayer = { id: Date.now(), name: `Jogador ${players.length + 1}` };
            setPlayers([...players, newPlayer]);
            return newPlayer.id;
        }

        return null;
    };

    const removePlayer = (id) => {
        if (players.length > MIN_PLAYERS) {
            setPlayers(players.filter(p => p.id !== id));
        }
    };

    const updatePlayerName = (id, newName) => {
        setPlayers(players.map(p => p.id === id ? { ...p, name: newName } : p));
    };

    const focusPlayerInput = (playerId) => {
        const input = inputRefs.current[playerId];
        if (input?.focus) {
            input.focus();
        }
    };

    const handleSubmitEditing = (index) => {
        const nextPlayer = players[index + 1];
        if (nextPlayer) {
            focusPlayerInput(nextPlayer.id);
            return;
        }

        if (players.length < MAX_PLAYERS) {
            const newPlayerId = addPlayer();
            pendingFocusPlayerId.current = newPlayerId;
        }
    };

    useEffect(() => {
        if (!pendingFocusPlayerId.current) {
            return;
        }

        const playerExists = players.some(player => player.id === pendingFocusPlayerId.current);
        if (!playerExists) {
            return;
        }

        const timeoutId = setTimeout(() => {
            focusPlayerInput(pendingFocusPlayerId.current);
            pendingFocusPlayerId.current = null;
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [players]);

    const startGame = () => {
        if (players.some(p => p.name.trim() === '')) {
            Alert.alert('Atenção', 'Todos os jogadores precisam ter um nome!');
            return;
        }

        const impostorIndex = Math.floor(Math.random() * players.length);
        const impostor = players[impostorIndex];
        const { category, word } = getRandomWord(selectedCategory);

        const gameState = {
            players,
            impostorId: impostor.id,
            category,
            hideCategory,
            secretWord: word,
            currentPlayerIndex: 0,
        };

        navigation.navigate('ImpostorRole', { gameState });
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboard}
                behavior={Platform.OS === 'ios' ? 'padding' : null}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.78}>
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerCopy}>
                        <Text style={styles.title}>Impostor</Text>
                        <Text style={styles.headerSubtitle}>Jogo offline</Text>
                    </View>
                    <View style={styles.headerPill}>
                        <Users size={14} color={colors.primaryLight} />
                        <Text style={styles.headerPillText}>{players.length}/{MAX_PLAYERS}</Text>
                    </View>
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.heroCard}>
                        <View style={styles.heroIconWrap}>
                            <LurdinhaBrandIcon size={54} />
                        </View>
                        <View style={styles.heroTextWrap}>
                            <View style={styles.eyebrow}>
                                <Drama size={14} color={colors.primaryLight} />
                                <Text style={styles.eyebrowText}>Cartas secretas</Text>
                            </View>
                            <Text style={styles.heroTitle}>Quem está blefando?</Text>
                            <Text style={styles.heroSubtitle}>Configure os jogadores, escolha a categoria e passe o celular.</Text>
                        </View>
                    </View>

                    <View style={styles.panel}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Categoria</Text>
                            <Text style={styles.sectionHint}>Palavra da rodada</Text>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoryContent}
                        >
                            {allCategories.map((cat) => {
                                const isActive = selectedCategory === cat;

                                return (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => setSelectedCategory(cat)}
                                        style={[
                                            styles.categoryPill,
                                            isActive && styles.categoryPillActive,
                                        ]}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[
                                            styles.categoryPillText,
                                            isActive && styles.categoryPillTextActive,
                                        ]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    <View style={styles.panel}>
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => setHideCategory((current) => !current)}
                            activeOpacity={0.82}
                        >
                            <View style={styles.settingIcon}>
                                <EyeOff size={18} color={colors.primaryLight} />
                            </View>
                            <View style={styles.settingCopy}>
                                <Text style={styles.settingTitle}>Esconder categoria</Text>
                                <Text style={styles.settingHint}>
                                    A categoria não aparece nas cartas, nem para o impostor.
                                </Text>
                            </View>
                            <View style={[styles.toggleTrack, hideCategory && styles.toggleTrackActive]}>
                                <View style={[styles.toggleThumb, hideCategory && styles.toggleThumbActive]} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.panel}>
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text style={styles.sectionTitle}>Jogadores</Text>
                                <Text style={styles.sectionHint}>Mínimo {MIN_PLAYERS}, máximo {MAX_PLAYERS}</Text>
                            </View>
                            <View style={styles.countBadge}>
                                <Text style={styles.countBadgeText}>{players.length}</Text>
                            </View>
                        </View>

                        <View style={styles.playersList}>
                            {players.map((player, index) => (
                                <View key={player.id} style={styles.playerInputRow}>
                                    <View style={styles.avatarIcon}>
                                        <User size={18} color={colors.primaryLight} />
                                    </View>
                                    <TextInput
                                        ref={(ref) => {
                                            if (ref) {
                                                inputRefs.current[player.id] = ref;
                                            } else {
                                                delete inputRefs.current[player.id];
                                            }
                                        }}
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
                                        placeholderTextColor="#71717A"
                                        maxLength={15}
                                        returnKeyType={index === players.length - 1 && players.length < MAX_PLAYERS ? 'next' : 'done'}
                                        blurOnSubmit={false}
                                        onSubmitEditing={() => handleSubmitEditing(index)}
                                    />
                                    {players.length > MIN_PLAYERS && (
                                        <TouchableOpacity
                                            onPress={() => removePlayer(player.id)}
                                            style={styles.removeButton}
                                            activeOpacity={0.8}
                                        >
                                            <Minus size={18} color="#F87171" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>

                        {players.length < MAX_PLAYERS && (
                            <TouchableOpacity onPress={addPlayer} style={styles.addButton} activeOpacity={0.8}>
                                <Plus size={18} color={colors.primaryLight} />
                                <Text style={styles.addButtonText}>Adicionar Jogador</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.startButton, players.length < MIN_PLAYERS && styles.disabledButton]}
                        onPress={startGame}
                        disabled={players.length < MIN_PLAYERS}
                        activeOpacity={0.86}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.primaryDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.startGradient}
                        >
                            <Text style={styles.startButtonText}>Iniciar Jogo</Text>
                            <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#101014',
    },
    keyboard: {
        flex: 1,
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
    headerPill: {
        height: 38,
        borderRadius: 19,
        backgroundColor: colors.primaryAlpha12,
        borderWidth: 1,
        borderColor: colors.primaryAlpha20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 12,
    },
    headerPillText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 13,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 18,
        gap: 16,
    },
    heroCard: {
        backgroundColor: '#17171C',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.16)',
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    heroIconWrap: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: colors.primaryAlpha12,
        borderWidth: 1,
        borderColor: colors.primaryAlpha20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroTextWrap: {
        flex: 1,
    },
    eyebrow: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.primaryAlpha12,
        borderWidth: 1,
        borderColor: colors.primaryAlpha20,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginBottom: 10,
    },
    eyebrowText: {
        color: colors.primaryLight,
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
        lineHeight: 27,
    },
    heroSubtitle: {
        color: 'rgba(255,255,255,0.52)',
        fontSize: 13,
        lineHeight: 18,
        marginTop: 6,
        fontWeight: '600',
    },
    panel: {
        backgroundColor: '#18181D',
        borderRadius: 26,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    sectionHint: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.42)',
        fontWeight: '700',
        marginTop: 3,
    },
    categoryContent: {
        gap: 9,
        paddingRight: 2,
    },
    categoryPill: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.045)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    categoryPillActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primaryLight,
    },
    categoryPillText: {
        color: 'rgba(255,255,255,0.62)',
        fontWeight: '800',
        fontSize: 13,
    },
    categoryPillTextActive: {
        color: '#FFFFFF',
    },
    settingRow: {
        minHeight: 66,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingIcon: {
        width: 42,
        height: 42,
        borderRadius: 16,
        backgroundColor: colors.primaryAlpha12,
        borderWidth: 1,
        borderColor: colors.primaryAlpha20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingCopy: {
        flex: 1,
        minWidth: 0,
    },
    settingTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    },
    settingHint: {
        color: 'rgba(255,255,255,0.46)',
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '700',
        marginTop: 3,
    },
    toggleTrack: {
        width: 52,
        height: 31,
        borderRadius: 999,
        padding: 3,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
    },
    toggleTrackActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primaryLight,
    },
    toggleThumb: {
        width: 23,
        height: 23,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.72)',
    },
    toggleThumbActive: {
        alignSelf: 'flex-end',
        backgroundColor: '#FFFFFF',
    },
    countBadge: {
        minWidth: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primaryAlpha12,
        borderWidth: 1,
        borderColor: colors.primaryAlpha20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countBadgeText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
    },
    playersList: {
        gap: 10,
    },
    playerInputRow: {
        minHeight: 60,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111115',
        borderRadius: 20,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.075)',
        gap: 10,
    },
    avatarIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primaryAlpha12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        paddingVertical: 16,
    },
    removeButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(248,113,113,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.primaryAlpha20,
        borderStyle: 'dashed',
        marginTop: 14,
        gap: 8,
        backgroundColor: colors.primaryAlpha08,
    },
    addButtonText: {
        color: colors.primaryLight,
        fontSize: 15,
        fontWeight: '800',
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 18,
        backgroundColor: '#101014',
    },
    startButton: {
        borderRadius: 22,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.24,
        shadowRadius: 18,
        elevation: 8,
    },
    startGradient: {
        minHeight: 62,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 20,
    },
    disabledButton: {
        opacity: 0.5,
    },
    startButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
    },
});
