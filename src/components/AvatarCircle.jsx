import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

// Função para gerar cor baseada no nome
const getColorFromName = (name) => {
  const colors = [
    '#8b5cf6', '#FF6B35', '#4CAF50', '#2196F3', 
    '#F44336', '#FFC107', '#E91E63', '#9C27B0',
    '#00BCD4', '#FF9800', '#795548', '#607D8B'
  ];
  
  if (!name) return colors[0];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export default function AvatarCircle({ name, size = 32, style, photoURL }) {
  const initials = name 
    ? name.substring(0, 2).toUpperCase() 
    : 'U';
  const color = getColorFromName(name);
  
  // Se tiver photoURL e não for placeholder, mostrar imagem
  const showImage = photoURL && !photoURL.includes('pravatar');
  
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
          source={{ uri: photoURL }}
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

