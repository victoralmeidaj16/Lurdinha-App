import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme';

/**
 * SkeletonLoader — Indicador de carregamento com efeito de "shimmer".
 * Substitui spinners genéricos por um visual premium.
 * 
 * Props:
 *   width   — Largura do bloco (number | string). Default: '100%'
 *   height  — Altura do bloco. Default: 16
 *   radius  — Border radius. Default: 8
 *   style   — Estilos extras
 * 
 * Uso:
 *   <SkeletonLoader width="60%" height={20} />
 *   <SkeletonLoader width={200} height={200} radius={100} /> // Circular
 */
export default function SkeletonLoader({
    width = '100%',
    height = 16,
    radius = 8,
    style
}) {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1200,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [shimmerAnim]);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius: radius,
                    opacity,
                },
                style,
            ]}
        />
    );
}

/**
 * SkeletonCard — Esqueleto pré-formatado de um card genérico (título + linhas).
 */
export function SkeletonCard({ style }) {
    return (
        <View style={[styles.card, style]}>
            <SkeletonLoader width="45%" height={14} />
            <SkeletonLoader width="100%" height={12} style={{ marginTop: 12 }} />
            <SkeletonLoader width="80%" height={12} style={{ marginTop: 8 }} />
            <SkeletonLoader width="30%" height={10} style={{ marginTop: 16 }} />
        </View>
    );
}

/**
 * SkeletonList — Lista de N skeleton cards para simular carregamento de listas.
 */
export function SkeletonList({ count = 3, style }) {
    return (
        <View style={style}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} style={{ marginBottom: 12 }} />
            ))}
        </View>
    );
}

/**
 * SkeletonAvatar — Esqueleto circular (para avatares).
 */
export function SkeletonAvatar({ size = 48 }) {
    return <SkeletonLoader width={size} height={size} radius={size / 2} />;
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#27272a', // Zinc-800
    },
    card: {
        backgroundColor: '#18181b',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
});
