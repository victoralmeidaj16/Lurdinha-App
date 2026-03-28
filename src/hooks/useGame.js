import { useState, useRef } from 'react';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    onSnapshot,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
    runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
    buildDrawContentQueue,
    DEFAULT_DRAW_CONTENT_MODE,
    DEFAULT_DRAW_WORD_CATEGORY,
} from '../utils/drawContent';
import {
    ensureMatchAchievements,
    ensureSocialGameStats,
    ensureUserStats,
    getWinningPlayerIds,
    sortPlayersForGameResults,
} from '../utils/socialGames';

const DEFAULT_DRAW_CANVAS_FILL = '#111827';
const isRevealableChar = (char = '') => /[\p{L}\p{N}]/u.test(char);

export function useGame() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [gameState, setGameState] = useState(null);

    // Reference to the unsubscribe function for the room listener
    const unsubscribeRef = useRef(null);

    // Helper to generate a 5-digit code
    const generateRoomCode = () => {
        return Math.floor(10000 + Math.random() * 90000).toString();
    };

    const normalizeText = (value = '') => (
        value
            .toString()
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
    );

    const maskWord = (word = '', revealedIndices = []) => (
        word
            .split('')
            .map((char, index) => (
                isRevealableChar(char) && !revealedIndices.includes(index) ? '_' : char
            ))
            .join(' ')
    );

    const getHiddenCharacterIndices = (word = '', revealedIndices = []) => {
        const revealedSet = new Set(revealedIndices);
        return word
            .split('')
            .reduce((accumulator, char, index) => {
                if (isRevealableChar(char) && !revealedSet.has(index)) {
                    accumulator.push(index);
                }
                return accumulator;
            }, []);
    };

    const buildDrawerQueue = (players, totalRounds) => {
        const playerIds = players.map((player) => player.uid);
        return Array.from({ length: totalRounds }, (_, index) => playerIds[index % playerIds.length]);
    };

    const createDrawRoundData = (word, drawerId) => ({
        word,
        maskedWord: maskWord(word),
        revealedHintIndices: [],
        drawerId,
        startTime: serverTimestamp(),
        canvasFill: DEFAULT_DRAW_CANVAS_FILL,
        strokes: [],
        chatMessages: [
            {
                id: `system-${drawerId}-${Date.now()}`,
                type: 'system',
                text: 'A rodada começou. Tentem descobrir o desafio.',
                createdAt: Date.now(),
            },
        ],
        guesses: {},
        correctlyGuessed: [],
        results: null,
    });

    const normalizePlayerProgress = (player = {}) => ({
        ...player,
        consecutiveGuesses: player.consecutiveGuesses || 0,
        unlockedAchievements: ensureMatchAchievements(player.unlockedAchievements),
    });

    const buildGameHistorySnapshot = (roomId, roomData) => {
        const gameType = roomData.settings?.gameType || 'lurdinha';
        const normalizedPlayers = (roomData.players || []).map(normalizePlayerProgress);
        const sortedPlayers = sortPlayersForGameResults(normalizedPlayers, gameType);
        const winnerIds = getWinningPlayerIds(sortedPlayers, gameType);

        return {
            gameType,
            normalizedPlayers,
            sortedPlayers,
            winnerIds,
            participantIds: sortedPlayers.map((player) => player.uid),
            historyPlayers: sortedPlayers.map((player, index) => ({
                uid: player.uid,
                name: player.name,
                photoURL: player.photoURL || null,
                score: player.score || 0,
                position: index + 1,
                isWinner: winnerIds.includes(player.uid),
                achievements: ensureMatchAchievements(player.unlockedAchievements),
            })),
            roomId,
        };
    };

    // Create a new game room
    const createRoom = async (settings) => {
        console.log('[createRoom] start. CurrentUser:', currentUser?.uid, currentUser?.email);
        if (!currentUser) {
            console.warn('[createRoom] No user logged in');
            return;
        }
        setLoading(true);
        setError(null);

        try {
            let roomId = generateRoomCode();
            let roomRef = doc(db, 'game_rooms', roomId);

            console.log('[createRoom] Checking existence of room:', roomId);
            let roomDoc = await getDoc(roomRef);

            // Ensure code uniqueness (simple retry logic)
            while (roomDoc.exists()) {
                console.log('[createRoom] Room exists, generating new code');
                roomId = generateRoomCode();
                roomRef = doc(db, 'game_rooms', roomId);
                roomDoc = await getDoc(roomRef);
            }

            const initialData = {
                roomId,
                hostId: currentUser.uid,
                status: 'waiting', // waiting, playing, round_results, finished
                settings: {
                    timePerRound: settings.timePerRound || 20,
                    totalRounds: settings.totalRounds || 5,
                    theme: settings.theme || 'Geral',
                    gameType: settings.gameType || 'lurdinha',
                    difficulty: settings.difficulty || 'normal',
                    contentMode: settings.contentMode || DEFAULT_DRAW_CONTENT_MODE,
                    drawCategory: settings.drawCategory || DEFAULT_DRAW_WORD_CATEGORY,
                    ...settings
                },
                currentRound: 0,
                createdAt: serverTimestamp(),
                players: [
                    {
                        uid: currentUser.uid,
                        name: currentUser.displayName || 'Host',
                        photoURL: currentUser.photoURL,
                        score: 0,
                        isReady: true,
                        consecutiveGuesses: 0,
                        unlockedAchievements: ensureMatchAchievements(),
                    }
                ],
                roundData: null
            };

            console.log('[createRoom] Attempting to create room doc', roomId);
            await setDoc(roomRef, initialData);
            console.log('[createRoom] Success');
            setLoading(false);
            return roomId;
        } catch (err) {
            console.error('[createRoom] Error:', err.code, err.message, err);
            setError(`Erro ao criar sala: ${err.message} (${err.code})`);
            setLoading(false);
            throw err;
        }
    };

    // Join an existing room
    const joinRoom = async (roomId) => {
        if (!currentUser) return;
        setLoading(true);
        setError(null);

        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            const roomDoc = await getDoc(roomRef);

            if (!roomDoc.exists()) {
                throw new Error('Sala não encontrada.');
            }

            const roomData = roomDoc.data();

            if (roomData.status !== 'waiting') {
                throw new Error('A partida já começou.');
            }

            // Check if already in room
            const isAlreadyIn = roomData.players.some(p => p.uid === currentUser.uid);

            if (!isAlreadyIn) {
                await updateDoc(roomRef, {
                    players: arrayUnion({
                        uid: currentUser.uid,
                        name: currentUser.displayName || 'Jogador',
                        photoURL: currentUser.photoURL,
                        score: 0,
                        isReady: true,
                        consecutiveGuesses: 0,
                        unlockedAchievements: ensureMatchAchievements(),
                    })
                });
            }

            setLoading(false);
            return roomData;
        } catch (err) {
            console.error('Error joining room:', err);
            setError(err.message || 'Erro ao entrar na sala.');
            setLoading(false);
            throw err;
        }
    };

    // Listen to room updates
    const listenToRoom = (roomId, callback) => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }

        const roomRef = doc(db, 'game_rooms', roomId);

        const unsubscribe = onSnapshot(roomRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                setGameState(data);
                if (callback) callback(data);
            } else {
                setError('Sala encerrada ou não encontrada.');
                setGameState(null);
            }
        }, (err) => {
            console.error('Error listening to room:', err);
            setError('Erro de conexão com a sala.');
        });

        unsubscribeRef.current = unsubscribe;
        return unsubscribe;
    };

    // Remove current user from room players array (call on lobby exit)
    const removeFromRoom = async (roomId) => {
        if (!currentUser) return;
        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            const roomDoc = await getDoc(roomRef);
            if (!roomDoc.exists()) return;

            const roomData = roomDoc.data();
            if (roomData.status !== 'waiting') return; // don't remove mid-game

            const playerEntry = roomData.players.find(p => p.uid === currentUser.uid);
            if (playerEntry) {
                await updateDoc(roomRef, { players: arrayRemove(playerEntry) });
            }
        } catch (err) {
            console.error('[removeFromRoom] Error:', err);
        }
    };

    // Helper to generate questions (Mock for now, can be replaced by DB fetch)
    const fetchQuestions = (count) => {
        const baseQuestions = [
            "Qual a melhor comida para um dia chuvoso?",
            "O que você faria com 1 milhão de reais agora?",
            "Qual o pior presente de amigo secreto?",
            "Uma música que todo mundo finge que não gosta mas ama?",
            "O lugar mais estranho onde você já dormiu?",
            "Qual superpoder seria o mais útil no trabalho?",
            "O que não pode faltar na geladeira?",
            "Um filme que te fez chorar?",
            "Qual a pior tarefa doméstica?",
            "O que você compraria se fosse rico e excêntrico?",
            "Qual animal seria o melhor presidente?",
            "Uma gíria que você usa muito?",
            "O melhor sabor de pizza?",
            "O que te irrita no trânsito?",
            "Qual a melhor rede social antiga?"
        ];

        // Shuffle and slice
        const shuffled = [...baseQuestions].sort(() => 0.5 - Math.random());
        // Ensure we have enough questions by repeating if necessary
        const result = [];
        while (result.length < count) {
            result.push(...shuffled);
        }
        return result.slice(0, count);
    };

    // Start the game (Host only)
    const startGame = async (roomId, totalRounds = 5, theme = 'Geral') => {
        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            const roomDoc = await getDoc(roomRef);
            if (!roomDoc.exists()) {
                throw new Error('Sala não encontrada.');
            }

            const roomData = roomDoc.data();
            const gameType = roomData.settings?.gameType || 'lurdinha';

            if (gameType === 'draw') {
                const difficulty = roomData.settings?.difficulty || 'normal';
                const contentMode = roomData.settings?.contentMode || DEFAULT_DRAW_CONTENT_MODE;
                const drawCategory = roomData.settings?.drawCategory;
                const words = buildDrawContentQueue({
                    count: totalRounds,
                    difficulty,
                    category: drawCategory,
                    contentMode,
                });
                const drawerQueue = buildDrawerQueue(roomData.players || [], totalRounds);

                await updateDoc(roomRef, {
                    status: 'playing',
                    currentRound: 1,
                    drawWordsQueue: words,
                    drawerQueue,
                    roundData: createDrawRoundData(words[0], drawerQueue[0]),
                });
                return;
            }

            const questions = fetchQuestions(totalRounds, theme);

            await updateDoc(roomRef, {
                status: 'playing',
                currentRound: 1,
                questionsQueue: questions,
                roundData: {
                    question: questions[0],
                    startTime: serverTimestamp(),
                    answers: {},
                    results: null
                }
            });
        } catch (err) {
            console.error('Error starting game:', err);
            setError('Erro ao iniciar partida.');
            throw err;
        }
    };

    // Submit an answer
    const submitAnswer = async (roomId, answer) => {
        if (!currentUser) return;

        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            // We use dot notation to update a specific key in the map
            // Note: This requires the map 'answers' to exist.
            await updateDoc(roomRef, {
                [`roundData.answers.${currentUser.uid}`]: answer
            });
        } catch (err) {
            console.error('Error submitting answer:', err);
            throw err;
        }
    };

    // ─── Helpers de pontuação do modo Desenho ────────────────────
    /**
     * Resolve o timestamp de startTime (Firestore Timestamp ou ms number).
     * Retorna o valor em ms (Date.now() format).
     */
    const resolveStartTimeMs = (value) => {
        if (!value) return 0;
        if (typeof value?.toDate === 'function') return value.toDate().getTime();
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    };

    /**
     * Calcula o bônus de velocidade baseado em quanto tempo o jogador levou.
     * elapsedRatio: 0 = acertou imediatamente, 1 = acertou no último segundo.
     *
     * Faixa 1 (≤33% do tempo decorrido) → +4 pts  (Relâmpago)
     * Faixa 2 (34–66%)                  → +2 pts  (Rápido)
     * Faixa 3 (>66%)                    → +0 pts  (Na última hora)
     */
    const calcSpeedBonus = (guessedAtMs, startTimeMs, timePerRound) => {
        if (!startTimeMs || !guessedAtMs) return 0;
        const elapsedRatio = Math.max(0, Math.min(1,
            (guessedAtMs - startTimeMs) / (timePerRound * 1000)
        ));
        if (elapsedRatio <= 0.33) return 4;
        if (elapsedRatio <= 0.66) return 2;
        return 0;
    };

    // Calculate round results (Host only)
    // Logic:
    // 1. Count frequency of each answer (normalized).
    // 2. Find the max frequency.
    // 3. Identify majority answer(s).
    // 4. Assign Lurdinhas to those who didn't match majority.
    const calculateRoundResults = async (roomId, currentGameState) => {
        if (currentGameState?.settings?.gameType === 'draw') {
            const roomRef = doc(db, 'game_rooms', roomId);

            try {
                // ── #1: Estado fresco via runTransaction para evitar stale closure
                // e race conditions entre o timer e o gatilho "todos acertaram".
                await runTransaction(db, async (tx) => {
                    const roomDoc = await tx.get(roomRef);
                    if (!roomDoc.exists()) throw new Error('Sala não encontrada.');

                    const freshData = roomDoc.data();

                    // Guard: outro caller já calculou os resultados desta rodada
                    if (freshData.status === 'round_results') return;

                    const { roundData, players, settings } = freshData;
                    const timePerRound = settings?.timePerRound || 60;
                    const isWordMode = settings?.contentMode !== 'characters';
                    const difficulty = isWordMode ? (settings?.difficulty || 'normal') : 'normal';
                    const diffMultiplier = difficulty === 'hard' ? 1.5 : 1;

                    // ── #2: Bônus de velocidade (3 faixas)
                    const startTimeMs = resolveStartTimeMs(roundData.startTime);

                    const guessedPlayers = (roundData.correctlyGuessed || [])
                        .map((uid) => ({
                            uid,
                            guessedAt: roundData.guesses?.[uid]?.guessedAt || 0,
                        }))
                        .sort((a, b) => a.guessedAt - b.guessedAt)
                        .map((entry, index) => {
                            const basePoints = Math.max(4, 12 - (index * 2));
                            const speedBonus = calcSpeedBonus(entry.guessedAt, startTimeMs, timePerRound);
                            const rawPoints = basePoints + speedBonus;
                            return {
                                ...entry,
                                basePoints,
                                speedBonus,
                                points: Math.round(rawPoints * diffMultiplier),
                            };
                        });

                    const updatedPlayers = players.map((player) => normalizePlayerProgress(player));
                    guessedPlayers.forEach(({ uid, points, speedBonus }) => {
                        const player = updatedPlayers.find((item) => item.uid === uid);
                        if (player) {
                            player.score = (player.score || 0) + points;
                            if (speedBonus >= 4) {
                                player.unlockedAchievements = {
                                    ...ensureMatchAchievements(player.unlockedAchievements),
                                    relampago: true,
                                };
                            }
                        }
                    });

                    const drawer = updatedPlayers.find((player) => player.uid === roundData.drawerId);
                    const drawerPenalty = guessedPlayers.length === 0;
                    if (drawer) {
                        if (!drawerPenalty) {
                            const drawerRaw = 6 + guessedPlayers.length * 2;
                            drawer.score = (drawer.score || 0) + Math.round(drawerRaw * diffMultiplier);
                        } else {
                            drawer.score = (drawer.score || 0) - 3;
                        }
                    }

                    // ── #7: Streak de acertos (4 rodadas consecutivas = +5 pts + badge)
                    const streakPlayers = [];
                    updatedPlayers.forEach((player) => {
                        if (player.uid === roundData.drawerId) {
                            player.consecutiveGuesses = 0;
                            return;
                        }
                        const guessed = guessedPlayers.some((e) => e.uid === player.uid);
                        if (guessed) {
                            player.consecutiveGuesses = (player.consecutiveGuesses || 0) + 1;
                            if (player.consecutiveGuesses >= 4) {
                                player.score = (player.score || 0) + 5;
                                player.unlockedAchievements = {
                                    ...ensureMatchAchievements(player.unlockedAchievements),
                                    detective: true,
                                };
                                streakPlayers.push(player.uid);
                            }
                        } else {
                            player.consecutiveGuesses = 0;
                        }
                    });

                    const missedPlayerIds = updatedPlayers
                        .filter((player) =>
                            player.uid !== roundData.drawerId &&
                            !guessedPlayers.some((entry) => entry.uid === player.uid)
                        )
                        .map((player) => player.uid);

                    tx.update(roomRef, {
                        status: 'round_results',
                        players: updatedPlayers,
                        'roundData.results': {
                            word: roundData.word,
                            drawerId: roundData.drawerId,
                            guessedPlayers,
                            missedPlayerIds,
                            drawerPenalty,
                            streakPlayers,
                            difficulty,
                        },
                    });
                });
                return;
            } catch (err) {
                console.error('Error calculating draw results:', err);
                throw err;
            }
        }

        try {
            const { roundData, players } = currentGameState;
            const answers = roundData.answers || {};

            // Normalize answers: lowercase, trim
            const normalizedAnswers = {};
            const counts = {};

            Object.entries(answers).forEach(([uid, ans]) => {
                const norm = ans.toString().trim().toLowerCase();
                normalizedAnswers[uid] = norm;
                counts[norm] = (counts[norm] || 0) + 1;
            });

            // Find max count
            let maxCount = 0;
            Object.values(counts).forEach(c => {
                if (c > maxCount) maxCount = c;
            });

            // Identify majority answers (could be a tie)
            const majorityAnswers = Object.keys(counts).filter(ans => counts[ans] === maxCount);

            // Identify victims (Lurdinhas)
            // Anyone who did NOT answer one of the majority answers gets a point.
            // If everyone answered differently (maxCount = 1), everyone gets a Lurdinha? 
            // Rule says: "Responder igual à maioria". If everyone is different, there is no majority. 
            // Let's assume if maxCount == 1 (and players > 1), everyone failed to match.

            const lurdinhaVictims = [];
            const updatedPlayers = [...players];

            updatedPlayers.forEach(player => {
                const playerAns = normalizedAnswers[player.uid];
                // If player didn't answer, they get Lurdinha automatically? Or we ignore?
                // Let's assume no answer = Lurdinha.

                const isSafe = playerAns && majorityAnswers.includes(playerAns);

                if (!isSafe) {
                    lurdinhaVictims.push(player.uid);
                    player.score = (player.score || 0) + 1;
                }
            });

            const roomRef = doc(db, 'game_rooms', roomId);

            await updateDoc(roomRef, {
                status: 'round_results',
                players: updatedPlayers,
                'roundData.results': {
                    majorityAnswers,
                    lurdinhaVictims,
                    allAnswers: answers // Keep raw answers for display
                }
            });

        } catch (err) {
            console.error('Error calculating results:', err);
            throw err;
        }
    };

    // Next round (Host only)
    const nextRound = async (roomId, isLastRound) => {
        try {
            const roomRef = doc(db, 'game_rooms', roomId);

            if (isLastRound) {
                await runTransaction(db, async (transaction) => {
                    const roomDoc = await transaction.get(roomRef);
                    if (!roomDoc.exists()) throw new Error('Sala não encontrada.');

                    const data = roomDoc.data();
                    if (data.status === 'finished') return;

                    const gameHistorySnapshot = buildGameHistorySnapshot(roomId, data);
                    const historyRef = doc(collection(db, 'game_history'));

                    transaction.set(historyRef, {
                        roomId,
                        hostId: data.hostId,
                        gameType: gameHistorySnapshot.gameType,
                        settings: data.settings || {},
                        createdAt: data.createdAt || serverTimestamp(),
                        finishedAt: serverTimestamp(),
                        participantIds: gameHistorySnapshot.participantIds,
                        winnerIds: gameHistorySnapshot.winnerIds,
                        players: gameHistorySnapshot.historyPlayers,
                    });

                    for (const player of gameHistorySnapshot.historyPlayers) {
                        const userRef = doc(db, 'users', player.uid);
                        const userDoc = await transaction.get(userRef);
                        const existingStats = ensureUserStats(userDoc.data()?.stats);
                        const existingSocialStats = ensureSocialGameStats(userDoc.data()?.stats?.socialGames);

                        const nextSocialStats = {
                            lurdinhaPlayed: existingSocialStats.lurdinhaPlayed + (gameHistorySnapshot.gameType === 'lurdinha' ? 1 : 0),
                            drawPlayed: existingSocialStats.drawPlayed + (gameHistorySnapshot.gameType === 'draw' ? 1 : 0),
                            lurdinhaWins: existingSocialStats.lurdinhaWins + (gameHistorySnapshot.gameType === 'lurdinha' && player.isWinner ? 1 : 0),
                            bestDrawScore: gameHistorySnapshot.gameType === 'draw'
                                ? Math.max(existingSocialStats.bestDrawScore, player.score || 0)
                                : existingSocialStats.bestDrawScore,
                            achievements: {
                                detective: existingSocialStats.achievements.detective + (player.achievements.detective ? 1 : 0),
                                relampago: existingSocialStats.achievements.relampago + (player.achievements.relampago ? 1 : 0),
                            },
                        };

                        transaction.set(userRef, {
                            uid: userDoc.exists() ? (userDoc.data()?.uid || player.uid) : player.uid,
                            displayName: userDoc.exists() ? (userDoc.data()?.displayName || player.name) : player.name,
                            photoURL: userDoc.exists() ? (userDoc.data()?.photoURL || player.photoURL || null) : (player.photoURL || null),
                            createdAt: userDoc.exists() ? (userDoc.data()?.createdAt || serverTimestamp()) : serverTimestamp(),
                            stats: {
                                ...existingStats,
                                socialGames: nextSocialStats,
                            },
                        }, { merge: true });
                    }

                    transaction.update(roomRef, {
                        status: 'finished',
                        players: gameHistorySnapshot.normalizedPlayers,
                        finishedAt: serverTimestamp(),
                        historySavedAt: serverTimestamp(),
                    });
                });
            } else {
                // We need to fetch current state to get the queue and current round
                // Or we can rely on what the UI passes, but for safety let's transaction or read-write
                // For simplicity here (and since only Host calls it), we'll do getDoc first.

                const roomDoc = await getDoc(roomRef);
                if (!roomDoc.exists()) throw new Error("Room not found");

                const data = roomDoc.data();
                const nextRoundNum = (data.currentRound || 0) + 1;

                if (data.settings?.gameType === 'draw') {
                    const nextWord = data.drawWordsQueue?.[nextRoundNum - 1] || 'desenho';
                    const nextDrawerId = data.drawerQueue?.[nextRoundNum - 1] || data.hostId;

                    await updateDoc(roomRef, {
                        status: 'playing',
                        currentRound: nextRoundNum,
                        roundData: createDrawRoundData(nextWord, nextDrawerId),
                    });
                    return;
                }

                const nextQuestion = data.questionsQueue ? data.questionsQueue[nextRoundNum - 1] : "Pergunta Extra";

                await updateDoc(roomRef, {
                    status: 'playing',
                    currentRound: nextRoundNum,
                    roundData: {
                        question: nextQuestion,
                        startTime: serverTimestamp(),
                        answers: {},
                        results: null
                    }
                });
            }
        } catch (err) {
            console.error('Error starting next round:', err);
            throw err;
        }
    };

    const addDrawingStroke = async (roomId, stroke) => {
        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (!roomDoc.exists()) {
                    throw new Error('Sala não encontrada.');
                }

                const roomData = roomDoc.data();
                const currentStrokes = roomData.roundData?.strokes || [];
                transaction.update(roomRef, {
                    'roundData.strokes': [...currentStrokes, stroke],
                });
            });
        } catch (err) {
            console.error('Error adding drawing stroke:', err);
            throw err;
        }
    };

    const clearDrawing = async (roomId) => {
        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            await updateDoc(roomRef, {
                'roundData.strokes': [],
            });
        } catch (err) {
            console.error('Error clearing drawing:', err);
            throw err;
        }
    };

    const setCanvasFill = async (roomId, fillColor) => {
        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            await updateDoc(roomRef, {
                'roundData.canvasFill': fillColor || DEFAULT_DRAW_CANVAS_FILL,
            });
        } catch (err) {
            console.error('Error setting canvas fill:', err);
            throw err;
        }
    };

    const sendChatGuess = async (roomId, message) => {
        if (!currentUser) return { correct: false };

        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            return await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (!roomDoc.exists()) {
                    throw new Error('Sala não encontrada.');
                }

                const roomData = roomDoc.data();
                const roundData = roomData.roundData || {};
                const trimmedMessage = message.trim();

                if (!trimmedMessage) {
                    return { correct: false };
                }

                if (roomData.settings?.gameType !== 'draw' || roomData.status !== 'playing') {
                    return { correct: false };
                }

                if (roundData.drawerId === currentUser.uid) {
                    return { correct: false };
                }

                if ((roundData.correctlyGuessed || []).includes(currentUser.uid)) {
                    return { correct: false };
                }

                const player = roomData.players.find((item) => item.uid === currentUser.uid);
                if (!player) {
                    return { correct: false };
                }

                const isCorrect = normalizeText(trimmedMessage) === normalizeText(roundData.word);
                const chatMessages = [...(roundData.chatMessages || [])];

                if (isCorrect) {
                    chatMessages.push({
                        id: `correct-${currentUser.uid}-${Date.now()}`,
                        uid: currentUser.uid,
                        name: player.name,
                        type: 'correct',
                        text: `${player.name} acertou!`,
                        createdAt: Date.now(),
                    });

                    transaction.update(roomRef, {
                        'roundData.chatMessages': chatMessages,
                        'roundData.correctlyGuessed': [...(roundData.correctlyGuessed || []), currentUser.uid],
                        [`roundData.guesses.${currentUser.uid}`]: {
                            guess: trimmedMessage,
                            guessedAt: Date.now(),
                        },
                    });
                } else {
                    chatMessages.push({
                        id: `guess-${currentUser.uid}-${Date.now()}`,
                        uid: currentUser.uid,
                        name: player.name,
                        type: 'guess',
                        text: trimmedMessage,
                        createdAt: Date.now(),
                    });

                    transaction.update(roomRef, {
                        'roundData.chatMessages': chatMessages,
                    });
                }

                return { correct: isCorrect };
            });
        } catch (err) {
            console.error('Error sending chat guess:', err);
            throw err;
        }
    };

    // ── #4: Dica paga — desenhista revela 1 letra, paga -2 pts (máx 2 dicas por rodada)
    const revealHint = async (roomId) => {
        if (!currentUser) return;
        const MAX_HINTS = 2;
        const roomRef = doc(db, 'game_rooms', roomId);
        try {
            await runTransaction(db, async (tx) => {
                const roomDoc = await tx.get(roomRef);
                if (!roomDoc.exists()) return;
                const data = roomDoc.data();
                const roundData = data.roundData || {};
                if (roundData.drawerId !== currentUser.uid) return;
                if ((roundData.hintsUsed || 0) >= MAX_HINTS) return;
                if (data.status !== 'playing') return;

                const revealedHintIndices = roundData.revealedHintIndices || [];
                const hiddenIndices = getHiddenCharacterIndices(roundData.word, revealedHintIndices);
                if (hiddenIndices.length === 0) return;

                const randomIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
                const nextRevealedHintIndices = [...revealedHintIndices, randomIndex].sort((a, b) => a - b);
                const newMaskedWord = maskWord(roundData.word, nextRevealedHintIndices);

                const updatedPlayers = data.players.map((player) => {
                    if (player.uid === currentUser.uid) {
                        return { ...player, score: (player.score || 0) - 2 };
                    }
                    return player;
                });

                tx.update(roomRef, {
                    'roundData.maskedWord': newMaskedWord,
                    'roundData.hintsUsed': (roundData.hintsUsed || 0) + 1,
                    'roundData.revealedHintIndices': nextRevealedHintIndices,
                    players: updatedPlayers,
                });
            });
        } catch (err) {
            console.error('[revealHint] Error:', err);
        }
    };

    const restartRoom = async (roomId) => {
        if (!currentUser) return;
        setLoading(true);
        setError(null);

        try {
            const roomRef = doc(db, 'game_rooms', roomId);

            await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (!roomDoc.exists()) {
                    throw new Error('Sala não encontrada.');
                }

                const roomData = roomDoc.data();
                if (roomData.hostId !== currentUser.uid) {
                    throw new Error('Apenas o host pode iniciar a revanche.');
                }
                if (roomData.status !== 'finished') {
                    throw new Error('A partida ainda não terminou.');
                }

                const resetPlayers = (roomData.players || []).map((player) => ({
                    ...player,
                    score: 0,
                    consecutiveGuesses: 0,
                    isReady: true,
                    unlockedAchievements: ensureMatchAchievements(),
                }));

                transaction.update(roomRef, {
                    status: 'waiting',
                    currentRound: 0,
                    players: resetPlayers,
                    roundData: null,
                    drawWordsQueue: [],
                    drawerQueue: [],
                    questionsQueue: [],
                    finishedAt: null,
                    historySavedAt: null,
                    updatedAt: serverTimestamp(),
                });
            });
            setLoading(false);
        } catch (err) {
            console.error('Error restarting room:', err);
            setError(err.message || 'Erro ao iniciar revanche.');
            setLoading(false);
            throw err;
        }
    };

    // Deprecated helper, kept for safety but replaced by nextRound logic above
    const incrementRound = nextRound;

    const leaveRoom = () => {
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }
        setGameState(null);
    };

    return {
        loading,
        error,
        gameState,
        createRoom,
        joinRoom,
        listenToRoom,
        startGame,
        submitAnswer,
        calculateRoundResults,
        nextRound: incrementRound,
        addDrawingStroke,
        clearDrawing,
        setCanvasFill,
        sendChatGuess,
        removeFromRoom,
        revealHint,
        restartRoom,
        leaveRoom,
    };
}
