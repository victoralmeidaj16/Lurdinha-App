import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function LurdinhaBrandIcon({ size = 56, style, imageStyle }) {
    return (
        <View style={[styles.shell, { width: size, height: size, borderRadius: size / 2 }, style]}>
            <Image
                source={require('../../assets/logo.png')}
                style={[
                    styles.image,
                    { width: size, height: size, borderRadius: size / 2 },
                    imageStyle,
                ]}
                resizeMode="cover"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    shell: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 14,
        elevation: 8,
    },
    image: {
        backgroundColor: 'rgba(139,92,246,0.12)',
    },
});
