import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeIn, FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useGame } from '../hooks/useGame';
import AnimatedPressable from './AnimatedPressable';
import { triggerImpact } from '../utils/haptics';
import { typography } from '../theme';

function getRoomRoute(roomData) {
  const gameType = roomData?.settings?.gameType;
  if (roomData?.status === 'waiting') return 'Lobby';
  if (roomData?.status === 'party_transition') return 'RoundTransition';
  if (roomData?.status === 'playing') return gameType === 'draw' ? 'DrawGame' : 'Game';
  if (roomData?.status === 'round_results') {
    if (gameType === 'draw') return 'DrawRoundResult';
    if (gameType === 'telephone' || gameType === 'secret') return 'TelephoneResult';
    return 'RoundResult';
  }
  if (roomData?.status === 'finished') return 'FinalResult';
  return 'Lobby';
}

export default function JoinRoomModal({ visible, onClose, navigation }) {
  const { joinRoom, loading, error } = useGame();
  const [code, setCode] = useState('');
  const [detectedClipboardCode, setDetectedClipboardCode] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      setCode('');
      setDetectedClipboardCode(null);
      return;
    }

    const checkClipboard = async () => {
      try {
        const text = await Clipboard.getStringAsync();
        if (text) {
          const cleanText = text.trim();
          if (/^\d{5}$/.test(cleanText)) {
            setDetectedClipboardCode(cleanText);
          }
        }
      } catch (err) {
        // silently ignore clipboard errors
      }
    };

    const timer = setTimeout(checkClipboard, 400);
    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleJoin = async () => {
    if (code.length !== 5) return;
    try {
      const roomData = await joinRoom(code);
      onClose();
      navigation.navigate(getRoomRoute(roomData), { roomId: code });
    } catch (err) {
      // Error handled by hook
    }
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      const clean = text.replace(/[^0-9]/g, '').slice(0, 5);
      setCode(clean);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? undefined : 'height'}
          style={styles.kvContainer}
        >
          <Animated.View
            entering={SlideInDown.springify().damping(22).stiffness(260)}
            exiting={SlideOutDown.duration(200)}
            style={[
              styles.sheet,
              keyboardHeight > 0 && styles.sheetKeyboardOpen,
              keyboardHeight > 0 && { marginBottom: Math.max(0, keyboardHeight - 8) },
            ]}
          >

            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.hashIconWrap}>
                  <Text style={styles.hashIcon}>#</Text>
                </View>
                <View>
                  <Text style={styles.sheetTitle}>Entrar com código</Text>
                  <Text style={styles.sheetSubtitle}>Código de 5 dígitos do host</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <X size={18} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>

            {/* Clipboard banner */}
            {detectedClipboardCode && detectedClipboardCode !== code && (
              <Animated.View entering={FadeInDown.duration(240)} style={styles.clipboardBanner}>
                <View style={styles.clipboardInfo}>
                  <Text style={styles.clipboardLabel}>Código detectado na área de transferência</Text>
                  <Text style={styles.clipboardCode}>{detectedClipboardCode}</Text>
                </View>
                <View style={styles.clipboardActions}>
                  <AnimatedPressable
                    onPress={() => { setCode(detectedClipboardCode); setDetectedClipboardCode(null); }}
                    style={styles.clipboardUseBtn}
                    haptic="medium"
                  >
                    <Text style={styles.clipboardUseBtnText}>Colar</Text>
                  </AnimatedPressable>
                  <AnimatedPressable
                    onPress={() => setDetectedClipboardCode(null)}
                    style={styles.clipboardDiscardBtn}
                    haptic="light"
                  >
                    <Text style={styles.clipboardDiscardBtnText}>Ignorar</Text>
                  </AnimatedPressable>
                </View>
              </Animated.View>
            )}

            {/* Code input */}
            <View style={[styles.inputCard, keyboardHeight > 0 && styles.inputCardKeyboardOpen]}>
              <View pointerEvents="none" style={styles.inputOrb} />
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={code}
                onChangeText={(text) => {
                  const clean = text.replace(/[^0-9]/g, '').slice(0, 5);
                  setCode(clean);
                  triggerImpact('light');
                  if (clean.length === 5) Keyboard.dismiss();
                }}
                placeholder="00000"
                placeholderTextColor="rgba(255,255,255,0.18)"
                keyboardType="number-pad"
                maxLength={5}
              />

              {keyboardHeight === 0 ? (
                <>
                  <AnimatedPressable onPress={handlePaste} style={styles.pasteBtn} haptic="light" activeScale={0.95}>
                    <Text style={styles.pasteBtnText}>Colar código copiado</Text>
                  </AnimatedPressable>

                  <Text style={styles.helperText}>Peça o código de 5 dígitos para o host</Text>
                </>
              ) : null}

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
            </View>

            {/* Join button */}
            <AnimatedPressable
              style={[styles.joinBtn, code.length !== 5 && styles.joinBtnDisabled]}
              onPress={handleJoin}
              disabled={code.length !== 5 || loading}
              haptic="medium"
            >
              <LinearGradient
                colors={code.length === 5 ? ['#9B6BFF', '#7C3AED'] : ['#2a2a35', '#222230']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.joinBtnGrad}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.joinBtnText}>Entrar na sala</Text>
                    <ArrowRight size={20} color={code.length === 5 ? '#fff' : 'rgba(255,255,255,0.3)'} />
                  </>
                )}
              </LinearGradient>
            </AnimatedPressable>

          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  kvContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#111116',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
  },
  sheetKeyboardOpen: {
    paddingBottom: 14,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hashIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(139,92,246,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hashIcon: {
    color: '#A78BFA',
    fontSize: 22,
    fontWeight: '900',
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  sheetSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipboardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(139,92,246,0.18)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
  },
  clipboardInfo: { flex: 1 },
  clipboardLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 2,
    fontWeight: '500',
  },
  clipboardCode: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 1,
  },
  clipboardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clipboardUseBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  clipboardUseBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  clipboardDiscardBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  clipboardDiscardBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '500' },
  inputCard: {
    backgroundColor: '#17171C',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.12)',
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  inputCardKeyboardOpen: {
    paddingVertical: 12,
    marginBottom: 12,
  },
  inputOrb: {
    position: 'absolute',
    right: -30,
    top: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(139,92,246,0.06)',
  },
  input: {
    fontSize: 52,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 12,
    textAlign: 'center',
    width: '100%',
    marginBottom: 16,
  },
  pasteBtn: {
    alignSelf: 'center',
    backgroundColor: 'rgba(139,92,246,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    marginBottom: 14,
  },
  pasteBtnText: { color: '#c4b5fd', fontSize: 13, fontWeight: '700' },
  helperText: { fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' },
  errorBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 12,
  },
  errorText: { color: '#fca5a5', textAlign: 'center', fontSize: 13 },
  joinBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  joinBtnDisabled: { shadowOpacity: 0 },
  joinBtnGrad: {
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
