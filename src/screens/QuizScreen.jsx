import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { ArrowLeft, Share2, ChevronRight, Heart } from 'lucide-react-native';

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
  marginBottom: 12,
};

function OptionRow({ index, label, selected, onSelect }) {
  return (
    <TouchableOpacity
      onPress={() => onSelect(index)}
      style={[
        OPTION_BASE,
        selected
          ? {
              backgroundColor: 'rgba(139, 92, 246, 0.8)',
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
      ]}
      activeOpacity={0.8}
    >
      <View style={styles.optionContent}>
        {/* Radio */}
        <View
          style={[
            styles.radioContainer,
              selected
                ? { borderColor: '#ffffff', backgroundColor: 'rgba(255, 255, 255, 0.1)' }
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
    </TouchableOpacity>
  );
}

export default function QuizScreen() {
  const [selected, setSelected] = useState(0);
  const [voted, setVoted] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const options = [
    "Beber skol 😅",
    "Beber skol 😊", 
    "Falar com a sogra 😬",
    "Dançar pagode 😎",
  ];

  function onVote() {
    setVoted(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    setTimeout(() => {
      setVoted(false);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 2200);
  }

  function onShare() {
    Alert.alert('Compartilhar', 'Funcionalidade de compartilhamento será implementada');
  }

  function onBack() {
    Alert.alert('Voltar', 'Funcionalidade de navegação será implementada');
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
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
            <View style={styles.progressContainer}>
              <Text style={styles.creatorText}>Lurdinha</Text>
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>
              O quee o Zé{'\n'}vai fazer na{'\n'}festa?
            </Text>
            <View style={styles.metaInfo}>
              <Text style={styles.metaText}>
                Criada por <Text style={styles.creatorName}>Ana ▿</Text> • <Text style={styles.timeText}>3h restantes</Text>
              </Text>
            </View>

            <View style={styles.optionsContainer}>
              <Text style={styles.optionsLabel}>RECD</Text>
              {options.map((option, index) => (
                <OptionRow
                  key={index}
                  index={index}
                  label={option}
                  selected={selected === index}
                  onSelect={setSelected}
                />
              ))}
            </View>

            <View style={styles.likeContainer}>
              <View style={styles.likeIcon}>
                <Text style={styles.likeText}>♥</Text>
              </View>
              <Text style={styles.likeLabel}>Vorignde</Text>
              <Text style={styles.likeSeparator}>⎍</Text>
            </View>
          </View>

          {/* Footer CTAs */}
          <View style={styles.footer}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.voteButton}
                onPress={onVote}
                activeOpacity={0.8}
              >
                <Text style={styles.voteButtonText}>Votine</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doteButton}
                activeOpacity={0.8}
              >
                <Text style={styles.doteButtonText}>Dotine</Text>
              </TouchableOpacity>
            </View>
          </View>
      </ScrollView>
      
      {/* Toast */}
      {voted && (
        <Animated.View 
          style={[
            styles.toast,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.toastText}>
            Voto registrado: <Text style={styles.toastBold}>{options[selected]}</Text>
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
});
