import { getRandomWord } from '../../utils/impostorWords';

const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());

export const DEFAULT_IMPOSTOR_DISCUSSION_TIME = 90;
export const IMPOSTOR_VOTING_TIME = 30;

export const buildImpostorGameStart = ({ roomData, totalRounds }) => {
    const category = roomData.settings?.category || null;
    const players = roomData.players || [];
    const playerIds = shuffle(players.map(p => p.uid));

    const rounds = Array.from({ length: totalRounds }, (_, i) => {
        const wordData = getRandomWord(category);
        return {
            word: wordData.word,
            category: wordData.category,
            impostorId: playerIds[i % playerIds.length],
        };
    });

    return {
        status: 'playing',
        currentRound: 1,
        impostorRoundsQueue: rounds,
        roundData: buildImpostorRoundData(rounds[0]),
    };
};

export const buildNextImpostorRound = (roomData, nextRoundNum) => {
    const roundInfo = roomData.impostorRoundsQueue?.[nextRoundNum - 1];
    if (!roundInfo) {
        const wordData = getRandomWord(null);
        const playerIds = (roomData.players || []).map(p => p.uid);
        return {
            status: 'playing',
            currentRound: nextRoundNum,
            roundData: buildImpostorRoundData({
                word: wordData.word,
                category: wordData.category,
                impostorId: playerIds[nextRoundNum % playerIds.length] || roomData.hostId,
            }),
        };
    }

    return {
        status: 'playing',
        currentRound: nextRoundNum,
        roundData: buildImpostorRoundData(roundInfo),
    };
};

const buildImpostorRoundData = ({ word, category, impostorId }) => ({
    word,
    category,
    impostorId,
    phase: 'role_reveal',
    rolesRevealed: {},
    clues: [],
    votes: {},
    startTime: null,
    votingStartTime: null,
    results: null,
});

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
    const votes = roundData.votes || {};
    const impostorId = roundData.impostorId;

    const voteCounts = {};
    players.forEach(p => { voteCounts[p.uid] = 0; });
    Object.values(votes).forEach(targetUid => {
        if (!targetUid) return;
        voteCounts[targetUid] = (voteCounts[targetUid] || 0) + 1;
    });

    const maxVotes = Math.max(...Object.values(voteCounts), 0);
    const mostVotedIds = Object.keys(voteCounts).filter(
        uid => voteCounts[uid] === maxVotes && maxVotes > 0
    );
    // Impostor is caught only with clear majority (no tie)
    const impostorCaught = maxVotes > 0 && mostVotedIds.includes(impostorId) && mostVotedIds.length === 1;

    const voteDistribution = Object.entries(voteCounts)
        .map(([uid, count]) => ({
            uid,
            count,
            name: players.find(p => p.uid === uid)?.name || 'Jogador',
            photoURL: players.find(p => p.uid === uid)?.photoURL || null,
        }))
        .sort((a, b) => b.count - a.count);

    const allVillagers = players.filter(p => p.uid !== impostorId);
    const allVotedImpostor = allVillagers.length > 0
        && allVillagers.every(v => votes[v.uid] === impostorId);

    const updatedPlayers = players.map(player => {
        let points = 0;
        if (player.uid === impostorId) {
            if (!impostorCaught) points = 5;
        } else {
            if (votes[player.uid] === impostorId) {
                points = 3;
                if (allVotedImpostor) points += 1;
            }
        }
        return { ...player, score: (player.score || 0) + points };
    });

    return {
        players: updatedPlayers,
        results: {
            impostorCaught,
            impostorId,
            impostorName: players.find(p => p.uid === impostorId)?.name || 'Impostor',
            word: roundData.word,
            category: roundData.category,
            votes,
            voteCounts,
            voteDistribution,
            allVotedImpostor,
        },
    };
};
