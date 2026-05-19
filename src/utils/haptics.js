import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const IMPACT_STYLES = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

export const triggerImpact = (style = 'medium') => {
  if (Platform.OS === 'web') return;

  const impactStyle = IMPACT_STYLES[style] || IMPACT_STYLES.medium;
  Haptics.impactAsync(impactStyle).catch(() => {});
};

export const triggerNotification = (type = 'success') => {
  if (Platform.OS === 'web') return;

  const map = {
    success: Haptics.NotificationFeedbackType.Success,
    warning: Haptics.NotificationFeedbackType.Warning,
    error: Haptics.NotificationFeedbackType.Error,
  };
  Haptics.notificationAsync(map[type] || map.success).catch(() => {});
};
