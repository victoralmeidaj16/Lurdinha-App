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
];

export const DEFAULT_LURDINHA_THEME = 'geral';

export const getLurdinhaThemeLabel = (themeKey) => {
    const found = LURDINHA_THEMES.find((t) => t.key === themeKey);
    return found?.label || '🎲 Geral';
};

// ─── Banco de Perguntas por Tema ──────────────────────────────

const QUESTION_BANK = {
    geral: [
        'Qual superpoder seria o mais útil no dia a dia?',
        'Um animal que seria o melhor presidente do Brasil?',
        'Qual o pior presente de amigo secreto?',
        'O que você faria se achasse uma mala com 1 milhão na rua?',
        'Qual a melhor invenção da humanidade?',
        'Se pudesse jantar com qualquer pessoa, viva ou morta, quem seria?',
        'Qual habilidade você gostaria de dominar da noite pro dia?',
        'Se o mundo acabasse amanhã, o que você faria hoje?',
        'Qual o trabalho dos sonhos?',
        'O que todo mundo deveria experimentar pelo menos uma vez?',
        'Se você fosse invisível por um dia, o que faria?',
        'Qual a melhor década para se viver?',
        'Qual país você moraria se pudesse escolher qualquer um?',
        'Se pudesse mudar uma regra do mundo, qual seria?',
        'Qual a coisa mais inútil que você sabe fazer?',
        'Qual a pior mentira que já contaram pra você?',
        'Se pudesse falar com um animal, qual escolheria?',
        'Qual a melhor idade da vida?',
        'Se pudesse viajar no tempo, iria pro passado ou futuro?',
        'Qual o melhor app que existe no celular?',
        'Qual conselho você daria para si mesmo com 15 anos?',
        'Se ganhasse na loteria, qual a primeira compra?',
        'Qual o talento mais estranho que você tem?',
        'Qual a pior moda que já existiu?',
        'Se pudesse morar em qualquer filme ou série, qual seria?',
        'Qual a melhor estação do ano?',
        'Qual a melhor hora do dia?',
        'O que te deixa mais irritado no trânsito?',
        'Qual o cheiro que te traz boas memórias?',
        'Qual a melhor rede social que já existiu?',
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
        'Quem lava a louça: quem cozinhou ou quem comeu?',
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
    ],
    cultura_pop: [
        'Qual o melhor filme de todos os tempos?',
        'Qual a melhor série da Netflix?',
        'Se a sua vida fosse um filme, qual gênero seria?',
        'Qual personagem de série você seria?',
        'Qual a melhor música para cantar no karaokê?',
        'Qual o artista brasileiro mais importante?',
        'Qual o melhor jogo de videogame de todos os tempos?',
        'Qual super-herói ganharia numa luta geral?',
        'Qual o filme mais superestimado?',
        'Qual o melhor vilão do cinema?',
        'Qual a melhor dupla da música brasileira?',
        'Se participasse de um reality show, qual seria?',
        'Qual série todo mundo deveria assistir?',
        'Qual o meme mais icônico do Brasil?',
        'Qual o melhor programa de TV da sua infância?',
        'Se montasse uma banda, qual instrumento tocaria?',
        'Qual o melhor álbum de todos os tempos?',
        'Qual a franquia de filme mais cansativa?',
        'Qual youtuber seria um bom presidente?',
        'Qual a trilha sonora de filme mais épica?',
        'Se vivesse em um universo de anime, qual seria?',
        'Qual a novela mais marcante?',
        'Qual o gênero musical mais subestimado?',
        'Se pudesse reviver um show, qual seria?',
        'Qual a música que define a sua geração?',
        'Qual app de streaming é o melhor?',
        'Qual personagem de desenho é o mais esperto?',
        'Qual o melhor livro que virou filme?',
        'Qual celebridade você convidaria pro churrasco?',
        'Qual o esporte mais divertido de assistir?',
    ],
    dia_a_dia: [
        'Qual a melhor comida para um dia chuvoso?',
        'O que não pode faltar na geladeira?',
        'Qual a pior tarefa doméstica?',
        'O melhor sabor de pizza?',
        'Qual o lanche perfeito da tarde?',
        'Qual a melhor comida de festa junina?',
        'O que você sempre esquece no supermercado?',
        'Qual a melhor comida de rua?',
        'Café preto, com leite ou cappuccino?',
        'Qual o pior hábito que todo mundo tem?',
        'O que te faz perder mais tempo no celular?',
        'Qual o melhor dia da semana?',
        'O que te motiva a sair da cama?',
        'Qual a melhor comida de boteco?',
        'O que você faz quando não consegue dormir?',
        'Qual a melhor sobremesa que existe?',
        'Qual a coisa mais importante na mala de viagem?',
        'O que te irrita mais no trabalho ou escola?',
        'Qual o melhor sabor de sorvete?',
        'O que você faz primeiro ao acordar?',
        'Qual a pior comida que já experimentou?',
        'Qual o melhor programa para um domingo?',
        'O que te faz rir mais rápido?',
        'Qual o melhor tipo de massa?',
        'Qual bebida combina com churrasco?',
        'Qual o lugar ideal para um primeiro encontro?',
        'O que você mais gasta dinheiro sem perceber?',
        'Qual a melhor forma de relaxar depois do trabalho?',
        'Qual a fruta mais subestimada?',
        'Qual a melhor comida para ressaca?',
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

export const buildQuestionQueue = (count, theme = DEFAULT_LURDINHA_THEME) => {
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

    const majorityAnswers = Object.keys(counts).filter((answer) => counts[answer] === maxCount);
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
