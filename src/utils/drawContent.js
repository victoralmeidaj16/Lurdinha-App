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
            'taco',
            'pipoca',
            'donut',
            'coxinha',
            'maca',
            'banana',
            'ovo',
            'queijo',
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
            'hot dog',
            'omelete',
            'tapioca',
            'strogonoff',
            'risoto',
            'milho cozido',
            'frango assado',
            'acai',
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
            'entrega atrasada',
            'mesa de aniversario',
            'churrasco na chuva',
            'geladeira vazia',
            'cozinheiro desesperado',
            'prato instagramavel',
            'fila do buffet',
            'jantar romantico',
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
            'raquete',
            'bicicleta',
            'trofeu',
            'rede',
            'luva',
            'tatame',
            'prancha',
            'medalha',
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
            'placar',
            'uniforme',
            'treinador',
            'goleiro',
            'torcida',
            'penalti',
            'faixa preta',
            'linha de chegada',
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
            'gol nos acrescimos',
            'queda de bicicleta',
            'disputa de penaltis',
            'treino na chuva',
            'juiz sem apito',
            'torcedor fantasiado',
            'trofeu quebrado',
            'corrida de saco',
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
            'sapo',
            'abelha',
            'urso',
            'rato',
            'ovelha',
            'panda',
            'raposa',
            'jacare',
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
            'arara',
            'capivara',
            'suricato',
            'hipopotamo',
            'aguia',
            'baleia',
            'caranguejo',
            'lagarto',
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
            'pinguim perdido',
            'gato no telhado',
            'cachorro culpado',
            'girafa de cachecol',
            'macaco no mercado',
            'tartaruga apressada',
            'leao dorminhoco',
            'pato atravessando rua',
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
            'notebook',
            'controle',
            'relogio',
            'pendrive',
            'caixa de som',
            'carregador',
            'roteador',
            'chip',
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
            'videochamada',
            'mensagem',
            'controle remoto',
            'tela touch',
            'codigo qr',
            'smartwatch',
            'console',
            'camera de seguranca',
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
            'notebook travado',
            'grupo silenciado',
            'backup perdido',
            'celular sem bateria',
            'impressora rebelde',
            'controle sem pilha',
            'wifi caindo',
            'reuniao sem microfone',
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
    'Robocop fazendo terapia',
    'Cleopatra pedindo delivery',
    'Astronauta preso no elevador',
    'Pirata fazendo podcast',
    'Bruxa montando startup',
    'Ninja lavando pratos',
    'Farao no karaoke',
    'Vampiro tomando sol',
    'Sherlock Holmes perdido no shopping',
    'Gladiador jogando futebol',
    'Alien vendendo brigadeiro',
    'Princesa consertando wifi',
    'Cowboy no escritorio',
    'Detetive escolhendo pizza',
    'Sereia de bicicleta',
    'Papai Noel no aeroporto',
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
