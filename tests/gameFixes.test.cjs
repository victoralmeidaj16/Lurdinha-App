const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./load-source.cjs');

const secret = loadSource('src/hooks/game/secret.js');
const impostor = loadSource('src/hooks/game/impostor.js', {
  '../../utils/impostorWords': { getRandomWord: () => ({ word: 'Praia', category: 'Lugar' }) },
});
const drawContent = { formatDrawCategoryLabel: () => '', formatDrawContentModeLabel: () => '' };
const socialGames = loadSource('src/utils/socialGames.js', { './drawContent': drawContent });
const normalizers = loadSource('src/hooks/game/normalizers.js', {
  'firebase/firestore': { serverTimestamp: () => 'TS' },
  '../../utils/drawContent': { DEFAULT_DRAW_CONTENT_MODE: 'words', DEFAULT_DRAW_WORD_CATEGORY: 'geral' },
  './lurdinha': { DEFAULT_LURDINHA_THEME: 'geral' },
  '../../utils/socialGames': socialGames,
});
const drawingPath = loadSource('src/utils/drawingPath.js');
const lurdinha = loadSource('src/hooks/game/lurdinha.js', {
  'firebase/firestore': { serverTimestamp: () => 'TS' },
  '@react-native-async-storage/async-storage': {
    __esModule: true,
    default: { getItem: async () => null, setItem: async () => {} },
  },
});

const players = (...uids) => uids.map(uid => ({ uid }));

test('Telefone: sair no meio não muda a thread de quem continua', () => {
  const start = secret.buildSecretGameStart({ roomData: { players: players('a', 'b', 'c', 'd') } });
  const playerOrder = start.roundData.playerOrder;
  assert.deepEqual(playerOrder, ['a', 'b', 'c', 'd']);

  const before = ['a', 'b', 'd'].map(uid => secret.getSecretTargetThreadUid({ playerOrder, currentTurn: 2, uid }));
  assert.deepEqual(before, ['d', 'a', 'c']);
});

test('Telefone: envio usa a ordem congelada e o turno fecha só com quem está na sala', () => {
  const roomData = {
    currentTurn: 2,
    players: players('a', 'b', 'd'),
    roundData: { playerOrder: ['a', 'b', 'c', 'd'], readyPlayers: [], threads: {} },
  };
  const update = secret.buildSubmitSecretPhrase({ roomData, currentUserId: 'd', phrase: 'oi' });
  assert.deepEqual(Object.keys(update).sort(), ['roundData.readyPlayers', 'roundData.threads.c']);

  assert.equal(secret.areAllSecretPlayersReady({ roomData, readyPlayers: ['a', 'b'] }), false);
  assert.equal(secret.areAllSecretPlayersReady({ roomData, readyPlayers: ['a', 'b', 'd'] }), true);
});

test('Telefone: salas antigas sem ordem congelada continuam funcionando', () => {
  const roomData = { currentTurn: 1, players: players('a', 'b'), roundData: {} };
  assert.deepEqual(secret.getSecretPlayerOrder(roomData), ['a', 'b']);
});

test('Impostor: a vez pula quem saiu e a votação começa quando os presentes responderam', () => {
  const roomData = {
    players: players('a', 'c'),
    roundData: { answerOrder: ['a', 'b', 'c'], currentAnswerTurnIndex: 0, clues: [] },
  };
  const first = impostor.buildImpostorClueUpdate({ roomData, clue: { uid: 'a' }, startTimeFactory: () => 'T' });
  assert.equal(first['roundData.currentAnswerTurnIndex'], 2);
  assert.equal(first['roundData.phase'], undefined);

  roomData.roundData.clues = [{ uid: 'a' }];
  roomData.roundData.currentAnswerTurnIndex = 2;
  const last = impostor.buildImpostorClueUpdate({ roomData, clue: { uid: 'c' }, startTimeFactory: () => 'T' });
  assert.equal(last['roundData.phase'], 'voting');
  assert.equal(last['roundData.votingStartTime'], 'T');
});

test('Impostor: pular a vez de quem saiu não conta como resposta de outro', () => {
  const roomData = {
    players: players('a', 'c'),
    roundData: { answerOrder: ['a', 'b', 'c'], currentAnswerTurnIndex: 1, clues: [{ uid: 'a' }] },
  };
  const skip = impostor.buildImpostorClueUpdate({
    roomData,
    clue: { uid: 'b', text: impostor.IMPOSTOR_SKIP_TEXT, skipped: true },
    startTimeFactory: () => 'T',
  });
  assert.equal(skip['roundData.currentAnswerTurnIndex'], 2);
  assert.equal(skip['roundData.phase'], undefined);
});

test('Rótulos de Impostor, Tier List e Party não caem em Lurdinha', () => {
  assert.equal(socialGames.getSocialGameModeLabel({ gameType: 'impostor' }), 'O Impostor');
  assert.equal(socialGames.getSocialGameModeLabel({ gameType: 'party' }), 'Modo Party');
  assert.equal(socialGames.getSocialGameScoreLabel({ gameType: 'impostor', score: 4 }), '4 pts');
  assert.equal(socialGames.getSocialGameScoreLabel({ gameType: 'party', score: 9 }), '9 pts');
});

test('Party: vencedor é quem tem mais pontos mesmo se o último minijogo foi Lurdinha', () => {
  const roomData = {
    settings: { gameType: 'lurdinha' },
    partySession: { totalGames: 5 },
    players: [{ uid: 'a', score: 3 }, { uid: 'b', score: 12 }],
  };
  assert.equal(socialGames.getRoomGameType(roomData), 'party');
  const snapshot = normalizers.buildGameHistorySnapshot('room', roomData);
  assert.equal(snapshot.gameType, 'party');
  assert.deepEqual(snapshot.winnerIds, ['b']);

  const lurdinha = normalizers.buildGameHistorySnapshot('room', { ...roomData, partySession: null });
  assert.deepEqual(lurdinha.winnerIds, ['a']);
});

test('Revanche de sessão Party volta ao modo Party com a quantidade original', () => {
  const party = normalizers.buildRestartState({
    settings: { gameType: 'obvious_mind', totalRounds: 3, timePerRound: 20 },
    partySession: { totalGames: 5 },
    players: [{ uid: 'a', score: 4 }],
  });
  assert.equal(party.settings.gameType, 'party');
  assert.equal(party.settings.totalRounds, 5);
  assert.equal(party.settings.timePerRound, 20);
  assert.equal(party.partySession, null);

  const normal = normalizers.buildRestartState({ settings: { gameType: 'draw' }, players: [] });
  assert.equal('settings' in normal, false);
});

test('Votação de modalidade: conta só jogadores presentes e modos liberados', () => {
  const pick = (votes, extra = {}) => normalizers.pickModeVoteWinner({
    votes,
    playerIds: ['a', 'b', 'c'],
    allowedKeys: ['lurdinha', 'draw', 'impostor'],
    fallback: 'lurdinha',
    ...extra,
  });
  assert.equal(pick({ a: 'draw', b: 'draw', c: 'impostor' }), 'draw');
  // Quem saiu da sala e modo bloqueado não contam.
  assert.equal(pick({ a: 'impostor', gone: 'draw', b: 'tier_list', c: 'tier_list' }), 'impostor');
  // Sem votos válidos, mantém o modo atual.
  assert.equal(pick({}), 'lurdinha');
  // Empate é sorteado entre os empatados.
  assert.equal(pick({ a: 'draw', b: 'impostor' }, { random: () => 0 }), 'draw');
  assert.equal(pick({ a: 'draw', b: 'impostor' }, { random: () => 0.99 }), 'impostor');
});

test('Próximo jogo abre a votação de modalidade; revanche não', () => {
  const room = { settings: { gameType: 'draw' }, players: [{ uid: 'a', score: 2 }], votes: { a: 'draw' }, voteChat: [{ text: 'oi' }] };
  const next = normalizers.buildSessionResetState(room);
  assert.equal(next.modeVoteStartedAt, 'TS');
  assert.deepEqual(next.votes, {});
  assert.deepEqual(next.voteChat, []);
  const rematch = normalizers.buildRestartState(room);
  assert.equal(rematch.modeVoteStartedAt, null);
});

test('Lurdinha: tema pequeno completa partidas longas sem "Pergunta Extra"', () => {
  for (const theme of ['geral', 'polemica', 'cultura_pop', 'dia_a_dia', 'aleatorio']) {
    const queue = lurdinha.buildQuestionQueue(20, theme);
    assert.equal(queue.length, 20, theme);
    assert.equal(new Set(queue).size, 20, theme);
    assert.ok(queue.every(q => typeof q === 'string' && q.length > 0), theme);
  }
});

test('Traços: coordenadas arredondadas, sem pontos repetidos e dentro do orçamento', () => {
  const path = drawingPath.buildSvgPath([
    { x: 1.23456, y: 2.98765 },
    { x: 1.2345, y: 2.9876 },
    { x: 10.04, y: 20.06 },
  ]);
  assert.equal(path, 'M 1.2 3 L 10 20.1');

  const points = Array.from({ length: 4000 }, (_, i) => ({ x: i / 7, y: (i * 3) / 11 }));
  const strokes = [{ id: 's', color: '#fff', width: 7, path: drawingPath.buildSvgPath(points) }];
  const fitted = drawingPath.fitStrokesToBudget(strokes, 20000);
  assert.ok(drawingPath.estimateStrokesSize(fitted) <= 20000);
  assert.ok(fitted[0].path.startsWith('M 0 0'));
  assert.ok(drawingPath.getTelephoneDrawingBudget({ playerCount: 8, totalTurns: 7 }) < 40000);
});
