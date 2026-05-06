import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Hash, ArrowRight, Sparkles, Zap } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Header from '../../components/Header';
import LurdinhaBrandIcon from '../../components/LurdinhaBrandIcon';
import { useGame } from '../../hooks/useGame';
import { colors } from '../../theme';
import {
    DEFAULT_DRAW_CONTENT_MODE,
    DEFAULT_DRAW_WORD_CATEGORY,
    DRAW_CONTENT_MODES,
    DRAW_WORD_CATEGORIES,
} from '../../utils/drawContent';
import {
    LURDINHA_THEMES,
    DEFAULT_LURDINHA_THEME,
} from '../../hooks/game/lurdinha';
import {
    MOST_LIKELY_CATEGORIES,
    DEFAULT_MOST_LIKELY_CATEGORY,
} from '../../hooks/game/mostLikely';

export default function CreateRoomScreen({ navigation, route }) {
    const gameType = route.params?.gameType || 'lurdinha';
    const { createRoom, loading, error } = useGame();

    const [timePerRound, setTimePerRound] = useState(gameType === 'telephone' ? 60 : (gameType === 'most_likely' || gameType === 'obvious_mind') ? 30 : 20);
    const [totalRounds, setTotalRounds] = useState(5);
    const [theme, setTheme] = useState(DEFAULT_LURDINHA_THEME);
    const [difficulty, setDifficulty] = useState('normal');
    const [contentMode, setContentMode] = useState(DEFAULT_DRAW_CONTENT_MODE);
    const [drawCategory, setDrawCategory] = useState(DEFAULT_DRAW_WORD_CATEGORY);
    const [mostLikelyCategory, setMostLikelyCategory] = useState(DEFAULT_MOST_LIKELY_CATEGORY);
    const [voteMode, setVoteMode] = useState('secret');

    const selectedContentMode = DRAW_CONTENT_MODES.find((option) => option.value === contentMode);
    const selectedDrawCategory = DRAW_WORD_CATEGORIES.find((option) => option.value === drawCategory);
    const navTitle = gameType === 'secret'
        ? 'Criar Sala Secret'
        : gameType === 'telephone'
        ? 'Telefone Sem Fio'
        : gameType === 'party'
        ? 'Sessão de Rodadas'
        : gameType === 'most_likely'
        ? 'Quem é Mais Provável?'
        : gameType === 'obvious_mind'
        ? 'Na Minha Cabeça Era Óbvio'
        : gameType === 'draw'
        ? 'Criar Sala de Desenho'
        : 'Criar Sala';
    const heroTitle = gameType === 'secret'
        ? 'Monte sua cadeia secreta'
        : gameType === 'telephone'
        ? 'Crie sua roda de histórias'
        : gameType === 'party'
        ? 'Configure sua Sessão'
        : gameType === 'most_likely'
        ? 'Monte sua rodada de julgamento'
        : gameType === 'obvious_mind'
        ? 'Configure a leitura mental'
        : gameType === 'draw'
        ? 'Monte sua rodada de desenho'
        : 'Personalize o jogo';
    const heroSubtitle = gameType === 'secret'
        ? 'Cada pessoa recebe só um fragmento: frase, desenho, interpretação, desenho. No fim a cadeia inteira é revelada.'
        : gameType === 'telephone'
        ? 'Defina quantos turnos a história vai ter. Cada jogador verá só a última etapa da rodada.'
        : gameType === 'party'
        ? 'Defina quantos minigames e quanto tempo entram na sua sessão em grupo.'
        : gameType === 'most_likely'
        ? 'Cada pessoa vota em quem mais combina com a pergunta. O resultado é como o grupo enxerga vocês.'
        : gameType === 'obvious_mind'
        ? 'Um jogador escolhe uma resposta. O resto tenta pensar igual a ele.'
        : gameType === 'draw'
        ? (contentMode === 'characters'
            ? 'Defina tempo e rodadas para cenas criativas e imprevisíveis.'
            : 'Escolha categoria, dificuldade, tempo e rodadas para o desafio.')
        : 'Defina as regras para a sua galera.';
    const accentLabel = gameType === 'secret'
        ? 'Cadeia secreta'
        : gameType === 'telephone'
        ? 'História em sequência'
        : gameType === 'party'
        ? 'Sessão em grupo'
        : gameType === 'most_likely'
        ? 'Verdade social'
        : gameType === 'obvious_mind'
        ? 'Mente do grupo'
        : gameType === 'draw'
        ? 'Desenho ao vivo'
        : 'Sala personalizada';

    const onCreatePress = async () => {
        try {
            const roomId = await createRoom({
                timePerRound,
                totalRounds,
                theme: gameType === 'draw' || gameType === 'secret' ? DEFAULT_LURDINHA_THEME : (theme || DEFAULT_LURDINHA_THEME),
                gameType,
                difficulty: gameType === 'draw' && contentMode === 'words' ? difficulty : 'normal',
                contentMode: gameType === 'draw' ? contentMode : undefined,
                drawCategory: gameType === 'draw' ? drawCategory : undefined,
                category: gameType === 'most_likely' ? mostLikelyCategory : undefined,
                voteMode: gameType === 'most_likely' ? voteMode : undefined,
                allowSelfVote: gameType === 'most_likely' ? false : undefined,
            });
            if (roomId) {
                navigation.replace('Lobby', { roomId });
            }
        } catch (err) {
            // Error handled by hook state
        }
    };

    const OptionButton = ({ label, selected, onPress }) => (
        <View>
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
        </View>
    );

    const SectionCard = ({ children }) => (
        <View style={styles.section}>
            <View style={styles.sectionCard}>
                <View pointerEvents="none" style={styles.sectionOrb} />
                {children}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f0f12', '#141419', '#17131f']}
                style={styles.background}
            />
            <View pointerEvents="none" style={styles.ambientGlowTop} />
            <View pointerEvents="none" style={styles.ambientGlowBottom} />

            <Header
                title={navTitle}
                transparent
                onBack={() => navigation.goBack()}
            />

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>

                <Animated.View entering={FadeInUp.delay(200)} style={styles.headerSection}>
                    <View style={styles.heroIdentityRow}>
                        <LurdinhaBrandIcon size={58} />
                        <View style={styles.heroIdentityText}>
                            <View style={styles.brandAccentRow}>
                                <View style={styles.brandAccentBadge}>
                                    <View style={styles.brandAccentGlow} />
                                    <Text style={styles.brandAccentText}>{accentLabel}</Text>
                                </View>
                                <View style={styles.brandAccentLine} />
                            </View>
                            <Text style={styles.headerTitle}>{heroTitle}</Text>
                        </View>
                    </View>
                    <Text style={styles.headerSubtitle}>{heroSubtitle}</Text>
                </Animated.View>

                {gameType !== 'secret' && (
                    <SectionCard>
                        <View style={styles.sectionHeader}>
                            <Clock size={20} color="#a78bfa" />
                            <Text style={styles.sectionTitle}>
                                {gameType === 'draw'
                                    ? 'Tempo para desenhar'
                                    : gameType === 'telephone'
                                    ? 'Tempo por passo'
                                    : gameType === 'most_likely'
                                    ? 'Tempo para votar'
                                    : gameType === 'obvious_mind'
                                    ? 'Tempo para pensar'
                                    : 'Tempo para responder'}
                            </Text>
                        </View>
                        <View style={styles.optionsRow}>
                            {(gameType === 'telephone' ? [30, 45, 60, 90, 120] : (gameType === 'most_likely' || gameType === 'obvious_mind') ? [20, 30, 45, 60, 90] : [15, 20, 30, 45, 60]).map((time, index) => (
                                <OptionButton
                                    key={time}
                                    label={`${time}s`}
                                    selected={timePerRound === time}
                                    onPress={() => setTimePerRound(time)}
                                />
                            ))}
                        </View>
                        <Text style={styles.helperText}>
                            {gameType === 'draw'
                                ? (timePerRound < 20 ? 'Rodadas rápidas e caóticas.' : 'Mais tempo para detalhar o desenho.')
                                : gameType === 'telephone'
                                ? (timePerRound < 60 ? 'Passos rápidos deixam a história mais absurda.' : 'Mais tempo para pensar antes de passar adiante.')
                                : gameType === 'most_likely'
                                ? (timePerRound < 30 ? 'Votação rápida e instintiva.' : 'Mais tempo para discutir a escolha.')
                                : gameType === 'obvious_mind'
                                ? (timePerRound < 30 ? 'Respostas rápidas revelam mais instinto.' : 'Mais tempo para tentar entrar na cabeça do alvo.')
                                : (timePerRound < 20 ? 'Rápido! Para quem pensa ágil.' : 'Mais tempo para pensar em estratégias.')}
                        </Text>
                    </SectionCard>
                )}

                <SectionCard>
                        <View style={styles.sectionHeader}>
                            <Hash size={20} color="#a78bfa" />
                            <Text style={styles.sectionTitle}>
                                {gameType === 'secret' ? 'Quantidade de passos na cadeia' : (gameType === 'telephone' ? 'Tamanho da História (Turnos)' : (gameType === 'party' ? 'Quantidade de minigames' : ((gameType === 'most_likely' || gameType === 'obvious_mind') ? 'Quantidade de perguntas' : 'Quantidade de rodadas')))}
                            </Text>
                        </View>
                        <View style={styles.optionsRow}>
                            {[3, 5, 7, 10, 15].map((rounds, index) => (
                                <OptionButton
                                    key={rounds}
                                    label={`${rounds}`}
                                    selected={totalRounds === rounds}
                                    onPress={() => setTotalRounds(rounds)}
                                />
                            ))}
                        </View>
                        {(gameType === 'telephone' || gameType === 'secret') && (
                            <Text style={styles.helperText}>
                                O ideal é usar um número próximo da quantidade de pessoas na sala para a cadeia circular funcionar bem.
                            </Text>
                        )}
                </SectionCard>

                {gameType === 'draw' && (
                    <SectionCard>
                        <View style={styles.sectionHeader}>
                            <Sparkles size={20} color="#a78bfa" />
                            <Text style={styles.sectionTitle}>Modo da rodada</Text>
                        </View>
                        <View style={styles.optionsRow}>
                            {DRAW_CONTENT_MODES.map((mode, index) => (
                                <OptionButton
                                    key={mode.value}
                                    label={mode.label}
                                    selected={contentMode === mode.value}
                                    onPress={() => setContentMode(mode.value)}
                                />
                            ))}
                        </View>
                        <Text style={styles.helperText}>
                            {selectedContentMode?.description}
                        </Text>
                    </SectionCard>
                )}

                {gameType === 'draw' && contentMode === 'words' && (
                    <SectionCard>
                        <View style={styles.sectionHeader}>
                            <Sparkles size={20} color="#a78bfa" />
                            <Text style={styles.sectionTitle}>Categoria das palavras</Text>
                        </View>
                        <View style={styles.optionsRow}>
                            {DRAW_WORD_CATEGORIES.map((category, index) => (
                                <OptionButton
                                    key={category.value}
                                    label={category.label}
                                    selected={drawCategory === category.value}
                                    onPress={() => setDrawCategory(category.value)}
                                />
                            ))}
                        </View>
                        <Text style={styles.helperText}>
                            {selectedDrawCategory?.description}
                        </Text>
                    </SectionCard>
                )}

                {gameType === 'draw' && contentMode === 'words' && (
                    <SectionCard>
                        <View style={styles.sectionHeader}>
                            <Zap size={20} color="#a78bfa" />
                            <Text style={styles.sectionTitle}>Dificuldade das palavras</Text>
                        </View>
                        <View style={styles.optionsRow}>
                            {[
                                { value: 'easy', label: '😊 Fácil', helper: 'Palavras simples e do dia a dia.' },
                                { value: 'normal', label: '🎯 Normal', helper: 'Nível padrão equilibrado.' },
                                { value: 'hard', label: '🔥 Difícil', helper: 'Palavras abstratas. Pontos ×1.5!' },
                            ].map((opt, index) => (
                                <OptionButton
                                    key={opt.value}
                                    label={opt.label}
                                    selected={difficulty === opt.value}
                                    onPress={() => setDifficulty(opt.value)}
                                />
                            ))}
                        </View>
                        <Text style={styles.helperText}>
                            {difficulty === 'easy' && 'Palavras simples e do dia a dia.'}
                            {difficulty === 'normal' && 'Nível padrão equilibrado.'}
                            {difficulty === 'hard' && 'Palavras abstratas e compostas. Pontos ×1.5 em toda a rodada!'}
                        </Text>
                    </SectionCard>
                )}

                {gameType === 'most_likely' && (
                    <SectionCard>
                        <View style={styles.sectionHeader}>
                            <Sparkles size={20} color="#a78bfa" />
                            <Text style={styles.sectionTitle}>Estilo das perguntas</Text>
                        </View>
                        <View style={styles.optionsRow}>
                            {MOST_LIKELY_CATEGORIES.map((category) => (
                                <OptionButton
                                    key={category.key}
                                    label={category.label}
                                    selected={mostLikelyCategory === category.key}
                                    onPress={() => setMostLikelyCategory(category.key)}
                                />
                            ))}
                        </View>
                        <Text style={styles.helperText}>
                            {MOST_LIKELY_CATEGORIES.find((category) => category.key === mostLikelyCategory)?.description}
                        </Text>
                    </SectionCard>
                )}

                {gameType === 'most_likely' && (
                    <SectionCard>
                        <View style={styles.sectionHeader}>
                            <Zap size={20} color="#a78bfa" />
                            <Text style={styles.sectionTitle}>Revelação dos votos</Text>
                        </View>
                        <View style={styles.optionsRow}>
                            <OptionButton
                                label="🔒 Secreto"
                                selected={voteMode === 'secret'}
                                onPress={() => setVoteMode('secret')}
                            />
                            <OptionButton
                                label="👀 Público"
                                selected={voteMode === 'public'}
                                onPress={() => setVoteMode('public')}
                            />
                        </View>
                        <Text style={styles.helperText}>
                            {voteMode === 'secret'
                                ? 'Mostra só o resultado final. Menos pressão para votar.'
                                : 'Revela quem votou em quem no fim da rodada.'}
                        </Text>
                    </SectionCard>
                )}

                {gameType !== 'draw' && gameType !== 'secret' && gameType !== 'most_likely' && gameType !== 'obvious_mind' && (
                    <SectionCard>
                            <View style={styles.sectionHeader}>
                                <Sparkles size={20} color="#a78bfa" />
                                <Text style={styles.sectionTitle}>Tema das perguntas</Text>
                            </View>
                            <View style={styles.optionsRow}>
                                {LURDINHA_THEMES.map((t) => (
                                    <OptionButton
                                        key={t.key}
                                        label={t.label}
                                        selected={theme === t.key}
                                        onPress={() => setTheme(t.key)}
                                    />
                                ))}
                            </View>
                            <Text style={styles.helperText}>
                                {LURDINHA_THEMES.find((t) => t.key === theme)?.description || 'Escolha o tipo de perguntas.'}
                            </Text>
                    </SectionCard>
                )}

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
        backgroundColor: '#0f0f12',
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
        top: 72,
        right: -48,
        width: 180,
        height: 180,
        borderRadius: 999,
        backgroundColor: 'rgba(124,58,237,0.10)',
    },
    ambientGlowBottom: {
        position: 'absolute',
        bottom: 180,
        left: -72,
        width: 220,
        height: 220,
        borderRadius: 999,
        backgroundColor: 'rgba(168,85,247,0.08)',
    },
    content: {
        flex: 1,
        padding: 24,
        paddingTop: 20,
    },
    headerSection: {
        marginBottom: 40,
    },
    heroIdentityRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        marginBottom: 10,
    },
    heroIdentityText: {
        flex: 1,
        minWidth: 0,
    },
    brandAccentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    brandAccentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
        backgroundColor: 'rgba(139,92,246,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.22)',
    },
    brandAccentGlow: {
        width: 8,
        height: 8,
        borderRadius: 999,
        backgroundColor: '#A78BFA',
    },
    brandAccentText: {
        color: '#B79CFF',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    brandAccentLine: {
        flex: 1,
        height: 1,
        borderRadius: 999,
        backgroundColor: 'rgba(167,139,250,0.18)',
        maxWidth: 84,
    },
    headerTitle: {
        fontSize: 27,
        fontWeight: '800',
        lineHeight: 34,
        color: '#fff',
        marginBottom: 10,
    },
    headerSubtitle: {
        fontSize: 16,
        lineHeight: 24,
        color: 'rgba(255,255,255,0.58)',
        maxWidth: 360,
    },
    section: {
        marginBottom: 18,
    },
    sectionCard: {
        borderRadius: 24,
        backgroundColor: '#17171C',
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.12)',
        padding: 18,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 4,
    },
    sectionOrb: {
        position: 'absolute',
        right: -22,
        top: '28%',
        width: 90,
        height: 90,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
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
        backgroundColor: '#202027',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        minWidth: 60,
        alignItems: 'center',
    },
    optionButtonSelected: {
        backgroundColor: 'rgba(139,92,246,0.18)',
        borderColor: 'rgba(167,139,250,0.42)',
        transform: [{ scale: 1.04 }],
    },
    optionText: {
        color: 'rgba(255,255,255,0.72)',
        fontWeight: '600',
        fontSize: 16,
    },
    optionTextSelected: {
        color: '#fff',
        fontWeight: '700',
    },
    helperText: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 12,
        lineHeight: 18,
        marginTop: 12,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#202027',
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.16)',
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
        backgroundColor: 'rgba(14, 14, 17, 0.94)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    createButton: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#6D28D9',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.24,
        shadowRadius: 14,
        elevation: 6,
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
