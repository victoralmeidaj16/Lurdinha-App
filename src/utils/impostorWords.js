export const IMPOSTOR_CATEGORIES = [
    {
        category: "Lugar",
        words: [
            "Praia", "Shopping", "Cinema", "Escola", "Hospital",
            "Restaurante", "Parque", "Igreja", "Museu", "Aeroporto",
            "Zoológico", "Faculdade", "Academia", "Biblioteca", "Padaria"
        ]
    },
    {
        category: "Profissão",
        words: [
            "Médico", "Professor", "Advogado", "Engenheiro", "Policial",
            "Bombeiro", "Piloto", "Chef", "Ator", "Cantor",
            "Programador", "Dentista", "Veterinário", "Mecânico", "Padeiro"
        ]
    },
    {
        category: "Objeto",
        words: [
            "Celular", "Televisão", "Geladeira", "Sofá", "Cama",
            "Computador", "Relógio", "Óculos", "Livro", "Mesa",
            "Cadeira", "Mochila", "Janela", "Porta", "Microfone"
        ]
    },
    {
        category: "Comida",
        words: [
            "Pizza", "Hambúrguer", "Sushi", "Churrasco", "Salada",
            "Feijoada", "Macarrão", "Sopa", "Bolo", "Sorvete",
            "Chocolate", "Pão", "Queijo", "Lasanha", "Cachorro-quente"
        ]
    },
    {
        category: "Animal",
        words: [
            "Cachorro", "Gato", "Leão", "Elefante", "Girafa",
            "Macaco", "Tigre", "Urso", "Coelho", "Cobra",
            "Cavalo", "Vaca", "Tartaruga", "Pinguim", "Golfinho"
        ]
    },
    {
        category: "Filme",
        words: [
            "Titanic", "Avatar", "Vingadores", "Matrix", "Shrek",
            "Coringa", "Batman", "Homem-Aranha", "Crepúsculo", "Gladiador",
            "Rocky", "Tubarão", "Jurassic Park", "Toy Story", "Rei Leão"
        ]
    },
    {
        category: "Esporte",
        words: [
            "Futebol", "Basquete", "Vôlei", "Tênis", "Natação",
            "Atletismo", "Boxe", "Judô", "Surfe", "Skate",
            "Ciclismo", "Ginástica", "Handebol", "Futsal", "Beisebol"
        ]
    },
    {
        category: "País",
        words: [
            "Brasil", "Estados Unidos", "Japão", "França", "Alemanha",
            "Canadá", "Itália", "Espanha", "México", "Argentina",
            "Austrália", "China", "Índia", "Rússia", "Portugal"
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
