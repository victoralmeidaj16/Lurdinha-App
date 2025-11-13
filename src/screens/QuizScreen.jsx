import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  Share,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import AvatarCircle from '../components/AvatarCircle';

const { width } = Dimensions.get('window');

const OPTION_BASE = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  borderRadius: 16,
  borderWidth: 1,
  paddingHorizontal: 16,
  paddingVertical: 16,
};

// Função auxiliar para calcular tempo restante
function calculateTimeRemaining(endTime) {
  if (!endTime) return '';
  
  const end = endTime?.toDate ? endTime.toDate() : new Date(endTime);
  const now = new Date();
  const diff = end - now;
  
  if (diff <= 0) return 'Encerrado';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m restantes`;
  }
  return `${minutes}m restantes`;
}

function OptionRow({ index, label, selected, onSelect, disabled, confirmationKey }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(selected ? 1 : 0.92);
  const tickRef = useRef(null);
  const [showTick, setShowTick] = useState(false);

  useEffect(() => {
    if (selected) {
      scale.value = 0.92;
      scale.value = withSpring(1, {
        damping: 20,
        stiffness: 240,
      });
      opacity.value = withTiming(1, { duration: 120 });
    } else {
      scale.value = withTiming(1, { duration: 160 });
      opacity.value = withTiming(0.92, { duration: 120 });
    }
  }, [selected, opacity, scale]);

  useEffect(() => {
    if (!confirmationKey || !selected) return;

    setShowTick(true);
    if (tickRef.current) {
      tickRef.current.reset();
      tickRef.current.play(0, 30);
    }

    AccessibilityInfo.announceForAccessibility('voto confirmado');

    const timer = setTimeout(() => {
      setShowTick(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [confirmationKey, selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    if (!disabled) {
      onSelect(index);
    }
  };

  return (
    <Animated.View style={[styles.optionWrapper, animatedStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        style={[
          OPTION_BASE,
          selected
            ? {
                backgroundColor: 'rgba(139, 92, 246, 0.85)',
                borderColor: '#8b5cf6',
                shadowColor: '#8b5cf6',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 30,
                elevation: 8,
              }
            : {
                backgroundColor: 'rgba(30, 30, 30, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
          disabled && styles.optionDisabled,
        ]}
        activeOpacity={disabled ? 1 : 0.8}
        disabled={disabled}
      >
        <View style={styles.optionContent}>
          <View
            style={[
              styles.radioContainer,
              selected
                ? { borderColor: '#ffffff', backgroundColor: 'rgba(255, 255, 255, 0.16)' }
                : { borderColor: '#B0B0B0', backgroundColor: 'rgba(30, 30, 30, 0.4)' },
            ]}
          >
            <View
              style={[
                styles.radioInner,
                selected ? { backgroundColor: '#ffffff' } : { backgroundColor: 'transparent' },
              ]}
            />
          </View>
          <Text
            style={[
              styles.optionText,
              selected ? { color: '#ffffff' } : { color: '#e4e4e7' },
            ]}
          >
            {label}
          </Text>
        </View>
        <ChevronRight 
          size={20} 
          color={selected ? '#ffffff' : '#B0B0B0'} 
        />

        {showTick && (
          <View pointerEvents="none" style={styles.optionTick}>
            <LottieView
              ref={tickRef}
              source={require('../../assets/animations/checkmark.json')}
              autoPlay={false}
              loop={false}
              style={styles.tickAnimation}
              resizeMode="cover"
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function QuizScreen({ navigation, route }) {
  const { quizId, quizGroupId } = route.params || {};
  const { currentUser } = useAuth();
  const { voteOnQuiz, getQuizGroupDetails } = useGroups();
  
  const [quiz, setQuiz] = useState(null);
  const [selected, setSelected] = useState(null);
  const [voted, setVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [confirmation, setConfirmation] = useState({ index: null, ts: 0 });

  const toastOpacity = useSharedValue(0);
  const toastTranslate = useSharedValue(20);
  const toastStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
    transform: [{ translateY: toastTranslate.value }],
  }));

  const pressLockRef = useRef(false);
  const pressTimeoutRef = useRef(null);

  // Carregar dados do quiz
  useEffect(() => {
    if (!quizId) {
      Alert.alert('Erro', 'Quiz não encontrado');
      navigation.goBack();
      return;
    }

    loadQuizData();
    
    // Listener em tempo real para atualizações do quiz
    const unsubscribe = onSnapshot(
      doc(db, 'quizzes', quizId),
      (snapshot) => {
        if (snapshot.exists()) {
          const quizData = {
            id: snapshot.id,
            ...snapshot.data()
          };
          setQuiz(quizData);
          
          // Verificar se usuário já votou
          if (quizData.votes && quizData.votes[currentUser?.uid] !== undefined) {
            setSelected(quizData.votes[currentUser.uid]);
            setVoted(true);
          }
        }
      },
      (error) => {
        console.error('Error loading quiz:', error);
        Alert.alert('Erro', 'Não foi possível carregar o quiz');
        navigation.goBack();
      }
    );

    return () => unsubscribe();
  }, [quizId]);

  const loadQuizData = async () => {
    try {
      setLoading(true);
      const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
      if (quizDoc.exists()) {
        const quizData = {
          id: quizDoc.id,
          ...quizDoc.data()
        };
        setQuiz(quizData);
        
        // Verificar se usuário já votou
        if (quizData.votes && quizData.votes[currentUser?.uid] !== undefined) {
          setSelected(quizData.votes[currentUser.uid]);
          setVoted(true);
        }
      } else {
        Alert.alert('Erro', 'Quiz não encontrado');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      Alert.alert('Erro', 'Não foi possível carregar o quiz');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current);
      }
    };
  }, []);

  const handleSelectOption = useCallback((index) => {
    if (voted || voting || pressLockRef.current) return;

    pressLockRef.current = true;
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
    }
    pressTimeoutRef.current = setTimeout(() => {
      pressLockRef.current = false;
      pressTimeoutRef.current = null;
    }, 300);
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSelected(index);
    setConfirmation({ index, ts: Date.now() });
  }, [voted, voting]);

  async function onVote() {
    if (!selected && selected !== 0) {
      Alert.alert('Atenção', 'Selecione uma opção antes de votar');
      return;
    }

    if (voted || voting) return;

    try {
      setVoting(true);
      
      // Feedback tátil
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      await voteOnQuiz(quizId, selected);
      setVoted(true);
      setShowToast(true);
      
      toastOpacity.value = withTiming(1, { duration: 300 });
      toastTranslate.value = withTiming(0, { duration: 300 });

      setTimeout(() => {
        toastOpacity.value = withTiming(0, { duration: 300 });
        toastTranslate.value = withTiming(20, { duration: 300 });
        setShowToast(false);
      }, 2200);
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setVoting(false);
    }
  }

  async function onShare() {
    try {
      if (!quiz) return;
      
      const quizGroup = quizGroupId ? await getQuizGroupDetails(quizGroupId) : null;
      const shareText = `Participe deste quiz: ${quiz.title}\n\n${quiz.description || ''}\n\n${quizGroup ? `Grupo: ${quizGroup.title}` : ''}`;
      
      const result = await Share.share({
        message: shareText,
        title: quiz.title,
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar');
    }
  }

  function onBack() {
    if (navigation) {
      navigation.goBack();
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollInner}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <View style={styles.topBarContent}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={onBack}
              >
                <ArrowLeft size={20} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.topBarRight}>
                <TouchableOpacity 
                  style={styles.shareButton}
                  onPress={onShare}
                >
                  <Text style={styles.shareButtonText}>Compartilhar</Text>
                </TouchableOpacity>
                {/* Avatar */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>A</Text>
                </View>
              </View>
            </View>
            {quiz && (
              <View style={styles.progressContainer}>
                <Text style={styles.creatorText}>
                  {quiz.quizGroupTitle || 'Quiz'}
                </Text>
                <View style={styles.progressBar}>
                  <View style={styles.progressFill} />
                </View>
              </View>
            )}
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Carregando quiz...</Text>
            </View>
          ) : quiz ? (
            <View style={styles.content}>
              <Text style={styles.title}>
                {quiz.title || 'Quiz sem título'}
              </Text>
              {quiz.description && (
                <Text style={styles.description}>{quiz.description}</Text>
              )}
              <View style={styles.metaInfo}>
                <Text style={styles.metaText}>
                  {quiz.createdByName && (
                    <>
                      Criada por <Text style={styles.creatorName}>{quiz.createdByName}</Text>
                      {quiz.endTime && ' • '}
                    </>
                  )}
                  {quiz.endTime && (
                    <Text style={styles.timeText}>
                      {calculateTimeRemaining(quiz.endTime)}
                    </Text>
                  )}
                </Text>
              </View>

              <View style={styles.optionsContainer}>
                <Text style={styles.optionsLabel}>OPÇÕES</Text>
                {quiz.options && quiz.options.map((option, index) => (
                  <OptionRow
                    key={index}
                    index={index}
                    label={option}
                    selected={selected === index}
                    onSelect={handleSelectOption}
                    disabled={voted || voting}
                    confirmationKey={
                      confirmation.index === index ? confirmation.ts : 0
                    }
                  />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Quiz não encontrado</Text>
            </View>
          )}

          <View style={styles.likeContainer}>
            <View style={styles.likeIcon}>
              <Text style={styles.likeText}>♥</Text>
            </View>
            <Text style={styles.likeLabel}>Vorignde</Text>
            <Text style={styles.likeSeparator}>⎍</Text>
          </View>

          {/* Footer CTAs */}
          <View style={styles.footer}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.voteButton,
                  (voted || voting || selected === null) && styles.voteButtonDisabled
                ]}
                onPress={onVote}
                activeOpacity={0.8}
                disabled={voted || voting || selected === null}
              >
                <Text style={styles.voteButtonText}>
                  {voting ? 'Votando...' : voted ? 'Votado ✓' : 'Votar'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doteButton}
                activeOpacity={0.8}
              >
                <Text style={styles.doteButtonText}>Dotine</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Toast */}
      {showToast && quiz && (
        <Animated.View 
          style={[styles.toast, toastStyle]}
        >
          <Text style={styles.toastText}>
            Voto registrado: <Text style={styles.toastBold}>
              {quiz.options && quiz.options[selected]}
            </Text>
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
  },
  topBar: {
    paddingTop: 60,
    paddingBottom: 24,
  },
  scrollInner: {
    flexGrow: 1,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shareButton: {
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  avatar: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creatorText: {
    fontSize: 14,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    width: '60%',
    backgroundColor: '#27272a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '25%',
    backgroundColor: '#8b5cf6',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  title: {
    marginTop: 8,
    fontSize: 38,
    lineHeight: 40,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  metaInfo: {
    marginTop: 12,
  },
  metaText: {
    fontSize: 14,
    color: '#a1a1aa',
  },
  creatorName: {
    color: '#e4e4e7',
    fontWeight: '500',
  },
  timeText: {
    color: '#a1a1aa',
  },
  optionsContainer: {
    marginTop: 20,
  },
  optionsLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#a1a1aa',
    marginBottom: 4,
  },
  optionWrapper: {
    marginBottom: 12,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioContainer: {
    height: 36,
    width: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    height: 16,
    width: 16,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  optionTick: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 32,
    height: 32,
  },
  tickAnimation: {
    width: '100%',
    height: '100%',
  },
  likeContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  likeIcon: {
    height: 24,
    width: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(9, 9, 11, 0.7)',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeText: {
    fontSize: 12,
    color: '#71717a',
  },
  likeLabel: {
    fontSize: 14,
    color: '#71717a',
  },
  likeSeparator: {
    fontSize: 14,
    color: '#71717a',
  },
  footer: {
    backgroundColor: 'rgba(9, 9, 11, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  voteButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  voteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  doteButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    paddingVertical: 16,
    alignItems: 'center',
  },
  doteButtonText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    bottom: -60,
    left: '50%',
    marginLeft: -100,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#09090b',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  toastBold: {
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
  description: {
    fontSize: 16,
    color: '#a1a1aa',
    marginTop: 8,
    marginBottom: 4,
  },
  voteButtonDisabled: {
    opacity: 0.5,
  },
  optionDisabled: {
    opacity: 0.6,
  },
});
