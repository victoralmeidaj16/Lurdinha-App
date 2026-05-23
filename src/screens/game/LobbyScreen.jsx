import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Share, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Play, Copy, Share2, UserPlus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Header from '../../components/Header';
import AvatarCircle from '../../components/AvatarCircle';
import LurdinhaBrandIcon from '../../components/LurdinhaBrandIcon';
import GameStartCountdownOverlay, {
    GAME_START_NAV_DELAY_MS,
    GAME_START_STEP_MS,
} from '../../components/GameStartCountdownOverlay';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../hooks/useGroups';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../../theme';
import HostWaitingIndicator from '../../components/HostWaitingIndicator';
import {
    formatGameSettingsSummary,
    formatLobbyInviteMessage,
} from '../../utils/gameShare';
import { playSound } from '../../utils/sounds';

export default function LobbyScreen({ route, navigation }) {
    const { roomId } = route.params;
    const { listenToRoom, startGame, removeFromRoom, leaveRoom, inviteGroupToRoom } = useGame();
    const { currentUser } = useAuth();
    const { getUserGroups } = useGroups();
    const [roomData, setRoomData] = useState(null);
    const [adminGroups, setAdminGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [groupInviteLoading, setGroupInviteLoading] = useState(false);
    const roomDataRef = useRef(null);
    const [countdown, setCountdown] = useState(null); // null | 3 | 2 | 1 | 'mascot'
    const [startingGame, setStartingGame] = useState(false);
    const countdownRef = useRef(null);
    const isNavigatingToGameRef = useRef(false);
    const hasRoutedRef = useRef(false);
    const roomStatusRef = useRef('waiting');

    const startCountdown = useCallback((gameType) => {
        if (countdownRef.current !== null) return;
        const steps = [3, 2, 1, 'mascot'];
        steps.forEach((step, i) => {
            setTimeout(() => {
                countdownRef.current = step;
                setCountdown(step);
                if (step === 'mascot') {
                    playSound('winner');
                } else {
                    playSound('countdown_tick');
                }
                if (Platform.OS === 'ios') {
                    Haptics.impactAsync(
                        step === 'mascot' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light
                    );
                }
            }, i * GAME_START_STEP_MS);
        });
        setTimeout(() => {
            isNavigatingToGameRef.current = true;
            navigation.replace(gameType === 'draw' ? 'DrawGame' : 'Game', { roomId });
        }, GAME_START_NAV_DELAY_MS);
    }, [navigation, roomId]);

    useEffect(() => {
        const unsubscribe = listenToRoom(roomId, (data, meta) => {
            if (!data) return;

            if (roomDataRef.current) {
                const prevCount = roomDataRef.current.players?.length || 0;
                const newCount = data.players?.length || 0;
                if (newCount > prevCount) {
                    playSound('ui_tap_soft');
                } else if (newCount < prevCount) {
                    playSound('ui_toggle');
                }
            }

            setRoomData(data);
            roomDataRef.current = data;
            roomStatusRef.current = data.status;
            if (meta?.fromCache) return;
            if (data.status === 'playing' && !hasRoutedRef.current) {
                hasRoutedRef.current = true;
                startCountdown(data.settings?.gameType);
            }
        });

        return () => {
            leaveRoom(); // cancela o listener
            if (!isNavigatingToGameRef.current && roomStatusRef.current === 'waiting') {
                removeFromRoom(roomId); // remove jogador do Firestore só ao sair de fato do lobby
            }
        };
    }, [roomId, startCountdown]);

    useEffect(() => {
        let active = true;
        const loadAdminGroups = async () => {
            try {
                const groups = await getUserGroups();
                if (!active) return;
                const nextAdminGroups = groups.filter((group) => group.admins?.includes(currentUser?.uid));
                setAdminGroups(nextAdminGroups);
                setSelectedGroupId((current) => (
                    current && nextAdminGroups.some((group) => group.id === current)
                        ? current
                        : nextAdminGroups[0]?.id || null
                ));
            } catch {
                if (active) setAdminGroups([]);
            }
        };

        loadAdminGroups();
        return () => {
            active = false;
        };
    }, [currentUser?.uid]);

    const handleStartGame = async () => {
        if (!roomData) return;

        const gameType = roomData.settings?.gameType;
        const isSecretGame = gameType === 'secret' || gameType === 'telephone';
        const isObviousMindGame = gameType === 'obvious_mind';
        const isTierListGame = gameType === 'tier_list';
        const isPartyGame = gameType === 'party';
        const minPlayers = isSecretGame || isObviousMindGame || isTierListGame || isPartyGame ? 2 : 1;

        if (roomData.players.length < minPlayers) {
            Alert.alert(
                'Convide mais alguém',
                isObviousMindGame
                    ? 'Na Minha Cabeça Era Óbvio precisa de pelo menos 2 pessoas para alguém tentar pensar igual ao alvo.'
                    : isTierListGame
                    ? 'Tier List da Galera precisa de pelo menos 2 pessoas para cada jogador classificar os outros.'
                    : isPartyGame
                    ? 'Sessão Completa precisa de pelo menos 2 pessoas para liberar os jogos sociais em sequência.'
                    : isSecretGame
                    ? 'Telefone Sem Fio precisa de pelo menos 2 pessoas para a cadeia funcionar.'
                    : 'É necessário pelo menos 1 jogador para iniciar.'
            );
            return;
        }

        try {
            setStartingGame(true);
            isNavigatingToGameRef.current = true;
            // Start with pre-generated questions using room settings
            await startGame(roomId, roomData.settings.totalRounds, roomData.settings.theme);
        } catch (err) {
            setStartingGame(false);
            isNavigatingToGameRef.current = false;
            Alert.alert('Erro', 'Não foi possível iniciar a partida.');
        }
    };

    const handleCopyCode = async () => {
        await Clipboard.setStringAsync(roomId);
        Alert.alert('Sucesso', 'Código copiado para a área de transferência!');
    };

    const handleInvitePlayers = async () => {
        try {
            await Share.share({
                message: formatLobbyInviteMessage({
                    roomId,
                    settings: roomData?.settings,
                    inviterName: currentUser?.displayName || roomData?.players?.find((player) => player.uid === currentUser?.uid)?.name,
                }),
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleInviteGroup = async () => {
        if (!selectedGroupId) {
            Alert.alert('Selecione um grupo', 'Você precisa escolher um grupo onde é admin.');
            return;
        }

        try {
            setGroupInviteLoading(true);
            const result = await inviteGroupToRoom(roomId, selectedGroupId);
            Alert.alert('Convite enviado', `O grupo ${result.groupName} foi chamado para entrar nesta sala.`);
        } catch (err) {
            Alert.alert('Erro', err.message || 'Não foi possível convidar o grupo.');
        } finally {
            setGroupInviteLoading(false);
        }
    };

    const isHost = roomData?.hostId === currentUser?.uid;
    const gameType = roomData?.settings?.gameType;
    const isTelephone = gameType === 'telephone' || gameType === 'secret';
    const needsGroupToStart = gameType === 'telephone'
        || gameType === 'secret'
        || gameType === 'obvious_mind'
        || gameType === 'tier_list'
        || gameType === 'party';
    const canStart = !needsGroupToStart || (roomData?.players?.length || 0) >= 2;
    const settingsSummary = formatGameSettingsSummary(roomData?.settings);
    const selectedGroup = adminGroups.find((group) => group.id === selectedGroupId);
    const invitedGroupName = roomData?.groupInvite?.groupName || roomData?.invitedGroupName;
    const canInviteGroup = isHost && selectedGroup && roomData?.status === 'waiting' && !groupInviteLoading;

    if (!roomData) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={['#4c1d95', '#2e1065']} style={styles.background} />
                <Header title="Carregando..." transparent showBack />
                <ScrollView
                    style={styles.loadingContainer}
                    contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                    bounces={false}
                    overScrollMode="never"
                >
                    <Text style={styles.loadingText}>Entrando na sala...</Text>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#4c1d95', '#2e1065']}
                style={styles.background}
            />

            <GameStartCountdownOverlay phase={countdown} />

            <Header title="Lobby" transparent onBack={() => navigation.goBack()} />

            <ScrollView
                style={styles.content}
                bounces={false}
                overScrollMode="never"
            >
                <View style={[styles.codeSection, isTelephone && styles.brandCard]}>
                    {isTelephone && <View style={styles.cardAccentOrb} />}
                    {isTelephone && (
                        <View style={styles.brandAccentRow}>
                            <View style={styles.brandAccentGlow} />
                            <View style={styles.brandAccentLine} />
                        </View>
                    )}
                    <View style={styles.codeBrandRow}>
                        <LurdinhaBrandIcon size={52} />
                        <View style={styles.codeBrandText}>
                            <Text style={styles.codeLabel}>CÓDIGO DA SALA</Text>
                            <Text style={styles.codeHint}>Compartilhe com quem vai jogar</Text>
                        </View>
                    </View>

                    <View style={styles.codeRow}>
                        <View style={styles.codeDisplay}>
                            <Text style={styles.codeText}>{roomId}</Text>
                        </View>
                    </View>

                    <View style={styles.actionButtonsRow}>
                        <TouchableOpacity style={styles.actionButton} onPress={handleCopyCode}>
                            <Copy size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Copiar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={handleInvitePlayers}>
                            <Share2 size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Convidar</Text>
                        </TouchableOpacity>
                    </View>

                    {isHost && adminGroups.length > 0 ? (
                        <View style={styles.groupInvitePanel}>
                            <View style={styles.groupInviteHeader}>
                                <View style={styles.groupInviteTitleRow}>
                                    <UserPlus size={17} color="#C4B5FD" />
                                    <Text style={styles.groupInviteTitle}>Convidar grupo</Text>
                                </View>
                                {invitedGroupName ? (
                                    <Text style={styles.groupInviteStatus} numberOfLines={1}>
                                        Chamado: {invitedGroupName}
                                    </Text>
                                ) : null}
                            </View>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.groupChipsRow}
                            >
                                {adminGroups.map((group) => {
                                    const selected = selectedGroupId === group.id;
                                    return (
                                        <TouchableOpacity
                                            key={group.id}
                                            style={[styles.groupChip, selected && styles.groupChipSelected]}
                                            onPress={() => setSelectedGroupId(group.id)}
                                            activeOpacity={0.78}
                                        >
                                            <Text style={styles.groupChipText} numberOfLines={1}>
                                                {group.badge || '👥'} {group.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            <TouchableOpacity
                                style={[styles.groupInviteButton, !canInviteGroup && styles.groupInviteButtonDisabled]}
                                onPress={handleInviteGroup}
                                disabled={!canInviteGroup}
                                activeOpacity={0.84}
                            >
                                <UserPlus size={18} color="#fff" />
                                <Text style={styles.groupInviteButtonText}>
                                    {groupInviteLoading ? 'Enviando...' : 'Notificar membros do grupo'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}

                    <Text style={styles.settingsText}>
                        {settingsSummary}
                    </Text>
                </View>

                <View style={[styles.playersSection, isTelephone && styles.brandCard]}>
                    {isTelephone && <View style={styles.cardAccentOrb} />}
                    <View style={styles.playersHeader}>
                        <Users size={20} color="#a78bfa" />
                        <Text style={styles.playersTitle}>
                            Jogadores ({roomData.players.length})
                        </Text>
                    </View>

                    <FlatList
                        data={roomData.players}
                        keyExtractor={item => item.uid}
                        numColumns={3}
                        columnWrapperStyle={styles.playersGrid}
                        renderItem={({ item }) => (
                            <View style={styles.playerItem}>
                                <AvatarCircle
                                    name={item.name}
                                    photoURL={item.photoURL}
                                    size={64}
                                    style={styles.playerAvatar}
                                />
                                <Text style={styles.playerName} numberOfLines={1}>
                                    {item.name}
                                    {item.uid === roomData.hostId && ' 👑'}
                                </Text>
                            </View>
                        )}
                    />
                </View>

                {isHost ? (
                    <View style={styles.footer}>
                        {needsGroupToStart && !canStart ? (
                            <Text style={styles.startHint}>
                                Convide pelo menos mais 1 pessoa para liberar este jogo.
                            </Text>
                        ) : null}
                        <TouchableOpacity
                            style={[styles.startButton, (!canStart || startingGame) && styles.startButtonDisabled]}
                            onPress={handleStartGame}
                            disabled={!canStart || startingGame}
                        >
                            <LinearGradient
                                colors={canStart && !startingGame ? ['#8b5cf6', '#7c3aed'] : ['#3F3F46', '#27272A']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientButton}
                            >
                                <Text style={styles.startButtonText}>{startingGame ? 'Abrindo contagem...' : 'Iniciar Partida'}</Text>
                                <Play size={24} color="#fff" fill="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.footer}>
                        <HostWaitingIndicator hostName={roomData?.players?.find(p => p.uid === roomData?.hostId)?.name} />
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2e1065',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    loadingContainer: {
        flex: 1,
    },
    loadingText: {
        color: '#fff',
        marginTop: 20,
    },
    codeSection: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 10,
    },
    brandCard: {
        backgroundColor: '#18181B',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(168,85,247,0.16)',
        padding: 18,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#6D28D9',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 4,
    },
    cardAccentOrb: {
        position: 'absolute',
        right: -18,
        top: '50%',
        width: 72,
        height: 72,
        marginTop: -36,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.025)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    brandAccentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    brandAccentGlow: {
        width: 10,
        height: 10,
        borderRadius: 999,
        backgroundColor: '#A855F7',
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.65,
        shadowRadius: 10,
        elevation: 5,
    },
    brandAccentLine: {
        width: 64,
        height: 4,
        borderRadius: 999,
        backgroundColor: '#8B5CF6',
    },
    codeLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#C4B5FD',
        letterSpacing: 1,
    },
    codeHint: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 13,
        marginTop: 4,
    },
    codeBrandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'stretch',
        gap: 12,
        marginBottom: 12,
    },
    codeBrandText: {
        flex: 1,
        minWidth: 0,
    },
    codeRow: {
        marginBottom: 16,
    },
    codeDisplay: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(168,85,247,0.18)',
    },
    codeText: {
        fontSize: 36,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 6,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        gap: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    groupInvitePanel: {
        alignSelf: 'stretch',
        backgroundColor: 'rgba(255,255,255,0.045)',
        borderWidth: 1,
        borderColor: 'rgba(196,181,253,0.16)',
        borderRadius: 18,
        padding: 12,
        marginBottom: 16,
        gap: 10,
    },
    groupInviteHeader: {
        gap: 4,
    },
    groupInviteTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    groupInviteTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    groupInviteStatus: {
        color: '#C4B5FD',
        fontSize: 12,
        fontWeight: '700',
    },
    groupChipsRow: {
        gap: 8,
        paddingRight: 2,
    },
    groupChip: {
        maxWidth: 180,
        paddingVertical: 7,
        paddingHorizontal: 11,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    groupChipSelected: {
        backgroundColor: 'rgba(139,92,246,0.30)',
        borderColor: 'rgba(196,181,253,0.42)',
    },
    groupChipText: {
        color: '#EDE9FE',
        fontSize: 12,
        fontWeight: '700',
    },
    groupInviteButton: {
        minHeight: 44,
        borderRadius: 14,
        backgroundColor: '#7C3AED',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    groupInviteButtonDisabled: {
        opacity: 0.55,
    },
    groupInviteButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    settingsText: {
        color: 'rgba(255,255,255,0.52)',
        fontSize: 14,
        textAlign: 'center',
    },
    playersSection: {
        flex: 1,
    },
    playersHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 8,
    },
    playersTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    playersGrid: {
        gap: 16,
        justifyContent: 'flex-start',
    },
    playerItem: {
        alignItems: 'center',
        width: '30%',
        marginBottom: 24,
    },
    playerAvatar: {
        marginBottom: 8,
        borderWidth: 2,
        borderColor: '#a78bfa',
    },
    playerName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    footer: {
        paddingVertical: 20,
    },
    startButton: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    startButtonDisabled: {
        shadowOpacity: 0,
        opacity: 0.72,
    },
    startHint: {
        color: '#DDD6FE',
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 10,
    },
    gradientButton: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
});
