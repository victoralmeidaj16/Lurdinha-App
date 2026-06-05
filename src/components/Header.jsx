import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { ArrowLeft, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AnimatedPressable from './AnimatedPressable';
import SoundMuteButton from './SoundMuteButton';

export default function Header({
  title,
  subtitle,
  onBack,
  showBack = true,
  showExit = false,
  transparent = false,
  rightAction,
  rightActionIcon: RightActionIcon,
  showSoundToggle = false,
  onConfirmExit,
  children,
  compact = false,
  centerTitle = false
}) {
  const navigation = useNavigation();

  const handleExit = () => {
    Alert.alert(
      "Sair do jogo",
      "Você quer sair para a home mesmo?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          style: "destructive", 
          onPress: () => {
            if (onConfirmExit) {
              onConfirmExit();
            } else {
              navigation.navigate('GameHome');
            }
          }
        }
      ]
    );
  };

  const shouldShowBackButton = showBack && !!onBack;
  const shouldShowRightButton = !!(rightAction && RightActionIcon);

  return (
    <View style={[styles.header, compact && styles.headerCompact, transparent && styles.headerTransparent]}>
      <View style={styles.headerTop}>
        {showExit ? (
          <AnimatedPressable
            style={[styles.backButton, compact && styles.backButtonCompact]}
            onPress={handleExit}
            haptic="light"
          >
            <X size={compact ? 24 : 28} color="#ffffff" />
          </AnimatedPressable>
        ) : shouldShowBackButton ? (
          <AnimatedPressable
            style={[styles.backButton, compact && styles.backButtonCompact]}
            onPress={onBack}
            haptic="light"
          >
            <ArrowLeft size={compact ? 24 : 28} color="#ffffff" />
          </AnimatedPressable>
        ) : (
          <View style={[styles.emptySide, compact && styles.emptySideCompact]} />
        )}

        <View style={[styles.headerContent, compact && styles.headerContentCompact, centerTitle && styles.headerContentCentered]}>
          {title && (
            <Text
              style={[styles.headerTitle, compact && styles.headerTitleCompact, centerTitle && styles.headerTitleCentered]}
              numberOfLines={compact ? 2 : undefined}
            >
              {title}
            </Text>
          )}
          {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>

        {shouldShowRightButton || showSoundToggle ? (
          <View style={styles.rightActions}>
            {showSoundToggle && <SoundMuteButton compact />}
            {shouldShowRightButton ? (
              <AnimatedPressable
                style={[styles.rightButton, compact && styles.rightButtonCompact]}
                onPress={rightAction}
                haptic="light"
              >
                <RightActionIcon size={20} color="#B0B0B0" />
              </AnimatedPressable>
            ) : null}
          </View>
        ) : (
          <View style={[styles.emptySide, compact && styles.emptySideCompact]} />
        )}
      </View>

      {children && (
        <View style={styles.headerChildren}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    zIndex: 999,
  },
  headerCompact: {
    paddingTop: 48,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  headerTransparent: {
    backgroundColor: 'transparent',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(36, 36, 36, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButtonCompact: {
    width: 54,
    height: 54,
    borderRadius: 18,
  },
  emptySide: {
    width: 8,
    height: 64,
  },
  emptySideCompact: {
    height: 54,
  },
  headerContent: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: 4,
    marginLeft: 14,
    marginRight: 14,
    minHeight: 64,
  },
  headerContentCompact: {
    minHeight: 54,
    marginLeft: 12,
    marginRight: 10,
    paddingTop: 0,
  },
  headerContentCentered: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'left',
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  headerTitleCompact: {
    fontSize: 22,
    lineHeight: 27,
  },
  headerTitleCentered: {
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6F6F75',
    textAlign: 'left',
    marginTop: 6,
    lineHeight: 20,
  },
  rightButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(36, 36, 36, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rightButtonCompact: {
    width: 50,
    height: 50,
    borderRadius: 18,
  },
  rightActions: {
    minWidth: 56,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  headerChildren: {
    marginTop: 16,
  },
});
