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
import { sendPushNotification } from './usePushNotifications';
import {
    ensureSocialGameStats,
    ensureUserStats,
} from '../utils/socialGames';
import {
    cacheSocialGameRoomPatch,
    cacheSocialGameRoomSnapshot,
    clearActiveSocialGameRoom,
    hydrateSocialGameRoomCache,
    markActiveSocialGameRoom,
} from '../utils/socialGameRoomCache';
import {
    buildGameHistorySnapshot,
    buildRestartState,
    createLobbyPlayer,
    normalizePlayerProgress,
    sanitizeRoomSettings,
} from './game/normalizers';
import {
    buildChatGuessUpdate,
    buildDrawGameStart,
    buildNextDrawRound,
    buildReportDrawingUpdate,
    buildRevealHintUpdate,
    calculateDrawRoundOutcome,
    DEFAULT_DRAW_CANVAS_FILL,
} from './game/draw';
import {
    buildLurdinhaGameStart,
    buildNextLurdinhaRound,
    calculateLurdinhaRoundOutcome,
    DEFAULT_LURDINHA_THEME,
} from './game/lurdinha';
import {
    buildSecretGameStart,
    buildSubmitSecretPhrase,
    buildSubmitSecretDrawing,
    buildNextSecretTurn,
} from './game/secret';
import {
    buildMostLikelyGameStart,
    buildNextMostLikelyRound,
    calculateMostLikelyRoundOutcome,
    DEFAULT_MOST_LIKELY_CATEGORY,
} from './game/mostLikely';
import {
    buildObviousMindGameStart,
    buildNextObviousMindRound,
    calculateObviousMindRoundOutcome,
} from './game/obviousMind';
import {
    buildTierListGameStart,
    buildNextTierListRound,
    calculateTierListRoundOutcome,
    DEFAULT_TIER_LIST_CATEGORY,
} from './game/tierList';
import {
    buildImpostorGameStart,
    buildNextImpostorRound,
    buildAdvanceImpostorToDiscussion,
    buildAdvanceImpostorToVoting,
    calculateImpostorRoundOutcome,
} from './game/impostor';

const SECRET_GAME_TYPES = new Set(['secret', 'telephone']);

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
                settings: sanitizeRoomSettings(settings),
                currentRound: 0,
                createdAt: serverTimestamp(),
                players: [createLobbyPlayer(currentUser, 'Host')],
                roundData: null
            };

            console.log('[createRoom] Attempting to create room doc', roomId);
            await setDoc(roomRef, initialData);
            cacheSocialGameRoomSnapshot(roomId, initialData);
            await markActiveSocialGameRoom(roomId, initialData);
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

    const inviteGroupToRoom = async (roomId, groupId) => {
        if (!currentUser) throw new Error('Usuário não autenticado.');
        if (!roomId || !groupId) throw new Error('Sala ou grupo inválido.');

        setLoading(true);
        setError(null);

        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            const groupRef = doc(db, 'groups', groupId);
            const [roomDoc, groupDoc] = await Promise.all([
                getDoc(roomRef),
                getDoc(groupRef),
            ]);

            if (!roomDoc.exists()) throw new Error('Sala não encontrada.');
            if (!groupDoc.exists()) throw new Error('Grupo não encontrado.');

            const roomData = roomDoc.data();
            const groupData = groupDoc.data();
            const groupAdmins = Array.isArray(groupData.admins) ? groupData.admins : [];
            const groupMembers = Array.isArray(groupData.members) ? groupData.members : [];

            if (roomData.hostId !== currentUser.uid) {
                throw new Error('Apenas o admin da sala pode convidar grupos.');
            }

            if (!groupAdmins.includes(currentUser.uid)) {
                throw new Error('Apenas admins do grupo podem enviar este convite.');
            }

            if (roomData.status !== 'waiting') {
                throw new Error('Só é possível convidar grupos enquanto a sala está no lobby.');
            }

            const invitedByName = currentUser.displayName || currentUser.email || 'Admin';
            const inviteCache = {
                groupId,
                groupName: groupData.name || 'Grupo',
                groupColor: groupData.color || null,
                groupBadge: groupData.badge || null,
                invitedBy: currentUser.uid,
                invitedByName,
                memberIds: groupMembers,
                invitedAt: Date.now(),
            };
            const patch = {
                groupInvite: {
                    ...inviteCache,
                    invitedAt: serverTimestamp(),
                },
                invitedGroupId: groupId,
                invitedGroupName: inviteCache.groupName,
                invitedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await updateDoc(roomRef, patch);
            cacheSocialGameRoomPatch(roomId, roomData, {
                ...patch,
                groupInvite: inviteCache,
                invitedAt: Date.now(),
                updatedAt: Date.now(),
            });

            try {
                const playerIds = new Set((roomData.players || []).map((player) => player.uid));
                const targets = groupMembers.filter((uid) => uid !== currentUser.uid && !playerIds.has(uid));
                const userDocs = await Promise.all(targets.map((uid) => getDoc(doc(db, 'users', uid))));
                const tokens = userDocs
                    .filter((userDoc) => userDoc.exists())
                    .map((userDoc) => userDoc.data().expoPushToken)
                    .filter(Boolean);

                if (tokens.length > 0) {
                    sendPushNotification(
                        tokens,
                        'Convite para jogar agora',
                        `${invitedByName} chamou ${inviteCache.groupName} para entrar na sala ${roomId}.`,
                        {
                            type: 'ROOM_GROUP_INVITE',
                            roomId,
                            groupId,
                        }
                    ).catch((error) => console.error('[inviteGroupToRoom] Push notification error:', error));
                }
            } catch (notifErr) {
                console.error('[inviteGroupToRoom] Push notification error:', notifErr);
            }

            return {
                roomId,
                groupId,
                groupName: inviteCache.groupName,
            };
        } catch (err) {
            console.error('[inviteGroupToRoom] Error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
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

            // Check if already in room
            const isAlreadyIn = roomData.players.some(p => p.uid === currentUser.uid);

            if (roomData.status !== 'waiting' && !isAlreadyIn) {
                throw new Error('A partida já começou.');
            }

            if (!isAlreadyIn) {
                const nextPlayer = createLobbyPlayer(currentUser, 'Jogador');
                const patch = {
                    players: [...(roomData.players || []), nextPlayer]
                };
                await updateDoc(roomRef, {
                    players: arrayUnion(nextPlayer)
                });
                cacheSocialGameRoomPatch(roomId, roomData, patch);
            } else {
                cacheSocialGameRoomSnapshot(roomId, roomData);
            }

            await markActiveSocialGameRoom(roomId, roomData);

            setLoading(false);
            return roomData;
        } catch (err) {
            if (__DEV__) {
                console.log('[joinRoom]', err?.message || err);
            }
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

        let isActive = true;

        hydrateSocialGameRoomCache(roomId).then((cachedData) => {
            if (!isActive || !cachedData) return;

            setGameState(cachedData);
            if (callback) callback(cachedData, { fromCache: true });
        });

        const unsubscribe = onSnapshot(roomRef, { includeMetadataChanges: true }, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                if (!docSnapshot.metadata.fromCache) {
                    cacheSocialGameRoomSnapshot(roomId, data);
                    markActiveSocialGameRoom(roomId, data);
                }
                setGameState(data);
                if (callback) callback(data, { fromCache: docSnapshot.metadata.fromCache });
            } else {
                const message = 'Sala encerrada ou não encontrada.';
                clearActiveSocialGameRoom(roomId);
                setError(message);
                setGameState(null);
                if (callback) callback(null, { error: true, message });
            }
        }, (err) => {
            console.error('Error listening to room:', err);
            const message = 'Erro de conexão com a sala.';
            setError(message);
            if (callback) callback(null, { error: true, message });
        });

        const stopListening = () => {
            isActive = false;
            unsubscribe();
        };

        unsubscribeRef.current = stopListening;
        return stopListening;
    };

    // Remove current user from room players array (call on lobby exit)
    const removeFromRoom = async (roomId) => {
        if (!currentUser) return;
        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            const roomDoc = await getDoc(roomRef);
            if (!roomDoc.exists()) return;

            const roomData = roomDoc.data();
            // Permite sair mesmo se o jogo já começou (playing, etc)
            if (roomData.status === 'finished') return;

            const players = Array.isArray(roomData.players) ? roomData.players : [];
            const playerEntry = players.find(p => p.uid === currentUser.uid);
            if (playerEntry) {
                const remainingPlayers = players.filter(p => p.uid !== currentUser.uid);
                const patch = {
                    players: arrayRemove(playerEntry),
                };

                if (remainingPlayers.length === 0) {
                    patch.status = 'abandoned';
                    patch.abandonedAt = serverTimestamp();
                }

                await updateDoc(roomRef, patch);
                await clearActiveSocialGameRoom(roomId);
            }
        } catch (err) {
            console.error('[removeFromRoom] Error:', err);
        }
    };

    // Start the game (Host only)
    const startGame = async (roomId, totalRounds = 5, theme = DEFAULT_LURDINHA_THEME) => {
        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            const roomDoc = await getDoc(roomRef);
            if (!roomDoc.exists()) {
                throw new Error('Sala não encontrada.');
            }

            const roomData = roomDoc.data();
            const gameType = roomData.settings?.gameType || 'lurdinha';

            if (gameType === 'party') {
                const sequencePool = ['lurdinha', 'draw', 'most_likely', 'obvious_mind'];
                const sequence = [];
                for (let i = 0; i < totalRounds; i++) {
                    sequence.push(sequencePool[i % sequencePool.length]);
                }
                const patch = {
                    status: 'party_transition',
                    partySession: {
                        type: 'automatica',
                        gamesSequence: sequence,
                        currentGameIndex: 0,
                        globalScores: {},
                        totalGames: totalRounds
                    }
                };
                await updateDoc(roomRef, patch);
                cacheSocialGameRoomPatch(roomId, roomData, patch);
                return;
            }

            if (gameType === 'draw') {
                const patch = buildDrawGameStart({
                    roomData,
                    totalRounds,
                    startTimeFactory: serverTimestamp,
                });
                await updateDoc(roomRef, patch);
                cacheSocialGameRoomPatch(roomId, roomData, patch);
                return;
            }

            if (SECRET_GAME_TYPES.has(gameType)) {
                const patch = buildSecretGameStart({
                    roomData,
                    totalTurnsFactory: (len) => (len || 2) + 1,
                    startTimeFactory: serverTimestamp,
                });
                await updateDoc(roomRef, patch);
                cacheSocialGameRoomPatch(roomId, roomData, patch);
                return;
            }

            if (gameType === 'most_likely') {
                const patch = buildMostLikelyGameStart({
                    totalRounds,
                    category: roomData.settings?.category || DEFAULT_MOST_LIKELY_CATEGORY,
                });
                await updateDoc(roomRef, patch);
                cacheSocialGameRoomPatch(roomId, roomData, patch);
                return;
            }

            if (gameType === 'obvious_mind') {
                const patch = buildObviousMindGameStart({
                    roomData,
                    totalRounds,
                });
                await updateDoc(roomRef, patch);
                cacheSocialGameRoomPatch(roomId, roomData, patch);
                return;
            }

            if (gameType === 'tier_list') {
                if ((roomData.players || []).length < 2) {
                    throw new Error('Tier List da Galera precisa de pelo menos 2 jogadores.');
                }

                const patch = buildTierListGameStart({
                    totalRounds,
                    category: roomData.settings?.category || DEFAULT_TIER_LIST_CATEGORY,
                });
                await updateDoc(roomRef, patch);
                cacheSocialGameRoomPatch(roomId, roomData, patch);
                return;
            }

            if (gameType === 'impostor') {
                if ((roomData.players || []).length < 3) {
                    throw new Error('Impostor precisa de pelo menos 3 jogadores.');
                }
                const patch = buildImpostorGameStart({ roomData, totalRounds });
                await updateDoc(roomRef, patch);
                cacheSocialGameRoomPatch(roomId, roomData, patch);
                return;
            }

            const patch = buildLurdinhaGameStart({ totalRounds, theme });
            await updateDoc(roomRef, patch);
            cacheSocialGameRoomPatch(roomId, roomData, patch);
        } catch (err) {
            console.error('Error starting game:', err);
            setError('Erro ao iniciar partida.');
            throw err;
        }
    };

    const continuePartySession = async (roomId) => {
        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            const roomDoc = await getDoc(roomRef);
            if (!roomDoc.exists()) return;

            const roomData = roomDoc.data();
            const session = roomData.partySession;
            if (!session) return;

            const currentGameType = session.gamesSequence[session.currentGameIndex];

            // 3 sub-rounds minigames in party mode
            if (currentGameType === 'draw') {
                const settingsUpdate = { ...roomData.settings, gameType: 'draw', totalRounds: 3 };
                const patch = {
                    settings: settingsUpdate,
                    ...buildDrawGameStart({
                        roomData: { ...roomData, settings: settingsUpdate },
                        totalRounds: 3,
                        startTimeFactory: serverTimestamp,
                    })
                };
                await updateDoc(roomRef, patch);
                cacheSocialGameRoomPatch(roomId, roomData, patch);
            } else if (SECRET_GAME_TYPES.has(currentGameType)) {
                const settingsUpdate = { ...roomData.settings, gameType: 'secret' };
                const patch = {
                    settings: settingsUpdate,
                    ...buildSecretGameStart({
                        roomData: { ...roomData, settings: settingsUpdate },
                        startTimeFactory: serverTimestamp,
                    })
                };
                await updateDoc(roomRef, patch);
                cacheSocialGameRoomPatch(roomId, roomData, patch);
            } else if (currentGameType === 'most_likely') {
                const settingsUpdate = {
                    ...roomData.settings,
                    gameType: 'most_likely',
                    totalRounds: 3,
                    category: roomData.settings?.category || DEFAULT_MOST_LIKELY_CATEGORY,
                    voteMode: roomData.settings?.voteMode || 'secret',
                    allowSelfVote: false,
                };
                const patch = {
                    settings: settingsUpdate,
                    ...buildMostLikelyGameStart({
                        totalRounds: 3,
                        category: settingsUpdate.category,
                    })
                };
                await updateDoc(roomRef, patch);
                cacheSocialGameRoomPatch(roomId, roomData, patch);
            } else if (currentGameType === 'obvious_mind') {
                const settingsUpdate = {
                    ...roomData.settings,
                    gameType: 'obvious_mind',
                    totalRounds: 3,
                };
                const patch = {
                    settings: settingsUpdate,
                    ...buildObviousMindGameStart({
                        roomData: { ...roomData, settings: settingsUpdate },
                        totalRounds: 3,
                    })
                };
                await updateDoc(roomRef, patch);
                cacheSocialGameRoomPatch(roomId, roomData, patch);
            } else {
                const settingsUpdate = { ...roomData.settings, gameType: 'lurdinha', totalRounds: 3 };
                const patch = {
                    settings: settingsUpdate,
                    ...buildLurdinhaGameStart({ totalRounds: 3, theme: roomData.settings?.theme || DEFAULT_LURDINHA_THEME })
                };
                await updateDoc(roomRef, patch);
                cacheSocialGameRoomPatch(roomId, roomData, patch);
            }
        } catch (err) {
            console.error('Error continuing party session', err);
            throw err;
        }
    };

    // Submit an answer
    const submitAnswer = async (roomId, answer) => {
        if (!currentUser) return;

        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            const patch = {
                [`roundData.answers.${currentUser.uid}`]: answer
            };
            await updateDoc(roomRef, patch);
            cacheSocialGameRoomPatch(roomId, gameState, patch);
        } catch (err) {
            console.error('Error submitting answer:', err);
            throw err;
        }
    };

    const submitSecretPhrase = async (roomId, phrase) => {
        if (!currentUser) return;
        let cachedBaseState = null;
        let cachedPatch = null;
        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            await runTransaction(db, async (tx) => {
                const roomDoc = await tx.get(roomRef);
                if (!roomDoc.exists()) return;
                const update = buildSubmitSecretPhrase({ roomData: roomDoc.data(), currentUserId: currentUser.uid, phrase });
                if (update) {
                    cachedBaseState = roomDoc.data();
                    cachedPatch = update;
                    tx.update(roomRef, update);

                    const updatedReady = update['roundData.readyPlayers'];
                    const playersCount = roomDoc.data().players?.length || 1;
                    if (updatedReady && updatedReady.length >= playersCount) {
                        const roomDataMock = { ...roomDoc.data() };
                        roomDataMock.roundData = { ...roomDataMock.roundData, readyPlayers: updatedReady };

                        const nextTurnUpdate = buildNextSecretTurn({
                            roomData: roomDataMock,
                            startTimeFactory: serverTimestamp,
                        });
                        cachedPatch = {
                            ...cachedPatch,
                            ...nextTurnUpdate,
                        };
                        tx.update(roomRef, nextTurnUpdate);
                    }
                }
            });
            if (cachedBaseState && cachedPatch) {
                cacheSocialGameRoomPatch(roomId, cachedBaseState, cachedPatch);
            }
        } catch (error) {
            console.error('Error Secret Phrase:', error);
            throw error;
        }
    };

    const submitSecretDrawing = async (roomId, { strokes, canvasFill }) => {
        if (!currentUser) return;
        let cachedBaseState = null;
        let cachedPatch = null;
        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            await runTransaction(db, async (tx) => {
                const roomDoc = await tx.get(roomRef);
                if (!roomDoc.exists()) return;
                const update = buildSubmitSecretDrawing({
                    roomData: roomDoc.data(),
                    currentUserId: currentUser.uid,
                    strokes,
                    canvasFill,
                });
                if (update) {
                    cachedBaseState = roomDoc.data();
                    cachedPatch = update;
                    tx.update(roomRef, update);

                    const updatedReady = update['roundData.readyPlayers'];
                    const playersCount = roomDoc.data().players?.length || 1;
                    if (updatedReady && updatedReady.length >= playersCount) {
                        const roomDataMock = { ...roomDoc.data() };
                        roomDataMock.roundData = { ...roomDataMock.roundData, readyPlayers: updatedReady };

                        const nextTurnUpdate = buildNextSecretTurn({
                            roomData: roomDataMock,
                            startTimeFactory: serverTimestamp,
                        });
                        cachedPatch = {
                            ...cachedPatch,
                            ...nextTurnUpdate,
                        };
                        tx.update(roomRef, nextTurnUpdate);
                    }
                }
            });
            if (cachedBaseState && cachedPatch) {
                cacheSocialGameRoomPatch(roomId, cachedBaseState, cachedPatch);
            }
        } catch (error) {
            console.error('Error Secret Drawing:', error);
            throw error;
        }
    };

    const calculateRoundResults = async (roomId, currentGameState) => {
        if (currentGameState?.settings?.gameType === 'draw') {
            const roomRef = doc(db, 'game_rooms', roomId);
            let cachedBaseState = null;
            let cachedPatch = null;

            try {
                // ── #1: Estado fresco via runTransaction para evitar stale closure
                // e race conditions entre o timer e o gatilho "todos acertaram".
                await runTransaction(db, async (tx) => {
                    const roomDoc = await tx.get(roomRef);
                    if (!roomDoc.exists()) throw new Error('Sala não encontrada.');

                    const freshData = roomDoc.data();

                    // Guard: outro caller já calculou os resultados desta rodada
                    if (freshData.status === 'round_results') return;

                    const outcome = calculateDrawRoundOutcome({
                        roomData: freshData,
                        normalizePlayerProgress,
                    });

                    const patch = {
                        status: 'round_results',
                        players: outcome.players,
                        'roundData.results': outcome.results,
                    };

                    cachedBaseState = freshData;
                    cachedPatch = patch;
                    tx.update(roomRef, patch);
                });
                if (cachedBaseState && cachedPatch) {
                    cacheSocialGameRoomPatch(roomId, cachedBaseState, cachedPatch);
                }
                return;
            } catch (err) {
                console.error('Error calculating draw results:', err);
                throw err;
            }
        }

        if (currentGameState?.settings?.gameType === 'most_likely') {
            try {
                const outcome = calculateMostLikelyRoundOutcome(currentGameState);
                const roomRef = doc(db, 'game_rooms', roomId);
                const patch = {
                    status: 'round_results',
                    players: outcome.players,
                    'roundData.results': outcome.results,
                };

                await updateDoc(roomRef, patch);
                cacheSocialGameRoomPatch(roomId, currentGameState, patch);
                return;
            } catch (err) {
                console.error('Error calculating most likely results:', err);
                throw err;
            }
        }

        if (currentGameState?.settings?.gameType === 'obvious_mind') {
            try {
                const outcome = calculateObviousMindRoundOutcome(currentGameState);
                const roomRef = doc(db, 'game_rooms', roomId);
                const patch = {
                    status: 'round_results',
                    players: outcome.players,
                    'roundData.results': outcome.results,
                };

                await updateDoc(roomRef, patch);
                cacheSocialGameRoomPatch(roomId, currentGameState, patch);
                return;
            } catch (err) {
                console.error('Error calculating obvious mind results:', err);
                throw err;
            }
        }

        if (currentGameState?.settings?.gameType === 'tier_list') {
            const roomRef = doc(db, 'game_rooms', roomId);
            let cachedBaseState = null;
            let cachedPatch = null;

            try {
                await runTransaction(db, async (tx) => {
                    const roomDoc = await tx.get(roomRef);
                    if (!roomDoc.exists()) throw new Error('Sala não encontrada.');

                    const freshData = roomDoc.data();
                    if (freshData.status === 'round_results') return;

                    const outcome = calculateTierListRoundOutcome(freshData);
                    const patch = {
                        status: 'round_results',
                        players: outcome.players,
                        'roundData.results': outcome.results,
                    };

                    cachedBaseState = freshData;
                    cachedPatch = patch;
                    tx.update(roomRef, patch);
                });
                if (cachedBaseState && cachedPatch) {
                    cacheSocialGameRoomPatch(roomId, cachedBaseState, cachedPatch);
                }
                return;
            } catch (err) {
                console.error('Error calculating tier list results:', err);
                throw err;
            }
        }

        if (currentGameState?.settings?.gameType === 'impostor') {
            const roomRef = doc(db, 'game_rooms', roomId);
            let cachedBaseState = null;
            let cachedPatch = null;
            try {
                await runTransaction(db, async (tx) => {
                    const roomDoc = await tx.get(roomRef);
                    if (!roomDoc.exists()) throw new Error('Sala não encontrada.');
                    const freshData = roomDoc.data();
                    if (freshData.status === 'round_results') return;
                    const outcome = calculateImpostorRoundOutcome(freshData);
                    const patch = {
                        status: 'round_results',
                        players: outcome.players,
                        'roundData.results': outcome.results,
                    };
                    cachedBaseState = freshData;
                    cachedPatch = patch;
                    tx.update(roomRef, patch);
                });
                if (cachedBaseState && cachedPatch) {
                    cacheSocialGameRoomPatch(roomId, cachedBaseState, cachedPatch);
                }
                return;
            } catch (err) {
                console.error('Error calculating impostor results:', err);
                throw err;
            }
        }

        try {
            const outcome = calculateLurdinhaRoundOutcome(currentGameState);

            const roomRef = doc(db, 'game_rooms', roomId);
            const patch = {
                status: 'round_results',
                players: outcome.players,
                'roundData.results': outcome.results
            };

            await updateDoc(roomRef, patch);
            cacheSocialGameRoomPatch(roomId, currentGameState, patch);

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
                const roomDoc = await getDoc(roomRef);
                if (!roomDoc.exists()) throw new Error('Sala não encontrada.');

                let data = roomDoc.data();
                if (data.status === 'finished') return;

                if (SECRET_GAME_TYPES.has(data.settings?.gameType)) {
                    const patch = {
                        status: 'finished',
                        finishedAt: serverTimestamp(),
                        historySavedAt: serverTimestamp(),
                    };
                    await updateDoc(roomRef, patch);
                    cacheSocialGameRoomPatch(roomId, data, patch);
                    return;
                }

                if (data.partySession) {
                    const newScores = { ...data.partySession.globalScores };
                    const currentSubGame = data.settings?.gameType || 'lurdinha';

                    // Lurdinha uses penalty scoring (lower = better), so we invert it
                    // to match draw/secret which use reward scoring (higher = better).
                    if (currentSubGame === 'lurdinha') {
                        const maxLurdinhas = Math.max(...data.players.map(p => p.score || 0), 1);
                        data.players.forEach(p => {
                            const survivalPoints = maxLurdinhas - (p.score || 0);
                            newScores[p.uid] = (newScores[p.uid] || 0) + survivalPoints;
                        });
                    } else {
                        data.players.forEach(p => {
                            newScores[p.uid] = (newScores[p.uid] || 0) + (p.score || 0);
                        });
                    }

                    const nextIndex = data.partySession.currentGameIndex + 1;
                    const isLastPartyGame = nextIndex >= data.partySession.gamesSequence.length;

                    if (!isLastPartyGame) {
                        const patch = {
                            status: 'party_transition',
                            'partySession.currentGameIndex': nextIndex,
                            'partySession.globalScores': newScores,
                            players: data.players.map(p => ({ ...p, score: 0 }))
                        };
                        await updateDoc(roomRef, patch);
                        cacheSocialGameRoomPatch(roomId, data, patch);
                        return;
                    } else {
                        // Finale: update the mock data so history gets real cumulative global scores
                        data.players = data.players.map(p => ({
                            ...p,
                            score: newScores[p.uid] || 0
                        }));
                    }
                }

                const gameHistorySnapshot = buildGameHistorySnapshot(roomId, data);

                try {
                    let cachedBaseState = null;
                    let cachedPatch = null;
                    await runTransaction(db, async (transaction) => {
                        const freshRoomDoc = await transaction.get(roomRef);
                        if (!freshRoomDoc.exists()) throw new Error('Sala não encontrada.');

                        const freshData = freshRoomDoc.data();
                        if (freshData.status === 'finished') return;

                        const historyRef = doc(collection(db, 'game_history'));
                        const playerDocs = await Promise.all(
                            gameHistorySnapshot.historyPlayers.map(async (player) => {
                                const userRef = doc(db, 'users', player.uid);
                                const userDoc = await transaction.get(userRef);
                                return { player, userRef, userDoc };
                            })
                        );

                        transaction.set(historyRef, {
                            roomId,
                            hostId: freshData.hostId,
                            gameType: gameHistorySnapshot.gameType,
                            settings: freshData.settings || {},
                            createdAt: freshData.createdAt || serverTimestamp(),
                            finishedAt: serverTimestamp(),
                            participantIds: gameHistorySnapshot.participantIds,
                            winnerIds: gameHistorySnapshot.winnerIds,
                            players: gameHistorySnapshot.historyPlayers,
                        });

                        for (const { player, userRef, userDoc } of playerDocs) {
                            const existingStats = ensureUserStats(userDoc.data()?.stats);
                            const existingSocialStats = ensureSocialGameStats(userDoc.data()?.stats?.socialGames);

                            const isSecret = gameHistorySnapshot.gameType === 'secret' || gameHistorySnapshot.gameType === 'telephone';
                            const nextSocialStats = {
                                lurdinhaPlayed: existingSocialStats.lurdinhaPlayed + (gameHistorySnapshot.gameType === 'lurdinha' ? 1 : 0),
                                drawPlayed: existingSocialStats.drawPlayed + (gameHistorySnapshot.gameType === 'draw' ? 1 : 0),
                                secretPlayed: existingSocialStats.secretPlayed + (isSecret ? 1 : 0),
                                mostLikelyPlayed: existingSocialStats.mostLikelyPlayed + (gameHistorySnapshot.gameType === 'most_likely' ? 1 : 0),
                                obviousMindPlayed: existingSocialStats.obviousMindPlayed + (gameHistorySnapshot.gameType === 'obvious_mind' ? 1 : 0),
                                tierListPlayed: existingSocialStats.tierListPlayed + (gameHistorySnapshot.gameType === 'tier_list' ? 1 : 0),
                                impostorPlayed: existingSocialStats.impostorPlayed + (gameHistorySnapshot.gameType === 'impostor' ? 1 : 0),
                                lurdinhaWins: existingSocialStats.lurdinhaWins + (gameHistorySnapshot.gameType === 'lurdinha' && player.isWinner ? 1 : 0),
                                bestDrawScore: gameHistorySnapshot.gameType === 'draw'
                                    ? Math.max(existingSocialStats.bestDrawScore, player.score || 0)
                                    : existingSocialStats.bestDrawScore,
                                secretWins: existingSocialStats.secretWins + (isSecret && player.isWinner ? 1 : 0),
                                mostLikelyWins: existingSocialStats.mostLikelyWins + (gameHistorySnapshot.gameType === 'most_likely' && player.isWinner ? 1 : 0),
                                obviousMindWins: existingSocialStats.obviousMindWins + (gameHistorySnapshot.gameType === 'obvious_mind' && player.isWinner ? 1 : 0),
                                tierListWins: existingSocialStats.tierListWins + (gameHistorySnapshot.gameType === 'tier_list' && player.isWinner ? 1 : 0),
                                impostorWins: existingSocialStats.impostorWins + (gameHistorySnapshot.gameType === 'impostor' && player.isWinner ? 1 : 0),
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

                        const patch = {
                            status: 'finished',
                            players: gameHistorySnapshot.normalizedPlayers,
                            finishedAt: serverTimestamp(),
                            historySavedAt: serverTimestamp(),
                        };

                        cachedBaseState = freshData;
                        cachedPatch = patch;
                        transaction.update(roomRef, patch);
                    });
                    if (cachedBaseState && cachedPatch) {
                        cacheSocialGameRoomPatch(roomId, cachedBaseState, cachedPatch);
                    }
                } catch (err) {
                    if (err?.code !== 'permission-denied') {
                        throw err;
                    }

                    console.warn('Sem permissão para salvar histórico/estatísticas. Encerrando a sala sem persistir histórico.', err);
                    const patch = {
                        status: 'finished',
                        players: gameHistorySnapshot.normalizedPlayers,
                        finishedAt: serverTimestamp(),
                        historySavedAt: serverTimestamp(),
                    };
                    await updateDoc(roomRef, patch);
                    cacheSocialGameRoomPatch(roomId, data, patch);
                }
            } else {
                // We need to fetch current state to get the queue and current round
                // Or we can rely on what the UI passes, but for safety let's transaction or read-write
                // For simplicity here (and since only Host calls it), we'll do getDoc first.

                const roomDoc = await getDoc(roomRef);
                if (!roomDoc.exists()) throw new Error("Room not found");

                const data = roomDoc.data();
                const nextRoundNum = (data.currentRound || 0) + 1;

                if (data.settings?.gameType === 'draw') {
                    const patch = buildNextDrawRound({
                        roomData: data,
                        nextRoundNum,
                        startTimeFactory: serverTimestamp,
                    });
                    await updateDoc(roomRef, patch);
                    cacheSocialGameRoomPatch(roomId, data, patch);
                    return;
                }

                if (data.settings?.gameType === 'most_likely') {
                    const patch = buildNextMostLikelyRound(data, nextRoundNum);
                    await updateDoc(roomRef, patch);
                    cacheSocialGameRoomPatch(roomId, data, patch);
                    return;
                }

                if (data.settings?.gameType === 'obvious_mind') {
                    const patch = buildNextObviousMindRound(data, nextRoundNum);
                    await updateDoc(roomRef, patch);
                    cacheSocialGameRoomPatch(roomId, data, patch);
                    return;
                }

                if (data.settings?.gameType === 'tier_list') {
                    const patch = buildNextTierListRound(data, nextRoundNum);
                    await updateDoc(roomRef, patch);
                    cacheSocialGameRoomPatch(roomId, data, patch);
                    return;
                }

                if (data.settings?.gameType === 'impostor') {
                    const patch = buildNextImpostorRound(data, nextRoundNum);
                    await updateDoc(roomRef, patch);
                    cacheSocialGameRoomPatch(roomId, data, patch);
                    return;
                }

                const patch = buildNextLurdinhaRound(data, nextRoundNum);
                await updateDoc(roomRef, patch);
                cacheSocialGameRoomPatch(roomId, data, patch);
            }
        } catch (err) {
            console.error('Error starting next round:', err);
            throw err;
        }
    };

    const addDrawingStroke = async (roomId, stroke) => {
        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            let cachedBaseState = null;
            let cachedPatch = null;
            await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (!roomDoc.exists()) {
                    throw new Error('Sala não encontrada.');
                }

                const roomData = roomDoc.data();
                const currentStrokes = roomData.roundData?.strokes || [];
                const patch = {
                    'roundData.strokes': [...currentStrokes, stroke],
                };

                cachedBaseState = roomData;
                cachedPatch = patch;
                transaction.update(roomRef, patch);
            });
            if (cachedBaseState && cachedPatch) {
                cacheSocialGameRoomPatch(roomId, cachedBaseState, cachedPatch);
            }
        } catch (err) {
            console.error('Error adding drawing stroke:', err);
            throw err;
        }
    };

    const clearDrawing = async (roomId) => {
        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            const patch = {
                'roundData.strokes': [],
            };
            await updateDoc(roomRef, patch);
            cacheSocialGameRoomPatch(roomId, gameState, patch);
        } catch (err) {
            console.error('Error clearing drawing:', err);
            throw err;
        }
    };

    const setCanvasFill = async (roomId, fillColor) => {
        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            const patch = {
                'roundData.canvasFill': fillColor || DEFAULT_DRAW_CANVAS_FILL,
            };
            await updateDoc(roomRef, patch);
            cacheSocialGameRoomPatch(roomId, gameState, patch);
        } catch (err) {
            console.error('Error setting canvas fill:', err);
            throw err;
        }
    };

    const sendChatGuess = async (roomId, message) => {
        if (!currentUser) return { correct: false };

        let cachedBaseState = null;
        let cachedPatch = null;
        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            return await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (!roomDoc.exists()) {
                    throw new Error('Sala não encontrada.');
                }

                const roomData = roomDoc.data();
                const nextState = buildChatGuessUpdate({
                    roomData,
                    currentUser,
                    message,
                });

                if (!nextState.update) {
                    return { correct: false };
                }

                cachedBaseState = roomData;
                cachedPatch = nextState.update;
                transaction.update(roomRef, nextState.update);
                return { correct: nextState.correct };
            });
        } catch (err) {
            console.error('Error sending chat guess:', err);
            throw err;
        } finally {
            if (cachedBaseState && cachedPatch) {
                cacheSocialGameRoomPatch(roomId, cachedBaseState, cachedPatch);
            }
        }
    };

    // ── #4: Dica paga — desenhista revela 1 letra, paga -2 pts (máx 2 dicas por rodada)
    const revealHint = async (roomId) => {
        if (!currentUser) return;
        const MAX_HINTS = 2;
        const roomRef = doc(db, 'game_rooms', roomId);
        try {
            let cachedBaseState = null;
            let cachedPatch = null;
            await runTransaction(db, async (tx) => {
                const roomDoc = await tx.get(roomRef);
                if (!roomDoc.exists()) return;
                const data = roomDoc.data();
                const nextState = buildRevealHintUpdate({
                    roomData: data,
                    currentUserId: currentUser.uid,
                    maxHints: MAX_HINTS,
                });
                if (!nextState) return;

                cachedBaseState = data;
                cachedPatch = nextState;
                tx.update(roomRef, nextState);
            });
            if (cachedBaseState && cachedPatch) {
                cacheSocialGameRoomPatch(roomId, cachedBaseState, cachedPatch);
            }
        } catch (err) {
            console.error('[revealHint] Error:', err);
        }
    };

    const reportDrawing = async (roomId, reason) => {
        if (!currentUser) return { accepted: false };

        let cachedBaseState = null;
        let cachedPatch = null;
        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            const result = await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (!roomDoc.exists()) {
                    throw new Error('Sala não encontrada.');
                }

                const roomData = roomDoc.data();
                const nextState = buildReportDrawingUpdate({
                    roomData,
                    currentUser,
                    reason,
                    startTimeFactory: serverTimestamp,
                });

                if (!nextState.update) {
                    return { accepted: false };
                }

                cachedBaseState = roomData;
                cachedPatch = nextState.update;
                transaction.update(roomRef, nextState.update);
                return { accepted: nextState.accepted };
            });

            if (cachedBaseState && cachedPatch) {
                cacheSocialGameRoomPatch(roomId, cachedBaseState, cachedPatch);
            }

            return result;
        } catch (err) {
            console.error('Error reporting drawing:', err);
            throw err;
        }
    };

    const restartRoom = async (roomId) => {
        if (!currentUser) return;
        setLoading(true);
        setError(null);

        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            let cachedBaseState = null;
            let cachedPatch = null;

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

                const patch = buildRestartState(roomData);
                cachedBaseState = roomData;
                cachedPatch = patch;
                transaction.update(roomRef, patch);
            });
            if (cachedBaseState && cachedPatch) {
                cacheSocialGameRoomPatch(roomId, cachedBaseState, cachedPatch);
            }
            setLoading(false);
        } catch (err) {
            console.error('Error restarting room:', err);
            setError(err.message || 'Erro ao iniciar revanche.');
            setLoading(false);
            throw err;
        }
    };

    const markImpostorRoleViewed = async (roomId) => {
        if (!currentUser) return;
        let cachedBaseState = null;
        let cachedPatch = null;
        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            await runTransaction(db, async (tx) => {
                const roomDoc = await tx.get(roomRef);
                if (!roomDoc.exists()) return;
                const roomData = roomDoc.data();
                if (roomData.roundData?.rolesRevealed?.[currentUser.uid]) return;
                const patch = {
                    [`roundData.rolesRevealed.${currentUser.uid}`]: true,
                };
                cachedBaseState = roomData;
                cachedPatch = patch;
                tx.update(roomRef, patch);
            });
            if (cachedBaseState && cachedPatch) {
                cacheSocialGameRoomPatch(roomId, cachedBaseState, cachedPatch);
            }
        } catch (err) {
            console.error('[markImpostorRoleViewed]', err);
        }
    };

    const submitImpostorClue = async (roomId, clueText) => {
        if (!currentUser) return;
        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            let cachedBaseState = null;
            let cachedPatch = null;
            await runTransaction(db, async (tx) => {
                const roomDoc = await tx.get(roomRef);
                if (!roomDoc.exists()) return;
                const roomData = roomDoc.data();
                if (roomData.roundData?.clues?.some(c => c.uid === currentUser.uid)) return;
                const player = (roomData.players || []).find(p => p.uid === currentUser.uid);
                const newClue = {
                    uid: currentUser.uid,
                    name: player?.name || currentUser.displayName || 'Jogador',
                    photoURL: player?.photoURL || null,
                    text: clueText,
                    createdAt: Date.now(),
                };
                const existingClues = roomData.roundData?.clues || [];
                const patch = { 'roundData.clues': [...existingClues, newClue] };
                cachedBaseState = roomData;
                cachedPatch = patch;
                tx.update(roomRef, patch);
            });
            if (cachedBaseState && cachedPatch) {
                cacheSocialGameRoomPatch(roomId, cachedBaseState, cachedPatch);
            }
        } catch (err) {
            console.error('[submitImpostorClue]', err);
            throw err;
        }
    };

    const submitImpostorVote = async (roomId, targetUid) => {
        if (!currentUser) return;
        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            const patch = { [`roundData.votes.${currentUser.uid}`]: targetUid };
            await updateDoc(roomRef, patch);
            cacheSocialGameRoomPatch(roomId, gameState, patch);
        } catch (err) {
            console.error('[submitImpostorVote]', err);
            throw err;
        }
    };

    const advanceImpostorPhase = async (roomId, targetPhase) => {
        try {
            const roomRef = doc(db, 'game_rooms', roomId);
            let patch;
            if (targetPhase === 'discussion') {
                patch = buildAdvanceImpostorToDiscussion({ startTimeFactory: serverTimestamp });
            } else if (targetPhase === 'voting') {
                patch = buildAdvanceImpostorToVoting({ startTimeFactory: serverTimestamp });
            } else {
                return;
            }
            await updateDoc(roomRef, patch);
            cacheSocialGameRoomPatch(roomId, gameState, patch);
        } catch (err) {
            console.error('[advanceImpostorPhase]', err);
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
        inviteGroupToRoom,
        joinRoom,
        listenToRoom,
        startGame,
        continuePartySession,
        submitAnswer,
        submitSecretPhrase,
        submitSecretDrawing,
        calculateRoundResults,
        nextRound: incrementRound,
        addDrawingStroke,
        clearDrawing,
        setCanvasFill,
        sendChatGuess,
        reportDrawing,
        removeFromRoom,
        revealHint,
        restartRoom,
        leaveRoom,
        markImpostorRoleViewed,
        submitImpostorClue,
        submitImpostorVote,
        advanceImpostorPhase,
    };
}
