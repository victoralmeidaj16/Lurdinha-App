export const DRAW_CONTENT_MODES = [
    {
        value: 'words',
        label: 'Palavras',
        description: 'Palavras clássicas por categoria para desenhar e adivinhar.',
    },
    {
        value: 'characters',
        label: 'Personagens',
        description: 'Cenas criativas em frases curtas, como "Einstein surfando".',
    },
];

export const DRAW_WORD_CATEGORIES = [
    {
        value: 'food',
        label: 'Comida',
        description: 'Pratos, ingredientes e situações de cozinha.',
    },
    {
        value: 'sports',
        label: 'Esporte',
        description: 'Modalidades, objetos e momentos de competição.',
    },
    {
        value: 'animals',
        label: 'Animais',
        description: 'Bichos conhecidos, exóticos e cenas do reino animal.',
    },
    {
        value: 'technology',
        label: 'Tecnologia',
        description: 'Gadgets, internet e caos digital do dia a dia.',
    },
];

export const DEFAULT_DRAW_CONTENT_MODE = 'words';
export const DEFAULT_DRAW_WORD_CATEGORY = 'food';

const DRAW_WORD_BANKS = {
    food: {
        easy: [
            'pizza',
            'bolo',
            'sushi',
            'cafe',
            'sorvete',
            'hamburguer',
            'salada',
            'pastel',
            'batata frita',
            'pao de queijo',
        ],
        normal: [
            'feijoada',
            'lasanha',
            'churrasco',
            'panqueca',
            'brigadeiro',
            'croissant',
            'yakisoba',
            'macarronada',
            'escondidinho',
            'marmita',
        ],
        hard: [
            'cozinha industrial',
            'chef atrasado',
            'bolo derretendo',
            'almoco de domingo',
            'receita secreta',
            'rodizio lotado',
            'pipoca queimada',
            'fome de madrugada',
            'cafe gelado',
            'restaurante chique',
        ],
    },
    sports: {
        easy: [
            'bola',
            'gol',
            'skate',
            'surf',
            'tenis',
            'boxe',
            'corrida',
            'natacao',
            'remo',
            'podio',
        ],
        normal: [
            'basquete',
            'volei',
            'judo',
            'ciclismo',
            'maratona',
            'ginastica',
            'capacete',
            'apito',
            'arqueiro',
            'patins',
        ],
        hard: [
            'arbitro confuso',
            'recorde mundial',
            'prorrogacao',
            'medalha dourada',
            'estadio vazio',
            'treino pesado',
            'torcida organizada',
            'salto ornamental',
            'atleta lesionado',
            'campeonato relampago',
        ],
    },
    animals: {
        easy: [
            'gato',
            'cachorro',
            'leao',
            'vaca',
            'pato',
            'peixe',
            'coelho',
            'cavalo',
            'porco',
            'galinha',
        ],
        normal: [
            'girafa',
            'rinoceronte',
            'pinguim',
            'golfinho',
            'camaleao',
            'tucano',
            'elefante',
            'tartaruga',
            'canguru',
            'flamingo',
        ],
        hard: [
            'polvo gigante',
            'onca camuflada',
            'coruja noturna',
            'lobo uivando',
            'zebra cansada',
            'bando de passaros',
            'foca equilibrando bola',
            'inseto microscopico',
            'zoologico lotado',
            'formigueiro',
        ],
    },
    technology: {
        easy: [
            'mouse',
            'celular',
            'teclado',
            'camera',
            'fone',
            'drone',
            'tablet',
            'senha',
            'wifi',
            'cabo',
        ],
        normal: [
            'robo',
            'satelite',
            'microfone',
            'impressora',
            'videogame',
            'monitor',
            'aplicativo',
            'internet',
            'foguete',
            'bateria',
        ],
        hard: [
            'inteligencia artificial',
            'realidade virtual',
            'nuvem de dados',
            'codigo bugado',
            'reuniao online',
            'hacker mascarado',
            'tela quebrada',
            'senha vazada',
            'carregador sumido',
            'robo domestico',
        ],
    },
};

const DRAW_CHARACTER_PROMPTS = [
    'Einstein surfando',
    'Cleopatra de patins',
    'Sherlock Holmes na praia',
    'Mona Lisa andando de skate',
    'Napoleao fazendo ioga',
    'Frida Kahlo pilotando um foguete',
    'Dracula no supermercado',
    'Papai Noel no crossfit',
    'Sereia jogando videogame',
    'Pirata influencer',
    'Alien fazendo churrasco',
    'Vampiro tirando selfie',
    'Ninja no karaoke',
    'Cavaleiro medieval de scooter',
    'Farao no escritorio',
    'Detetive de ferias',
    'Astronauta sambando',
    'Bruxa no aeroporto',
    'Cowboy programando',
    'Gladiador no spa',
    'Princesa DJ',
    'Cientista em montanha-russa',
    'Mumia fazendo cafe',
    'Super-heroi pescando',
];

const shuffle = (items) => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
};

const repeatFromBank = (bank, count) => {
    if (!Array.isArray(bank) || bank.length === 0) {
        return Array.from({ length: count }, () => 'desenho');
    }

    const result = [];
    while (result.length < count) {
        result.push(...shuffle(bank));
    }
    return result.slice(0, count);
};

const getAllWordsForDifficulty = (difficulty) => (
    Object.values(DRAW_WORD_BANKS).flatMap((categoryBank) => (
        categoryBank[difficulty] || categoryBank.normal || []
    ))
);

export const buildDrawContentQueue = ({
    count,
    difficulty = 'normal',
    category,
    contentMode = DEFAULT_DRAW_CONTENT_MODE,
}) => {
    if (contentMode === 'characters') {
        return repeatFromBank(DRAW_CHARACTER_PROMPTS, count);
    }

    const normalizedDifficulty = ['easy', 'normal', 'hard'].includes(difficulty) ? difficulty : 'normal';
    const selectedBank = category && DRAW_WORD_BANKS[category]
        ? DRAW_WORD_BANKS[category][normalizedDifficulty]
        : getAllWordsForDifficulty(normalizedDifficulty);

    return repeatFromBank(selectedBank, count);
};

export const formatDrawCategoryLabel = (category) => (
    DRAW_WORD_CATEGORIES.find((item) => item.value === category)?.label || 'Categorias'
);

export const formatDrawContentModeLabel = (contentMode) => (
    DRAW_CONTENT_MODES.find((item) => item.value === contentMode)?.label || 'Palavras'
);
