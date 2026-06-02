import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AVATAR_ASSET_MAP, AVATAR_IDS } from '../utils/avatarAssets';

const { width: SCREEN_W } = Dimensions.get('window');
const NUM_COLS = 5;
const CELL_GAP = 10;
const GRID_H_PADDING = 24;
const CELL_SIZE = Math.floor((SCREEN_W - GRID_H_PADDING * 2 - CELL_GAP * (NUM_COLS - 1)) / NUM_COLS);

function AvatarCell({ id, selected, onPress }) {
    const scale = useSharedValue(1);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePress = () => {
        scale.value = withSpring(0.88, { damping: 10, stiffness: 300 }, () => {
            scale.value = withSpring(1, { damping: 12, stiffness: 280 });
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress(id);
    };

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
            <Animated.View style={[styles.cell, selected && styles.cellSelected, animStyle]}>
                <Image
                    source={AVATAR_ASSET_MAP[id]}
                    style={styles.cellImage}
                    resizeMode="cover"
                />
                {selected && <View style={styles.cellCheckRing} />}
            </Animated.View>
        </TouchableOpacity>
    );
}

export default function AvatarPickerModal({ visible, currentAvatarId, onConfirm, onClose }) {
    const [pending, setPending] = useState(currentAvatarId ?? null);

    useEffect(() => {
        if (visible) setPending(currentAvatarId ?? null);
    }, [visible, currentAvatarId]);

    const handleConfirm = useCallback(() => {
        if (pending) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            onConfirm(pending);
        }
        onClose();
    }, [pending, onConfirm, onClose]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <Animated.View
                entering={FadeIn.duration(220)}
                exiting={FadeOut.duration(200)}
                style={styles.backdrop}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            {/* Sheet */}
            <Animated.View
                entering={SlideInDown.springify().damping(22).stiffness(240)}
                exiting={SlideOutDown.duration(220)}
                style={styles.sheet}
            >
                {/* Handle */}
                <View style={styles.handle} />

                <Text style={styles.title}>Escolha seu avatar</Text>
                <Text style={styles.subtitle}>Como os outros vão te ver no lobby</Text>

                {/* Avatar grid */}
                <View style={styles.grid}>
                    {AVATAR_IDS.map((id) => (
                        <AvatarCell
                            key={id}
                            id={id}
                            selected={pending === id}
                            onPress={setPending}
                        />
                    ))}
                </View>

                {/* Confirm button */}
                <TouchableOpacity
                    style={[styles.confirmBtn, !pending && styles.confirmBtnDisabled]}
                    onPress={handleConfirm}
                    disabled={!pending}
                    activeOpacity={0.84}
                >
                    <Text style={styles.confirmBtnText}>Confirmar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.72)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#120d1f',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTopWidth: 1,
        borderColor: 'rgba(139,92,246,0.22)',
        paddingHorizontal: GRID_H_PADDING,
        paddingBottom: 36,
        paddingTop: 12,
        alignItems: 'center',
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 99,
        backgroundColor: 'rgba(255,255,255,0.18)',
        marginBottom: 22,
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
        marginBottom: 24,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: CELL_GAP,
        justifyContent: 'center',
        marginBottom: 28,
    },
    cell: {
        width: CELL_SIZE,
        height: CELL_SIZE,
        borderRadius: CELL_SIZE * 0.28,
        overflow: 'hidden',
        backgroundColor: '#1e1730',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    cellSelected: {
        borderColor: '#A78BFA',
        borderWidth: 2.5,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
        elevation: 8,
    },
    cellImage: {
        width: '100%',
        height: '100%',
    },
    cellCheckRing: {
        position: 'absolute',
        inset: 0,
        borderRadius: CELL_SIZE * 0.26,
        borderWidth: 2.5,
        borderColor: '#A78BFA',
    },
    confirmBtn: {
        width: '100%',
        backgroundColor: '#7C3AED',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    confirmBtnDisabled: {
        opacity: 0.45,
    },
    confirmBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    cancelBtn: {
        paddingVertical: 8,
    },
    cancelBtnText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        fontWeight: '600',
    },
});
