import { serverTimestamp } from 'firebase/firestore';

export const TIER_LIST_CATEGORIES = [
    {
        key: 'survival',
        label: '🧟 Sobrevivência',
        description: 'Apocalipse, crises e instinto de sobrevivência.',
    },
    {
        key: 'reality',
        label: '📺 Reality Show',
        description: 'Quem dominaria (ou seria eliminado) num reality.',
    },
    {
        key: 'caos',
        label: '💥 Caos',
        description: 'Situações absurdas que revelam o verdadeiro caráter.',
    },
    {
        key: 'personalidade',
        label: '🎭 Personalidade',
        description: 'Traços marcantes e energia que cada um carrega.',
    },
];

export const DEFAULT_TIER_LIST_CATEGORY = 'survival';

const TIER_LIST_QUESTIONS = {
    survival: [
        'Quem sobreviveria mais tempo num apocalipse zumbi?',
        'Quem seria o melhor líder numa situação de crise?',
        'Quem sobreviveria mais tempo numa ilha deserta?',
        'Quem teria mais chances de escapar de um labirinto?',
        'Quem seria o mais útil durante um apocalipse?',
        'Quem manteria a calma durante um desastre natural?',
        'Quem resistiria mais tempo completamente sem internet?',
        'Quem encontraria comida e água primeiro numa floresta?',
        'Quem seria o mais perigoso numa guerra de sobrevivência?',
        'Quem seria o último a desistir numa missão impossível?',
    ],
    reality: [
        'Quem seria eliminado primeiro num reality show?',
        'Quem chegaria na final do BBB?',
        'Quem teria mais seguidores se virasse influencer amanhã?',
        'Quem protagonizaria o maior drama num reality?',
        'Quem ganharia MasterChef do grupo?',
        'Quem viraria meme num reality show?',
        'Quem faria mais alianças estratégicas num reality?',
        'Quem seria o favorito do público de um reality?',
        'Quem causaria mais polêmica sem querer?',
        'Quem duraria mais tempo no Big Brother?',
    ],
    caos: [
        'Quem gastaria todo o dinheiro em 24 horas?',
        'Quem causaria mais caos tentando ajudar?',
        'Quem convenceria o grupo a fazer uma ideia maluca?',
        'Quem tomaria a decisão mais arriscada sem pensar duas vezes?',
        'Quem faria uma compra absurda às 3 da manhã?',
        'Quem perderia o passaporte no aeroporto?',
        'Quem criaria uma startup maluca do nada?',
        'Quem esqueceria o celular no Uber?',
        'Quem se perderia numa cidade desconhecida?',
        'Quem arrumaria mais confusão involuntária numa festa?',
    ],
    personalidade: [
        'Quem tem mais energia de protagonista de filme?',
        'Quem tem mais cara de vilão carismático?',
        'Quem seria o melhor amigo numa crise?',
        'Quem teria a história de vida mais cinematográfica?',
        'Quem seria o mais popular numa festa de desconhecidos?',
        'Quem tem mais energia de líder silencioso?',
        'Quem daria o melhor conselho em 10 segundos?',
        'Quem viraria famoso por um motivo inesperado?',
        'Quem seria contratado numa entrevista de emprego radical?',
        'Quem teria o começo de história mais interessante?',
    ],
};

export const TIERS = [
    { key: 'S', label: 'S', description: 'Lendário', color: '#FF6B35', bg: 'rgba(255,107,53,0.18)', border: 'rgba(255,107,53,0.45)' },
    { key: 'A', label: 'A', description: 'Forte', color: '#FFD93D', bg: 'rgba(255,217,61,0.18)', border: 'rgba(255,217,61,0.45)' },
    { key: 'B', label: 'B', description: 'Sólido', color: '#6BCB77', bg: 'rgba(107,203,119,0.18)', border: 'rgba(107,203,119,0.45)' },
    { key: 'C', label: 'C', description: 'Ok', color: '#4D96FF', bg: 'rgba(77,150,255,0.18)', border: 'rgba(77,150,255,0.45)' },
    { key: 'F', label: 'F', description: 'Sem chance', color: '#C77DFF', bg: 'rgba(199,125,255,0.18)', border: 'rgba(199,125,255,0.45)' },
];

// Numeric weight per tier for averaging
const TIER_SCORE = { S: 5, A: 4, B: 3, C: 2, F: 1 };

// Points awarded based on consensus tier
const TIER_POINTS = { S: 4, A: 3, B: 2, C: 1, F: 0 };

// Numeric score → tier key (5→S, 4→A, 3→B, 2→C, 1→F)
const SCORE_TO_TIER = { 5: 'S', 4: 'A', 3: 'B', 2: 'C', 1: 'F' };

const shuffle = (items) => [...items].sort(() => 0.5 - Math.random());

export const buildTierListQuestionQueue = (count, category = DEFAULT_TIER_LIST_CATEGORY) => {
    const categoryKey = TIER_LIST_QUESTIONS[category] ? category : DEFAULT_TIER_LIST_CATEGORY;
    const questions = shuffle(TIER_LIST_QUESTIONS[categoryKey]);
    if (questions.length >= count) return questions.slice(0, count);
    const fallback = shuffle(Object.values(TIER_LIST_QUESTIONS).flat());
    return [...questions, ...fallback].slice(0, count);
};

export const createTierListRoundData = (question) => ({
    question: question || 'Quem ocupa o topo?',
    startTime: serverTimestamp(),
    answers: {},
    results: null,
});

export const buildTierListGameStart = ({ totalRounds, category }) => {
    const questions = buildTierListQuestionQueue(totalRounds, category);
    return {
        status: 'playing',
        currentRound: 1,
        questionsQueue: questions,
        roundData: createTierListRoundData(questions[0]),
    };
};

export const buildNextTierListRound = (roomData, nextRoundNum) => {
    const nextQuestion = roomData.questionsQueue?.[nextRoundNum - 1] || 'Quem se destaca mais?';
    return {
        status: 'playing',
        currentRound: nextRoundNum,
        roundData: createTierListRoundData(nextQuestion),
    };
};

// answers = { [voterUid]: { [targetUid]: 'S'|'A'|'B'|'C'|'F' } }
export const calculateTierListRoundOutcome = (currentGameState = {}) => {
    const roundData = currentGameState.roundData || {};
    const players = [...(currentGameState.players || [])];
    const answers = roundData.answers || {};
    const playerMap = Object.fromEntries(players.map((p) => [p.uid, p]));
    const validPlayerIds = new Set(players.map((p) => p.uid));
    const normalizedAnswers = {};

    // Collect tier votes per player
    const tierVotes = {};
    players.forEach((p) => {
        tierVotes[p.uid] = { S: 0, A: 0, B: 0, C: 0, F: 0 };
    });

    Object.entries(answers).forEach(([voterUid, voterPlacements]) => {
        if (!validPlayerIds.has(voterUid)) return;
        if (!voterPlacements || typeof voterPlacements !== 'object') return;

        const sanitizedPlacements = {};
        Object.entries(voterPlacements).forEach(([targetUid, tier]) => {
            if (targetUid === voterUid) return;
            if (!validPlayerIds.has(targetUid)) return;
            if (TIER_SCORE[tier] === undefined) return;

            sanitizedPlacements[targetUid] = tier;
            tierVotes[targetUid][tier] = (tierVotes[targetUid][tier] || 0) + 1;
        });

        if (Object.keys(sanitizedPlacements).length > 0) {
            normalizedAnswers[voterUid] = sanitizedPlacements;
        }
    });

    // Calculate consensus tier via weighted average
    const playerResults = {};
    players.forEach((player) => {
        const votes = tierVotes[player.uid] || {};
        let totalScore = 0;
        let totalVotes = 0;
        Object.entries(votes).forEach(([tier, count]) => {
            totalScore += (TIER_SCORE[tier] || 0) * count;
            totalVotes += count;
        });

        const avgScore = totalVotes > 0 ? totalScore / totalVotes : 0;
        const roundedScore = totalVotes > 0 ? Math.min(5, Math.max(1, Math.round(avgScore))) : 3;
        const consensusTier = SCORE_TO_TIER[roundedScore] || 'B';

        playerResults[player.uid] = {
            uid: player.uid,
            name: playerMap[player.uid]?.name || 'Jogador',
            photoURL: playerMap[player.uid]?.photoURL || null,
            tier: consensusTier,
            avgScore,
            voteCount: totalVotes,
            voteBreakdown: votes,
        };
    });

    // Group players by tier for display
    const tierGroups = { S: [], A: [], B: [], C: [], F: [] };
    Object.values(playerResults).forEach((result) => {
        if (tierGroups[result.tier]) {
            tierGroups[result.tier].push(result);
        }
    });

    // Award points based on consensus tier
    const updatedPlayers = players.map((player) => {
        const result = playerResults[player.uid];
        const points = result?.voteCount > 0 ? (TIER_POINTS[result.tier] ?? 0) : 0;
        return { ...player, score: (player.score || 0) + points };
    });

    return {
        players: updatedPlayers,
        results: {
            playerResults,
            tierGroups,
            allAnswers: normalizedAnswers,
            tierPoints: TIER_POINTS,
        },
    };
};
