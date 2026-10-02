const getPlayers = (roomData = {}) => roomData.players || [];

export const getSecretTurnType = (turn = 1) => (turn % 2 === 1 ? 'phrase' : 'drawing');

export const getSecretTotalTurns = (playerCount = 0) => {
    const count = Math.max(2, playerCount || 2);
    if (count <= 2) return 3;
    return count % 2 === 1 ? count : count - 1;
};

// A ordem é congelada no início da partida (`roundData.playerOrder`), para que
// quem sai no meio não desloque as threads. Salas antigas caem na lista viva.
export const getSecretPlayerOrder = (roomData = {}) => {
    const frozen = roomData.roundData?.playerOrder;
    if (Array.isArray(frozen) && frozen.length > 0) return frozen;
    return getPlayers(roomData).map((player) => player.uid);
};

export const getSecretTargetThreadUid = ({ playerOrder, currentTurn = 1, uid }) => {
    const myIndex = playerOrder.indexOf(uid);
    if (myIndex === -1 || playerOrder.length === 0) return null;

    const offset = currentTurn - 1;
    const targetThreadIndex = (((myIndex - offset) % playerOrder.length) + playerOrder.length) % playerOrder.length;
    return playerOrder[targetThreadIndex] || null;
};

// Turno fecha quando todos que ainda estão na sala enviaram.
export const areAllSecretPlayersReady = ({ roomData, readyPlayers }) => {
    const players = getPlayers(roomData);
    if (players.length === 0) return true;
    return players.every((player) => readyPlayers.includes(player.uid));
};

const getTargetThreadAuthorUid = ({ roomData, currentUserId }) => (
    getSecretTargetThreadUid({
        playerOrder: getSecretPlayerOrder(roomData),
        currentTurn: roomData.currentTurn || 1,
        uid: currentUserId,
    })
);

export function buildSecretGameStart({ roomData, totalTurnsFactory, startTimeFactory }) {
    const players = getPlayers(roomData);
    const initialThreads = {};

    players.forEach((player) => {
        initialThreads[player.uid] = [];
    });

    const requestedTurns = totalTurnsFactory ? totalTurnsFactory(players.length) : getSecretTotalTurns(players.length);
    const totalTurns = Math.max(3, requestedTurns || getSecretTotalTurns(players.length));

    return {
        status: 'playing',
        currentTurn: 1,
        roundData: {
            totalTurns,
            playerOrder: players.map((player) => player.uid),
            turnType: getSecretTurnType(1),
            threads: initialThreads,
            readyPlayers: [],
            startTime: startTimeFactory ? startTimeFactory() : new Date().toISOString(),
        },
    };
}

export function buildSubmitSecretPhrase({ roomData, currentUserId, phrase }) {
    const readyPlayers = roomData.roundData?.readyPlayers || [];
    if (readyPlayers.includes(currentUserId)) return null;

    const targetAuthorUid = getTargetThreadAuthorUid({ roomData, currentUserId });
    if (!targetAuthorUid) return null;

    const currentTurn = roomData.currentTurn || 1;
    const currentThread = roomData.roundData?.threads?.[targetAuthorUid] || [];
    const nextEntry = {
        type: 'phrase',
        authorId: currentUserId,
        turn: currentTurn,
        text: phrase,
    };

    return {
        [`roundData.threads.${targetAuthorUid}`]: [...currentThread, nextEntry],
        'roundData.readyPlayers': [...readyPlayers, currentUserId],
    };
}

export function buildSubmitSecretDrawing({ roomData, currentUserId, strokes, canvasFill = '#F8FAFC' }) {
    const readyPlayers = roomData.roundData?.readyPlayers || [];
    if (readyPlayers.includes(currentUserId)) return null;

    const targetAuthorUid = getTargetThreadAuthorUid({ roomData, currentUserId });
    if (!targetAuthorUid) return null;

    const currentTurn = roomData.currentTurn || 1;
    const currentThread = roomData.roundData?.threads?.[targetAuthorUid] || [];
    const nextEntry = {
        type: 'drawing',
        authorId: currentUserId,
        turn: currentTurn,
        strokes: strokes || [],
        canvasFill,
    };

    return {
        [`roundData.threads.${targetAuthorUid}`]: [...currentThread, nextEntry],
        'roundData.readyPlayers': [...readyPlayers, currentUserId],
    };
}

export function buildNextSecretTurn({ roomData, startTimeFactory }) {
    const currentTurn = roomData.currentTurn || 1;
    const totalTurns = roomData.roundData?.totalTurns || getPlayers(roomData).length || 2;

    if (currentTurn >= totalTurns) {
        return {
            status: 'round_results',
        };
    }

    const nextTurn = currentTurn + 1;

    return {
        currentTurn: nextTurn,
        'roundData.turnType': getSecretTurnType(nextTurn),
        'roundData.readyPlayers': [],
        'roundData.startTime': startTimeFactory ? startTimeFactory() : new Date().toISOString(),
    };
}
