import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
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
import { ArrowRight, Minus, Plus } from 'lucide-react-native';
import Reanimated, {
    Easing,
    FadeIn,
    FadeInDown,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SoundMuteButton from '../../components/SoundMuteButton';
import GroupInviteModal from '../../components/GroupInviteModal';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../hooks/useGroups';
import {
    DEFAULT_DRAW_WORD_CATEGORY,
    DRAW_CONTENT_MODES,
    DRAW_WORD_CATEGORIES,
} from '../../utils/drawContent';
import {
    MOST_LIKELY_CATEGORIES,
} from '../../hooks/game/mostLikely';
import { playSound } from '../../utils/sounds';
import { DEFAULT_GAME_TYPE } from '../../utils/socialGames';

// ─── Game meta definitions for the Hero card ──────────────────────────────
const GAME_META = {
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

// Avisa as dicas de toque sempre que a pessoa toca em qualquer lugar da tela.
const TapActivityContext = createContext(null);

const TAP_HINT_IDLE_DELAY = 2000;   // espera sem toques antes de mostrar
const TAP_HINT_PAUSE = 7000;        // pausa entre um ciclo e outro
const TAP_HINT_PULSE = 1500;        // duração de cada onda
const TAP_HINT_PULSE_GAP = 900;     // intervalo entre as duas ondas
const TAP_HINT_CYCLE = TAP_HINT_PULSE * 2 + TAP_HINT_PULSE_GAP;

// Simula um toque (ponto que "aperta" e solta uma onda) para indicar que a seção
// ainda precisa de uma escolha. Aparece 2s depois do último toque, faz duas
// ondas, some por 7s e repete. Fica centralizado sobre a opção onde é renderizado.
function TapHint() {
    const progress = useSharedValue(0);
    const [visible, setVisible] = useState(false);
    const tapActivity = useContext(TapActivityContext);

    useEffect(() => {
        let timer = null;

        const schedule = (delay) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                setVisible(true);
                timer = setTimeout(() => {
                    setVisible(false);
                    schedule(TAP_HINT_PAUSE);
                }, TAP_HINT_CYCLE);
            }, delay);
        };

        schedule(TAP_HINT_IDLE_DELAY);
        const unsubscribe = tapActivity?.subscribe(() => {
            setVisible(false);
            schedule(TAP_HINT_IDLE_DELAY);
        });

        return () => {
            clearTimeout(timer);
            unsubscribe?.();
        };
    }, [tapActivity]);

    useEffect(() => {
        if (!visible) return;
        progress.value = 0;
        progress.value = withSequence(
            withTiming(1, { duration: TAP_HINT_PULSE, easing: Easing.inOut(Easing.sin) }),
            withDelay(TAP_HINT_PULSE_GAP, withTiming(0, { duration: 0 })),
            withTiming(1, { duration: TAP_HINT_PULSE, easing: Easing.inOut(Easing.sin) }),
        );
    }, [visible]);

    const waveStyle = useAnimatedStyle(() => ({
        opacity: 0.45 * (1 - progress.value),
        transform: [{ scale: 0.5 + progress.value * 1.2 }],
    }));

    const dotStyle = useAnimatedStyle(() => ({
        transform: [{ scale: progress.value < 0.2 ? 1 - progress.value : 0.8 + (progress.value - 0.2) * 0.25 }],
    }));

    if (!visible) return null;

    return (
        <Reanimated.View
            entering={FadeIn.duration(500)}
            exiting={FadeOut.duration(250)}
            style={s.tapHint}
            pointerEvents="none"
        >
            <Reanimated.View style={[s.tapHintWave, waveStyle]} />
            <Reanimated.View style={[s.tapHintDot, dotStyle]} />
        </Reanimated.View>
    );
}

function Stepper({ value, onDecrement, onIncrement, unit, min = 1, max = 999 }) {
    return (
        <View style={s.stepper}>
            <TouchableOpacity
                style={[s.stepBtn, value <= min && s.stepBtnDisabled]}
                onPress={() => { if (value > min) { playSound('ui_toggle'); onDecrement(); } }}
                activeOpacity={0.7}
            >
                <Minus size={16} color={value <= min ? '#555' : '#fff'} strokeWidth={2.5} />
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
                <Plus size={16} color={value >= max ? '#555' : '#fff'} strokeWidth={2.5} />
            </TouchableOpacity>
        </View>
    );
}

function Segmented({ options, value, onChange, accent, showHint = false }) {
    const selectedIdx = options.findIndex(o => o.value === value);
    const anim = useRef(new RNAnimated.Value(Math.max(selectedIdx, 0))).current;
    const hadSelection = useRef(selectedIdx !== -1);
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
        if (idx !== -1 && !hadSelection.current) {
            // Primeira escolha: o thumb aparece direto na opção, sem deslizar.
            hadSelection.current = true;
            anim.setValue(idx);
        } else if (idx !== -1) {
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
            {width > 0 && selectedIdx !== -1 && (
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
                        {showHint && idx === 0 && <TapHint />}
                        <Text style={[s.segOptText, active && s.segOptTextOn]} numberOfLines={1}>
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

function Chip({ label, icon: iconProp, selected, onPress, accent, showHint = false, isOrangeHighlight = false }) {
    const activeBorder = isOrangeHighlight ? '#FF6B35' : accent;
    const split = splitChipLabel(label);
    const icon = iconProp || split.icon;
    const text = iconProp ? label : split.text;

    return (
        <TouchableOpacity
            style={[
                s.chip,
                selected && { borderColor: activeBorder, backgroundColor: activeBorder },
            ]}
            onPress={() => { playSound('ui_toggle'); onPress(); }}
            activeOpacity={0.75}
        >
            {showHint && <TapHint />}
            <Text style={s.chipIcon}>{icon}</Text>
            <Text
                style={[s.chipText, selected && { color: '#fff', fontWeight: '800' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
            >
                {text || label}
            </Text>
        </TouchableOpacity>
    );
}

function Section({ label, hint, children, onLayout, noHint = false }) {
    return (
        <View style={s.section} onLayout={onLayout}>
            <View style={s.sectionHd}>
                <Text style={s.sectionLabel}>{label}</Text>
            </View>
            {/* Seções com descrição que aparece depois da escolha reservam a linha;
                seções que nunca têm descrição (noHint) não. */}
            {noHint
                ? <View style={s.sectionNoHintGap} />
                : <Text style={s.sectionHint}>{hint || ' '}</Text>}
            {children}
        </View>
    );
}

// ─── Main Screen Component ──────────────────────────────────────────────────

export default function CreateRoomScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const scrollRef = useRef(null);
    const tapListeners = useRef(new Set());
    const tapActivity = useMemo(() => ({
        subscribe: (listener) => {
            tapListeners.current.add(listener);
            return () => tapListeners.current.delete(listener);
        },
    }), []);
    const notifyTap = () => tapListeners.current.forEach((listener) => listener());
    // Posição (no scroll) da primeira seção de escolha de cada jogo.
    const firstChoiceSectionY = useRef(0);
    const gameType = route.params?.gameType || DEFAULT_GAME_TYPE;
    const isEditing = route.params?.isEditing || false;
    const roomId = route.params?.roomId || null;
    // Only reuse the room's current settings when editing the same game: rounds,
    // time limits and categories are game-specific and would carry over wrong.
    const initialSettings = route.params?.initialSettings?.gameType === gameType
        ? route.params.initialSettings
        : {};
    const { createRoom, inviteGroupToRoom, updateRoomSettings, loading, error } = useGame();
    const { currentUser } = useAuth();
    const { getUserGroups } = useGroups();
    const meta = GAME_META[gameType] || GAME_META[DEFAULT_GAME_TYPE];

    // Time setup
    const isTelephoneOrSecret = gameType === 'telephone' || gameType === 'secret';
    const timeMin = isTelephoneOrSecret ? 30 : 10;
    const timeMax = isTelephoneOrSecret ? 180 : 120;
    const timeStep = isTelephoneOrSecret ? 15 : 5;
    const defaultTime = isEditing && initialSettings.timePerRound !== undefined
        ? initialSettings.timePerRound
        : (isTelephoneOrSecret ? 60 : gameType === 'draw' ? 60 : (gameType === 'most_likely' || gameType === 'obvious_mind') ? 30 : 20);
    const defaultRounds = isEditing && initialSettings.totalRounds !== undefined
        ? initialSettings.totalRounds
        : (gameType === 'draw' ? 1 : 5);

    const [timePerRound, setTimePerRound] = useState(defaultTime);
    const [totalRounds, setTotalRounds] = useState(defaultRounds);
    const [difficulty, setDifficulty] = useState(isEditing && initialSettings.difficulty !== undefined ? initialSettings.difficulty : null);
    const [contentMode, setContentMode] = useState(isEditing && initialSettings.contentMode !== undefined ? initialSettings.contentMode : null);
    const [drawCategory, setDrawCategory] = useState(isEditing && initialSettings.drawCategory !== undefined ? initialSettings.drawCategory : null);
    const [mostLikelyCategory, setMostLikelyCategory] = useState(isEditing && initialSettings.category !== undefined ? initialSettings.category : null);
    const [voteMode, setVoteMode] = useState(isEditing && initialSettings.voteMode !== undefined ? initialSettings.voteMode : null);
    const [userGroups, setUserGroups] = useState([]);
    // Quando a sala é aberta a partir de um grupo, ele já vem selecionado para convite.
    const [activeInviteGroupId, setActiveInviteGroupId] = useState(route.params?.inviteGroupId || null);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [draftInviteGroupId, setDraftInviteGroupId] = useState(null);
    const [groupsLoading, setGroupsLoading] = useState(true);

    const selectedContentMode = DRAW_CONTENT_MODES.find((o) => o.value === contentMode);
    const selectedDrawCategory = DRAW_WORD_CATEGORIES.find((o) => o.value === drawCategory);
    const selectedMostLikelyCategory = MOST_LIKELY_CATEGORIES.find((c) => c.key === mostLikelyCategory);

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

        // Recarrega ao voltar para a tela (ex.: depois de criar um grupo pelo modal).
        const unsubscribeFocus = navigation.addListener('focus', loadUserGroups);

        return () => {
            active = false;
            unsubscribeFocus();
        };
    }, [currentUser?.uid]);

    const openInviteModal = () => {
        playSound('ui_toggle');
        setDraftInviteGroupId(activeInviteGroupId || userGroups[0]?.id || null);
        setInviteModalOpen(true);
    };

    const confirmInviteGroup = () => {
        setActiveInviteGroupId(draftInviteGroupId);
        setInviteModalOpen(false);
    };

    const clearInviteGroup = () => {
        playSound('ui_toggle');
        setActiveInviteGroupId(null);
        setInviteModalOpen(false);
    };

    // Na primeira escolha da primeira seção, rola até ela para que as próximas
    // seções fiquem visíveis sem precisar arrastar.
    const scrollToFirstChoiceSection = () => {
        setTimeout(() => {
            scrollRef.current?.scrollTo({
                y: Math.max(0, firstChoiceSectionY.current - 80),
                animated: true,
            });
        }, 120);
    };
    const trackFirstChoiceSection = (e) => {
        firstChoiceSectionY.current = e.nativeEvent.layout.y;
    };

    const handleContentModeChange = (next) => {
        if (!contentMode) scrollToFirstChoiceSection();
        setContentMode(next);
    };

    const handleMostLikelyCategoryChange = (next) => {
        if (!mostLikelyCategory) scrollToFirstChoiceSection();
        setMostLikelyCategory(next);
    };

    const createGroupFromInvite = () => {
        setInviteModalOpen(false);
        navigation.navigate('CreateGroup');
    };

    const onCreatePress = async () => {
        const settingsPatch = {
            timePerRound,
            totalRounds,
            gameType,
            difficulty: gameType === 'draw' && contentMode === 'words' ? difficulty : 'normal',
            contentMode: gameType === 'draw' ? contentMode : undefined,
            drawCategory: gameType === 'draw' ? (drawCategory || DEFAULT_DRAW_WORD_CATEGORY) : undefined,
            category: gameType === 'most_likely' ? mostLikelyCategory : undefined,
            voteMode: gameType === 'most_likely' ? voteMode : undefined,
            allowSelfVote: gameType === 'most_likely' ? false : undefined,
        };

        try {
            if (isEditing) {
                await updateRoomSettings(roomId, settingsPatch);
                navigation.goBack();
            } else {
                const newRoomId = await createRoom(settingsPatch);
                if (newRoomId) {
                    navigation.replace('Lobby', { roomId: newRoomId });
                    if (activeInviteGroupId) {
                        inviteGroupToRoom(newRoomId, activeInviteGroupId).catch((inviteError) => {
                            console.error('[CreateRoomScreen] Group invite failed:', inviteError);
                        });
                    }
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
        gameType === 'draw' && contentMode === 'words' && difficulty ? `dificuldade ${difficulty}` : null,
        gameType === 'draw' && contentMode && contentMode !== 'words' ? 'desenho livre' : null,
        gameType === 'most_likely' && voteMode ? (voteMode === 'secret' ? 'votos secretos' : 'votos públicos') : null,
        selectedInviteGroup ? `grupo: ${selectedInviteGroup.name}` : null,
    ].filter(Boolean);

    // O botão de criar só aparece depois que todas as escolhas da tela foram feitas
    // (convidar grupo é opcional e não conta).
    const isConfigComplete = gameType === 'draw'
        ? Boolean(contentMode) && (contentMode !== 'words' || (Boolean(drawCategory) && Boolean(difficulty)))
        : gameType === 'most_likely'
        ? Boolean(mostLikelyCategory) && Boolean(voteMode)
        : true;

    // Accent and Theme Color Settings (Purple theme with orange details)
    const accentColor = '#8B5CF6'; // Purple
    const orangeColor = '#FF6B35'; // Orange

    return (
        <TapActivityContext.Provider value={tapActivity}>
        <View style={s.root} onTouchStart={notifyTap}>
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
                ref={scrollRef}
                style={s.scroll}
                contentContainerStyle={s.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
            >
                {/* Hero card */}
                <Reanimated.View entering={FadeInDown.duration(260)} style={[s.hero, { borderColor: `${accentColor}30` }]}>
                    <LinearGradient
                        colors={['#1E1730', '#16141D']}
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
                        <View style={[s.heroEmoji, { backgroundColor: '#2A1F45' }]}>
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
                    <Section label={roundsLabel} noHint>
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
                    <Section
                        label="Modo da rodada"
                        hint={selectedContentMode?.description}
                        onLayout={trackFirstChoiceSection}
                    >
                        <Segmented
                            options={DRAW_CONTENT_MODES}
                            value={contentMode}
                            onChange={handleContentModeChange}
                            showHint={!contentMode}
                            accent={accentColor}
                        />
                    </Section>
                )}

                {/* 4. Draw category (Words mode only) */}
                {gameType === 'draw' && contentMode === 'words' && (
                    <Section label="Categoria das palavras" hint={selectedDrawCategory?.description}>
                        <View style={s.chips}>
                            {DRAW_WORD_CATEGORIES.map((c, idx) => (
                                <Chip
                                    showHint={!drawCategory && idx === 0}
                                    key={c.value}
                                    label={c.label}
                                    icon={c.icon}
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
                            : difficulty === 'hard' ? 'Palavras abstratas e compostas. Pontos ×1.5 em toda a rodada!'
                            : null
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
                            showHint={!difficulty}
                            accent={accentColor}
                        />
                    </Section>
                )}

                {/* 6. Most likely category selection */}
                {gameType === 'most_likely' && (
                    <Section
                        label="Estilo das perguntas"
                        hint={selectedMostLikelyCategory?.description}
                        onLayout={trackFirstChoiceSection}
                    >
                        <View style={s.chips}>
                            {MOST_LIKELY_CATEGORIES.map((c, idx) => (
                                <Chip
                                    showHint={!mostLikelyCategory && idx === 0}
                                    key={c.key}
                                    label={c.label}
                                    selected={mostLikelyCategory === c.key}
                                    onPress={() => handleMostLikelyCategoryChange(c.key)}
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
                        hint={
                            voteMode === 'secret' ? 'Mostra só o resultado final. Menos pressão para votar.'
                            : voteMode === 'public' ? 'Revela quem votou em quem no fim da rodada.'
                            : null
                        }
                    >
                        <Segmented
                            options={[
                                { value: 'secret', label: '🔒 Secreto' },
                                { value: 'public', label: '👀 Público' },
                            ]}
                            value={voteMode}
                            onChange={setVoteMode}
                            showHint={!voteMode}
                            accent={accentColor}
                        />
                    </Section>
                )}

                {/* 10. Invite Group option */}
                {!isEditing && (
                    <Section label="Convidar grupo" noHint>
                        <View style={s.seg}>
                            <TouchableOpacity
                                style={[
                                    s.segOpt,
                                    selectedInviteGroup && [s.segThumbStatic, { backgroundColor: accentColor, shadowColor: accentColor }],
                                ]}
                                onPress={openInviteModal}
                                activeOpacity={0.8}
                            >
                                <Text style={[s.segOptText, selectedInviteGroup && s.segOptTextOn]} numberOfLines={1}>
                                    {selectedInviteGroup
                                        ? `${selectedInviteGroup.badge || '👥'} ${selectedInviteGroup.name}`
                                        : '👥 Convidar grupo'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Section>
                )}

                {error && (
                    <Reanimated.View entering={FadeInDown} style={s.errorContainer}>
                        <Text style={s.errorText}>{error}</Text>
                    </Reanimated.View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            <GroupInviteModal
                visible={inviteModalOpen}
                groups={userGroups}
                groupsLoading={groupsLoading}
                selectedGroupId={draftInviteGroupId}
                onSelectGroup={setDraftInviteGroupId}
                onInvite={confirmInviteGroup}
                onCreateGroup={createGroupFromInvite}
                onClearSelection={activeInviteGroupId ? clearInviteGroup : undefined}
                onClose={() => setInviteModalOpen(false)}
                confirmLabel="Confirmar grupo"
                subtitle="Escolha um grupo. Os membros recebem um aviso assim que a sala for criada."
            />

            {/* CTA bottom bar */}
            {isConfigComplete && (
                <Reanimated.View
                    entering={FadeInDown.duration(220)}
                    style={[s.ctaBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
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
                                    <Text style={s.ctaBtnText}>{isEditing ? 'SALVAR AJUSTES' : 'CRIAR SALA'}</Text>
                                    <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
                                </>
                            }
                        </LinearGradient>
                    </TouchableOpacity>
                </Reanimated.View>
            )}
        </View>
        </TapActivityContext.Provider>
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
        backgroundColor: '#1C1C22',
        borderWidth: 1, borderColor: '#2A2A31',
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
        color: '#B4B4BE', lineHeight: 17,
    },

    // section
    section: {
        paddingTop: 18, paddingBottom: 2,
        borderTopWidth: 1, borderTopColor: '#1F1F25',
        marginBottom: 2,
    },
    sectionHd: { marginBottom: 8 },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 0.2,
        color: '#F5F3FF',
    },
    sectionNoHintGap: { height: 4 },
    sectionHint: {
        fontSize: 11.5, color: '#8B8B96',
        lineHeight: 16, marginBottom: 12,
    },

    // stepper
    stepper: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#17171C',
        borderWidth: 1, borderColor: '#2A2A31',
        borderRadius: 14, padding: 5, height: 50,
        marginTop: 4,
    },
    stepBtn: {
        width: 40, height: 40, borderRadius: 11,
        backgroundColor: '#24242B',
        borderWidth: 1, borderColor: '#2F2F37',
        alignItems: 'center', justifyContent: 'center',
    },
    stepBtnDisabled: { opacity: 0.3 },
    stepValue: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    stepNum: {
        fontSize: 23, fontWeight: '800',
        color: '#fff', letterSpacing: -0.5,
    },
    stepUnit: {
        fontSize: 11, fontWeight: '600',
        letterSpacing: 0.8, textTransform: 'uppercase',
        color: '#8B5CF6',
    },

    // tap hint
    tapHint: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        alignItems: 'center', justifyContent: 'center',
    },
    tapHintWave: {
        position: 'absolute',
        width: 40, height: 40, borderRadius: 20,
        borderWidth: 1.5, borderColor: '#C4B5FD',
        backgroundColor: 'rgba(139, 92, 246, 0.12)',
    },
    tapHintDot: {
        width: 16, height: 16, borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5, shadowRadius: 6,
    },

    // chips
    chips: { flexDirection: 'row', flexWrap: 'wrap', columnGap: '2.5%', rowGap: 8, marginTop: 4 },
    chip: {
        width: '23%',
        paddingVertical: 16,
        paddingHorizontal: 6,
        borderRadius: 16,
        backgroundColor: '#17171C',
        borderWidth: 1,
        borderColor: '#2A2A31',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    chipIcon: {
        fontSize: 28,
        lineHeight: 34,
        textAlign: 'center',
    },
    chipText: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '700',
        color: '#B4B4BE',
        textAlign: 'center',
    },

    // segmented
    seg: {
        flexDirection: 'row',
        backgroundColor: '#17171C',
        borderWidth: 1, borderColor: '#2A2A31',
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
        paddingHorizontal: 8,
        borderRadius: 11, zIndex: 1,
    },
    segThumbStatic: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28, shadowRadius: 10,
        elevation: 6,
    },
    segOptText: {
        fontSize: 13, fontWeight: '600', color: '#9A9AA5',
    },
    segOptTextOn: { color: '#fff', fontWeight: '800' },

    // chain block (special secret/telephone)
    chainInfoBlock: {
        marginTop: 18,
        padding: 16,
        backgroundColor: '#18151F',
        borderWidth: 1, borderColor: '#2E2545',
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
        color: '#B4B4BE',
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
        backgroundColor: '#1E1A28',
        borderWidth: 1,
        borderColor: '#3A2F5C',
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
    chainArrowText: { color: '#6B6B76', fontSize: 13 },

    // error
    errorContainer: {
        marginTop: 16,
        padding: 14,
        backgroundColor: '#2A1215',
        borderWidth: 1, borderColor: '#4A1D22',
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
        backgroundColor: '#0B0B0E',
        borderTopWidth: 1, borderTopColor: '#1F1F25',
        gap: 10,
    },
    ctaSummary: {
        fontSize: 11.5, color: '#8B8B96',
        textAlign: 'center', letterSpacing: 0.2,
    },
    ctaSummaryBold: { color: '#C4C4CC', fontWeight: '700' },
    ctaBtn: {
        borderRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18, shadowRadius: 10,
        elevation: 6,
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
});
