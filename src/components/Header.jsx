import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, Settings } from 'lucide-react-native';

export default function Header({
  title,
  subtitle,
  onBack,
  showBack = true,
  transparent = false,
  rightAction,
  rightActionIcon: RightActionIcon,
  children
}) {
  const shouldShowBackButton = showBack && !!onBack;
  const shouldShowRightButton = !!(rightAction && RightActionIcon);

  return (
    <View style={[styles.header, transparent && styles.headerTransparent]}>
      <View style={styles.headerTop}>
        {shouldShowBackButton ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <ArrowLeft size={28} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.emptySide} />
        )}

        <View style={styles.headerContent}>
          {title && <Text style={styles.headerTitle}>{title}</Text>}
          {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>

        {shouldShowRightButton ? (
          <TouchableOpacity
            style={styles.rightButton}
            onPress={rightAction}
            activeOpacity={0.8}
          >
            <RightActionIcon size={20} color="#B0B0B0" />
          </TouchableOpacity>
        ) : (
          <View style={styles.emptySide} />
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
  emptySide: {
    width: 8,
    height: 64,
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'left',
    letterSpacing: -0.5,
    flexShrink: 1,
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
  headerChildren: {
    marginTop: 16,
  },
});
