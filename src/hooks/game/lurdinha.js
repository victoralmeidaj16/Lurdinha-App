import { serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Temas Disponíveis ────────────────────────────────────────

export const LURDINHA_THEMES = [
    {
        key: 'geral',
        label: '🎲 Geral',
        description: 'Perguntas variadas para qualquer grupo.',
    },
    {
        key: 'polemica',
        label: '🔥 Polêmica',
        description: 'Opiniões quentes que dividem o grupo.',
    },
    {
        key: 'cultura_pop',
        label: '🎬 Cultura Pop',
        description: 'Filmes, séries, músicas e memes.',
    },
    {
        key: 'dia_a_dia',
        label: '☕ Dia a Dia',
        description: 'Comida, hábitos e rotina do cotidiano.',
    },
    {
        key: 'aleatorio',
        label: '🔀 Aleatório',
        description: 'Perguntas misturadas de todos os temas.',
    },
];

export const DEFAULT_LURDINHA_THEME = 'geral';

export const getLurdinhaThemeLabel = (themeKey) => {
    const found = LURDINHA_THEMES.find((t) => t.key === themeKey);
    return found?.label || '🎲 Geral';
};

// ─── Banco de Perguntas por Tema ──────────────────────────────

// Só perguntas que tendem a gerar respostas curtas e iguais (a comparação é exata).
const QUESTION_BANK = {
    geral: [
        'Qual superpoder seria o mais útil no dia a dia?',
        'Qual a melhor invenção da humanidade?',
        'Qual país você moraria se pudesse escolher qualquer um?',
        'Se pudesse viajar no tempo, iria pro passado ou futuro?',
        'Qual o melhor app que existe no celular?',
        'Se ganhasse na loteria, qual a primeira compra?',
        'Qual a melhor estação do ano?',
        'Qual a melhor rede social que já existiu?',
        'Qual objeto simples salva qualquer rolê?',
    ],
    polemica: [
        'Pizza com ou sem borda recheada?',
        'Colocar ketchup na pizza é aceitável?',
        'Quem é melhor: gatos ou cachorros?',
        'Comer arroz antes ou depois do feijão?',
        'Leite antes ou depois do cereal?',
        'Banho de manhã ou à noite?',
        'Biscoito ou bolacha?',
        'Panetone com ou sem frutas cristalizadas?',
        'Qual a idade certa para casar?',
        'Mandar áudio longo é falta de educação?',
        'Dormir com meia é normal?',
        'O melhor feriado do Brasil é qual?',
        'Dividir a conta ou cada um paga o seu?',
        'Responder "ok" em mensagem é grosseria?',
        'Deixar o celular no silencioso é errado?',
        'Usar chinelo na rua é aceitável?',
        'É melhor ser muito quente ou muito frio?',
        'Escova de dentes: dura ou macia?',
        'Assistir filme dublado ou legendado?',
        'Abacaxi na pizza: crime ou obra-prima?',
        'Tomar café sem açúcar é forçação de barra?',
        'Texto de bom dia no grupo: fofo ou irritante?',
        'É OK comer sobremesa antes do almoço?',
        'Pedir delivery ou cozinhar em casa?',
        'Ficar acordado até tarde ou acordar cedo?',
        'Usar roupa repetida na mesma semana: OK ou não?',
        'Fast food: qual a melhor rede?',
        'Natal ou Ano Novo: qual festa é melhor?',
        'Churrasco: carne mal passada ou bem passada?',
        'Chegar 10 minutos atrasado é normal ou falta de respeito?',
        'Pode cancelar rolê no dia sem uma boa explicação?',
        'Mensagem visualizada sem resposta é pior que não visualizar?',
        'Guardar lugar na fila para outra pessoa é aceitável?',
        'Pessoa que coloca música alta no ambiente manda bem ou força?',
        'Repetir prato em festa antes de todos comerem é feio?',
        'Quem dirige escolhe a música ou o grupo decide?',
        'Responder só com figurinha conta como resposta?',
        'É melhor planejar tudo ou resolver na hora?',
        'Pode mexer no celular durante filme com amigos?',
        'Sair sem se despedir é estratégia ou grosseria?',
        'Emprestar dinheiro para amigo é confiança ou problema futuro?',
        'Pode chegar em visita sem avisar?',
        'Fazer chamada de vídeo sem combinar antes é aceitável?',
        'Melhor dia para churrasco: sábado ou domingo?',
        'Praia ou campo?',
        'Banho quente ou gelado?',
        'Feriado prolongado: viajar ou ficar em casa?',
    ],
    cultura_pop: [
        'Se a sua vida fosse um filme, qual gênero seria?',
        'Qual super-herói ganharia numa luta geral?',
        'Qual o melhor vilão do cinema?',
        'Se participasse de um reality show, qual seria?',
        'Se montasse uma banda, qual instrumento tocaria?',
        'Qual app de streaming é o melhor?',
        'Qual o melhor livro que virou filme?',
        'Qual o esporte mais divertido de assistir?',
        'Qual reality show revelaria melhor o caráter de alguém?',
        'Qual vilão tinha um ponto válido?',
    ],
    dia_a_dia: [
        'Qual a melhor comida para um dia chuvoso?',
        'O que não pode faltar na geladeira?',
        'Qual a pior tarefa doméstica?',
        'O melhor sabor de pizza?',
        'Qual o lanche perfeito da tarde?',
        'Qual a melhor comida de festa junina?',
        'Qual a melhor comida de rua?',
        'Café preto, com leite ou cappuccino?',
        'O que te faz perder mais tempo no celular?',
        'Qual o melhor dia da semana?',
        'Qual a melhor comida de boteco?',
        'Qual a melhor sobremesa que existe?',
        'Qual a coisa mais importante na mala de viagem?',
        'Qual o melhor sabor de sorvete?',
        'O que você faz primeiro ao acordar?',
        'Qual o melhor tipo de massa?',
        'Qual bebida combina com churrasco?',
        'Qual o lugar ideal para um primeiro encontro?',
        'O que você mais gasta dinheiro sem perceber?',
        'Qual a melhor comida para ressaca?',
        'Qual item sempre some dentro de casa?',
        'Qual comida salva quando ninguém quer decidir?',
        'Qual lugar da casa acumula bagunça mais rápido?',
        'Qual comida não pode faltar numa festa de aniversário?',
        'Coxinha ou pastel?',
        'Pão francês: com manteiga ou com requeijão?',
        'Melhor refrigerante: Coca ou Guaraná?',
        'Qual a melhor fruta para o verão?',
        'Qual o melhor sabor de pastel?',
    ],
};

// ─── Cache de Perguntas Recentes ──────────────────────────────

const CACHE_KEY = '@lurdinha_questions_cache';
const MAX_CACHED_PER_THEME = 20;

let _cache = {};      // { theme: [questionText, ...] }
let _cacheLoaded = false;

async function _loadCache() {
    if (_cacheLoaded) return;
    try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) {
            _cache = JSON.parse(raw);
        }
    } catch (e) {
        console.warn('[lurdinha] cache load failed:', e);
    }
    _cacheLoaded = true;
}

function _saveCacheAsync() {
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(_cache)).catch((e) => {
        console.warn('[lurdinha] cache save failed:', e);
    });
}

// Hydrate cache eagerly on module load
_loadCache();

// ─── Construtor de Fila de Perguntas ──────────────────────────

const pickQuestionQueue = (count, theme = DEFAULT_LURDINHA_THEME) => {
    if (theme === 'aleatorio' || theme === 'random') {
        const allQuestions = Object.values(QUESTION_BANK).flat();
        const themeKey = 'aleatorio';
        if (!_cache[themeKey]) _cache[themeKey] = [];
        const recentlyUsed = new Set(_cache[themeKey]);
        const unused = allQuestions.filter((q) => !recentlyUsed.has(q));

        if (unused.length < count) {
            _cache[themeKey] = [];
            const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, count);
            _cache[themeKey] = selected.slice(0, MAX_CACHED_PER_THEME);
            _saveCacheAsync();
            return selected;
        }

        const shuffledUnused = [...unused].sort(() => 0.5 - Math.random());
        const selected = shuffledUnused.slice(0, count);
        const updatedCache = [...(_cache[themeKey] || []), ...selected];
        _cache[themeKey] = updatedCache.slice(-MAX_CACHED_PER_THEME);
        _saveCacheAsync();
        return selected;
    }
    const themeKey = QUESTION_BANK[theme] ? theme : DEFAULT_LURDINHA_THEME;
    const allQuestions = QUESTION_BANK[themeKey];
    const recentlyUsed = new Set(_cache[themeKey] || []);

    // Separate unused from recently used
    const unused = allQuestions.filter((q) => !recentlyUsed.has(q));

    // If not enough unused, reset cache for this theme
    if (unused.length < count) {
        _cache[themeKey] = [];
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);
        _cache[themeKey] = selected.slice(0, MAX_CACHED_PER_THEME);
        _saveCacheAsync();
        return selected;
    }

    // Prioritize unused questions
    const shuffledUnused = [...unused].sort(() => 0.5 - Math.random());
    const selected = shuffledUnused.slice(0, count);

    // Update cache with the newly used questions
    const updatedCache = [...(_cache[themeKey] || []), ...selected];
    _cache[themeKey] = updatedCache.slice(-MAX_CACHED_PER_THEME);
    _saveCacheAsync();

    return selected;
};

// Temas pequenos não bastam para partidas longas (até 20 rodadas): completa
// com perguntas dos outros temas para nunca cair em "Pergunta Extra".
const fillFromOtherThemes = (selected, count, themeKey) => {
    if (selected.length >= count) return selected;
    const others = Object.entries(QUESTION_BANK)
        .filter(([key]) => key !== themeKey)
        .flatMap(([, questions]) => questions)
        .filter((q) => !selected.includes(q))
        .sort(() => 0.5 - Math.random());
    return [...selected, ...others].slice(0, count);
};

export const buildQuestionQueue = (count, theme = DEFAULT_LURDINHA_THEME) => {
    const themeKey = QUESTION_BANK[theme] ? theme : DEFAULT_LURDINHA_THEME;
    return fillFromOtherThemes(pickQuestionQueue(count, theme), count, themeKey);
};

// ─── Round Builders ───────────────────────────────────────────

export const createLurdinhaRoundData = (question = 'Pergunta Extra') => ({
    question,
    startTime: serverTimestamp(),
    answers: {},
    results: null,
});

export const buildLurdinhaGameStart = ({ totalRounds, theme }) => {
    const questions = buildQuestionQueue(totalRounds, theme);
    return {
        status: 'playing',
        currentRound: 1,
        questionsQueue: questions,
        roundData: createLurdinhaRoundData(questions[0]),
    };
};

export const buildNextLurdinhaRound = (roomData, nextRoundNum) => {
    const nextQuestion = roomData.questionsQueue?.[nextRoundNum - 1] || 'Pergunta Extra';
    return {
        status: 'playing',
        currentRound: nextRoundNum,
        roundData: createLurdinhaRoundData(nextQuestion),
    };
};

// ─── Round Outcome ────────────────────────────────────────────

export const calculateLurdinhaRoundOutcome = (currentGameState = {}) => {
    const roundData = currentGameState.roundData || {};
    const players = [...(currentGameState.players || [])];
    const answers = roundData.answers || {};
    const normalizedAnswers = {};
    const counts = {};

    Object.entries(answers).forEach(([uid, answer]) => {
        const normalized = answer.toString().trim().toLowerCase();
        normalizedAnswers[uid] = normalized;
        counts[normalized] = (counts[normalized] || 0) + 1;
    });

    let maxCount = 0;
    Object.values(counts).forEach((count) => {
        if (count > maxCount) maxCount = count;
    });

    let majorityAnswers = Object.keys(counts).filter((answer) => counts[answer] === maxCount);

    if (majorityAnswers.length > 1) {
        majorityAnswers = ['empate'];
    }

    const lurdinhaVictims = [];

    players.forEach((player) => {
        const playerAnswer = normalizedAnswers[player.uid];
        const isSafe = playerAnswer && majorityAnswers.includes(playerAnswer);

        if (!isSafe) {
            lurdinhaVictims.push(player.uid);
            player.score = (player.score || 0) + 1;
        }
    });

    return {
        players,
        results: {
            majorityAnswers,
            lurdinhaVictims,
            allAnswers: answers,
        },
    };
};
