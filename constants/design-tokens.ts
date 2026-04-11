/**
 * NYXIS Design Token System
 * Centralized visual constants for the entire application.
 * All colors, spacing, typography, and style primitives live here.
 */

// ─── CORE PALETTE ──────────────────────────────────────────
export const COLORS = {
  // Neon Accents
  NEON_CYAN: '#00F0FF',
  NEON_RED: '#FF003C',
  NEON_PURPLE: '#9D4EDD',
  NEON_GREEN: '#00FFA3',
  NEON_GOLD: '#FFD700',
  NEON_BLOOD: '#8B0000',    // SYSTEM_COLLAPSE state

  // Backgrounds & Surfaces
  BG_VOID: '#020205',       // deepest background (auth, modals)
  BG_PRIMARY: '#06060C',    // main app background
  BG_SURFACE: '#0A0A10',    // cards on top of primary
  BG_ELEVATED: '#12121A',   // elevated panels, inputs
  BG_DANGER: '#1A0004',     // danger zone backgrounds

  // Borders & Dividers
  BORDER_DEFAULT: '#1E1E2E',
  BORDER_SUBTLE: '#2A2A3A',

  // Text
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#A1A1AA',
  TEXT_MUTED: '#4A4A6A',
  TEXT_DIM: '#6A6A8A',

  // Transparency helpers
  alpha: (hex: string, alpha: number): string => {
    const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return `${hex}${a}`;
  },
} as const;

// ─── QUEST TYPE COLORS ─────────────────────────────────────
export const QUEST_TYPE_COLORS: Record<string, string> = {
  DAILY: COLORS.NEON_CYAN,
  SIDE: COLORS.NEON_PURPLE,
  RANK_UP: COLORS.NEON_GOLD,
  EMERGENCY: COLORS.NEON_RED,
};

// ─── TYPOGRAPHY ─────────────────────────────────────────────
export const TYPOGRAPHY = {
  MONO: 'monospace',
  WEIGHT: {
    NORMAL: '600' as const,
    BOLD: '700' as const,
    HEAVY: '800' as const,
    BLACK: '900' as const,
  },
  SIZE: {
    MICRO: 8,
    TINY: 9,
    SMALL: 10,
    BODY: 12,
    MEDIUM: 13,
    LARGE: 14,
    HEADING: 16,
    DISPLAY: 24,
    HERO: 32,
    MEGA: 64,
    ULTRA: 72,
  },
  SPACING: {
    TIGHT: 1,
    NORMAL: 2,
    WIDE: 3,
    ULTRA: 4,
    DISPLAY: 5,
    MEGA: 10,
  },
} as const;

// ─── SPACING ────────────────────────────────────────────────
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 30,
  XXXL: 40,
  HEADER_TOP: 50,
} as const;

// ─── ANIMATION DURATIONS ───────────────────────────────────
export const ANIMATION = {
  FAST: 400,
  NORMAL: 800,
  SLOW: 1200,
  SLOWER: 1500,
  SLOWEST: 2000,
} as const;
