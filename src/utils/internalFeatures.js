const hasExplicitInternalToolsFlag = process.env.EXPO_PUBLIC_ENABLE_INTERNAL_TOOLS === 'true';

export const INTERNAL_TEST_FEATURES_ENABLED =
  hasExplicitInternalToolsFlag || (typeof __DEV__ !== 'undefined' && __DEV__);
