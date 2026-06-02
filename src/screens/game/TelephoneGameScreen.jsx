import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    PanResponder,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Send,
    Clock3,
    PencilLine,
    Eraser,
    ScanSearch,
    Sparkles,
    Undo2,
    Shuffle,
    Paintbrush,
    PaintBucket,
    ChevronDown,
    ChevronUp,
    X,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../hooks/useGame';
import { playSound } from '../../utils/sounds';

const VIRTUAL_CANVAS_WIDTH = 320;
const VIRTUAL_CANVAS_HEIGHT = 420;
const SECRET_CANVAS_FILL = '#111827';
const SECRET_BRUSH_COLOR = '#FFFFFF';
const SECRET_BRUSH_WIDTH = 7;
const BRUSH_COLORS = ['#FFFFFF', '#F97316', '#22C55E', '#60A5FA', '#F472B6', '#0F172A'];
const FILL_COLORS = ['#111827', '#F8FAFC', '#FDE68A', '#BFDBFE', '#FBCFE8'];
const EXPIRED_PHRASE = 'O tempo acabou e a mente entrou em pane.';
const TELEPHONE_PROMPT_CACHE = [
    'Um astronauta tentando pagar boleto na lua',
    'Uma capivara dando entrevista coletiva',
    'Um vampiro que desmaia quando vê glitter',
    'Uma pizza fugindo de bicicleta na chuva',
    'Um mágico preso dentro da própria cartola',
    'Um cachorro fingindo ser advogado no tribunal',
    'Uma geladeira com crise existencial',
    'Um dinossauro atrasado para uma reunião no Zoom',
    'Uma princesa brigando com um GPS mal educado',
    'Um robô tentando entender fofoca de família',
    'Um jacaré vendendo protetor solar na praia',
    'Uma batata sendo coroada rainha do karaokê',
    'Um fantasma com medo de escuro',
    'Um pombo entregando pizza no espaço',
    'Um peixe reclamando do Wi-Fi do aquário',
    'Uma bruxa trocando a vassoura por patinete',
    'Um alienígena aprendendo samba no elevador',
    'Uma tartaruga vencendo corrida de Fórmula 1',
    'Um palhaço tentando montar um móvel sueco',
    'Um gato milionário comprando uma ilha de atum',
    'Um super-herói cuja fraqueza é coentro',
    'Um frango hipnotizado por uma air fryer',
    'Uma nuvem fazendo terapia porque chove demais',
    'Um pirata procurando sinal de celular no mar',
];

const buildSvgPath = (points) => {
    if (!points.length) return '';
    return points.reduce((acc, point, index) => (
        index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`
    ), '');
};

const getTurnType = (gameState) => gameState?.roundData?.turnType || ((gameState?.currentTurn || 1) % 2 === 1 ? 'phrase' : 'drawing');

const resolveStartTime = (value) => {
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate();
    if (typeof value === 'number') {
        const parsedFromNumber = new Date(value);
        return Number.isNaN(parsedFromNumber.getTime()) ? null : parsedFromNumber;
    }
    if (typeof value?.seconds === 'number') {
        const millis = (value.seconds * 1000) + Math.round((value.nanoseconds || 0) / 1000000);
        const parsedFromParts = new Date(millis);
        return Number.isNaN(parsedFromParts.getTime()) ? null : parsedFromParts;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatCountdown = (value) => {
    const safeValue = Math.max(0, Number.isFinite(value) ? value : 0);
    const minutes = Math.floor(safeValue / 60);
    const seconds = safeValue % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const getRandomPrompt = () => (
    TELEPHONE_PROMPT_CACHE[Math.floor(Math.random() * TELEPHONE_PROMPT_CACHE.length)]
);

const renderStaticDrawing = ({ entry, style }) => (
    <View style={[styles.previewBoard, style, { backgroundColor: entry?.canvasFill || SECRET_CANVAS_FILL }]}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${VIRTUAL_CANVAS_WIDTH} ${VIRTUAL_CANVAS_HEIGHT}`}>
            {(entry?.strokes || []).map((stroke) => (
                <Path
                    key={stroke.id}
                    d={stroke.path}
                    stroke={stroke.color}
                    strokeWidth={stroke.width || SECRET_BRUSH_WIDTH}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />
            ))}
        </Svg>
    </View>
);

export default function TelephoneGameScreen({ roomId, gameState, isSandbox = false }) {
    const { currentUser } = useAuth();
    const { submitSecretPhrase, submitSecretDrawing, removeFromRoom, leaveRoom } = useGame();
    const [phrase, setPhrase] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [draftPath, setDraftPath] = useState('');
    const [strokes, setStrokes] = useState([]);
    const [timeLeft, setTimeLeft] = useState(gameState?.settings?.timePerRound || 60);
    const [selectedColor, setSelectedColor] = useState(SECRET_BRUSH_COLOR);
    const [canvasFill, setCanvasFill] = useState(SECRET_CANVAS_FILL);
    const [activeTool, setActiveTool] = useState('brush');
    const [isStrokePaletteExpanded, setIsStrokePaletteExpanded] = useState(false);
    const [isFillPaletteExpanded, setIsFillPaletteExpanded] = useState(false);
    const [isBoardTouchActive, setIsBoardTouchActive] = useState(false);

    const navigation = useNavigation();

    const handleExit = () => {
        Alert.alert(
            "Sair do jogo",
            "Você quer sair para a home mesmo?",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Confirmar", 
                    style: "destructive", 
                    onPress: async () => {
                if (!isSandbox) {
                    await removeFromRoom(roomId);
                    leaveRoom();
                }
                        navigation.navigate('GameHome');
                    } 
                }
            ]
        );
    };

    const boardLayoutRef = useRef({ width: VIRTUAL_CANVAS_WIDTH, height: VIRTUAL_CANVAS_HEIGHT });
    const currentStrokePoints = useRef([]);
    const autoSubmittedTurnRef = useRef(null);
    const turnTypeRef = useRef('phrase');
    const hasSubmittedRef = useRef(false);
    const isExpiredRef = useRef(false);
    const currentStrokeColorRef = useRef(SECRET_BRUSH_COLOR);
    const currentStrokeWidthRef = useRef(SECRET_BRUSH_WIDTH);

    const players = gameState?.players || [];
    const currentTurn = gameState?.currentTurn || 1;
    const totalTurns = gameState?.roundData?.totalTurns || players.length;
    const readyPlayers = gameState?.roundData?.readyPlayers || [];
    const threads = gameState?.roundData?.threads || {};
    const turnType = getTurnType(gameState);
    const hasSubmitted = readyPlayers.includes(currentUser?.uid);
    const totalTime = gameState?.settings?.timePerRound || 60;
    const isExpired = timeLeft === 0;
    const currentStrokeColor = activeTool === 'eraser' ? canvasFill : selectedColor;
    const currentStrokeWidth = activeTool === 'eraser' ? 18 : SECRET_BRUSH_WIDTH;

    useEffect(() => {
        turnTypeRef.current = turnType;
        hasSubmittedRef.current = hasSubmitted;
        isExpiredRef.current = isExpired;
        currentStrokeColorRef.current = currentStrokeColor;
        currentStrokeWidthRef.current = currentStrokeWidth;
    }, [currentStrokeColor, currentStrokeWidth, hasSubmitted, isExpired, turnType]);

    useEffect(() => {
        setPhrase('');
        setDraftPath('');
        setStrokes([]);
        setCanvasFill(SECRET_CANVAS_FILL);
        setActiveTool('brush');
        currentStrokePoints.current = [];
        autoSubmittedTurnRef.current = null;
    }, [currentTurn, turnType]);

    useEffect(() => {
        const startTime = resolveStartTime(gameState?.roundData?.startTime);
        if (!startTime) {
            setTimeLeft(totalTime);
            return undefined;
        }

        const endTime = new Date(startTime.getTime() + totalTime * 1000);
        const updateRemainingTime = () => {
            const diff = Math.ceil((endTime - new Date()) / 1000);
            setTimeLeft(Math.max(0, diff));
            return diff > 0;
        };

        updateRemainingTime();
        const interval = setInterval(() => {
            if (!updateRemainingTime()) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [gameState?.roundData?.startTime, totalTime]);

    const myIndex = players.findIndex((player) => player.uid === currentUser?.uid);
    const targetThreadAuthorUid = useMemo(() => {
        if (myIndex < 0 || players.length === 0) return null;
        const offset = currentTurn - 1;
        const targetThreadIndex = (myIndex - offset + players.length) % players.length;
        return players[targetThreadIndex]?.uid || null;
    }, [currentTurn, myIndex, players]);

    const currentThreadContent = targetThreadAuthorUid ? (threads[targetThreadAuthorUid] || []) : [];
    const previousEntry = currentThreadContent[currentThreadContent.length - 1] || null;
    const finishStroke = () => {
        setIsBoardTouchActive(false);
        if (currentStrokePoints.current.length < 2) {
            currentStrokePoints.current = [];
            setDraftPath('');
            return;
        }

        const path = buildSvgPath(currentStrokePoints.current);
        const nextStroke = {
            id: `${currentUser?.uid || 'user'}-${Date.now()}`,
            color: currentStrokeColorRef.current,
            width: currentStrokeWidthRef.current,
            path,
        };

        setStrokes((current) => [...current, nextStroke]);
        currentStrokePoints.current = [];
        setDraftPath('');
    };

    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => turnTypeRef.current === 'drawing' && !hasSubmittedRef.current && !isExpiredRef.current,
        onMoveShouldSetPanResponder: () => turnTypeRef.current === 'drawing' && !hasSubmittedRef.current && !isExpiredRef.current,
        onStartShouldSetPanResponderCapture: () => turnTypeRef.current === 'drawing' && !hasSubmittedRef.current && !isExpiredRef.current,
        onMoveShouldSetPanResponderCapture: () => turnTypeRef.current === 'drawing' && !hasSubmittedRef.current && !isExpiredRef.current,
        onPanResponderGrant: (event) => {
            setIsBoardTouchActive(true);
            const { locationX, locationY } = event.nativeEvent;
            const { width, height } = boardLayoutRef.current;
            currentStrokePoints.current = [{
                x: (locationX / width) * VIRTUAL_CANVAS_WIDTH,
                y: (locationY / height) * VIRTUAL_CANVAS_HEIGHT,
            }];
            setDraftPath(buildSvgPath(currentStrokePoints.current));
        },
        onPanResponderMove: (event) => {
            const { locationX, locationY } = event.nativeEvent;
            const { width, height } = boardLayoutRef.current;
            currentStrokePoints.current = [
                ...currentStrokePoints.current,
                {
                    x: (locationX / width) * VIRTUAL_CANVAS_WIDTH,
                    y: (locationY / height) * VIRTUAL_CANVAS_HEIGHT,
                },
            ];
            setDraftPath(buildSvgPath(currentStrokePoints.current));
        },
        onPanResponderRelease: finishStroke,
        onPanResponderTerminate: finishStroke,
        onShouldBlockNativeResponder: () => true,
    })).current;

    const handleRandomPrompt = () => {
        playSound('ui_toggle');
        setPhrase(getRandomPrompt());
    };

    const handleSubmit = async (autoFallback = false) => {
        if (isSubmitting || hasSubmitted) return;
        if (!autoFallback && isExpired) return;
        if (!autoFallback && turnType === 'phrase' && !phrase.trim()) return;
        if (!autoFallback && turnType === 'drawing' && strokes.length === 0) return;

        setIsSubmitting(true);
        try {
            if (!autoFallback) {
                playSound('answer_submit');
            }
            if (turnType === 'phrase') {
                const fallbackPhrase = currentTurn === 1 ? getRandomPrompt() : EXPIRED_PHRASE;
                if (!isSandbox) {
                    await submitSecretPhrase(roomId, phrase.trim() || fallbackPhrase);
                }
                setPhrase('');
            } else {
                if (!isSandbox) {
                    await submitSecretDrawing(roomId, {
                        strokes: strokes.length > 0 ? strokes : [],
                        canvasFill,
                    });
                }
                setDraftPath('');
                setStrokes([]);
            }
            if (!autoFallback) {
                playSound('answer_success');
            }
        } catch (error) {
            console.error('Failed to submit secret step', error);
            if (!autoFallback) {
                playSound('answer_error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const turnKey = `${currentTurn}-${turnType}`;
        if (!isExpired || hasSubmitted || autoSubmittedTurnRef.current === turnKey) return;

        autoSubmittedTurnRef.current = turnKey;
        handleSubmit(true);
    }, [currentTurn, hasSubmitted, isExpired, turnType]);

    const handleClearBoard = () => {
        setDraftPath('');
        setStrokes([]);
        currentStrokePoints.current = [];
    };

    const handleUndoStroke = () => {
        if (strokes.length === 0) return;
        setStrokes((current) => current.slice(0, -1));
    };

    const renderPaletteDisclosure = ({ label, icon, expanded, onToggle, previewColor, children }) => (
        <View style={styles.disclosureBlock}>
            <TouchableOpacity style={styles.disclosureHeader} onPress={onToggle} activeOpacity={0.85}>
                <View style={styles.disclosureLeft}>
                    {icon}
                    <Text style={styles.disclosureLabel}>{label}</Text>
                </View>
                <View style={styles.disclosureRight}>
                    <View style={[styles.disclosurePreview, { backgroundColor: previewColor }]} />
                    {expanded ? <ChevronUp size={16} color="#CBD5E1" /> : <ChevronDown size={16} color="#CBD5E1" />}
                </View>
            </TouchableOpacity>
            {expanded && (
                <View style={styles.disclosureBody}>
                    {children}
                </View>
            )}
        </View>
    );

    const renderDrawingControls = () => (
        <View style={styles.controlsCard}>
            <View style={styles.toolRow}>
                <TouchableOpacity
                    style={[styles.toolChip, activeTool === 'brush' && styles.toolChipActive]}
                    onPress={() => {
                        playSound('ui_toggle');
                        setActiveTool('brush');
                    }}
                    activeOpacity={0.85}
                    disabled={isExpired}
                >
                    <Paintbrush size={16} color={activeTool === 'brush' ? '#FFFFFF' : '#C4B5FD'} />
                    <Text style={[styles.toolChipText, activeTool === 'brush' && styles.toolChipTextActive]}>Pincel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.toolChip, activeTool === 'eraser' && styles.toolChipActive]}
                    onPress={() => {
                        playSound('ui_toggle');
                        setActiveTool('eraser');
                    }}
                    activeOpacity={0.85}
                    disabled={isExpired}
                >
                    <Eraser size={16} color={activeTool === 'eraser' ? '#FFFFFF' : '#FCA5A5'} />
                    <Text style={[styles.toolChipText, activeTool === 'eraser' && styles.toolChipTextActive]}>Borracha</Text>
                </TouchableOpacity>
            </View>

            {renderPaletteDisclosure({
                label: 'Cor do traço',
                icon: <Paintbrush size={14} color="#94A3B8" />,
                expanded: isStrokePaletteExpanded,
                onToggle: () => setIsStrokePaletteExpanded((prev) => !prev),
                previewColor: selectedColor,
                children: (
                    <View style={styles.paletteRow}>
                        {BRUSH_COLORS.map((color) => (
                            <TouchableOpacity
                                key={color}
                                style={[
                                    styles.colorDot,
                                    { backgroundColor: color },
                                    selectedColor === color && styles.colorDotActive,
                                ]}
                                onPress={() => {
                                    playSound('ui_toggle');
                                    setActiveTool('brush');
                                    setSelectedColor(color);
                                }}
                                activeOpacity={0.85}
                                disabled={isExpired}
                            />
                        ))}
                    </View>
                ),
            })}

            {renderPaletteDisclosure({
                label: 'Preenchimento',
                icon: <PaintBucket size={14} color="#94A3B8" />,
                expanded: isFillPaletteExpanded,
                onToggle: () => setIsFillPaletteExpanded((prev) => !prev),
                previewColor: canvasFill,
                children: (
                    <View style={styles.fillRow}>
                        {FILL_COLORS.map((color) => (
                            <TouchableOpacity
                                key={color}
                                style={[
                                    styles.fillSwatch,
                                    { backgroundColor: color },
                                    canvasFill === color && styles.fillSwatchActive,
                                ]}
                                onPress={() => {
                                    playSound('ui_toggle');
                                    setCanvasFill(color);
                                }}
                                activeOpacity={0.85}
                                disabled={isExpired}
                            />
                        ))}
                    </View>
                ),
            })}
        </View>
    );

    if (hasSubmitted) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={['#7e22ce', '#312e81', '#111827']} style={styles.background} />
                <View style={styles.waitingContainer}>
                    <View style={styles.waitingIconWrap}>
                        <Clock3 size={56} color="#FDE68A" />
                    </View>
                    <Text style={styles.waitingTitle}>
                        {currentTurn === totalTurns ? 'Cadeia completa! 🎉' : 'Sua parte está escondida.'}
                    </Text>
                    <Text style={styles.waitingSubtitle}>
                        {currentTurn === totalTurns
                            ? 'Aguardando todos enviarem o último passo antes da revelação.'
                            : `Aguardando o resto da sala terminar o passo ${currentTurn} de ${totalTurns}.`}
                    </Text>
                    <View style={styles.statusBox}>
                        <Text style={styles.statusText}>
                            {readyPlayers.length} de {players.length} pessoas já enviaram.
                        </Text>
                    </View>
                </View>
            </View>
        );
    }

    const isPhraseTurn = turnType === 'phrase';

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#7e22ce', '#312e81', '#111827']} style={styles.background} />

            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <TouchableOpacity onPress={handleExit} activeOpacity={0.8} style={styles.exitButton}>
                        <X size={28} color="#ffffff" />
                    </TouchableOpacity>
                    <View style={styles.brandAccentRow}>
                        <View style={styles.brandAccentGlow} />
                        <View style={styles.brandAccentLine} />
                    </View>
                </View>
                <View style={styles.turnChip}>
                    <Text style={styles.turnChipText}>PASSO {currentTurn} DE {totalTurns}</Text>
                </View>
                <Text style={styles.headerTitle}>Telefone Sem Fio</Text>
                <Text style={styles.headerSubtitle}>
                    {currentTurn === 1
                        ? 'Escreva uma frase. Só você vê o começo.'
                        : isPhraseTurn
                        ? 'O que você acha que é esse desenho?'
                        : 'Desenhe só com base na frase recebida.'}
                </Text>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    scrollEnabled={!isBoardTouchActive}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.mainCard}>
                        <View style={styles.cardAccentOrb} />
                        <View style={styles.cardTopRow}>
                            <View style={styles.stepTimerChip}>
                                <Clock3 size={15} color={isExpired ? '#FCA5A5' : '#FDE68A'} />
                                <Text style={[styles.stepTimerText, isExpired && styles.stepTimerTextExpired]}>
                                    {formatCountdown(timeLeft)}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.modeBadge}>
                            {isPhraseTurn ? <ScanSearch size={16} color="#FDE68A" /> : <PencilLine size={16} color="#BFDBFE" />}
                            <Text style={styles.modeBadgeText}>
                                {isPhraseTurn ? 'Interpretação cega' : 'Desenho cego'}
                            </Text>
                        </View>

                        {currentTurn === 1 ? (
                            <View style={styles.introBlock}>
                                <Text style={styles.introEmoji}>✏️</Text>
                                <Text style={styles.blockTitle}>Escreva sua frase</Text>
                                <Text style={styles.blockCopy}>
                                    Todas as frases passam pela sala ao mesmo tempo. Cada pessoa desenha ou interpreta só a peça que recebeu, sem ver o restante da cadeia.
                                </Text>
                                <TouchableOpacity style={styles.randomPromptButton} onPress={handleRandomPrompt} activeOpacity={0.85}>
                                    <Shuffle size={16} color="#FDE68A" />
                                    <Text style={styles.randomPromptText}>Sortear frase absurda</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.incomingBlock}>
                                <Text style={styles.incomingLabel}>Você recebeu só esta peça</Text>
                                {previousEntry?.type === 'phrase' ? (
                                    <View style={styles.phrasePreview}>
                                        <Text style={styles.phrasePreviewText}>{previousEntry.text}</Text>
                                    </View>
                                ) : (
                                    renderStaticDrawing({ entry: previousEntry })
                                )}
                                <Text style={styles.incomingHint}>
                                    O começo e o resto da cadeia continuam secretos até a revelação final.
                                </Text>
                            </View>
                        )}

                        {isPhraseTurn ? (
                            <>
                                <Text style={styles.inputLabel}>
                                    {currentTurn === 1 ? 'Frase original' : 'O que você acha que isso é?'}
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={currentTurn === 1 ? 'Ex: Um astronauta tentando pagar boleto na lua' : 'Ex: Alien atacando cidade'}
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    value={phrase}
                                    onChangeText={setPhrase}
                                    multiline
                                    maxLength={140}
                                    autoFocus
                                    editable={!isExpired && !isSubmitting}
                                />
                                <Text style={styles.charCount}>{phrase.length}/140</Text>
                            </>
                        ) : (
                            <>
                                <View style={styles.telephoneCanvasSection}>
                                    <View style={styles.canvasHeader}>
                                        <View style={styles.canvasTitleRow}>
                                            <Paintbrush size={18} color="#C4B5FD" />
                                            <Text style={styles.canvasTitle}>Quadro</Text>
                                        </View>

                                        <View style={styles.canvasActions}>
                                            <TouchableOpacity
                                                style={[styles.canvasActionButton, (isExpired || strokes.length === 0) && styles.canvasActionButtonDisabled]}
                                                onPress={handleUndoStroke}
                                                activeOpacity={0.85}
                                                disabled={isExpired || strokes.length === 0}
                                                accessibilityLabel="Desfazer traço"
                                            >
                                                <Undo2 size={16} color="#E9D5FF" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.canvasActionButton, styles.canvasDangerButton, (isExpired || strokes.length === 0) && styles.canvasActionButtonDisabled]}
                                                onPress={handleClearBoard}
                                                activeOpacity={0.85}
                                                disabled={isExpired || strokes.length === 0}
                                                accessibilityLabel="Limpar desenho"
                                            >
                                                <Eraser size={16} color="#FCA5A5" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View
                                        style={[styles.board, { backgroundColor: canvasFill }]}
                                        onTouchStart={() => setIsBoardTouchActive(true)}
                                        onTouchEnd={() => setIsBoardTouchActive(false)}
                                        onTouchCancel={() => setIsBoardTouchActive(false)}
                                        onLayout={(event) => {
                                            const { width, height } = event.nativeEvent.layout;
                                            boardLayoutRef.current = { width, height };
                                        }}
                                        {...panResponder.panHandlers}
                                    >
                                        <View pointerEvents="none" style={styles.boardCountdown}>
                                            <Clock3 size={15} color={isExpired ? '#FCA5A5' : '#F8FAFC'} />
                                            <View>
                                                <Text style={styles.boardCountdownLabel}>Tempo para desenhar</Text>
                                                <Text style={[styles.boardCountdownValue, isExpired && styles.boardCountdownValueExpired]}>
                                                    {formatCountdown(timeLeft)}
                                                </Text>
                                            </View>
                                        </View>

                                        <Svg
                                            width="100%"
                                            height="100%"
                                            viewBox={`0 0 ${VIRTUAL_CANVAS_WIDTH} ${VIRTUAL_CANVAS_HEIGHT}`}
                                            preserveAspectRatio="none"
                                        >
                                            {strokes.map((stroke) => (
                                                <Path
                                                    key={stroke.id}
                                                    d={stroke.path}
                                                    stroke={stroke.color}
                                                    strokeWidth={stroke.width}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    fill="none"
                                                />
                                            ))}
                                            {!!draftPath && (
                                                <Path
                                                    d={draftPath}
                                                    stroke={currentStrokeColor}
                                                    strokeWidth={currentStrokeWidth}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    fill="none"
                                                />
                                            )}
                                        </Svg>

                                        <View style={styles.boardToolsOverlay}>
                                            {renderDrawingControls()}
                                        </View>
                                    </View>
                                </View>
                            </>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (isExpired || (isPhraseTurn && !phrase.trim()) || (!isPhraseTurn && strokes.length === 0)) && styles.submitButtonDisabled,
                            ]}
                            onPress={() => handleSubmit()}
                            disabled={isSubmitting || isExpired || (isPhraseTurn ? !phrase.trim() : strokes.length === 0)}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#8B5CF6', '#6D28D9']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.submitGradient}
                            >
                                <Text style={styles.submitText}>
                                    {isExpired
                                        ? 'Tempo esgotado'
                                        : currentTurn === 1
                                        ? 'Enviar frase'
                                        : isPhraseTurn
                                        ? 'Enviar interpretação'
                                        : 'Enviar desenho'}
                                </Text>
                                <Send size={18} color="#FFFFFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footerNote}>
                        <Sparkles size={15} color="#C4B5FD" />
                        <Text style={styles.footerNoteText}>
                            O caos aparece quando cada pessoa tenta completar o contexto com a própria cabeça.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    exitButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(36, 36, 36, 0.96)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    brandAccentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    brandAccentGlow: {
        width: 10,
        height: 10,
        borderRadius: 999,
        backgroundColor: '#A855F7',
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 5,
    },
    brandAccentLine: {
        width: 64,
        height: 4,
        borderRadius: 999,
        backgroundColor: '#8B5CF6',
    },
    turnChip: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(168,85,247,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(196,181,253,0.18)',
        marginBottom: 14,
    },
    turnChipText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#E9D5FF',
        letterSpacing: 0.6,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 15,
        lineHeight: 22,
        color: '#DDD6FE',
        marginTop: 6,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    mainCard: {
        backgroundColor: '#18181B',
        borderRadius: 24,
        padding: 24,
        minHeight: 520,
        borderWidth: 1,
        borderColor: 'rgba(168,85,247,0.16)',
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#6D28D9',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 4,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 10,
    },
    stepTimerChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        borderRadius: 999,
        backgroundColor: 'rgba(15,23,42,0.58)',
        borderWidth: 1,
        borderColor: 'rgba(253,230,138,0.18)',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    stepTimerText: {
        color: '#FDE68A',
        fontSize: 14,
        fontWeight: '900',
    },
    stepTimerTextExpired: {
        color: '#FCA5A5',
    },
    cardAccentOrb: {
        position: 'absolute',
        right: -18,
        top: '50%',
        width: 76,
        height: 76,
        marginTop: -38,
        borderRadius: 38,
        backgroundColor: 'rgba(255,255,255,0.025)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    modeBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(168,85,247,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(196,181,253,0.14)',
        marginBottom: 22,
    },
    modeBadgeText: {
        color: '#F8FAFC',
        fontSize: 12,
        fontWeight: '700',
    },
    introBlock: {
        marginBottom: 24,
    },
    introEmoji: {
        fontSize: 44,
        marginBottom: 14,
    },
    blockTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 10,
    },
    blockCopy: {
        fontSize: 15,
        lineHeight: 23,
        color: '#DDD6FE',
    },
    randomPromptButton: {
        marginTop: 16,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: 'rgba(250,204,21,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(253,230,138,0.18)',
    },
    randomPromptText: {
        color: '#FDE68A',
        fontSize: 13,
        fontWeight: '800',
    },
    incomingBlock: {
        marginBottom: 16,
    },
    incomingLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#E9D5FF',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
        marginBottom: 10,
    },
    phrasePreview: {
        padding: 16,
        borderRadius: 18,
        backgroundColor: 'rgba(88,28,135,0.28)',
        borderWidth: 1,
        borderColor: 'rgba(196,181,253,0.12)',
    },
    phrasePreviewText: {
        fontSize: 20,
        lineHeight: 28,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    previewBoard: {
        width: '100%',
        aspectRatio: 0.76,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(15,23,42,0.08)',
    },
    incomingHint: {
        fontSize: 12,
        lineHeight: 18,
        color: '#C4B5FD',
        marginTop: 10,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#F8FAFC',
        marginBottom: 10,
    },
    input: {
        minHeight: 170,
        borderRadius: 18,
        padding: 16,
        backgroundColor: 'rgba(88,28,135,0.2)',
        color: '#FFFFFF',
        fontSize: 17,
        lineHeight: 24,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'rgba(196,181,253,0.14)',
    },
    charCount: {
        marginTop: 8,
        fontSize: 12,
        color: '#A78BFA',
        textAlign: 'right',
    },
    board: {
        width: '100%',
        height: 620,
        borderRadius: 0,
        overflow: 'hidden',
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    telephoneCanvasSection: {
        marginHorizontal: -24,
        marginTop: 4,
        backgroundColor: 'rgba(15,23,42,0.62)',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    canvasHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
    },
    canvasTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    canvasTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    canvasActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    canvasActionButton: {
        width: 42,
        height: 42,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    canvasDangerButton: {
        backgroundColor: 'rgba(239,68,68,0.14)',
    },
    canvasActionButtonDisabled: {
        opacity: 0.35,
    },
    boardCountdown: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(15,23,42,0.76)',
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    boardCountdownLabel: {
        color: '#CBD5E1',
        fontSize: 8,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    boardCountdownValue: {
        color: '#FFFFFF',
        fontSize: 16,
        lineHeight: 19,
        fontWeight: '900',
    },
    boardCountdownValueExpired: {
        color: '#FCA5A5',
    },
    boardToolsOverlay: {
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 12,
    },
    controlsCard: {
        backgroundColor: 'rgba(15,23,42,0.84)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 10,
        gap: 8,
    },
    toolRow: {
        flexDirection: 'row',
        gap: 8,
    },
    toolChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    toolChipActive: {
        backgroundColor: '#8B5CF6',
        borderColor: 'rgba(255,255,255,0.18)',
    },
    toolChipText: {
        color: '#E2E8F0',
        fontSize: 14,
        fontWeight: '700',
    },
    toolChipTextActive: {
        color: '#FFFFFF',
    },
    disclosureBlock: {
        gap: 8,
    },
    disclosureHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        backgroundColor: 'rgba(15,23,42,0.52)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    disclosureLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    disclosureLabel: {
        color: '#E2E8F0',
        fontSize: 14,
        fontWeight: '700',
    },
    disclosureRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    disclosurePreview: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
    },
    disclosureBody: {
        paddingTop: 2,
    },
    paletteRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    fillRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorDot: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorDotActive: {
        borderColor: '#A78BFA',
        transform: [{ scale: 1.08 }],
    },
    fillSwatch: {
        width: 38,
        height: 38,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.16)',
    },
    fillSwatchActive: {
        borderColor: '#A78BFA',
        transform: [{ scale: 1.06 }],
    },
    submitButton: {
        marginTop: 20,
        borderRadius: 18,
        overflow: 'hidden',
    },
    submitButtonDisabled: {
        opacity: 0.55,
    },
    submitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
    },
    submitText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    waitingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    waitingIconWrap: {
        width: 104,
        height: 104,
        borderRadius: 52,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(168,85,247,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(196,181,253,0.16)',
        marginBottom: 24,
    },
    waitingTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    waitingSubtitle: {
        fontSize: 15,
        lineHeight: 22,
        color: '#DDD6FE',
        textAlign: 'center',
        marginBottom: 24,
    },
    statusBox: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: 'rgba(24,24,27,0.74)',
        borderWidth: 1,
        borderColor: 'rgba(168,85,247,0.16)',
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    footerNote: {
        marginTop: 16,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'flex-start',
    },
    footerNoteText: {
        flex: 1,
        color: '#C4B5FD',
        fontSize: 12,
        lineHeight: 18,
    },
});
