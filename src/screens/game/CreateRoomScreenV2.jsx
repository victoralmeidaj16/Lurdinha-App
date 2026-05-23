/**
 * CreateRoomScreenV2 — new design language (HTML prototype → RN)
 * Demo: most_likely only. Compare with CreateRoomScreen.jsx.
 */
import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Minus, Plus, Share2, Copy } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../hooks/useGroups';
import {
    MOST_LIKELY_CATEGORIES,
    DEFAULT_MOST_LIKELY_CATEGORY,
} from '../../hooks/game/mostLikely';
import { playSound } from '../../utils/sounds';

// ─── Game meta ─────────────────────────────────────────────────────────────
const META = {
    accent:      '#3B82F6',
    accentLight: '#93C5FD',
    accentDark:  '#1D4ED8',
    emoji:       '👀',
    kicker:      'SOCIAL GAME',
    title:       'Quem é Mais Provável?',
    subtitle:    'Escolha o estilo das perguntas e como os votos serão revelados.',
};

// ─── Stepper ───────────────────────────────────────────────────────────────
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

// ─── Segmented control ─────────────────────────────────────────────────────
function Segmented({ options, value, onChange, accent }) {
    const anim = useRef(new Animated.Value(options.findIndex(o => o.value === value) || 0)).current;
    const [width, setWidth] = useState(0);
    const thumbW = width > 0 ? (width - 8) / options.length : 0;

    const select = (idx) => {
        playSound('ui_toggle');
        Animated.spring(anim, {
            toValue: idx,
            useNativeDriver: true,
            damping: 18,
            stiffness: 220,
        }).start();
        onChange(options[idx].value);
    };

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
                <Animated.View
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

// ─── Chip ──────────────────────────────────────────────────────────────────
function Chip({ label, selected, onPress, accent }) {
    return (
        <TouchableOpacity
            style={[
                s.chip,
                selected && { borderColor: accent, backgroundColor: `${accent}1A` },
            ]}
            onPress={() => { playSound('ui_toggle'); onPress(); }}
            activeOpacity={0.75}
        >
            <Text style={[s.chipText, selected && { color: '#fff', fontWeight: '700' }]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

// ─── Toggle ────────────────────────────────────────────────────────────────
function Toggle({ value, onChange, accent }) {
    const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

    const toggle = () => {
        playSound('ui_toggle');
        const next = !value;
        Animated.spring(anim, {
            toValue: next ? 1 : 0,
            useNativeDriver: true,
            damping: 16,
            stiffness: 260,
        }).start();
        onChange(next);
    };

    const knobX = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 21] });
    const bg    = anim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.12)', accent] });

    return (
        <Animated.View style={[s.toggle, { backgroundColor: bg }]}>
            <Pressable onPress={toggle} style={StyleSheet.absoluteFill} />
            <Animated.View style={[s.toggleKnob, { transform: [{ translateX: knobX }] }]} />
        </Animated.View>
    );
}

// ─── Section ───────────────────────────────────────────────────────────────
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

// ─── Setting row ───────────────────────────────────────────────────────────
function SettingRow({ icon, label, description, value, onChange, accent }) {
    return (
        <View style={s.settingRow}>
            <View style={s.settingInfo}>
                <Text style={s.settingLabel}>{icon ? `${icon}  ` : ''}{label}</Text>
                {description ? <Text style={s.settingDesc}>{description}</Text> : null}
            </View>
            <Toggle value={value} onChange={onChange} accent={accent} />
        </View>
    );
}

// ─── Main screen ───────────────────────────────────────────────────────────
export default function CreateRoomScreenV2({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const { createRoom, inviteGroupToRoom, loading } = useGame();
    const { currentUser } = useAuth();
    const { getUserGroups } = useGroups();

    const [timePerRound, setTimePerRound]         = useState(30);
    const [totalRounds, setTotalRounds]           = useState(5);
    const [category, setCategory]                 = useState(DEFAULT_MOST_LIKELY_CATEGORY);
    const [voteMode, setVoteMode]                 = useState('secret');
    const [showVotes, setShowVotes]               = useState(false);
    const [adminGroups, setAdminGroups]           = useState([]);
    const [selectedInviteGroupId, setSelectedInviteGroupId] = useState(null);
    const [groupsLoading, setGroupsLoading]       = useState(true);

    const selectedCategory = MOST_LIKELY_CATEGORIES.find(c => c.key === category);
    const selectedInviteGroup = adminGroups.find(group => group.id === selectedInviteGroupId);

    const summaryParts = [
        `${totalRounds} perguntas`,
        `${timePerRound}s por rodada`,
        voteMode === 'secret' ? 'votos secretos' : 'votos públicos',
        selectedInviteGroup ? `convite: ${selectedInviteGroup.name}` : null,
    ].filter(Boolean);

    useEffect(() => {
        let active = true;
        const loadAdminGroups = async () => {
            try {
                setGroupsLoading(true);
                const groups = await getUserGroups();
                if (!active) return;
                const nextAdminGroups = groups.filter(group => group.admins?.includes(currentUser?.uid));
                setAdminGroups(nextAdminGroups);
                setSelectedInviteGroupId(current => (
                    current && nextAdminGroups.some(group => group.id === current)
                        ? current
                        : null
                ));
            } catch (_) {
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

    const onCreatePress = async () => {
        try {
            const roomId = await createRoom({
                gameType: 'most_likely',
                timePerRound,
                totalRounds,
                category,
                voteMode,
                allowSelfVote: false,
            });
            if (roomId) {
                navigation.replace('Lobby', { roomId });
                if (selectedInviteGroupId) {
                    inviteGroupToRoom(roomId, selectedInviteGroupId).catch((inviteError) => {
                        console.error('[CreateRoomScreenV2] Group invite failed:', inviteError);
                    });
                }
            }
        } catch (_) {}
    };

    return (
        <View style={s.root}>
            {/* Background */}
            <LinearGradient
                colors={['#000000', '#0E0E10']}
                style={StyleSheet.absoluteFill}
            />
            <View style={[s.bgGlow, { backgroundColor: META.accent }]} pointerEvents="none" />

            {/* Status-bar space */}
            <View style={{ height: insets.top + 8 }} />

            {/* Nav */}
            <View style={s.nav}>
                <TouchableOpacity style={s.navIcon} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <Text style={{ fontSize: 18, color: '#fff' }}>←</Text>
                </TouchableOpacity>
                <View style={s.navTitle}>
                    <Text style={s.navKicker}>CONFIGURAR</Text>
                    <Text style={s.navName}>Criar Sala</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Scroll */}
            <ScrollView
                style={s.scroll}
                contentContainerStyle={s.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
            >
                {/* Hero card */}
                <View style={[s.hero, { backgroundColor: `${META.accent}18`, borderColor: `${META.accent}30` }]}>
                    {/* sheen */}
                    <LinearGradient
                        colors={['rgba(255,255,255,0.10)', 'transparent']}
                        start={{ x: 1, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={s.heroSheen}
                        pointerEvents="none"
                    />
                    <View style={s.heroContent}>
                        <View style={[s.heroEmoji, { backgroundColor: `${META.accent}22` }]}>
                            <Text style={{ fontSize: 36 }}>{META.emoji}</Text>
                        </View>
                        <View style={s.heroText}>
                            <Text style={s.heroKicker}>{META.kicker}</Text>
                            <Text style={s.heroTitle}>{META.title}</Text>
                            <Text style={s.heroSub}>{META.subtitle}</Text>
                        </View>
                    </View>
                </View>

                {/* Tempo para votar */}
                <Section
                    label="Tempo para votar"
                    hint={timePerRound < 30 ? 'Votação rápida e instintiva.' : 'Mais tempo para discutir a escolha.'}
                >
                    <Stepper
                        value={timePerRound}
                        min={10}
                        max={120}
                        unit="seg"
                        onDecrement={() => setTimePerRound(v => Math.max(10, v - 5))}
                        onIncrement={() => setTimePerRound(v => Math.min(120, v + 5))}
                    />
                </Section>

                {/* Número de perguntas */}
                <Section label="Número de perguntas">
                    <Stepper
                        value={totalRounds}
                        min={3}
                        max={20}
                        unit="perguntas"
                        onDecrement={() => setTotalRounds(v => Math.max(3, v - 1))}
                        onIncrement={() => setTotalRounds(v => Math.min(20, v + 1))}
                    />
                </Section>

                {/* Estilo das perguntas */}
                <Section
                    label="Estilo das perguntas"
                    hint={selectedCategory?.description}
                >
                    <View style={s.chips}>
                        {MOST_LIKELY_CATEGORIES.map(c => (
                            <Chip
                                key={c.key}
                                label={c.label}
                                selected={category === c.key}
                                onPress={() => setCategory(c.key)}
                                accent={META.accent}
                            />
                        ))}
                    </View>
                </Section>

                {/* Revelação dos votos */}
                <Section label="Revelação dos votos">
                    <Segmented
                        options={[
                            { value: 'secret', label: '🔒 Secreto' },
                            { value: 'public', label: '👀 Público' },
                        ]}
                        value={voteMode}
                        onChange={setVoteMode}
                        accent={META.accent}
                    />
                </Section>

                <Section
                    label="Convidar grupo"
                    hint={
                        groupsLoading
                            ? 'Carregando grupos onde você é admin...'
                            : adminGroups.length === 0
                                ? 'Apenas admins de grupo podem chamar membros para a sala.'
                                : selectedInviteGroup
                                    ? 'Os membros recebem convite e notificação para entrar no lobby.'
                                    : 'Opcional: selecione um grupo para chamar quando a sala for criada.'
                    }
                >
                    <View style={s.chips}>
                        <Chip
                            label="Não convidar"
                            selected={!selectedInviteGroupId}
                            onPress={() => setSelectedInviteGroupId(null)}
                            accent={META.accent}
                        />
                        {adminGroups.map(group => (
                            <Chip
                                key={group.id}
                                label={`${group.badge || '👥'} ${group.name}`}
                                selected={selectedInviteGroupId === group.id}
                                onPress={() => setSelectedInviteGroupId(group.id)}
                                accent={META.accent}
                            />
                        ))}
                    </View>
                </Section>

                {/* Opções extras */}
                <Section label="Opções">
                    <SettingRow
                        icon="📊"
                        label="Mostrar placar ao vivo"
                        description="Exibe a contagem de votos em tempo real durante a rodada."
                        value={showVotes}
                        onChange={setShowVotes}
                        accent={META.accent}
                    />
                </Section>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* CTA bar */}
            <View style={[s.ctaBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
                <Text style={s.ctaSummary}>
                    <Text style={s.ctaSummaryBold}>{summaryParts.join('  ·  ')}</Text>
                </Text>

                <TouchableOpacity
                    style={[s.ctaBtn, { shadowColor: META.accent }]}
                    onPress={onCreatePress}
                    disabled={loading}
                    activeOpacity={0.88}
                >
                    <LinearGradient
                        colors={[META.accentLight, META.accent, META.accentDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
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

// ─── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },

    // bg glow
    bgGlow: {
        position: 'absolute',
        top: -120, left: -100,
        width: 300, height: 300,
        borderRadius: 150,
        opacity: 0.08,
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
        fontSize: 10, fontWeight: '700',
        letterSpacing: 1.8, color: 'rgba(255,255,255,0.4)',
    },
    navName: {
        fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 2,
    },

    // scroll
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 0 },

    // hero card
    hero: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 18,
        marginBottom: 8,
        overflow: 'hidden',
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
        fontSize: 10, fontWeight: '800',
        letterSpacing: 2, color: 'rgba(255,255,255,0.6)',
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
    sectionHd: { marginBottom: 6 },
    sectionLabel: {
        fontSize: 10.5, fontWeight: '700',
        letterSpacing: 1.6, textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.45)',
    },
    sectionHint: {
        fontSize: 11.5, color: '#71717A',
        lineHeight: 16, marginBottom: 12,
    },

    // stepper
    stepper: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#17171B',
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
        color: '#6B7280',
    },

    // chips
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    chip: {
        paddingVertical: 8, paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    },
    chipText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },

    // segmented
    seg: {
        flexDirection: 'row',
        backgroundColor: '#17171B',
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

    // toggle
    toggle: {
        width: 50, height: 30, borderRadius: 999,
        justifyContent: 'center',
    },
    toggleKnob: {
        position: 'absolute',
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3, shadowRadius: 4,
        elevation: 4,
    },

    // setting row
    settingRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#17171B',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
        borderRadius: 14, padding: 14,
        marginTop: 4,
    },
    settingInfo: { flex: 1 },
    settingLabel: { fontSize: 13.5, fontWeight: '700', color: '#fff' },
    settingDesc: { fontSize: 11.5, color: '#6B7280', marginTop: 3, lineHeight: 16 },

    // cta bar
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
        borderRadius: 16, overflow: 'hidden',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.36, shadowRadius: 18,
        elevation: 12,
    },
    ctaBtnInner: {
        height: 56,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10,
    },
    ctaBtnText: {
        color: '#fff', fontSize: 14, fontWeight: '800',
        letterSpacing: 1.8,
    },
});
