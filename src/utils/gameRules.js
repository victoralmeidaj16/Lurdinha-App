// Conteúdo de "Como jogar" de cada modo, exibido no lobby.
// Os números de pontuação espelham a lógica em src/hooks/game/*.js —
// se a pontuação mudar lá, atualize aqui também.

const TELEPHONE_RULES = {
    emoji: '📖',
    title: 'Telefone Sem Fio',
    tagline: 'Uma frase vira desenho, que vira frase, que vira caos.',
    players: 'A partir de 2 jogadores',
    steps: [
        'Cada jogador começa escrevendo uma frase secreta.',
        'A frase passa para o próximo, que precisa desenhá-la.',
        'O seguinte só vê o desenho e escreve o que acha que é.',
        'A cadeia segue alternando frase e desenho até o fim.',
        'No final, a cadeia é revelada passo a passo para todo mundo rir.',
    ],
    scoring: [
        'Não tem pontuação: a graça é ver como a mensagem se perde no caminho.',
    ],
    tips: [
        'Frases curtas e visuais rendem os melhores desastres.',
        'Na hora de descrever, escreva só o que você vê, não o que imagina que era.',
    ],
};

export const GAME_RULES = {
    lurdinha: {
        emoji: '😈',
        title: 'Lurdinha',
        tagline: 'Pense como a maioria e sobreviva.',
        players: 'A partir de 1 jogador',
        steps: [
            'Uma pergunta aparece para todo mundo ao mesmo tempo.',
            'Cada um escolhe a resposta que acha que a maioria vai escolher.',
            'Quando o tempo acaba, as respostas são reveladas.',
        ],
        scoring: [
            'Quem responde diferente da maioria leva 1 Lurdinha.',
            'Se der empate entre respostas, todo mundo leva Lurdinha.',
            'Quem não responde a tempo também leva.',
            'Ganha quem terminar com MENOS Lurdinhas.',
        ],
        tips: [
            'Não responda o que você acha: responda o que o grupo acha.',
        ],
    },
    draw: {
        emoji: '✏️',
        title: 'Desenho',
        tagline: 'Um desenha, o resto adivinha.',
        players: 'A partir de 1 jogador',
        steps: [
            'A cada rodada, um jogador recebe uma palavra (ou personagem) para desenhar.',
            'Os outros tentam adivinhar digitando no chat.',
            'A vez de desenhar passa para o próximo jogador.',
        ],
        scoring: [
            'Quem acerta primeiro ganha mais: 12, 10, 8... (mínimo de 4 pontos).',
            'Bônus de velocidade de até +4 para quem acerta rápido.',
            'O desenhista ganha 6 pontos + 2 por pessoa que acertou.',
            'Se ninguém acertar, o desenhista perde 3 pontos.',
            'Pedir dica custa 2 pontos.',
            'Acertou 4 vezes seguidas? +5 de bônus Detetive.',
            'No modo difícil, os pontos valem 1,5x.',
            'Se metade de quem está adivinhando denunciar o desenho, o desenhista perde 5 pontos e a vez.',
        ],
        tips: [
            'Nada de escrever a palavra no desenho: o grupo pode denunciar.',
        ],
    },
    most_likely: {
        emoji: '👀',
        title: 'Quem é Mais Provável?',
        tagline: 'Descubra o que o grupo pensa de cada um.',
        players: 'A partir de 2 jogadores',
        steps: [
            'Aparece uma pergunta do tipo "Quem é mais provável de...".',
            'Cada um vota em um jogador da sala.',
            'Os votos são revelados, em segredo ou em público, conforme a configuração da sala.',
        ],
        scoring: [
            'Votou em quem acabou sendo o mais votado? +2 pontos.',
        ],
        tips: [
            'Vale pensar no que a galera vai votar, não só na sua opinião.',
        ],
    },
    obvious_mind: {
        emoji: '🧠',
        title: 'Na Minha Cabeça Era Óbvio',
        tagline: 'Quanto você conhece seus amigos?',
        players: 'A partir de 2 jogadores',
        steps: [
            'A cada rodada, um jogador é o alvo da pergunta.',
            'O alvo responde sobre si mesmo, escolhendo uma das opções.',
            'Os outros tentam adivinhar o que o alvo respondeu.',
        ],
        scoring: [
            'Acertou a resposta do alvo? +2 pontos.',
            'Se ninguém acertar, o alvo ganha +3 por ter surpreendido o grupo.',
        ],
        tips: [
            'Quando for o alvo, seja sincero: a graça é ver quem te conhece de verdade.',
        ],
    },
    secret: TELEPHONE_RULES,
    telephone: TELEPHONE_RULES,
    tier_list: {
        emoji: '🏆',
        title: 'Tier List da Galera',
        tagline: 'Classifique o grupo e veja o veredito.',
        players: 'A partir de 2 jogadores',
        steps: [
            'A cada rodada aparece um tema.',
            'Você coloca cada jogador em um nível, de 5 (Lendário) a 1 (Sem chance).',
            'Ninguém se classifica: só os outros te avaliam.',
            'A média dos votos define o nível final de cada um.',
        ],
        scoring: [
            'Pontos pelo nível final: Lendário +4, Forte +3, Sólido +2, Ok +1, Sem chance 0.',
        ],
        tips: [
            'Os votos são individuais. Seja honesto (ou estratégico).',
        ],
    },
    impostor: {
        emoji: '🎭',
        title: 'O Impostor',
        tagline: 'Todo mundo sabe a palavra. Menos um.',
        players: 'A partir de 3 jogadores',
        steps: [
            'Todos recebem a mesma palavra secreta, menos o impostor, que só vê a categoria.',
            'Na sua vez, dê uma pista sobre a palavra sem entregá-la.',
            'Depois das pistas, o grupo discute quem está blefando.',
            'Todo mundo vota em quem acha que é o impostor.',
        ],
        scoring: [
            'Votou no impostor? +3 pontos.',
            'Se todos votarem no impostor, cada um ganha +1 extra.',
            'O impostor só é pego se for o mais votado, sem empate.',
            'Se o impostor escapar, ele ganha +5.',
        ],
        tips: [
            'Pistas muito óbvias ajudam o impostor a descobrir a palavra.',
            'Impostor: escute bem as pistas antes de dar a sua.',
        ],
    },
    party: {
        emoji: '🎉',
        title: 'Sessão de Rodadas',
        tagline: 'Vários minigames seguidos, um placar só.',
        players: 'A partir de 2 jogadores',
        steps: [
            'A sessão sorteia uma sequência de minigames.',
            'Cada minigame segue as próprias regras.',
            'Entre um jogo e outro, aparece o placar parcial.',
        ],
        scoring: [
            'Os pontos de todos os minigames são somados no placar geral.',
            'Ganha quem tiver mais pontos no fim da sessão.',
        ],
        tips: [
            'Ninguém sabe qual jogo vem depois: fique esperto em todos.',
        ],
    },
};

export const getGameRules = (gameType) => GAME_RULES[gameType] || GAME_RULES.lurdinha;
