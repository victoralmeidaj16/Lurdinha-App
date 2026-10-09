import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

// Landing page shown on the web build in place of the mobile onboarding slides.
const APP_STORE_URL = 'https://apps.apple.com/br/app/lurdinha/id6755250969';
const MAX_WIDTH = 1120;

const STEPS = [
  {
    n: '1',
    title: 'Monta a turma',
    body: 'Cria um grupo com amigos, família ou o pessoal do trampo e chama todo mundo com um código.',
  },
  {
    n: '2',
    title: 'Todo mundo palpita',
    body: '“Que camisa o chefe vai usar amanhã?” Cada um vota no que acha que vai acontecer.',
  },
  {
    n: '3',
    title: 'A vida responde',
    body: 'Quando a situação acontece, a resposta é revelada e o ranking do grupo se atualiza.',
  },
];

const MODES = [
  {
    title: 'Lurdinha',
    body: 'O quiz de previsão social. Quem lê melhor a turma leva a coroa.',
    image: require('../../assets/web/lurdinha_card.jpg'),
    accent: colors.primary,
  },
  {
    title: 'Impostor',
    body: 'Um de vocês não sabe a palavra secreta. Descubram quem é antes que ele se safe.',
    image: require('../../assets/web/impostor_card.jpg'),
    accent: colors.primaryLight,
  },
  {
    title: 'Desenho',
    body: 'Rabisca rápido, adivinha mais rápido ainda. O caos é garantido.',
    image: require('../../assets/web/draw_card.jpg'),
    accent: colors.orange,
  },
];

function Button({ label, onPress, variant = 'primary', style }) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ hovered, pressed }) => [
        styles.button,
        isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
        hovered && (isPrimary ? styles.buttonPrimaryHover : styles.buttonSecondaryHover),
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      <Text style={[styles.buttonText, !isPrimary && styles.buttonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

export default function LandingScreen({ onFinish }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 860;
  const gutter = isWide ? 40 : 20;
  const contentWidth = Math.min(width, MAX_WIDTH) - gutter * 2;
  // Explicit pixel size: aspectRatio is unreliable for images on react-native-web.
  const modeImageSize = isWide ? (contentWidth - 32) / 3 : contentWidth;

  const openSignup = () => onFinish({ isLogin: false });
  const openLogin = () => onFinish({ isLogin: true });
  const openAppStore = () => Linking.openURL(APP_STORE_URL);

  const section = [styles.section, { paddingHorizontal: gutter }];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Nav */}
      <View style={section}>
        <View style={styles.nav}>
          <View style={styles.brand}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brandName}>Lurdinha</Text>
          </View>
          <Button label="Entrar" variant="secondary" onPress={openLogin} style={styles.navButton} />
        </View>
      </View>

      {/* Hero */}
      <View style={[section, { paddingTop: isWide ? 72 : 40 }]}>
        <View style={styles.glow} pointerEvents="none" />
        <Text style={styles.eyebrow}>JOGOS SOCIAIS PARA JOGAR EM GRUPO</Text>
        <Text style={[styles.heroTitle, { fontSize: isWide ? 68 : 42, lineHeight: isWide ? 74 : 48 }]}>
          Quem conhece{'\n'}
          <Text style={styles.heroTitleAccent}>melhor a sua turma?</Text>
        </Text>
        <Text style={[styles.heroSub, { fontSize: isWide ? 20 : 17 }]}>
          Palpites sobre o que seus amigos vão fazer, rankings que nunca acabam e salas ao vivo
          com Impostor e Desenho. Tudo no celular, tudo em grupo.
        </Text>
        <View style={[styles.ctaRow, !isWide && styles.ctaColumn]}>
          <Button label="Criar conta grátis" onPress={openSignup} />
          <Button label="Baixar na App Store" variant="secondary" onPress={openAppStore} />
        </View>

        <View style={[styles.heroImageWrap, { marginTop: isWide ? 64 : 40 }]}>
          <Image
            source={isWide ? require('../../assets/web/hero.jpg') : require('../../assets/web/hero_mobile.jpg')}
            style={[styles.heroImage, { aspectRatio: isWide ? 1920 / 426 : 1040 / 426 }]}
            resizeMode="cover"
            accessibilityLabel="Amigos rindo enquanto jogam Lurdinha no celular"
          />
        </View>
      </View>

      {/* How it works */}
      <View style={[section, styles.block]}>
        <Text style={styles.sectionLabel}>COMO FUNCIONA</Text>
        <Text style={[styles.sectionTitle, { fontSize: isWide ? 40 : 30 }]}>
          Não é trivia. É saber como a sua turma pensa.
        </Text>
        <View style={[styles.grid, isWide && styles.gridRow]}>
          {STEPS.map((step) => (
            <View key={step.n} style={[styles.card, isWide && styles.gridItem]}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{step.n}</Text>
              </View>
              <Text style={styles.cardTitle}>{step.title}</Text>
              <Text style={styles.cardBody}>{step.body}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Game modes */}
      <View style={[section, styles.block]}>
        <Text style={styles.sectionLabel}>MODOS DE JOGO</Text>
        <Text style={[styles.sectionTitle, { fontSize: isWide ? 40 : 30 }]}>
          Uma sala, várias rodadas, zero tédio.
        </Text>
        <View style={[styles.grid, isWide && styles.gridRow]}>
          {MODES.map((mode) => (
            <View key={mode.title} style={[styles.modeCard, isWide && styles.gridItem]}>
              <Image
                source={mode.image}
                style={{ width: modeImageSize, height: modeImageSize }}
                resizeMode="cover"
              />
              <View style={styles.modeText}>
                <View style={[styles.modeDot, { backgroundColor: mode.accent }]} />
                <Text style={styles.cardTitle}>{mode.title}</Text>
                <Text style={styles.cardBody}>{mode.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Final CTA */}
      <View style={[section, styles.block]}>
        <LinearGradient
          colors={['#2A1748', '#120A20']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.finalCta, { padding: isWide ? 56 : 28 }]}
        >
          <Text style={[styles.finalTitle, { fontSize: isWide ? 44 : 30 }]}>Seu grupo vai te chamar.</Text>
          <Text style={styles.finalSub}>Cria sua conta grátis e entra na próxima rodada.</Text>
          <View style={[styles.ctaRow, !isWide && styles.ctaColumn, { justifyContent: 'center' }]}>
            <Button label="Começar agora" onPress={openSignup} />
            <Button label="Já tenho conta" variant="secondary" onPress={openLogin} />
          </View>
        </LinearGradient>
      </View>

      {/* Footer */}
      <View style={section}>
        <View style={[styles.footer, !isWide && styles.footerColumn]}>
          <Text style={styles.footerText}>© {new Date().getFullYear()} Lurdinha</Text>
          <Pressable onPress={openAppStore}>
            <Text style={styles.footerLink}>Disponível na App Store</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  section: {
    width: '100%',
    maxWidth: MAX_WIDTH,
  },
  block: {
    paddingTop: 96,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 34,
    height: 38,
  },
  brandName: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 22,
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  glow: {
    position: 'absolute',
    top: -80,
    left: -120,
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: 'rgba(139,92,246,0.18)',
    filter: 'blur(90px)',
  },
  eyebrow: {
    color: colors.primaryLight,
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    letterSpacing: 1.6,
    marginBottom: 20,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: -1.5,
  },
  heroTitleAccent: {
    color: colors.primary,
  },
  heroSub: {
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    lineHeight: 30,
    maxWidth: 620,
    marginTop: 24,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 36,
  },
  ctaColumn: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  button: {
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    transitionDuration: '150ms',
    transitionProperty: 'background-color, border-color, transform',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonPrimaryHover: {
    backgroundColor: colors.primaryDark,
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  buttonSecondaryHover: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.28)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  buttonTextSecondary: {
    color: colors.textPrimary,
  },
  heroImageWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  heroImage: {
    width: '100%',
  },
  sectionLabel: {
    color: colors.orange,
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    letterSpacing: 1.6,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.8,
    maxWidth: 640,
  },
  grid: {
    gap: 16,
    marginTop: 40,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridItem: {
    flex: 1,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: 28,
  },
  stepBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139,92,246,0.16)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepBadgeText: {
    color: colors.primaryLight,
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    marginBottom: 8,
  },
  cardBody: {
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 23,
  },
  modeCard: {
    backgroundColor: '#000000',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
  },
  modeText: {
    padding: 24,
    paddingTop: 0,
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  finalCta: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
  },
  finalTitle: {
    color: colors.textPrimary,
    fontFamily: 'Poppins_800ExtraBold',
    textAlign: 'center',
    letterSpacing: -1,
  },
  finalSub: {
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    textAlign: 'center',
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 64,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  footerColumn: {
    flexDirection: 'column',
    gap: 8,
  },
  footerText: {
    color: colors.textMuted,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  footerLink: {
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
});
