import { serverTimestamp } from 'firebase/firestore';

export const MOST_LIKELY_CATEGORIES = [
    {
        key: 'realista',
        label: '🔥 Realista',
        description: 'Hábitos reais, fáceis de votar e com consenso rápido.',
    },
    {
        key: 'humor',
        label: '😂 Humor',
        description: 'Exagero leve para risada imediata.',
    },
    {
        key: 'exposicao',
        label: '👀 Exposição',
        description: 'Percepção social com tensão leve.',
    },
    {
        key: 'futuro',
        label: '🧠 Futuro',
        description: 'Projeções que viram conversa fora do jogo.',
    },
    {
        key: 'caos',
        label: '💥 Caos',
        description: 'Situações absurdas, mas ainda jogáveis.',
    },
    {
        key: 'aleatorio',
        label: '🔀 Aleatório',
        description: 'Perguntas misturadas de todas as categorias.',
    },
];

export const DEFAULT_MOST_LIKELY_CATEGORY = 'realista';

const MOST_LIKELY_QUESTIONS = {
    realista: [
        'Quem esqueceria o aniversário de alguém do grupo?',
        'Quem responderia mensagem só depois de 2 dias?',
        'Quem chegaria atrasado num encontro importante?',
        'Quem sumiria no meio da conversa e voltaria como se nada tivesse acontecido?',
        'Quem perderia o celular dentro da própria casa?',
        'Quem prometeria chegar cedo e apareceria por último?',
        'Quem esqueceria o que ia falar no meio da frase?',
        'Quem deixaria todo mundo esperando para escolher comida?',
        'Quem mandaria áudio enorme para explicar algo simples?',
        'Quem diria “já estou chegando” ainda em casa?',
        'Quem toparia um plano e depois perguntaria todos os detalhes?',
        'Quem perderia a chave e culparia o universo?',
        'Quem esqueceria de carregar o celular antes de sair?',
        'Quem pediria para alguém repetir e ainda assim não entenderia?',
        'Quem marcaria compromisso no dia errado?',
        'Quem demoraria mais para escolher uma foto para postar?',
        'Quem chegaria com fome mesmo dizendo que já comeu?',
        'Quem ficaria responsável por reservar lugar e esqueceria?',
        'Quem sempre teria um carregador emprestado de alguém?',
        'Quem transformaria uma tarefa simples em missão complexa?',
        'Quem é completamente incapaz de assistir a um filme sem pegar o celular a cada cinco minutos para olhar o Instagram?',
        'Quem quebra a tela do celular, perde a chave ou esquece o cartão com tanta frequência que já deveria viver embrulhado em plástico bolha?',
    ],
    humor: [
        'Quem sobreviveria com miojo por 1 mês?',
        'Quem faria amizade com o garçom?',
        'Quem riria numa situação totalmente inadequada?',
        'Quem faria uma piada ruim em um momento sério?',
        'Quem viraria meme do grupo sem querer?',
        'Quem tentaria dancear sério e faria todo mundo rir?',
        'Quem narraria a própria vida como se fosse reality?',
        'Quem pediria sobremesa antes do prato principal?',
        'Quem inventaria uma desculpa absurda e sustentaria até o fim?',
        'Quem perderia uma discussão para uma criança?',
        'Quem tentaria parecer sério e riria primeiro?',
        'Quem faria pose para uma foto que ninguém pediu?',
        'Quem confundiria uma pessoa famosa com alguém aleatório?',
        'Quem criaria uma teoria absurda e convenceria metade do grupo?',
        'Quem faria amizade com alguém na fila do banheiro?',
        'Quem levaria um objeto inútil para uma viagem?',
        'Quem mandaria o meme errado no grupo errado?',
        'Quem tentaria cozinhar uma receita fácil e criaria fumaça?',
        'Quem faria discurso depois de uma vitória pequena?',
        'Quem colocaria apelido em todo mundo sem perceber?',
        'Quem dirige de um jeito tão assustador que toda vez que você entra no carro da pessoa faz o sinal da cruz em segredo?',
        'Quem trata o pet de um jeito tão humanizado que seria capaz de romper a amizade se você não der “bom dia” para o cachorro ou gato dela?',
        'Quem mais manipula as regras, rouba descaradamente ou faz alianças sujas jogando Catan, Uno ou qualquer jogo de tabuleiro?',
    ],
    exposicao: [
        'Quem é mais provável de dar ghosting?',
        'Quem sumiria do grupo sem avisar?',
        'Quem finge que entendeu mas não entendeu nada?',
        'Quem stalkeia e depois finge surpresa?',
        'Quem demora para responder mas está online?',
        'Quem mudaria de opinião só para evitar conflito?',
        'Quem contaria um segredo sem perceber que era segredo?',
        'Quem faria drama por uma coisa pequena?',
        'Quem diria “tanto faz” mas claramente se importa?',
        'Quem esqueceria de convidar alguém sem maldade?',
        'Quem muda de humor e tenta fingir que está normal?',
        'Quem promete não julgar, mas julga com a cara?',
        'Quem lê a mensagem e espera a hora perfeita para responder?',
        'Quem evita conflito até o conflito virar maior?',
        'Quem faz pergunta só para confirmar o que já sabe?',
        'Quem percebe climão antes de todo mundo?',
        'Quem se arrepende de falar algo 2 segundos depois?',
        'Quem dá conselho bom, mas não segue nenhum?',
        'Quem tenta ser discreto e chama mais atenção?',
        'Quem fala “deixa pra lá” querendo que alguém insista?',
        'Quem paga de atleta fit (foto no beach tennis ou na academia), mas na vida real perde o fôlego subindo um lance de escadas?',
        'Quem posta foto “cult” lendo livro e tomando café, mas a gente sabe que passa 6 horas por dia com a mente derretendo no TikTok?',
        'Quem sempre balança a cabeça concordando com a sua história, mas não ouviu uma palavra porque estava viajando em outra dimensão?',
    ],
    futuro: [
        'Quem vai ficar rico primeiro?',
        'Quem vai casar primeiro?',
        'Quem vai mudar de país do nada?',
        'Quem abriria um negócio completamente aleatório?',
        'Quem viraria famoso por um motivo inesperado?',
        'Quem compraria uma casa antes de todo mundo?',
        'Quem teria a história mais absurda para contar daqui a 10 anos?',
        'Quem largaria tudo para viver na praia?',
        'Quem teria mais chance de escrever um livro?',
        'Quem seria o primeiro a aparecer numa reportagem?',
        'Quem vai virar referência em algo inesperado?',
        'Quem vai morar sozinho primeiro e virar especialista em mercado?',
        'Quem vai inventar uma tradição nova no grupo?',
        'Quem vai mudar totalmente de estilo nos próximos anos?',
        'Quem vai ter a casa mais disputada para encontros?',
        'Quem vai ser lembrado por uma frase específica?',
        'Quem vai transformar um hobby em trabalho?',
        'Quem vai aparecer com uma novidade gigante sem avisar antes?',
        'Quem vai ser a pessoa que junta todo mundo daqui a 10 anos?',
        'Quem vai ter a história mais improvável de sucesso?',
    ],
    caos: [
        'Quem sobreviveria mais tempo em um reality?',
        'Quem venderia tudo e sumiria do nada?',
        'Quem criaria uma startup maluca?',
        'Quem arrumaria confusão tentando ajudar?',
        'Quem seria expulso de um grupo por mandar meme demais?',
        'Quem tentaria resolver um problema e criaria três novos?',
        'Quem lideraria uma fuga sem saber o caminho?',
        'Quem faria uma compra absurda às 3 da manhã?',
        'Quem convenceria todo mundo a fazer uma ideia ruim?',
        'Quem sobreviveria melhor a um dia totalmente sem internet?',
        'Quem apertaria um botão misterioso só para ver o que acontece?',
        'Quem entraria numa confusão tentando defender alguém?',
        'Quem transformaria uma ida ao mercado em aventura?',
        'Quem sumiria por 20 minutos e voltaria com uma história inacreditável?',
        'Quem aceitaria um desafio sem ouvir as regras?',
        'Quem faria um plano B pior que o plano A?',
        'Quem levaria o grupo para o lugar errado com confiança?',
        'Quem criaria uma competição do nada?',
        'Quem seria responsável por uma decisão caótica que dá certo?',
        'Quem começaria uma frase com “confia” e preocuparia todo mundo?',
    ],
};

const shuffle = (items) => [...items].sort(() => 0.5 - Math.random());

export const buildMostLikelyQuestionQueue = (count, category = DEFAULT_MOST_LIKELY_CATEGORY) => {
    if (category === 'aleatorio' || category === 'random') {
        const allQuestions = shuffle(Object.values(MOST_LIKELY_QUESTIONS).flat());
        return allQuestions.slice(0, count);
    }
    const categoryKey = MOST_LIKELY_QUESTIONS[category] ? category : DEFAULT_MOST_LIKELY_CATEGORY;
    const questions = shuffle(MOST_LIKELY_QUESTIONS[categoryKey]);

    if (questions.length >= count) return questions.slice(0, count);

    const fallback = shuffle(Object.values(MOST_LIKELY_QUESTIONS).flat());
    return [...questions, ...fallback].slice(0, count);
};

export const createMostLikelyRoundData = (question = 'Quem é mais provável?') => ({
    question,
    startTime: serverTimestamp(),
    answers: {},
    results: null,
});

export const buildMostLikelyGameStart = ({ totalRounds, category }) => {
    const questions = buildMostLikelyQuestionQueue(totalRounds, category);
    return {
        status: 'playing',
        currentRound: 1,
        questionsQueue: questions,
        roundData: createMostLikelyRoundData(questions[0]),
    };
};

export const buildNextMostLikelyRound = (roomData, nextRoundNum) => {
    const nextQuestion = roomData.questionsQueue?.[nextRoundNum - 1] || 'Quem é mais provável?';
    return {
        status: 'playing',
        currentRound: nextRoundNum,
        roundData: createMostLikelyRoundData(nextQuestion),
    };
};

export const calculateMostLikelyRoundOutcome = (currentGameState = {}) => {
    const roundData = currentGameState.roundData || {};
    const players = [...(currentGameState.players || [])];
    const answers = roundData.answers || {};
    const voteCounts = {};

    Object.values(answers).forEach((targetUid) => {
        if (!targetUid) return;
        voteCounts[targetUid] = (voteCounts[targetUid] || 0) + 1;
    });

    const maxVotes = Math.max(...Object.values(voteCounts), 0);
    const winnerIds = Object.keys(voteCounts).filter((uid) => voteCounts[uid] === maxVotes && maxVotes > 0);
    const votersOnWinners = Object.entries(answers)
        .filter(([, targetUid]) => winnerIds.includes(targetUid))
        .map(([voterUid]) => voterUid);

    const playerMap = Object.fromEntries(players.map((player) => [player.uid, player]));
    const ranking = Object.entries(voteCounts)
        .map(([uid, votes]) => ({
            uid,
            votes,
            name: playerMap[uid]?.name || 'Jogador',
            photoURL: playerMap[uid]?.photoURL || null,
        }))
        .sort((first, second) => second.votes - first.votes || first.name.localeCompare(second.name));

    const updatedPlayers = players.map((player) => {
        const votedWinner = votersOnWinners.includes(player.uid);
        return {
            ...player,
            score: (player.score || 0) + (votedWinner ? 2 : 0),
        };
    });

    return {
        players: updatedPlayers,
        results: {
            voteCounts,
            ranking,
            winnerIds,
            votersOnWinners,
            allAnswers: answers,
            pointsForWinnerVote: 2,
        },
    };
};
