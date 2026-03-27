import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import AnimatedPressable from './AnimatedPressable';
import { borderRadius, colors, fontStyles, shadows } from '../theme';

export default function EmptyStateCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
}) {
  return (
    <LinearGradient
      colors={[colors.primaryAlpha20, colors.surfaceAlt, colors.surface]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.iconShell}>
        <View style={styles.iconCore}>
          <Icon size={28} color={colors.primary} />
        </View>
      </View>

      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <View style={styles.actions}>
        {primaryAction ? (
          <AnimatedPressable
            style={styles.primaryButton}
            onPress={primaryAction.onPress}
            activeScale={0.96}
          >
            <Text style={styles.primaryButtonText}>{primaryAction.label}</Text>
            <ArrowRight size={16} color={colors.textPrimary} />
          </AnimatedPressable>
        ) : null}

        {secondaryAction ? (
          <AnimatedPressable
            style={styles.secondaryButton}
            onPress={secondaryAction.onPress}
            activeScale={0.98}
          >
            <Text style={styles.secondaryButtonText}>{secondaryAction.label}</Text>
          </AnimatedPressable>
        ) : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.primaryAlpha20,
    ...shadows.primary,
  },
  iconShell: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryAlpha12,
    marginBottom: 16,
  },
  iconCore: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryAlpha20,
  },
  eyebrow: {
    ...fontStyles.semibold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.primaryLight,
    marginBottom: 8,
  },
  title: {
    ...fontStyles.bold,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  description: {
    ...fontStyles.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  actions: {
    marginTop: 20,
    gap: 12,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    ...fontStyles.semibold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.whiteAlpha20,
    backgroundColor: colors.whiteAlpha10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...fontStyles.medium,
    fontSize: 15,
    color: colors.textSecondary,
  },
});
