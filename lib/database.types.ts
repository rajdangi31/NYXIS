// ─────────────────────────────────────────────
//  The System — Database Types
// ─────────────────────────────────────────────

export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export type QuestType = 'DAILY' | 'SIDE' | 'EMERGENCY' | 'RANK_UP';

export type QuestStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'LOCKED';

export type StatFocus = 'stats_str' | 'stats_int' | 'stats_vit' | 'stats_dex' | 'stats_wis';

export interface Profile {
  id: string;
  player_name: string;
  player_title: string;
  level: number;
  rank: Rank;
  total_xp: number;
  stats_str: number;
  stats_int: number;
  stats_vit: number;
  stats_dex: number;
  stats_wis: number;
  created_at?: string;
  updated_at?: string;
}

export interface Path {
  id: string;
  player_id: string;
  title: string;
  goal_text: string;
  is_active: boolean;
  progress_pct: number;
  last_daily_refresh: string | null;
  created_at?: string;
}

export interface Quest {
  id: string;
  path_id: string | null;
  player_id: string;
  title: string;
  description: string;
  quest_type: QuestType;
  xp_gain: number;
  stat_focus: StatFocus;
  stat_gain: number;
  status: QuestStatus;
  created_at?: string;
  updated_at?: string;
}
