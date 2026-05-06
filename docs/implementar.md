implementações-ajustes que gostei para implementar

🔴 Produto — Funcionalidades principais
Jogo do Impostor (Werewolf) não tem sistema de votação e debate

Para completar o modo, é obrigatório ter uma fase de debate antes do voto. Cada round precisa de um sistema que: selecione um suspeito, mostre por que ele está sendo suspeito (e quem suspeita dele), permita que todos digam por que acreditam ou não na pessoa e só depois abra o voto secreto.

Jogo do Telefone (Telephone) não tem tela de resultado rica

A lógica do jogo está completa, mas TelephoneResultScreen.jsx existe como arquivo novo (não commitado ainda). É um dos modos mais engraçados — a revelação de como a frase foi distorcida é o momento de maior valor social. Precisa de uma UI de revelação step-by-step com animação, não só uma lista.

Sem estado de erro em jogos ao vivo

Se a conexão cair durante um DrawGameScreen ou GameScreen, o usuário vê um estado indefinido. Não há retry, não há mensagem. Em um jogo em tempo real, isso é crítico.

Sem fluxo de revanche/replay

FinalResultScreen mostra o leaderboard e termina. Não há botão "jogar de novo", não há "próxima rodada com o mesmo grupo". O momento de maior engajamento (fim de jogo com amigos) é desperdiçado — o usuário sai do contexto e pode não voltar.

Tela de criação de quiz não guia o usuário no tipo

O documento define dois tipos de quiz (Palpite Aberto vs Resultado Definido), mas a tela de criação não deixa isso claro ao criador. O usuário precisa entender o conceito de "a resposta ainda vai acontecer" para criar perguntas interessantes — sem essa orientação, vai criar trivia genérica e o produto perde seu diferencial.

🔵 Refinamento — Polimento e coesão
Tipografia Poppins não está sendo aplicada consistentemente

O tema tem fontStyles.headingBold, fontStyles.headingMedium etc. com Poppins configurado, mas várias telas usam fontWeight: '600' inline em vez de fontStyles.semibold. O resultado é que os headings não têm a personalidade que o documento de marca define.

Componentes orphaned precisam de decisão

ActiveQuizGroupsCard, GameCards, MyGroupsCard, NowPlayingCard, PendingQuizCard, RankingCard existem e estão exportados mas não aparecem na home. Ou entram na UI ou são removidos — no estado atual aumentam a confusão de manutenção.

useGame.js com 894 linhas

Funciona, mas vai virar um gargalo de desenvolvimento. Já existem arquivos separados em src/hooks/game/ (draw.js, lurdinha.js, secret.js) — o próximo passo natural é extrair a lógica de room management para src/hooks/game/room.js e manter o useGame.js só como orquestrador.

Resumo por Onde Começar
Impacto	Esforço	O que fazer
Alto	Baixo	Substituir hardcodes por tokens do tema
Alto	Baixo	Remover mock data do MainFocusCard
Alto	Médio	Completar fase de debate do Impostor
Alto	Médio	Adicionar botão de revanche no FinalResultScreen
Alto	Alto	Redesenhar home para entregar a ação mais urgente
Médio	Médio	Guiar criação de quiz com os dois tipos
Médio	Médio	Tela de revelação do Telephone com animação