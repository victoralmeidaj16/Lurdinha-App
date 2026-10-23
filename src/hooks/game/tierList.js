import { serverTimestamp } from 'firebase/firestore';

// Cada pergunta é uma escala: todo jogador recebe uma nota de 1 (zero) a 5 (no talo).
const TIER_LIST_QUESTIONS = [
    'Nível de atraso: quanto demora de verdade depois do "tô chegando"?',
    'Grau de mão de vaca na hora de dividir a conta',
    'Nível de sumiço: só aparece quando precisa de favor',
    'Tamanho dos áudios: de "manda texto" a podcast de 8 minutos',
    'Confiabilidade com segredo: dá pra contar algo pra essa pessoa?',
    'Qualidade dos conselhos amorosos',
    'Transformação depois do segundo drink',
    'Nível "segunda-feira eu começo"',
    'Ego na foto: posta só a que ela saiu bem',
    'Nível de fofoca: sabe da vida de todo mundo',
    'Nível de drama por coisa pequena',
    'Grau de "dono da razão" numa discussão',
    'Nível de vácuo: visualiza e não responde',
    'Nível de stalker de ex',
    'Competitividade até em par ou ímpar',
    'Nível de "só mais um episódio" às 3 da manhã',
    'Poder de convencer o grupo a fazer besteira',
    'Gosto musical duvidoso no rolê',
    'Habilidade de flertar (na teoria e na prática)',
    'Nível de "eu avisei" depois que dá errado',
    'Frequência de cancelar o rolê em cima da hora',
    'Nível de paladar infantil',
    'Grau de rato de promoção: compra inútil só porque tava barato',
    'Nível de senso de direção (ou falta dele)',
    'Chance de virar meme no grupo',
    'Nível de crush escondido que todo mundo já sabe',
    'Talento para mentir com a cara mais lisa',
    'Nível de "manda o print" em toda fofoca',
    'Grau de pão-duro com comida: não divide nem batata frita',
    'Nível de "tô de dieta" com um lanche na mão',
    'Quanto vira outra pessoa quando tá apaixonado',
    'Nível de story de academia',
    'Grau de reclamação por minuto',
    'Nível de "não sou ciumento" sendo ciumento',
    'Quanto some quando começa a namorar',
    'Habilidade de fingir que entendeu a piada',
    'Nível de indireta no status',
    'Grau de "vou só passar lá rapidinho" e fica até fechar',
    'Nível de desastre na cozinha',
    'Quanto dá pra confiar no "tô quase pronto"',
    'Grau de sinceridade quando pergunta "ficou bom?"',
    'Nível de energia de vilão de novela',
    'Chance de pagar mico em público e nem ligar',
    'Nível de "é só uma fase" que já dura anos',
    'Quanto se acha engraçado vs. quanto é engraçado',
];

const DEFAULT_TIER_LIST_QUESTION = 'Nível de caos que essa pessoa traz pro rolê';

export const TIERS = [
    { key: '5', label: '5', description: 'No talo', color: '#FF6B35', bg: 'rgba(255,107,53,0.18)', border: 'rgba(255,107,53,0.45)' },
    { key: '4', label: '4', description: 'Muito', color: '#FFD93D', bg: 'rgba(255,217,61,0.18)', border: 'rgba(255,217,61,0.45)' },
    { key: '3', label: '3', description: 'Médio', color: '#6BCB77', bg: 'rgba(107,203,119,0.18)', border: 'rgba(107,203,119,0.45)' },
    { key: '2', label: '2', description: 'Pouco', color: '#4D96FF', bg: 'rgba(77,150,255,0.18)', border: 'rgba(77,150,255,0.45)' },
    { key: '1', label: '1', description: 'Zero', color: '#C77DFF', bg: 'rgba(199,125,255,0.18)', border: 'rgba(199,125,255,0.45)' },
];

// Numeric weight per tier for averaging
const TIER_SCORE = { 5: 5, 4: 4, 3: 3, 2: 2, 1: 1 };

// Points awarded based on consensus tier
const TIER_POINTS = { 5: 4, 4: 3, 3: 2, 2: 1, 1: 0 };

// Numeric score -> tier key.
const SCORE_TO_TIER = { 5: '5', 4: '4', 3: '3', 2: '2', 1: '1' };

const LEGACY_TIER_MAP = { S: '5', A: '4', B: '3', C: '2', F: '1' };

const normalizeTierKey = (tier) => {
    const key = String(tier || '').toUpperCase();
    return TIER_SCORE[key] !== undefined ? key : LEGACY_TIER_MAP[key];
};

const shuffle = (items) => [...items].sort(() => 0.5 - Math.random());

export const buildTierListQuestionQueue = (count) => shuffle(TIER_LIST_QUESTIONS).slice(0, count);

export const createTierListRoundData = (question) => ({
    question: question || DEFAULT_TIER_LIST_QUESTION,
    startTime: serverTimestamp(),
    answers: {},
    results: null,
});

export const buildTierListGameStart = ({ totalRounds }) => {
    const questions = buildTierListQuestionQueue(totalRounds);
    return {
        status: 'playing',
        currentRound: 1,
        questionsQueue: questions,
        roundData: createTierListRoundData(questions[0]),
    };
};

export const buildNextTierListRound = (roomData, nextRoundNum) => {
    const nextQuestion = roomData.questionsQueue?.[nextRoundNum - 1] || DEFAULT_TIER_LIST_QUESTION;
    return {
        status: 'playing',
        currentRound: nextRoundNum,
        roundData: createTierListRoundData(nextQuestion),
    };
};

// answers = { [voterUid]: { [targetUid]: '5'|'4'|'3'|'2'|'1' } }
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
        tierVotes[p.uid] = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    });

    Object.entries(answers).forEach(([voterUid, voterPlacements]) => {
        if (!validPlayerIds.has(voterUid)) return;
        if (!voterPlacements || typeof voterPlacements !== 'object') return;

        const sanitizedPlacements = {};
        Object.entries(voterPlacements).forEach(([targetUid, tier]) => {
            const normalizedTier = normalizeTierKey(tier);
            if (targetUid === voterUid) return;
            if (!validPlayerIds.has(targetUid)) return;
            if (TIER_SCORE[normalizedTier] === undefined) return;

            sanitizedPlacements[targetUid] = normalizedTier;
            tierVotes[targetUid][normalizedTier] = (tierVotes[targetUid][normalizedTier] || 0) + 1;
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
        const consensusTier = SCORE_TO_TIER[roundedScore] || '3';

        playerResults[player.uid] = {
            uid: player.uid,
            name: playerMap[player.uid]?.name || 'Jogador',
            photoURL: playerMap[player.uid]?.photoURL || null,
            tier: consensusTier,
            pointsAwarded: totalVotes > 0 ? (TIER_POINTS[consensusTier] ?? 0) : 0,
            avgScore,
            voteCount: totalVotes,
            voteBreakdown: votes,
        };
    });

    // Group players by tier for display
    const tierGroups = { 5: [], 4: [], 3: [], 2: [], 1: [] };
    Object.values(playerResults).forEach((result) => {
        if (tierGroups[result.tier]) {
            tierGroups[result.tier].push(result);
        }
    });

    // Award points based on consensus tier
    const updatedPlayers = players.map((player) => {
        const result = playerResults[player.uid];
        const points = result?.pointsAwarded || 0;
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
