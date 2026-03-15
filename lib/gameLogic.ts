// ─────────────────────────────────────────────
//  The System — Game Logic
// ─────────────────────────────────────────────

import { Rank } from './database.types';

/** XP required to reach the next level from level 1 */
const XP_PER_LEVEL = 1000;

/**
 * Calculate the player's level from raw total XP.
 * Level 1 starts at 0 XP.
 */
export function calculateLevel(totalXp: number): number {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

/**
 * How many XP has the player earned within the **current** level band?
 * Used to display the XP progress bar fill amount.
 */
export function xpWithinLevel(totalXp: number): number {
  return totalXp % XP_PER_LEVEL;
}

/**
 * How many total XP does the player need to reach the next level?
 * Always returns XP_PER_LEVEL for MVP simplicity.
 */
export function xpForNextLevel(): number {
  return XP_PER_LEVEL;
}

/**
 * Returns 0–1 progress fraction for XP bar rendering.
 */
export function xpProgress(totalXp: number): number {
  return xpWithinLevel(totalXp) / XP_PER_LEVEL;
}

/**
 * Derives rank from current level:
 *   E  Lv 1–9
 *   D  Lv 10–24
 *   C  Lv 25–49
 *   B  Lv 50–74
 *   A  Lv 75–99
 *   S  Lv 100+
 */
export function calculateRank(level: number): Rank {
  if (level >= 100) return 'S';
  if (level >= 75) return 'A';
  if (level >= 50) return 'B';
  if (level >= 25) return 'C';
  if (level >= 10) return 'D';
  return 'E';
}

/** Friendly display string for a stat key */
export const STAT_LABELS: Record<string, string> = {
  stats_str: 'STR',
  stats_int: 'INT',
  stats_vit: 'VIT',
  stats_dex: 'DEX',
  stats_wis: 'WIS',
};

/** Color to represent each rank */
export const RANK_COLORS: Record<string, string> = {
  E: '#9E9E9E', // grey
  D: '#4CAF50', // green
  C: '#2196F3', // blue
  B: '#9C27B0', // purple
  A: '#FF9800', // orange
  S: '#00E5FF', // neon — true S-class
};

/** Quest type display config */
export const QUEST_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  DAILY:     { label: 'DAILY',     color: '#00E5FF' },
  SIDE:      { label: 'SIDE',      color: '#7B68EE' },
  EMERGENCY: { label: 'EMERGENCY', color: '#FF4444' },
  RANK_UP:   { label: 'RANK UP',   color: '#FFD700' },
};
