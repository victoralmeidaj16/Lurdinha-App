/**
 * 🎨 Lurdinha App - Design System / Theme
 * 
 * Arquivo centralizado de cores, tipografia e espaçamentos.
 * Importe daqui em vez de usar cores hardcoded nos componentes.
 * 
 * Uso: import { colors, spacing, typography } from '../theme';
 */

// ─── CORES ────────────────────────────────────────────────

export const colors = {
    // Primárias (Roxo / Violet)
    primary: '#8b5cf6',        // Cor principal (Violet-500) — botões, CTAs, destaques
    primaryLight: '#a78bfa',   // Violet-400 — estados hover/leve
    primaryDark: '#7c3aed',    // Violet-600 — estados pressed/escuro
    primaryMuted: '#9061F9',   // Roxo suave — ícones da tab bar, badges

    // Accent canônico (brand doc)
    orangeAccent: '#FF6B35',   // Laranja oficial — badges, urgência, troféus

    // Superfícies / Fundos
    background: '#0D0D0D',     // Fundo principal do app
    backgroundAlt: '#111111',  // Preto secundário
    backgroundElevated: '#151515', // Preto elevado
    surface: '#161616',        // Card base
    surfaceLight: '#1C1C1C',   // Card elevado
    // Borders
    border: 'rgba(255, 255, 255, 0.1)',    // Default subtle border color
    surfaceBorder: 'rgba(255, 255, 255, 0.08)', // Bordas sutis

    // Aliases for convenience
    danger: '#F44336',             // Alias for error color (backwards compat)

    // Texto
    textPrimary: '#ffffff',    // Texto principal
    textSecondary: '#d1d5db',  // Texto secundário (Gray-300)
    textMuted: '#9ca3af',      // Texto desabilitado/auxiliar (Gray-400)
    textDim: '#71717a',        // Placeholders, hints (Zinc-500)

    // Estados / Feedback
    success: '#4CAF50',        // Verde — sucesso, ativo
    error: '#F44336',          // Vermelho — erro, destrutivo
    warning: '#FFC107',        // Amarelo — aviso
    info: '#2196F3',           // Azul — informação

    // Accent / Destaques
    orange: '#FF6B35',         // Laranja — badges, destaques secundários
    pink: '#E91E63',           // Rosa — notificações, badges especiais

    // Transparências do Primary (para backgrounds sutis)
    primaryAlpha: (opacity) => `rgba(139, 92, 246, ${opacity})`,
    // Atalhos comuns
    primaryAlpha08: 'rgba(139, 92, 246, 0.08)',
    primaryAlpha12: 'rgba(139, 92, 246, 0.12)',
    primaryAlpha15: 'rgba(139, 92, 246, 0.15)',
    primaryAlpha20: 'rgba(139, 92, 246, 0.2)',
    primaryAlpha30: 'rgba(139, 92, 246, 0.3)',

    // Branco com alpha (para overlays, bordas)
    whiteAlpha10: 'rgba(255, 255, 255, 0.1)',
    whiteAlpha20: 'rgba(255, 255, 255, 0.2)',
    whiteAlpha50: 'rgba(255, 255, 255, 0.5)',

    // ─── Tokens semânticos (novos) ─────────────────────────
    // Eliminar hardcodes comuns de HomeScreen / GroupDetailScreen
    textLight: '#F5F7FB',          // Texto principal claro (ex-hardcode #F5F7FB)
    textAlt: '#B9C0CC',            // Texto secundário alternativo (ex-hardcode #B9C0CC)
    surfaceAlt: '#17171B',         // Cards alternativos (ex-hardcode #17171B)
    surfaceDark: '#0D0D0D',        // Fundo escuro
    primaryMutedHex: '#9061F9',    // Hex plano do primaryMuted para gradientes e bordas
};

// ─── ESPAÇAMENTOS ──────────────────────────────────────────

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

// ─── TIPOGRAFIA ────────────────────────────────────────────

export const typography = {
    // Tamanhos
    sizes: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 20,
        title: 24,
        hero: 28,
        display: 32,
    },
    // Pesos
    weights: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
    },
    // Inter — corpo e UI
    fonts: {
        regular: 'Inter_400Regular',
        medium: 'Inter_500Medium',
        semibold: 'Inter_600SemiBold',
        bold: 'Inter_700Bold',
        extrabold: 'Inter_800ExtraBold',
    },
    // Poppins — headings (brand doc: "Headings: Poppins")
    headingFonts: {
        semibold: 'Poppins_600SemiBold',
        bold: 'Poppins_700Bold',
        extrabold: 'Poppins_800ExtraBold',
    },
};

export const fontStyles = {
    // Inter — corpo e UI
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
    // Poppins — headings
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

// ─── BORDAS / RAIOS ────────────────────────────────────────

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 999,
};

// ─── SOMBRAS ───────────────────────────────────────────────

export const shadows = {
    primary: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    subtle: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
};

// ─── PALETA DE AVATARES ────────────────────────────────────

export const avatarColors = [
    colors.primary,
    colors.orange,
    colors.success,
    colors.info,
    colors.error,
    colors.warning,
    colors.pink,
    '#9C27B0',
    '#00BCD4',
    '#795548',
];

// Export default para conveniência
export default {
    colors,
    spacing,
    typography,
    fontStyles,
    borderRadius,
    shadows,
    avatarColors,
};
