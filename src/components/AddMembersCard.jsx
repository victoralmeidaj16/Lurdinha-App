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
import { colors } from '../theme';

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

export default function AddMembersCard({
  onPress,
  memberCount = 0,
  showActionButton = true,
  compact = false,
}) {
  const avatarCount = compact ? 6 : 9;

  return (
    <View style={[styles.cloudWrap, compact && styles.cloudWrapCompact]}>
      <View style={[styles.cloudRow, compact && styles.cloudRowCompact]}>
        {AVATAR_CLOUD.slice(0, avatarCount).map((uri, idx) => (
          <Image
            key={`${uri}-${idx}`}
            source={{ uri }}
            style={[
              styles.cloudAvatar,
              compact && styles.cloudAvatarCompact,
              idx !== 0 && { marginLeft: compact ? -8 : -10 },
            ]}
          />
        ))}
      </View>

      <Text style={[styles.heroTitle, compact && styles.heroTitleCompact]}>
        Convide pessoas para o grupo 👥
      </Text>
      <Text style={[styles.heroSub, compact && styles.heroSubCompact]}>
        {memberCount > 0
          ? `${memberCount} membro${memberCount > 1 ? 's' : ''} no grupo`
          : 'Adicione membros para começar'}
      </Text>

      {showActionButton && (
        <Pressable style={[styles.primaryBtn, compact && styles.primaryBtnCompact]} onPress={onPress}>
          <UserPlus size={compact ? 16 : 18} color="#FFFFFF" />
          <Text style={[styles.primaryText, compact && styles.primaryTextCompact]}>Adicionar Membros</Text>
        </Pressable>
      )}
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
    borderColor: colors.whiteAlpha10,
  },
  cloudWrapCompact: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginHorizontal: 0,
    marginVertical: 10,
  },
  cloudRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  cloudRowCompact: {
    marginBottom: 12,
  },
  cloudAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: '#121212',
    backgroundColor: '#27272a',
  },
  cloudAvatarCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'System',
  },
  heroTitleCompact: {
    fontSize: 16,
  },
  heroSub: {
    fontSize: 13,
    color: '#B0B0B0',
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
  heroSubCompact: {
    marginTop: 2,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: colors.primaryDark,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnCompact: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  primaryText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 15,
  },
  primaryTextCompact: {
    fontSize: 14,
  },
});
