import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Play, Copy, Share2, UserPlus, ChevronDown, ChevronUp, Pencil } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withSequence,
    runOnJS,
} from 'react-native-reanimated';
import Header from '../../components/Header';
import AvatarCircle from '../../components/AvatarCircle';
import AvatarPickerModal from '../../components/AvatarPickerModal';
import LurdinhaBrandIcon from '../../components/LurdinhaBrandIcon';
import GameStartCountdownOverlay, {
    GAME_START_NAV_DELAY_MS,
    GAME_START_STEP_MS,
} from '../../components/GameStartCountdownOverlay';
import { useGame } from '../../hooks/useGame';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../hooks/useGroups';
import * as Clipboard from 'expo-clipboard';
import { colors, motion } from '../../theme';
import { Trophy } from 'lucide-react-native';
import HostWaitingIndicator from '../../components/HostWaitingIndicator';
import {
    formatGameSettingsSummary,
    formatLobbyInviteMessage,
} from '../../utils/gameShare';
import { playSound } from '../../utils/sounds';
import {
    DEFAULT_DRAW_CONTENT_MODE,
    DEFAULT_DRAW_WORD_CATEGORY,
} from '../../utils/drawContent';
import { DEFAULT_LURDINHA_THEME } from '../../hooks/game/lurdinha';
import { DEFAULT_MOST_LIKELY_CATEGORY } from '../../hooks/game/mostLikely';
import { DEFAULT_TIER_LIST_CATEGORY } from '../../hooks/game/tierList';

const SOCIAL_GAME_OPTIONS = [
    { key: 'lurdinha', emoji: '😈', title: 'Lurdinha', minPlayers: 1 },
    { key: 'draw', emoji: '✏️', title: 'Desenho', minPlayers: 1 },
    { key: 'most_likely', emoji: '👀', title: 'Mais Provável', minPlayers: 2 },
    { key: 'obvious_mind', emoji: '🧠', title: 'Na Minha Cabeça', minPlayers: 2 },
    { key: 'secret', emoji: '📖', title: 'Telefone', minPlayers: 2 },
    { key: 'tier_list', emoji: '🏆', title: 'Tier List', minPlayers: 2 },
    { key: 'impostor', emoji: '🎭', title: 'Impostor', minPlayers: 3 },
];

const buildDefaultSettingsForGame = (gameType) => {
    const isSecretGame = gameType === 'secret' || gameType === 'telephone';

    return {
        gameType,
        timePerRound: isSecretGame ? 60 : gameType === 'draw' ? 60 : (gameType === 'most_likely' || gameType === 'obvious_mind') ? 30 : 20,
        totalRounds: gameType === 'draw' ? 1 : 5,
        theme: DEFAULT_LURDINHA_THEME,
        difficulty: gameType === 'draw' ? 'normal' : undefined,
        contentMode: gameType === 'draw' ? DEFAULT_DRAW_CONTENT_MODE : undefined,
        drawCategory: gameType === 'draw' ? DEFAULT_DRAW_WORD_CATEGORY : undefined,
        category: gameType === 'most_likely'
            ? DEFAULT_MOST_LIKELY_CATEGORY
            : gameType === 'tier_list'
            ? DEFAULT_TIER_LIST_CATEGORY
            : undefined,
        voteMode: gameType === 'most_likely' ? 'secret' : undefined,
        allowSelfVote: gameType === 'most_likely' ? false : undefined,
    };
};

// ─── Animated player card with pop-in effect ───────────────────
function AnimatedPlayerItem({ item, isHost, isNew, onEditAvatar }) {
    const scale = useSharedValue(isNew ? 0 : 1);
    const glowOpacity = useSharedValue(isNew ? 1 : 0);
    const glowScale = useSharedValue(isNew ? 1 : 1.6);

    useEffect(() => {
        if (!isNew) return;

        // Haptic on pop-in
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }

        // Avatar scale: 0 → 1.3 → 1
        scale.value = withSequence(
            withSpring(1.3, { damping: 10, stiffness: 260, mass: 0.6 }),
            withSpring(1,   { damping: 14, stiffness: 200, mass: 0.5 })
        );

        // Glow ring expands and fades out
        glowScale.value = withTiming(2.0, { duration: 700 });
        glowOpacity.value = withTiming(0, { duration: 700 });
    }, []);

    const avatarStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
        transform: [{ scale: glowScale.value }],
    }));

    return (
        <View style={styles.playerItem}>
            <View style={styles.playerAvatarWrapper}>
                {/* Glow ring */}
                <Animated.View style={[styles.playerGlowRing, glowStyle]} />
                {/* Avatar */}
                <Animated.View style={avatarStyle}>
                    <AvatarCircle
                        name={item.name}
                        photoURL={item.photoURL}
                        size={56}
                        style={styles.playerAvatar}
                    />
                </Animated.View>
                {/* Host crown badge */}
                {item.uid === isHost && (
                    <View style={styles.hostBadge}>
                        <Text style={styles.hostBadgeText}>👑</Text>
                    </View>
                )}
                {/* Edit pencil — only for the current user */}
                {!!onEditAvatar && (
                    <TouchableOpacity
                        style={styles.editAvatarBtn}
                        onPress={onEditAvatar}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Pencil size={10} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>
            <Text style={styles.playerName} numberOfLines={1}>
                {item.name}
            </Text>
        </View>
    );
}

export default function LobbyScreen({ route, navigation }) {
    const { roomId } = route.params;
    const { listenToRoom, startGame, removeFromRoom, leaveRoom, inviteGroupToRoom, updateRoomSettings, updateMyAvatarInRoom } = useGame();
    const { currentUser } = useAuth();
    const { getUserGroups } = useGroups();
    const [roomData, setRoomData] = useState(null);
    const [newPlayerUids, setNewPlayerUids] = useState(new Set());
    const [userGroups, setUserGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [showGroupInviteOptions, setShowGroupInviteOptions] = useState(false);
    const [groupInviteLoading, setGroupInviteLoading] = useState(false);
    const [nextGameSaving, setNextGameSaving] = useState(false);
    const roomDataRef = useRef(null);
    const knownPlayerUidsRef = useRef(new Set()); // tracks UIDs already shown (no pop-in)
    const [countdown, setCountdown] = useState(null); // null | 3 | 2 | 1 | 'mascot'
    const [startingGame, setStartingGame] = useState(false);
    const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
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

            // Detect newly joined players for pop-in animation
            const currentPlayers = data.players || [];
            const incoming = new Set();
            currentPlayers.forEach((p) => {
                if (!knownPlayerUidsRef.current.has(p.uid)) {
                    // First batch (initial load) — don't animate, just register
                    if (knownPlayerUidsRef.current.size > 0) {
                        incoming.add(p.uid);
                    }
                    knownPlayerUidsRef.current.add(p.uid);
                }
            });
            if (incoming.size > 0) {
                setNewPlayerUids((prev) => new Set([...prev, ...incoming]));
                // Clear the "new" flag after animation completes
                setTimeout(() => {
                    setNewPlayerUids((prev) => {
                        const next = new Set(prev);
                        incoming.forEach((uid) => next.delete(uid));
                        return next;
                    });
                }, 900);
            }

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
        const loadUserGroups = async () => {
            try {
                const groups = await getUserGroups();
                if (!active) return;
                setUserGroups(groups);
                setSelectedGroupId((current) => (
                    current && groups.some((group) => group.id === current)
                        ? current
                        : null
                ));
            } catch {
                if (active) setUserGroups([]);
            }
        };

        loadUserGroups();
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
        const isImpostorGame = gameType === 'impostor';
        const minPlayers = isImpostorGame ? 3 : isSecretGame || isObviousMindGame || isTierListGame || isPartyGame ? 2 : 1;

        if (roomData.players.length < minPlayers) {
            Alert.alert(
                'Convide mais alguém',
                isImpostorGame
                    ? 'Impostor precisa de pelo menos 3 pessoas para ter suspeitos suficientes.'
                    : isObviousMindGame
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
            Alert.alert('Selecione um grupo', 'Você precisa escolher um grupo.');
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

    const handleAvatarConfirm = useCallback(async (avatarId) => {
        try {
            await updateMyAvatarInRoom(roomId, avatarId);
        } catch (err) {
            Alert.alert('Erro', 'Não foi possível atualizar o avatar.');
        }
    }, [roomId, updateMyAvatarInRoom]);

    const handleSelectNextGame = async (nextGameType) => {
        if (!isHost || nextGameType === gameType || nextGameSaving) return;

        try {
            setNextGameSaving(true);
            await updateRoomSettings(roomId, buildDefaultSettingsForGame(nextGameType));
            playSound('ui_toggle');
        } catch (err) {
            Alert.alert('Erro', err.message || 'Não foi possível escolher o próximo jogo.');
        } finally {
            setNextGameSaving(false);
        }
    };

    const isHost = roomData?.hostId === currentUser?.uid;
    const gameType = roomData?.settings?.gameType;
    const hasSessionLobby = (roomData?.sessionGames?.length || 0) > 0 && roomData?.status === 'waiting';
    const isTelephone = gameType === 'telephone' || gameType === 'secret';
    const needsGroupToStart = gameType === 'telephone'
        || gameType === 'secret'
        || gameType === 'obvious_mind'
        || gameType === 'tier_list'
        || gameType === 'impostor'
        || gameType === 'party';
    const selectedGameOption = SOCIAL_GAME_OPTIONS.find((option) => option.key === gameType);
    const minPlayersToStart = selectedGameOption?.minPlayers || (needsGroupToStart ? 2 : 1);
    const canStart = (roomData?.players?.length || 0) >= minPlayersToStart;
    const settingsSummary = formatGameSettingsSummary(roomData?.settings);
    const selectedGroup = userGroups.find((group) => group.id === selectedGroupId);
    const invitedGroupName = roomData?.groupInvite?.groupName || roomData?.invitedGroupName;
    const canInviteGroup = isHost && selectedGroup && roomData?.status === 'waiting' && !groupInviteLoading;
    const handleToggleGroupInviteOptions = () => {
        setShowGroupInviteOptions((visible) => {
            const nextVisible = !visible;
            if (nextVisible && !selectedGroupId && userGroups.length > 0) {
                setSelectedGroupId(userGroups[0].id);
            }
            return nextVisible;
        });
    };

    if (!roomData) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={['#4c1d95', '#2e1065']} style={styles.background} />
                <Header title="Carregando..." transparent showBack showSoundToggle />
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

            <Header title="Lobby" transparent onBack={() => navigation.goBack()} showSoundToggle />

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

                    {isHost && userGroups.length > 0 ? (
                        <View style={[styles.groupInvitePanel, !showGroupInviteOptions && styles.groupInvitePanelCollapsed]}>
                            <TouchableOpacity
                                style={styles.groupInviteHeader}
                                onPress={handleToggleGroupInviteOptions}
                                activeOpacity={0.78}
                            >
                                <View style={styles.groupInviteTitleRow}>
                                    <UserPlus size={17} color="#C4B5FD" />
                                    <Text style={styles.groupInviteTitle}>Convidar grupo</Text>
                                    {showGroupInviteOptions ? (
                                        <ChevronUp size={17} color="#C4B5FD" />
                                    ) : (
                                        <ChevronDown size={17} color="#C4B5FD" />
                                    )}
                                </View>
                                {invitedGroupName ? (
                                    <Text style={styles.groupInviteStatus} numberOfLines={1}>
                                        Chamado: {invitedGroupName}
                                    </Text>
                                ) : null}
                            </TouchableOpacity>

                            {showGroupInviteOptions ? (
                                <>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.groupChipsRow}
                                    >
                                        {userGroups.map((group) => {
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
                                </>
                            ) : null}
                        </View>
                    ) : null}

                    <Text style={styles.settingsText}>
                        {settingsSummary}
                    </Text>
                </View>

                {hasSessionLobby ? (
                    <View style={styles.nextGamePanel}>
                        <View style={styles.nextGameHeader}>
                            <Text style={styles.nextGameKicker}>PRÓXIMO JOGO</Text>
                            <Text style={styles.nextGameTitle}>
                                {isHost ? 'Escolha o jogo social' : 'Aguardando escolha do host'}
                            </Text>
                            <Text style={styles.nextGameSubtitle}>
                                {isHost
                                    ? 'Os mesmos jogadores continuam no lobby. Escolha um modo e inicie quando todo mundo estiver pronto.'
                                    : `${roomData?.players?.find((player) => player.uid === roomData?.hostId)?.name || 'Host'} vai escolher o próximo modo.`}
                            </Text>
                        </View>

                        <View style={styles.nextGameGrid}>
                            {SOCIAL_GAME_OPTIONS.map((option) => {
                                const selected = option.key === gameType;
                                const locked = (roomData?.players?.length || 0) < option.minPlayers;

                                return (
                                    <TouchableOpacity
                                        key={option.key}
                                        style={[
                                            styles.nextGameOption,
                                            selected && styles.nextGameOptionSelected,
                                            (!isHost || locked || nextGameSaving) && styles.nextGameOptionDisabled,
                                        ]}
                                        onPress={() => handleSelectNextGame(option.key)}
                                        disabled={!isHost || locked || nextGameSaving}
                                        activeOpacity={0.78}
                                    >
                                        <Text style={styles.nextGameEmoji}>{option.emoji}</Text>
                                        <Text style={[styles.nextGameOptionTitle, selected && styles.nextGameOptionTitleSelected]} numberOfLines={1}>
                                            {option.title}
                                        </Text>
                                        <Text style={styles.nextGameOptionMeta}>
                                            {locked ? `${option.minPlayers}+ jogadores` : selected ? 'Selecionado' : `${option.minPlayers}+`}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ) : null}

                {/* Session ranking panel */}
                {(roomData.sessionGames?.length > 0) && (() => {
                    const sessionScores = roomData.sessionScores || {};
                    const sessionGames = roomData.sessionGames || [];
                    const sortedBySession = [...(roomData.players || [])].sort(
                        (a, b) => (sessionScores[b.uid] || 0) - (sessionScores[a.uid] || 0)
                    );
                    const GAME_LABELS = {
                        lurdinha: 'Lurdinha', draw: 'Desenho', most_likely: 'Mais Provável',
                        obvious_mind: 'Na Minha Cabeça', tier_list: 'Tier List',
                        impostor: 'Impostor', telephone: 'Telefone', secret: 'Telefone',
                    };
                    return (
                        <View style={styles.sessionPanel}>
                            <View style={styles.sessionPanelHeader}>
                                <Trophy size={16} color="#C4B5FD" />
                                <Text style={styles.sessionPanelTitle}>Placar da Sessão</Text>
                                <Text style={styles.sessionPanelCount}>{sessionGames.length} jogo{sessionGames.length > 1 ? 's' : ''}</Text>
                            </View>
                            <View style={styles.sessionGameRow}>
                                {sessionGames.map((g, i) => (
                                    <View key={i} style={styles.sessionGameBadge}>
                                        <Text style={styles.sessionGameBadgeText}>{GAME_LABELS[g.gameType] || g.gameType}</Text>
                                    </View>
                                ))}
                            </View>
                            {sortedBySession.map((player, index) => (
                                <View key={player.uid} style={[styles.sessionPlayerRow, player.uid === currentUser?.uid && styles.sessionPlayerRowMe]}>
                                    <Text style={styles.sessionPlayerRank}>#{index + 1}</Text>
                                    <AvatarCircle name={player.name} photoURL={player.photoURL} size={30} />
                                    <Text style={styles.sessionPlayerName} numberOfLines={1}>{player.name}</Text>
                                    <Text style={[styles.sessionPlayerScore, index === 0 && { color: '#FFC107' }]}>
                                        {sessionScores[player.uid] || 0} pts
                                    </Text>
                                </View>
                            ))}
                        </View>
                    );
                })()}

                <View style={[styles.playersSection, isTelephone && styles.brandCard]}>
                    {isTelephone && <View style={styles.cardAccentOrb} />}
                    <View style={styles.playersHeader}>
                        <Users size={20} color="#a78bfa" />
                        <Text style={styles.playersTitle}>
                            Jogadores ({roomData.players.length})
                        </Text>
                    </View>

                    <View style={styles.playersGridWrap}>
                        {roomData.players.map((item) => (
                            <View key={item.uid} style={styles.playersGridItem}>
                                <AnimatedPlayerItem
                                    item={item}
                                    isHost={roomData.hostId}
                                    isNew={newPlayerUids.has(item.uid)}
                                    onEditAvatar={item.uid === currentUser?.uid ? () => setAvatarPickerOpen(true) : undefined}
                                />
                            </View>
                        ))}
                    </View>
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

            {/* Avatar picker */}
            <AvatarPickerModal
                visible={avatarPickerOpen}
                currentAvatarId={roomData?.players?.find(p => p.uid === currentUser?.uid)?.photoURL}
                onConfirm={handleAvatarConfirm}
                onClose={() => setAvatarPickerOpen(false)}
            />
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
    groupInvitePanelCollapsed: {
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.025)',
        borderColor: 'rgba(196,181,253,0.12)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 14,
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
    nextGamePanel: {
        marginBottom: 24,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(196,181,253,0.22)',
        backgroundColor: 'rgba(255,255,255,0.055)',
        gap: 14,
    },
    nextGameHeader: {
        gap: 4,
    },
    nextGameKicker: {
        color: '#A78BFA',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.9,
    },
    nextGameTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
    },
    nextGameSubtitle: {
        color: 'rgba(226,232,240,0.64)',
        fontSize: 13,
        lineHeight: 18,
    },
    nextGameGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    nextGameOption: {
        width: '31.5%',
        minHeight: 94,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        backgroundColor: 'rgba(15,23,42,0.55)',
        padding: 10,
        justifyContent: 'space-between',
    },
    nextGameOptionSelected: {
        borderColor: '#A78BFA',
        backgroundColor: 'rgba(139,92,246,0.22)',
    },
    nextGameOptionDisabled: {
        opacity: 0.58,
    },
    nextGameEmoji: {
        fontSize: 22,
    },
    nextGameOptionTitle: {
        color: 'rgba(255,255,255,0.86)',
        fontSize: 12,
        fontWeight: '900',
    },
    nextGameOptionTitleSelected: {
        color: '#FFFFFF',
    },
    nextGameOptionMeta: {
        color: 'rgba(226,232,240,0.52)',
        fontSize: 10,
        fontWeight: '800',
    },
    playersSection: {
        marginBottom: 8,
    },
    playersHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    playersTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    playersGridWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    playersGridItem: {
        width: '22%',
        flexGrow: 1,
        maxWidth: '25%',
    },
    playerItem: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.12)',
        paddingVertical: 14,
        paddingHorizontal: 6,
        gap: 8,
    },
    playerAvatarWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        width: 56,
        height: 56,
    },
    playerGlowRing: {
        position: 'absolute',
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2.5,
        borderColor: '#A78BFA',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 12,
        elevation: 10,
    },
    playerAvatar: {
        borderWidth: 2,
        borderColor: '#a78bfa',
    },
    hostBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#2e1065',
        alignItems: 'center',
        justifyContent: 'center',
    },
    hostBadgeText: {
        fontSize: 11,
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#7C3AED',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#2e1065',
    },
    playerName: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 11,
        fontWeight: '700',
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

    // ── Session panel ─────────────────────────────────────────────────────────
    sessionPanel: {
        backgroundColor: 'rgba(139,92,246,0.07)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(139,92,246,0.22)',
        padding: 16,
        marginBottom: 24,
        gap: 10,
    },
    sessionPanelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        marginBottom: 2,
    },
    sessionPanelTitle: {
        flex: 1,
        color: '#C4B5FD',
        fontSize: 14,
        fontWeight: '900',
    },
    sessionPanelCount: {
        color: 'rgba(196,181,253,0.55)',
        fontSize: 12,
        fontWeight: '700',
    },
    sessionGameRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 4,
    },
    sessionGameBadge: {
        backgroundColor: 'rgba(139,92,246,0.18)',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: 'rgba(139,92,246,0.3)',
    },
    sessionGameBadgeText: {
        color: '#DDD6FE',
        fontSize: 11,
        fontWeight: '700',
    },
    sessionPlayerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    sessionPlayerRowMe: {
        backgroundColor: 'rgba(139,92,246,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(139,92,246,0.28)',
    },
    sessionPlayerRank: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 12,
        fontWeight: '800',
        width: 22,
        textAlign: 'center',
    },
    sessionPlayerName: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    sessionPlayerScore: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        fontWeight: '800',
    },
});
