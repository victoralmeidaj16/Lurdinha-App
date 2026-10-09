import { serverTimestamp } from 'firebase/firestore';
import {
    DEFAULT_DRAW_CONTENT_MODE,
    DEFAULT_DRAW_WORD_CATEGORY,
} from '../../utils/drawContent';
import {
    DEFAULT_LURDINHA_THEME,
} from './lurdinha';
import {
    ensureMatchAchievements,
    getRoomGameType,
    getWinningPlayerIds,
    sortPlayersForGameResults,
} from '../../utils/socialGames';

export const omitUndefined = (object = {}) => Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined)
);

export const sanitizeRoomSettings = (settings = {}) => omitUndefined({
    timePerRound: settings.timePerRound || 20,
    totalRounds: settings.totalRounds || 5,
    theme: settings.theme || DEFAULT_LURDINHA_THEME,
    gameType: settings.gameType || 'lurdinha',
    difficulty: settings.difficulty || 'normal',
    contentMode: settings.contentMode || DEFAULT_DRAW_CONTENT_MODE,
    drawCategory: settings.drawCategory || DEFAULT_DRAW_WORD_CATEGORY,
    ...settings,
});

export const createLobbyPlayer = (user, fallbackName = 'Jogador') => ({
    uid: user.uid,
    name: user.displayName || fallbackName,
    photoURL: user.photoURL,
    score: 0,
    isReady: true,
    consecutiveGuesses: 0,
    unlockedAchievements: ensureMatchAchievements(),
});

export const normalizePlayerProgress = (player = {}) => ({
    ...player,
    consecutiveGuesses: player.consecutiveGuesses || 0,
    unlockedAchievements: ensureMatchAchievements(player.unlockedAchievements),
});

export const buildGameHistorySnapshot = (roomId, roomData) => {
    const gameType = getRoomGameType(roomData);
    const normalizedPlayers = (roomData.players || []).map(normalizePlayerProgress);
    const sortedPlayers = sortPlayersForGameResults(normalizedPlayers, gameType);
    const winnerIds = getWinningPlayerIds(sortedPlayers, gameType);

    return {
        gameType,
        normalizedPlayers,
        sortedPlayers,
        winnerIds,
        participantIds: sortedPlayers.map((player) => player.uid),
        historyPlayers: sortedPlayers.map((player, index) => ({
            uid: player.uid,
            name: player.name,
            photoURL: player.photoURL || null,
            score: player.score || 0,
            position: index + 1,
            isWinner: winnerIds.includes(player.uid),
            achievements: ensureMatchAchievements(player.unlockedAchievements),
        })),
        roomId,
    };
};

export const buildSessionResetState = (roomData) => {
    const prevSessionScores = roomData.sessionScores || {};
    const updatedSessionScores = { ...prevSessionScores };
    (roomData.players || []).forEach((player) => {
        updatedSessionScores[player.uid] = (updatedSessionScores[player.uid] || 0) + (player.score || 0);
    });

    const prevSessionGames = roomData.sessionGames || [];
    const newSessionGames = [
        ...prevSessionGames,
        {
            gameType: getRoomGameType(roomData),
            scores: Object.fromEntries((roomData.players || []).map((p) => [p.uid, p.score || 0])),
        },
    ];

    return {
        ...buildRestartState(roomData),
        sessionScores: updatedSessionScores,
        sessionGames: newSessionGames,
        // Entre um jogo e outro a sala vota a próxima modalidade (janela de MODE_VOTE_SECONDS).
        modeVoteStartedAt: serverTimestamp(),
    };
};

// A sessão Party sobrescreve `settings.gameType/totalRounds` a cada minijogo;
// na revanche voltamos ao modo Party com a quantidade original de minigames.
const buildRestartSettingsPatch = (roomData) => {
    const session = roomData.partySession;
    if (!session) return {};
    return {
        settings: omitUndefined({
            ...(roomData.settings || {}),
            gameType: 'party',
            totalRounds: session.totalGames || roomData.settings?.totalRounds,
        }),
    };
};

export const buildRestartState = (roomData) => ({
    status: 'waiting',
    ...buildRestartSettingsPatch(roomData),
    currentRound: 0,
    players: (roomData.players || []).map((player) => ({
        ...player,
        score: 0,
        consecutiveGuesses: 0,
        isReady: true,
        unlockedAchievements: ensureMatchAchievements(),
    })),
    roundData: null,
    // Votos de modo valem para uma escolha só; ao voltar ao lobby começa uma votação nova.
    votes: {},
    modeVoteStartedAt: null,
    modeVoteResolved: false,
    modeVoteWinner: null,
    voteChat: [],
    partySession: null,
    drawWordsQueue: [],
    drawerQueue: [],
    questionsQueue: [],
    finishedAt: null,
    historySavedAt: null,
    updatedAt: serverTimestamp(),
});

export const MODE_VOTE_SECONDS = 15;

// Apura a votação de modalidade: só conta votos de quem está na sala em modos
// liberados; empate é sorteado. Sem votos válidos, mantém o modo atual.
export const pickModeVoteWinner = ({ votes = {}, playerIds = [], allowedKeys = [], fallback = null, random = Math.random }) => {
    const players = new Set(playerIds);
    const allowed = new Set(allowedKeys);
    const counts = {};
    Object.entries(votes).forEach(([uid, key]) => {
        if (!players.has(uid) || !allowed.has(key)) return;
        counts[key] = (counts[key] || 0) + 1;
    });
    const max = Math.max(0, ...Object.values(counts));
    if (max === 0) return fallback;
    const tied = Object.keys(counts).filter((key) => counts[key] === max);
    return tied[Math.min(tied.length - 1, Math.floor(random() * tied.length))];
};
