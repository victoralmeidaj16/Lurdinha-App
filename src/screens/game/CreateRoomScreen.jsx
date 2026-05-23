import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Sparkles, Zap } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedPressable from '../../components/AnimatedPressable';
import Header from '../../components/Header';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../hooks/useGroups';
import { colors, spacing, borderRadius, shadows } from '../../theme';
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
import {
    TIER_LIST_CATEGORIES,
    DEFAULT_TIER_LIST_CATEGORY,
} from '../../hooks/game/tierList';
import { playSound } from '../../utils/sounds';

const GAME_META = {
    lurdinha:     { emoji: '😈', accent: '#7C3AED', accentLight: '#A78BFA' },
    draw:         { emoji: '✏️', accent: '#10B981', accentLight: '#6EE7B7' },
    most_likely:  { emoji: '👀', accent: '#3B82F6', accentLight: '#93C5FD' },
    obvious_mind: { emoji: '🧠', accent: '#F59E0B', accentLight: '#FCD34D' },
    secret:       { emoji: '📖', accent: '#F43F5E', accentLight: '#FDA4AF' },
    telephone:    { emoji: '📖', accent: '#F43F5E', accentLight: '#FDA4AF' },
    party:        { emoji: '🎉', accent: '#EC4899', accentLight: '#F9A8D4' },
    tier_list:    { emoji: '🏆', accent: '#FF6B35', accentLight: '#FFAB8A' },
};

export default function CreateRoomScreen({ navigation, route }) {
    const gameType = route.params?.gameType || 'lurdinha';
    const { createRoom, inviteGroupToRoom, loading, error } = useGame();
    const { currentUser } = useAuth();
    const { getUserGroups } = useGroups();
    const meta = GAME_META[gameType] || GAME_META.lurdinha;

    const [timePerRound, setTimePerRound] = useState(gameType === 'telephone' ? 60 : (gameType === 'most_likely' || gameType === 'obvious_mind') ? 30 : 20);
    const [totalRounds, setTotalRounds] = useState(5);
    const [theme, setTheme] = useState(DEFAULT_LURDINHA_THEME);
    const [difficulty, setDifficulty] = useState('normal');
    const [contentMode, setContentMode] = useState(DEFAULT_DRAW_CONTENT_MODE);
    const [drawCategory, setDrawCategory] = useState(DEFAULT_DRAW_WORD_CATEGORY);
    const [mostLikelyCategory, setMostLikelyCategory] = useState(DEFAULT_MOST_LIKELY_CATEGORY);
    const [tierListCategory, setTierListCategory] = useState(DEFAULT_TIER_LIST_CATEGORY);
    const [voteMode, setVoteMode] = useState('secret');
    const [adminGroups, setAdminGroups] = useState([]);
    const [selectedInviteGroupId, setSelectedInviteGroupId] = useState(null);
    const [groupsLoading, setGroupsLoading] = useState(true);

    const selectedContentMode = DRAW_CONTENT_MODES.find((o) => o.value === contentMode);
    const selectedDrawCategory = DRAW_WORD_CATEGORIES.find((o) => o.value === drawCategory);

    useEffect(() => {
        let active = true;
        const loadAdminGroups = async () => {
            try {
                setGroupsLoading(true);
                const groups = await getUserGroups();
                if (!active) return;
                const nextAdminGroups = groups.filter((group) => group.admins?.includes(currentUser?.uid));
                setAdminGroups(nextAdminGroups);
                setSelectedInviteGroupId((current) => (
                    current && nextAdminGroups.some((group) => group.id === current)
                        ? current
                        : null
                ));
            } catch (err) {
                if (active) setAdminGroups([]);
            } finally {
                if (active) setGroupsLoading(false);
            }
        };

        loadAdminGroups();
        return () => {
            active = false;
        };
    }, [currentUser?.uid]);

    const navTitle = gameType === 'secret' || gameType === 'telephone'
        ? 'Telefone Sem Fio'
        : gameType === 'party' ? 'Sessão de Rodadas'
        : gameType === 'most_likely' ? 'Quem é Mais Provável?'
        : gameType === 'obvious_mind' ? 'Na Minha Cabeça Era Óbvio'
        : gameType === 'draw' ? 'Desenho'
        : gameType === 'tier_list' ? 'Tier List da Galera'
        : 'Lurdinha';

    const heroTitle = gameType === 'secret' || gameType === 'telephone'
        ? 'Monte a cadeia'
        : gameType === 'party' ? 'Configure a sessão'
        : gameType === 'most_likely' ? 'Configure a rodada'
        : gameType === 'obvious_mind' ? 'Leitura mental'
        : gameType === 'draw' ? 'Monte a rodada'
        : gameType === 'tier_list' ? 'Monte a tier list'
        : 'Configure a sala';

    const heroSubtitle = gameType === 'secret' || gameType === 'telephone'
        ? 'Defina quantos passos a cadeia vai ter.'
        : gameType === 'party' ? 'Defina tempo e quantidade de minigames.'
        : gameType === 'most_likely' ? 'Escolha o estilo das perguntas e como os votos serão revelados.'
        : gameType === 'obvious_mind' ? 'Defina tempo e quantidade de perguntas.'
        : gameType === 'draw' ? 'Escolha categoria, dificuldade e tempo.'
        : gameType === 'tier_list' ? 'Escolha o tema das perguntas e o número de rodadas.'
        : 'Escolha tempo e número de rodadas.';

    const onCreatePress = async () => {
        try {
            const roomId = await createRoom({
                timePerRound,
                totalRounds,
                theme: gameType === 'draw' || gameType === 'secret' || gameType === 'tier_list' ? DEFAULT_LURDINHA_THEME : (theme || DEFAULT_LURDINHA_THEME),
                gameType,
                difficulty: gameType === 'draw' && contentMode === 'words' ? difficulty : 'normal',
                contentMode: gameType === 'draw' ? contentMode : undefined,
                drawCategory: gameType === 'draw' ? drawCategory : undefined,
                category: gameType === 'most_likely' ? mostLikelyCategory : gameType === 'tier_list' ? tierListCategory : undefined,
                voteMode: gameType === 'most_likely' ? voteMode : undefined,
                allowSelfVote: gameType === 'most_likely' ? false : undefined,
            });
            if (roomId) {
                navigation.replace('Lobby', { roomId });
                if (selectedInviteGroupId) {
                    inviteGroupToRoom(roomId, selectedInviteGroupId).catch((inviteError) => {
                        console.error('[CreateRoomScreen] Group invite failed:', inviteError);
                    });
                }
            }
        } catch (err) {}
    };

    const OptionButton = ({ label, selected, onPress }) => (
        <AnimatedPressable
            style={[styles.optionButton, selected && { backgroundColor: meta.accent, borderColor: meta.accent }]}
            onPress={() => {
                playSound('ui_toggle');
                onPress();
            }}
            haptic="light"
            activeScale={0.95}
        >
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
        </AnimatedPressable>
    );

    const Section = ({ label, helper, children, delay = 0 }) => (
        <Animated.View entering={FadeInDown.delay(delay).duration(280)} style={styles.section}>
            <Text style={styles.sectionLabel}>{label}</Text>
            <View style={styles.optionsRow}>{children}</View>
            {helper ? <Text style={styles.helperText}>{helper}</Text> : null}
        </Animated.View>
    );

    const timeOptions = gameType === 'telephone'
        ? [30, 45, 60, 90, 120]
        : (gameType === 'most_likely' || gameType === 'obvious_mind') ? [20, 30, 45, 60, 90]
        : gameType === 'tier_list' ? [20, 30, 45, 60, 90]
        : [15, 20, 30, 45, 60];

    const timeHelper = gameType === 'draw'
        ? (timePerRound < 20 ? 'Rodadas rápidas e caóticas.' : 'Mais tempo para detalhar o desenho.')
        : gameType === 'telephone'
        ? (timePerRound < 60 ? 'Passos rápidos deixam a história mais absurda.' : 'Mais tempo para pensar antes de passar adiante.')
        : gameType === 'most_likely'
        ? (timePerRound < 30 ? 'Votação rápida e instintiva.' : 'Mais tempo para discutir a escolha.')
        : gameType === 'obvious_mind'
        ? (timePerRound < 30 ? 'Respostas rápidas revelam mais instinto.' : 'Mais tempo para tentar entrar na cabeça do alvo.')
        : gameType === 'tier_list'
        ? (timePerRound < 30 ? 'Classificação rápida e instintiva.' : 'Mais tempo para pensar em cada pessoa.')
        : (timePerRound < 20 ? 'Rápido — para quem pensa ágil.' : 'Mais tempo para pensar em estratégias.');

    const roundsLabel = (gameType === 'secret' || gameType === 'telephone') ? 'Número de rodadas'
        : gameType === 'party' ? 'Minigames'
        : (gameType === 'most_likely' || gameType === 'obvious_mind' || gameType === 'tier_list') ? 'Perguntas'
        : 'Rodadas';

    return (
        <View style={styles.container}>
            {/* Full-screen gradient background tied to game accent */}
            <LinearGradient
                colors={['#111116', '#13111A', '#18102A']}
                style={StyleSheet.absoluteFill}
            />
            {/* Accent wash at top */}
            <LinearGradient
                colors={[`${meta.accent}28`, 'transparent']}
                style={styles.accentWash}
                pointerEvents="none"
            />
            {/* Bottom Glow */}
            <View pointerEvents="none" style={styles.ambientGlowBottom} />

            <Header title={navTitle} transparent onBack={() => navigation.goBack()} />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
            >
                {/* Hero */}
                <Animated.View entering={FadeInDown.duration(260)} style={styles.hero}>
                    <View style={[styles.emojiShell, { backgroundColor: `${meta.accent}22`, borderColor: `${meta.accent}44` }]}>
                        <Text style={styles.heroEmoji}>{meta.emoji}</Text>
                    </View>
                    <View style={styles.heroText}>
                        <Text style={styles.heroTitle}>{heroTitle}</Text>
                        <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
                    </View>
                </Animated.View>

                {/* Sections */}
                {gameType !== 'secret' && (
                    <Section
                        delay={80}
                        label={
                            gameType === 'draw' ? 'Tempo para desenhar'
                            : gameType === 'telephone' ? 'Tempo por passo'
                            : gameType === 'most_likely' ? 'Tempo para votar'
                            : gameType === 'obvious_mind' ? 'Tempo para pensar'
                            : gameType === 'tier_list' ? 'Tempo para classificar'
                            : 'Tempo para responder'
                        }
                        helper={timeHelper}
                    >
                        {timeOptions.map((time) => (
                            <OptionButton key={time} label={`${time}s`} selected={timePerRound === time} onPress={() => setTimePerRound(time)} />
                        ))}
                    </Section>
                )}

                {(gameType === 'telephone' || gameType === 'secret') ? (
                    <Animated.View entering={FadeInDown.delay(140).duration(280)} style={styles.chainInfoBlock}>
                        <Text style={styles.chainInfoTitle}>Cadeia automática</Text>
                        <Text style={styles.chainInfoBody}>
                            A cadeia passa por todos os jogadores e volta ao ponto de partida. O número de passos é definido automaticamente pelo número de pessoas na sala.
                        </Text>
                        <View style={styles.chainStepRow}>
                            <View style={styles.chainStep}><Text style={styles.chainStepText}>✏️ Frase</Text></View>
                            <View style={styles.chainArrow}><Text style={styles.chainArrowText}>→</Text></View>
                            <View style={styles.chainStep}><Text style={styles.chainStepText}>🎨 Desenho</Text></View>
                            <View style={styles.chainArrow}><Text style={styles.chainArrowText}>→</Text></View>
                            <View style={styles.chainStep}><Text style={styles.chainStepText}>💭 Frase</Text></View>
                            <View style={styles.chainArrow}><Text style={styles.chainArrowText}>→</Text></View>
                            <View style={styles.chainStep}><Text style={styles.chainStepText}>🎨 ...</Text></View>
                        </View>
                    </Animated.View>
                ) : (
                    <Section delay={140} label={roundsLabel}>
                        {[3, 5, 7, 10, 15].map((r) => (
                            <OptionButton key={r} label={`${r}`} selected={totalRounds === r} onPress={() => setTotalRounds(r)} />
                        ))}
                    </Section>
                )}

                {gameType === 'draw' && (
                    <Section delay={200} label="Modo da rodada" helper={selectedContentMode?.description}>
                        {DRAW_CONTENT_MODES.map((m) => (
                            <OptionButton key={m.value} label={m.label} selected={contentMode === m.value} onPress={() => setContentMode(m.value)} />
                        ))}
                    </Section>
                )}

                {gameType === 'draw' && contentMode === 'words' && (
                    <Section delay={240} label="Categoria" helper={selectedDrawCategory?.description}>
                        {DRAW_WORD_CATEGORIES.map((c) => (
                            <OptionButton key={c.value} label={c.label} selected={drawCategory === c.value} onPress={() => setDrawCategory(c.value)} />
                        ))}
                    </Section>
                )}

                {gameType === 'draw' && contentMode === 'words' && (
                    <Section
                        delay={280}
                        label="Dificuldade"
                        helper={
                            difficulty === 'easy' ? 'Palavras simples e do dia a dia.'
                            : difficulty === 'normal' ? 'Nível padrão equilibrado.'
                            : 'Palavras abstratas e compostas. Pontos ×1.5 em toda a rodada!'
                        }
                    >
                        {[{ value: 'easy', label: '😊 Fácil' }, { value: 'normal', label: '🎯 Normal' }, { value: 'hard', label: '🔥 Difícil' }].map((o) => (
                            <OptionButton key={o.value} label={o.label} selected={difficulty === o.value} onPress={() => setDifficulty(o.value)} />
                        ))}
                    </Section>
                )}

                {gameType === 'most_likely' && (
                    <Section delay={200} label="Estilo das perguntas" helper={MOST_LIKELY_CATEGORIES.find((c) => c.key === mostLikelyCategory)?.description}>
                        {MOST_LIKELY_CATEGORIES.map((c) => (
                            <OptionButton key={c.key} label={c.label} selected={mostLikelyCategory === c.key} onPress={() => setMostLikelyCategory(c.key)} />
                        ))}
                    </Section>
                )}

                {gameType === 'most_likely' && (
                    <Section
                        delay={260}
                        label="Revelação dos votos"
                        helper={voteMode === 'secret' ? 'Mostra só o resultado final. Menos pressão para votar.' : 'Revela quem votou em quem no fim da rodada.'}
                    >
                        <OptionButton label="🔒 Secreto" selected={voteMode === 'secret'} onPress={() => setVoteMode('secret')} />
                        <OptionButton label="👀 Público" selected={voteMode === 'public'} onPress={() => setVoteMode('public')} />
                    </Section>
                )}

                {gameType === 'tier_list' && (
                    <Section delay={200} label="Tema das perguntas" helper={TIER_LIST_CATEGORIES.find((c) => c.key === tierListCategory)?.description}>
                        {TIER_LIST_CATEGORIES.map((c) => (
                            <OptionButton key={c.key} label={c.label} selected={tierListCategory === c.key} onPress={() => setTierListCategory(c.key)} />
                        ))}
                    </Section>
                )}

                {gameType !== 'draw' && gameType !== 'secret' && gameType !== 'most_likely' && gameType !== 'obvious_mind' && gameType !== 'tier_list' && (
                    <Section delay={200} label="Tema das perguntas" helper={LURDINHA_THEMES.find((t) => t.key === theme)?.description}>
                        {LURDINHA_THEMES.map((t) => (
                            <OptionButton key={t.key} label={t.label} selected={theme === t.key} onPress={() => setTheme(t.key)} />
                        ))}
                    </Section>
                )}

                <Section
                    delay={320}
                    label="Convidar grupo"
                    helper={
                        groupsLoading
                            ? 'Carregando grupos onde você é admin...'
                            : adminGroups.length === 0
                                ? 'Apenas admins de grupo podem enviar convites automáticos para o lobby.'
                                : selectedInviteGroupId
                                    ? 'Os membros do grupo recebem convite e notificação para entrar nesta sala.'
                                    : 'Opcional: selecione um grupo para chamar automaticamente após criar a sala.'
                    }
                >
                    <OptionButton
                        label="Não convidar"
                        selected={!selectedInviteGroupId}
                        onPress={() => setSelectedInviteGroupId(null)}
                    />
                    {adminGroups.map((group) => (
                        <OptionButton
                            key={group.id}
                            label={`${group.badge || '👥'} ${group.name}`}
                            selected={selectedInviteGroupId === group.id}
                            onPress={() => setSelectedInviteGroupId(group.id)}
                        />
                    ))}
                </Section>

                {error && (
                    <Animated.View entering={FadeInDown} style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </Animated.View>
                )}
            </ScrollView>

            <Animated.View entering={FadeInUp.delay(300)} style={styles.footer}>
                <AnimatedPressable style={[styles.createButton, { shadowColor: meta.accent }]} onPress={onCreatePress} disabled={loading} haptic="medium">
                    <LinearGradient
                        colors={[meta.accentLight, meta.accent]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientButton}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.createButtonText}>Criar Sala</Text>
                                <ArrowRight size={22} color="#fff" />
                            </>
                        )}
                    </LinearGradient>
                </AnimatedPressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    accentWash: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 320,
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
    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 22,
        paddingTop: 4,
        paddingBottom: 140,
    },
    hero: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 28,
    },
    emojiShell: {
        width: 60,
        height: 60,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    heroEmoji: {
        fontSize: 28,
    },
    heroText: {
        flex: 1,
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.4,
        marginBottom: 5,
    },
    heroSubtitle: {
        fontSize: 14,
        lineHeight: 20,
        color: colors.textMuted,
    },
    section: {
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: colors.borderSoft,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 14,
    },
    optionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    optionButton: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderSoft,
    },
    optionText: {
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: 15,
    },
    optionTextSelected: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    helperText: {
        color: colors.textMuted,
        fontSize: 13,
        lineHeight: 18,
        marginTop: 12,
    },
    chainInfoBlock: {
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: colors.borderSoft,
        gap: 12,
    },
    chainInfoTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    chainInfoBody: {
        fontSize: 14,
        lineHeight: 21,
        color: colors.textMuted,
    },
    chainStepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4,
    },
    chainStep: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderSoft,
    },
    chainStepText: {
        color: colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    chainArrow: {
        paddingHorizontal: 2,
    },
    chainArrowText: {
        color: colors.textDim,
        fontSize: 14,
    },
    errorContainer: {
        marginTop: 16,
        padding: 14,
        backgroundColor: 'rgba(239,68,68,0.10)',
        borderRadius: 12,
    },
    errorText: {
        color: '#fca5a5',
        textAlign: 'center',
        fontSize: 14,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 22,
        paddingTop: 16,
        paddingBottom: 44,
        backgroundColor: colors.overlayStrong,
        borderTopWidth: 1,
        borderTopColor: colors.borderSoft,
    },
    createButton: {
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.32,
        shadowRadius: 18,
        elevation: 10,
    },
    gradientButton: {
        paddingVertical: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
