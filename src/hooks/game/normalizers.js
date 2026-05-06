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
    const gameType = roomData.settings?.gameType || 'lurdinha';
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

export const buildRestartState = (roomData) => ({
    status: 'waiting',
    currentRound: 0,
    players: (roomData.players || []).map((player) => ({
        ...player,
        score: 0,
        consecutiveGuesses: 0,
        isReady: true,
        unlockedAchievements: ensureMatchAchievements(),
    })),
    roundData: null,
    partySession: null,
    drawWordsQueue: [],
    drawerQueue: [],
    questionsQueue: [],
    finishedAt: null,
    historySavedAt: null,
    updatedAt: serverTimestamp(),
});
