import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import {
    ArrowLeft,
    Award,
    CalendarDays,
    CheckCircle2,
    Copy,
    Crown,
    Flame,
    Gamepad2,
    Pencil,
    Share2,
    Sparkles,
    Star,
    Trophy,
    Zap,
} from 'lucide-react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';
import AvatarCircle from '../components/AvatarCircle';
import { db } from '../firebase';
import { colors } from '../theme';
import {
    ensureSocialGameStats,
    getSocialGameScoreLabel,
} from '../utils/socialGames';

const GAME_MODES = [
    {
        key: 'lurdinha',
        label: 'Lurdinha',
        emoji: '😈',
        color: '#8B5CF6',
        playedKey: 'lurdinhaPlayed',
        winKey: 'lurdinhaWins',
    },
    {
        key: 'draw',
        label: 'Desenho',
        emoji: '✏️',
        color: '#10B981',
        playedKey: 'drawPlayed',
        scoreKey: 'bestDrawScore',
    },
    {
        key: 'secret',
        label: 'Telefone',
        emoji: '📖',
        color: '#F43F5E',
        playedKey: 'secretPlayed',
        winKey: 'secretWins',
    },
    {
        key: 'most_likely',
        label: 'Mais Provável',
        emoji: '👀',
        color: '#3B82F6',
        playedKey: 'mostLikelyPlayed',
        winKey: 'mostLikelyWins',
    },
    {
        key: 'obvious_mind',
        label: 'Na Minha Cabeça',
        emoji: '🧠',
        color: '#F59E0B',
        playedKey: 'obviousMindPlayed',
        winKey: 'obviousMindWins',
    },
    {
        key: 'tier_list',
        label: 'Tier List',
        emoji: '🏆',
        color: '#FF6B35',
        playedKey: 'tierListPlayed',
        winKey: 'tierListWins',
    },
    {
        key: 'impostor',
        label: 'Impostor',
        emoji: '🕵️',
        color: '#EF4444',
        playedKey: 'impostorPlayed',
        winKey: 'impostorWins',
    },
];

const GAME_META_BY_TYPE = {
    lurdinha: GAME_MODES[0],
    draw: GAME_MODES[1],
    secret: GAME_MODES[2],
    telephone: GAME_MODES[2],
    most_likely: GAME_MODES[3],
    obvious_mind: GAME_MODES[4],
    tier_list: GAME_MODES[5],
    impostor: GAME_MODES[6],
};

const getDateValue = (value) => {
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value) => {
    const date = getDateValue(value);
    if (!date) return 'data desconhecida';
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
};

const formatRelativeTime = (value) => {
    const date = getDateValue(value);
    if (!date) return 'recentemente';

    const diffMs = Date.now() - date.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'agora';
    if (hours < 24) return `${hours}h atrás`;
    if (days === 1) return '1d atrás';
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString('pt-BR');
};

const getPlaceLabel = (position) => {
    if (position === 1) return '1o lugar';
    if (position === 2) return '2o lugar';
    if (position === 3) return '3o lugar';
    return position ? `${position}o lugar` : 'participou';
};

const getTotalSocialMatches = (socialGames) => (
    (socialGames.lurdinhaPlayed || 0)
    + (socialGames.drawPlayed || 0)
    + (socialGames.secretPlayed || 0)
    + (socialGames.mostLikelyPlayed || 0)
    + (socialGames.obviousMindPlayed || 0)
    + (socialGames.tierListPlayed || 0)
    + (socialGames.impostorPlayed || 0)
);

const getTotalSocialWins = (socialGames) => (
    (socialGames.lurdinhaWins || 0)
    + (socialGames.secretWins || 0)
    + (socialGames.mostLikelyWins || 0)
    + (socialGames.obviousMindWins || 0)
    + (socialGames.tierListWins || 0)
    + (socialGames.impostorWins || 0)
);

const buildModeRows = (socialGames) => GAME_MODES.map((mode) => ({
    ...mode,
    played: socialGames[mode.playedKey] || 0,
    wins: mode.winKey ? (socialGames[mode.winKey] || 0) : 0,
    bestScore: mode.scoreKey ? (socialGames[mode.scoreKey] || 0) : null,
}));

const getSpecialty = (modeRows) => {
    const bestCompetitiveMode = [...modeRows]
        .sort((first, second) => (
            (second.wins - first.wins)
            || ((second.bestScore || 0) - (first.bestScore || 0))
            || (second.played - first.played)
        ))[0];

    if (bestCompetitiveMode?.wins > 0 || (bestCompetitiveMode?.bestScore || 0) > 0) {
        return bestCompetitiveMode;
    }

    return [...modeRows].sort((first, second) => second.played - first.played)[0] || modeRows[0];
};

function HeaderButton({ icon: Icon, onPress }) {
    return (
        <TouchableOpacity style={styles.headerButton} onPress={onPress} activeOpacity={0.75}>
            <Icon size={20} color="#FFFFFF" />
        </TouchableOpacity>
    );
}

function SummaryCard({ label, value, icon: Icon, accent }) {
    return (
        <View style={styles.summaryCard}>
            <View style={[styles.summaryIconWrap, { backgroundColor: `${accent}20` }]}>
                <Icon size={18} color={accent} />
            </View>
            <Text style={styles.summaryValue}>{value}</Text>
            <Text style={styles.summaryLabel}>{label}</Text>
        </View>
    );
}

function SectionHeader({ title, subtitle }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
    );
}

function ModeCard({ mode }) {
    const hasActivity = mode.played > 0 || mode.wins > 0 || (mode.bestScore || 0) > 0;

    return (
        <View style={[styles.modeCard, hasActivity && { borderColor: `${mode.color}55` }]}>
            <View style={[styles.modeEmojiWrap, { backgroundColor: `${mode.color}1F` }]}>
                <Text style={styles.modeEmoji}>{mode.emoji}</Text>
            </View>
            <View style={styles.modeTextBlock}>
                <Text style={styles.modeTitle} numberOfLines={1}>{mode.label}</Text>
                <Text style={styles.modeSubtitle}>
                    {mode.bestScore !== null ? `melhor ${mode.bestScore || 0} pts` : `${mode.wins || 0} vitórias`}
                </Text>
            </View>
            <View style={styles.modePlayedPill}>
                <Text style={styles.modePlayedText}>{mode.played || 0} jogos</Text>
            </View>
        </View>
    );
}

function BadgeCard({ badge }) {
    return (
        <View style={[styles.badgeCard, badge.unlocked && styles.badgeUnlocked]}>
            <Text style={styles.badgeIcon}>{badge.icon}</Text>
            <Text style={styles.badgeTitle} numberOfLines={1}>{badge.title}</Text>
            <Text style={styles.badgeSubtitle} numberOfLines={2}>{badge.subtitle}</Text>
        </View>
    );
}

function HistoryRow({ item }) {
    return (
        <View style={styles.historyRow}>
            <View style={[styles.historyIconWrap, { backgroundColor: `${item.color}20` }]}>
                <Text style={styles.historyEmoji}>{item.emoji}</Text>
            </View>
            <View style={styles.historyTextBlock}>
                <Text style={styles.historyTitle} numberOfLines={1}>{item.mode}</Text>
                <Text style={styles.historySubtitle}>
                    {getPlaceLabel(item.position)} de {item.total || 0} jogadores
                </Text>
            </View>
            <View style={styles.historyRight}>
                <Text style={styles.historyScore}>{item.scoreLabel}</Text>
                <Text style={styles.historyTime}>{item.time}</Text>
            </View>
        </View>
    );
}

export default function UserProfileScreen({ navigation, route }) {
    const userId = route?.params?.userId;
    const { currentUser } = useAuth();
    const { getUserProfile } = useUserData();
    const [userProfile, setUserProfile] = useState(null);
    const [recentMatches, setRecentMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isOwnProfile = currentUser?.uid === userId;

    const loadUserProfile = useCallback(async () => {
        if (!userId) {
            setError('Perfil indisponível.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const profile = await getUserProfile(userId);
            if (!profile) {
                setUserProfile(null);
                setRecentMatches([]);
                setError('Usuário não encontrado.');
                return;
            }

            setUserProfile(profile);

            const historyQuery = query(
                collection(db, 'game_history'),
                where('participantIds', 'array-contains', userId)
            );
            const historySnapshot = await getDocs(historyQuery);
            const matches = historySnapshot.docs
                .map((historyDoc) => ({ id: historyDoc.id, ...historyDoc.data() }))
                .sort((firstMatch, secondMatch) => {
                    const firstTime = getDateValue(firstMatch.finishedAt)?.getTime() || 0;
                    const secondTime = getDateValue(secondMatch.finishedAt)?.getTime() || 0;
                    return secondTime - firstTime;
                })
                .map((match) => {
                    const player = (match.players || []).find((entry) => entry.uid === userId);
                    if (!player) return null;

                    const meta = GAME_META_BY_TYPE[match.gameType] || {
                        label: 'Jogo social',
                        emoji: '🎮',
                        color: colors.primary,
                    };

                    return {
                        id: match.id,
                        mode: meta.label,
                        emoji: meta.emoji,
                        color: meta.color,
                        position: player.position || 0,
                        total: Array.isArray(match.players) ? match.players.length : 0,
                        scoreLabel: getSocialGameScoreLabel({ gameType: match.gameType, score: player.score || 0 }),
                        time: formatRelativeTime(match.finishedAt),
                    };
                })
                .filter(Boolean)
                .slice(0, 5);

            setRecentMatches(matches);
        } catch (err) {
            console.warn('[UserProfileScreen] failed to load public profile:', err);
            setError('Erro ao carregar perfil.');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadUserProfile();
    }, [loadUserProfile]);

    const profileStats = useMemo(() => userProfile?.stats || {}, [userProfile?.stats]);
    const socialGames = useMemo(
        () => ensureSocialGameStats(profileStats?.socialGames),
        [profileStats?.socialGames]
    );
    const modeRows = useMemo(() => buildModeRows(socialGames), [socialGames]);
    const specialty = useMemo(() => getSpecialty(modeRows), [modeRows]);
    const totalMatches = getTotalSocialMatches(socialGames);
    const totalWins = getTotalSocialWins(socialGames);
    const usernameLabel = userProfile?.username ? `@${userProfile.username}` : '@sem_username';
    const titleLabel = totalWins > 0
        ? 'Campeão social'
        : totalMatches > 0
            ? 'Jogador social'
            : 'Novo na mesa';

    const badges = useMemo(() => {
        const achievements = socialGames.achievements || {};
        return [
            {
                icon: '🕵️',
                title: 'Detetive',
                subtitle: `${achievements.detective || 0}x streak`,
                unlocked: (achievements.detective || 0) > 0,
            },
            {
                icon: '⚡',
                title: 'Relâmpago',
                subtitle: `${achievements.relampago || 0}x bonus`,
                unlocked: (achievements.relampago || 0) > 0,
            },
            {
                icon: '👑',
                title: 'Campeão social',
                subtitle: `${totalWins || 0} vitórias`,
                unlocked: totalWins > 0,
            },
            {
                icon: '✏️',
                title: 'Melhor desenhista',
                subtitle: `${socialGames.bestDrawScore || 0} pts`,
                unlocked: (socialGames.bestDrawScore || 0) > 0,
            },
            {
                icon: '🏆',
                title: 'Top competidor',
                subtitle: `${profileStats.titles || 0} títulos`,
                unlocked: (profileStats.titles || 0) > 0 || totalMatches >= 10,
            },
        ];
    }, [profileStats.titles, socialGames, totalMatches, totalWins]);

    const handleCopyUsername = async () => {
        if (!userProfile?.username) {
            Alert.alert('Sem username', 'Este usuário ainda não configurou um @username.');
            return;
        }

        await Clipboard.setStringAsync(usernameLabel);
        Alert.alert('Copiado', `${usernameLabel} foi copiado.`);
    };

    const handleShareProfile = async () => {
        const text = `${userProfile?.displayName || 'Usuário'} no Lurdinha\n${userProfile?.username ? usernameLabel : 'Perfil público'}\n${totalMatches} partidas sociais • ${totalWins} vitórias`;
        try {
            await Share.share({ message: text });
        } catch (shareError) {
            console.warn('[UserProfileScreen] share failed:', shareError);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Carregando perfil público...</Text>
            </View>
        );
    }

    if (error || !userProfile) {
        return (
            <View style={styles.screen}>
                <View style={styles.header}>
                    <HeaderButton icon={ArrowLeft} onPress={() => navigation.goBack()} />
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Perfil indisponível</Text>
                    <Text style={styles.errorText}>{error || 'Não foi possível abrir este perfil.'}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile} activeOpacity={0.8}>
                        <Text style={styles.retryButtonText}>Tentar novamente</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <LinearGradient
                    colors={['#4C1D95', '#1E1B2A', colors.background]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >
                    <View style={styles.header}>
                        <HeaderButton icon={ArrowLeft} onPress={() => navigation.goBack()} />
                        <View style={styles.headerActions}>
                            {userProfile.username ? (
                                <HeaderButton icon={Copy} onPress={handleCopyUsername} />
                            ) : null}
                            <HeaderButton icon={Share2} onPress={handleShareProfile} />
                        </View>
                    </View>

                    <View style={styles.identityBlock}>
                        <View style={styles.avatarRing}>
                            <AvatarCircle
                                name={userProfile.displayName}
                                photoURL={userProfile.photoURL}
                                size={104}
                                style={styles.avatar}
                            />
                        </View>
                        <View style={styles.titlePill}>
                            <Crown size={14} color={colors.gold} />
                            <Text style={styles.titlePillText}>{titleLabel}</Text>
                        </View>
                        <Text style={styles.userName} numberOfLines={1}>{userProfile.displayName || 'Usuário'}</Text>
                        <Text style={styles.username}>{usernameLabel}</Text>
                        <View style={styles.joinedRow}>
                            <CalendarDays size={14} color={colors.textSecondary} />
                            <Text style={styles.joinedText}>Joga desde {formatDate(userProfile.createdAt)}</Text>
                        </View>
                    </View>

                    <View style={styles.summaryGrid}>
                        <SummaryCard label="partidas" value={totalMatches} icon={Gamepad2} accent={colors.primaryLight} />
                        <SummaryCard label="vitórias" value={totalWins} icon={Trophy} accent={colors.gold} />
                        <SummaryCard label="acertos" value={profileStats.acertos || 0} icon={CheckCircle2} accent={colors.success} />
                        <SummaryCard label="títulos" value={profileStats.titles || 0} icon={Crown} accent={colors.orange} />
                    </View>
                </LinearGradient>

                {isOwnProfile ? (
                    <TouchableOpacity
                        style={styles.editProfileButton}
                        onPress={() => navigation.navigate('EditProfile')}
                        activeOpacity={0.82}
                    >
                        <Pencil size={18} color="#FFFFFF" />
                        <Text style={styles.editProfileText}>Editar perfil</Text>
                    </TouchableOpacity>
                ) : null}

                <View style={styles.section}>
                    <View style={styles.specialtyCard}>
                        <View style={[styles.specialtyIconWrap, { backgroundColor: `${specialty.color}20` }]}>
                            <Text style={styles.specialtyEmoji}>{specialty.emoji}</Text>
                        </View>
                        <View style={styles.specialtyCopy}>
                            <Text style={styles.specialtyKicker}>Especialidade</Text>
                            <Text style={styles.specialtyTitle}>{specialty.label}</Text>
                            <Text style={styles.specialtySubtitle}>
                                {specialty.bestScore !== null
                                    ? `Melhor pontuação: ${specialty.bestScore || 0} pts`
                                    : `${specialty.wins || 0} vitórias em ${specialty.played || 0} partidas`}
                            </Text>
                        </View>
                        <Sparkles size={22} color={specialty.color} />
                    </View>
                </View>

                <View style={styles.section}>
                    <SectionHeader title="Jogos sociais" subtitle="Desempenho público por modo" />
                    <View style={styles.modeGrid}>
                        {modeRows.map((mode) => (
                            <ModeCard key={mode.key} mode={mode} />
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <SectionHeader title="Conquistas" subtitle="Badges liberadas nas partidas" />
                    <View style={styles.badgeGrid}>
                        {badges.map((badge) => (
                            <BadgeCard key={badge.title} badge={badge} />
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <SectionHeader title="Histórico recente" subtitle="Últimas partidas sociais visíveis" />
                    {recentMatches.length > 0 ? (
                        <View style={styles.historyList}>
                            {recentMatches.map((match) => (
                                <HistoryRow key={match.id} item={match} />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyHistory}>
                            <Star size={22} color={colors.textMuted} />
                            <Text style={styles.emptyHistoryTitle}>Nenhuma partida recente</Text>
                            <Text style={styles.emptyHistoryText}>Quando este jogador terminar partidas sociais, elas aparecem aqui.</Text>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <SectionHeader title="Resumo geral" />
                    <View style={styles.generalStatsCard}>
                        <View style={styles.generalStatRow}>
                            <Flame size={18} color={colors.orange} />
                            <Text style={styles.generalStatLabel}>Sequência</Text>
                            <Text style={styles.generalStatValue}>{profileStats.fireStreak || 0} dias</Text>
                        </View>
                        <View style={styles.generalStatRow}>
                            <Zap size={18} color={colors.gold} />
                            <Text style={styles.generalStatLabel}>Votos em quiz</Text>
                            <Text style={styles.generalStatValue}>{profileStats.enquetesVotadas || 0}</Text>
                        </View>
                        <View style={styles.generalStatRow}>
                            <Award size={18} color={colors.primaryLight} />
                            <Text style={styles.generalStatLabel}>Pontos totais</Text>
                            <Text style={styles.generalStatValue}>{profileStats.totalPoints || 0}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scroll: {
        flex: 1,
    },
    content: {
        paddingBottom: 120,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        gap: 12,
    },
    loadingText: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    hero: {
        paddingTop: 58,
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 44,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.10)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    identityBlock: {
        alignItems: 'center',
        paddingTop: 18,
    },
    avatarRing: {
        width: 116,
        height: 116,
        borderRadius: 58,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    avatar: {
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    titlePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
        marginTop: -8,
        borderRadius: 999,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    titlePillText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    userName: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '900',
        marginTop: 12,
        maxWidth: '90%',
    },
    username: {
        color: colors.primaryLight,
        fontSize: 15,
        fontWeight: '700',
        marginTop: 4,
    },
    joinedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
    },
    joinedText: {
        color: colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 24,
    },
    summaryCard: {
        flexBasis: '47%',
        flexGrow: 1,
        minHeight: 92,
        padding: 14,
        borderRadius: 18,
        backgroundColor: 'rgba(8,8,12,0.45)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
    },
    summaryIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    summaryValue: {
        color: '#FFFFFF',
        fontSize: 23,
        fontWeight: '900',
    },
    summaryLabel: {
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
    },
    editProfileButton: {
        marginHorizontal: 20,
        marginTop: 16,
        minHeight: 48,
        borderRadius: 16,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    editProfileText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionHeader: {
        marginBottom: 12,
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 19,
        fontWeight: '900',
    },
    sectionSubtitle: {
        color: colors.textMuted,
        fontSize: 13,
        fontWeight: '600',
        marginTop: 3,
    },
    specialtyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 20,
        backgroundColor: colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: colors.borderSoft,
    },
    specialtyIconWrap: {
        width: 58,
        height: 58,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    specialtyEmoji: {
        fontSize: 28,
    },
    specialtyCopy: {
        flex: 1,
    },
    specialtyKicker: {
        color: colors.textMuted,
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    specialtyTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
        marginTop: 2,
    },
    specialtySubtitle: {
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    modeGrid: {
        gap: 10,
    },
    modeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 72,
        padding: 12,
        borderRadius: 18,
        backgroundColor: colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: colors.borderSoft,
    },
    modeEmojiWrap: {
        width: 48,
        height: 48,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    modeEmoji: {
        fontSize: 23,
    },
    modeTextBlock: {
        flex: 1,
        minWidth: 0,
    },
    modeTitle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
    modeSubtitle: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 3,
    },
    modePlayedPill: {
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    modePlayedText: {
        color: colors.textSecondary,
        fontSize: 11,
        fontWeight: '800',
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    badgeCard: {
        width: '48%',
        minHeight: 118,
        padding: 14,
        borderRadius: 18,
        backgroundColor: 'rgba(23,23,27,0.68)',
        borderWidth: 1,
        borderColor: colors.borderSoft,
        opacity: 0.55,
    },
    badgeUnlocked: {
        opacity: 1,
        borderColor: colors.borderStrong,
        backgroundColor: colors.surfaceSecondary,
    },
    badgeIcon: {
        fontSize: 26,
        marginBottom: 9,
    },
    badgeTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
    },
    badgeSubtitle: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    historyList: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.borderSoft,
    },
    historyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: colors.surfaceSecondary,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSoft,
    },
    historyIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    historyEmoji: {
        fontSize: 21,
    },
    historyTextBlock: {
        flex: 1,
        minWidth: 0,
    },
    historyTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    historySubtitle: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 3,
    },
    historyRight: {
        alignItems: 'flex-end',
        marginLeft: 10,
    },
    historyScore: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
    },
    historyTime: {
        color: colors.textMuted,
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
    },
    emptyHistory: {
        alignItems: 'center',
        padding: 22,
        borderRadius: 20,
        backgroundColor: colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: colors.borderSoft,
    },
    emptyHistoryTitle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
        marginTop: 10,
    },
    emptyHistoryText: {
        color: colors.textMuted,
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 18,
    },
    generalStatsCard: {
        borderRadius: 20,
        backgroundColor: colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        overflow: 'hidden',
    },
    generalStatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 54,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSoft,
    },
    generalStatLabel: {
        flex: 1,
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 10,
    },
    generalStatValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
    },
    errorTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 8,
    },
    errorText: {
        color: colors.textMuted,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 18,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: colors.primary,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
});
