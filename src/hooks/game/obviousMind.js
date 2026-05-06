import { serverTimestamp } from 'firebase/firestore';

const POINTS_FOR_MATCH = 2;
const TARGET_STUMP_BONUS = 3;

const OBVIOUS_MIND_QUESTIONS = [
    {
        text: 'Se {target} ganhasse R$ 500 agora, gastaria primeiro com quê?',
        options: ['Roupa', 'Comida', 'Viagem', 'Guardaria e fingiria que não ganhou'],
    },
    {
        text: 'Quando {target} está com fome, o que mais parece com ele(a)?',
        options: ['Fica em silêncio', 'Fica irritado(a)', 'Pede qualquer coisa', 'Vira chef do nada'],
    },
    {
        text: 'Num rolê cancelado em cima da hora, {target} provavelmente sentiria o quê?',
        options: ['Alívio', 'Raiva', 'FOMO', 'Já tinha esquecido'],
    },
    {
        text: 'Se {target} pudesse escolher uma recompensa agora, escolheria:',
        options: ['Dormir sem culpa', 'Comer algo bom', 'Comprar algo inútil', 'Sumir por 24 horas'],
    },
    {
        text: 'Qual plano {target} toparia mais rápido?',
        options: ['Cinema', 'Restaurante', 'Viagem curta', 'Ficar em casa'],
    },
    {
        text: 'Se {target} recebesse uma notícia boa, faria primeiro:',
        options: ['Contaria para alguém', 'Postaria indireta', 'Guardaria segredo', 'Mandaria áudio enorme'],
    },
    {
        text: 'Em uma discussão leve, {target} tende a:',
        options: ['Defender até o fim', 'Fazer piada', 'Sumir', 'Tentar apaziguar'],
    },
    {
        text: 'Se {target} tivesse uma tarde livre, provavelmente escolheria:',
        options: ['Resolver pendências', 'Maratonar algo', 'Encontrar alguém', 'Não fazer absolutamente nada'],
    },
    {
        text: 'Qual desses pequenos luxos mais combina com {target}?',
        options: ['Café caro', 'Delivery sem pensar', 'Roupa nova', 'Uber para evitar caminhada'],
    },
    {
        text: 'Se {target} fosse surpreendido(a) por uma festa, reagiria com:',
        options: ['Vergonha', 'Alegria total', 'Desconfiança', 'Vontade de fugir'],
    },
    {
        text: 'No grupo, {target} provavelmente é a pessoa que:',
        options: ['Manda meme', 'Organiza o plano', 'Responde atrasado', 'Observa tudo quieto(a)'],
    },
    {
        text: 'Se {target} pudesse apagar uma obrigação da semana, apagaria:',
        options: ['Trabalho/estudo', 'Arrumar casa', 'Responder mensagens', 'Ir ao mercado'],
    },
];

const shuffle = (items) => [...items].sort(() => 0.5 - Math.random());

const getPlayers = (roomData = {}) => roomData.players || [];

const buildTargetQueue = (players, totalRounds) => {
    const playerIds = players.map((player) => player.uid);
    if (!playerIds.length) return [];

    return Array.from({ length: totalRounds }, (_, index) => playerIds[index % playerIds.length]);
};

const buildQuestionQueue = (totalRounds) => {
    const shuffled = shuffle(OBVIOUS_MIND_QUESTIONS);
    const result = [];

    while (result.length < totalRounds) {
        result.push(...shuffle(shuffled));
    }

    return result.slice(0, totalRounds);
};

const formatQuestionForTarget = (question, targetName) => ({
    ...question,
    text: question.text.replace(/\{target\}/g, targetName || 'essa pessoa'),
});

export const createObviousMindRoundData = ({ question, targetId, targetName }) => ({
    targetId,
    targetName,
    question: formatQuestionForTarget(question, targetName),
    startTime: serverTimestamp(),
    answers: {},
    results: null,
});

export const buildObviousMindGameStart = ({ roomData, totalRounds }) => {
    const players = getPlayers(roomData);
    const targetQueue = buildTargetQueue(players, totalRounds);
    const questionQueue = buildQuestionQueue(totalRounds);
    const firstTargetId = targetQueue[0];
    const firstTarget = players.find((player) => player.uid === firstTargetId);

    return {
        status: 'playing',
        currentRound: 1,
        targetQueue,
        questionsQueue: questionQueue,
        roundData: createObviousMindRoundData({
            question: questionQueue[0],
            targetId: firstTargetId,
            targetName: firstTarget?.name || 'Alvo mental',
        }),
    };
};

export const buildNextObviousMindRound = (roomData, nextRoundNum) => {
    const players = getPlayers(roomData);
    const targetId = roomData.targetQueue?.[nextRoundNum - 1] || players[(nextRoundNum - 1) % Math.max(players.length, 1)]?.uid;
    const target = players.find((player) => player.uid === targetId);
    const question = roomData.questionsQueue?.[nextRoundNum - 1] || buildQuestionQueue(1)[0];

    return {
        status: 'playing',
        currentRound: nextRoundNum,
        roundData: createObviousMindRoundData({
            question,
            targetId,
            targetName: target?.name || 'Alvo mental',
        }),
    };
};

export const calculateObviousMindRoundOutcome = (currentGameState = {}) => {
    const roundData = currentGameState.roundData || {};
    const players = currentGameState.players || [];
    const answers = roundData.answers || {};
    const targetId = roundData.targetId;
    const targetAnswer = answers[targetId];

    const correctGuessers = Object.entries(answers)
        .filter(([uid, answer]) => uid !== targetId && answer === targetAnswer)
        .map(([uid]) => uid);

    const targetStumpedGroup = Boolean(targetAnswer) && correctGuessers.length === 0;

    const updatedPlayers = players.map((player) => {
        const wasCorrect = correctGuessers.includes(player.uid);
        const isTarget = player.uid === targetId;
        const previousStreaks = player.obviousMindTargetStreaks || {};
        const previousTargetStreak = previousStreaks[targetId] || 0;
        const nextTargetStreak = wasCorrect ? previousTargetStreak + 1 : 0;
        const earnedMindTwin = wasCorrect && nextTargetStreak >= 3;

        return {
            ...player,
            score: (player.score || 0) + (wasCorrect ? POINTS_FOR_MATCH : 0) + (isTarget && targetStumpedGroup ? TARGET_STUMP_BONUS : 0),
            obviousMindTargetStreaks: {
                ...previousStreaks,
                [targetId]: nextTargetStreak,
            },
            obviousMindBadges: {
                ...(player.obviousMindBadges || {}),
                menteGemea: Boolean(player.obviousMindBadges?.menteGemea || earnedMindTwin),
            },
        };
    });

    const answerCounts = Object.values(answers).reduce((accumulator, answer) => {
        if (!answer) return accumulator;
        accumulator[answer] = (accumulator[answer] || 0) + 1;
        return accumulator;
    }, {});

    return {
        players: updatedPlayers,
        results: {
            targetId,
            targetAnswer,
            correctGuessers,
            targetStumpedGroup,
            answerCounts,
            allAnswers: answers,
            pointsForMatch: POINTS_FOR_MATCH,
            targetStumpBonus: TARGET_STUMP_BONUS,
        },
    };
};
