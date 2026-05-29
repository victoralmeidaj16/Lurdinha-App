import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_MUTED_STORAGE_KEY = '@lurdinha/sound-muted';

const SOUND_SOURCES = {
  ui_tap_soft: require('../../assets/sounds/ui_tap_soft.wav'),
  ui_tap_primary: require('../../assets/sounds/ui_tap_primary.wav'),
  ui_toggle: require('../../assets/sounds/ui_toggle.wav'),
  answer_submit: require('../../assets/sounds/answer_submit.wav'),
  answer_success: require('../../assets/sounds/answer_success.wav'),
  answer_error: require('../../assets/sounds/answer_error.wav'),
  countdown_tick: require('../../assets/sounds/countdown_tick.wav'),
  mockingjay_whistle: require('../../assets/sounds/mockingjay_whistle.mp3'),
  winner: require('../../assets/sounds/winner.wav'),
};

const MUSIC_SOURCES = {
  ranking_theme: require('../../assets/sounds/auraa.mp3'),
};

let audioApi = null;
let audioUnavailable = false;
let didConfigureAudio = false;
const players = {};
const musicPlayers = {};
const musicRefs = {};
const musicVolumes = {};
const muteListeners = new Set();
let soundMuted = false;
let didLoadMutePreference = false;

const notifyMuteListeners = () => {
  muteListeners.forEach((listener) => listener(soundMuted));
};

const pauseAllAudio = () => {
  Object.values(players).forEach((player) => {
    try {
      player.pause?.();
      player.seekTo?.(0);
    } catch {}
  });
  Object.values(musicPlayers).forEach((player) => {
    try {
      player.pause?.();
    } catch {}
  });
};

const ensureMusicPlayer = (musicId) => {
  const source = MUSIC_SOURCES[musicId];
  if (!source) return null;

  const api = getAudioApi();
  if (!api?.createAudioPlayer) return null;

  configureAudio(api);

  if (!musicPlayers[musicId]) {
    const player = api.createAudioPlayer(source);
    player.loop = true;
    musicPlayers[musicId] = player;
  }

  return musicPlayers[musicId];
};

const resumeReferencedMusic = () => {
  Object.keys(musicRefs).forEach((musicId) => {
    if (!musicRefs[musicId]) return;

    try {
      const player = ensureMusicPlayer(musicId);
      if (!player) return;
      player.loop = true;
      player.volume = musicVolumes[musicId] || 0.42;
      player.play?.();
    } catch {}
  });
};

const loadMutePreference = async () => {
  if (didLoadMutePreference) return;
  didLoadMutePreference = true;

  try {
    const storedValue = await AsyncStorage.getItem(SOUND_MUTED_STORAGE_KEY);
    if (storedValue === null) return;
    soundMuted = storedValue === 'true';
    if (soundMuted) pauseAllAudio();
    notifyMuteListeners();
  } catch {}
};

loadMutePreference();

export const isSoundMuted = () => soundMuted;

export const subscribeToSoundMute = (listener) => {
  muteListeners.add(listener);
  return () => muteListeners.delete(listener);
};

export const setSoundMuted = (muted) => {
  soundMuted = Boolean(muted);
  if (soundMuted) {
    pauseAllAudio();
  } else {
    resumeReferencedMusic();
  }
  notifyMuteListeners();
  AsyncStorage.setItem(SOUND_MUTED_STORAGE_KEY, soundMuted ? 'true' : 'false').catch(() => {});
};

export const toggleSoundMuted = () => {
  setSoundMuted(!soundMuted);
  return soundMuted;
};

const getAudioApi = () => {
  if (audioUnavailable) return null;
  if (audioApi) return audioApi;

  try {
    audioApi = require('expo-audio');
    return audioApi;
  } catch (error) {
    audioUnavailable = true;
    if (__DEV__) {
      console.warn('[sounds] expo-audio is unavailable. Rebuild the native app to enable sounds.');
    }
    return null;
  }
};

const configureAudio = (api) => {
  if (!didConfigureAudio && api.setAudioModeAsync) {
    didConfigureAudio = true;
    api.setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    }).catch(() => {});
  }
};

export const playSound = (soundId) => {
  if (soundMuted) return;

  const source = SOUND_SOURCES[soundId];
  if (!source) return;

  const api = getAudioApi();
  if (!api?.createAudioPlayer) return;

  try {
    configureAudio(api);

    if (!players[soundId]) {
      players[soundId] = api.createAudioPlayer(source);
    }

    const player = players[soundId];
    player.seekTo?.(0);
    player.play?.();
  } catch (error) {
    audioUnavailable = true;
    if (__DEV__) {
      console.warn(`[sounds] failed to play ${soundId}`, error);
    }
  }
};

export const startMusic = (musicId, { volume = 0.42 } = {}) => {
  const source = MUSIC_SOURCES[musicId];
  if (!source) return;

  const wasInactive = !musicRefs[musicId];
  musicRefs[musicId] = (musicRefs[musicId] || 0) + 1;
  musicVolumes[musicId] = volume;

  if (soundMuted) return;

  try {
    const player = ensureMusicPlayer(musicId);
    if (!player) return;
    player.loop = true;
    player.volume = volume;
    if (wasInactive) {
      player.seekTo?.(0);
    }
    player.play?.();
  } catch (error) {
    audioUnavailable = true;
    if (__DEV__) {
      console.warn(`[sounds] failed to start music ${musicId}`, error);
    }
  }
};

export const stopMusic = (musicId) => {
  try {
    musicRefs[musicId] = Math.max((musicRefs[musicId] || 1) - 1, 0);
    if (musicRefs[musicId] > 0) return;

    const player = musicPlayers[musicId];
    if (!player) return;

    player.pause?.();
    player.seekTo?.(0);
  } catch (error) {
    if (__DEV__) {
      console.warn(`[sounds] failed to stop music ${musicId}`, error);
    }
  }
};
