import { buildDrawContentQueue } from '../../utils/drawContent';
import { ensureMatchAchievements } from '../../utils/socialGames';

export const DEFAULT_DRAW_CANVAS_FILL = '#111827';

const isRevealableChar = (char = '') => /[\p{L}\p{N}]/u.test(char);

export const normalizeText = (value = '') => (
    value
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
);

export const maskWord = (word = '', revealedIndices = []) => (
    word
        .split('')
        .map((char, index) => (
            isRevealableChar(char) && !revealedIndices.includes(index) ? '_' : char
        ))
        .join(' ')
);

export const getHiddenCharacterIndices = (word = '', revealedIndices = []) => {
    const revealedSet = new Set(revealedIndices);
    return word
        .split('')
        .reduce((accumulator, char, index) => {
            if (isRevealableChar(char) && !revealedSet.has(index)) {
                accumulator.push(index);
            }
            return accumulator;
        }, []);
};

export const buildDrawerQueue = (players = [], totalRounds = 0) => {
    const playerIds = players.map((player) => player.uid);
    return Array.from({ length: totalRounds }, (_, index) => playerIds[index % playerIds.length]);
};

export const createDrawRoundData = (word, drawerId, startTimeFactory) => ({
    word,
    maskedWord: maskWord(word),
    revealedHintIndices: [],
    drawerId,
    startTime: startTimeFactory(),
    canvasFill: DEFAULT_DRAW_CANVAS_FILL,
    strokes: [],
    chatMessages: [
        {
            id: `system-${drawerId}-${Date.now()}`,
            type: 'system',
            text: 'A rodada comecou. Tentem descobrir o desafio.',
            createdAt: Date.now(),
        },
    ],
    guesses: {},
    correctlyGuessed: [],
    reports: {},
    acceptedReport: null,
    results: null,
});

export const buildDrawGameStart = ({ roomData, totalRounds, startTimeFactory }) => {
    const difficulty = roomData.settings?.difficulty || 'normal';
    const contentMode = roomData.settings?.contentMode || 'words';
    const drawCategory = roomData.settings?.drawCategory;
    const words = buildDrawContentQueue({
        count: totalRounds,
        difficulty,
        category: drawCategory,
        contentMode,
    });
    const drawerQueue = buildDrawerQueue(roomData.players || [], totalRounds);

    return {
        status: 'playing',
        currentRound: 1,
        drawWordsQueue: words,
        drawerQueue,
        roundData: createDrawRoundData(words[0], drawerQueue[0], startTimeFactory),
    };
};

export const buildNextDrawRound = ({ roomData, nextRoundNum, startTimeFactory }) => {
    const nextWord = roomData.drawWordsQueue?.[nextRoundNum - 1] || 'desenho';
    const nextDrawerId = roomData.drawerQueue?.[nextRoundNum - 1] || roomData.hostId;

    return {
        status: 'playing',
        currentRound: nextRoundNum,
        roundData: createDrawRoundData(nextWord, nextDrawerId, startTimeFactory),
    };
};

const resolveStartTimeMs = (value) => {
    if (!value) return 0;
    if (typeof value?.toDate === 'function') return value.toDate().getTime();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const calcSpeedBonus = (guessedAtMs, startTimeMs, timePerRound) => {
    if (!startTimeMs || !guessedAtMs) return 0;
    const elapsedRatio = Math.max(0, Math.min(1,
        (guessedAtMs - startTimeMs) / (timePerRound * 1000)
    ));
    if (elapsedRatio <= 0.33) return 4;
    if (elapsedRatio <= 0.66) return 2;
    return 0;
};

export const calculateDrawRoundOutcome = ({ roomData, normalizePlayerProgress }) => {
    const roundData = roomData.roundData || {};
    const players = roomData.players || [];
    const settings = roomData.settings || {};
    const timePerRound = settings.timePerRound || 60;
    const isWordMode = settings.contentMode !== 'characters';
    const difficulty = isWordMode ? (settings.difficulty || 'normal') : 'normal';
    const diffMultiplier = difficulty === 'hard' ? 1.5 : 1;
    const startTimeMs = resolveStartTimeMs(roundData.startTime);

    const guessedPlayers = (roundData.correctlyGuessed || [])
        .map((uid) => ({
            uid,
            guessedAt: roundData.guesses?.[uid]?.guessedAt || 0,
        }))
        .sort((a, b) => a.guessedAt - b.guessedAt)
        .map((entry, index) => {
            const basePoints = Math.max(4, 12 - (index * 2));
            const speedBonus = calcSpeedBonus(entry.guessedAt, startTimeMs, timePerRound);
            const rawPoints = basePoints + speedBonus;
            return {
                ...entry,
                basePoints,
                speedBonus,
                points: Math.round(rawPoints * diffMultiplier),
            };
        });

    const updatedPlayers = players.map((player) => normalizePlayerProgress(player));
    guessedPlayers.forEach(({ uid, points, speedBonus }) => {
        const player = updatedPlayers.find((item) => item.uid === uid);
        if (player) {
            player.score = (player.score || 0) + points;
            if (speedBonus >= 4) {
                player.unlockedAchievements = {
                    ...ensureMatchAchievements(player.unlockedAchievements),
                    relampago: true,
                };
            }
        }
    });

    const drawer = updatedPlayers.find((player) => player.uid === roundData.drawerId);
    const drawerPenalty = guessedPlayers.length === 0;
    if (drawer) {
        if (!drawerPenalty) {
            const drawerRaw = 6 + guessedPlayers.length * 2;
            drawer.score = (drawer.score || 0) + Math.round(drawerRaw * diffMultiplier);
        } else {
            drawer.score = (drawer.score || 0) - 3;
        }
    }

    const streakPlayers = [];
    updatedPlayers.forEach((player) => {
        if (player.uid === roundData.drawerId) {
            player.consecutiveGuesses = 0;
            return;
        }

        const guessed = guessedPlayers.some((entry) => entry.uid === player.uid);
        if (guessed) {
            player.consecutiveGuesses = (player.consecutiveGuesses || 0) + 1;
            if (player.consecutiveGuesses >= 4) {
                player.score = (player.score || 0) + 5;
                player.unlockedAchievements = {
                    ...ensureMatchAchievements(player.unlockedAchievements),
                    detective: true,
                };
                streakPlayers.push(player.uid);
            }
        } else {
            player.consecutiveGuesses = 0;
        }
    });

    const missedPlayerIds = updatedPlayers
        .filter((player) => (
            player.uid !== roundData.drawerId &&
            !guessedPlayers.some((entry) => entry.uid === player.uid)
        ))
        .map((player) => player.uid);

    return {
        players: updatedPlayers,
        results: {
            word: roundData.word,
            drawerId: roundData.drawerId,
            guessedPlayers,
            missedPlayerIds,
            drawerPenalty,
            streakPlayers,
            difficulty,
        },
    };
};

export const buildChatGuessUpdate = ({ roomData, currentUser, message }) => {
    const roundData = roomData.roundData || {};
    const trimmedMessage = message.trim();

    if (!trimmedMessage) return { correct: false, update: null };
    if (roomData.settings?.gameType !== 'draw' || roomData.status !== 'playing') return { correct: false, update: null };
    if (roundData.drawerId === currentUser.uid) return { correct: false, update: null };
    if ((roundData.correctlyGuessed || []).includes(currentUser.uid)) return { correct: false, update: null };

    const player = (roomData.players || []).find((item) => item.uid === currentUser.uid);
    if (!player) return { correct: false, update: null };

    const isCorrect = normalizeText(trimmedMessage) === normalizeText(roundData.word);
    const chatMessages = [...(roundData.chatMessages || [])];

    if (isCorrect) {
        chatMessages.push({
            id: `correct-${currentUser.uid}-${Date.now()}`,
            uid: currentUser.uid,
            name: player.name,
            type: 'correct',
            text: `${player.name} acertou!`,
            createdAt: Date.now(),
        });

        return {
            correct: true,
            update: {
                'roundData.chatMessages': chatMessages,
                'roundData.correctlyGuessed': [...(roundData.correctlyGuessed || []), currentUser.uid],
                [`roundData.guesses.${currentUser.uid}`]: {
                    guess: trimmedMessage,
                    guessedAt: Date.now(),
                },
            },
        };
    }

    chatMessages.push({
        id: `guess-${currentUser.uid}-${Date.now()}`,
        uid: currentUser.uid,
        name: player.name,
        type: 'guess',
        text: trimmedMessage,
        createdAt: Date.now(),
    });

    return {
        correct: false,
        update: {
            'roundData.chatMessages': chatMessages,
        },
    };
};

export const buildRevealHintUpdate = ({ roomData, currentUserId, maxHints = 2 }) => {
    const roundData = roomData.roundData || {};
    if (roundData.drawerId !== currentUserId) return null;
    if ((roundData.hintsUsed || 0) >= maxHints) return null;
    if (roomData.status !== 'playing') return null;

    const revealedHintIndices = roundData.revealedHintIndices || [];
    const hiddenIndices = getHiddenCharacterIndices(roundData.word, revealedHintIndices);
    if (hiddenIndices.length === 0) return null;

    const randomIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
    const nextRevealedHintIndices = [...revealedHintIndices, randomIndex].sort((a, b) => a - b);
    const newMaskedWord = maskWord(roundData.word, nextRevealedHintIndices);

    const updatedPlayers = (roomData.players || []).map((player) => {
        if (player.uid === currentUserId) {
            return { ...player, score: (player.score || 0) - 2 };
        }
        return player;
    });

    return {
        'roundData.maskedWord': newMaskedWord,
        'roundData.hintsUsed': (roundData.hintsUsed || 0) + 1,
        'roundData.revealedHintIndices': nextRevealedHintIndices,
        players: updatedPlayers,
    };
};

export const buildReportDrawingUpdate = ({
    roomData,
    currentUser,
    reason,
    startTimeFactory,
    penalty = 5,
}) => {
    const roundData = roomData.roundData || {};
    const players = roomData.players || [];
    const currentRound = roomData.currentRound || 1;
    const totalRounds = roomData.settings?.totalRounds || currentRound;

    if (!currentUser?.uid) return { accepted: false, update: null };
    if (roomData.settings?.gameType !== 'draw' || roomData.status !== 'playing') return { accepted: false, update: null };
    if (!roundData.drawerId || roundData.drawerId === currentUser.uid) return { accepted: false, update: null };
    if (roundData.acceptedReport) return { accepted: false, update: null };

    const voter = players.find((player) => player.uid === currentUser.uid);
    if (!voter) return { accepted: false, update: null };

    const eligibleVoters = players.filter((player) => player.uid !== roundData.drawerId);
    const threshold = Math.max(1, Math.ceil(eligibleVoters.length / 2));
    const reports = {
        ...(roundData.reports || {}),
        [currentUser.uid]: {
            uid: currentUser.uid,
            name: voter.name || currentUser.displayName || 'Jogador',
            reason: reason || 'other',
            createdAt: Date.now(),
        },
    };
    const reportCount = Object.keys(reports).length;
    const accepted = reportCount >= threshold;
    const chatMessages = [...(roundData.chatMessages || [])];

    if (!accepted) {
        chatMessages.push({
            id: `report-${currentUser.uid}-${Date.now()}`,
            uid: currentUser.uid,
            name: voter.name,
            type: 'system',
            text: `${voter.name || 'Um jogador'} denunciou o desenho (${reportCount}/${threshold}).`,
            createdAt: Date.now(),
        });

        return {
            accepted: false,
            update: {
                'roundData.reports': reports,
                'roundData.chatMessages': chatMessages,
            },
        };
    }

    const updatedPlayers = players.map((player) => {
        if (player.uid !== roundData.drawerId) return normalizePlayerProgressFallback(player);
        const normalized = normalizePlayerProgressFallback(player);
        return {
            ...normalized,
            score: (normalized.score || 0) - penalty,
            consecutiveGuesses: 0,
        };
    });

    const acceptedReport = {
        drawerId: roundData.drawerId,
        reports,
        reportCount,
        threshold,
        penalty,
        acceptedAt: Date.now(),
    };

    if (currentRound < totalRounds) {
        const nextRoundNum = currentRound + 1;
        const nextRound = buildNextDrawRound({
            roomData,
            nextRoundNum,
            startTimeFactory,
        });

        return {
            accepted: true,
            update: {
                ...nextRound,
                players: updatedPlayers,
                roundData: {
                    ...nextRound.roundData,
                    chatMessages: [
                        {
                            id: `report-accepted-${roundData.drawerId}-${Date.now()}`,
                            type: 'system',
                            text: 'Denúncia aceita. O desenhista perdeu a vez e a rodada passou para o próximo jogador.',
                            createdAt: Date.now(),
                        },
                        ...(nextRound.roundData?.chatMessages || []),
                    ],
                    acceptedReport,
                },
            },
        };
    }

    chatMessages.push({
        id: `report-accepted-${roundData.drawerId}-${Date.now()}`,
        type: 'system',
        text: 'Denúncia aceita. O desenhista perdeu pontos nesta última rodada.',
        createdAt: Date.now(),
    });

    return {
        accepted: true,
        update: {
            status: 'round_results',
            players: updatedPlayers,
            'roundData.reports': reports,
            'roundData.acceptedReport': acceptedReport,
            'roundData.chatMessages': chatMessages,
            'roundData.results': {
                word: roundData.word,
                drawerId: roundData.drawerId,
                guessedPlayers: [],
                missedPlayerIds: eligibleVoters.map((player) => player.uid),
                drawerPenalty: true,
                reportAccepted: true,
                reportPenalty: penalty,
                streakPlayers: [],
                difficulty: roomData.settings?.difficulty || 'normal',
            },
        },
    };
};

const normalizePlayerProgressFallback = (player = {}) => ({
    ...player,
    score: player.score || 0,
    consecutiveGuesses: player.consecutiveGuesses || 0,
});
