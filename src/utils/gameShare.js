import {
    formatDrawCategoryLabel,
    formatDrawContentModeLabel,
} from './drawContent';
import { sortPlayersForGameResults } from './socialGames';
import { getLurdinhaThemeLabel } from '../hooks/game/lurdinha';

export const APP_MARKETING_URL = 'https://victoralmeidaj16.github.io/Lurdinha-App/marketing.html';

const formatDrawDifficultyLabel = (difficulty) => ({
    easy: 'Fácil',
    normal: 'Normal',
    hard: 'Difícil',
})[difficulty] || 'Normal';

export const sortPlayersForResults = sortPlayersForGameResults;

export const formatGameSettingsSummary = (settings = {}) => {
    if (settings?.gameType === 'secret' || settings?.gameType === 'telephone') {
        return `Secret • ${settings?.totalRounds || 0} passos na cadeia`;
    }

    if (settings?.gameType === 'most_likely') {
        return `Quem é mais provável? • ${settings?.totalRounds || 0} perguntas • ${settings?.timePerRound || 0}s/pergunta`;
    }

    if (settings?.gameType === 'obvious_mind') {
        return `Na Minha Cabeça Era Óbvio • ${settings?.totalRounds || 0} perguntas • ${settings?.timePerRound || 0}s/pergunta`;
    }

    if (settings?.gameType === 'tier_list') {
        return `Tier List da Galera • ${settings?.totalRounds || 0} perguntas • ${settings?.timePerRound || 0}s/pergunta`;
    }

    if (settings?.gameType === 'party') {
        return `Sessão Completa • ${settings?.totalRounds || 0} minigames • ${settings?.timePerRound || 0}s/rodada`;
    }

    const isDrawGame = settings?.gameType === 'draw';

    if (!isDrawGame) {
        return `${getLurdinhaThemeLabel(settings?.theme)} • ${settings?.totalRounds || 0} rodadas • ${settings?.timePerRound || 0}s/rodada`;
    }

    return [
        'Desenho',
        formatDrawContentModeLabel(settings?.contentMode),
        settings?.contentMode === 'words' ? formatDrawCategoryLabel(settings?.drawCategory) : null,
        settings?.contentMode === 'words' ? `Dificuldade ${formatDrawDifficultyLabel(settings?.difficulty)}` : null,
        `${settings?.totalRounds || 0} rodadas`,
        `${settings?.timePerRound || 0}s/rodada`,
    ].filter(Boolean).join(' • ');
};

export const formatLobbyInviteMessage = ({ roomId, settings, inviterName }) => {
    const intro = inviterName
        ? `${inviterName} te convidou para uma sala no Lurdinha.`
        : 'Vem jogar no Lurdinha comigo.';

    return [
        intro,
        `Código da sala: ${roomId}`,
        formatGameSettingsSummary(settings),
        `Toque para entrar ou baixe o app:`,
        `${APP_MARKETING_URL}?room=${roomId}`,
    ].join('\n');
};

export const formatFinalResultShareMessage = ({ roomId, roomData }) => {
    const gameType = roomData?.settings?.gameType || 'lurdinha';
    const isDrawGame = gameType === 'draw';
    const isSecretGame = gameType === 'secret' || gameType === 'telephone';
    const isMostLikelyGame = gameType === 'most_likely';
    const isObviousMindGame = gameType === 'obvious_mind';
    const isTierListGame = gameType === 'tier_list';
    const title = isDrawGame
        ? '🎨 Lurdinha App — Desenho'
        : isSecretGame
        ? '🧵 Lurdinha App — Secret'
        : isMostLikelyGame
        ? '👀 Lurdinha App — Quem é mais provável?'
        : isObviousMindGame
        ? '🧠 Lurdinha App — Na Minha Cabeça Era Óbvio'
        : isTierListGame
        ? '🏆 Lurdinha App — Tier List da Galera'
        : '😈 Lurdinha App — Lurdinha';
    const sortedPlayers = sortPlayersForResults(roomData?.players || [], gameType);

    const formatScore = (score) => {
        if (isDrawGame || isSecretGame || isMostLikelyGame || isObviousMindGame || isTierListGame) return `${score || 0}pts`;
        return `${score || 0} Lurdinhas`;
    };

    const rankingLines = sortedPlayers.map((player, index) => (
        `${index + 1}º ${player.name} ${formatScore(player.score)}`
    ));

    return [
        title,
        formatGameSettingsSummary(roomData?.settings),
        ...rankingLines,
        `Sala ${roomId}`,
        `Baixe/conheça o app: ${APP_MARKETING_URL}`,
    ].join('\n');
};
