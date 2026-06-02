import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Users,
  Plus,
  Settings,
  Clock,
  Trophy,
  UserMinus,
  CheckCircle,
  XCircle,
  ChevronRight,
  Eye,
  Ghost,
  Users2,
  Crown,
  ArrowRight,
  BarChart2,
  Zap,
  Target,
  Gamepad2,
} from 'lucide-react-native';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../contexts/AuthContext';
import AddMembersCard from '../components/AddMembersCard';
import AvatarCircle from '../components/AvatarCircle';
import { UserPlus, Mail, Search, X } from 'lucide-react-native';
import { TextInput } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { colors } from '../theme';
import { db } from '../firebase';
import { startMusic, stopMusic } from '../utils/sounds';

const PRIMARY_PURPLE = colors.primaryMutedHex || '#9061F9';
const PRIMARY_PURPLE_RGB = '159, 99, 255';
const PRIMARY_PURPLE_ALPHA_08 = `rgba(${PRIMARY_PURPLE_RGB}, 0.08)`;
const PRIMARY_PURPLE_ALPHA_12 = `rgba(${PRIMARY_PURPLE_RGB}, 0.12)`;
const PRIMARY_PURPLE_ALPHA_15 = `rgba(${PRIMARY_PURPLE_RGB}, 0.15)`;
const PRIMARY_PURPLE_ALPHA_20 = `rgba(${PRIMARY_PURPLE_RGB}, 0.2)`;
const PRIMARY_PURPLE_ALPHA_30 = `rgba(${PRIMARY_PURPLE_RGB}, 0.3)`;

export default function GroupDetailScreen({ navigation, route }) {
  const { groupId } = route.params;
  const { currentUser } = useAuth();
  const {
    getGroupDetails,
    leaveGroup,
    acceptJoinRequest,
    rejectJoinRequest,
    getGroupQuizGroups,
    searchUsers,
    sendInvite,
    sendJoinRequest,
    loading
  } = useGroups();

  const [group, setGroup] = useState(null);
  const [quizGroups, setQuizGroups] = useState([]);
  const [socialGameMatches, setSocialGameMatches] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [inviteEmails, setInviteEmails] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz', 'ranking', 'stats'
  const [hasRequested, setHasRequested] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (activeTab !== 'ranking') return undefined;

      startMusic('ranking_theme');
      return () => stopMusic('ranking_theme');
    }, [activeTab])
  );

  useEffect(() => {
    loadGroupData();
  }, [groupId, currentUser?.uid]);

  const loadGroupData = async () => {
    try {
      const [groupData, quizGroupsData] = await Promise.all([
        getGroupDetails(groupId),
        getGroupQuizGroups(groupId)
      ]);
      setGroup(groupData);
      setQuizGroups(quizGroupsData);
      setSocialGameMatches(await getGroupSocialGameMatches(groupData));

      if (groupData?.pendingRequests?.includes(currentUser?.uid)) {
        setHasRequested(true);
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
      navigation.goBack();
    }
  };

  const getGroupSocialGameMatches = async (groupData) => {
    if (!currentUser?.uid || !groupData?.members?.length) return [];

    try {
      const groupMemberIds = new Set(groupData.members);
      const historyQuery = query(
        collection(db, 'game_history'),
        where('participantIds', 'array-contains', currentUser.uid)
      );
      const historySnapshot = await getDocs(historyQuery);

      return historySnapshot.docs
        .map((historyDoc) => ({
          id: historyDoc.id,
          ...historyDoc.data(),
        }))
        .filter((match) => {
          const participantIds = match.participantIds || [];
          const groupParticipants = participantIds.filter((uid) => groupMemberIds.has(uid));
          return groupParticipants.length >= Math.min(2, groupMemberIds.size);
        })
        .sort((firstMatch, secondMatch) => {
          const firstTime = firstMatch.finishedAt?.toDate?.()?.getTime?.() || new Date(firstMatch.finishedAt || 0).getTime();
          const secondTime = secondMatch.finishedAt?.toDate?.()?.getTime?.() || new Date(secondMatch.finishedAt || 0).getTime();
          return secondTime - firstTime;
        });
    } catch (error) {
      console.error('Error loading group social matches:', error);
      return [];
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupData();
    setRefreshing(false);
  };

  const handleSendRequest = async () => {
    try {
      await sendJoinRequest(groupId);
      setHasRequested(true);
      Alert.alert('Sucesso', 'Solicitação enviada com sucesso!');
      await loadGroupData();
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Sair do Grupo',
      'Tem certeza que deseja sair deste grupo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveGroup(groupId);
              Alert.alert('Sucesso', 'Você saiu do grupo');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Erro', error.message);
            }
          },
        },
      ]
    );
  };

  const handleAcceptRequest = async (userId) => {
    try {
      await acceptJoinRequest(groupId, userId);
      await loadGroupData();
      Alert.alert('Sucesso', 'Solicitação aceita!');
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      await rejectJoinRequest(groupId, userId);
      await loadGroupData();
      Alert.alert('Sucesso', 'Solicitação rejeitada');
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchUsers(searchQuery.trim());
      const filtered = results.filter(
        user => user.uid !== currentUser?.uid &&
          !group.members?.includes(user.uid) &&
          !selectedUsers.some(su => su.uid === user.uid)
      );
      setSearchResults(filtered);
    } catch (error) {
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        handleSearchUsers();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedUsers]);

  const handleAddUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchResults(searchResults.filter(u => u.uid !== user.uid));
    setSearchQuery('');
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.uid !== userId));
  };

  const handleAddEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (email && email.includes('@') && !inviteEmails.includes(email)) {
      setInviteEmails([...inviteEmails, email]);
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (email) => {
    setInviteEmails(inviteEmails.filter(e => e !== email));
  };

  const handleSendInvites = async () => {
    if (selectedUsers.length === 0 && inviteEmails.length === 0) {
      Alert.alert('Aviso', 'Selecione usuários ou adicione e-mails');
      return;
    }

    try {
      // Enviar convites para usuários selecionados
      if (selectedUsers.length > 0) {
        await Promise.all(
          selectedUsers.map(user =>
            sendInvite(groupId, user.uid, 'username')
          )
        );
      }

      // Enviar convites por email
      if (inviteEmails.length > 0) {
        await Promise.all(
          inviteEmails.map(email =>
            sendInvite(groupId, email, 'email')
          )
        );
      }

      Alert.alert('Sucesso', 'Convites enviados com sucesso!');
      setSelectedUsers([]);
      setInviteEmails([]);
      setShowAddMembers(false);
      await loadGroupData();
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleCreateQuizGroup = () => {
    navigation.navigate('CreateQuizGroupStep1', { groupId });
  };

  const handleQuizGroupPress = (quizGroup) => {
    navigation.navigate('QuizGroupDetail', { quizGroupId: quizGroup.id });
  };

  const getQuizGroupEndDate = (quizGroup = {}) => {
    if (!quizGroup.endTime) return null;
    if (quizGroup.endTime?.toDate) return quizGroup.endTime.toDate();

    const endDate = new Date(quizGroup.endTime);
    return Number.isNaN(endDate.getTime()) ? null : endDate;
  };

  const getHoursLeftLabel = (quizGroup = {}) => {
    const endDate = getQuizGroupEndDate(quizGroup);
    if (!endDate) return 'Sem prazo';

    const diffMs = endDate.getTime() - Date.now();
    if (diffMs <= 0) return 'Prazo encerrado';

    const totalMinutes = Math.ceil(diffMs / (1000 * 60));
    if (totalMinutes < 60) return `${totalMinutes}min restantes`;

    const hoursLeft = Math.ceil(totalMinutes / 60);
    return `${hoursLeft}h restantes`;
  };

  const getQuizTypeLabel = (quizGroup = {}) => {
    if (quizGroup.type === 1 || quizGroup.type === '1' || quizGroup.type === 'open') {
      return 'Palpite aberto';
    }
    if (quizGroup.type === 2 || quizGroup.type === '2' || quizGroup.type === 'defined') {
      return 'Resultado definido';
    }
    return 'Palpite social';
  };

  const getQuizModeLabel = (mode) => {
    const modeLabels = {
      normal: 'Normal',
      ghost: 'Ghost',
      challenge: 'Desafio',
    };

    return modeLabels[mode] || 'Normal';
  };

  const getQuizGroupModeIcon = (mode) => {
    switch (mode) {
      case 'ghost':
        return <Ghost size={16} color={PRIMARY_PURPLE} />;
      case 'challenge':
        return <Users2 size={16} color={PRIMARY_PURPLE} />;
      default:
        return <Eye size={16} color={PRIMARY_PURPLE} />;
    }
  };

  const isQuizGroupOpen = (quizGroup = {}) => {
    const endDate = getQuizGroupEndDate(quizGroup);
    if (endDate && endDate.getTime() <= Date.now()) return false;

    return (
      quizGroup.isActive === true ||
      quizGroup.status === 'active' ||
      (!quizGroup.status && quizGroup.isActive !== false)
    );
  };

  const getFeaturedQuizGroup = (groups = []) => {
    const activeGroups = groups
      .filter(isQuizGroupOpen)
      .sort((first, second) => {
        const firstDate = getQuizGroupEndDate(first);
        const secondDate = getQuizGroupEndDate(second);
        if (!firstDate && !secondDate) return 0;
        if (!firstDate) return 1;
        if (!secondDate) return -1;
        return firstDate.getTime() - secondDate.getTime();
      });

    return activeGroups[0] || null;
  };

  const getQuizGroupSortTime = (quizGroup = {}) => {
    const date = getQuizGroupEndDate(quizGroup);
    if (date) return date.getTime();
    if (quizGroup.updatedAt?.toDate) return quizGroup.updatedAt.toDate().getTime();
    if (quizGroup.createdAt?.toDate) return quizGroup.createdAt.toDate().getTime();
    return 0;
  };

  const getRankScore = (rank = {}) => (
    rank.correct ||
    rank.totalCorrect ||
    rank.score ||
    rank.points ||
    0
  );

  const getRankingDisplayName = (rank = {}, rankingType) => {
    if (rankingType === 'teams') {
      return rank.teamName || rank.teamMembers?.map(member => member.name).join(', ') || 'Time';
    }

    return rank.name || rank.displayName || rank.username || 'Usuário';
  };

  const getQuizGroupsWithRanking = (groups = []) => (
    groups
      .filter(quizGroup => quizGroup.ranking && quizGroup.ranking.length > 0)
      .sort((first, second) => getQuizGroupSortTime(second) - getQuizGroupSortTime(first))
  );

  const getGroupRankingSummary = (groups = []) => {
    const rankingMap = {};
    const rankedQuizGroups = getQuizGroupsWithRanking(groups);

    rankedQuizGroups.forEach((quizGroup) => {
      quizGroup.ranking.forEach((rank) => {
        if (quizGroup.rankingType === 'teams') {
          rank.teamMembers?.forEach((member) => {
            const userId = member.userId || member.uid || member.id;
            if (!userId) return;

            if (!rankingMap[userId]) {
              rankingMap[userId] = {
                userId,
                name: member.name || member.displayName || 'Usuário',
                photoURL: member.photoURL,
                score: 0,
                participations: 0,
              };
            }

            rankingMap[userId].score += getRankScore(rank);
            rankingMap[userId].participations += 1;
          });
          return;
        }

        const userId = rank.userId || rank.uid || rank.id;
        if (!userId) return;

        if (!rankingMap[userId]) {
          rankingMap[userId] = {
            userId,
            name: getRankingDisplayName(rank, quizGroup.rankingType),
            photoURL: rank.photoURL,
            score: 0,
            participations: 0,
          };
        }

        rankingMap[userId].score += getRankScore(rank);
        rankingMap[userId].participations += 1;
      });
    });

    const ranking = Object.values(rankingMap).sort((first, second) => (
      second.score - first.score ||
      second.participations - first.participations ||
      first.name.localeCompare(second.name)
    ));

    const currentUserIndex = ranking.findIndex(rank => rank.userId === currentUser?.uid);

    return {
      latestRanking: rankedQuizGroups[0] || null,
      ranking,
      topThree: ranking.slice(0, 3),
      currentUserRank: currentUserIndex >= 0
        ? { ...ranking[currentUserIndex], position: currentUserIndex + 1 }
        : null,
    };
  };

  const getRecentActivityItems = (groups = []) => {
    const activities = [];

    groups
      .slice()
      .sort((first, second) => getQuizGroupSortTime(second) - getQuizGroupSortTime(first))
      .forEach((quizGroup) => {
        const quizTitle = quizGroup.title || 'um palpite';

        if (quizGroup.ranking && quizGroup.ranking.length > 0) {
          activities.push({
            id: `${quizGroup.id}-ranking`,
            icon: Trophy,
            title: 'Ranking atualizado',
            subtitle: quizTitle,
            tone: 'gold',
          });

          const topRank = [...quizGroup.ranking].sort((first, second) => (
            getRankScore(second) - getRankScore(first)
          ))[0];

          if (topRank) {
            activities.push({
              id: `${quizGroup.id}-top`,
              icon: CheckCircle,
              title: `${getRankingDisplayName(topRank, quizGroup.rankingType)} marcou resposta correta`,
              subtitle: quizTitle,
              tone: 'success',
            });
          }
          return;
        }

        if (isQuizGroupOpen(quizGroup)) {
          activities.push({
            id: `${quizGroup.id}-open`,
            icon: Clock,
            title: `${quizGroup.quizzes?.length || 0} enquetes esperando palpites`,
            subtitle: quizTitle,
            tone: 'live',
          });
          return;
        }

        activities.push({
          id: `${quizGroup.id}-closed`,
          icon: Eye,
          title: 'Palpite já revelado',
          subtitle: quizTitle,
          tone: 'muted',
        });
      });

    return activities.slice(0, 4);
  };

  const getMemberDisplayName = (userId, fallback = 'Usuário') => {
    const member = (group?.memberDetails || []).find((item) => item.uid === userId);
    return member?.displayName || member?.username || fallback;
  };

  const getMemberPhotoURL = (userId) => (
    (group?.memberDetails || []).find((item) => item.uid === userId)?.photoURL
  );

  const getQuizGroupWinsSummary = (groups = []) => {
    const winsMap = {};

    groups.forEach((quizGroup) => {
      if (!quizGroup.ranking?.length) return;

      const sortedRanking = [...quizGroup.ranking].sort((first, second) => getRankScore(second) - getRankScore(first));
      const bestScore = getRankScore(sortedRanking[0]);
      const winners = sortedRanking.filter((rank) => getRankScore(rank) === bestScore && bestScore > 0);

      winners.forEach((rank) => {
        if (quizGroup.rankingType === 'teams') {
          rank.teamMembers?.forEach((member) => {
            const userId = member.userId || member.uid || member.id;
            if (!userId) return;
            if (!winsMap[userId]) {
              winsMap[userId] = {
                userId,
                name: member.name || getMemberDisplayName(userId),
                photoURL: member.photoURL || getMemberPhotoURL(userId),
                wins: 0,
              };
            }
            winsMap[userId].wins += 1;
          });
          return;
        }

        const userId = rank.userId || rank.uid || rank.id;
        if (!userId) return;
        if (!winsMap[userId]) {
          winsMap[userId] = {
            userId,
            name: getRankingDisplayName(rank, quizGroup.rankingType),
            photoURL: rank.photoURL || getMemberPhotoURL(userId),
            wins: 0,
          };
        }
        winsMap[userId].wins += 1;
      });
    });

    return Object.values(winsMap).sort((first, second) => (
      second.wins - first.wins || first.name.localeCompare(second.name)
    ));
  };

  const getSocialGameWinsSummary = (matches = []) => {
    const winsMap = {};

    matches.forEach((match) => {
      (match.winnerIds || []).forEach((userId) => {
        const winnerPlayer = (match.players || []).find((player) => player.uid === userId);
        if (!winsMap[userId]) {
          winsMap[userId] = {
            userId,
            name: winnerPlayer?.name || getMemberDisplayName(userId),
            photoURL: winnerPlayer?.photoURL || getMemberPhotoURL(userId),
            wins: 0,
          };
        }
        winsMap[userId].wins += 1;
      });
    });

    return Object.values(winsMap).sort((first, second) => (
      second.wins - first.wins || first.name.localeCompare(second.name)
    ));
  };

  if (!group) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_PURPLE} />
      </View>
    );
  }

  const isAdmin = group.admins?.includes(currentUser?.uid);
  const isMember = group.members?.includes(currentUser?.uid);
  const pendingRequests = group.pendingRequests || [];
  const allMembers = group.memberDetails?.length
    ? group.memberDetails
    : (group.members || []).map((uid) => ({ uid, displayName: 'Usuário' }));
  const previewMembers = allMembers.slice(0, 5);
  const remainingPreviewMembers = Math.max(0, allMembers.length - previewMembers.length);
  const featuredQuizGroup = getFeaturedQuizGroup(quizGroups);
  const openQuizGroups = quizGroups.filter(isQuizGroupOpen);
  const revealedQuizGroups = quizGroups.filter(quizGroup => !isQuizGroupOpen(quizGroup));
  const groupRankingSummary = getGroupRankingSummary(quizGroups);
  const recentActivityItems = getRecentActivityItems(quizGroups);
  const currentChampion = groupRankingSummary.topThree[0] || null;
  const quizGroupWinsSummary = getQuizGroupWinsSummary(quizGroups);
  const socialGameWinsSummary = getSocialGameWinsSummary(socialGameMatches);
  const renderSocialQuizGroupCard = (quizGroup, { revealed = false } = {}) => (
    <TouchableOpacity
      key={quizGroup.id}
      style={[styles.quizGroupCard, !revealed && styles.quizGroupCardActive]}
      onPress={() => handleQuizGroupPress(quizGroup)}
      activeOpacity={0.8}
    >
      <View pointerEvents="none" style={styles.quizGroupAccentOrb} />
      <View style={styles.quizGroupHeader}>
        <View style={styles.quizGroupIconWrap}>
          {getQuizGroupModeIcon(quizGroup.mode)}
        </View>
        <View style={styles.quizGroupInfo}>
          <Text style={styles.quizGroupTitle}>{quizGroup.title}</Text>
          <View style={styles.quizGroupBadgeRow}>
            <View style={styles.quizGroupInfoBadge}>
              <Text style={styles.quizGroupInfoBadgeText}>{getQuizTypeLabel(quizGroup)}</Text>
            </View>
            <View style={styles.quizGroupInfoBadgeSecondary}>
              <Text style={styles.quizGroupInfoBadgeSecondaryText}>{getQuizModeLabel(quizGroup.mode)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.quizGroupChevronWrap}>
          <ChevronRight size={18} color={revealed ? '#A1A1AA' : '#D4D4D8'} />
        </View>
      </View>
      <View style={styles.quizGroupFooter}>
        <View style={[styles.quizGroupStatusPill, !revealed && styles.quizGroupStatusPillActive]}>
          <Text style={[styles.quizGroupStatus, revealed && styles.quizGroupStatusEnded]}>
            {revealed ? 'Já revelado' : 'Em aberto'}
          </Text>
        </View>
        <View style={revealed ? styles.quizGroupStatPill : styles.quizGroupTimePill}>
          {revealed ? (
            <>
              <Trophy size={13} color={quizGroup.ranking ? PRIMARY_PURPLE : '#A1A1AA'} />
              <Text style={[styles.quizGroupTime, revealed && styles.quizGroupStatText]}>
                {quizGroup.ranking ? 'Ranking disponível' : 'Aguardando ranking'}
              </Text>
            </>
          ) : (
            <>
              <Clock size={13} color="#86EFAC" />
              <Text style={styles.quizGroupTime}>{getHoursLeftLabel(quizGroup)}</Text>
            </>
          )}
        </View>
        <View style={styles.quizGroupStatPill}>
          <Text style={styles.quizGroupStatText}>{quizGroup.quizzes?.length || 0} enquetes</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <ArrowLeft size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{group.name}</Text>
            </View>
            {isAdmin && (
              <TouchableOpacity
                style={styles.settingsButton}
                activeOpacity={0.8}
              >
                <Settings size={24} color="#B0B0B0" />
              </TouchableOpacity>
            )}
          </View>

          {/* Group Info */}
          <View style={styles.groupInfo}>
            <View style={[styles.groupBadge, { backgroundColor: group.color || PRIMARY_PURPLE }]}>
              <Text style={styles.groupBadgeText}>{group.badge || '👥'}</Text>
            </View>
            <View style={styles.groupDetails}>
              {group.description ? (
                <Text style={styles.groupDescription}>{group.description}</Text>
              ) : null}
              <View style={styles.groupStats}>
                <View style={styles.statItem}>
                  <Users size={16} color="#B0B0B0" />
                  <Text style={styles.statText}>
                    {group.stats?.totalMembers || group.members?.length || 0} membros
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Clock size={16} color="#B0B0B0" />
                  <Text style={styles.statText}>
                    {openQuizGroups.length} palpites em aberto
                  </Text>
                </View>
              </View>
              {previewMembers.length > 0 && (
                <View style={styles.memberPreviewRow}>
                  <View style={styles.memberPreviewStack}>
                    {previewMembers.map((member, index) => (
                      <AvatarCircle
                        key={member.uid || `${member.displayName}-${index}`}
                        name={member.displayName || member.username || 'Usuário'}
                        photoURL={member.photoURL}
                        size={28}
                        style={[
                          styles.memberPreviewAvatar,
                          index > 0 && styles.memberPreviewAvatarOverlap,
                        ]}
                      />
                    ))}
                    {remainingPreviewMembers > 0 && (
                      <View style={[styles.memberPreviewMore, styles.memberPreviewAvatarOverlap]}>
                        <Text style={styles.memberPreviewMoreText}>+{remainingPreviewMembers}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Pending Requests (Admin only) */}
        {isAdmin && pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solicitações Pendentes</Text>
            {pendingRequests.map((userId) => {
              const member = group.memberDetails?.find(m => m.uid === userId);
              return (
                <View key={userId} style={styles.requestCard}>
                  <View style={styles.requestInfo}>
                    <View style={styles.requestAvatar}>
                      <Text style={styles.requestAvatarText}>
                        {member?.username?.charAt(0) || member?.displayName?.charAt(0) || 'U'}
                      </Text>
                    </View>
                    <Text style={styles.requestName}>
                      {member?.username || member?.displayName || 'Usuário'}
                    </Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAcceptRequest(userId)}
                    >
                      <CheckCircle size={20} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleRejectRequest(userId)}
                    >
                      <XCircle size={20} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}



        {/* Now Section (Live Quizzes) */}
        {isMember && (
          <View style={styles.nowSection}>
            <View style={styles.nowHeaderRow}>
              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.nowEyebrow}>Agora no grupo</Text>
                <Text style={styles.nowTitle}>
                  {featuredQuizGroup ? 'Tem palpite em aberto' : 'Nada rolando agora'}
                </Text>
              </View>
              {featuredQuizGroup && (
                <View style={styles.nowCountPill}>
                  <Clock size={13} color="#86EFAC" />
                  <Text style={styles.nowCountText}>{getHoursLeftLabel(featuredQuizGroup)}</Text>
                </View>
              )}
            </View>

            {featuredQuizGroup ? (
              <TouchableOpacity
                style={styles.nowCard}
                onPress={() => handleQuizGroupPress(featuredQuizGroup)}
                activeOpacity={0.86}
              >
                <View pointerEvents="none" style={styles.nowCardOrb} />
                <View style={styles.nowCardTop}>
                  <View style={styles.nowIconWrap}>
                    {getQuizGroupModeIcon(featuredQuizGroup.mode)}
                  </View>
                  <View style={styles.nowCardCopy}>
                    <Text style={styles.nowCardTitle} numberOfLines={2}>
                      {featuredQuizGroup.title}
                    </Text>
                    <View style={styles.quizGroupBadgeRow}>
                      <View style={styles.quizGroupInfoBadge}>
                        <Text style={styles.quizGroupInfoBadgeText}>
                          {getQuizTypeLabel(featuredQuizGroup)}
                        </Text>
                      </View>
                      <View style={styles.quizGroupInfoBadgeSecondary}>
                        <Text style={styles.quizGroupInfoBadgeSecondaryText}>
                          {getQuizModeLabel(featuredQuizGroup.mode)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.nowMetaGrid}>
                  <View style={styles.nowMetaPill}>
                    <Clock size={14} color="#86EFAC" />
                    <Text style={styles.nowMetaText}>{getHoursLeftLabel(featuredQuizGroup)}</Text>
                  </View>
                  <View style={styles.nowMetaPill}>
                    <Trophy size={14} color={PRIMARY_PURPLE} />
                    <Text style={styles.nowMetaText}>
                      {featuredQuizGroup.quizzes?.length || 0} enquetes
                    </Text>
                  </View>
                </View>

                <View style={styles.nowCtaRow}>
                  <Text style={styles.nowCtaText}>Ver disputa</Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.nowEmptyCard}
                onPress={handleCreateQuizGroup}
                activeOpacity={0.86}
              >
                <View style={styles.nowEmptyIconWrap}>
                  <Plus size={20} color={PRIMARY_PURPLE} />
                </View>
                <View style={styles.nowEmptyCopy}>
                  <Text style={styles.nowEmptyTitle}>Nada rolando agora</Text>
                  <Text style={styles.nowEmptySubtitle}>
                    Crie um quiz para movimentar o grupo.
                  </Text>
                </View>
                <View style={styles.nowEmptyButton}>
                  <Text style={styles.nowEmptyButtonText}>Criar quiz</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Actions for Members vs Non-Members */}
        {isMember ? (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.createQuizButton}
              onPress={handleCreateQuizGroup}
              activeOpacity={0.8}
            >
              <View style={styles.createQuizIconWrap}>
                <Plus size={18} color={PRIMARY_PURPLE} />
              </View>
              <View style={styles.createQuizCopy}>
                <Text style={styles.createQuizButtonText}>Criar quiz</Text>
                <Text style={styles.createQuizButtonSubtext}>Enquetes e prazo</Text>
              </View>
              <ArrowRight size={17} color={PRIMARY_PURPLE} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.createQuizButton,
                hasRequested && { backgroundColor: 'rgba(76, 175, 80, 0.1)', borderWidth: 1, borderColor: '#4CAF50' }
              ]}
              onPress={handleSendRequest}
              disabled={hasRequested || loading}
              activeOpacity={0.8}
            >
              {hasRequested ? (
                <>
                  <CheckCircle size={24} color="#4CAF50" />
                  <Text style={[styles.createQuizButtonText, { color: '#4CAF50' }]}>
                    Solicitação Pendente
                  </Text>
                </>
              ) : (
                <>
                  <UserPlus size={24} color="#FFFFFF" />
                  <Text style={styles.createQuizButtonText}>
                    Solicitar Entrada
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Tabs Navigation */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'quiz' && styles.tabButtonActive]}
            onPress={() => setActiveTab('quiz')}
            activeOpacity={0.8}
          >
            <Trophy size={18} color={activeTab === 'quiz' ? '#FFFFFF' : '#71717a'} />
            <Text
              style={[styles.tabButtonText, activeTab === 'quiz' && styles.tabButtonTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              Quiz
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'ranking' && styles.tabButtonActive]}
            onPress={() => setActiveTab('ranking')}
            activeOpacity={0.8}
          >
            <Crown size={18} color={activeTab === 'ranking' ? '#FFFFFF' : '#71717a'} />
            <Text
              style={[styles.tabButtonText, activeTab === 'ranking' && styles.tabButtonTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              Ranking
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'stats' && styles.tabButtonActive]}
            onPress={() => setActiveTab('stats')}
            activeOpacity={0.8}
          >
            <BarChart2 size={18} color={activeTab === 'stats' ? '#FFFFFF' : '#71717a'} />
            <Text
              style={[styles.tabButtonText, activeTab === 'stats' && styles.tabButtonTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              Estatísticas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'quiz' && (
          <View style={styles.tabContent}>
            {/* Quiz Groups Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Palpites do grupo</Text>
                {quizGroups.length > 0 && (
                  <Text style={styles.sectionCount}>{quizGroups.length}</Text>
                )}
              </View>

              {quizGroups.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Nenhum palpite criado ainda</Text>
                  {isMember && (
                    <Text style={styles.emptySubtext}>
                      Crie o primeiro palpite do grupo.
                    </Text>
                  )}
                </View>
              ) : (
                <>
                  {openQuizGroups.length > 0 && (
                    <>
                      <Text style={styles.subsectionTitle}>Em aberto</Text>
                      <View style={styles.quizGroupsContainer}>
                        {openQuizGroups.map((quizGroup) => renderSocialQuizGroupCard(quizGroup))}
                      </View>
                    </>
                  )}

                  {revealedQuizGroups.length > 0 && (
                    <>
                      <Text style={[styles.subsectionTitle, { marginTop: 24 }]}>Já revelados</Text>
                      <View style={styles.quizGroupsContainer}>
                        {revealedQuizGroups.map((quizGroup) => (
                          renderSocialQuizGroupCard(quizGroup, { revealed: true })
                        ))}
                      </View>
                    </>
                  )}
                </>
              )}
            </View>
          </View>
        )}

        {activeTab === 'stats' && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderCopy}>
                  <Text style={styles.sectionTitle}>Estatísticas do Grupo</Text>
                  <Text style={styles.sectionSubtitle}>Vitórias, participação e rivalidade social</Text>
                </View>
              </View>

              {(() => {
                const totalQuizzes = quizGroups.length;
                let totalCorrect = 0;
                let highestScore = 0;
                let highestScorer = null;
                const memberParticipation = {};

                quizGroups.forEach(qg => {
                  if (qg.ranking) {
                    qg.ranking.forEach(r => {
                      if (qg.rankingType === 'teams') {
                        r.teamMembers?.forEach(m => {
                          memberParticipation[m.userId] = (memberParticipation[m.userId] || 0) + 1;
                        });
                      } else {
                        memberParticipation[r.userId] = (memberParticipation[r.userId] || 0) + 1;

                        if ((r.correct || 0) > highestScore) {
                          highestScore = r.correct || 0;
                          highestScorer = { name: r.name, photoURL: r.photoURL };
                        }
                      }

                      totalCorrect += (r.correct || r.totalCorrect || 0);
                    });
                  }
                });

                let mostActiveMemberId = null;
                let maxParticipation = 0;
                Object.entries(memberParticipation).forEach(([uid, count]) => {
                  if (count > maxParticipation) {
                    maxParticipation = count;
                    mostActiveMemberId = uid;
                  }
                });

                const mostActiveMember = mostActiveMemberId
                  ? group.memberDetails?.find(m => m.uid === mostActiveMemberId)
                  : null;

                const totalParticipations = Object.values(memberParticipation).reduce((a, b) => a + b, 0);
                const avgScore = totalParticipations > 0 ? (totalCorrect / totalParticipations).toFixed(1) : '0.0';
                const quizWinsLeader = quizGroupWinsSummary[0] || null;
                const socialWinsLeader = socialGameWinsSummary[0] || null;

                // Rivalry / Competition Metric Calculation
                let competitionMetric = null;
                const rankingList = groupRankingSummary.ranking || [];
                const currentUserRank = groupRankingSummary.currentUserRank;

                if (currentUserRank && rankingList.length > 1) {
                  const userIndex = rankingList.findIndex(r => r.userId === currentUser?.uid);
                  if (userIndex > 0) {
                    // Someone is directly ahead
                    const rival = rankingList[userIndex - 1];
                    const diff = rival.score - currentUserRank.score;
                    competitionMetric = {
                      type: 'rival',
                      title: 'Rival a bater (Próximo Alvo)',
                      value: rival.name,
                      subtitle: `Falta apenas ${diff} ${diff === 1 ? 'acerto' : 'acertos'} para você ultrapassar!`,
                      photoURL: rival.photoURL,
                      icon: Target,
                      color: '#FF6B35'
                    };
                  } else if (userIndex === 0) {
                    // Current user is #1
                    const rival = rankingList[1];
                    const diff = currentUserRank.score - rival.score;
                    competitionMetric = {
                      type: 'throne',
                      title: 'Defendendo o Trono',
                      value: 'Você é o #1!',
                      subtitle: `${diff} ${diff === 1 ? 'acerto' : 'acertos'} à frente de ${rival.name}`,
                      photoURL: rival.photoURL,
                      icon: Crown,
                      color: '#FFD700'
                    };
                  }
                }

                if (!competitionMetric && rankingList.length >= 2) {
                  const leader = rankingList[0];
                  const runnerUp = rankingList[1];
                  const diff = leader.score - runnerUp.score;
                  competitionMetric = {
                    type: 'top_gap',
                    title: 'Disputa pelo Topo',
                    value: `Briga pelo 1º Lugar`,
                    subtitle: `${leader.name} (#1) está apenas ${diff} ${diff === 1 ? 'acerto' : 'acertos'} à frente de ${runnerUp.name} (#2)`,
                    icon: Zap,
                    color: '#FFC107'
                  };
                }

                return (
                  <>
                    {competitionMetric && (
                      <View style={[styles.competitionCard, { borderColor: `${competitionMetric.color}35` }]}>
                        <View pointerEvents="none" style={[styles.competitionOrb, { backgroundColor: `${competitionMetric.color}08` }]} />
                        <View style={styles.competitionHeader}>
                          <View style={[styles.competitionIconWrap, { backgroundColor: `${competitionMetric.color}15`, borderColor: `${competitionMetric.color}25` }]}>
                            <competitionMetric.icon size={20} color={competitionMetric.color} />
                          </View>
                          <View style={styles.competitionCopy}>
                            <Text style={[styles.competitionEyebrow, { color: competitionMetric.color }]}>
                              {competitionMetric.title}
                            </Text>
                            <Text style={styles.competitionValue} numberOfLines={1}>
                              {competitionMetric.value}
                            </Text>
                            <Text style={styles.competitionSubtitle}>
                              {competitionMetric.subtitle}
                            </Text>
                          </View>
                          {competitionMetric.photoURL && (
                            <AvatarCircle
                              name={competitionMetric.value}
                              photoURL={competitionMetric.photoURL}
                              size={44}
                            />
                          )}
                        </View>
                      </View>
                    )}

                    <View style={styles.statsGrid}>
                      <View style={styles.statCard}>
                        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(74, 222, 128, 0.12)', borderColor: 'rgba(74, 222, 128, 0.28)' }]}>
                          <Target size={20} color="#4ADE80" />
                        </View>
                        <Text style={styles.statValue}>{avgScore}</Text>
                        <Text style={styles.statLabel}>Média de Acertos</Text>
                      </View>

                      <View style={styles.statCard}>
                        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 193, 7, 0.12)', borderColor: 'rgba(255, 193, 7, 0.28)' }]}>
                          <Crown size={20} color="#FFC107" />
                        </View>
                        <Text style={styles.statValue}>{quizWinsLeader?.wins || 0}</Text>
                        <Text style={styles.statLabel}>Mais vitórias em quiz</Text>
                      </View>

                      <View style={styles.statCard}>
                        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 107, 53, 0.12)', borderColor: 'rgba(255, 107, 53, 0.28)' }]}>
                          <Gamepad2 size={20} color="#FF6B35" />
                        </View>
                        <Text style={styles.statValue}>{socialWinsLeader?.wins || 0}</Text>
                        <Text style={styles.statLabel}>Mais vitórias sociais</Text>
                      </View>
                    </View>

                    <View style={styles.statsDetailList}>
                      <View style={styles.statsDetailCard}>
                        <View style={styles.statCardHeader}>
                          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 193, 7, 0.12)', borderColor: 'rgba(255, 193, 7, 0.28)' }]}>
                            <Crown size={20} color="#FFC107" />
                          </View>
                          <View>
                            <Text style={styles.statLabel}>Grupos de quiz ganhos</Text>
                            <Text style={styles.statDetailSubtitle}>Vitórias acumuladas por usuário</Text>
                          </View>
                        </View>
                        {quizGroupWinsSummary.length > 0 ? (
                          quizGroupWinsSummary.slice(0, 5).map((member, index) => (
                            <View key={member.userId} style={styles.statsWinnerRow}>
                              <Text style={styles.statsWinnerPosition}>#{index + 1}</Text>
                              <AvatarCircle name={member.name} photoURL={member.photoURL} size={34} />
                              <Text style={styles.statsWinnerName} numberOfLines={1}>{member.name}</Text>
                              <Text style={styles.statsWinnerValue}>{member.wins}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.emptyStatText}>Nenhum grupo de quiz teve vencedor ainda.</Text>
                        )}
                      </View>

                      <View style={styles.statsDetailCard}>
                        <View style={styles.statCardHeader}>
                          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 107, 53, 0.12)', borderColor: 'rgba(255, 107, 53, 0.28)' }]}>
                            <Gamepad2 size={20} color="#FF6B35" />
                          </View>
                          <View>
                            <Text style={styles.statLabel}>Jogos sociais vencidos</Text>
                            <Text style={styles.statDetailSubtitle}>Partidas online com membros deste grupo</Text>
                          </View>
                        </View>
                        {socialGameWinsSummary.length > 0 ? (
                          socialGameWinsSummary.slice(0, 5).map((member, index) => (
                            <View key={member.userId} style={styles.statsWinnerRow}>
                              <Text style={styles.statsWinnerPosition}>#{index + 1}</Text>
                              <AvatarCircle name={member.name} photoURL={member.photoURL} size={34} />
                              <Text style={styles.statsWinnerName} numberOfLines={1}>{member.name}</Text>
                              <Text style={styles.statsWinnerValue}>{member.wins}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.emptyStatText}>Ainda não há partidas sociais vinculadas a este grupo.</Text>
                        )}
                      </View>

                      <View style={styles.statsDetailCard}>
                        <View style={styles.statCardHeader}>
                          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(144, 97, 249, 0.12)', borderColor: 'rgba(144, 97, 249, 0.28)' }]}>
                            <Zap size={20} color={PRIMARY_PURPLE} />
                          </View>
                          <Text style={styles.statLabel}>Membro Mais Ativo</Text>
                        </View>
                        {mostActiveMember ? (
                        <View style={styles.activeMemberInfo}>
                          <AvatarCircle
                            name={mostActiveMember.displayName || 'User'}
                            size={40}
                            photoURL={mostActiveMember.photoURL}
                          />
                          <View>
                            <Text style={styles.activeMemberName}>{mostActiveMember.displayName}</Text>
                            <Text style={styles.activeMemberSub}>{maxParticipation} quizzes</Text>
                          </View>
                        </View>
                        ) : (
                          <Text style={styles.emptyStatText}>Ainda não há dados</Text>
                        )}
                      </View>

                      <View style={styles.statsDetailCard}>
                        <View style={styles.statCardHeader}>
                          <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 193, 7, 0.12)', borderColor: 'rgba(255, 193, 7, 0.28)' }]}>
                            <Crown size={20} color="#FFC107" />
                          </View>
                          <Text style={styles.statLabel}>Maior Pontuação em Quiz</Text>
                        </View>
                        {highestScorer ? (
                        <View style={styles.activeMemberInfo}>
                          <AvatarCircle
                            name={highestScorer.name || 'User'}
                            size={40}
                            photoURL={highestScorer.photoURL}
                          />
                          <View>
                            <Text style={styles.activeMemberName}>{highestScore} acertos</Text>
                            <Text style={styles.activeMemberSub}>por {highestScorer.name}</Text>
                          </View>
                        </View>
                        ) : (
                          <Text style={styles.emptyStatText}>Ainda não há dados</Text>
                        )}
                      </View>
                    </View>
                  </>
                );
              })()}
            </View>
          </View>
        )}

        {activeTab === 'ranking' && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderCopy}>
                  <Text style={styles.sectionTitle}>Ranking do grupo</Text>
                  <Text style={styles.sectionSubtitle}>Quem está puxando a disputa social daqui</Text>
                </View>
                {groupRankingSummary.ranking.length > 0 && (
                  <View style={styles.memberCountPill}>
                    <Trophy size={14} color={PRIMARY_PURPLE} />
                    <Text style={styles.memberCountPillText}>{groupRankingSummary.ranking.length}</Text>
                  </View>
                )}
              </View>

              {groupRankingSummary.latestRanking ? (
                <>
                  <View style={styles.groupPodiumCard}>
                    <View pointerEvents="none" style={styles.groupPodiumOrb} />
                    <View style={styles.groupPodiumHeader}>
                      <View style={styles.groupPodiumIcon}>
                        <Trophy size={24} color="#FDE68A" />
                      </View>
                      <View style={styles.groupPodiumCopy}>
                        <Text style={styles.groupPodiumEyebrow}>Top 3 do grupo</Text>
                        <Text style={styles.groupPodiumTitle}>Pódio geral</Text>
                      </View>
                    </View>

                    <View style={styles.groupPodiumList}>
                      {groupRankingSummary.topThree.map((rank, index) => (
                        <View
                          key={rank.userId || `${rank.name}-${index}`}
                          style={[
                            styles.groupPodiumItem,
                            index === 0 && styles.groupPodiumItemFirst,
                          ]}
                        >
                          <View style={[styles.groupPodiumPosition, index === 0 && styles.groupPodiumPositionFirst]}>
                            <Text style={styles.groupPodiumPositionText}>{index + 1}</Text>
                          </View>
                          <AvatarCircle
                            name={rank.name}
                            photoURL={rank.photoURL}
                            size={42}
                            style={styles.groupPodiumAvatar}
                          />
                          <View style={styles.groupPodiumMemberCopy}>
                            <Text style={styles.groupPodiumName} numberOfLines={1}>{rank.name}</Text>
                            <Text style={styles.groupPodiumMeta}>
                              {rank.score} acertos • {rank.participations} disputas
                            </Text>
                          </View>
                          {index === 0 && <Crown size={18} color="#FDE68A" />}
                        </View>
                      ))}
                    </View>

                    {groupRankingSummary.currentUserRank ? (
                      <View style={styles.currentUserRankCard}>
                        <View style={styles.currentUserRankBadge}>
                          <Text style={styles.currentUserRankNumber}>
                            #{groupRankingSummary.currentUserRank.position}
                          </Text>
                        </View>
                        <View style={styles.currentUserRankCopy}>
                          <Text style={styles.currentUserRankTitle}>Sua posição</Text>
                          <Text style={styles.currentUserRankSubtitle}>
                            {groupRankingSummary.currentUserRank.score} acertos em {groupRankingSummary.currentUserRank.participations} disputas
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.currentUserRankCard}>
                        <View style={styles.currentUserRankBadge}>
                          <Text style={styles.currentUserRankNumber}>--</Text>
                        </View>
                        <View style={styles.currentUserRankCopy}>
                          <Text style={styles.currentUserRankTitle}>Você ainda não pontuou</Text>
                          <Text style={styles.currentUserRankSubtitle}>Entre em um palpite para aparecer no ranking.</Text>
                        </View>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.viewAllRankingButton}
                      onPress={() => {
                        navigation.navigate('Ranking', {
                          quizGroupId: groupRankingSummary.latestRanking.id,
                          groupId: group.id,
                          groupName: group.name,
                          quizGroupTitle: 'Ranking Geral do Grupo',
                        });
                      }}
                      activeOpacity={0.86}
                    >
                      <Text style={styles.viewAllRankingButtonText}>Ver ranking completo</Text>
                      <ChevronRight size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.emptyRankingContainer}>
                  <Trophy size={48} color="#71717a" />
                  <Text style={styles.emptyRankingText}>Nenhum ranking disponível ainda</Text>
                  <Text style={styles.emptyRankingSubtext}>
                    Complete um palpite para liberar o pódio do grupo.
                  </Text>
                </View>
              )}
            </View>

          </View>
        )}

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionTitle}>Galera do grupo</Text>
              <Text style={styles.sectionSubtitle}>Quem está jogando, chegando e puxando a disputa</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.smallAddMemberButton}
                  onPress={() => setShowAddMembers(!showAddMembers)}
                  activeOpacity={0.8}
                >
                  <UserPlus size={15} color={PRIMARY_PURPLE} />
                  <Text style={styles.smallAddMemberButtonText}>Convidar</Text>
                </TouchableOpacity>
              )}
              <View style={styles.memberCountPill}>
                <Users size={14} color={PRIMARY_PURPLE} />
                <Text style={styles.memberCountPillText}>{allMembers.length}</Text>
              </View>
            </View>
          </View>

          {isAdmin && showAddMembers && (
            <View style={styles.collapsibleAddMembersSection}>
              <AddMembersCard
                memberCount={group.stats?.totalMembers || group.members?.length || 0}
                showActionButton={false}
              />
              <View style={styles.addMembersContainerInline}>
                <View style={styles.addMembersHeader}>
                  <Text style={styles.addMembersTitle}>Convidar membros</Text>
                  <TouchableOpacity
                    onPress={() => setShowAddMembers(false)}
                    activeOpacity={0.7}
                  >
                    <X size={18} color="#A1A1AA" />
                  </TouchableOpacity>
                </View>

                {/* Search by Username */}
                <View style={styles.searchSection}>
                  <Text style={styles.searchLabel}>Buscar por username/apelido</Text>
                  <View style={styles.searchInputContainer}>
                    <Search size={20} color="#71717a" />
                    <TextInput
                      style={styles.searchInput}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Digite o username ou apelido"
                      placeholderTextColor="#71717a"
                      onSubmitEditing={handleSearchUsers}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}>
                        <X size={20} color="#71717a" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <View style={styles.searchResults}>
                      {searchResults.map(user => (
                        <TouchableOpacity
                          key={user.uid}
                          style={styles.searchResultItem}
                          onPress={() => handleAddUser(user)}
                          activeOpacity={0.8}
                        >
                          <AvatarCircle
                            name={user.username || user.displayName || user.email?.substring(0, 2)}
                            size={40}
                          />
                          <View style={styles.searchResultInfo}>
                            <Text style={styles.searchResultName}>
                              {user.username || user.displayName || 'Usuário'}
                            </Text>
                            {user.email && (
                              <Text style={styles.searchResultEmail}>{user.email}</Text>
                            )}
                          </View>
                          <UserPlus size={20} color={PRIMARY_PURPLE} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Invite by Email */}
                <View style={styles.emailSection}>
                  <Text style={styles.searchLabel}>Ou convidar por e-mail</Text>
                  <View style={styles.emailInputContainer}>
                    <Mail size={20} color="#71717a" />
                    <TextInput
                      style={styles.emailInput}
                      value={emailInput}
                      onChangeText={setEmailInput}
                      placeholder="Digite o e-mail"
                      placeholderTextColor="#71717a"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onSubmitEditing={handleAddEmail}
                    />
                    <TouchableOpacity
                      style={styles.addEmailButton}
                      onPress={handleAddEmail}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addEmailButtonText}>Adicionar</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Email List */}
                  {inviteEmails.length > 0 && (
                    <View style={styles.emailList}>
                      {inviteEmails.map((email, index) => (
                        <View key={index} style={styles.emailTag}>
                          <Text style={styles.emailTagText}>{email}</Text>
                          <TouchableOpacity onPress={() => handleRemoveEmail(email)}>
                            <X size={16} color="#71717a" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                  <View style={styles.selectedUsersSection}>
                    <Text style={styles.selectedUsersTitle}>Usuários selecionados</Text>
                    <View style={styles.selectedUsersList}>
                      {selectedUsers.map(user => (
                        <View key={user.uid} style={styles.selectedUserTag}>
                          <AvatarCircle
                            name={user.username || user.displayName || user.email?.substring(0, 2)}
                            size={32}
                          />
                          <Text style={styles.selectedUserText}>
                            {user.username || user.displayName || user.email}
                          </Text>
                          <TouchableOpacity onPress={() => handleRemoveUser(user.uid)}>
                            <X size={16} color="#71717a" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Send Button */}
                {(selectedUsers.length > 0 || inviteEmails.length > 0) && (
                  <TouchableOpacity
                    style={styles.sendInvitesButton}
                    onPress={handleSendInvites}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <UserPlus size={18} color="#FFFFFF" />
                        <Text style={styles.sendInvitesButtonText}>
                          Enviar {selectedUsers.length + inviteEmails.length} convite(s)
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          <View style={styles.memberSocialHighlights}>
            <View style={styles.memberChampionCard}>
              <View pointerEvents="none" style={styles.memberChampionOrb} />
              <View style={styles.memberChampionIconWrap}>
                <Crown size={20} color="#FFC107" />
              </View>
              <View style={styles.memberChampionCopy}>
                <Text style={styles.memberHighlightLabel}>Campeão atual</Text>
                {currentChampion ? (
                  <>
                    <Text style={styles.memberChampionName} numberOfLines={1}>
                      {currentChampion.name}
                    </Text>
                    <Text style={styles.memberHighlightSubtext}>
                      {currentChampion.score} acertos em {currentChampion.participations} disputas
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.memberChampionName}>Sem campeão ainda</Text>
                    <Text style={styles.memberHighlightSubtext}>
                      O primeiro ranking define quem puxa o topo.
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          <View style={styles.membersContainer}>
            {allMembers.slice(0, 10).map((member, index) => {
              const memberName = member.displayName || member.username || 'Usuário';
              const memberIsAdmin = group.admins?.includes(member.uid);
              const memberIsCurrentUser = member.uid === currentUser?.uid;
              const memberRanking = groupRankingSummary.ranking.find(rank => rank.userId === member.uid);
              const memberRankingPosition = groupRankingSummary.ranking.findIndex(rank => rank.userId === member.uid) + 1;

              return (
                <View key={member.uid || `${memberName}-${index}`} style={styles.memberCard}>
                  <AvatarCircle
                    name={memberName}
                    photoURL={member.photoURL}
                    size={44}
                    style={styles.memberCardAvatar}
                  />
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName} numberOfLines={1}>
                        {memberIsCurrentUser ? 'Você' : memberName}
                      </Text>
                      {memberRanking ? (
                        <View style={styles.memberSocialBadge}>
                          <Crown size={10} color="#FDE68A" />
                          <Text style={styles.memberSocialBadgeText}>
                            #{memberRankingPosition}
                          </Text>
                        </View>
                      ) : memberIsAdmin && (
                        <View style={styles.memberSocialBadgeMuted}>
                          <Text style={styles.memberSocialBadgeMutedText}>anfitrião</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.memberRole}>
                      {memberRanking
                        ? `${memberRanking.score} acertos em ${memberRanking.participations} disputas`
                        : memberIsCurrentUser
                          ? 'Você está na roda'
                          : 'Na roda para os próximos palpites'}
                    </Text>
                  </View>
                </View>
              );
            })}
            {allMembers.length > 10 && (
              <View style={[styles.memberCard, styles.moreMembersCard]}>
                <Text style={styles.moreMembersText}>
                  +{allMembers.length - 10} membros
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Leave Group Button */}
        {isMember && (
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveGroup}
            activeOpacity={0.8}
          >
            <View style={styles.leaveButtonIconWrap}>
              <UserMinus size={18} color="#F87171" />
            </View>
            <View style={styles.leaveButtonCopy}>
              <Text style={styles.leaveButtonText}>Sair do Grupo</Text>
              <Text style={styles.leaveButtonSubtext}>Você deixa de participar dos quizzes e rankings daqui.</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08080C',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#08080C',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  groupBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBadgeText: {
    fontSize: 32,
  },
  groupDetails: {
    flex: 1,
  },
  groupDescription: {
    fontSize: 16,
    color: '#B0B0B0',
    marginBottom: 12,
    lineHeight: 22,
  },
  groupStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  memberPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  memberPreviewStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberPreviewAvatar: {
    borderWidth: 2,
    borderColor: '#121212',
  },
  memberPreviewAvatarOverlap: {
    marginLeft: -8,
  },
  memberPreviewMore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PRIMARY_PURPLE_ALPHA_15,
    borderWidth: 2,
    borderColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberPreviewMoreText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  memberPreviewLabel: {
    fontSize: 13,
    color: '#D4D4D8',
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sectionHeaderCopy: {
    flex: 1,
    paddingRight: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    color: '#A1A1AA',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY_PURPLE,
    backgroundColor: PRIMARY_PURPLE_ALPHA_12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    padding: 8,
  },
  rejectButton: {
    padding: 8,
  },
  nowSection: {
    marginBottom: 24,
  },
  nowHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  nowEyebrow: {
    color: PRIMARY_PURPLE,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  nowTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  nowCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.18)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 2,
  },
  nowCountText: {
    color: '#BBF7D0',
    fontSize: 12,
    fontWeight: '800',
  },
  nowCard: {
    backgroundColor: '#1D1A24',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE_ALPHA_30,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  nowCardOrb: {
    position: 'absolute',
    right: -34,
    top: -30,
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: PRIMARY_PURPLE_ALPHA_08,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE_ALPHA_15,
  },
  nowCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  nowIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: PRIMARY_PURPLE_ALPHA_15,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE_ALPHA_30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowCardCopy: {
    flex: 1,
    minWidth: 0,
  },
  nowCardTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 24,
    marginBottom: 9,
  },
  nowMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  nowMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.075)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  nowMetaText: {
    color: '#E4E4E7',
    fontSize: 12,
    fontWeight: '800',
  },
  nowCtaRow: {
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: PRIMARY_PURPLE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nowCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  nowEmptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#18181D',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.075)',
    padding: 16,
  },
  nowEmptyIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: PRIMARY_PURPLE_ALPHA_12,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE_ALPHA_20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowEmptyCopy: {
    flex: 1,
    minWidth: 0,
  },
  nowEmptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 3,
  },
  nowEmptySubtitle: {
    color: '#A1A1AA',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  nowEmptyButton: {
    borderRadius: 999,
    backgroundColor: PRIMARY_PURPLE_ALPHA_15,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE_ALPHA_30,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  nowEmptyButtonText: {
    color: PRIMARY_PURPLE,
    fontSize: 12,
    fontWeight: '900',
  },
  groupPulseSection: {
    marginBottom: 24,
    gap: 12,
  },
  groupPulseCard: {
    backgroundColor: '#18181D',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(159, 99, 255, 0.18)',
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  groupPulseOrb: {
    position: 'absolute',
    right: -30,
    top: -34,
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: PRIMARY_PURPLE_ALPHA_08,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE_ALPHA_15,
  },
  groupPulseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  groupPulseIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: 'rgba(253,230,138,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupPulseCopy: {
    flex: 1,
    minWidth: 0,
  },
  groupPulseEyebrow: {
    color: PRIMARY_PURPLE,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  groupPulseTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  groupPulseSubtitle: {
    color: '#A1A1AA',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  groupPulseStats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  groupPulseStat: {
    flex: 1,
    minHeight: 46,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.065)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 6,
  },
  groupPulseStatValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  groupPulseStatLabel: {
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '800',
  },
  socialNudgeList: {
    gap: 8,
    marginBottom: 12,
  },
  socialNudgeItem: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  socialNudgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  socialNudgeIcon_gold: {
    backgroundColor: 'rgba(253,230,138,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.18)',
  },
  socialNudgeIcon_success: {
    backgroundColor: 'rgba(34,197,94,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(134,239,172,0.18)',
  },
  socialNudgeIcon_live: {
    backgroundColor: PRIMARY_PURPLE_ALPHA_12,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE_ALPHA_20,
  },
  socialNudgeIcon_muted: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  socialNudgeCopy: {
    flex: 1,
    minWidth: 0,
  },
  socialNudgeTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    marginBottom: 3,
  },
  socialNudgeSubtitle: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '700',
  },
  groupPulseActivity: {
    gap: 8,
  },
  groupPulseActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.055)',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  groupPulseActivityIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: PRIMARY_PURPLE_ALPHA_12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupPulseActivityCopy: {
    flex: 1,
    minWidth: 0,
  },
  groupPulseActivityTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 2,
  },
  groupPulseActivitySubtitle: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '700',
  },
  groupPulseActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  groupPulseActionButton: {
    width: '48%',
    minHeight: 70,
    borderRadius: 20,
    backgroundColor: '#18181D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  groupPulseActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: PRIMARY_PURPLE_ALPHA_12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupPulseActionCopy: {
    flex: 1,
    minWidth: 0,
  },
  groupPulseActionLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 3,
  },
  groupPulseActionSubtitle: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '700',
  },
  actionsContainer: {
    marginBottom: 18,
    gap: 10,
  },
  createQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181D',
    minHeight: 56,
    gap: 11,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(159,99,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  createQuizGradient: {
    width: '100%',
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createQuizIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: PRIMARY_PURPLE_ALPHA_12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createQuizCopy: {
    flex: 1,
  },
  createQuizButtonText: {
    color: PRIMARY_PURPLE,
    fontSize: 15,
    fontWeight: '800',
  },
  createQuizButtonSubtext: {
    color: '#A1A1AA',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  rankingCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  rankingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  rankingCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rankingCardCrown: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  rankingCardContent: {
    flex: 1,
  },
  rankingCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  rankingCardSubtitle: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  rankingCardPreview: {
    gap: 12,
  },
  rankingCardUserPosition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: PRIMARY_PURPLE_ALPHA_15,
    borderRadius: 12,
  },
  rankingPositionBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: PRIMARY_PURPLE_ALPHA_30,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE,
  },
  rankingPositionNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: PRIMARY_PURPLE,
  },
  rankingPositionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY_PURPLE,
    marginLeft: 2,
  },
  rankingCardStats: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rankingCardTop3: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  rankingCardTop3Item: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  rankingCardTop3Crown: {
    position: 'absolute',
    top: -8,
    zIndex: 1,
  },
  rankingCardTop3Avatar: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rankingCardTop3Name: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  groupPodiumCard: {
    backgroundColor: '#1A1A1F',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE_ALPHA_20,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  groupPodiumOrb: {
    position: 'absolute',
    right: -34,
    top: -34,
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: PRIMARY_PURPLE_ALPHA_08,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE_ALPHA_15,
  },
  groupPodiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  groupPodiumIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: 'rgba(253,230,138,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupPodiumCopy: {
    flex: 1,
  },
  groupPodiumEyebrow: {
    color: PRIMARY_PURPLE,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  groupPodiumTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  groupPodiumList: {
    gap: 10,
    marginBottom: 14,
  },
  groupPodiumItem: {
    minHeight: 68,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  groupPodiumItemFirst: {
    backgroundColor: 'rgba(253,230,138,0.08)',
    borderColor: 'rgba(253,230,138,0.18)',
  },
  groupPodiumPosition: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupPodiumPositionFirst: {
    backgroundColor: 'rgba(253,230,138,0.18)',
  },
  groupPodiumPositionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  groupPodiumAvatar: {
    borderWidth: 2,
    borderColor: PRIMARY_PURPLE_ALPHA_30,
  },
  groupPodiumMemberCopy: {
    flex: 1,
    minWidth: 0,
  },
  groupPodiumName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 3,
  },
  groupPodiumMeta: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '700',
  },
  currentUserRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: PRIMARY_PURPLE_ALPHA_12,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE_ALPHA_20,
    borderRadius: 22,
    padding: 14,
    marginBottom: 14,
  },
  currentUserRankBadge: {
    minWidth: 48,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY_PURPLE_ALPHA_20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  currentUserRankNumber: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  currentUserRankCopy: {
    flex: 1,
    minWidth: 0,
  },
  currentUserRankTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 3,
  },
  currentUserRankSubtitle: {
    color: '#D4D4D8',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#A1A1AA',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  quizGroupsContainer: {
    gap: 14,
    marginBottom: 16,
  },
  quizGroupCard: {
    backgroundColor: '#1A1A1F',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    position: 'relative',
  },
  quizGroupCardActive: {
    borderColor: PRIMARY_PURPLE_ALPHA_20,
    backgroundColor: '#1D1A24',
  },
  quizGroupAccentOrb: {
    position: 'absolute',
    right: -28,
    top: -26,
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.035)',
  },
  quizGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  quizGroupIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: PRIMARY_PURPLE_ALPHA_12,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE_ALPHA_20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizGroupInfo: {
    flex: 1,
  },
  quizGroupTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  quizGroupBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  quizGroupInfoBadge: {
    backgroundColor: PRIMARY_PURPLE_ALPHA_15,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE_ALPHA_30,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quizGroupInfoBadgeText: {
    color: PRIMARY_PURPLE,
    fontSize: 11,
    fontWeight: '900',
  },
  quizGroupInfoBadgeSecondary: {
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.075)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quizGroupInfoBadgeSecondaryText: {
    color: '#D4D4D8',
    fontSize: 11,
    fontWeight: '800',
  },
  quizGroupMetaRow: {
    marginTop: 4,
  },
  quizGroupMode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quizGroupMeta: {
    fontSize: 13,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  quizGroupChevronWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizGroupFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  quizGroupStatusPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  quizGroupStatusPillActive: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.18)',
  },
  quizGroupStatus: {
    fontSize: 12,
    fontWeight: '800',
    color: '#86EFAC',
  },
  quizGroupStatusEnded: {
    color: '#A1A1AA',
  },
  quizGroupTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  quizGroupTime: {
    fontSize: 12,
    color: '#BBF7D0',
    fontWeight: '700',
  },
  quizGroupStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  quizGroupStatText: {
    fontSize: 12,
    color: '#D4D4D8',
    fontWeight: '800',
  },
  quizGroupRanking: {
    fontSize: 13,
    color: PRIMARY_PURPLE,
    fontWeight: '800',
    marginLeft: 'auto',
  },
  quizzesContainer: {
    gap: 12,
  },
  quizCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quizTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  quizDescription: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 12,
  },
  quizFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  quizStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quizStatText: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  memberSocialHighlights: {
    gap: 12,
    marginBottom: 14,
  },
  memberChampionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: '#1D1A24',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE_ALPHA_20,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  memberChampionOrb: {
    position: 'absolute',
    right: -26,
    top: -30,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(253,230,138,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.1)',
  },
  memberChampionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberChampionCopy: {
    flex: 1,
    minWidth: 0,
  },
  memberHighlightLabel: {
    color: PRIMARY_PURPLE,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  memberChampionName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 3,
  },
  memberHighlightSubtext: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  memberNewCard: {
    backgroundColor: '#18181D',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 16,
  },
  memberNewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  memberNewStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberNewAvatarWrap: {
    marginRight: -8,
    borderWidth: 2,
    borderColor: '#18181D',
    borderRadius: 19,
  },
  membersContainer: {
    backgroundColor: '#18181D',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 10,
    gap: 8,
  },
  memberCountPill: {
    minWidth: 42,
    height: 34,
    borderRadius: 17,
    backgroundColor: PRIMARY_PURPLE_ALPHA_12,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE_ALPHA_20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  memberCountPillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  memberCard: {
    minHeight: 68,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.055)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberCardAvatar: {
    borderWidth: 2,
    borderColor: PRIMARY_PURPLE_ALPHA_30,
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    flexShrink: 1,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  memberRole: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  memberSocialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.22)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  memberSocialBadgeText: {
    fontSize: 10,
    color: '#FDE68A',
    fontWeight: '800',
  },
  memberSocialBadgeMuted: {
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.075)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  memberSocialBadgeMutedText: {
    color: '#D4D4D8',
    fontSize: 10,
    fontWeight: '800',
  },
  moreMembersCard: {
    justifyContent: 'center',
    backgroundColor: PRIMARY_PURPLE_ALPHA_08,
    borderColor: PRIMARY_PURPLE_ALPHA_20,
  },
  moreMembersText: {
    fontSize: 14,
    color: PRIMARY_PURPLE,
    textAlign: 'center',
    fontWeight: '800',
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.08)',
    gap: 9,
    marginTop: -6,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  leaveButtonIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(248,113,113,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveButtonCopy: {
    flex: 1,
  },
  leaveButtonText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '800',
  },
  leaveButtonSubtext: {
    color: 'rgba(252,165,165,0.68)',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  addMembersContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#1C1C22',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(159, 99, 255, 0.16)',
    padding: 18,
    gap: 20,
  },
  addMembersToggleButton: {
    backgroundColor: '#18181D',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.075)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  addMembersToggleOrb: {
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
  addMembersToggleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: PRIMARY_PURPLE_ALPHA_12,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE_ALPHA_20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMembersToggleCopy: {
    flex: 1,
  },
  addMembersToggleButtonText: {
    color: '#E4E4E7',
    fontSize: 14,
    fontWeight: '800',
  },
  addMembersToggleButtonSubtext: {
    color: '#A1A1AA',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  addMembersToggleArrowWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PRIMARY_PURPLE_ALPHA_08,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE_ALPHA_20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMembersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addMembersTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  searchSection: {
    gap: 12,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
  },
  searchResults: {
    gap: 8,
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  searchResultEmail: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  emailSection: {
    gap: 12,
  },
  emailInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  emailInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
  },
  addEmailButton: {
    backgroundColor: PRIMARY_PURPLE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addEmailButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emailList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emailTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  emailTagText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  selectedUsersSection: {
    gap: 12,
  },
  selectedUsersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedUsersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedUserTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  selectedUserText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  sendInvitesButton: {
    backgroundColor: PRIMARY_PURPLE,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  sendInvitesButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY_PURPLE,
  },
  emptyRankingContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderStyle: 'dashed',
  },
  emptyRankingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyRankingSubtext: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30,30,34,0.88)',
    borderRadius: 22,
    padding: 6,
    marginBottom: 26,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tabButton: {
    flex: 1,
    minHeight: 58,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 17,
  },
  tabButtonActive: {
    backgroundColor: PRIMARY_PURPLE,
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#71717a',
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    marginBottom: 32,
  },
  viewAllRankingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_PURPLE,
    borderRadius: 18,
    minHeight: 50,
    paddingHorizontal: 16,
    marginTop: 2,
    gap: 8,
  },
  viewAllRankingButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  activityList: {
    gap: 8,
  },
  activityItem: {
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  activityIconWrap_success: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderColor: 'rgba(74, 222, 128, 0.18)',
  },
  activityIconWrap_gold: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderColor: 'rgba(255, 193, 7, 0.18)',
  },
  activityIconWrap_live: {
    backgroundColor: PRIMARY_PURPLE_ALPHA_12,
    borderColor: PRIMARY_PURPLE_ALPHA_20,
  },
  activityIconWrap_muted: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  activityCopy: {
    flex: 1,
    minWidth: 0,
  },
  activityTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
    marginBottom: 1,
  },
  activitySubtitle: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
  },
  activityEmptyCard: {
    backgroundColor: '#18181D',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 18,
  },
  activityEmptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
  },
  activityEmptySubtitle: {
    color: '#A1A1AA',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#18181D',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statCardWide: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  statDetailSubtitle: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  statsDetailList: {
    gap: 12,
  },
  statsDetailCard: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  statsWinnerRow: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statsWinnerPosition: {
    width: 26,
    color: PRIMARY_PURPLE,
    fontSize: 12,
    fontWeight: '900',
  },
  statsWinnerName: {
    flex: 1,
    minWidth: 0,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  statsWinnerValue: {
    minWidth: 28,
    color: '#FDE68A',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
  },
  activeMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeMemberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activeMemberSub: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  emptyStatText: {
    color: '#71717a',
    fontSize: 14,
  },
  smallAddMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_PURPLE_ALPHA_12,
    borderWidth: 1,
    borderColor: PRIMARY_PURPLE_ALPHA_20,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  smallAddMemberButtonText: {
    color: PRIMARY_PURPLE,
    fontSize: 12,
    fontWeight: '800',
  },
  collapsibleAddMembersSection: {
    marginBottom: 16,
    borderRadius: 22,
    overflow: 'hidden',
  },
  addMembersContainerInline: {
    backgroundColor: '#18181D',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 16,
    gap: 16,
    marginTop: 10,
  },
  competitionCard: {
    backgroundColor: '#1E1B24',
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  competitionOrb: {
    position: 'absolute',
    right: -24,
    top: -24,
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
  },
  competitionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  competitionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  competitionCopy: {
    flex: 1,
    minWidth: 0,
  },
  competitionEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  competitionValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  competitionSubtitle: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
