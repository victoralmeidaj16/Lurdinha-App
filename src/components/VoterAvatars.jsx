import React from 'react';
import { View, StyleSheet } from 'react-native';
import AvatarCircle from './AvatarCircle';

export default function VoterAvatars({ voters = [], maxDisplay = 3 }) {
  if (!voters || voters.length === 0) return null;

  const visibleVoters = voters.slice(0, maxDisplay);
  const remainingCount = voters.length > maxDisplay ? voters.length - maxDisplay : 0;

  return (
    <View style={styles.container}>
      {visibleVoters.map((voter, index) => {
        // Se voter é string (userId), criar objeto básico
        const voterObj = typeof voter === 'string' 
          ? { name: voter.substring(0, 2).toUpperCase(), photoURL: null }
          : voter;
        
        return (
          <View key={index} style={[styles.avatarWrapper, index > 0 && styles.avatarOverlap]}>
            <AvatarCircle
              name={voterObj.name || voterObj.displayName || 'U'}
              size={28}
              photoURL={voterObj.photoURL}
            />
          </View>
        );
      })}
      {remainingCount > 0 && (
        <View style={[styles.avatarWrapper, styles.avatarOverlap, styles.moreBadge]}>
          <View style={styles.moreBadgeInner}>
            <View style={styles.moreDot} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#17171B',
    backgroundColor: '#17171B',
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  moreBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#27272a',
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBadgeInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(144, 97, 249, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9061F9',
  },
});




