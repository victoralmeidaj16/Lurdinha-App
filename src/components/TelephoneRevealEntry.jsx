import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import AvatarCircle from './AvatarCircle';

// ─── Motion system da revelação ──────────────────────────────────────────────
// Sem molas: tudo desacelera suave (curva "expo-out") e para no lugar, como uma
// cena de abertura. Cada passo revelado é uma pequena sequência:
//   1. a linha de conexão cresce a partir do card anterior
//   2. o card sobe e aparece
//   3. o conteúdo se revela: frase palavra por palavra, desenho traço por traço
//   4. no último passo da cadeia (o "punchline"), um halo laranja acende uma vez
export const REVEAL_EASE = Easing.bezier(0.16, 1, 0.3, 1);

const CONNECTOR_MS = 240;
const CARD_DELAY_MS = 140;
const CARD_MS = 420;
const CONTENT_DELAY_MS = 320;
const WORD_STAGGER_MS = 55;
const WORD_MS = 320;
const DRAW_MIN_MS = 900;
const DRAW_MAX_MS = 2200;

const VIRTUAL_CANVAS_WIDTH = 320;
const VIRTUAL_CANVAS_HEIGHT = 420;

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Os traços são polilinhas "M x y L x y ...": o comprimento é a soma dos segmentos.
const polylineLength = (d = '') => {
    const nums = d.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
    let length = 0;
    for (let i = 2; i + 1 < nums.length; i += 2) {
        length += Math.hypot(nums[i] - nums[i - 2], nums[i + 1] - nums[i - 1]);
    }
    return Math.max(length, 1);
};

function DrawnStroke({ stroke, progress, start, end, length }) {
    const animatedProps = useAnimatedProps(() => {
        const local = Math.min(Math.max((progress.value - start) / Math.max(end - start, 0.0001), 0), 1);
        return { strokeDashoffset: length * (1 - local) };
    });

    return (
        <AnimatedPath
            d={stroke.path}
            stroke={stroke.color}
            strokeWidth={stroke.width || 7}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={[length, length]}
            animatedProps={animatedProps}
        />
    );
}

// Desenho que se refaz na ordem em que foi feito; a duração acompanha o tamanho do desenho.
function RevealDrawing({ entry, animate, delay }) {
    const strokes = entry?.strokes || [];
    const timeline = useMemo(() => {
        const lengths = strokes.map((s) => polylineLength(s.path));
        const total = lengths.reduce((sum, l) => sum + l, 0) || 1;
        let cursor = 0;
        return lengths.map((length) => {
            const start = cursor / total;
            cursor += length;
            return { length, start, end: cursor / total };
        });
    }, [strokes]);
    const progress = useSharedValue(animate ? 0 : 1);

    useEffect(() => {
        if (!animate) return;
        const duration = Math.min(DRAW_MAX_MS, Math.max(DRAW_MIN_MS, strokes.length * 70));
        progress.value = withDelay(delay, withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }));
    }, []);

    return (
        <View style={styles.drawingOuterFrame}>
            <View style={styles.drawingFrameHeader}>
                <View style={styles.artDot} />
                <View style={styles.artDot} />
                <View style={styles.artDot} />
            </View>
            <View style={[styles.drawingFrame, { backgroundColor: entry?.canvasFill || '#0F172A' }]}>
                <Svg width="100%" height="100%" viewBox={`0 0 ${VIRTUAL_CANVAS_WIDTH} ${VIRTUAL_CANVAS_HEIGHT}`}>
                    {strokes.map((stroke, i) => (
                        <DrawnStroke
                            key={stroke.id || i}
                            stroke={stroke}
                            progress={progress}
                            start={timeline[i].start}
                            end={timeline[i].end}
                            length={timeline[i].length}
                        />
                    ))}
                </Svg>
            </View>
        </View>
    );
}

function RevealWord({ word, index, animate, delay }) {
    const p = useSharedValue(animate ? 0 : 1);

    useEffect(() => {
        if (!animate) return;
        p.value = withDelay(delay + index * WORD_STAGGER_MS, withTiming(1, { duration: WORD_MS, easing: REVEAL_EASE }));
    }, []);

    const style = useAnimatedStyle(() => ({
        opacity: p.value,
        transform: [{ translateY: interpolate(p.value, [0, 1], [8, 0]) }],
    }));

    return <Animated.Text style={[styles.phraseText, style]}>{word} </Animated.Text>;
}

// Frase que aparece palavra por palavra, no ritmo de alguém lendo em voz alta.
function RevealPhrase({ text, animate, delay }) {
    const words = useMemo(() => `“${text}”`.split(/\s+/).filter(Boolean), [text]);
    return (
        <View style={styles.phraseBubble}>
            <View style={styles.phraseWords}>
                {words.map((word, i) => (
                    <RevealWord key={`${i}-${word}`} word={word} index={i} animate={animate} delay={delay} />
                ))}
            </View>
        </View>
    );
}

export default function TelephoneRevealEntry({
    entry,
    contributor,
    label,
    isOriginal,
    showConnector,
    animate,
    isPunchline,
    reduceMotion,
}) {
    const motion = animate && !reduceMotion;
    const connector = useSharedValue(motion && showConnector ? 0 : 1);
    const card = useSharedValue(animate ? 0 : 1);
    const halo = useSharedValue(0);

    // Quanto tempo o conteúdo leva para terminar, para o halo acender só no fim.
    const contentMs = entry.type === 'phrase'
        ? (entry.text || '').split(/\s+/).length * WORD_STAGGER_MS + WORD_MS
        : Math.min(DRAW_MAX_MS, Math.max(DRAW_MIN_MS, (entry.strokes || []).length * 70));

    useEffect(() => {
        if (!animate) return;
        if (reduceMotion) {
            card.value = withTiming(1, { duration: 200 });
            return;
        }
        if (showConnector) {
            connector.value = withTiming(1, { duration: CONNECTOR_MS, easing: REVEAL_EASE });
        }
        card.value = withDelay(showConnector ? CARD_DELAY_MS : 0, withTiming(1, { duration: CARD_MS, easing: REVEAL_EASE }));
        if (isPunchline) {
            halo.value = withDelay(
                CONTENT_DELAY_MS + contentMs,
                withSequence(
                    withTiming(1, { duration: 360, easing: REVEAL_EASE }),
                    withTiming(0.45, { duration: 900, easing: Easing.inOut(Easing.quad) }),
                ),
            );
        }
    }, []);

    const connectorStyle = useAnimatedStyle(() => ({
        height: interpolate(connector.value, [0, 1], [0, 28]),
        opacity: interpolate(connector.value, [0, 1], [0, 0.6]),
    }));

    const cardStyle = useAnimatedStyle(() => ({
        opacity: card.value,
        transform: [
            { translateY: interpolate(card.value, [0, 1], [18, 0]) },
            { scale: interpolate(card.value, [0, 1], [0.98, 1]) },
        ],
    }));

    const haloStyle = useAnimatedStyle(() => ({ opacity: halo.value }));

    return (
        <View style={styles.entryBlock}>
            {showConnector && (
                <View style={styles.connectorSlot}>
                    <Animated.View style={[styles.connectorLine, connectorStyle]} />
                </View>
            )}

            <Animated.View style={cardStyle}>
                {isPunchline && <Animated.View pointerEvents="none" style={[styles.punchlineHalo, haloStyle]} />}
                <View style={[styles.entryCard, isPunchline && styles.entryCardPunchline]}>
                    <View style={styles.entryMeta}>
                        <AvatarCircle name={contributor?.name || '?'} photoURL={contributor?.photoURL} size={32} />
                        <View style={styles.entryMetaText}>
                            <Text style={styles.entryContributorName}>{contributor?.name || 'Jogador'}</Text>
                            <Text style={[styles.entryType, isOriginal && styles.entryTypeOriginal]}>
                                {label} • Turno {entry.turn}
                            </Text>
                        </View>
                        {isPunchline ? (
                            <Animated.View style={[styles.finalChip, haloStyle]}>
                                <Text style={styles.finalChipText}>FINAL</Text>
                            </Animated.View>
                        ) : null}
                    </View>

                    {entry.type === 'phrase' ? (
                        <RevealPhrase text={entry.text} animate={motion} delay={CONTENT_DELAY_MS} />
                    ) : (
                        <RevealDrawing entry={entry} animate={motion} delay={CONTENT_DELAY_MS} />
                    )}
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    entryBlock: { width: '100%' },
    connectorSlot: { height: 36, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4 },
    connectorLine: {
        width: 3,
        borderRadius: 2,
        backgroundColor: '#8B5CF6',
    },
    punchlineHalo: {
        position: 'absolute',
        top: -6, left: -6, right: -6, bottom: -6,
        borderRadius: 26,
        borderWidth: 2,
        borderColor: 'rgba(251,146,60,0.75)',
        backgroundColor: 'rgba(251,146,60,0.08)',
    },
    entryCard: {
        backgroundColor: 'rgba(30, 25, 50, 0.92)',
        borderColor: 'rgba(168, 85, 247, 0.22)',
        borderWidth: 1,
        borderRadius: 20,
        padding: 16,
    },
    entryCardPunchline: {
        borderColor: 'rgba(251,146,60,0.35)',
    },
    entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    entryMetaText: { flex: 1 },
    entryContributorName: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
    entryType: { color: '#A78BFA', fontSize: 12, fontWeight: '700', marginTop: 2 },
    entryTypeOriginal: { color: '#FBBF24' },
    finalChip: {
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
        backgroundColor: 'rgba(251,146,60,0.18)',
    },
    finalChipText: { color: '#FDBA74', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    phraseBubble: {
        paddingVertical: 18,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(139, 92, 246, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.18)',
    },
    phraseWords: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
    phraseText: {
        fontSize: 19,
        lineHeight: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        fontStyle: 'italic',
    },
    drawingOuterFrame: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.25)',
        backgroundColor: '#0A0515',
        overflow: 'hidden',
    },
    drawingFrameHeader: {
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    artDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.18)' },
    drawingFrame: { width: '100%', aspectRatio: 0.76 },
});
