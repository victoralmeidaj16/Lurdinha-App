import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { ChevronRight } from "lucide-react-native";
import AvatarCircle from "../components/AvatarCircle";

// === Lurdinha tokens
const TOKENS = {
  bgPage: "#0E0E10",
  cardBg: "#17171B",
  rim: "rgba(255,255,255,0.05)",
  sheenFrom: "rgba(255,255,255,0.10)",
  text: "#F5F7FB",
  text2: "#B9C0CC",
  purple: "#9061F9",
  orange: "#FF7A59",
  radius: 24,
};

const MOCK_USER = {
  displayName: "Você",
  photoURL: null,
  emoji: "🧓🏻",
};

function Rim({ style }) {
  return (
    <View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: TOKENS.radius,
          borderWidth: 1,
          borderColor: TOKENS.rim,
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

function TopSheen({ style }) {
  return (
    <View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 80,
          borderTopLeftRadius: TOKENS.radius,
          borderTopRightRadius: TOKENS.radius,
          backgroundColor: TOKENS.sheenFrom,
          opacity: 0.6,
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

function BottomVignette({ style }) {
  return (
    <View
      style={[
        {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 128,
          borderBottomLeftRadius: TOKENS.radius,
          borderBottomRightRadius: TOKENS.radius,
          backgroundColor: "#000000",
          opacity: 0.5,
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

function TinyDots({ style }) {
  return (
    <View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
        style,
      ]}
      pointerEvents="none"
    >
      <View
        style={{
          position: "absolute",
          bottom: 64,
          right: 40,
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: "rgba(255,255,255,0.5)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 96,
          right: 80,
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: "rgba(255,255,255,0.3)",
        }}
      />
    </View>
  );
}

function CTA({ label = "Abrir", color = "purple", onPress, style }) {
  const isPurple = color === "purple";
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          borderRadius: 999,
          paddingHorizontal: 16,
          paddingVertical: 8,
          backgroundColor: isPurple ? TOKENS.purple : "rgba(255,255,255,0.06)",
          borderWidth: isPurple ? 0 : 1,
          borderColor: "rgba(255,255,255,0.1)",
          shadowColor: isPurple ? TOKENS.purple : "transparent",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isPurple ? 0.3 : 0,
          shadowRadius: 24,
          elevation: isPurple ? 8 : 0,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: "rgba(255,255,255,0.9)",
        }}
      />
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: "#FFFFFF",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function CornerEmoji({ emoji = "🧩", style }) {
  return (
    <View
      style={[
        {
          position: "absolute",
          bottom: -24,
          right: -16,
          width: 160,
          height: 160,
          borderRadius: 80,
          overflow: "hidden",
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.45,
          shadowRadius: 40,
          elevation: 12,
          backgroundColor: TOKENS.cardBg,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 64, lineHeight: 64 }}>{emoji}</Text>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(255,255,255,0.08)",
          borderRadius: 80,
        }}
      />
    </View>
  );
}

function PurpleGradient({ style }) {
  return (
    <View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: TOKENS.radius,
          backgroundColor: "rgba(144, 97, 249, 0.1)",
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

function PurpleGlow({ style }) {
  return (
    <>
      {/* Glow principal */}
      <View
        style={[
          {
            position: "absolute",
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: "rgba(144, 97, 249, 0.25)",
          },
          style,
        ]}
        pointerEvents="none"
      />
      {/* Glow secundário mais suave */}
      <View
        style={[
          {
            position: "absolute",
            top: -40,
            right: -40,
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: "rgba(144, 97, 249, 0.15)",
          },
          style,
        ]}
        pointerEvents="none"
      />
    </>
  );
}

function PurpleAccent({ style }) {
  return (
    <View
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          width: 4,
          height: "100%",
          borderTopLeftRadius: TOKENS.radius,
          borderBottomLeftRadius: TOKENS.radius,
          backgroundColor: TOKENS.purple,
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

function LurdinhaCard({
  title,
  subtitle,
  ctaLabel = "Abrir",
  ctaColor = "purple",
  emoji = "🧩",
  right,
  onPress,
  style,
}) {
  const hasPurple = ctaColor === "purple";
  
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      style={[
        {
          position: "relative",
          overflow: "hidden",
          borderRadius: TOKENS.radius,
          padding: 20,
          backgroundColor: TOKENS.cardBg,
          shadowColor: hasPurple ? TOKENS.purple : "#000000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: hasPurple ? 0.4 : 0.35,
          shadowRadius: 30,
          elevation: 10,
          width: Dimensions.get("window").width * 0.85,
        },
        style,
      ]}
    >
      {hasPurple && <PurpleGradient />}
      {hasPurple && <PurpleGlow />}
      {hasPurple && <PurpleAccent />}
      <TopSheen />
      <BottomVignette />
      <Rim />
      <TinyDots />

      <View style={{ position: "relative", zIndex: 10 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                lineHeight: 28,
                letterSpacing: -0.01,
                color: TOKENS.text,
                marginBottom: 8,
              }}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: 24,
                }}
              >
                {subtitle}
              </Text>
            )}
            <View>
              <CTA label={ctaLabel} color={ctaColor} />
            </View>
          </View>
          {right && <View>{right}</View>}
        </View>
      </View>

      <CornerEmoji emoji={emoji} />
    </TouchableOpacity>
  );
}

function Pill({ children, style }) {
  return (
    <View
      style={[
        {
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.1)",
          paddingHorizontal: 8,
          paddingVertical: 4,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>
        {children}
      </Text>
    </View>
  );
}

export default function HomeLurdinhaCards({ navigation }) {
  const [unread] = useState(2);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Glow de fundo */}
      <View style={styles.backgroundGlow} />

      <View style={styles.wrapper}>
        {/* Header com botão voltar */}
        {navigation && (
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <ChevronRight
                size={20}
                color="#F5F7FB"
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cards Lurdinha</Text>
          </View>
        )}

        {/* Hero compacto */}
        <View style={styles.hero}>
          <View>
            <Text style={styles.hello}>Olá,</Text>
            <Text style={styles.name}>{MOCK_USER.displayName} 👋</Text>
          </View>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarEmoji}>{MOCK_USER.emoji}</Text>
            </View>
          </View>
        </View>

        {/* Cards principais - Scroll Horizontal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Principais</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
            style={styles.horizontalScrollContainer}
          >
            <LurdinhaCard
              title={"Responder\nagora"}
              subtitle={"Fila inteligente do seu grupo"}
              ctaLabel="Responder"
              ctaColor="purple"
              emoji="🗳️"
              right={<Pill>1 toque</Pill>}
              style={styles.cardMargin}
            />

            <LurdinhaCard
              title={"Criar quiz\nrápido"}
              subtitle={"Sim/Não em 10s, título auto"}
              ctaLabel="Criar"
              ctaColor="purple"
              emoji="✨"
              right={<Pill>Sim/Não</Pill>}
              style={styles.cardMargin}
            />

            <LurdinhaCard
              title={"Rankings\ndo grupo"}
              subtitle={"Veja o pódio e seus acertos"}
              ctaLabel="Ver ranking"
              ctaColor="purple"
              emoji="🏆"
              right={<Pill>Top 3</Pill>}
              style={styles.cardMargin}
            />

            <LurdinhaCard
              title={"Meus\nGrupos"}
              subtitle={"Entrar, criar e gerenciar"}
              ctaLabel="Abrir grupos"
              ctaColor="purple"
              emoji="👥"
              right={<Pill>3 grupos</Pill>}
              style={styles.cardMargin}
            />
          </ScrollView>
        </View>

        {/* Cards secundários - Scroll Horizontal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mais Opções</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
            style={styles.horizontalScrollContainer}
          >
            <LurdinhaCard
              title={"Resultados\nrecentes"}
              subtitle={"Resumo divertido da Lurdinha"}
              ctaLabel="Ver"
              ctaColor="glass"
              emoji="📊"
              right={<Pill>2 novos</Pill>}
              style={styles.cardMargin}
            />

            <LurdinhaCard
              title={"Notificações"}
              subtitle={`${unread} não lidas`}
              ctaLabel="Abrir"
              ctaColor="glass"
              emoji="🔔"
              right={<Pill>{unread}</Pill>}
              style={styles.cardMargin}
            />
          </ScrollView>
        </View>

        {/* Rodapé sutil */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Home com cards 2x2 no estilo pedido, mantendo a paleta e linguagem
            Lurdinha.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.bgPage,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  backgroundGlow: {
    position: "absolute",
    left: "50%",
    top: -120,
    width: 520,
    height: 260,
    marginLeft: -260,
    borderRadius: 260,
    backgroundColor: "rgba(255,255,255,0.12)",
    opacity: 0.3,
  },
  wrapper: {
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
    padding: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TOKENS.cardBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: TOKENS.rim,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TOKENS.text,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  hello: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: TOKENS.text,
    marginTop: 4,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 18,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TOKENS.text,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  horizontalScrollContainer: {
    marginHorizontal: -20,
  },
  horizontalScroll: {
    paddingHorizontal: 20,
    paddingRight: 20,
  },
  cardMargin: {
    marginRight: 16,
  },
  footer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
});

