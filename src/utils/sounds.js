const SOUND_SOURCES = {
  ui_tap_soft: require('../../assets/sounds/ui_tap_soft.wav'),
  ui_tap_primary: require('../../assets/sounds/ui_tap_primary.wav'),
  ui_toggle: require('../../assets/sounds/ui_toggle.wav'),
  answer_submit: require('../../assets/sounds/answer_submit.wav'),
  answer_success: require('../../assets/sounds/answer_success.wav'),
  answer_error: require('../../assets/sounds/answer_error.wav'),
  countdown_tick: require('../../assets/sounds/countdown_tick.wav'),
  winner: require('../../assets/sounds/winner.wav'),
};

let audioApi = null;
let audioUnavailable = false;
let didConfigureAudio = false;
const players = {};

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

export const playSound = (soundId) => {
  const source = SOUND_SOURCES[soundId];
  if (!source) return;

  const api = getAudioApi();
  if (!api?.createAudioPlayer) return;

  try {
    if (!didConfigureAudio && api.setAudioModeAsync) {
      didConfigureAudio = true;
      api.setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      }).catch(() => {});
    }

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
