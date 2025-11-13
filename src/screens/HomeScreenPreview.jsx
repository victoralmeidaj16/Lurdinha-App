import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import {
  Trophy,
  Clock3,
  Users2,
  ChevronRight,
  Crown,
  Bell,
  ListChecks,
} from 'lucide-react-native';
import AvatarCircle from '../components/AvatarCircle';

// Dados mockados
const MOCK_USER = {
  displayName: 'Victor Almeida',
  photoURL: null,
  email: 'victor@example.com',
};

const MOCK_QUIZ_GROUP_RANKING = {
  quizGroupTitle: 'Família Silva',
  groupName: 'Família',
  userPosition: 2,
  isActive: true,
  userData: { correct: 8, total: 10 },
  top3: [
    { userId: '1', name: 'Maria Silva', correct: 10, total: 10, photoURL: null },
    { userId: '2', name: 'Victor Almeida', correct: 8, total: 10, photoURL: null },
    { userId: '3', name: 'João Santos', correct: 7, total: 10, photoURL: null },
  ],
  rankingType: 'individual',
};

const MOCK_GROUP_RANKING = {
  groupName: 'Família',
  userPosition: 3,
  userData: { totalCorrect: 25 },
  top3: [
    { userId: '1', name: 'Maria Silva', totalCorrect: 32, photoURL: null },
    { userId: '2', name: 'Pedro Costa', totalCorrect: 28, photoURL: null },
    { userId: '3', name: 'Victor Almeida', totalCorrect: 25, photoURL: null },
  ],
};

const MOCK_ACTIVE_QUIZ_GROUPS = [
  {
    id: '1',
    title: 'Quiz do Churrasco',
    groupName: 'Amigos',
    groupColor: '#9061F9',
    groupBadge: '🍖',
    endTime: new Date(Date.now() + 3600000 * 8), // 8 horas
  },
  {
    id: '2',
    title: 'Festinha de Aniversário',
    groupName: 'Família',
    groupColor: '#FF7A59',
    groupBadge: '🎉',
    endTime: new Date(Date.now() + 3600000 * 24), // 24 horas
  },
];

const MOCK_GROUPS = [
  { id: '1', name: 'Família', color: '#9061F9', badge: '👨‍👩‍👧‍👦' },
  { id: '2', name: 'Amigos', color: '#FF7A59', badge: '👥' },
  { id: '3', name: 'Trabalho', color: '#32D583', badge: '💼' },
];

const MOCK_NOTIFICATIONS = [
  { id: '1', message: 'Quiz "Família Silva" foi finalizado', time: '2h atrás', read: false },
  { id: '2', message: 'Novo quiz disponível no grupo "Amigos"', time: '5h atrás', read: false },
  { id: '3', message: 'Você alcançou o Top 3!', time: '1d atrás', read: true },
];

export default function HomeScreenPreview() {
  const [pressedCard, setPressedCard] = useState(null);
  
  // Animações
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getTimeLeft = (endTime) => {
    const hoursLeft = Math.ceil((endTime - new Date()) / (1000 * 60 * 60));
    return hoursLeft > 0 ? `${hoursLeft}h` : 'Expirado';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
          },
        ]}
      >
        {/* Hero: Saudação e logo */}
        <View style={styles.heroContainer}>
          {/* Saudação com avatar à direita */}
          <View style={styles.heroHeader}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroOlá}>Olá 👋</Text>
              <Text style={styles.heroName}>{MOCK_USER.displayName}</Text>
            </View>
            <View style={styles.heroAvatarContainer}>
              <AvatarCircle
                name={MOCK_USER.displayName}
                size={40}
                photoURL={MOCK_USER.photoURL}
                style={styles.heroAvatar}
              />
            </View>
          </View>
          
          {/* Logo Centralizado */}
          <View style={styles.logoContainer}>
            <Animated.Image
              source={require('../../assets/logo.png')} 
              style={[styles.logo, { transform: [{ scale: scaleAnim }] }]}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Card: Ranking do Quiz */}
        <View style={styles.cardWrapper}>
          <TouchableOpacity
            style={styles.card}
            onPressIn={() => setPressedCard('quizRanking')}
            onPressOut={() => setPressedCard(null)}
            activeOpacity={0.95}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <View style={styles.cardTitleRow}>
                  <Trophy size={18} color="#9061F9" style={styles.cardTitleIcon} />
                  <Crown size={14} color="#9061F9" opacity={0.6} style={styles.cardCrownSmall} />
                  <Text style={styles.cardTitle}>Ranking do Quiz</Text>
                </View>
                <Text style={styles.cardSubtitle}>
                  {MOCK_QUIZ_GROUP_RANKING.quizGroupTitle} • {MOCK_QUIZ_GROUP_RANKING.groupName}
                </Text>
              </View>
              <View style={styles.chevronContainer}>
                <ChevronRight size={18} color="#B9C0CC" />
              </View>
            </View>

            <View style={styles.rankingPreview}>
              <View style={styles.rankingPosition}>
                <View style={styles.positionBadge}>
                  <Text style={styles.positionNumber}>{MOCK_QUIZ_GROUP_RANKING.userPosition}</Text>
                  <Text style={styles.positionLabel}>º lugar</Text>
                </View>
                <Text style={styles.rankingStats}>
                  {MOCK_QUIZ_GROUP_RANKING.userData?.correct || 0} acertos
                </Text>
                <View style={styles.quizGroupStatusBadge}>
                  <Text style={[styles.quizGroupStatusText, { color: MOCK_QUIZ_GROUP_RANKING.isActive ? '#9061F9' : '#B9C0CC' }]}>
                    {MOCK_QUIZ_GROUP_RANKING.isActive ? 'Ativo' : 'Encerrado'}
                  </Text>
                </View>
              </View>

              {/* Top 3 Preview */}
              <View style={styles.top3Preview}>
                {MOCK_QUIZ_GROUP_RANKING.top3.map((member, index) => (
                  <View key={member.userId || index} style={styles.top3Item}>
                    {index === 0 && (
                      <Crown size={14} color="#9061F9" opacity={0.7} style={styles.crownIcon} />
                    )}
                    <AvatarCircle
                      name={member.name}
                      size={32}
                      photoURL={member.photoURL}
                      style={styles.top3Avatar}
                    />
                    <View style={styles.top3Info}>
                      <Text style={styles.top3Name} numberOfLines={1}>
                        {member.name}
                      </Text>
                      <Text style={styles.top3Score}>
                        {member.correct || 0} acertos
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Card: Ranking Geral do Grupo */}
        <View style={styles.cardWrapper}>
          <TouchableOpacity
            style={styles.card}
            onPressIn={() => setPressedCard('groupRanking')}
            onPressOut={() => setPressedCard(null)}
            activeOpacity={1}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <View style={styles.cardTitleRow}>
                  <Trophy size={18} color="#9061F9" style={styles.cardTitleIcon} />
                  <Crown size={14} color="#9061F9" opacity={0.6} style={styles.cardCrownSmall} />
                  <Text style={styles.cardTitle}>Ver ranking do seu grupo</Text>
                </View>
                <Text style={styles.cardSubtitle}>{MOCK_GROUP_RANKING.groupName}</Text>
              </View>
              <View style={styles.chevronContainer}>
                <ChevronRight size={18} color="#B9C0CC" />
              </View>
            </View>

            <View style={styles.rankingPreview}>
              {MOCK_GROUP_RANKING.userPosition && (
                <View style={styles.rankingPosition}>
                  <View style={styles.positionBadge}>
                    <Text style={styles.positionNumber}>{MOCK_GROUP_RANKING.userPosition}</Text>
                    <Text style={styles.positionLabel}>º lugar</Text>
                  </View>
                  <Text style={styles.rankingStats}>
                    {MOCK_GROUP_RANKING.userData?.totalCorrect || 0} acertos totais
                  </Text>
                </View>
              )}

              {/* Top 3 Preview */}
              <View style={styles.top3Preview}>
                {MOCK_GROUP_RANKING.top3.map((member, index) => (
                  <View key={member.userId || index} style={styles.top3Item}>
                    {index === 0 && (
                      <Crown size={14} color="#9061F9" opacity={0.7} style={styles.crownIcon} />
                    )}
                    <AvatarCircle
                      name={member.name}
                      size={32}
                      photoURL={member.photoURL}
                      style={styles.top3Avatar}
                    />
                    <View style={styles.top3Info}>
                      <Text style={styles.top3Name} numberOfLines={1}>
                        {member.name}
                      </Text>
                      <Text style={styles.top3Score}>
                        {member.totalCorrect || 0} acertos
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Card: Ver Todos os Rankings */}
        <View style={styles.cardWrapper}>
          <TouchableOpacity
            style={styles.card}
            onPressIn={() => setPressedCard('allRankings')}
            onPressOut={() => setPressedCard(null)}
            activeOpacity={1}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <View style={styles.cardTitleRow}>
                  <Trophy size={18} color="#9061F9" style={styles.cardTitleIcon} />
                  <Text style={styles.cardTitle}>Rankings</Text>
                </View>
                <Text style={styles.cardSubtitle}>Ver todos os rankings</Text>
              </View>
              <View style={styles.chevronContainer}>
                <ChevronRight size={18} color="#B9C0CC" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Card: Quiz em andamento */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderText}>
              <View style={styles.cardTitleRow}>
                <Clock3 size={18} color="#FF7A59" style={styles.cardTitleIcon} />
                <Text style={styles.cardTitle}>Quiz em andamento</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                {MOCK_ACTIVE_QUIZ_GROUPS.length} {MOCK_ACTIVE_QUIZ_GROUPS.length === 1 ? 'grupo ativo' : 'grupos ativos'}
              </Text>
            </View>
          </View>

          <View style={styles.quizGroupsList}>
            {MOCK_ACTIVE_QUIZ_GROUPS.map((quizGroup, index) => (
              <TouchableOpacity
                key={quizGroup.id}
                style={[
                  styles.quizGroupItem,
                  index < MOCK_ACTIVE_QUIZ_GROUPS.length - 1 && styles.quizGroupItemBorder,
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.quizGroupItemLeft}>
                  <View
                    style={[
                      styles.groupBadgeMini,
                      { backgroundColor: quizGroup.groupColor },
                    ]}
                  >
                    <Text style={styles.groupBadgeMiniText}>
                      {quizGroup.groupBadge}
                    </Text>
                  </View>
                  <View style={styles.quizGroupItemInfo}>
                    <Text style={styles.quizGroupItemTitle} numberOfLines={1}>
                      {quizGroup.title}
                    </Text>
                    <Text style={styles.quizGroupItemGroup}>{quizGroup.groupName}</Text>
                  </View>
                </View>
                <View style={styles.quizGroupItemRight}>
                  <Text style={styles.quizGroupItemTime}>
                    {getTimeLeft(quizGroup.endTime)}
                  </Text>
                  <ListChecks size={14} color="#9061F9" style={styles.activeIndicator} />
                  <ChevronRight size={16} color="#B9C0CC" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Card: Meus Grupos */}
        <View style={styles.cardWrapper}>
          <TouchableOpacity
            style={styles.card}
            onPressIn={() => setPressedCard('myGroups')}
            onPressOut={() => setPressedCard(null)}
            activeOpacity={1}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <View style={styles.cardTitleRow}>
                  <Users2 size={18} color="#9061F9" style={styles.cardTitleIcon} />
                  <Text style={styles.cardTitle}>Abrir grupos</Text>
                </View>
                <Text style={styles.cardSubtitle}>
                  {MOCK_GROUPS.length} {MOCK_GROUPS.length === 1 ? 'grupo' : 'grupos'}
                </Text>
              </View>
              <View style={styles.chevronContainer}>
                <ChevronRight size={18} color="#B9C0CC" />
              </View>
            </View>

            {/* Preview dos grupos */}
            <View style={styles.groupsPreview}>
              {MOCK_GROUPS.slice(0, 3).map((group) => (
                <View key={group.id} style={styles.groupPreviewItem}>
                  <View
                    style={[
                      styles.groupPreviewBadge,
                      { backgroundColor: group.color },
                    ]}
                  >
                    <Text style={styles.groupPreviewBadgeText}>
                      {group.badge}
                    </Text>
                  </View>
                  <Text style={styles.groupPreviewName} numberOfLines={1}>
                    {group.name}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </View>

        {/* Notificações */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderText}>
              <View style={styles.cardTitleRow}>
                <Bell size={18} color="#9061F9" style={styles.cardTitleIcon} />
                <Text style={styles.cardTitle}>Notificações</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                {MOCK_NOTIFICATIONS.filter(n => !n.read).length} não lidas
              </Text>
            </View>
          </View>

          <View style={styles.notificationsList}>
            {MOCK_NOTIFICATIONS.slice(0, 3).map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.read && styles.notificationItemUnread,
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.notificationDot} />
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {notification.time}
                  </Text>
                </View>
                <ChevronRight size={16} color="#B9C0CC" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E10',
  },
  // Hero
  heroContainer: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroOlá: {
    fontSize: 14,
    fontWeight: '400',
    color: '#B9C0CC',
    marginBottom: 6,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F5F7FB',
    letterSpacing: 0.3,
  },
  heroAvatarContainer: {
    position: 'relative',
    marginLeft: 16,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    paddingVertical: 24,
  },
  logo: {
    width: 200,
    height: 200,
  },
  heroAvatar: {
    shadowColor: '#9061F9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 100,
    gap: 24,
  },
  // Cards
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#17171B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitleIcon: {
    marginRight: 4,
  },
  cardCrownSmall: {
    marginLeft: -4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#F5F7FB',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#B9C0CC',
  },
  chevronContainer: {
    marginLeft: 8,
  },
  rankingPreview: {
    gap: 16,
  },
  rankingPosition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(144, 97, 249, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(144, 97, 249, 0.3)',
  },
  positionNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#9061F9',
  },
  positionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9061F9',
    marginLeft: 4,
  },
  rankingStats: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F5F7FB',
  },
  top3Preview: {
    gap: 10,
  },
  top3Item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  crownIcon: {
    marginRight: -2,
  },
  top3Avatar: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  top3Info: {
    flex: 1,
  },
  top3Name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F5F7FB',
    marginBottom: 2,
  },
  top3Score: {
    fontSize: 12,
    color: '#B9C0CC',
  },
  quizGroupsList: {
    gap: 0,
    marginTop: 8,
  },
  quizGroupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  quizGroupItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  quizGroupItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  groupBadgeMini: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBadgeMiniText: {
    fontSize: 18,
  },
  quizGroupItemInfo: {
    flex: 1,
  },
  quizGroupItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F5F7FB',
    marginBottom: 4,
  },
  quizGroupItemGroup: {
    fontSize: 12,
    color: '#B9C0CC',
  },
  quizGroupItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quizGroupItemTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF7A59',
  },
  activeIndicator: {
    marginLeft: 4,
  },
  groupsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  groupPreviewItem: {
    alignItems: 'center',
    gap: 8,
    width: '30%',
  },
  groupPreviewBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupPreviewBadgeText: {
    fontSize: 24,
  },
  groupPreviewName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F5F7FB',
    textAlign: 'center',
  },
  quizGroupStatusBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(144, 97, 249, 0.15)',
  },
  quizGroupStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notificationsList: {
    gap: 8,
    marginTop: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  notificationItemUnread: {
    backgroundColor: 'rgba(144, 97, 249, 0.1)',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9061F9',
    marginRight: 10,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F5F7FB',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#B9C0CC',
  },
});




