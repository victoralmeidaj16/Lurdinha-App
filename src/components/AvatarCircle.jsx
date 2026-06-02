import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { avatarColors } from '../theme';
import { resolveAvatarSource } from '../utils/avatarAssets';

const getColorFromName = (name) => {
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

export default function AvatarCircle({ name, size = 32, style, photoURL }) {
  const initials = name ? name.substring(0, 2).toUpperCase() : 'U';
  const color = getColorFromName(name);

  const imageSource = resolveAvatarSource(photoURL);
  const showImage = !!imageSource;

  return (
    <View style={[
      styles.avatar,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: showImage ? 'transparent' : color,
        overflow: 'hidden',
      },
      style
    ]}>
      {showImage ? (
        <Image
          source={imageSource}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
          resizeMode="cover"
        />
      ) : (
        <Text style={[
          styles.avatarText,
          { fontSize: size * 0.4 }
        ]}>
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

