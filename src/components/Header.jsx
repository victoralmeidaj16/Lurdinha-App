import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, Settings } from 'lucide-react-native';

export default function Header({ 
  title, 
  subtitle,
  onBack, 
  rightAction,
  rightActionIcon: RightActionIcon,
  children 
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        {onBack ? (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        
        <View style={styles.headerContent}>
          {title && <Text style={styles.headerTitle}>{title}</Text>}
          {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>

        {rightAction && RightActionIcon ? (
          <TouchableOpacity 
            style={styles.rightButton}
            onPress={rightAction}
            activeOpacity={0.8}
          >
            <RightActionIcon size={24} color="#B0B0B0" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
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
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  placeholder: {
    width: 40,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
    marginTop: 4,
  },
  rightButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerChildren: {
    marginTop: 16,
  },
});

