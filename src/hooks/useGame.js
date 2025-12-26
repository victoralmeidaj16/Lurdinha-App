import { useState, useEffect, useRef } from 'react';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    onSnapshot,
    arrayUnion,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

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
                    ...settings
                },
                currentRound: 0,
                createdAt: serverTimestamp(),
                players: [
                    {
                        uid: currentUser.uid,
                        name: currentUser.displayName || 'Host',
                        photoURL: currentUser.photoURL,
                        score: 0, // Total Lurdinhas
                        isReady: true
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
                        isReady: true
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

    // Helper to generate questions (Mock for now, can be replaced by DB fetch)
    const fetchQuestions = (count, theme) => {
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

    // Calculate round results (Host only)
    // Logic: 
    // 1. Count frequency of each answer (normalized).
    // 2. Find the max frequency.
    // 3. Identify majority answer(s).
    // 4. Assign Lurdinhas to those who didn't match majority.
    const calculateRoundResults = async (roomId, currentGameState) => {
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
                await updateDoc(roomRef, {
                    status: 'finished'
                });
            } else {
                // We need to fetch current state to get the queue and current round
                // Or we can rely on what the UI passes, but for safety let's transaction or read-write
                // For simplicity here (and since only Host calls it), we'll do getDoc first.

                const roomDoc = await getDoc(roomRef);
                if (!roomDoc.exists()) throw new Error("Room not found");

                const data = roomDoc.data();
                const nextRoundNum = (data.currentRound || 0) + 1;
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
        nextRound: incrementRound, // Exposing as nextRound
        leaveRoom
    };
}
