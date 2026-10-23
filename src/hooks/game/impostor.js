import { getRandomWord } from '../../utils/impostorWords';

const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());

export const DEFAULT_IMPOSTOR_DISCUSSION_TIME = 90;
export const IMPOSTOR_VOTING_TIME = 30;

export const IMPOSTOR_MIN_PLAYERS = 3;
// Tempo para todos verem o papel; depois disso o host começa a discussão mesmo assim.
export const IMPOSTOR_REVEAL_TIME = 45;

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// A fila guarda só as palavras. O impostor é sorteado a cada rodada entre quem
// está na sala, para ninguém deduzir por eliminação e ninguém que saiu ser escolhido.
export const buildImpostorGameStart = ({ roomData, totalRounds }) => {
    const category = roomData.settings?.category || null;
    const players = roomData.players || [];

    const rounds = Array.from({ length: totalRounds }, () => {
        const wordData = getRandomWord(category);
        return { word: wordData.word, category: wordData.category };
    });

    return {
        status: 'playing',
        currentRound: 1,
        impostorRoundsQueue: rounds,
        roundData: buildImpostorRoundData(rounds[0], players),
    };
};

export const buildNextImpostorRound = (roomData, nextRoundNum) => {
    const roundInfo = roomData.impostorRoundsQueue?.[nextRoundNum - 1]
        || getRandomWord(roomData.settings?.category || null);

    return {
        status: 'playing',
        currentRound: nextRoundNum,
        roundData: buildImpostorRoundData(roundInfo, roomData.players || []),
    };
};

const buildImpostorRoundData = ({ word, category }, players = []) => ({
    word,
    category,
    impostorId: pickRandom(players.map(player => player.uid)) || null,
    phase: 'role_reveal',
    rolesRevealed: {},
    answerOrder: shuffle(players.map(player => player.uid)),
    currentAnswerTurnIndex: 0,
    clues: [],
    reactions: [],
    votes: {},
    startTime: null,
    votingStartTime: null,
    results: null,
});

// Só valem votos de quem ainda está na sala e em alguém que ainda está na sala.
export const getPresentImpostorVotes = (roundData = {}, players = []) => {
    const presentIds = new Set(players.map(player => player.uid));
    return Object.fromEntries(
        Object.entries(roundData.votes || {})
            .filter(([voterUid, targetUid]) => presentIds.has(voterUid) && presentIds.has(targetUid)),
    );
};

// A rodada não tem como continuar se o impostor saiu ou se sobraram poucos jogadores.
export const getImpostorEarlyEndReason = (roundData = {}, players = []) => {
    if (!players.some(player => player.uid === roundData.impostorId)) return 'impostor_left';
    if (players.length < IMPOSTOR_MIN_PLAYERS) return 'not_enough_players';
    return null;
};

// Tempo máximo de cada vez na discussão; depois disso o host pula o jogador.
export const IMPOSTOR_TURN_TIME = 60;
export const IMPOSTOR_SKIP_TEXT = 'Passou a vez';

export const getImpostorAnswerOrder = (roomData) => (
    roomData.roundData?.answerOrder?.length
        ? roomData.roundData.answerOrder
        : (roomData.players || []).map((player) => player.uid)
);

// Registra a dica (ou o "passou a vez") e avança para o próximo jogador que ainda
// está na sala e não respondeu. Vai para a votação quando todos os presentes responderam.
export const buildImpostorClueUpdate = ({ roomData, clue, startTimeFactory }) => {
    const players = roomData.players || [];
    const presentIds = new Set(players.map((player) => player.uid));
    const answerOrder = getImpostorAnswerOrder(roomData);
    const currentIndex = roomData.roundData?.currentAnswerTurnIndex || 0;
    const nextClues = [...(roomData.roundData?.clues || []), clue];
    const answeredIds = new Set(nextClues.map((item) => item.uid));

    let nextIndex = currentIndex + 1;
    while (
        nextIndex < answerOrder.length
        && (!presentIds.has(answerOrder[nextIndex]) || answeredIds.has(answerOrder[nextIndex]))
    ) {
        nextIndex += 1;
    }

    const patch = {
        'roundData.clues': nextClues,
        'roundData.currentAnswerTurnIndex': Math.min(nextIndex, Math.max(answerOrder.length - 1, 0)),
    };

    const everyoneAnswered = players.length > 0 && players.every((player) => answeredIds.has(player.uid));
    if (everyoneAnswered) {
        patch['roundData.phase'] = 'voting';
        patch['roundData.votingStartTime'] = startTimeFactory();
    }

    return patch;
};

export const buildAdvanceImpostorToDiscussion = ({ startTimeFactory }) => ({
    'roundData.phase': 'discussion',
    'roundData.startTime': startTimeFactory(),
});

export const buildAdvanceImpostorToVoting = ({ startTimeFactory }) => ({
    'roundData.phase': 'voting',
    'roundData.votingStartTime': startTimeFactory(),
});

export const calculateImpostorRoundOutcome = (currentGameState) => {
    const roundData = currentGameState.roundData || {};
    const players = [...(currentGameState.players || [])];
    const votes = getPresentImpostorVotes(roundData, players);
    const impostorId = roundData.impostorId;
    const endedEarly = getImpostorEarlyEndReason(roundData, players);

    const voteCounts = {};
    players.forEach(p => { voteCounts[p.uid] = 0; });
    Object.values(votes).forEach(targetUid => {
        voteCounts[targetUid] += 1;
    });

    const maxVotes = Math.max(...Object.values(voteCounts), 0);
    const mostVotedIds = Object.keys(voteCounts).filter(
        uid => voteCounts[uid] === maxVotes && maxVotes > 0
    );
    // Impostor is caught only with clear majority (no tie)
    const impostorCaught = !endedEarly
        && maxVotes > 0 && mostVotedIds.includes(impostorId) && mostVotedIds.length === 1;

    const voteDistribution = Object.entries(voteCounts)
        .map(([uid, count]) => ({
            uid,
            count,
            name: players.find(p => p.uid === uid)?.name || 'Jogador',
            photoURL: players.find(p => p.uid === uid)?.photoURL || null,
        }))
        .sort((a, b) => b.count - a.count);

    const allVillagers = players.filter(p => p.uid !== impostorId);
    const allVotedImpostor = !endedEarly
        && allVillagers.length > 0
        && allVillagers.every(v => votes[v.uid] === impostorId);

    // Rodada encerrada antes da hora não vale pontos para ninguém.
    const pointsAwarded = {};
    players.forEach(player => {
        let points = 0;
        if (!endedEarly) {
            if (player.uid === impostorId) {
                if (!impostorCaught) points = 5;
            } else if (votes[player.uid] === impostorId) {
                points = allVotedImpostor ? 4 : 3;
            }
        }
        pointsAwarded[player.uid] = points;
    });

    const updatedPlayers = players.map(player => ({
        ...player,
        score: (player.score || 0) + pointsAwarded[player.uid],
    }));

    // Se o impostor saiu, o nome e a foto vêm da dica que ele deixou.
    const impostorPlayer = players.find(p => p.uid === impostorId)
        || (roundData.clues || []).find(clue => clue.uid === impostorId);

    return {
        players: updatedPlayers,
        results: {
            impostorCaught,
            impostorId,
            impostorName: impostorPlayer?.name || 'Impostor',
            impostorPhotoURL: impostorPlayer?.photoURL || null,
            endedEarly,
            word: roundData.word,
            category: roundData.category,
            votes,
            voteCounts,
            voteDistribution,
            allVotedImpostor,
            pointsAwarded,
        },
    };
};
