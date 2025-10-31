import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { UserPlus } from 'lucide-react-native';
import AvatarCircle from './AvatarCircle';

// Avatares de exemplo - substituir por membros reais do grupo quando disponível
const AVATAR_CLOUD = [
  'https://i.pravatar.cc/100?img=11',
  'https://i.pravatar.cc/100?img=12',
  'https://i.pravatar.cc/100?img=13',
  'https://i.pravatar.cc/100?img=14',
  'https://i.pravatar.cc/100?img=15',
  'https://i.pravatar.cc/100?img=16',
  'https://i.pravatar.cc/100?img=17',
  'https://i.pravatar.cc/100?img=18',
  'https://i.pravatar.cc/100?img=19',
];

export default function AddMembersCard({ onPress, memberCount = 0 }) {
  return (
    <View style={styles.cloudWrap}>
      <View style={styles.cloudRow}>
        {AVATAR_CLOUD.slice(0, 9).map((uri, idx) => (
          <Image
            key={`${uri}-${idx}`}
            source={{ uri }}
            style={[
              styles.cloudAvatar,
              idx !== 0 && { marginLeft: -10 },
            ]}
          />
        ))}
      </View>

      <Text style={styles.heroTitle}>
        Convide pessoas para o grupo 👥
      </Text>
      <Text style={styles.heroSub}>
        {memberCount > 0 
          ? `${memberCount} membro${memberCount > 1 ? 's' : ''} no grupo`
          : 'Adicione membros para começar'}
      </Text>

      <Pressable style={styles.primaryBtn} onPress={onPress}>
        <UserPlus size={18} color="#FFFFFF" />
        <Text style={styles.primaryText}>Adicionar Membros</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cloudWrap: { 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 24,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cloudRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  cloudAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: '#121212',
    backgroundColor: '#27272a',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'System',
  },
  heroSub: {
    fontSize: 13,
    color: '#B0B0B0',
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#8A4F9E',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#8A4F9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryText: { 
    color: '#FFFFFF', 
    textAlign: 'center', 
    fontWeight: '800',
    fontSize: 15,
  },
});

