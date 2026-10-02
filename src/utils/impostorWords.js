export const IMPOSTOR_CATEGORY_ICONS = {
    "Aleatória": "🎲",
    "Lugar": "📍",
    "Profissão": "💼",
    "Objeto": "📦",
    "Comida": "🍔",
    "Animal": "🦁",
    "Filme": "🎬",
    "Esporte": "⚽",
    "País": "🌐"
};

export const IMPOSTOR_CATEGORIES = [
    {
        category: "Lugar",
        words: [
            "Praia", "Shopping", "Cinema", "Escola", "Hospital",
            "Restaurante", "Parque", "Igreja", "Museu", "Aeroporto",
            "Zoológico", "Faculdade", "Academia", "Biblioteca", "Padaria",
            "Mercado", "Farmácia", "Estádio", "Hotel", "Banco",
            "Praça", "Salão de beleza", "Posto de gasolina", "Ônibus", "Teatro",
            "Clube", "Consultório", "Balada", "Elevador", "Condomínio"
        ]
    },
    {
        category: "Profissão",
        words: [
            "Médico", "Professor", "Advogado", "Engenheiro", "Policial",
            "Bombeiro", "Piloto", "Chef", "Ator", "Cantor",
            "Programador", "Dentista", "Veterinário", "Mecânico", "Padeiro",
            "Garçom", "Motorista", "Enfermeiro", "Designer", "Fotógrafo",
            "Jornalista", "Psicólogo", "Personal trainer", "Barbeiro", "Caixa",
            "Arquiteto", "Diarista", "Vendedor", "Influencer", "Segurança"
        ]
    },
    {
        category: "Objeto",
        words: [
            "Celular", "Televisão", "Geladeira", "Sofá", "Cama",
            "Computador", "Relógio", "Óculos", "Livro", "Mesa",
            "Cadeira", "Mochila", "Janela", "Porta", "Microfone",
            "Chave", "Carteira", "Controle remoto", "Carregador", "Espelho",
            "Guarda-chuva", "Travesseiro", "Fogão", "Ventilador", "Bicicleta",
            "Fone de ouvido", "Garrafa", "Panela", "Câmera", "Caneta"
        ]
    },
    {
        category: "Comida",
        words: [
            "Pizza", "Hambúrguer", "Sushi", "Churrasco", "Salada",
            "Feijoada", "Macarrão", "Sopa", "Bolo", "Sorvete",
            "Chocolate", "Pão", "Queijo", "Lasanha", "Cachorro-quente",
            "Coxinha", "Pastel", "Brigadeiro", "Pipoca", "Tapioca",
            "Açaí", "Omelete", "Strogonoff", "Panqueca", "Batata frita",
            "Pão de queijo", "Risoto", "Yakisoba", "Café", "Miojo"
        ]
    },
    {
        category: "Animal",
        words: [
            "Cachorro", "Gato", "Leão", "Elefante", "Girafa",
            "Macaco", "Tigre", "Urso", "Coelho", "Cobra",
            "Cavalo", "Vaca", "Tartaruga", "Pinguim", "Golfinho",
            "Capivara", "Jacaré", "Coruja", "Raposa", "Pato",
            "Galinha", "Porco", "Sapo", "Baleia", "Arara",
            "Flamingo", "Camaleão", "Rinoceronte", "Ovelha", "Caranguejo"
        ]
    },
    {
        category: "Filme",
        words: [
            "Titanic", "Avatar", "Vingadores", "Matrix", "Shrek",
            "Coringa", "Batman", "Homem-Aranha", "Crepúsculo", "Gladiador",
            "Rocky", "Tubarão", "Jurassic Park", "Toy Story", "Rei Leão",
            "Barbie", "Harry Potter", "Star Wars", "Frozen", "Moana",
            "Pantera Negra", "Interestelar", "Procurando Nemo", "Divertida Mente", "O Auto da Compadecida",
            "Tropa de Elite", "Cidade de Deus", "Minions", "A Bela e a Fera", "De Volta para o Futuro"
        ]
    },
    {
        category: "Esporte",
        words: [
            "Futebol", "Basquete", "Vôlei", "Tênis", "Natação",
            "Atletismo", "Boxe", "Judô", "Surfe", "Skate",
            "Ciclismo", "Ginástica", "Handebol", "Futsal", "Beisebol",
            "Corrida", "MMA", "Rugby", "Golfe", "Tênis de mesa",
            "Escalada", "Patinação", "Arco e flecha", "Fórmula 1", "Queimada",
            "Xadrez", "Futevôlei", "Crossfit", "Remo", "Badminton"
        ]
    },
    {
        category: "País",
        words: [
            "Brasil", "Estados Unidos", "Japão", "França", "Alemanha",
            "Canadá", "Itália", "Espanha", "México", "Argentina",
            "Austrália", "China", "Índia", "Rússia", "Portugal",
            "Inglaterra", "Coreia do Sul", "Egito", "Grécia", "Chile",
            "Uruguai", "Colômbia", "África do Sul", "Tailândia", "Noruega",
            "Suíça", "Holanda", "Marrocos", "Nova Zelândia", "Turquia"
        ]
    }
];

export const getRandomWord = (selectedCategory = null) => {
    let categoryObj;

    if (selectedCategory && selectedCategory !== 'Aleatória') {
        categoryObj = IMPOSTOR_CATEGORIES.find(c => c.category === selectedCategory);
    }

    if (!categoryObj) {
        const categoryIndex = Math.floor(Math.random() * IMPOSTOR_CATEGORIES.length);
        categoryObj = IMPOSTOR_CATEGORIES[categoryIndex];
    }

    const wordIndex = Math.floor(Math.random() * categoryObj.words.length);
    const word = categoryObj.words[wordIndex];

    return { category: categoryObj.category, word };
};
