import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from "react-native";
import {
  Trophy,
  Clock3,
  Users2,
  ChevronRight,
  Crown,
  Bell,
  ListChecks,
} from "lucide-react-native";
import AvatarCircle from "../components/AvatarCircle";

/* ===============================
   Tokens de design (Lurdinha v2)
   =============================== */
const COLORS = {
  bg: "#0E0E10",
  card: "#17171B",
  text: "#F5F7FB",
  text2: "#B9C0CC",
  purple: "#9061F9",
  purpleHover: "#A78BFA",
  orange: "#FF7A59",
  border: "rgba(255,255,255,0.08)",
  glass: "rgba(255,255,255,0.04)",
};

/* ===============================
   Mocks (mantidos do seu exemplo)
   =============================== */
const MOCK_USER = {
  displayName: "Victor Almeida",
  photoURL: null,
  email: "victor@example.com",
};

const MOCK_QUIZ_GROUP_RANKING = {
  quizGroupTitle: "Família Silva",
  groupName: "Família",
  userPosition: 2,
  isActive: true,
  userData: { correct: 8, total: 10 },
  top3: [
    { userId: "1", name: "Maria Silva", correct: 10, total: 10, photoURL: null },
    { userId: "2", name: "Victor Almeida", correct: 8, total: 10, photoURL: null },
    { userId: "3", name: "João Santos", correct: 7, total: 10, photoURL: null },
  ],
  rankingType: "individual",
};

const MOCK_GROUP_RANKING = {
  groupName: "Família",
  userPosition: 3,
  userData: { totalCorrect: 25 },
  top3: [
    { userId: "1", name: "Maria Silva", totalCorrect: 32, photoURL: null },
    { userId: "2", name: "Pedro Costa", totalCorrect: 28, photoURL: null },
    { userId: "3", name: "Victor Almeida", totalCorrect: 25, photoURL: null },
  ],
};

const MOCK_ACTIVE_QUIZ_GROUPS = [
  {
    id: "1",
    title: "Quiz do Churrasco",
    groupName: "Amigos",
    groupColor: COLORS.purple,
    groupBadge: "🍖",
    endTime: new Date(Date.now() + 8 * 3600000),
  },
  {
    id: "2",
    title: "Festinha de Aniversário",
    groupName: "Família",
    groupColor: COLORS.orange,
    groupBadge: "🎉",
    endTime: new Date(Date.now() + 24 * 3600000),
  },
];

const MOCK_GROUPS = [
  { id: "1", name: "Família", color: COLORS.purple, badge: "👨‍👩‍👧‍👦" },
  { id: "2", name: "Amigos", color: COLORS.orange, badge: "👥" },
  { id: "3", name: "Trabalho", color: "#32D583", badge: "💼" },
];

const MOCK_NOTIFICATIONS = [
  { id: "1", message: 'Quiz "Família Silva" foi finalizado', time: "2h atrás", read: false },
  { id: "2", message: 'Novo quiz disponível no grupo "Amigos"', time: "5h atrás", read: false },
  { id: "3", message: "Você alcançou o Top 3!", time: "1d atrás", read: true },
];

/* ===============================
   Helpers
   =============================== */
const getTimeLeft = (endTime) => {
  const hoursLeft = Math.ceil((endTime.getTime() - Date.now()) / 3600000);
  return hoursLeft > 0 ? `${hoursLeft}h` : "Expirado";
};

const LeftStripCard = ({ color, children, style }) => (
  <View style={[styles.card, style]}>
    <View style={[styles.strip, { backgroundColor: color }]} />
    {children}
  </View>
);

const Badge = ({ children, tone = "orange" }) => {
  const bg =
    tone === "orange"
      ? "rgba(255,122,89,0.12)"
      : tone === "purple"
      ? "rgba(144,97,249,0.16)"
      : "rgba(255,255,255,0.08)";
  const fg = tone === "orange" ? COLORS.orange : tone === "purple" ? COLORS.purple : COLORS.text2;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{children}</Text>
    </View>
  );
};

/* ===============================
   Tela
   =============================== */
export default function HomeScreenRevamp({ navigation }) {
  const [pressedCard, setPressedCard] = useState(null);

  // animações de entrada
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.98))[0];
  const slideAnim = useState(new Animated.Value(20))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 96 }} 
      showsVerticalScrollIndicator={false}
    >
      <Animated.View 
        style={{ 
          opacity: fadeAnim, 
          transform: [{ scale: scaleAnim }, { translateY: slideAnim }] 
        }}
      >
        {/* Header com botão voltar */}
        {navigation && (
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <ChevronRight size={20} color="#F5F7FB" style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Preview Home (Revamp)</Text>
          </View>
        )}

        {/* HERO */}
        <View style={styles.hero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Olá,</Text>
            <Text style={styles.name}>{MOCK_USER.displayName} 👋</Text>
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.ctaPrimary} activeOpacity={0.9}>
                <Text style={styles.ctaPrimaryText}>Responder</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ctaOutline} activeOpacity={0.9}>
                <Text style={styles.ctaOutlineText}>Criar quiz</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.avatarWrap}>
            <AvatarCircle name={MOCK_USER.displayName} size={48} photoURL={MOCK_USER.photoURL} />
          </View>
        </View>

        {/* QUIZ EM ANDAMENTO */}
        <LeftStripCard color={COLORS.purple}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={() => setPressedCard("quiz")}
            onPressOut={() => setPressedCard(null)}
          >
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.headerRow}>
                  <Clock3 size={18} color={COLORS.text2} />
                  <Text style={styles.headerSmall}>1 grupo ativo</Text>
                </View>
                <Text style={styles.cardTitle}>Quiz em andamento</Text>
                <Text style={styles.cardSub}>Enquete do churras • grupo de testes</Text>
              </View>
              <Badge>24h</Badge>
            </View>

            <View style={{ marginTop: 8 }}>
              {MOCK_ACTIVE_QUIZ_GROUPS.map((q, i) => (
                <TouchableOpacity
                  key={q.id}
                  style={[styles.row, i < MOCK_ACTIVE_QUIZ_GROUPS.length - 1 && styles.rowDivider]}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.groupDot, { backgroundColor: q.groupColor }]}>
                      <Text style={{ fontSize: 18 }}>{q.groupBadge}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {q.title}
                      </Text>
                      <Text style={styles.rowSub}>{q.groupName}</Text>
                    </View>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={styles.timeText}>{getTimeLeft(q.endTime)}</Text>
                    <ListChecks size={14} color={COLORS.purple} />
                    <ChevronRight size={16} color={COLORS.text2} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <TouchableOpacity style={styles.ctaOutline} activeOpacity={0.9}>
                <Text style={styles.ctaOutlineText}>Ver detalhes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ctaPrimary} activeOpacity={0.9}>
                <Text style={styles.ctaPrimaryText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </LeftStripCard>

        {/* RANKINGS */}
        <LeftStripCard color={"rgba(208,213,221,0.3)"} style={{ marginTop: 16 }}>
          <TouchableOpacity activeOpacity={0.9}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.headerRow}>
                  <Trophy size={18} color={COLORS.text2} />
                  <Text style={styles.headerSmall}>Snapshot rápido</Text>
                </View>
                <Text style={styles.cardTitle}>Rankings</Text>
                <Text style={styles.cardSub}>Veja quem lidera no seu grupo</Text>
              </View>
              <ChevronRight size={18} color={COLORS.text2} />
            </View>

            {/* Top 3 (snapshot) */}
            <View style={{ marginTop: 8 }}>
              {MOCK_GROUP_RANKING.top3.map((m, idx) => (
                <View key={m.userId} style={[styles.row, idx < 2 && styles.rowDivider]}>
                  <View style={styles.rowLeft}>
                    {idx === 0 ? <Crown size={14} color={COLORS.purple} /> : <View style={{ width: 14 }} />}
                    <AvatarCircle name={m.name} size={28} photoURL={m.photoURL} />
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {m.name}
                    </Text>
                  </View>
                  <Text style={styles.rowSub}>✅ {m.totalCorrect ?? m.correct}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </LeftStripCard>

        {/* MEUS GRUPOS */}
        <LeftStripCard color={"#2E90FA"} style={{ marginTop: 16 }}>
          <TouchableOpacity activeOpacity={0.9}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.headerRow}>
                  <Users2 size={18} color={COLORS.text2} />
                  <Text style={styles.headerSmall}>
                    {MOCK_GROUPS.length} {MOCK_GROUPS.length === 1 ? "grupo" : "grupos"}
                  </Text>
                </View>
                <Text style={styles.cardTitle}>Meus Grupos</Text>
                <Text style={styles.cardSub}>Gerencie e crie novos</Text>
              </View>
              <ChevronRight size={18} color={COLORS.text2} />
            </View>

            <View style={styles.groupsPreview}>
              {MOCK_GROUPS.slice(0, 3).map((g) => (
                <View key={g.id} style={styles.groupPill}>
                  <View style={[styles.groupDotLg, { backgroundColor: g.color }]}>
                    <Text style={{ fontSize: 20 }}>{g.badge}</Text>
                  </View>
                  <Text style={styles.groupName} numberOfLines={1}>
                    {g.name}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </LeftStripCard>

        {/* NOTIFICAÇÕES */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerRow}>
                <Bell size={18} color={COLORS.text2} />
                <Text style={styles.headerSmall}>
                  {MOCK_NOTIFICATIONS.filter((n) => !n.read).length} não lidas
                </Text>
              </View>
              <Text style={styles.cardTitle}>Notificações</Text>
            </View>
          </View>

          {MOCK_NOTIFICATIONS.slice(0, 3).map((n, i) => (
            <TouchableOpacity 
              key={n.id} 
              style={[
                styles.notifRow, 
                !n.read && { backgroundColor: "rgba(144,97,249,0.10)" }, 
                i < 2 && styles.rowDivider
              ]} 
              activeOpacity={0.7}
            >
              <View style={[styles.dot, { backgroundColor: COLORS.purple }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.notifText}>{n.message}</Text>
                <Text style={styles.notifTime}>{n.time}</Text>
              </View>
              <ChevronRight size={16} color={COLORS.text2} />
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

/* ===============================
   Styles
   =============================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  hero: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  hello: { fontSize: 14, color: COLORS.text2, marginBottom: 4 },
  name: { fontSize: 26, fontWeight: "800", color: COLORS.text, letterSpacing: 0.3 },
  avatarWrap: { marginLeft: 8 },
  heroActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  ctaPrimary: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  ctaPrimaryText: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  ctaOutline: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  ctaOutlineText: { color: COLORS.text, fontWeight: "600", fontSize: 14 },

  contentPad: { paddingHorizontal: 16 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 16,
    position: 'relative',
  },
  strip: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 6,
    height: "100%",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerSmall: { fontSize: 12, color: COLORS.text2 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginTop: 6 },
  cardSub: { fontSize: 13, color: COLORS.text2, marginTop: 2 },

  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "700" },

  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.glass },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  groupDot: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  groupDotLg: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  rowSub: { fontSize: 12, color: COLORS.text2 },
  timeText: { fontSize: 13, fontWeight: "700", color: COLORS.orange },

  cardFooter: { marginTop: 8, flexDirection: "row", justifyContent: "flex-end", gap: 8 },

  groupsPreview: { flexDirection: "row", gap: 12, marginTop: 8 },
  groupPill: { alignItems: "center", width: "30%", gap: 8 },
  groupName: { fontSize: 12, color: COLORS.text, fontWeight: "600", textAlign: "center" },

  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  notifText: { fontSize: 14, color: COLORS.text, fontWeight: "500", marginBottom: 2 },
  notifTime: { fontSize: 12, color: COLORS.text2 },
});




