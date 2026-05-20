export type SystemState = "NORMAL" | "FOCUSED" | "PRESSURED" | "PENALTY" | "TRIAL" | "SYSTEM_COLLAPSE";
export type ProofType = "GITHUB" | "FITBIT" | "PHOTO" | "URL" | "TEXT";
export type QuestType = "DAILY" | "SIDE" | "RANK_UP" | "EMERGENCY";

export interface Quest {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  type: QuestType;
  difficulty: number; // 1-5
  xp: number;
  statFocus: "STR" | "INT" | "DEX" | "VIT" | "WIS";
  proof: ProofType;
  status: "ACTIVE" | "LOCKED" | "COMPLETE";
  lockedBy?: string;
}

export interface Hunter {
  handle: string;
  level: number;
  rank: string;
  xp: number;
  xpNext: number;
  stats: { STR: number; INT: number; DEX: number; VIT: number; WIS: number };
  pressure: number; // 0-100
  state: SystemState;
}

export const hunter: Hunter = {
  handle: "K_XENON",
  level: 14,
  rank: "VANGUARD II",
  xp: 2440,
  xpNext: 3000,
  stats: { STR: 14, INT: 28, DEX: 19, VIT: 12, WIS: 22 },
  pressure: 32,
  state: "FOCUSED",
};

export const quests: Quest[] = [
  {
    id: "q1",
    title: "NEURAL LINK CALIBRATION",
    subtitle: "Deep work, 90 minutes, no signal noise",
    description: "Execute one uninterrupted deep work session. Phone in another room. Single tab.",
    type: "DAILY",
    difficulty: 2,
    xp: 450,
    statFocus: "INT",
    proof: "TEXT",
    status: "ACTIVE",
  },
  {
    id: "q2",
    title: "PUSH PROTOCOL // CHEST",
    subtitle: "Strength session with traceable metrics",
    description: "5x5 bench at >70% 1RM. Log sets, weight, RPE. Photo of the rack at completion.",
    type: "DAILY",
    difficulty: 3,
    xp: 380,
    statFocus: "STR",
    proof: "PHOTO",
    status: "ACTIVE",
  },
  {
    id: "q3",
    title: "REPO ADVANCE / NYXIS-CORE",
    subtitle: "Ship code with a commit and a measurable diff",
    description: "Land at least one meaningful PR into main with tests. Link the commit.",
    type: "SIDE",
    difficulty: 4,
    xp: 620,
    statFocus: "INT",
    proof: "GITHUB",
    status: "ACTIVE",
  },
  {
    id: "q4",
    title: "CARDIO TRACE / ZONE 3",
    subtitle: "45 min sustained, traceable on device",
    description: "Maintain HR Zone 3 for 45 minutes. Export from Fitbit / wearable.",
    type: "SIDE",
    difficulty: 3,
    xp: 520,
    statFocus: "VIT",
    proof: "FITBIT",
    status: "LOCKED",
    lockedBy: "PUSH PROTOCOL // CHEST",
  },
  {
    id: "q5",
    title: "RANK GATE // E → D",
    subtitle: "Boss trial. Composite challenge.",
    description: "Complete all DAILY directives 5 days running, then submit a written reflection.",
    type: "RANK_UP",
    difficulty: 5,
    xp: 2200,
    statFocus: "WIS",
    proof: "URL",
    status: "LOCKED",
    lockedBy: "Streak: 5 consecutive days",
  },
];

export const architectMessage =
  "Hunter K_XENON — your consistency is fluctuating. Shadow Pressure has stabilized but XP yield is sub-optimal. I have prepared a Rank-Up trial for your current INT tier. Resolve today's directives before sundown or pressure will escalate.";

export const behaviorProfile = {
  consistency: 72,
  avoidance: 28,
  intensity: 64,
};
