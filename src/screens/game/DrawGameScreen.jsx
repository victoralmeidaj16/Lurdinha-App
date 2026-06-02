import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
    PanResponder,
    Keyboard,
    Modal,
    useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import {
    ChevronDown,
    ChevronUp,
    Clock3,
    Eraser,
    Expand,
    Flag,
    Lightbulb,
    MessageCircleMore,
    Minimize2,
    PaintBucket,
    Paintbrush,
    RotateCcw,
    Send,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import Header from '../../components/Header';
import AvatarCircle from '../../components/AvatarCircle';
import LiveConnectionModal from '../../components/LiveConnectionModal';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme';
import {
    formatDrawCategoryLabel,
    formatDrawContentModeLabel,
} from '../../utils/drawContent';
import { playSound } from '../../utils/sounds';

const DEFAULT_CANVAS_FILL = '#111827';
const VIRTUAL_CANVAS_WIDTH = 320;
const VIRTUAL_CANVAS_HEIGHT = 560;
const TURN_INTRO_DURATION = 2500;
const BRUSH_COLORS = ['#FFFFFF', '#F97316', '#22C55E', '#60A5FA', '#F472B6'];
const FILL_COLORS = ['#111827', '#F8FAFC', '#FDE68A', '#BFDBFE', '#FBCFE8'];

const buildSvgPath = (points) => {
    if (!points.length) return '';
    return points.reduce((acc, point, index) => (
        index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`
    ), '');
};

const formatCountdown = (value) => {
    const safeValue = Math.max(0, Number.isFinite(value) ? value : 0);
    const minutes = Math.floor(safeValue / 60);
    const seconds = safeValue % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function DrawGameScreen({ route, navigation }) {
    const { roomId, mockRoomData, isSandbox = false } = route.params;
    const { currentUser } = useAuth();
    const { height: screenHeight } = useWindowDimensions();
    const {
        listenToRoom,
        addDrawingStroke,
        clearDrawing,
        setCanvasFill,
        sendChatGuess,
        reportDrawing,
        calculateRoundResults,
        revealHint,
        removeFromRoom,
        leaveRoom,
    } = useGame();

    const [roomData, setRoomData] = useState(mockRoomData || null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [message, setMessage] = useState('');
    const [draftPath, setDraftPath] = useState('');
    const [selectedColor, setSelectedColor] = useState(BRUSH_COLORS[0]);
    const [activeTool, setActiveTool] = useState('brush');
    const [isCanvasExpanded, setIsCanvasExpanded] = useState(false);
    const [isStrokePaletteExpanded, setIsStrokePaletteExpanded] = useState(false);
    const [isFillPaletteExpanded, setIsFillPaletteExpanded] = useState(false);
    const [showTurnIntro, setShowTurnIntro] = useState(false);
    const [isBoardTouchActive, setIsBoardTouchActive] = useState(false);
    const [connectionState, setConnectionState] = useState('loading');
    const [connectionMessage, setConnectionMessage] = useState('');
    const [isReportModalVisible, setIsReportModalVisible] = useState(false);
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);

    const currentStrokePoints = useRef([]);
    const isCalculatingRef = useRef(false);
    const hasRoutedRef = useRef(false);
    const roomDataRef = useRef(null);
    const roundStartRef = useRef(null);
    const turnIntroKeyRef = useRef(null);
    const pendingAutoScrollTurnKeyRef = useRef(null);
    const turnIntroTimeoutRef = useRef(null);
    const scrollViewRef = useRef(null);
    const boardRef = useRef(null);
    const boardSectionOffsetRef = useRef(0);
    const boardLayoutRef = useRef({ width: VIRTUAL_CANVAS_WIDTH, height: VIRTUAL_CANVAS_HEIGHT });
    const boardScreenFrameRef = useRef({
        x: 0,
        y: 0,
        width: VIRTUAL_CANVAS_WIDTH,
        height: VIRTUAL_CANVAS_HEIGHT,
    });
    const isDrawerRef = useRef(false);
    const timeLeftRef = useRef(0);
    const showTurnIntroRef = useRef(false);
    const currentStrokeColorRef = useRef(BRUSH_COLORS[0]);
    const currentStrokeWidthRef = useRef(6);
    const roomIdRef = useRef(roomId);
    const currentUserUidRef = useRef(currentUser?.uid || null);
    const addDrawingStrokeRef = useRef(addDrawingStroke);
    const calculateRoundResultsRef = useRef(calculateRoundResults);

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

    useEffect(() => {
        if (isSandbox && mockRoomData) {
            setConnectionState('online');
            setRoomData(mockRoomData);
            return undefined;
        }

        const unsubscribe = listenToRoom(roomId, (data, meta) => {
            if (meta?.error) {
                setConnectionState('error');
                setConnectionMessage(meta.message || 'Erro de conexao com a sala.');
                return;
            }

            if (!data) return;

            setConnectionState(meta?.fromCache ? 'reconnecting' : 'online');
            setConnectionMessage('');
            setRoomData(data);
            if (meta?.fromCache) return;
            if (data.status === 'round_results' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                navigation.replace('DrawRoundResult', { roomId });
            } else if (data.status === 'finished' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                navigation.replace('FinalResult', { roomId });
            }
        });

        return () => unsubscribe();
    }, [isSandbox, listenToRoom, mockRoomData, navigation, roomId]);

    useEffect(() => () => {
        if (turnIntroTimeoutRef.current) {
            clearTimeout(turnIntroTimeoutRef.current);
        }
    }, []);

    useEffect(() => {
        if (!roomData?.roundData?.drawerId || !roomData?.currentRound) return;

        const nextTurnKey = `${roomData.currentRound}-${roomData.roundData.drawerId}`;
        if (turnIntroKeyRef.current === nextTurnKey) return;

        turnIntroKeyRef.current = nextTurnKey;
        pendingAutoScrollTurnKeyRef.current = nextTurnKey;
        currentStrokePoints.current = [];
        setDraftPath('');
        setShowTurnIntro(true);
        setIsCanvasExpanded(false);
        setIsStrokePaletteExpanded(false);
        setIsFillPaletteExpanded(false);

        if (turnIntroTimeoutRef.current) {
            clearTimeout(turnIntroTimeoutRef.current);
        }

        turnIntroTimeoutRef.current = setTimeout(() => {
            setShowTurnIntro(false);
        }, TURN_INTRO_DURATION);
    }, [roomData?.currentRound, roomData?.roundData?.drawerId]);

    useEffect(() => {
        if (showTurnIntro || !isDrawer || !roomData?.roundData?.drawerId || !roomData?.currentRound) {
            return;
        }

        const currentTurnKey = `${roomData.currentRound}-${roomData.roundData.drawerId}`;
        if (pendingAutoScrollTurnKeyRef.current !== currentTurnKey) {
            return;
        }

        const timeoutId = setTimeout(() => {
            scrollViewRef.current?.scrollTo({
                y: Math.max(boardSectionOffsetRef.current - 12, 0),
                animated: true,
            });
            pendingAutoScrollTurnKeyRef.current = null;
        }, 120);

        return () => clearTimeout(timeoutId);
    }, [isDrawer, roomData?.currentRound, roomData?.roundData?.drawerId, showTurnIntro]);

    useEffect(() => {
        isCalculatingRef.current = false;
    }, [roomData?.currentRound, roomData?.status]);

    const totalGuessers = useMemo(() => (
        (roomData?.players || []).filter((player) => player.uid !== roomData?.roundData?.drawerId).length
    ), [roomData?.players, roomData?.roundData?.drawerId]);
    const isDrawer = roomData?.roundData?.drawerId === currentUser?.uid;

    useEffect(() => {
        if (roomData?.status !== 'playing') return undefined;

        const startTime = resolveStartTime(roomData.roundData.startTime);
        const totalTime = roomData.settings?.timePerRound || 60;
        if (!startTime) {
            setTimeLeft(totalTime);
            return undefined;
        }
        roundStartRef.current = startTime.getTime();

        const endTime = new Date(startTime.getTime() + totalTime * 1000);

        const updateRemainingTime = () => {
            const diff = Math.ceil((endTime - new Date()) / 1000);
            if (diff <= 0) {
                setTimeLeft(0);
                if (!isSandbox && roomData?.hostId === currentUser?.uid && !isCalculatingRef.current) {
                    isCalculatingRef.current = true;
                    calculateRoundResultsRef.current(roomId, roomDataRef.current).catch(() => {
                        isCalculatingRef.current = false;
                    });
                }
                return false;
            }

            setTimeLeft(diff);
            return true;
        };

        updateRemainingTime();

        const interval = setInterval(() => {
            const shouldContinue = updateRemainingTime();
            if (!shouldContinue) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [currentUser?.uid, roomData?.hostId, roomData?.roundData?.startTime, roomData?.settings?.timePerRound, roomData?.status, roomId]);

    useEffect(() => {
        if (roomData?.status !== 'playing' || !roomData?.roundData?.drawerId) return;
        const guessedCount = roomData.roundData.correctlyGuessed?.length || 0;

        if (
            totalGuessers > 0 &&
            guessedCount >= totalGuessers &&
            !isSandbox &&
            roomData.hostId === currentUser?.uid &&
            !isCalculatingRef.current
        ) {
            isCalculatingRef.current = true;
            calculateRoundResultsRef.current(roomId, roomDataRef.current).catch(() => {
                isCalculatingRef.current = false;
            });
        }
    }, [
        currentUser?.uid,
        roomData?.hostId,
        roomData?.roundData?.correctlyGuessed?.length,
        roomData?.roundData?.drawerId,
        roomData?.status,
        roomId,
        totalGuessers,
    ]);

    const hasGuessedCorrectly = roomData?.roundData?.correctlyGuessed?.includes(currentUser?.uid);
    const drawer = roomData?.players?.find((player) => player.uid === roomData?.roundData?.drawerId);
    const canvasFill = roomData?.roundData?.canvasFill || DEFAULT_CANVAS_FILL;
    const currentStrokeColor = activeTool === 'eraser' ? canvasFill : selectedColor;
    const currentStrokeWidth = activeTool === 'eraser' ? 18 : 6;
    const strokes = roomData?.roundData?.strokes || [];
    const visibleWord = isDrawer ? roomData?.roundData?.word : roomData?.roundData?.maskedWord;
    const boardTitleLabel = visibleWord || (isDrawer ? 'Para desenhar' : 'Adivinhe');
    const contentMode = roomData?.settings?.contentMode || 'words';
    const isCharacterMode = contentMode === 'characters';
    const contentModeLabel = formatDrawContentModeLabel(contentMode);
    const categoryLabel = !isCharacterMode ? formatDrawCategoryLabel(roomData?.settings?.drawCategory) : null;
    const difficultyLabel = ({
        easy: 'Fácil',
        normal: 'Normal',
        hard: 'Difícil',
    })[roomData?.settings?.difficulty] || 'Normal';
    const sortedPlayers = useMemo(() => (
        [...(roomData?.players || [])].sort((firstPlayer, secondPlayer) => (
            (secondPlayer.score || 0) - (firstPlayer.score || 0)
        ))
    ), [roomData?.players]);
    const topPlayers = sortedPlayers.slice(0, 3);
    const currentUserRank = sortedPlayers.findIndex((player) => player.uid === currentUser?.uid) + 1;
    const currentPlayer = sortedPlayers.find((player) => player.uid === currentUser?.uid);
    const shouldCompactWord = (visibleWord || '').length > 18;
    const shouldCompactIntroPrompt = (roomData?.roundData?.word || '').length > 18;
    const formattedTimeLeft = formatCountdown(timeLeft);
    const viewerBoardHeight = Math.round(Math.min(Math.max(screenHeight * 0.56, 360), 520));
    const reportVotes = roomData?.roundData?.reports || {};
    const reportVoteCount = Object.keys(reportVotes).length;
    const reportThreshold = Math.max(1, Math.ceil(totalGuessers / 2));
    const hasReportedDrawing = Boolean(currentUser?.uid && reportVotes[currentUser.uid]);
    const eventFeedMessages = useMemo(() => (
        (roomData?.roundData?.chatMessages || []).slice(-6)
    ), [roomData?.roundData?.chatMessages]);
    const recentNotifications = useMemo(() => (
        (roomData?.roundData?.chatMessages || [])
            .filter((entry) => entry.type !== 'system')
            .slice(-3)
            .reverse()
    ), [roomData?.roundData?.chatMessages]);

    useEffect(() => {
        isDrawerRef.current = isDrawer;
        timeLeftRef.current = timeLeft;
        showTurnIntroRef.current = showTurnIntro;
        currentStrokeColorRef.current = currentStrokeColor;
        currentStrokeWidthRef.current = currentStrokeWidth;
        roomIdRef.current = roomId;
        currentUserUidRef.current = currentUser?.uid || null;
        addDrawingStrokeRef.current = addDrawingStroke;
        calculateRoundResultsRef.current = calculateRoundResults;
        roomDataRef.current = roomData;
    }, [
        addDrawingStroke,
        calculateRoundResults,
        currentStrokeColor,
        currentStrokeWidth,
        currentUser?.uid,
        isDrawer,
        roomId,
        roomData,
        showTurnIntro,
        timeLeft,
    ]);

    const updateBoardScreenFrame = () => {
        if (!boardRef.current?.measureInWindow) return;

        boardRef.current.measureInWindow((x, y, width, height) => {
            boardScreenFrameRef.current = {
                x,
                y,
                width: width || boardLayoutRef.current.width || VIRTUAL_CANVAS_WIDTH,
                height: height || boardLayoutRef.current.height || VIRTUAL_CANVAS_HEIGHT,
            };
        });
    };

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const mapPointToCanvas = ({ pageX, pageY, locationX, locationY }) => {
        const { width, height } = boardLayoutRef.current;
        const safeWidth = width || VIRTUAL_CANVAS_WIDTH;
        const safeHeight = height || VIRTUAL_CANVAS_HEIGHT;
        const { x, y } = boardScreenFrameRef.current;

        const relativeX = typeof pageX === 'number'
            ? clamp(pageX - x, 0, safeWidth)
            : clamp(locationX || 0, 0, safeWidth);
        const relativeY = typeof pageY === 'number'
            ? clamp(pageY - y, 0, safeHeight)
            : clamp(locationY || 0, 0, safeHeight);

        return {
            x: (relativeX / safeWidth) * VIRTUAL_CANVAS_WIDTH,
            y: (relativeY / safeHeight) * VIRTUAL_CANVAS_HEIGHT,
        };
    };

    const finishStroke = async () => {
        setIsBoardTouchActive(false);
        if (currentStrokePoints.current.length < 2) {
            currentStrokePoints.current = [];
            setDraftPath('');
            return;
        }

        const path = buildSvgPath(currentStrokePoints.current);
        const stroke = {
            id: `${currentUserUidRef.current}-${Date.now()}`,
            color: currentStrokeColorRef.current,
            width: currentStrokeWidthRef.current,
            path,
        };

        currentStrokePoints.current = [];
        setDraftPath('');

        try {
            if (isSandbox) {
                setRoomData((current) => ({
                    ...current,
                    roundData: {
                        ...(current?.roundData || {}),
                        strokes: [...(current?.roundData?.strokes || []), stroke],
                    },
                }));
                return;
            }
            await addDrawingStrokeRef.current(roomIdRef.current, stroke);
        } catch (error) {
            console.error('Erro ao enviar traço:', error);
        }
    };

    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => isDrawerRef.current && timeLeftRef.current > 0 && !showTurnIntroRef.current,
        onMoveShouldSetPanResponder: () => isDrawerRef.current && timeLeftRef.current > 0 && !showTurnIntroRef.current,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderGrant: (event) => {
            setIsBoardTouchActive(true);
            updateBoardScreenFrame();
            currentStrokePoints.current = [mapPointToCanvas(event.nativeEvent)];
            setDraftPath(buildSvgPath(currentStrokePoints.current));
        },
        onPanResponderMove: (event) => {
            currentStrokePoints.current = [...currentStrokePoints.current, mapPointToCanvas(event.nativeEvent)];
            setDraftPath(buildSvgPath(currentStrokePoints.current));
        },
        onPanResponderRelease: finishStroke,
        onPanResponderTerminate: finishStroke,
        onShouldBlockNativeResponder: () => true,
    })).current;

    const handleClear = async () => {
        currentStrokePoints.current = [];
        setDraftPath('');
        try {
            if (isSandbox) {
                setRoomData((current) => ({
                    ...current,
                    roundData: {
                        ...(current?.roundData || {}),
                        strokes: [],
                    },
                }));
                return;
            }
            await clearDrawing(roomId);
        } catch (error) {
            console.error('Erro ao limpar desenho:', error);
        }
    };

    const handleRevealHint = async () => {
        try {
            if (isSandbox) return;
            await revealHint(roomId);
        } catch (error) {
            console.error('Erro ao revelar dica:', error);
        }
    };

    const handleSetCanvasFill = async (fillColor) => {
        try {
            if (isSandbox) {
                setRoomData((current) => ({
                    ...current,
                    roundData: {
                        ...(current?.roundData || {}),
                        canvasFill: fillColor,
                    },
                }));
                return;
            }
            await setCanvasFill(roomId, fillColor);
        } catch (error) {
            console.error('Erro ao preencher canvas:', error);
        }
    };

    const handleSendGuess = async () => {
        const trimmedMessage = message.trim();
        if (!trimmedMessage || isDrawer || hasGuessedCorrectly || timeLeft === 0) return;

        Keyboard.dismiss();
        try {
            playSound('answer_submit');
            if (!isSandbox) {
                await sendChatGuess(roomId, trimmedMessage);
            }
            setMessage('');
        } catch (error) {
            console.error('Erro ao enviar palpite:', error);
            playSound('answer_error');
        }
    };

    const handleReportDrawing = async (reason) => {
        if (isDrawer || hasReportedDrawing || timeLeft === 0 || isSubmittingReport) return;

        setIsSubmittingReport(true);
        try {
            if (!isSandbox) {
                await reportDrawing(roomId, reason);
            }
            setIsReportModalVisible(false);
        } catch (error) {
            console.error('Erro ao denunciar desenho:', error);
        } finally {
            setIsSubmittingReport(false);
        }
    };

    const renderPaletteDisclosure = ({
        label,
        icon,
        expanded,
        onToggle,
        previewColor,
        children,
    }) => (
        <View style={styles.disclosureBlock}>
            <TouchableOpacity style={styles.disclosureHeader} onPress={onToggle} activeOpacity={0.85}>
                <View style={styles.disclosureLeft}>
                    {icon}
                    <Text style={styles.disclosureLabel}>{label}</Text>
                </View>

                <View style={styles.disclosureRight}>
                    <View style={[styles.disclosurePreview, { backgroundColor: previewColor }]} />
                    {expanded ? <ChevronUp size={18} color="#CBD5E1" /> : <ChevronDown size={18} color="#CBD5E1" />}
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.disclosureBody}>
                    {children}
                </View>
            )}
        </View>
    );

    const renderControlsCard = (expanded = false) => {
        if (!isDrawer) return null;

        return (
            <View style={[styles.controlsCard, expanded && styles.controlsCardExpanded]}>
                <View style={[styles.toolRow, expanded && styles.toolRowExpanded]}>
                    <TouchableOpacity
                        style={[styles.toolChip, expanded && styles.toolChipExpanded, activeTool === 'brush' && styles.toolChipActive]}
                        onPress={() => {
                            playSound('ui_toggle');
                            setActiveTool('brush');
                        }}
                        activeOpacity={0.85}
                    >
                        <Paintbrush size={16} color={activeTool === 'brush' ? '#FFFFFF' : '#C4B5FD'} />
                        <Text style={[styles.toolChipText, activeTool === 'brush' && styles.toolChipTextActive]}>
                            Pincel
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.toolChip, expanded && styles.toolChipExpanded, activeTool === 'eraser' && styles.toolChipActive]}
                        onPress={() => {
                            playSound('ui_toggle');
                            setActiveTool('eraser');
                        }}
                        activeOpacity={0.85}
                    >
                        <Eraser size={16} color={activeTool === 'eraser' ? '#FFFFFF' : '#FCA5A5'} />
                        <Text style={[styles.toolChipText, activeTool === 'eraser' && styles.toolChipTextActive]}>
                            Borracha
                        </Text>
                    </TouchableOpacity>
                </View>

                {renderPaletteDisclosure({
                    label: expanded ? 'Traço' : 'Cor do traço',
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
                                />
                            ))}
                        </View>
                    ),
                })}

                {renderPaletteDisclosure({
                    label: expanded ? 'Fundo' : 'Preenchimento',
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
                                    onPress={() => handleSetCanvasFill(color)}
                                    activeOpacity={0.85}
                                />
                            ))}
                        </View>
                    ),
                })}
            </View>
        );
    };

    const renderBoardCountdown = (expanded = false) => (
        <View
            pointerEvents="none"
            style={[
                styles.boardCountdown,
                isDrawer ? styles.boardCountdownDrawer : styles.boardCountdownViewer,
                expanded && styles.boardCountdownExpanded,
            ]}
        >
            <Clock3 size={isDrawer ? 15 : 18} color="#F8FAFC" />
            <View style={styles.boardCountdownTextBlock}>
                <Text style={styles.boardCountdownLabel}>
                    {isDrawer ? 'Tempo para desenhar' : 'Tempo restante'}
                </Text>
                <Text
                    style={[
                        styles.boardCountdownValue,
                        isDrawer && styles.boardCountdownValueDrawer,
                    ]}
                >
                    {formattedTimeLeft}
                </Text>
            </View>
        </View>
    );

    const renderPlayerStrip = () => {
        if (isDrawer || !sortedPlayers.length) return null;

        return (
            <View style={styles.playerStripSection}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionEyebrow}>Competição ao vivo</Text>
                    <Text style={styles.sectionCounter}>{sortedPlayers.length} jogadores</Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.playerStripContent}
                >
                    {sortedPlayers.map((player, index) => {
                        const isCurrent = player.uid === currentUser?.uid;
                        const guessed = roomData?.roundData?.correctlyGuessed?.includes(player.uid);
                        const drawing = player.uid === roomData?.roundData?.drawerId;

                        return (
                            <View
                                key={player.uid}
                                style={[
                                    styles.playerStripCard,
                                    isCurrent && styles.playerStripCardCurrent,
                                    guessed && styles.playerStripCardGuessed,
                                ]}
                            >
                                <Text style={styles.playerStripRank}>#{index + 1}</Text>
                                <AvatarCircle
                                    name={player.name}
                                    photoURL={player.photoURL}
                                    size={38}
                                />
                                <Text style={styles.playerStripName} numberOfLines={1}>
                                    {player.name}
                                </Text>
                                <Text style={styles.playerStripScore}>{player.score || 0} pts</Text>
                                <Text style={styles.playerStripStatus} numberOfLines={1}>
                                    {drawing ? 'desenha' : guessed ? 'acertou' : 'palpitando'}
                                </Text>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    const renderEventFeed = () => {
        if (isDrawer) return null;

        return (
            <View style={styles.eventFeedSection}>
                <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionTitleBlock}>
                        <Text style={styles.sectionEyebrow}>Rodada agora</Text>
                        <Text style={styles.sectionCounter}>
                            {hasGuessedCorrectly ? 'você acertou' : 'chat ao vivo'} · denúncias {reportVoteCount}/{reportThreshold}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.reportButton,
                            (hasReportedDrawing || timeLeft === 0) && styles.reportButtonDisabled,
                        ]}
                        onPress={() => setIsReportModalVisible(true)}
                        disabled={hasReportedDrawing || timeLeft === 0}
                        activeOpacity={0.85}
                    >
                        <Flag size={14} color="#FCA5A5" />
                        <Text style={styles.reportButtonText}>
                            {hasReportedDrawing ? 'Denunciado' : 'Denunciar'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.eventFeedBox}>
                    {eventFeedMessages.length > 0 ? eventFeedMessages.map((entry) => (
                        <View key={entry.id} style={styles.eventFeedRow}>
                            <View
                                style={[
                                    styles.eventFeedDot,
                                    entry.type === 'correct' && styles.eventFeedDotCorrect,
                                    entry.type === 'system' && styles.eventFeedDotSystem,
                                ]}
                            />
                            <View style={styles.eventFeedTextBlock}>
                                <Text style={styles.eventFeedAuthor} numberOfLines={1}>
                                    {entry.type === 'system' ? 'Sistema' : (entry.name || 'Jogador')}
                                </Text>
                                <Text
                                    style={[
                                        styles.eventFeedText,
                                        entry.type === 'correct' && styles.eventFeedTextCorrect,
                                    ]}
                                    numberOfLines={2}
                                >
                                    {entry.text}
                                </Text>
                            </View>
                        </View>
                    )) : (
                        <Text style={styles.eventFeedEmpty}>
                            Os palpites e acertos desta rodada aparecem aqui.
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    const renderReportModal = () => (
        <Modal
            visible={isReportModalVisible}
            animationType="fade"
            transparent
            onRequestClose={() => setIsReportModalVisible(false)}
        >
            <View style={styles.reportModalBackdrop}>
                <View style={styles.reportModalCard}>
                    <View style={styles.reportModalIcon}>
                        <Flag size={22} color="#FCA5A5" />
                    </View>
                    <Text style={styles.reportModalTitle}>Denunciar desenho</Text>
                    <Text style={styles.reportModalText}>
                        Se metade dos jogadores que estão adivinhando votar, o desenhista perde a vez e a rodada passa.
                    </Text>

                    <TouchableOpacity
                        style={styles.reportConfirmButton}
                        onPress={() => handleReportDrawing('reported')}
                        disabled={isSubmittingReport}
                        activeOpacity={0.85}
                    >
                        <Flag size={16} color="#FFFFFF" />
                        <Text style={styles.reportConfirmText}>
                            {isSubmittingReport ? 'Enviando...' : 'Denunciar desenho'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.reportCancelButton}
                        onPress={() => setIsReportModalVisible(false)}
                        disabled={isSubmittingReport}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.reportCancelText}>
                            Cancelar
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderCanvasSection = (expanded = false) => (
        <View
            style={[styles.canvasSection, expanded && styles.canvasSectionExpanded]}
            onLayout={(event) => {
                if (!expanded) {
                    boardSectionOffsetRef.current = event.nativeEvent.layout.y;
                }
            }}
        >
            <View style={[styles.boardHeaderShell, expanded && styles.boardHeaderShellExpanded]}>
                <View style={[styles.boardHeader, expanded && styles.boardHeaderExpanded]}>
                    <View style={styles.boardTitleRow}>
                        <Paintbrush size={18} color="#C4B5FD" />
                        <Text
                            style={styles.boardTitle}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.76}
                        >
                            {boardTitleLabel}
                        </Text>
                    </View>

                    {isDrawer && (
                        <View style={styles.boardActions}>
                            {!expanded && (
                                <TouchableOpacity
                                    style={[styles.boardActionButton, styles.boardIconButton]}
                                    onPress={() => setIsCanvasExpanded(true)}
                                    activeOpacity={0.85}
                                    accessibilityLabel="Expandir quadro"
                                >
                                    <Expand size={16} color="#E2E8F0" />
                                </TouchableOpacity>
                            )}

                            {(() => {
                                const hintsUsed = roomData?.roundData?.hintsUsed || 0;
                                const hintsLeft = 2 - hintsUsed;
                                const disabled = hintsLeft <= 0 || timeLeft === 0;
                                return (
                                    <TouchableOpacity
                                        style={[styles.hintButton, disabled && styles.hintButtonDisabled]}
                                        onPress={handleRevealHint}
                                        disabled={disabled}
                                        activeOpacity={0.85}
                                    >
                                        <Lightbulb size={15} color="#FDE68A" strokeWidth={2.4} />
                                        <Text style={styles.hintButtonText}>Dica {hintsLeft}</Text>
                                    </TouchableOpacity>
                                );
                            })()}

                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={handleClear}
                                activeOpacity={0.85}
                                accessibilityLabel="Limpar desenho"
                            >
                                <RotateCcw size={16} color="#E5E7EB" strokeWidth={2.4} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            <View
                ref={boardRef}
                style={[
                    styles.board,
                    expanded ? styles.boardExpanded : styles.boardMain,
                    !expanded && !isDrawer && { height: viewerBoardHeight },
                    { backgroundColor: canvasFill },
                ]}
                onTouchStart={() => setIsBoardTouchActive(true)}
                onTouchEnd={() => setIsBoardTouchActive(false)}
                onTouchCancel={() => setIsBoardTouchActive(false)}
                onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    boardLayoutRef.current = { width, height };
                    updateBoardScreenFrame();
                }}
                {...panResponder.panHandlers}
            >
                {renderBoardCountdown(expanded)}

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
                            strokeWidth={stroke.width || 6}
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

                {!isDrawer && (
                    <View style={styles.viewerHint}>
                        <Text style={styles.viewerHintText}>Observe o desenho e envie seu palpite na barra inferior.</Text>
                    </View>
                )}

                {isDrawer && (
                    <View style={[styles.boardToolsOverlay, expanded && styles.expandedToolsOverlay]}>
                        {renderControlsCard(expanded)}
                    </View>
                )}
            </View>
        </View>
    );

    const renderMiniLeaderboard = () => {
        if (!topPlayers.length) return null;
        const displayedPlayers = isDrawer ? topPlayers.slice(0, 1) : topPlayers;

        return (
            <View
                pointerEvents="none"
                style={[
                    styles.miniLeaderboardShell,
                    isDrawer && styles.miniLeaderboardShellDrawer,
                    !isDrawer && styles.miniLeaderboardWithComposer,
                ]}
            >
                <View style={[styles.miniLeaderboardCard, isDrawer && styles.miniLeaderboardCardDrawer]}>
                    {!isDrawer && (
                        <View style={styles.miniLeaderboardHeader}>
                            <Text style={styles.miniLeaderboardEyebrow}>Placar ao vivo</Text>
                            <Text style={styles.miniLeaderboardTitle}>Top 3</Text>
                        </View>
                    )}

                    {displayedPlayers.map((player, index) => (
                        <View
                            key={player.uid}
                            style={[
                                styles.miniLeaderboardRow,
                                player.uid === currentUser?.uid && styles.miniLeaderboardRowCurrent,
                            ]}
                        >
                            <Text style={styles.miniLeaderboardRank}>#{index + 1}</Text>
                            <AvatarCircle
                                name={player.name}
                                photoURL={player.photoURL}
                                size={24}
                            />
                            <Text style={styles.miniLeaderboardName} numberOfLines={1}>
                                {player.name}
                            </Text>
                            <Text style={styles.miniLeaderboardScore}>{player.score || 0}</Text>
                        </View>
                    ))}

                    {!isDrawer && currentUserRank > 3 && currentPlayer && (
                        <Text style={styles.miniLeaderboardFooter}>
                            Você está em #{currentUserRank} com {currentPlayer.score || 0} pts
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    if (!roomData?.roundData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" />
                <LiveConnectionModal
                    status={connectionState}
                    message={connectionMessage}
                    onLeave={() => navigation.replace('GameHome')}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0F172A', '#1E1B4B']} style={styles.background} />
            <LiveConnectionModal
                status={connectionState}
                message={connectionMessage}
                onLeave={() => navigation.replace('GameHome')}
            />
            <Header 
                title={`Rodada ${roomData.currentRound}/${roomData.settings.totalRounds}`} 
                transparent 
                showExit={true}
                showSoundToggle
                onConfirmExit={async () => {
                    if (!isSandbox) {
                        await removeFromRoom(roomId);
                        leaveRoom();
                    }
                    navigation.navigate('GameHome');
                }}
            />

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.scroll}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: isDrawer ? 140 : 16 },
                    ]}
                    scrollEnabled={!isBoardTouchActive}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.stickyHeaderShell}>
                        <LinearGradient colors={['rgba(15, 23, 42, 0.98)', 'rgba(30, 27, 75, 0.92)']} style={styles.stickyHeader}>
                            <View style={styles.stickyHeaderTop}>
                                <View style={styles.timerChip}>
                                    <Clock3 size={16} color="#F8FAFC" />
                                    <Text style={styles.timerText}>{formattedTimeLeft}</Text>
                                </View>

                                <View style={styles.drawerChip}>
                                    <AvatarCircle
                                        name={drawer?.name || 'Desenhista'}
                                        photoURL={drawer?.photoURL}
                                        size={28}
                                    />
                                    <Text style={styles.drawerChipText} numberOfLines={1}>
                                        {isDrawer ? 'Sua vez' : `${drawer?.name || 'Jogador'} desenha`}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.wordInlineCard}>
                                <Text style={styles.wordInlineLabel}>
                                    {isDrawer
                                        ? (isCharacterMode ? 'CENA DA RODADA' : 'PALAVRA DA RODADA')
                                        : (isCharacterMode ? 'ADIVINHE A CENA' : 'ADIVINHE A PALAVRA')}
                                </Text>
                                <Text
                                    style={[
                                        styles.wordInlineText,
                                        shouldCompactWord && styles.wordInlineTextCompact,
                                    ]}
                                    numberOfLines={2}
                                >
                                    {visibleWord}
                                </Text>
                            </View>

                            <View style={styles.metaChipRow}>
                                <View style={styles.metaChip}>
                                    <Text style={styles.metaChipText}>{contentModeLabel}</Text>
                                </View>

                                {categoryLabel && (
                                    <View style={styles.metaChip}>
                                        <Text style={styles.metaChipText}>{categoryLabel}</Text>
                                    </View>
                                )}

                                {!isCharacterMode && (
                                    <View style={styles.metaChip}>
                                        <Text style={styles.metaChipText}>{difficultyLabel}</Text>
                                    </View>
                                )}
                            </View>
                        </LinearGradient>
                    </View>

                    {renderCanvasSection()}

                    {renderPlayerStrip()}

                    {renderEventFeed()}
                </ScrollView>

                {isDrawer && recentNotifications.length > 0 && (
                    <View
                        pointerEvents="none"
                        style={styles.liveNotifications}
                    >
                        {recentNotifications.map((entry) => (
                            <View
                                key={entry.id}
                                style={[
                                    styles.notificationBubble,
                                    entry.type === 'correct' && styles.notificationBubbleCorrect,
                                ]}
                            >
                                <View style={styles.notificationHeader}>
                                    <MessageCircleMore size={12} color={entry.type === 'correct' ? '#86EFAC' : '#C4B5FD'} />
                                    <Text style={styles.notificationTitle} numberOfLines={1}>
                                        {entry.type === 'correct' ? 'Acerto' : (entry.name || 'Palpite')}
                                    </Text>
                                </View>
                                <Text
                                    style={[
                                        styles.notificationText,
                                        entry.type === 'correct' && styles.notificationTextCorrect,
                                    ]}
                                    numberOfLines={2}
                                >
                                    {entry.text}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {isDrawer && renderMiniLeaderboard()}

                {!isDrawer && (
                    <View style={styles.composerShell}>
                        <View style={styles.composerCard}>
                            <TextInput
                                style={styles.composerInput}
                                value={message}
                                onChangeText={setMessage}
                                placeholder={hasGuessedCorrectly ? 'Você já acertou' : 'Digite sua resposta aqui'}
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                editable={!hasGuessedCorrectly && timeLeft > 0}
                                onSubmitEditing={handleSendGuess}
                                returnKeyType="send"
                                autoCorrect={false}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    (!message.trim() || hasGuessedCorrectly || timeLeft === 0) && styles.sendButtonDisabled,
                                ]}
                                onPress={handleSendGuess}
                                disabled={!message.trim() || hasGuessedCorrectly || timeLeft === 0}
                                activeOpacity={0.85}
                            >
                                <Send size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </KeyboardAvoidingView>

            {showTurnIntro && (
                <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(220)} style={styles.turnIntroOverlay}>
                    <LinearGradient colors={['rgba(15, 23, 42, 0.96)', 'rgba(30, 27, 75, 0.96)']} style={styles.turnIntroBackdrop}>
                        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={styles.turnIntroCard}>
                            <Text style={styles.turnIntroRound}>Rodada {roomData.currentRound}/{roomData.settings.totalRounds}</Text>

                            <AvatarCircle
                                name={drawer?.name || 'Desenhista'}
                                photoURL={drawer?.photoURL}
                                size={72}
                                style={styles.turnIntroAvatar}
                            />

                            <Text style={styles.turnIntroTitle}>
                                {isDrawer ? 'Sua vez de desenhar' : `${drawer?.name || 'Jogador'} vai desenhar`}
                            </Text>
                            <Text style={styles.turnIntroSubtitle}>
                                {isDrawer
                                    ? 'Respire, abra o quadro e comece pelo que mais entrega a ideia.'
                                    : 'Observe o desenho com calma e tente acertar antes dos outros.'}
                            </Text>

                            {isDrawer && (
                                <View style={styles.turnIntroWordChip}>
                                    <Text style={styles.turnIntroWordLabel}>
                                        {isCharacterMode ? 'Sua cena' : 'Sua palavra'}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.turnIntroWordText,
                                            shouldCompactIntroPrompt && styles.turnIntroWordTextCompact,
                                        ]}
                                        numberOfLines={2}
                                    >
                                        {roomData.roundData.word}
                                    </Text>
                                </View>
                            )}
                        </Animated.View>
                    </LinearGradient>
                </Animated.View>
            )}

            {isDrawer && (
                <Modal
                    visible={isCanvasExpanded}
                    animationType="slide"
                    transparent
                    onRequestClose={() => setIsCanvasExpanded(false)}
                >
                    <View style={styles.modalBackdrop}>
                        <LinearGradient colors={['rgba(15, 23, 42, 0.99)', 'rgba(30, 27, 75, 0.99)']} style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <View>
                                    <Text style={styles.modalTitle}>Tela de desenho</Text>
                                    <Text style={styles.modalSubtitle}>Mais área para desenhar sem perder as ferramentas.</Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.boardActionButton}
                                    onPress={() => setIsCanvasExpanded(false)}
                                    activeOpacity={0.85}
                                >
                                    <Minimize2 size={16} color="#E2E8F0" />
                                    <Text style={styles.boardActionText}>Fechar</Text>
                                </TouchableOpacity>
                            </View>

                            {renderCanvasSection(true)}
                        </LinearGradient>
                    </View>
                </Modal>
            )}

            {!isDrawer && renderReportModal()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
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
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 4,
        gap: 12,
    },
    stickyHeaderShell: {
        marginHorizontal: -16,
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#0F172A',
    },
    stickyHeader: {
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 14,
        gap: 12,
    },
    stickyHeaderTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    timerChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
    },
    timerText: {
        color: '#F8FAFC',
        fontSize: 15,
        fontWeight: '800',
    },
    drawerChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 999,
        minWidth: 0,
    },
    drawerChipText: {
        color: '#E2E8F0',
        fontSize: 13,
        fontWeight: '700',
        flex: 1,
    },
    wordInlineCard: {
        backgroundColor: 'rgba(15, 23, 42, 0.58)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 4,
    },
    wordInlineLabel: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    wordInlineText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 1,
    },
    wordInlineTextCompact: {
        fontSize: 19,
        lineHeight: 26,
        letterSpacing: 0.4,
    },
    metaChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    metaChip: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    metaChipText: {
        color: '#CBD5E1',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
    },
    canvasSection: {
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginHorizontal: -8,
        paddingTop: 10,
        paddingHorizontal: 0,
        paddingBottom: 0,
        gap: 0,
        overflow: 'hidden',
    },
    canvasSectionExpanded: {
        flex: 1,
        paddingTop: 12,
    },
    boardHeaderShell: {
        paddingHorizontal: 12,
        paddingBottom: 8,
    },
    boardHeaderShellExpanded: {
        paddingHorizontal: 14,
        paddingBottom: 10,
    },
    boardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    boardHeaderExpanded: {
        paddingHorizontal: 4,
    },
    boardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        minWidth: 0,
    },
    boardTitle: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
        flex: 1,
        minWidth: 0,
    },
    boardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
        flexShrink: 0,
        minWidth: 0,
    },
    boardActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 12,
        height: 42,
        borderRadius: 999,
    },
    boardIconButton: {
        width: 42,
        paddingHorizontal: 0,
    },
    boardActionText: {
        color: '#E2E8F0',
        fontSize: 14,
        fontWeight: '700',
    },
    hintButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(15, 23, 42, 0.86)',
        borderWidth: 1,
        borderColor: 'rgba(253, 230, 138, 0.28)',
        paddingHorizontal: 10,
        height: 42,
        borderRadius: 999,
    },
    hintButtonDisabled: {
        opacity: 0.4,
    },
    hintButtonText: {
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '800',
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: 42,
        height: 42,
        backgroundColor: 'rgba(15, 23, 42, 0.86)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        borderRadius: 999,
    },
    board: {
        borderRadius: 0,
        overflow: 'hidden',
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    boardMain: {
        height: 720,
    },
    boardExpanded: {
        flex: 1,
        minHeight: 0,
    },
    boardCountdown: {
        position: 'absolute',
        top: 10,
        zIndex: 3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(15, 23, 42, 0.76)',
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    boardCountdownDrawer: {
        right: 10,
        maxWidth: 132,
    },
    boardCountdownViewer: {
        left: 14,
        right: 14,
        justifyContent: 'center',
    },
    boardCountdownExpanded: {
        top: 12,
    },
    boardCountdownTextBlock: {
        minWidth: 0,
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
        fontSize: 24,
        fontWeight: '900',
        lineHeight: 28,
    },
    boardCountdownValueDrawer: {
        fontSize: 16,
        lineHeight: 19,
    },
    viewerHint: {
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: 14,
        backgroundColor: 'rgba(15, 23, 42, 0.64)',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    viewerHintText: {
        color: '#CBD5E1',
        fontSize: 12,
        textAlign: 'center',
    },
    playerStripSection: {
        gap: 10,
        paddingTop: 2,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    sectionTitleBlock: {
        flex: 1,
        minWidth: 0,
        gap: 3,
    },
    sectionEyebrow: {
        color: '#E2E8F0',
        fontSize: 13,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0,
    },
    sectionCounter: {
        color: '#A78BFA',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0,
    },
    playerStripContent: {
        gap: 10,
        paddingRight: 4,
    },
    playerStripCard: {
        width: 104,
        minHeight: 132,
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    playerStripCardCurrent: {
        backgroundColor: 'rgba(139, 92, 246, 0.20)',
        borderColor: 'rgba(167, 139, 250, 0.42)',
    },
    playerStripCardGuessed: {
        borderColor: 'rgba(34, 197, 94, 0.34)',
    },
    playerStripRank: {
        alignSelf: 'flex-start',
        color: '#FDE68A',
        fontSize: 12,
        fontWeight: '900',
    },
    playerStripName: {
        width: '100%',
        color: '#F8FAFC',
        fontSize: 12,
        fontWeight: '800',
        textAlign: 'center',
    },
    playerStripScore: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '900',
    },
    playerStripStatus: {
        color: '#CBD5E1',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0,
    },
    eventFeedSection: {
        gap: 10,
    },
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(127, 29, 29, 0.28)',
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.24)',
        borderRadius: 999,
        paddingHorizontal: 11,
        height: 36,
        flexShrink: 0,
    },
    reportButtonDisabled: {
        opacity: 0.5,
    },
    reportButtonText: {
        color: '#FEE2E2',
        fontSize: 11,
        fontWeight: '900',
    },
    eventFeedBox: {
        minHeight: 156,
        backgroundColor: 'rgba(2, 6, 23, 0.72)',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 12,
        gap: 10,
    },
    eventFeedRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
    },
    eventFeedDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        marginTop: 5,
        backgroundColor: '#A78BFA',
    },
    eventFeedDotCorrect: {
        backgroundColor: '#22C55E',
    },
    eventFeedDotSystem: {
        backgroundColor: '#FDE68A',
    },
    eventFeedTextBlock: {
        flex: 1,
        minWidth: 0,
    },
    eventFeedAuthor: {
        color: '#CBD5E1',
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0,
        marginBottom: 2,
    },
    eventFeedText: {
        color: '#E2E8F0',
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '600',
    },
    eventFeedTextCorrect: {
        color: '#DCFCE7',
        fontWeight: '800',
    },
    eventFeedEmpty: {
        color: '#94A3B8',
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'center',
        marginTop: 36,
    },
    reportModalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(2, 6, 23, 0.78)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    reportModalCard: {
        backgroundColor: '#111827',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        padding: 18,
        gap: 12,
    },
    reportModalIcon: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(127, 29, 29, 0.32)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.24)',
    },
    reportModalTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
    },
    reportModalText: {
        color: '#CBD5E1',
        fontSize: 14,
        lineHeight: 20,
    },
    reportConfirmButton: {
        height: 48,
        borderRadius: 16,
        backgroundColor: '#DC2626',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    reportConfirmText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
    },
    reportCancelButton: {
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
    },
    reportCancelText: {
        color: '#CBD5E1',
        fontSize: 14,
        fontWeight: '800',
    },
    expandedToolsOverlay: {
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 12,
    },
    boardToolsOverlay: {
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 12,
    },
    controlsCard: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        padding: 12,
        gap: 10,
    },
    controlsCardExpanded: {
        backgroundColor: 'rgba(15, 23, 42, 0.84)',
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: 10,
        gap: 8,
    },
    toolRow: {
        flexDirection: 'row',
        gap: 10,
    },
    toolRowExpanded: {
        gap: 8,
    },
    toolChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    toolChipExpanded: {
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    toolChipActive: {
        backgroundColor: colors.primary,
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
        backgroundColor: 'rgba(15, 23, 42, 0.52)',
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
    liveNotifications: {
        position: 'absolute',
        right: 16,
        bottom: 24,
        width: 220,
        gap: 8,
    },
    liveNotificationsWithComposer: {
        bottom: 100,
    },
    notificationBubble: {
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    notificationBubbleCorrect: {
        backgroundColor: 'rgba(22, 101, 52, 0.34)',
        borderColor: 'rgba(34, 197, 94, 0.18)',
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    notificationTitle: {
        color: '#CBD5E1',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        flex: 1,
    },
    notificationText: {
        color: '#E2E8F0',
        fontSize: 12,
        lineHeight: 16,
    },
    notificationTextCorrect: {
        color: '#DCFCE7',
    },
    miniLeaderboardShell: {
        position: 'absolute',
        left: 16,
        bottom: 24,
        width: 196,
    },
    miniLeaderboardShellDrawer: {
        left: 10,
        bottom: 12,
        width: 136,
    },
    miniLeaderboardWithComposer: {
        bottom: 100,
    },
    miniLeaderboardCard: {
        backgroundColor: 'rgba(2, 6, 23, 0.82)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 12,
        gap: 8,
    },
    miniLeaderboardCardDrawer: {
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 7,
        gap: 5,
    },
    miniLeaderboardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    miniLeaderboardEyebrow: {
        color: '#94A3B8',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    miniLeaderboardTitle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
    miniLeaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    miniLeaderboardRowCurrent: {
        backgroundColor: 'rgba(139, 92, 246, 0.18)',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.24)',
    },
    miniLeaderboardRank: {
        width: 20,
        color: '#C4B5FD',
        fontSize: 11,
        fontWeight: '900',
        textAlign: 'center',
    },
    miniLeaderboardName: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 12,
        fontWeight: '700',
    },
    miniLeaderboardScore: {
        color: '#FDE68A',
        fontSize: 12,
        fontWeight: '800',
    },
    miniLeaderboardFooter: {
        color: '#CBD5E1',
        fontSize: 11,
        lineHeight: 15,
    },
    composerShell: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 28 : 14,
        backgroundColor: 'rgba(10,12,20,0.72)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    composerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#252836',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 8,
    },
    composerInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 15,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    sendButton: {
        width: 46,
        height: 46,
        borderRadius: 16,
        backgroundColor: '#A78BFA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.4,
    },
    turnIntroOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 20,
    },
    turnIntroBackdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    turnIntroCard: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 24,
        alignItems: 'center',
        gap: 12,
    },
    turnIntroRound: {
        color: '#A78BFA',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    turnIntroAvatar: {
        marginTop: 4,
    },
    turnIntroTitle: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
    },
    turnIntroSubtitle: {
        color: '#CBD5E1',
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
    },
    turnIntroWordChip: {
        marginTop: 4,
        backgroundColor: 'rgba(139, 92, 246, 0.16)',
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingVertical: 14,
        alignItems: 'center',
        gap: 4,
        width: '100%',
    },
    turnIntroWordLabel: {
        color: '#C4B5FD',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    turnIntroWordText: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '900',
        textAlign: 'center',
    },
    turnIntroWordTextCompact: {
        fontSize: 22,
        lineHeight: 28,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(2, 6, 23, 0.72)',
    },
    modalContent: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 64 : 28,
        paddingHorizontal: 16,
        paddingBottom: 24,
        gap: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
    },
    modalSubtitle: {
        color: '#CBD5E1',
        fontSize: 13,
        marginTop: 4,
    },
});
