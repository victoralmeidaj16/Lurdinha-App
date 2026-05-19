import {
    formatDrawCategoryLabel,
    formatDrawContentModeLabel,
} from './drawContent';

export const DEFAULT_MATCH_ACHIEVEMENTS = {
    detective: false,
    relampago: false,
};

export const DEFAULT_SOCIAL_GAME_STATS = {
    lurdinhaPlayed: 0,
    drawPlayed: 0,
    secretPlayed: 0,
    mostLikelyPlayed: 0,
    obviousMindPlayed: 0,
    tierListPlayed: 0,
    lurdinhaWins: 0,
    bestDrawScore: 0,
    secretWins: 0,
    mostLikelyWins: 0,
    obviousMindWins: 0,
    tierListWins: 0,
    achievements: {
        detective: 0,
        relampago: 0,
    },
};

export const SOCIAL_GAME_ACHIEVEMENTS = [
    {
        key: 'detective',
        label: 'Detetive',
        icon: '🕵️',
        description: 'streak x4',
    },
    {
        key: 'relampago',
        label: 'Relâmpago',
        icon: '⚡',
        description: 'speed bonus',
    },
];

export const ensureMatchAchievements = (achievements = {}) => ({
    detective: achievements?.detective === true,
    relampago: achievements?.relampago === true,
});

export const ensureSocialGameStats = (socialGames = {}) => ({
    lurdinhaPlayed: socialGames?.lurdinhaPlayed || 0,
    drawPlayed: socialGames?.drawPlayed || 0,
    secretPlayed: socialGames?.secretPlayed || 0,
    mostLikelyPlayed: socialGames?.mostLikelyPlayed || 0,
    obviousMindPlayed: socialGames?.obviousMindPlayed || 0,
    tierListPlayed: socialGames?.tierListPlayed || 0,
    lurdinhaWins: socialGames?.lurdinhaWins || 0,
    bestDrawScore: socialGames?.bestDrawScore || 0,
    secretWins: socialGames?.secretWins || 0,
    mostLikelyWins: socialGames?.mostLikelyWins || 0,
    obviousMindWins: socialGames?.obviousMindWins || 0,
    tierListWins: socialGames?.tierListWins || 0,
    achievements: {
        detective: socialGames?.achievements?.detective || 0,
        relampago: socialGames?.achievements?.relampago || 0,
    },
});

export const ensureUserStats = (stats = {}) => ({
    ranking: stats?.ranking || 0,
    fireStreak: stats?.fireStreak || 0,
    acertos: stats?.acertos || 0,
    enquetesVotadas: stats?.enquetesVotadas || 0,
    grupos: stats?.grupos || 0,
    totalPoints: stats?.totalPoints || 0,
    titles: stats?.titles || 0,
    socialGames: ensureSocialGameStats(stats?.socialGames),
});

export const sortPlayersForGameResults = (players = [], gameType = 'lurdinha') => (
    [...players].sort((firstPlayer, secondPlayer) => (
        gameType === 'draw'
            || gameType === 'secret'
            || gameType === 'telephone'
            || gameType === 'most_likely'
            || gameType === 'obvious_mind'
            || gameType === 'tier_list'
            ? (secondPlayer.score || 0) - (firstPlayer.score || 0)
            : (firstPlayer.score || 0) - (secondPlayer.score || 0)
    ))
);

export const getWinningPlayerIds = (players = [], gameType = 'lurdinha') => {
    const sortedPlayers = sortPlayersForGameResults(players, gameType);
    if (!sortedPlayers.length) return [];

    const winningScore = sortedPlayers[0]?.score || 0;
    return sortedPlayers
        .filter((player) => (player.score || 0) === winningScore)
        .map((player) => player.uid);
};

export const getSocialGameModeLabel = (settings = {}) => {
    const gameType = settings?.gameType;
    if (gameType === 'secret' || gameType === 'telephone') {
        return 'Secret';
    }
    if (gameType === 'most_likely') {
        return 'Quem é mais provável?';
    }
    if (gameType === 'obvious_mind') {
        return 'Na Minha Cabeça Era Óbvio';
    }
    if (gameType === 'tier_list') {
        return 'Tier List da Galera';
    }
    if (gameType !== 'draw') {
        return 'Lurdinha';
    }

    return [
        'Desenho',
        formatDrawContentModeLabel(settings?.contentMode),
        settings?.contentMode === 'words' ? formatDrawCategoryLabel(settings?.drawCategory) : null,
    ].filter(Boolean).join(' • ');
};

export const getSocialGameScoreLabel = ({ gameType, score }) => {
    if (gameType === 'draw') return `${score || 0} pts`;
    if (gameType === 'secret' || gameType === 'telephone') return `${score || 0} pts`;
    if (gameType === 'most_likely') return `${score || 0} pts`;
    if (gameType === 'obvious_mind') return `${score || 0} pts`;
    if (gameType === 'tier_list') return `${score || 0} pts`;
    return `${score || 0} Lurdinhas`;
};
