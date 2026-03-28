import {
    formatDrawCategoryLabel,
    formatDrawContentModeLabel,
} from './drawContent';
import { sortPlayersForGameResults } from './socialGames';

export const APP_MARKETING_URL = 'https://victoralmeidaj16.github.io/Lurdinha-App/marketing.html';

const formatDrawDifficultyLabel = (difficulty) => ({
    easy: 'Fácil',
    normal: 'Normal',
    hard: 'Difícil',
})[difficulty] || 'Normal';

export const sortPlayersForResults = sortPlayersForGameResults;

export const formatGameSettingsSummary = (settings = {}) => {
    const isDrawGame = settings?.gameType === 'draw';

    if (!isDrawGame) {
        return `Lurdinha • ${settings?.totalRounds || 0} rodadas • ${settings?.timePerRound || 0}s/rodada`;
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
        'Abra o app e toque em "Entrar na Sala" para usar esse código.',
        `Baixe/conheça o app: ${APP_MARKETING_URL}`,
    ].join('\n');
};

export const formatFinalResultShareMessage = ({ roomId, roomData }) => {
    const isDrawGame = roomData?.settings?.gameType === 'draw';
    const title = isDrawGame ? '🎨 Lurdinha App — Desenho' : '😈 Lurdinha App — Lurdinha';
    const sortedPlayers = sortPlayersForResults(roomData?.players || [], roomData?.settings?.gameType);

    const rankingLines = sortedPlayers.map((player, index) => (
        `${index + 1}º ${player.name} ${isDrawGame ? `${player.score || 0}pts` : `${player.score || 0} Lurdinhas`}`
    ));

    return [
        title,
        formatGameSettingsSummary(roomData?.settings),
        ...rankingLines,
        `Sala ${roomId}`,
        `Baixe/conheça o app: ${APP_MARKETING_URL}`,
    ].join('\n');
};
