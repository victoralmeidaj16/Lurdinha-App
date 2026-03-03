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

    // Superfícies / Fundos
    background: '#000000',     // Fundo principal do app
    surface: '#111111',        // Cards, containers
    surfaceLight: '#1a1a2e',   // Cards elevados
    surfaceBorder: 'rgba(255, 255, 255, 0.08)', // Bordas sutis

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
    borderRadius,
    shadows,
    avatarColors,
};
