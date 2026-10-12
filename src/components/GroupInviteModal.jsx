import React from 'react';
import {
    ActivityIndicator,
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
import { Check, Plus, UserPlus, Users, X } from 'lucide-react-native';
import { playSound } from '../utils/sounds';

// Converte uma cor hex (#RRGGBB) em rgba com a opacidade informada.
const withAlpha = (hex, alpha) => {
    if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
        return `rgba(139, 92, 246, ${alpha})`;
    }
    const value = parseInt(hex.slice(1), 16);
    return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
};

function GroupCard({ group, selected, onPress }) {
    const memberCount = group.stats?.totalMembers || group.members?.length || 0;
    const groupColor = group.color || '#8B5CF6';

    return (
        <TouchableOpacity
            style={[styles.card, selected && styles.cardSelected]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View
                style={[
                    styles.cardBadge,
                    selected
                        ? styles.cardBadgeSelected
                        : { backgroundColor: withAlpha(groupColor, 0.2), borderColor: withAlpha(groupColor, 0.4) },
                ]}
            >
                <Text style={styles.cardBadgeText}>{group.badge || '👥'}</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={1}>{group.name}</Text>
                <View style={styles.cardMeta}>
                    <Users size={12} color={selected ? '#EDE9FE' : '#8B8B96'} />
                    <Text style={[styles.cardMetaText, selected && styles.cardMetaTextSelected]}>
                        {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
                    </Text>
                </View>
            </View>
            <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? <Check size={13} color="#5B21B6" strokeWidth={3} /> : null}
            </View>
        </TouchableOpacity>
    );
}

export default function GroupInviteModal({
    visible,
    groups = [],
    selectedGroupId,
    onSelectGroup,
    onInvite,
    onCreateGroup,
    onClose,
    loading = false,
    groupsLoading = false,
    confirmLabel = 'Notificar membros do grupo',
    loadingLabel = 'Enviando...',
    subtitle,
    onClearSelection,
    clearLabel = 'Não convidar grupo',
}) {
    const hasGroups = groups.length > 0;
    const canInvite = hasGroups && !!selectedGroupId && !loading;
    const defaultSubtitle = hasGroups
        ? 'Escolha um grupo. Todos os membros recebem um aviso para entrar na sala.'
        : 'Você ainda não tem grupos. Crie um para chamar sua galera de uma vez.';

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

                <Text style={styles.title}>Convidar grupo</Text>
                <Text style={styles.subtitle}>
                    {groupsLoading ? 'Carregando seus grupos...' : (hasGroups && subtitle) || defaultSubtitle}
                </Text>

                {groupsLoading ? (
                    <ActivityIndicator color="#8B5CF6" style={styles.loader} />
                ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                >
                    {groups.map((group) => (
                        <GroupCard
                            key={group.id}
                            group={group}
                            selected={selectedGroupId === group.id}
                            onPress={() => {
                                playSound('ui_toggle');
                                onSelectGroup(group.id);
                            }}
                        />
                    ))}
                    <TouchableOpacity
                        style={[styles.card, styles.createCard]}
                        onPress={onCreateGroup}
                        activeOpacity={0.8}
                    >
                        <View style={styles.createIcon}>
                            <Plus size={20} color="#D4D4DA" />
                        </View>
                        <Text style={styles.createText}>Criar novo grupo</Text>
                    </TouchableOpacity>
                </ScrollView>
                )}

                {hasGroups && !groupsLoading ? (
                    <TouchableOpacity
                        style={[styles.inviteButton, !canInvite && styles.inviteButtonDisabled]}
                        onPress={onInvite}
                        disabled={!canInvite}
                        activeOpacity={0.84}
                    >
                        <UserPlus size={18} color="#fff" />
                        <Text style={styles.inviteButtonText}>
                            {loading ? loadingLabel : confirmLabel}
                        </Text>
                    </TouchableOpacity>
                ) : null}

                {onClearSelection ? (
                    <TouchableOpacity style={styles.cancelBtn} onPress={onClearSelection} activeOpacity={0.7}>
                        <Text style={styles.clearBtnText}>{clearLabel}</Text>
                    </TouchableOpacity>
                ) : null}
            </Animated.View>
        </Modal>
    );
}

const LIST_MAX_HEIGHT = Math.round(Dimensions.get('window').height * 0.45);

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
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 18,
        backgroundColor: '#1A1A1E',
        borderWidth: 1.5,
        borderColor: '#2A2A30',
    },
    cardSelected: {
        backgroundColor: '#5B21B6',
        borderColor: '#5B21B6',
    },
    cardBadgeSelected: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderColor: 'rgba(255,255,255,0.28)',
    },
    cardMetaTextSelected: {
        color: '#EDE9FE',
    },
    cardBadge: {
        width: 46,
        height: 46,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardBadgeText: {
        fontSize: 22,
    },
    cardBody: {
        flex: 1,
    },
    cardName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 4,
    },
    cardMetaText: {
        color: '#8B8B96',
        fontSize: 12,
        fontWeight: '600',
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#3A3A42',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
    },
    createCard: {
        backgroundColor: 'transparent',
        borderStyle: 'dashed',
        borderColor: '#3A3A42',
    },
    createIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: '#222226',
        alignItems: 'center',
        justifyContent: 'center',
    },
    createText: {
        color: '#D4D4DA',
        fontSize: 14,
        fontWeight: '800',
    },
    inviteButton: {
        marginTop: 20,
        marginHorizontal: 24,
        minHeight: 52,
        borderRadius: 16,
        backgroundColor: '#7C3AED',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    inviteButtonDisabled: {
        opacity: 0.5,
    },
    inviteButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
    cancelBtn: {
        alignSelf: 'center',
        marginTop: 14,
        paddingVertical: 8,
        paddingHorizontal: 24,
    },
    clearBtnText: {
        color: '#F87171',
        fontSize: 14,
        fontWeight: '700',
    },
    loader: {
        marginVertical: 48,
    },
});
