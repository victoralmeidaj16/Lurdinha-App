import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SoundMuteButton from '../../components/SoundMuteButton';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../hooks/useGroups';
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

// ─── Game meta definitions for the Hero card ──────────────────────────────
const GAME_META = {
    lurdinha:     { emoji: '😈', kicker: 'MODO SURVIVAL', title: 'Lurdinha', subtitle: 'Responda igual à maioria e sobreviva na sala.' },
    draw:         { emoji: '✏️', kicker: 'DESSENHE E ADIVINHE', title: 'Desenho', subtitle: 'Escolha categoria, dificuldade e tempo para desenhar.' },
    most_likely:  { emoji: '👀', kicker: 'SOCIAL GAME', title: 'Quem é Mais Provável?', subtitle: 'Escolha o estilo das perguntas e como os votos serão revelados.' },
    obvious_mind: { emoji: '🧠', kicker: 'LEITURA MENTAL', title: 'Na Minha Cabeça Era Óbvio', subtitle: 'Defina tempo e quantidade de perguntas para ler a mente.' },
    secret:       { emoji: '📖', kicker: 'CADEIA CAÓTICA', title: 'Telefone Sem Fio', subtitle: 'Defina o tempo por passo. A cadeia se adapta ao tamanho do grupo.' },
    telephone:    { emoji: '📖', kicker: 'CADEIA CAÓTICA', title: 'Telefone Sem Fio', subtitle: 'Defina o tempo por passo. A cadeia se adapta ao tamanho do grupo.' },
    party:        { emoji: '🎉', kicker: 'PARTY GAME', title: 'Sessão de Rodadas', subtitle: 'Defina tempo e quantidade de minigames do grupo.' },
    tier_list:    { emoji: '🏆', kicker: 'VOTO COLETIVO', title: 'Tier List da Galera', subtitle: 'Classifique o grupo inteiro e veja as médias no veredito final.' },
    impostor:     { emoji: '🎭', kicker: 'DEDUÇÃO E BLEFE', title: 'O Impostor', subtitle: 'Defina tempo de discussão e quantidade de rodadas.' },
};

// ─── Subcomponents ─────────────────────────────────────────────────────────

function Stepper({ value, onDecrement, onIncrement, unit, min = 1, max = 999 }) {
    return (
        <View style={s.stepper}>
            <TouchableOpacity
                style={[s.stepBtn, value <= min && s.stepBtnDisabled]}
                onPress={() => { if (value > min) { playSound('ui_toggle'); onDecrement(); } }}
                activeOpacity={0.7}
            >
                <Minus size={18} color={value <= min ? '#555' : '#fff'} strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={s.stepValue}>
                <Text style={s.stepNum}>{value}</Text>
                {unit ? <Text style={s.stepUnit}>{unit}</Text> : null}
            </View>

            <TouchableOpacity
                style={[s.stepBtn, value >= max && s.stepBtnDisabled]}
                onPress={() => { if (value < max) { playSound('ui_toggle'); onIncrement(); } }}
                activeOpacity={0.7}
            >
                <Plus size={18} color={value >= max ? '#555' : '#fff'} strokeWidth={2.5} />
            </TouchableOpacity>
        </View>
    );
}

function Segmented({ options, value, onChange, accent }) {
    const anim = useRef(new RNAnimated.Value(options.findIndex(o => o.value === value) || 0)).current;
    const [width, setWidth] = useState(0);
    const thumbW = width > 0 ? (width - 8) / options.length : 0;

    const select = (idx) => {
        playSound('ui_toggle');
        RNAnimated.spring(anim, {
            toValue: idx,
            useNativeDriver: true,
            damping: 18,
            stiffness: 220,
        }).start();
        onChange(options[idx].value);
    };

    useEffect(() => {
        const idx = options.findIndex(o => o.value === value);
        if (idx !== -1) {
            RNAnimated.spring(anim, {
                toValue: idx,
                useNativeDriver: true,
                damping: 18,
                stiffness: 220,
            }).start();
        }
    }, [value, options]);

    const translateX = anim.interpolate({
        inputRange: options.map((_, i) => i),
        outputRange: options.map((_, i) => i * thumbW),
    });

    return (
        <View
            style={s.seg}
            onLayout={e => setWidth(e.nativeEvent.layout.width)}
        >
            {width > 0 && (
                <RNAnimated.View
                    style={[
                        s.segThumb,
                        {
                            width: thumbW,
                            transform: [{ translateX }],
                            backgroundColor: accent,
                            shadowColor: accent,
                        },
                    ]}
                />
            )}
            {options.map((opt, idx) => {
                const active = opt.value === value;
                return (
                    <TouchableOpacity
                        key={opt.value}
                        style={s.segOpt}
                        onPress={() => select(idx)}
                        activeOpacity={0.8}
                    >
                        <Text style={[s.segOptText, active && s.segOptTextOn]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

function splitChipLabel(label) {
    const normalized = String(label || '').trim();
    const [first = '', ...rest] = Array.from(normalized);
    const firstIsText = /^[A-Za-z0-9]$/.test(first);

    return {
        icon: firstIsText ? first.toUpperCase() : first,
        text: firstIsText ? normalized : rest.join('').trim(),
    };
}

function Chip({ label, selected, onPress, accent, isOrangeHighlight = false }) {
    const activeBorder = isOrangeHighlight ? '#FF6B35' : accent;
    const { icon, text } = splitChipLabel(label);

    return (
        <TouchableOpacity
            style={[
                s.chip,
                selected && { borderColor: activeBorder, backgroundColor: activeBorder },
            ]}
            onPress={() => { playSound('ui_toggle'); onPress(); }}
            activeOpacity={0.75}
        >
            <View style={[
                s.chipIconShell,
                selected && { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.1)' }
            ]}>
                <Text style={[s.chipIcon, selected && s.chipIconSelected]}>{icon}</Text>
            </View>
            <Text style={[s.chipText, selected && { color: '#fff', fontWeight: '800' }]} numberOfLines={2}>
                {text || label}
            </Text>
        </TouchableOpacity>
    );
}

function Section({ label, hint, children }) {
    return (
        <View style={s.section}>
            <View style={s.sectionHd}>
                <Text style={s.sectionLabel}>{label}</Text>
            </View>
            {hint ? <Text style={s.sectionHint}>{hint}</Text> : null}
            {children}
        </View>
    );
}

// ─── Main Screen Component ──────────────────────────────────────────────────

export default function CreateRoomScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const gameType = route.params?.gameType || 'lurdinha';
    const { createRoom, inviteGroupToRoom, loading, error } = useGame();
    const { currentUser } = useAuth();
    const { getUserGroups } = useGroups();
    const meta = GAME_META[gameType] || GAME_META.lurdinha;

    // Time setup
    const isTelephoneOrSecret = gameType === 'telephone' || gameType === 'secret';
    const timeMin = isTelephoneOrSecret ? 30 : 10;
    const timeMax = isTelephoneOrSecret ? 180 : 120;
    const timeStep = isTelephoneOrSecret ? 15 : 5;
    const defaultTime = isTelephoneOrSecret ? 60 : gameType === 'draw' ? 60 : (gameType === 'most_likely' || gameType === 'obvious_mind') ? 30 : 20;
    const defaultRounds = gameType === 'draw' ? 1 : 5;

    const [timePerRound, setTimePerRound] = useState(defaultTime);
    const [totalRounds, setTotalRounds] = useState(defaultRounds);
    const [theme, setTheme] = useState(DEFAULT_LURDINHA_THEME);
    const [difficulty, setDifficulty] = useState('normal');
    const [contentMode, setContentMode] = useState(DEFAULT_DRAW_CONTENT_MODE);
    const [drawCategory, setDrawCategory] = useState(DEFAULT_DRAW_WORD_CATEGORY);
    const [mostLikelyCategory, setMostLikelyCategory] = useState(DEFAULT_MOST_LIKELY_CATEGORY);
    const [tierListCategory, setTierListCategory] = useState(DEFAULT_TIER_LIST_CATEGORY);
    const [voteMode, setVoteMode] = useState('secret');
    const [userGroups, setUserGroups] = useState([]);
    const [activeInviteGroupId, setActiveInviteGroupId] = useState(null);
    const [showInviteGroups, setShowInviteGroups] = useState(false);
    const [groupsLoading, setGroupsLoading] = useState(true);

    const selectedContentMode = DRAW_CONTENT_MODES.find((o) => o.value === contentMode);
    const selectedDrawCategory = DRAW_WORD_CATEGORIES.find((o) => o.value === drawCategory);
    const selectedMostLikelyCategory = MOST_LIKELY_CATEGORIES.find((c) => c.key === mostLikelyCategory);
    const selectedTierListCategory = TIER_LIST_CATEGORIES.find((c) => c.key === tierListCategory);
    const selectedLurdinhaTheme = LURDINHA_THEMES.find((t) => t.key === theme);

    useEffect(() => {
        let active = true;
        const loadUserGroups = async () => {
            try {
                setGroupsLoading(true);
                const groups = await getUserGroups();
                if (!active) return;
                setUserGroups(groups);
                setActiveInviteGroupId((current) => (
                    current && groups.some((group) => group.id === current)
                        ? current
                        : null
                ));
            } catch (err) {
                if (active) setUserGroups([]);
            } finally {
                if (active) setGroupsLoading(false);
            }
        };

        loadUserGroups();
        return () => {
            active = false;
        };
    }, [currentUser?.uid]);

    const onCreatePress = async () => {
        try {
            const roomId = await createRoom({
                timePerRound,
                totalRounds,
                theme: gameType === 'draw' || isTelephoneOrSecret || gameType === 'tier_list' ? DEFAULT_LURDINHA_THEME : (theme || DEFAULT_LURDINHA_THEME),
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
                if (activeInviteGroupId) {
                    inviteGroupToRoom(roomId, activeInviteGroupId).catch((inviteError) => {
                        console.error('[CreateRoomScreen] Group invite failed:', inviteError);
                    });
                }
            }
        } catch (err) {}
    };

    const timeHelper = gameType === 'draw'
        ? (timePerRound < 20 ? 'Rodadas rápidas e caóticas.' : 'Mais tempo para detalhar o desenho.')
        : isTelephoneOrSecret
        ? (timePerRound < 60 ? 'Passos rápidos deixam a história mais absurda.' : 'Mais tempo para pensar antes de passar adiante.')
        : gameType === 'most_likely'
        ? (timePerRound < 30 ? 'Votação rápida e instintiva.' : 'Mais tempo para discutir a escolha.')
        : gameType === 'obvious_mind'
        ? (timePerRound < 30 ? 'Respostas rápidas revelam mais instinto.' : 'Mais tempo para tentar entrar na cabeça do alvo.')
        : gameType === 'tier_list'
        ? (timePerRound < 30 ? 'Classificação rápida e instintiva.' : 'Mais tempo para classificar cada pessoa.')
        : (timePerRound < 20 ? 'Rápido — para quem pensa ágil.' : 'Mais tempo para pensar em estratégias.');

    const roundsLabel = (gameType === 'secret' || gameType === 'telephone') ? 'Número de rodadas'
        : gameType === 'party' ? 'Minigames'
        : (gameType === 'most_likely' || gameType === 'obvious_mind' || gameType === 'tier_list') ? 'Perguntas'
        : 'Rodadas';

    const roundsUnit = gameType === 'party' ? 'minigames'
        : (gameType === 'most_likely' || gameType === 'obvious_mind' || gameType === 'tier_list') ? 'perguntas'
        : 'rodadas';

    const selectedInviteGroup = userGroups.find(group => group.id === activeInviteGroupId);

    const summaryParts = [
        isTelephoneOrSecret ? 'cadeia automática' : `${totalRounds} ${roundsUnit}`,
        `${timePerRound}s por ${isTelephoneOrSecret ? 'passo' : 'rodada'}`,
        gameType === 'draw' ? (contentMode === 'words' ? `dificuldade ${difficulty}` : 'desenho livre') : null,
        gameType === 'most_likely' ? (voteMode === 'secret' ? 'votos secretos' : 'votos públicos') : null,
        selectedInviteGroup ? `grupo: ${selectedInviteGroup.name}` : null,
    ].filter(Boolean);

    // Accent and Theme Color Settings (Purple theme with orange details)
    const accentColor = '#8B5CF6'; // Purple
    const orangeColor = '#FF6B35'; // Orange

    return (
        <View style={s.root}>
            {/* Background */}
            <LinearGradient
                colors={['#000000', '#0E0E10']}
                style={StyleSheet.absoluteFill}
            />

            {/* Glowing background blooms (Purple at top, Orange at bottom) */}
            <View style={[s.bgGlowTop, { backgroundColor: accentColor }]} pointerEvents="none" />
            <View style={[s.bgGlowBottom, { backgroundColor: orangeColor }]} pointerEvents="none" />

            {/* Status-bar space */}
            <View style={{ height: insets.top + 8 }} />

            {/* Navigation Header */}
            <View style={s.nav}>
                <TouchableOpacity style={s.navIcon} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <Text style={{ fontSize: 18, color: '#fff' }}>←</Text>
                </TouchableOpacity>
                <View style={s.navTitle}>
                    <Text style={[s.navKicker, { color: orangeColor }]}>CONFIGURAR</Text>
                    <Text style={s.navName}>{meta.title}</Text>
                </View>
                <SoundMuteButton compact />
            </View>

            {/* Configuration Form Scroll */}
            <ScrollView
                style={s.scroll}
                contentContainerStyle={s.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
            >
                {/* Hero card */}
                <Reanimated.View entering={FadeInDown.duration(260)} style={[s.hero, { borderColor: `${accentColor}30` }]}>
                    <LinearGradient
                        colors={['rgba(139, 92, 246, 0.08)', 'rgba(139, 92, 246, 0.03)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <LinearGradient
                        colors={['rgba(255,255,255,0.06)', 'transparent']}
                        start={{ x: 1, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={s.heroSheen}
                        pointerEvents="none"
                    />
                    <View style={s.heroContent}>
                        <View style={[s.heroEmoji, { backgroundColor: `${accentColor}1A` }]}>
                            <Text style={{ fontSize: 36 }}>{meta.emoji}</Text>
                        </View>
                        <View style={s.heroText}>
                            <Text style={[s.heroKicker, { color: orangeColor }]}>{meta.kicker}</Text>
                            <Text style={s.heroTitle}>{meta.title}</Text>
                            <Text style={s.heroSub}>{meta.subtitle}</Text>
                        </View>
                    </View>
                </Reanimated.View>

                {/* 1. Time selection */}
                {!isTelephoneOrSecret && (
                    <Section
                        label={
                            gameType === 'draw' ? 'Tempo para desenhar'
                            : gameType === 'most_likely' ? 'Tempo para votar'
                            : gameType === 'obvious_mind' ? 'Tempo para pensar'
                            : gameType === 'tier_list' ? 'Tempo para classificar'
                            : 'Tempo para responder'
                        }
                        hint={timeHelper}
                    >
                        <Stepper
                            value={timePerRound}
                            min={timeMin}
                            max={timeMax}
                            unit="seg"
                            onDecrement={() => setTimePerRound(v => Math.max(timeMin, v - timeStep))}
                            onIncrement={() => setTimePerRound(v => Math.min(timeMax, v + timeStep))}
                        />
                    </Section>
                )}

                {/* 2. Rounds / Chain selection */}
                {isTelephoneOrSecret ? (
                    <Section label="Tempo por passo" hint={timeHelper}>
                        <Stepper
                            value={timePerRound}
                            min={timeMin}
                            max={timeMax}
                            unit="seg"
                            onDecrement={() => setTimePerRound(v => Math.max(timeMin, v - timeStep))}
                            onIncrement={() => setTimePerRound(v => Math.min(timeMax, v + timeStep))}
                        />
                        <View style={s.chainInfoBlock}>
                            <Text style={s.chainInfoTitle}>Cadeia automática</Text>
                            <Text style={s.chainInfoBody}>
                                A cadeia passa entre os jogadores e termina na última interpretação antes de voltar ao autor original. O número de passos é definido automaticamente pelo tamanho da sala.
                            </Text>
                            <View style={s.chainStepRow}>
                                <View style={s.chainStep}>
                                    <View style={s.chainStepIconShell}><Text style={s.chainStepIcon}>✏️</Text></View>
                                    <Text style={s.chainStepText}>Frase</Text>
                                </View>
                                <View style={s.chainArrow}><Text style={s.chainArrowText}>→</Text></View>
                                <View style={s.chainStep}>
                                    <View style={s.chainStepIconShell}><Text style={s.chainStepIcon}>🎨</Text></View>
                                    <Text style={s.chainStepText}>Desenho</Text>
                                </View>
                                <View style={s.chainArrow}><Text style={s.chainArrowText}>→</Text></View>
                                <View style={s.chainStep}>
                                    <View style={s.chainStepIconShell}><Text style={s.chainStepIcon}>💭</Text></View>
                                    <Text style={s.chainStepText}>Frase</Text>
                                </View>
                                <View style={s.chainArrow}><Text style={s.chainArrowText}>→</Text></View>
                                <View style={s.chainStep}>
                                    <View style={s.chainStepIconShell}><Text style={s.chainStepIcon}>🎨</Text></View>
                                    <Text style={s.chainStepText}>...</Text>
                                </View>
                            </View>
                        </View>
                    </Section>
                ) : (
                    <Section label={roundsLabel}>
                        <Stepper
                            value={totalRounds}
                            min={3}
                            max={20}
                            unit={roundsUnit}
                            onDecrement={() => setTotalRounds(v => Math.max(3, v - 1))}
                            onIncrement={() => setTotalRounds(v => Math.min(20, v + 1))}
                        />
                    </Section>
                )}

                {/* 3. Draw content mode */}
                {gameType === 'draw' && (
                    <Section label="Modo da rodada" hint={selectedContentMode?.description}>
                        <Segmented
                            options={DRAW_CONTENT_MODES}
                            value={contentMode}
                            onChange={setContentMode}
                            accent={accentColor}
                        />
                    </Section>
                )}

                {/* 4. Draw category (Words mode only) */}
                {gameType === 'draw' && contentMode === 'words' && (
                    <Section label="Categoria das palavras" hint={selectedDrawCategory?.description}>
                        <View style={s.chips}>
                            {DRAW_WORD_CATEGORIES.map(c => (
                                <Chip
                                    key={c.value}
                                    label={c.label}
                                    selected={drawCategory === c.value}
                                    onPress={() => setDrawCategory(c.value)}
                                    accent={accentColor}
                                />
                            ))}
                        </View>
                    </Section>
                )}

                {/* 5. Draw difficulty (Words mode only) */}
                {gameType === 'draw' && contentMode === 'words' && (
                    <Section
                        label="Dificuldade"
                        hint={
                            difficulty === 'easy' ? 'Palavras simples e do dia a dia.'
                            : difficulty === 'normal' ? 'Nível padrão equilibrado.'
                            : 'Palavras abstratas e compostas. Pontos ×1.5 em toda a rodada!'
                        }
                    >
                        <Segmented
                            options={[
                                { value: 'easy', label: '😊 Fácil' },
                                { value: 'normal', label: '🎯 Normal' },
                                { value: 'hard', label: '🔥 Difícil' },
                            ]}
                            value={difficulty}
                            onChange={setDifficulty}
                            accent={accentColor}
                        />
                    </Section>
                )}

                {/* 6. Most likely category selection */}
                {gameType === 'most_likely' && (
                    <Section label="Estilo das perguntas" hint={selectedMostLikelyCategory?.description}>
                        <View style={s.chips}>
                            {MOST_LIKELY_CATEGORIES.map(c => (
                                <Chip
                                    key={c.key}
                                    label={c.label}
                                    selected={mostLikelyCategory === c.key}
                                    onPress={() => setMostLikelyCategory(c.key)}
                                    accent={accentColor}
                                />
                            ))}
                        </View>
                    </Section>
                )}

                {/* 7. Most likely vote mode (public/secret) */}
                {gameType === 'most_likely' && (
                    <Section
                        label="Revelação dos votos"
                        hint={voteMode === 'secret' ? 'Mostra só o resultado final. Menos pressão para votar.' : 'Revela quem votou em quem no fim da rodada.'}
                    >
                        <Segmented
                            options={[
                                { value: 'secret', label: '🔒 Secreto' },
                                { value: 'public', label: '👀 Público' },
                            ]}
                            value={voteMode}
                            onChange={setVoteMode}
                            accent={accentColor}
                        />
                    </Section>
                )}

                {/* 8. Tier list category selection */}
                {gameType === 'tier_list' && (
                    <Section label="Tema das perguntas" hint={selectedTierListCategory?.description}>
                        <View style={s.chips}>
                            {TIER_LIST_CATEGORIES.map(c => (
                                <Chip
                                    key={c.key}
                                    label={c.label}
                                    selected={tierListCategory === c.key}
                                    onPress={() => setTierListCategory(c.key)}
                                    accent={accentColor}
                                />
                            ))}
                        </View>
                    </Section>
                )}

                {/* 9. Lurdinha themes (for lurdinha, party, obvious_mind, impostor, etc.) */}
                {gameType !== 'draw' && gameType !== 'secret' && gameType !== 'most_likely' && gameType !== 'obvious_mind' && gameType !== 'tier_list' && (
                    <Section label="Tema das perguntas" hint={selectedLurdinhaTheme?.description}>
                        <View style={s.chips}>
                            {LURDINHA_THEMES.map(t => (
                                <Chip
                                    key={t.key}
                                    label={t.label}
                                    selected={theme === t.key}
                                    onPress={() => setTheme(t.key)}
                                    accent={accentColor}
                                />
                            ))}
                        </View>
                    </Section>
                )}

                {/* 10. Invite Group option */}
                <Section label="Convidar grupo">
                    <TouchableOpacity
                        style={s.groupInviteToggle}
                        onPress={() => {
                            playSound('ui_toggle');
                            setShowInviteGroups((visible) => !visible);
                        }}
                        activeOpacity={0.78}
                    >
                        <Text style={s.groupInviteToggleText}>
                            {selectedInviteGroup ? selectedInviteGroup.name : 'Convidar grupo'}
                        </Text>
                        {showInviteGroups ? (
                            <ChevronUp size={18} color="rgba(255,255,255,0.55)" />
                        ) : (
                            <ChevronDown size={18} color="rgba(255,255,255,0.55)" />
                        )}
                    </TouchableOpacity>

                    {showInviteGroups ? (
                        groupsLoading ? (
                            <ActivityIndicator color={accentColor} style={{ marginVertical: 12 }} />
                        ) : userGroups.length === 0 ? (
                            <View style={s.groupEmptyCard}>
                                <Text style={s.groupEmptyText}>Você ainda não participa de grupos.</Text>
                            </View>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={s.groupCardsRow}
                            >
                                <TouchableOpacity
                                    style={[
                                        s.groupCard,
                                        !activeInviteGroupId && { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.08)' }
                                    ]}
                                    onPress={() => { playSound('ui_toggle'); setActiveInviteGroupId(null); }}
                                    activeOpacity={0.8}
                                >
                                    {!activeInviteGroupId && <View style={[s.groupCardBadge, { backgroundColor: '#EF4444' }]} />}
                                    <View style={s.groupCardEmojiShell}>
                                        <Text style={{ fontSize: 20 }}>🚫</Text>
                                    </View>
                                    <Text style={s.groupCardName} numberOfLines={2}>Não convidar</Text>
                                </TouchableOpacity>

                                {userGroups.map(group => {
                                    const isSelected = activeInviteGroupId === group.id;
                                    return (
                                        <TouchableOpacity
                                            key={group.id}
                                            style={[
                                                s.groupCard,
                                                isSelected && { borderColor: accentColor, backgroundColor: `${accentColor}1A` }
                                            ]}
                                            onPress={() => { playSound('ui_toggle'); setActiveInviteGroupId(group.id); }}
                                            activeOpacity={0.8}
                                        >
                                            {isSelected && <View style={[s.groupCardBadge, { backgroundColor: accentColor }]} />}
                                            <View style={s.groupCardEmojiShell}>
                                                <Text style={{ fontSize: 20 }}>{group.badge || '👥'}</Text>
                                            </View>
                                            <Text style={s.groupCardName} numberOfLines={2}>{group.name}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )
                    ) : null}
                </Section>

                {error && (
                    <Reanimated.View entering={FadeInDown} style={s.errorContainer}>
                        <Text style={s.errorText}>{error}</Text>
                    </Reanimated.View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* CTA bottom bar */}
            <View style={[s.ctaBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
                <Text style={s.ctaSummary}>
                    <Text style={s.ctaSummaryBold}>{summaryParts.join('  ·  ')}</Text>
                </Text>

                <TouchableOpacity
                    style={[s.ctaBtn, { shadowColor: orangeColor }]}
                    onPress={onCreatePress}
                    disabled={loading}
                    activeOpacity={0.88}
                >
                    <LinearGradient
                        colors={['#8B5CF6', '#7C3AED', '#FF6B35']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={s.ctaBtnInner}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <>
                                <Text style={s.ctaBtnText}>CRIAR SALA</Text>
                                <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
                            </>
                        }
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Component Styles ────────────────────────────────────────────────────────

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },

    // background glows
    bgGlowTop: {
        position: 'absolute',
        top: -120, right: -100,
        width: 300, height: 300,
        borderRadius: 150,
        opacity: 0.08,
    },
    bgGlowBottom: {
        position: 'absolute',
        bottom: -120, left: -100,
        width: 300, height: 300,
        borderRadius: 150,
        opacity: 0.06,
    },

    // nav
    nav: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingBottom: 14,
    },
    navIcon: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
        alignItems: 'center', justifyContent: 'center',
    },
    navTitle: { flex: 1, alignItems: 'center' },
    navKicker: {
        fontSize: 10, fontWeight: '850',
        letterSpacing: 1.8,
    },
    navName: {
        fontSize: 16, fontWeight: '750', color: '#fff', marginTop: 2,
    },

    // scroll
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

    // hero card
    hero: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 18,
        marginBottom: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    heroSheen: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 20,
    },
    heroContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    heroEmoji: {
        width: 64, height: 64, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
    },
    heroText: { flex: 1 },
    heroKicker: {
        fontSize: 10, fontWeight: '850',
        letterSpacing: 2,
        marginBottom: 4,
    },
    heroTitle: {
        fontSize: 20, fontWeight: '800',
        color: '#fff', letterSpacing: -0.3,
        marginBottom: 4,
    },
    heroSub: {
        fontSize: 12.5, fontWeight: '500',
        color: 'rgba(255,255,255,0.65)', lineHeight: 17,
    },

    // section
    section: {
        paddingTop: 22, paddingBottom: 4,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
        marginBottom: 2,
    },
    sectionHd: { marginBottom: 8 },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 0.2,
        color: '#F5F3FF',
    },
    sectionHint: {
        fontSize: 11.5, color: '#71717A',
        lineHeight: 16, marginBottom: 12,
    },

    // stepper
    stepper: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#17171C',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
        borderRadius: 16, padding: 6, height: 60,
        marginTop: 4,
    },
    stepBtn: {
        width: 48, height: 48, borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
        alignItems: 'center', justifyContent: 'center',
    },
    stepBtnDisabled: { opacity: 0.3 },
    stepValue: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    stepNum: {
        fontSize: 28, fontWeight: '800',
        color: '#fff', letterSpacing: -0.5,
    },
    stepUnit: {
        fontSize: 11, fontWeight: '600',
        letterSpacing: 0.8, textTransform: 'uppercase',
        color: '#8B5CF6',
    },

    // chips
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
    chip: {
        width: 104,
        minHeight: 106,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    chipIconShell: {
        width: 46,
        height: 46,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.055)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipIcon: {
        color: '#C4B5FD',
        fontSize: 24,
        fontWeight: '900',
    },
    chipIconSelected: {
        color: '#FFFFFF',
        fontSize: 26,
    },
    chipText: {
        fontSize: 12.5,
        lineHeight: 16,
        fontWeight: '700',
        color: '#9CA3AF',
        textAlign: 'center',
    },

    // segmented
    seg: {
        flexDirection: 'row',
        backgroundColor: '#17171C',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
        borderRadius: 14, padding: 4, height: 48,
        marginTop: 4,
    },
    segThumb: {
        position: 'absolute',
        top: 4, left: 4,
        height: 40, borderRadius: 11,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28, shadowRadius: 10,
        elevation: 6,
    },
    segOpt: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        borderRadius: 11, zIndex: 1,
    },
    segOptText: {
        fontSize: 13, fontWeight: '600', color: '#6B7280',
    },
    segOptTextOn: { color: '#fff', fontWeight: '800' },

    // chain block (special secret/telephone)
    chainInfoBlock: {
        marginTop: 18,
        padding: 16,
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
        borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.1)',
        borderRadius: 16,
        gap: 10,
    },
    chainInfoTitle: {
        fontSize: 11, fontWeight: '750',
        color: '#FF6B35', textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    chainInfoBody: {
        fontSize: 13, lineHeight: 18,
        color: 'rgba(255,255,255,0.6)',
    },
    chainStepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    chainStep: {
        width: 84,
        minHeight: 92,
        padding: 10,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(139,92,246,0.22)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    chainStepIconShell: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#8B5CF6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chainStepIcon: {
        fontSize: 23,
    },
    chainStepText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
        textAlign: 'center',
    },
    chainArrow: { paddingHorizontal: 2 },
    chainArrowText: { color: 'rgba(255,255,255,0.3)', fontSize: 13 },

    // error
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

    // cta bottom bar
    ctaBar: {
        paddingHorizontal: 20, paddingTop: 14,
        backgroundColor: 'rgba(0,0,0,0.88)',
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
        gap: 10,
    },
    ctaSummary: {
        fontSize: 11.5, color: '#6B7280',
        textAlign: 'center', letterSpacing: 0.2,
    },
    ctaSummaryBold: { color: '#9CA3AF', fontWeight: '700' },
    ctaBtn: {
        borderRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35, shadowRadius: 15,
        elevation: 12,
    },
    ctaBtnInner: {
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10,
    },
    ctaBtnText: {
        color: '#fff', fontSize: 14, fontWeight: '800',
        letterSpacing: 1.8,
    },

    // group card selection UI
    groupInviteToggle: {
        minHeight: 42,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.035)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.07)',
        marginTop: 4,
    },
    groupInviteToggleText: {
        color: 'rgba(255,255,255,0.74)',
        fontSize: 13,
        fontWeight: '700',
    },
    groupCardsRow: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 6,
        paddingRight: 20,
    },
    groupCard: {
        width: 140,
        height: 105,
        backgroundColor: '#17171C',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.07)',
        borderRadius: 16,
        padding: 12,
        justifyContent: 'space-between',
        position: 'relative',
    },
    groupCardBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    groupCardEmojiShell: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    groupCardName: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#FFFFFF',
        lineHeight: 16,
    },
    groupEmptyCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    groupEmptyText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.4)',
        textAlign: 'center',
        lineHeight: 17,
    },
});
