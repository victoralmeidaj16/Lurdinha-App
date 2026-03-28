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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import {
    ChevronDown,
    ChevronUp,
    Clock3,
    Eraser,
    Expand,
    MessageCircleMore,
    Minimize2,
    PaintBucket,
    Paintbrush,
    Send,
    Trash2,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import Header from '../../components/Header';
import AvatarCircle from '../../components/AvatarCircle';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme';
import {
    formatDrawCategoryLabel,
    formatDrawContentModeLabel,
} from '../../utils/drawContent';

const DEFAULT_CANVAS_FILL = '#111827';
const VIRTUAL_CANVAS_WIDTH = 320;
const VIRTUAL_CANVAS_HEIGHT = 460;
const TURN_INTRO_DURATION = 2500;
const BRUSH_COLORS = ['#FFFFFF', '#F97316', '#22C55E', '#60A5FA', '#F472B6'];
const FILL_COLORS = ['#111827', '#F8FAFC', '#FDE68A', '#BFDBFE', '#FBCFE8'];

const buildSvgPath = (points) => {
    if (!points.length) return '';
    return points.reduce((acc, point, index) => (
        index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`
    ), '');
};

export default function DrawGameScreen({ route, navigation }) {
    const { roomId } = route.params;
    const { currentUser } = useAuth();
    const {
        listenToRoom,
        addDrawingStroke,
        clearDrawing,
        setCanvasFill,
        sendChatGuess,
        calculateRoundResults,
        revealHint,
    } = useGame();

    const [roomData, setRoomData] = useState(null);
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

    const currentStrokePoints = useRef([]);
    const isCalculatingRef = useRef(false);
    const hasRoutedRef = useRef(false);
    const roundStartRef = useRef(null);
    const turnIntroKeyRef = useRef(null);
    const turnIntroTimeoutRef = useRef(null);
    const boardLayoutRef = useRef({ width: VIRTUAL_CANVAS_WIDTH, height: VIRTUAL_CANVAS_HEIGHT });

    const resolveStartTime = (value) => {
        if (!value) return null;
        if (typeof value?.toDate === 'function') return value.toDate();
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    useEffect(() => {
        const unsubscribe = listenToRoom(roomId, (data) => {
            setRoomData(data);
            if (data.status === 'round_results' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                navigation.replace('DrawRoundResult', { roomId });
            } else if (data.status === 'finished' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                navigation.replace('FinalResult', { roomId });
            }
        });

        return () => unsubscribe();
    }, [navigation, roomId]);

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
        if (!roomData?.roundData?.startTime) return undefined;

        const startTime = resolveStartTime(roomData.roundData.startTime);
        const totalTime = roomData.settings?.timePerRound || 60;
        if (!startTime) {
            setTimeLeft(totalTime);
            return undefined;
        }

        const startKey = startTime.getTime();
        if (roundStartRef.current === startKey) {
            return undefined;
        }
        roundStartRef.current = startKey;

        const endTime = new Date(startTime.getTime() + totalTime * 1000);

        const updateRemainingTime = () => {
            const diff = Math.ceil((endTime - new Date()) / 1000);
            if (diff <= 0) {
                setTimeLeft(0);
                if (roomData?.hostId === currentUser?.uid && !isCalculatingRef.current) {
                    isCalculatingRef.current = true;
                    calculateRoundResults(roomId, roomData).catch(() => {
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
    }, [currentUser?.uid, calculateRoundResults, roomData?.roundData?.startTime, roomData?.hostId, roomData?.settings?.timePerRound, roomId]);

    useEffect(() => {
        if (!roomData?.roundData) return;
        const totalGuessers = roomData.players.filter((player) => player.uid !== roomData.roundData.drawerId).length;
        const guessedCount = roomData.roundData.correctlyGuessed?.length || 0;

        if (
            totalGuessers > 0 &&
            guessedCount >= totalGuessers &&
            roomData.hostId === currentUser?.uid &&
            !isCalculatingRef.current
        ) {
            isCalculatingRef.current = true;
            calculateRoundResults(roomId, roomData).catch(() => {
                isCalculatingRef.current = false;
            });
        }
    }, [calculateRoundResults, currentUser?.uid, roomData, roomId]);

    const isDrawer = roomData?.roundData?.drawerId === currentUser?.uid;
    const hasGuessedCorrectly = roomData?.roundData?.correctlyGuessed?.includes(currentUser?.uid);
    const drawer = roomData?.players?.find((player) => player.uid === roomData?.roundData?.drawerId);
    const canvasFill = roomData?.roundData?.canvasFill || DEFAULT_CANVAS_FILL;
    const currentStrokeColor = activeTool === 'eraser' ? canvasFill : selectedColor;
    const currentStrokeWidth = activeTool === 'eraser' ? 18 : 6;
    const strokes = roomData?.roundData?.strokes || [];
    const visibleWord = isDrawer ? roomData?.roundData?.word : roomData?.roundData?.maskedWord;
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
    const recentNotifications = useMemo(() => (
        (roomData?.roundData?.chatMessages || [])
            .filter((entry) => entry.type !== 'system')
            .slice(-3)
            .reverse()
    ), [roomData?.roundData?.chatMessages]);

    const mapPointToCanvas = (locationX, locationY) => {
        const { width, height } = boardLayoutRef.current;
        const safeWidth = width || VIRTUAL_CANVAS_WIDTH;
        const safeHeight = height || VIRTUAL_CANVAS_HEIGHT;

        return {
            x: (locationX / safeWidth) * VIRTUAL_CANVAS_WIDTH,
            y: (locationY / safeHeight) * VIRTUAL_CANVAS_HEIGHT,
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
            id: `${currentUser?.uid}-${Date.now()}`,
            color: currentStrokeColor,
            width: currentStrokeWidth,
            path,
        };

        currentStrokePoints.current = [];
        setDraftPath('');

        try {
            await addDrawingStroke(roomId, stroke);
        } catch (error) {
            console.error('Erro ao enviar traço:', error);
        }
    };

    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => isDrawer && timeLeft > 0 && !showTurnIntro,
        onMoveShouldSetPanResponder: () => isDrawer && timeLeft > 0 && !showTurnIntro,
        onPanResponderGrant: (event) => {
            setIsBoardTouchActive(true);
            const { locationX, locationY } = event.nativeEvent;
            currentStrokePoints.current = [mapPointToCanvas(locationX, locationY)];
            setDraftPath(buildSvgPath(currentStrokePoints.current));
        },
        onPanResponderMove: (event) => {
            const { locationX, locationY } = event.nativeEvent;
            currentStrokePoints.current = [...currentStrokePoints.current, mapPointToCanvas(locationX, locationY)];
            setDraftPath(buildSvgPath(currentStrokePoints.current));
        },
        onPanResponderRelease: finishStroke,
        onPanResponderTerminate: finishStroke,
    }), [addDrawingStroke, currentStrokeColor, currentStrokeWidth, currentUser?.uid, isDrawer, roomId, showTurnIntro, timeLeft]);

    const handleClear = async () => {
        currentStrokePoints.current = [];
        setDraftPath('');
        try {
            await clearDrawing(roomId);
        } catch (error) {
            console.error('Erro ao limpar desenho:', error);
        }
    };

    const handleRevealHint = async () => {
        try {
            await revealHint(roomId);
        } catch (error) {
            console.error('Erro ao revelar dica:', error);
        }
    };

    const handleSetCanvasFill = async (fillColor) => {
        try {
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
            await sendChatGuess(roomId, trimmedMessage);
            setMessage('');
        } catch (error) {
            console.error('Erro ao enviar palpite:', error);
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
                        onPress={() => setActiveTool('brush')}
                        activeOpacity={0.85}
                    >
                        <Paintbrush size={16} color={activeTool === 'brush' ? '#FFFFFF' : '#C4B5FD'} />
                        <Text style={[styles.toolChipText, activeTool === 'brush' && styles.toolChipTextActive]}>
                            Pincel
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.toolChip, expanded && styles.toolChipExpanded, activeTool === 'eraser' && styles.toolChipActive]}
                        onPress={() => setActiveTool('eraser')}
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

    const renderCanvasSection = (expanded = false) => (
        <View style={[styles.canvasSection, expanded && styles.canvasSectionExpanded]}>
            <View style={[styles.boardHeader, expanded && styles.boardHeaderExpanded]}>
                <View style={styles.boardTitleRow}>
                    <Paintbrush size={18} color="#C4B5FD" />
                    <Text style={styles.boardTitle}>{expanded ? 'Quadro ampliado' : 'Quadro'}</Text>
                </View>

                {isDrawer && (
                    <View style={styles.boardActions}>
                        {!expanded && (
                            <TouchableOpacity
                                style={styles.boardActionButton}
                                onPress={() => setIsCanvasExpanded(true)}
                                activeOpacity={0.85}
                            >
                                <Expand size={16} color="#E2E8F0" />
                                <Text style={styles.boardActionText}>Expandir</Text>
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
                                    <Text style={styles.hintButtonText}>
                                        💡 Dica ({hintsLeft})
                                    </Text>
                                </TouchableOpacity>
                            );
                        })()}

                        <TouchableOpacity style={styles.clearButton} onPress={handleClear} activeOpacity={0.85}>
                            <Trash2 size={16} color="#FCA5A5" />
                            <Text style={styles.clearButtonText}>Limpar</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View
                style={[
                    styles.board,
                    expanded ? styles.boardExpanded : styles.boardMain,
                    { backgroundColor: canvasFill },
                ]}
                onTouchStart={() => setIsBoardTouchActive(true)}
                onTouchEnd={() => setIsBoardTouchActive(false)}
                onTouchCancel={() => setIsBoardTouchActive(false)}
                onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    boardLayoutRef.current = { width, height };
                }}
                {...panResponder.panHandlers}
            >
                <Svg width="100%" height="100%" viewBox={`0 0 ${VIRTUAL_CANVAS_WIDTH} ${VIRTUAL_CANVAS_HEIGHT}`}>
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

                {expanded && isDrawer && (
                    <View style={styles.expandedToolsOverlay}>
                        {renderControlsCard(true)}
                    </View>
                )}
            </View>

            {!expanded && renderControlsCard()}
        </View>
    );

    const renderMiniLeaderboard = () => {
        if (!topPlayers.length) return null;

        return (
            <View
                pointerEvents="none"
                style={[
                    styles.miniLeaderboardShell,
                    !isDrawer && styles.miniLeaderboardWithComposer,
                ]}
            >
                <View style={styles.miniLeaderboardCard}>
                    <View style={styles.miniLeaderboardHeader}>
                        <Text style={styles.miniLeaderboardEyebrow}>Placar ao vivo</Text>
                        <Text style={styles.miniLeaderboardTitle}>Top 3</Text>
                    </View>

                    {topPlayers.map((player, index) => (
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

                    {currentUserRank > 3 && currentPlayer && (
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
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0F172A', '#1E1B4B']} style={styles.background} />
            <Header title={`Rodada ${roomData.currentRound}/${roomData.settings.totalRounds}`} transparent />

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0}
            >
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: isDrawer ? 140 : 220 },
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
                                    <Text style={styles.timerText}>{timeLeft}s</Text>
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
                </ScrollView>

                {recentNotifications.length > 0 && (
                    <View
                        pointerEvents="none"
                        style={[
                            styles.liveNotifications,
                            !isDrawer && styles.liveNotificationsWithComposer,
                        ]}
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

                {renderMiniLeaderboard()}

                {!isDrawer && (
                    <View style={styles.composerShell}>
                        <View style={styles.composerCard}>
                            <TextInput
                                style={styles.composerInput}
                                value={message}
                                onChangeText={setMessage}
                                placeholder={hasGuessedCorrectly ? 'Você já acertou' : 'Digite seu palpite'}
                                placeholderTextColor="rgba(255,255,255,0.35)"
                                editable={!hasGuessedCorrectly && timeLeft > 0}
                                onSubmitEditing={handleSendGuess}
                                returnKeyType="send"
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
                        <Animated.View entering={ZoomIn.springify().damping(15)} exiting={ZoomOut.duration(220)} style={styles.turnIntroCard}>
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
        paddingTop: 8,
        gap: 18,
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
        padding: 14,
        gap: 14,
    },
    canvasSectionExpanded: {
        flex: 1,
        padding: 10,
        gap: 10,
    },
    boardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    boardHeaderExpanded: {
        paddingHorizontal: 4,
    },
    boardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    boardTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    boardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    boardActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
    },
    boardActionText: {
        color: '#E2E8F0',
        fontSize: 14,
        fontWeight: '700',
    },
    hintButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(250, 204, 21, 0.14)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
    },
    hintButtonDisabled: {
        opacity: 0.4,
    },
    hintButtonText: {
        color: '#FDE68A',
        fontSize: 14,
        fontWeight: '700',
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(239, 68, 68, 0.14)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
    },
    clearButtonText: {
        color: '#FCA5A5',
        fontSize: 14,
        fontWeight: '700',
    },
    board: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    boardMain: {
        height: 440,
    },
    boardExpanded: {
        flex: 1,
        minHeight: 0,
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
    expandedToolsOverlay: {
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
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    miniLeaderboardRowCurrent: {
        backgroundColor: 'rgba(139, 92, 246, 0.18)',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.24)',
    },
    miniLeaderboardRank: {
        width: 24,
        color: '#C4B5FD',
        fontSize: 12,
        fontWeight: '900',
        textAlign: 'center',
    },
    miniLeaderboardName: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '700',
    },
    miniLeaderboardScore: {
        color: '#FDE68A',
        fontSize: 13,
        fontWeight: '800',
    },
    miniLeaderboardFooter: {
        color: '#CBD5E1',
        fontSize: 11,
        lineHeight: 15,
    },
    composerShell: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 20,
    },
    composerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
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
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.45,
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
