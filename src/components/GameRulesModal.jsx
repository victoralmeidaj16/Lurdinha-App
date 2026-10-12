import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lightbulb, Trophy, Users, X } from 'lucide-react-native';
import { getGameRules } from '../utils/gameRules';

function SectionTitle({ icon: Icon, color, children }) {
    return (
        <View style={styles.sectionTitleRow}>
            <Icon size={16} color={color} />
            <Text style={[styles.sectionTitle, { color }]}>{children}</Text>
        </View>
    );
}

// Página em tela cheia com as regras do modo de jogo, aberta pelo ⓘ do lobby.
export default function GameRulesModal({ visible, gameType, onClose }) {
    const insets = useSafeAreaInsets();
    const rules = getGameRules(gameType);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
                <View style={styles.topBar}>
                    <Text style={styles.topBarLabel}>COMO JOGAR</Text>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                        activeOpacity={0.7}
                        accessibilityLabel="Fechar regras"
                    >
                        <X size={20} color="#D4D4DA" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.hero}>
                        <View style={styles.heroEmoji}>
                            <Text style={styles.heroEmojiText}>{rules.emoji}</Text>
                        </View>
                        <Text style={styles.heroTitle}>{rules.title}</Text>
                        <Text style={styles.heroTagline}>{rules.tagline}</Text>
                        <View style={styles.playersPill}>
                            <Users size={13} color="#C4B5FD" />
                            <Text style={styles.playersPillText}>{rules.players}</Text>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardHeading}>Como funciona</Text>
                        {rules.steps.map((step, index) => (
                            <View key={step} style={styles.stepRow}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                                </View>
                                <Text style={styles.stepText}>{step}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.card}>
                        <SectionTitle icon={Trophy} color="#FF6B35">Pontuação</SectionTitle>
                        {rules.scoring.map((item) => (
                            <View key={item} style={styles.bulletRow}>
                                <View style={[styles.bulletDot, { backgroundColor: '#FF6B35' }]} />
                                <Text style={styles.bulletText}>{item}</Text>
                            </View>
                        ))}
                    </View>

                    {rules.tips?.length ? (
                        <View style={styles.card}>
                            <SectionTitle icon={Lightbulb} color="#C4B5FD">Dicas</SectionTitle>
                            {rules.tips.map((tip) => (
                                <View key={tip} style={styles.bulletRow}>
                                    <View style={[styles.bulletDot, { backgroundColor: '#8B5CF6' }]} />
                                    <Text style={styles.bulletText}>{tip}</Text>
                                </View>
                            ))}
                        </View>
                    ) : null}

                    <TouchableOpacity style={styles.doneButton} onPress={onClose} activeOpacity={0.85}>
                        <Text style={styles.doneButtonText}>Entendi</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0B0912',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 8,
    },
    topBarLabel: {
        color: '#8B8B96',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.8,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1C1A24',
        borderWidth: 1,
        borderColor: '#2A2733',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        paddingHorizontal: 20,
        gap: 14,
    },
    hero: {
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 10,
    },
    heroEmoji: {
        width: 84,
        height: 84,
        borderRadius: 26,
        backgroundColor: '#2A1F45',
        borderWidth: 1,
        borderColor: '#3A2F5C',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    heroEmojiText: {
        fontSize: 42,
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: -0.4,
        textAlign: 'center',
    },
    heroTagline: {
        color: '#A1A1AA',
        fontSize: 15,
        lineHeight: 21,
        textAlign: 'center',
        marginTop: 6,
    },
    playersPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 14,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#1E1A28',
        borderWidth: 1,
        borderColor: '#2E2545',
    },
    playersPillText: {
        color: '#C4B5FD',
        fontSize: 12,
        fontWeight: '700',
    },
    card: {
        backgroundColor: '#15131C',
        borderWidth: 1,
        borderColor: '#24212E',
        borderRadius: 20,
        padding: 18,
        gap: 12,
    },
    cardHeading: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 2,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    stepNumber: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#5B21B6',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },
    stepNumberText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },
    stepText: {
        flex: 1,
        color: '#E4E4E7',
        fontSize: 14.5,
        lineHeight: 21,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 8,
    },
    bulletText: {
        flex: 1,
        color: '#D4D4DA',
        fontSize: 14,
        lineHeight: 21,
    },
    doneButton: {
        marginTop: 8,
        height: 54,
        borderRadius: 16,
        backgroundColor: '#7C3AED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
});
