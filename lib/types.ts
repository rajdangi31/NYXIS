/**
 * NYXIS Type System
 * All shared TypeScript interfaces for the application.
 */

// ─── SYSTEM STATES ──────────────────────────────────────────
export type SystemState = 'NORMAL' | 'FOCUSED' | 'PRESSURED' | 'PENALTY' | 'TRIAL' | 'SYSTEM_COLLAPSE';
export type QuestStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type QuestType = 'DAILY' | 'SIDE' | 'RANK_UP' | 'EMERGENCY';
export type StatKey = 'STR' | 'INT' | 'DEX' | 'VIT' | 'WIS';
export type VerificationType = 'github' | 'fitbit' | 'photo' | 'text' | 'url' | 'none';
export type Intensity = 'LOW' | 'MEDIUM' | 'HIGH';
export type QuestBias = 'LEARNING' | 'EXECUTION' | 'DISCOMFORT' | 'CONSISTENCY';
export type EnforcementMode = 'NONE' | 'EMERGENCY_DISCOMFORT' | 'RANK_UP_TRIAL';
export type MemoryEventType = 'success_pattern' | 'failure_pattern' | 'avoidance_pattern';
export type RewardType = 'XP_BOOST' | 'STAT_AWAKENING' | 'CATHARSIS' | 'AEGIS_PROTOCOL';

// ─── DATABASE MODELS ────────────────────────────────────────
export interface HunterProfile {
  id: string;
  level: number;
  rank: string;
  total_xp: number;
  str: number;
  int: number;
  dex: number;
  vit: number;
  wis: number;
  pressure_level: number;
  system_state: SystemState;
  current_streak: number;
  last_active_date: string | null;
  immunity_until: string | null;
}

export interface Quest {
  id: string;
  path_id: string;
  user_id: string;
  title: string;
  description: string;
  type: QuestType;
  xp_reward: number;
  stat_focus: StatKey | 'NONE';
  difficulty_rating: number;
  verification_required: boolean;
  verification_type: VerificationType | null;
  status: QuestStatus;
  created_at: string;
}

export interface QuestLog {
  id: string;
  user_id: string;
  quest_id: string;
  completed: boolean;
  completion_score: number;
  proof_submitted: string | null;
  timestamp: string;
}

export interface BehaviorProfile {
  user_id: string;
  consistency_score: number;
  avoidance_score: number;
  intensity_score: number;
  active_enforcement: EnforcementMode;
  difficulty_cap: number;
}

export interface HunterContext {
  user_id: string;
  primary_aim: string;
  current_conditions: string;
  constraints: string;
  available_time: string;
  preferred_intensity: 'LOW' | 'BALANCED' | 'HIGH';
  proof_preference: 'SYSTEM_ASSIGNED' | 'TEXT' | 'URL' | 'PHOTO' | 'METRIC' | null;
  updated_at: string;
  created_at: string;
}

export interface HunterContextInput {
  primary_aim: string;
  current_conditions: string;
  constraints: string;
  available_time: string;
  preferred_intensity: HunterContext['preferred_intensity'];
  proof_preference?: HunterContext['proof_preference'];
}

// ─── API RESPONSE PAYLOADS ──────────────────────────────────
export interface RareReward {
  type: RewardType;
  desc: string;
}

export interface QuestCompletionResult {
  xp_awarded: number;
  stat_changes: { stat: StatKey; gained: number };
  completion_score: number;
  pressure_relieved: number;
  system_state: SystemState;
  ai_adjustment: number;
  proof_audit?: ProofEvalResult;
  rare_reward?: RareReward | null;
}

export interface QuestFailResult {
  atrophy_stat: StatKey | 'NONE';
  collapse_data?: { stat: StatKey; loss: number } | null;
  immune?: boolean;
}

export interface PenaltyResult {
  missed_dailies: number;
  days_inactive: number;
  pressure_added: number;
  atrophy_stat: StatKey | 'NONE';
}

export interface EvalData {
  success_rate: number;
  difficulty_multiplier: number;
  pressure_delta: number;
  recommended_focus: StatKey;
  next_state: SystemState;
  message: string;
}

export interface Strategy {
  focus_area: StatKey;
  intensity: Intensity;
  quest_bias: QuestBias;
}

// ─── MEMORY, DEPENDENCY & REWARD MODELS ─────────────────────
export interface MemoryEvent {
  event_type: MemoryEventType;
  description: string;
  created_at: string;
}

export interface QuestDependency {
  quest_id: string;
  depends_on_quest_id: string;
}

export interface RewardDrop {
  id: string;
  user_id: string;
  reward_type: RewardType;
  description: string;
  created_at: string;
}

// ─── FUNCTION RETURN TYPES ──────────────────────────────────
export interface ApiResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface EvalResult {
  success: boolean;
  error?: string;
  pending?: boolean;
  message?: string;
  data?: EvalData;
}

export interface ProofEvalResult {
  success: boolean;
  accepted: boolean;
  score: number;
  reason: string;
  missing: string[];
  adjustment: number;
  /** Set when the edge function fails (e.g. missing secrets, 4xx/5xx). */
  error?: string;
}
