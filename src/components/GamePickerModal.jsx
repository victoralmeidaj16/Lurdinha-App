import React from 'react';
import {
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
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
} from 'react-native-reanimated';
import { ChevronRight, X } from 'lucide-react-native';

export const SOCIAL_GAME_PICKER_OPTIONS = [
    { gameType: 'most_likely', emoji: '👀', label: 'Mais Provável', tagline: 'Quem do grupo faria isso?' },
    { gameType: 'tier_list', emoji: '🏆', label: 'Tier List', tagline: 'Dê nota para a galera' },
    { gameType: 'impostor', emoji: '🎭', label: 'Impostor', tagline: 'Descubra quem blefa' },
    { gameType: 'draw', emoji: '✏️', label: 'Desenho', tagline: 'Rabisque e adivinhe' },
    { gameType: 'obvious_mind', emoji: '🧠', label: 'Óbvio', tagline: 'Entre na cabeça do alvo' },
    { gameType: 'telephone', emoji: '📖', label: 'Telefone', tagline: 'Frase vira desenho vira caos' },
];

const LIST_MAX_HEIGHT = Math.round(Dimensions.get('window').height * 0.55);

// Bottom sheet para escolher qual jogo social abrir com o grupo.
export default function GamePickerModal({ visible, title = 'Jogar com o grupo', subtitle, onPick, onClose }) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <Animated.View
                entering={FadeIn.duration(220)}
                exiting={FadeOut.duration(200)}
                style={styles.backdrop}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            <Animated.View
                entering={SlideInDown.duration(220)}
                exiting={SlideOutDown.duration(220)}
                style={styles.sheet}
            >
                <View style={styles.handle} />
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    activeOpacity={0.7}
                    accessibilityLabel="Fechar"
                >
                    <X size={18} color="#D4D4DA" />
                </TouchableOpacity>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

                <ScrollView
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {SOCIAL_GAME_PICKER_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.gameType}
                            style={styles.card}
                            onPress={() => onPick(option.gameType)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.cardEmoji}>{option.emoji}</Text>
                            <View style={styles.cardBody}>
                                <Text style={styles.cardName}>{option.label}</Text>
                                <Text style={styles.cardTagline} numberOfLines={1}>{option.tagline}</Text>
                            </View>
                            <ChevronRight size={18} color="#6B6B76" />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#111113',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTopWidth: 1,
        borderColor: '#26262B',
        paddingBottom: 36,
        paddingTop: 12,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#222226',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    handle: {
        alignSelf: 'center',
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
        paddingLeft: 24,
        paddingRight: 64,
    },
    subtitle: {
        color: '#A1A1AA',
        fontSize: 13,
        lineHeight: 18,
        marginTop: 6,
        paddingHorizontal: 24,
    },
    list: {
        marginTop: 20,
        flexGrow: 0,
        maxHeight: LIST_MAX_HEIGHT,
    },
    listContent: {
        paddingHorizontal: 24,
        paddingVertical: 2,
        gap: 10,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 18,
        backgroundColor: '#1A1A1E',
        borderWidth: 1.5,
        borderColor: '#2A2A30',
    },
    cardEmoji: {
        fontSize: 30,
        lineHeight: 38,
        width: 40,
        textAlign: 'center',
    },
    cardBody: {
        flex: 1,
    },
    cardName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },
    cardTagline: {
        color: '#8B8B96',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 3,
    },
});
