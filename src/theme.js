/**
 * 🎮 Lurdinha App — Product Design Operating System Theme
 *
 * Premium Dark Social Game System
 * Emotional Design + Social Density + Cinematic UI
 *
 * Principles:
 * • Dark atmospheric UI
 * • Social-first interactions
 * • Emotional feedback loops
 * • Premium mobile game polish
 * • Cinematic depth
 * • High contrast hierarchy
 *
 * DO NOT:
 * • Use hardcoded colors
 * • Create flat gray layouts
 * • Build generic SaaS components
 * • Overuse neon glow
 *
 * Use:
 * import { colors, spacing, typography, motion } from '../theme';
 */

// ────────────────────────────────────────────────────────────
// 🎨 COLOR SYSTEM
// ────────────────────────────────────────────────────────────

export const colors = {
    // ─── PRIMARY BRAND ─────────────────────────────────────
    primary: '#8B5CF6',
    primaryLight: '#A78BFA',
    primaryDark: '#7C3AED',
    deepPurple: '#2A1748',

    // ─── CORE SURFACES ─────────────────────────────────────
    background: '#08080C',
    backgroundAlt: '#111111',
    backgroundSecondary: '#111116',
    backgroundElevated: '#181821',

    surface: '#1E1B2A',
    surfaceDark: '#0D0D0D',
    surfaceSecondary: '#17171B',
    surfaceElevated: '#22202C',
    surfaceGlass: 'rgba(30, 27, 42, 0.82)',
    surfaceAlt: '#17171B',
    surfaceLight: '#22202C',

    // ─── BORDERS ───────────────────────────────────────────
    border: '#2E2938',
    borderSoft: 'rgba(255,255,255,0.06)',
    borderStrong: 'rgba(139,92,246,0.28)',

    // ─── TEXT ──────────────────────────────────────────────
    textPrimary: '#FFFFFF',
    textSecondary: '#B8B5C4',
    textMuted: '#7D7989',
    textDim: '#5F5B6B',
    textLight: '#FFFFFF',
    textAlt: '#A1A1AA',

    // ─── ACCENTS ───────────────────────────────────────────
    orange: '#FF6B35',
    orangeAccent: '#FF6B35',
    pink: '#E91E63',
    gold: '#FFC107',

    // ─── FEEDBACK ──────────────────────────────────────────
    success: '#4ADE80',
    warning: '#FFC107',
    error: '#F44336',
    danger: '#F44336',
    info: '#38BDF8',

    // ─── SOCIAL / GAMEPLAY STATES ──────────────────────────
    online: '#4ADE80',
    activeVote: '#8B5CF6',
    revealGlow: '#C4B5FD',
    streak: '#FF6B35',
    crown: '#FFC107',

    // ─── OVERLAYS / ATMOSPHERE ─────────────────────────────
    overlayDark: 'rgba(8,8,12,0.72)',
    overlayStrong: 'rgba(0,0,0,0.82)',
    glassOverlay: 'rgba(255,255,255,0.04)',

    // ─── PRIMARY ALPHAS ────────────────────────────────────
    primaryAlpha: (opacity) => `rgba(139, 92, 246, ${opacity})`,

    primaryAlpha04: 'rgba(139,92,246,0.04)',
    primaryAlpha08: 'rgba(139,92,246,0.08)',
    primaryAlpha12: 'rgba(139,92,246,0.12)',
    primaryAlpha15: 'rgba(139,92,246,0.15)',
    primaryAlpha16: 'rgba(139,92,246,0.16)',
    primaryAlpha20: 'rgba(139,92,246,0.20)',
    primaryAlpha25: 'rgba(139,92,246,0.25)',
    primaryAlpha30: 'rgba(139,92,246,0.30)',
    primaryMuted: '#A78BFA',
    primaryMutedHex: '#9061F9',

    // ─── WHITE ALPHAS ──────────────────────────────────────
    whiteAlpha04: 'rgba(255,255,255,0.04)',
    whiteAlpha08: 'rgba(255,255,255,0.08)',
    whiteAlpha10: 'rgba(255,255,255,0.10)',
    whiteAlpha12: 'rgba(255,255,255,0.12)',
    whiteAlpha20: 'rgba(255,255,255,0.20)',
    whiteAlpha50: 'rgba(255,255,255,0.50)',

    // ─── GRADIENT TOKENS ───────────────────────────────────
    gradients: {
        primary: ['#7C3AED', '#8B5CF6'],
        premium: ['#2A1748', '#8B5CF6'],
        reward: ['#FF6B35', '#FFC107'],
        dark: ['#08080C', '#111116'],
        elevated: ['#181821', '#1E1B2A'],
        reveal: ['#8B5CF6', '#C4B5FD'],
    },
};

// ────────────────────────────────────────────────────────────
// 📏 SPACING SYSTEM
// ────────────────────────────────────────────────────────────

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    section: 40,
    screen: 48,
};

// ────────────────────────────────────────────────────────────
// 🔠 TYPOGRAPHY SYSTEM
// ────────────────────────────────────────────────────────────

export const typography = {
    sizes: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 20,
        title: 24,
        hero: 32,
        display: 40,
    },

    weights: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
    },

    // ─── INTER — UI / BODY ─────────────────────────────────
    fonts: {
        regular: 'Inter_400Regular',
        medium: 'Inter_500Medium',
        semibold: 'Inter_600SemiBold',
        bold: 'Inter_700Bold',
        extrabold: 'Inter_800ExtraBold',
    },

    // ─── POPPINS — HEADINGS / HERO ─────────────────────────
    headingFonts: {
        semibold: 'Poppins_600SemiBold',
        bold: 'Poppins_700Bold',
        extrabold: 'Poppins_800ExtraBold',
    },
};

export const fontStyles = {
    // ─── BODY ───────────────────────────────────────────────
    regular: {
        fontFamily: typography.fonts.regular,
        fontWeight: '400',
    },

    medium: {
        fontFamily: typography.fonts.medium,
        fontWeight: '500',
    },

    semibold: {
        fontFamily: typography.fonts.semibold,
        fontWeight: '600',
    },

    bold: {
        fontFamily: typography.fonts.bold,
        fontWeight: '700',
    },

    extrabold: {
        fontFamily: typography.fonts.extrabold,
        fontWeight: '800',
    },

    // ─── HEADINGS ──────────────────────────────────────────
    headingSemibold: {
        fontFamily: typography.headingFonts.semibold,
        fontWeight: '600',
    },

    headingBold: {
        fontFamily: typography.headingFonts.bold,
        fontWeight: '700',
    },

    headingExtrabold: {
        fontFamily: typography.headingFonts.extrabold,
        fontWeight: '800',
    },
};

// ────────────────────────────────────────────────────────────
// 🔲 BORDER RADIUS SYSTEM
// ────────────────────────────────────────────────────────────

export const borderRadius = {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    card: 28,
    modal: 36,
    full: 999,
};

// ────────────────────────────────────────────────────────────
// 🌑 SHADOW / DEPTH SYSTEM
// ────────────────────────────────────────────────────────────

export const shadows = {
    // ─── PRIMARY GLOW ──────────────────────────────────────
    primaryGlow: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 18,
        elevation: 14,
    },

    // ─── CARD DEPTH ────────────────────────────────────────
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
        elevation: 8,
    },

    // ─── ELEVATED PANEL ────────────────────────────────────
    elevated: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.34,
        shadowRadius: 22,
        elevation: 18,
    },

    // ─── SOFT ──────────────────────────────────────────────
    subtle: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.14,
        shadowRadius: 6,
        elevation: 3,
    },
};

// ────────────────────────────────────────────────────────────
// ⚡ MOTION TOKENS
// ────────────────────────────────────────────────────────────

export const motion = {
    duration: {
        fast: 120,
        normal: 220,
        smooth: 320,
        slow: 450,
    },

    scale: {
        pressed: 0.97,
        hover: 1.02,
        reveal: 1.04,
    },

    spring: {
        damping: 14,
        stiffness: 180,
    },
};

// ────────────────────────────────────────────────────────────
// 🎮 GAMEPLAY TOKENS
// ────────────────────────────────────────────────────────────

export const gameplay = {
    timer: {
        urgent: colors.orange,
        active: colors.primary,
        background: colors.surfaceElevated,
    },

    ranking: {
        first: colors.gold,
        second: '#C0C0C0',
        third: '#CD7F32',
    },

    reveal: {
        glow: colors.revealGlow,
        background: colors.primaryAlpha16,
    },
};

// ────────────────────────────────────────────────────────────
// 👤 AVATAR COLORS
// ────────────────────────────────────────────────────────────

export const avatarColors = [
    '#8B5CF6',
    '#A78BFA',
    '#FF6B35',
    '#E91E63',
    '#38BDF8',
    '#4ADE80',
    '#FFC107',
    '#C084FC',
    '#F472B6',
    '#FB7185',
];

// ────────────────────────────────────────────────────────────
// 📦 EXPORT DEFAULT
// ────────────────────────────────────────────────────────────

export default {
    colors,
    spacing,
    typography,
    fontStyles,
    borderRadius,
    shadows,
    motion,
    gameplay,
    avatarColors,
};
