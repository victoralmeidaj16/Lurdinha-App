const getPlayers = (roomData = {}) => roomData.players || [];

export const getSecretTurnType = (turn = 1) => (turn % 2 === 1 ? 'phrase' : 'drawing');

export const getSecretTotalTurns = (playerCount = 0) => {
    const count = Math.max(2, playerCount || 2);
    if (count <= 2) return 3;
    return count % 2 === 1 ? count : count - 1;
};

const getTargetThreadAuthorUid = ({ roomData, currentUserId }) => {
    const players = getPlayers(roomData);
    const currentTurn = roomData.currentTurn || 1;
    const myIndex = players.findIndex((player) => player.uid === currentUserId);

    if (myIndex === -1) return null;

    const offset = currentTurn - 1;
    const targetThreadIndex = (myIndex - offset + players.length) % players.length;
    return players[targetThreadIndex]?.uid || null;
};

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
