import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';

/**
 * Pulsing indicator that shows non-host players that the host is in control.
 * Replaces bare "Aguardando o host..." strings across waiting screens.
 */
export default function HostWaitingIndicator({ hostName = 'Host', message }) {
    const pulseScale = useSharedValue(1);
    const pulseOpacity = useSharedValue(0.4);

    useEffect(() => {
        pulseScale.value = withRepeat(
            withSequence(
                withTiming(1.6, { duration: 800 }),
                withTiming(1, { duration: 800 })
            ),
            -1,
            false
        );
        pulseOpacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 800 }),
                withTiming(0.4, { duration: 800 })
            ),
            -1,
            false
        );
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: pulseOpacity.value,
    }));

    return (
        <View style={styles.container}>
            <View style={styles.dotRow}>
                <View style={styles.dotWrapper}>
                    <Animated.View style={[styles.dotPulse, pulseStyle]} />
                    <View style={styles.dotCore} />
                </View>
                <Text style={styles.label}>
                    {message || `${hostName} está no controle`}
                </Text>
            </View>
            <Text style={styles.hint}>Aguardando ação do host...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    dotRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 4,
    },
    dotWrapper: {
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dotPulse: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#10B981',
    },
    dotCore: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
    },
    label: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '600',
    },
    hint: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 2,
    },
});
