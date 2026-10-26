// Tela certa para quem entra (ou volta) numa sala, conforme o status e o jogo.
export function getRoomRoute(roomData) {
    const gameType = roomData?.settings?.gameType;
    if (roomData?.status === 'waiting') return 'Lobby';
    if (roomData?.status === 'party_transition') return 'RoundTransition';
    if (roomData?.status === 'playing') return gameType === 'draw' ? 'DrawGame' : 'Game';
    if (roomData?.status === 'round_results') {
        if (gameType === 'draw') return 'DrawRoundResult';
        if (gameType === 'telephone' || gameType === 'secret') return 'TelephoneResult';
        if (gameType === 'tier_list') return 'TierListResult';
        if (gameType === 'impostor') return 'ImpostorRoundResult';
        return 'RoundResult';
    }
    if (roomData?.status === 'finished') return 'FinalResult';
    return 'Lobby';
}
