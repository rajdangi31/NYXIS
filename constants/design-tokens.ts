/**
 * NYXIS visual tokens — reference mockup (dark glass, neon accents, no white frost).
 */

import { Platform } from 'react-native';

const VOID_RGB = '0, 0, 0';
const GLASS_RGB = '45, 47, 51';

export const COLORS = {
  BACKGROUND: '#000000',
  FOREGROUND: '#FFFFFF',

  SURFACE: '#141313',
  SURFACE_2: '#201F1F',
  BORDER: '#2A2A2A',
  BORDER_STRONG: '#3A3A3A',
  MUTED: '#1A1A1A',
  MUTED_FOREGROUND: '#A0A0A0',

  PRIMARY: '#00DBE9',
  PRIMARY_FOREGROUND: '#000000',

  NEON_CYAN: '#00DBE9',
  NEON_CYAN_SOFT: 'rgba(0, 219, 233, 0.14)',
  NEON_MAGENTA: '#FF2BD6',
  NEON_MAGENTA_SOFT: 'rgba(255, 43, 214, 0.14)',
  NEON_GOLD: '#FFB800',
  NEON_GOLD_SOFT: 'rgba(255, 184, 0, 0.14)',
  NEON_GREEN: '#3DDC97',
  NEON_RED: '#FF4D6A',
  NEON_PURPLE: '#B84DFF',
  NEON_BLOOD: '#FF4D6A',

  BG_VOID: '#000000',
  BG_PRIMARY: '#000000',
  BG_SURFACE: '#0A0A0A',
  BG_ELEVATED: 'rgba(0, 251, 255, 0.06)',
  BG_DANGER: 'rgba(255, 77, 106, 0.08)',

  /**
   * Thin tint only — BlurView / backdrop-filter carries the frost.
   * Do NOT stack heavy fills on top of blur (that kills transparency).
   */
  GLASS_FILL: `rgba(${GLASS_RGB}, 0.22)`,
  GLASS_FILL_STRONG: `rgba(${GLASS_RGB}, 0.32)`,
  GLASS_FILL_SUBTLE: `rgba(${GLASS_RGB}, 0.16)`,
  GLASS_FILL_BAR: `rgba(32, 31, 31, 0.42)`,

  BORDER_DEFAULT: 'rgba(255, 255, 255, 0.06)',
  BORDER_SUBTLE: 'rgba(255, 255, 255, 0.04)',
  BORDER_ACCENT_CYAN: 'rgba(0, 219, 233, 0.22)',
  BORDER_ACCENT_MAGENTA: 'rgba(255, 43, 214, 0.28)',

  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: 'rgba(255, 255, 255, 0.72)',
  TEXT_MUTED: '#A0A0A0',
  TEXT_DIM: '#606060',

  /** Muted atmospheric blobs — visible against pure OLED black */
  GLOW_TEAL: 'rgba(0, 88, 98, 0.32)',
  GLOW_PURPLE: 'rgba(88, 36, 130, 0.28)',
  GLOW_MAGENTA: 'rgba(130, 24, 105, 0.24)',

  alpha: (color: string, opacity: number): string => {
    if (color.startsWith('#')) {
      const a = Math.round(opacity * 255)
        .toString(16)
        .padStart(2, '0');
      return `${color}${a}`;
    }
    if (color.startsWith('rgba')) {
      return color.replace(/[\d.]+\)$/, `${opacity})`);
    }
    if (color.startsWith('rgb')) {
      return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
    }
    return color;
  },

  mixVoid: (pct: number) => `rgba(${VOID_RGB}, ${pct})`,
  mixGlass: (pct: number) => `rgba(${GLASS_RGB}, ${pct})`,
} as const;

/**
 * Liquid glass — one blur layer + one thin tint. Reference frosted panes.
 * blurIntensity: native BlurView 1–100 (keep low — tint already adds opacity).
 * webBlurPx: CSS backdrop-filter blur radius.
 */
export const GLASS = {
  subtle: {
    fill: COLORS.GLASS_FILL_SUBTLE,
    border: COLORS.BORDER_SUBTLE,
    blurIntensity: 28,
    webBlurPx: 16,
    specular: 0.05,
    chromaticOpacity: 0.2,
    chromaticCyan: 0.08,
    chromaticMagenta: 0.06,
    insetTop: 0.12,
    insetBottom: 0.08,
    insetCyan: 0.1,
    insetMagenta: 0.08,
    outerShadow: COLORS.mixVoid(0.4),
  },
  default: {
    fill: COLORS.GLASS_FILL,
    border: COLORS.BORDER_DEFAULT,
    blurIntensity: 36,
    webBlurPx: 22,
    specular: 0.07,
    chromaticOpacity: 0.35,
    chromaticCyan: 0.11,
    chromaticMagenta: 0.09,
    insetTop: 0.15,
    insetBottom: 0.1,
    insetCyan: 0.12,
    insetMagenta: 0.1,
    outerShadow: COLORS.mixVoid(0.5),
  },
  strong: {
    fill: COLORS.GLASS_FILL_STRONG,
    border: 'rgba(255, 255, 255, 0.07)',
    blurIntensity: 42,
    webBlurPx: 26,
    specular: 0.08,
    chromaticOpacity: 0.4,
    chromaticCyan: 0.12,
    chromaticMagenta: 0.1,
    insetTop: 0.16,
    insetBottom: 0.12,
    insetCyan: 0.14,
    insetMagenta: 0.12,
    outerShadow: COLORS.mixVoid(0.55),
  },
  bar: {
    fill: COLORS.GLASS_FILL_BAR,
    border: COLORS.BORDER_DEFAULT,
    blurIntensity: 44,
    webBlurPx: 28,
    specular: 0.06,
    chromaticOpacity: 0.25,
    chromaticCyan: 0.1,
    chromaticMagenta: 0.08,
    insetTop: 0.14,
    insetBottom: 0,
    insetCyan: 0.1,
    insetMagenta: 0.08,
    outerShadow: 'transparent',
  },
} as const;

export const GLASS_TINT = {
  cyan: {
    colors: [COLORS.alpha(COLORS.NEON_CYAN, 0.1), 'transparent'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  magenta: {
    colors: [COLORS.alpha(COLORS.NEON_MAGENTA, 0.08), 'transparent'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  gold: {
    colors: [COLORS.alpha(COLORS.NEON_GOLD, 0.12), 'transparent'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

export const QUEST_TYPE_COLORS: Record<string, string> = {
  DAILY: COLORS.NEON_CYAN,
  SIDE: COLORS.NEON_GOLD,
  RANK_UP: COLORS.NEON_PURPLE,
  EMERGENCY: COLORS.NEON_RED,
};

export const TYPOGRAPHY = {
  MONO: 'monospace',
  WEIGHT: {
    NORMAL: '400' as const,
    BOLD: '600' as const,
    HEAVY: '700' as const,
    BLACK: '800' as const,
  },
  SIZE: {
    MICRO: 9,
    TINY: 10,
    SMALL: 12,
    BODY: 14,
    MEDIUM: 16,
    LARGE: 18,
    HEADING: 22,
    DISPLAY: 30,
    HERO: 38,
    MEGA: 50,
    ULTRA: 58,
  },
  SPACING: {
    TIGHT: 0.4,
    NORMAL: 1.0,
    WIDE: 1.6,
    ULTRA: 2.4,
    DISPLAY: 3.2,
    MEGA: 5.0,
  },
} as const;

export const SPACING = {
  XS: 6,
  SM: 10,
  MD: 14,
  LG: 20,
  XL: 28,
  XXL: 36,
  XXXL: 48,
  HEADER_TOP: 54,
} as const;

export const RADIUS = {
  SM: 6,
  MD: 10,
  LG: 16,
  XL: 20,
  XXL: 24,
  PILL: 999,
} as const;

export const ANIMATION = {
  FAST: 200,
  NORMAL: 400,
  SLOW: 800,
  SLOWER: 1200,
  SLOWEST: 1600,
} as const;

export function pressureTone(value: number): { color: string; label: string } {
  if (value >= 85) return { color: COLORS.NEON_RED, label: 'Critical' };
  if (value >= 70) return { color: COLORS.NEON_MAGENTA, label: 'Elevated' };
  if (value >= 40) return { color: COLORS.NEON_GOLD, label: 'Nominal' };
  return { color: COLORS.NEON_CYAN, label: 'Low' };
}
