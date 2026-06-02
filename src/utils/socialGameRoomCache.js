import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = '@socialGameRoomCache:';
const ACTIVE_ROOM_KEY = '@socialGameRoomCache:activeRoom';
const CACHE_VERSION = 1;
const ROOM_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const MAX_CACHED_CHAT_MESSAGES = 24;
const MAX_CACHED_STROKES = 80;
const MAX_CACHED_THREAD_ENTRIES = 12;
const PERSIST_DEBOUNCE_MS = 350;

const memoryCache = new Map();
const pendingWrites = new Map();

const getCacheKey = (roomId) => `${CACHE_KEY_PREFIX}${roomId}`;

const isTimestampLike = (value) => (
  !!value && (
    value instanceof Date ||
    typeof value?.toDate === 'function' ||
    typeof value?.seconds === 'number'
  )
);

const serializeDateLike = (value) => {
  if (!value) return null;

  if (typeof value?.toDate === 'function') {
    return value.toDate().toISOString();
  }

  if (typeof value?.seconds === 'number') {
    const millis = (value.seconds * 1000) + Math.round((value.nanoseconds || 0) / 1000000);
    return new Date(millis).toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return typeof value === 'string' ? value : null;
};

const cloneValue = (value) => {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(cloneValue);
  if (typeof value !== 'object') return value;
  if (isTimestampLike(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)])
  );
};

const toSerializable = (value) => {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(toSerializable);
  if (isTimestampLike(value)) return serializeDateLike(value);
  if (typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, nestedValue]) => nestedValue !== undefined)
      .map(([key, nestedValue]) => [key, toSerializable(nestedValue)])
  );
};

const setNestedValue = (target, pathParts, value) => {
  if (!pathParts.length) return;

  let cursor = target;
  for (let index = 0; index < pathParts.length - 1; index += 1) {
    const part = pathParts[index];
    if (typeof cursor[part] !== 'object' || cursor[part] === null) {
      cursor[part] = {};
    }
    cursor = cursor[part];
  }

  cursor[pathParts[pathParts.length - 1]] = value;
};

const applyFirestoreLikePatch = (baseValue = {}, patch = {}) => {
  const nextValue = cloneValue(baseValue);

  Object.entries(patch).forEach(([key, value]) => {
    if (key.includes('.')) {
      setNestedValue(nextValue, key.split('.'), cloneValue(value));
      return;
    }

    nextValue[key] = cloneValue(value);
  });

  return nextValue;
};

const sanitizePlayers = (players = []) => (
  players.map((player) => ({
    uid: player?.uid || null,
    name: player?.name || 'Jogador',
    photoURL: player?.photoURL || null,
    score: player?.score || 0,
    isReady: player?.isReady !== false,
    consecutiveGuesses: player?.consecutiveGuesses || 0,
    unlockedAchievements: toSerializable(player?.unlockedAchievements || {}),
  }))
);

const sanitizeChatMessages = (messages = []) => (
  messages
    .slice(-MAX_CACHED_CHAT_MESSAGES)
    .map((entry) => ({
      id: entry?.id || null,
      uid: entry?.uid || null,
      name: entry?.name || null,
      type: entry?.type || 'message',
      text: entry?.text || '',
      createdAt: entry?.createdAt || Date.now(),
    }))
);

const sanitizeStrokes = (strokes = []) => (
  strokes
    .slice(-MAX_CACHED_STROKES)
    .map((stroke) => ({
      id: stroke?.id || null,
      path: stroke?.path || '',
      color: stroke?.color || '#FFFFFF',
      width: stroke?.width || 0,
    }))
);

const sanitizeThreads = (threads = {}) => (
  Object.fromEntries(
    Object.entries(threads || {}).map(([authorId, entries]) => [
      authorId,
      (entries || []).slice(-MAX_CACHED_THREAD_ENTRIES).map((entry) => {
        if (entry?.type === 'drawing') {
          return {
            type: 'drawing',
            authorId: entry?.authorId || null,
            turn: entry?.turn || 0,
            canvasFill: entry?.canvasFill || '#F8FAFC',
            strokes: sanitizeStrokes(entry?.strokes || []),
          };
        }

        return {
          type: 'phrase',
          authorId: entry?.authorId || null,
          turn: entry?.turn || 0,
          text: entry?.text || '',
        };
      }),
    ])
  )
);

const sanitizeRoundData = (roomData = {}) => {
  const roundData = roomData.roundData || {};

  return {
    question: roundData?.question || null,
    startTime: serializeDateLike(roundData?.startTime),
    answers: toSerializable(roundData?.answers || {}),
    results: toSerializable(roundData?.results || null),
    category: roundData?.category || null,
    impostorId: roundData?.impostorId || null,
    phase: roundData?.phase || null,
    rolesRevealed: toSerializable(roundData?.rolesRevealed || {}),
    answerOrder: [...(roundData?.answerOrder || [])],
    currentAnswerTurnIndex: roundData?.currentAnswerTurnIndex || 0,
    clues: toSerializable(roundData?.clues || []),
    reactions: toSerializable(roundData?.reactions || []),
    votes: toSerializable(roundData?.votes || {}),
    votingStartTime: serializeDateLike(roundData?.votingStartTime),
    drawerId: roundData?.drawerId || null,
    word: roundData?.word || null,
    maskedWord: roundData?.maskedWord || null,
    revealedHintIndices: [...(roundData?.revealedHintIndices || [])],
    hintsUsed: roundData?.hintsUsed || 0,
    canvasFill: roundData?.canvasFill || null,
    correctlyGuessed: [...(roundData?.correctlyGuessed || [])],
    reports: toSerializable(roundData?.reports || {}),
    acceptedReport: toSerializable(roundData?.acceptedReport || null),
    guesses: toSerializable(roundData?.guesses || {}),
    chatMessages: sanitizeChatMessages(roundData?.chatMessages || []),
    strokes: sanitizeStrokes(roundData?.strokes || []),
    turnType: roundData?.turnType || null,
    totalTurns: roundData?.totalTurns || 0,
    readyPlayers: [...(roundData?.readyPlayers || [])],
    threads: sanitizeThreads(roundData?.threads || {}),
  };
};

const sanitizeRoomSnapshot = (roomId, roomData = {}) => ({
  roomId,
  status: roomData?.status || 'waiting',
  hostId: roomData?.hostId || null,
  createdAt: serializeDateLike(roomData?.createdAt),
  updatedAt: serializeDateLike(roomData?.updatedAt),
  finishedAt: serializeDateLike(roomData?.finishedAt),
  historySavedAt: serializeDateLike(roomData?.historySavedAt),
  currentRound: roomData?.currentRound || 0,
  currentTurn: roomData?.currentTurn || 0,
  settings: toSerializable(roomData?.settings || {}),
  players: sanitizePlayers(roomData?.players || []),
  roundData: sanitizeRoundData(roomData),
  partySession: toSerializable(roomData?.partySession || null),
});

const scheduleCacheWrite = (roomId, payload) => {
  const pending = pendingWrites.get(roomId);
  if (pending?.timeoutId) {
    clearTimeout(pending.timeoutId);
  }

  const timeoutId = setTimeout(async () => {
    pendingWrites.delete(roomId);

    try {
      await AsyncStorage.setItem(getCacheKey(roomId), JSON.stringify(payload));
    } catch (error) {
      console.warn('[socialGameRoomCache] save failed:', error);
    }
  }, PERSIST_DEBOUNCE_MS);

  pendingWrites.set(roomId, { payload, timeoutId });
};

const buildPayload = (snapshot) => ({
  version: CACHE_VERSION,
  savedAt: Date.now(),
  snapshot,
});

export async function hydrateSocialGameRoomCache(roomId) {
  if (!roomId) return null;

  const cachedPayload = memoryCache.get(roomId);
  if (cachedPayload && (Date.now() - cachedPayload.savedAt) <= ROOM_CACHE_TTL_MS) {
    return cloneValue(cachedPayload.snapshot);
  }

  try {
    const raw = await AsyncStorage.getItem(getCacheKey(roomId));
    if (!raw) return null;

    const payload = JSON.parse(raw);
    const isValidVersion = payload?.version === CACHE_VERSION;
    const isFresh = (Date.now() - (payload?.savedAt || 0)) <= ROOM_CACHE_TTL_MS;

    if (!isValidVersion || !isFresh || !payload?.snapshot) {
      await AsyncStorage.removeItem(getCacheKey(roomId));
      memoryCache.delete(roomId);
      return null;
    }

    memoryCache.set(roomId, payload);
    return cloneValue(payload.snapshot);
  } catch (error) {
    console.warn('[socialGameRoomCache] hydrate failed:', error);
    return null;
  }
}

export async function markActiveSocialGameRoom(roomId, roomData = {}) {
  if (!roomId) return;

  const status = roomData?.status || 'waiting';
  if (['finished', 'abandoned'].includes(status)) {
    await clearActiveSocialGameRoom(roomId);
    return;
  }

  try {
    await AsyncStorage.setItem(ACTIVE_ROOM_KEY, JSON.stringify({
      roomId,
      status,
      savedAt: Date.now(),
    }));
  } catch (error) {
    console.warn('[socialGameRoomCache] active save failed:', error);
  }
}

export async function getActiveSocialGameRoom() {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_ROOM_KEY);
    if (!raw) return null;

    const payload = JSON.parse(raw);
    const isFresh = (Date.now() - (payload?.savedAt || 0)) <= ROOM_CACHE_TTL_MS;
    if (!payload?.roomId || !isFresh) {
      await AsyncStorage.removeItem(ACTIVE_ROOM_KEY);
      return null;
    }

    return payload;
  } catch (error) {
    console.warn('[socialGameRoomCache] active hydrate failed:', error);
    return null;
  }
}

export async function clearActiveSocialGameRoom(roomId) {
  try {
    if (roomId) {
      const activeRoom = await getActiveSocialGameRoom();
      if (activeRoom?.roomId && activeRoom.roomId !== roomId) return;
    }

    await AsyncStorage.removeItem(ACTIVE_ROOM_KEY);
  } catch (error) {
    console.warn('[socialGameRoomCache] active clear failed:', error);
  }
}

export function cacheSocialGameRoomSnapshot(roomId, roomData) {
  if (!roomId || !roomData) return null;

  const snapshot = sanitizeRoomSnapshot(roomId, roomData);
  const payload = buildPayload(snapshot);

  memoryCache.set(roomId, payload);
  scheduleCacheWrite(roomId, payload);

  return cloneValue(snapshot);
}

export function cacheSocialGameRoomPatch(roomId, baseRoomData, patch) {
  if (!roomId || !patch) return null;

  const source = baseRoomData || memoryCache.get(roomId)?.snapshot;
  if (!source) return null;

  const nextRoomData = applyFirestoreLikePatch(source, patch);
  return cacheSocialGameRoomSnapshot(roomId, nextRoomData);
}

export async function clearSocialGameRoomCache(roomId) {
  if (!roomId) return;

  const pending = pendingWrites.get(roomId);
  if (pending?.timeoutId) {
    clearTimeout(pending.timeoutId);
  }

  pendingWrites.delete(roomId);
  memoryCache.delete(roomId);
  try {
    await AsyncStorage.removeItem(getCacheKey(roomId));
  } catch (error) {
    console.warn('[socialGameRoomCache] clear failed:', error);
  }
}
