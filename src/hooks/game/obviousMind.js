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
    {
        text: 'Se {target} abrisse o celular sem motivo, provavelmente iria primeiro em:',
        options: ['WhatsApp', 'Instagram/TikTok', 'Fotos antigas', 'App de comida'],
    },
    {
        text: 'Quando {target} recebe um convite em cima da hora, pensa primeiro:',
        options: ['Topo', 'Depende de quem vai', 'Preciso descansar', 'Vou inventar desculpa'],
    },
    {
        text: 'Se {target} tivesse que escolher um lanche agora, iria de:',
        options: ['Salgado', 'Doce', 'Algo saudável', 'O mais barato'],
    },
    {
        text: 'Qual frase mais parece uma reação de {target} diante de um problema?',
        options: ['Calma, dá pra resolver', 'Eu avisei', 'Vamos rir disso', 'Não é comigo'],
    },
    {
        text: 'Se {target} ganhasse uma folga inesperada, usaria para:',
        options: ['Dormir', 'Sair', 'Resolver pendências', 'Ficar no celular'],
    },
    {
        text: 'Em uma viagem, {target} seria mais provável de cuidar de:',
        options: ['Roteiro', 'Comida', 'Fotos', 'Nada, só aparecer'],
    },
    {
        text: 'Se {target} precisasse escolher uma música para o ambiente, escolheria:',
        options: ['Hit conhecido', 'Algo antigo', 'Música triste', 'Uma escolha caótica'],
    },
    {
        text: 'Quando {target} está quieto(a), provavelmente está:',
        options: ['Cansado(a)', 'Pensando demais', 'Julgando em silêncio', 'Só tranquilo(a)'],
    },
    {
        text: 'Se {target} pudesse pedir um favor ao grupo agora, pediria:',
        options: ['Carona', 'Conselho', 'Ajuda prática', 'Que escolham por ele(a)'],
    },
    {
        text: 'Qual tipo de mensagem {target} mais provavelmente mandaria?',
        options: ['Áudio longo', 'Figurinha', 'Texto seco', 'Print com contexto'],
    },
    {
        text: 'Se {target} tivesse que improvisar um plano, começaria por:',
        options: ['Chamar alguém', 'Pesquisar tudo', 'Ir sem pensar', 'Desistir e pedir comida'],
    },
    {
        text: 'O que mais convenceria {target} a sair de casa?',
        options: ['Comida boa', 'Pessoa específica', 'Lugar novo', 'Promessa de voltar cedo'],
    },
    {
        text: 'Se {target} fosse elogiado(a) do nada, reagiria com:',
        options: ['Vergonha', 'Piada', 'Agradeceria normal', 'Desconfiaria'],
    },
    {
        text: 'Qual desses papéis {target} assumiria naturalmente no grupo?',
        options: ['Organizador(a)', 'Conselheiro(a)', 'Comediante', 'Observador(a)'],
    },
    {
        text: 'Se {target} tivesse que escolher uma regra para o grupo, seria:',
        options: ['Sem atraso', 'Sem áudio longo', 'Sem cancelar em cima da hora', 'Sem escolher comida por 30 minutos'],
    },
    {
        text: 'Quando algo dá errado no rolê, {target} provavelmente:',
        options: ['Tenta resolver', 'Faz piada', 'Culpa o plano', 'Aceita o caos'],
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
    const targetAnswer = answers[targetId] ?? null;

    const correctGuessers = Object.entries(answers)
        .filter(([uid, answer]) => targetAnswer !== null && uid !== targetId && answer === targetAnswer)
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
