import React, { forwardRef } from 'react';
import { Platform, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

const HAPTIC_MAP = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

export default forwardRef(function AnimatedPressable(
  {
    children,
    style,
    activeScale = 0.97,
    haptic = 'light',
    disabled = false,
    onPressIn,
    onPressOut,
    ...props
  },
  ref
) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const handlePressIn = (event) => {
    scale.value = withSpring(activeScale, {
      damping: 18,
      stiffness: 420,
      mass: 0.4,
    });
    translateY.value = withSpring(1, {
      damping: 18,
      stiffness: 420,
      mass: 0.4,
    });

    if (!disabled && haptic !== 'none' && Platform.OS !== 'web') {
      const impactStyle = HAPTIC_MAP[haptic] || HAPTIC_MAP.light;
      Haptics.impactAsync(impactStyle).catch(() => {});
    }

    onPressIn?.(event);
  };

  const handlePressOut = (event) => {
    scale.value = withSpring(1, {
      damping: 20,
      stiffness: 360,
      mass: 0.5,
    });
    translateY.value = withSpring(0, {
      damping: 20,
      stiffness: 360,
      mass: 0.5,
    });

    onPressOut?.(event);
  };

  return (
    <AnimatedPressableBase
      ref={ref}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
      {...props}
    >
      {children}
    </AnimatedPressableBase>
  );
});
