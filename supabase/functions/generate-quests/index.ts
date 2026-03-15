// ─────────────────────────────────────────────────────────────────────────────
//  The Architect — Supabase Edge Function (Deno)
//  POST /functions/v1/generate-quests
//
//  Actions:
//   • { action: 'generate_path', goalText, profile, pathId }
//     → generates 10 quests (3 ACTIVE, 7 LOCKED) for a brand new path
//
//   • { action: 'daily_refresh', profile, pathId }
//     → generates 3 fresh DAILY quests for today and updates last_daily_refresh
//
//  The GEMINI_API_KEY is stored as a Supabase secret — never sent to the client.
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Types ─────────────────────────────────────────────────────────────────────
type QuestType  = 'DAILY' | 'SIDE' | 'EMERGENCY' | 'RANK_UP';
type StatFocus  = 'stats_str' | 'stats_int' | 'stats_vit' | 'stats_dex' | 'stats_wis';

interface Profile {
  id: string;
  player_name: string;
  rank: string;
  level: number;
  stats_str: number;
  stats_int: number;
  stats_vit: number;
  stats_dex: number;
  stats_wis: number;
}

interface ArchitectQuest {
  title: string;
  description: string;
  quest_type: QuestType;
  xp_gain: number;
  stat_focus: StatFocus;
  stat_gain: number;
}

// ── Environment ───────────────────────────────────────────────────────────────
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')   ?? '';
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const MAX_RETRIES = 3;

// ── Retry helper ──────────────────────────────────────────────────────────────
async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, options);
    if (res.status !== 429) return res;

    const body = await res.clone().json().catch(() => ({}));
    const rawDelay: string | undefined =
      body?.error?.details?.find(
        (d: any) => d['@type']?.includes('RetryInfo') || d.retryDelay
      )?.retryDelay;

    const delaySec = rawDelay
      ? Math.ceil(Number(rawDelay.replace(/[^0-9.]/g, '')))
      : Math.pow(2, attempt + 1) * 5;

    const waitMs = Math.min(delaySec * 1000 + 500, 60_000);
    console.warn(`[Architect] 429 — retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
    await new Promise((r) => setTimeout(r, waitMs));
    lastError = new Error(`429 after attempt ${attempt + 1}`);
  }
  throw lastError ?? new Error('Gemini rate limit exceeded.');
}

// ── System prompts ────────────────────────────────────────────────────────────
const PATH_SYSTEM_INSTRUCTION = `You are the Architect of The System. Your purpose is to evolve the human Player.
Analyze their Goal and current Stats. Generate a JSON roadmap of exactly 10 quests.

CRITICAL RULES FOR QUEST DESIGN (MASTERY ORIENTED):

1. Thematic Categories (Domains):
   Determine 3-4 core domains or pillars of the player's goal (e.g., if ML: 'The Math', 'The Code', 'The Paper'. If Fitness: 'The Iron', 'The Engine', 'The Diet').
   Prefix every quest title with its domain (e.g., "The Math: Derivation of Softmax").

2. The Mastery Standard (The Proof):
   Every quest description MUST include a rigorous, measurable standard for completion. Do not allow the player to just "read" or "watch".
   Examples of The Proof: "Must be done on whiteboard without notes", "Explain the core intuition to a non-technical person in < 2 mins", "Must complete a 5k run in under 25 mins."

3. Pacing & Structure:
   - Quests 1-3 (ACTIVE): The 'Daily Executions'. These must be highly atomic, daily tasks (e.g., derive one formula, write one atomic function).
   - Quests 4-9 (LOCKED): The 'Validation Sets'. These are weekly/monthly challenges (e.g., 'The ELI5 Challenge', 'The Cold Start Sprint') testing if the player can bridge theory to reality.
   - Quest 10 (RANK_UP): The Ultimate Gate. A Boss Battle unifying all concepts (800-1000 XP).

4. Dynamic Difficulty (The Architect Engine):
   If history shows high failure in a specific stat_focus, simplify the next 3 quests to rebuild momentum. 
   If success rate is 100%, drastically increase xp_gain and task difficulty to punish their arrogance.

5. Aesthetic:
   Write in the cold, objective "Solo Leveling" System aesthetic. The System is watching.

Strictly valid JSON format — output ONLY a JSON array, no markdown, no explanation, no code blocks:
[
  {
    "title": "[Domain]: Quest Title",
    "description": "Immersive 'System' flavor text. \\n\\nThe Mastery Standard: [Measurable, rigorous proof of completion]",
    "quest_type": "DAILY" | "SIDE" | "EMERGENCY" | "RANK_UP",
    "xp_gain": <number 50–1000>,
    "stat_focus": "stats_str" | "stats_int" | "stats_vit" | "stats_dex" | "stats_wis",
    "stat_gain": <1 | 2 | 3>
  },
  ... (exactly 10 items)
]`;

const DAILY_SYSTEM_INSTRUCTION = `You are the Architect of The System. Generate exactly 3 DAILY quests for today.
These are fresh daily challenges tailored to the player's long-term goal and stats.

CRITICAL RULES (MASTERY ORIENTED):
1. Determine the core domains of the goal. Prefix the quest title with the domain (e.g., "The Engine: 5k Run").
2. The Mastery Standard: Every description MUST include a measurable, rigorous proof of completion. No passive tasks.
3. All 3 quests MUST be of type "DAILY".
4. Vary the stat_focus across the 3 quests.
5. Write in the "Solo Leveling" aesthetic. The System expects results.

Strictly valid JSON format:
[
  {
    "title": "[Domain]: Quest Title",
    "description": "Flavor text. \\n\\nThe Mastery Standard: [Rigorous Proof]",
    "quest_type": "DAILY",
    "xp_gain": <number 100–300>,
    "stat_focus": "stats_str" | "stats_int" | "stats_vit" | "stats_dex" | "stats_wis",
    "stat_gain": <1 | 2>
  },
  ... (exactly 3 items)
]`;

// ── Prompt builders ───────────────────────────────────────────────────────────
function buildPathPrompt(goalText: string, profile: Profile, historyContext?: string): string {
  return `
PLAYER PROFILE:
  Name:  ${profile.player_name}
  Rank:  ${profile.rank}
  Level: ${profile.level}
  Stats: STR ${profile.stats_str} | INT ${profile.stats_int} | VIT ${profile.stats_vit} | DEX ${profile.stats_dex} | WIS ${profile.stats_wis}

PLAYER GOAL: "${goalText}"
${historyContext ? `\nPERFORMANCE HISTORY:\n${historyContext}\n` : ''}
Generate exactly 10 quests. Quests 1–3 = immediately actionable Foundational Quests.
Quests 4–9 = progressive Challenges. Quest 10 = RANK_UP Gate (800–1000 XP).
Output ONLY the JSON array.`.trim();
}

function buildDailyPrompt(goalText: string, profile: Profile): string {
  return `
PLAYER PROFILE:
  Name:  ${profile.player_name}
  Rank:  ${profile.rank}
  Level: ${profile.level}
  Stats: STR ${profile.stats_str} | INT ${profile.stats_int} | VIT ${profile.stats_vit} | DEX ${profile.stats_dex} | WIS ${profile.stats_wis}

ACTIVE LONG-TERM GOAL: "${goalText}"

Generate exactly 3 fresh DAILY quests for today that advance this goal. Output ONLY the JSON array.`.trim();
}

// ── JSON parsing & validation ─────────────────────────────────────────────────
function parseResponse(raw: string, count: number): ArchitectQuest[] {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  let parsed: unknown;
  try { parsed = JSON.parse(cleaned); } catch {
    throw new Error(`Malformed JSON from Gemini:\n${cleaned.slice(0, 400)}`);
  }
  if (!Array.isArray(parsed)) throw new Error('Gemini did not return a JSON array.');

  const VALID_TYPES = new Set(['DAILY', 'SIDE', 'EMERGENCY', 'RANK_UP']);
  const VALID_STATS = new Set(['stats_str', 'stats_int', 'stats_vit', 'stats_dex', 'stats_wis']);

  return parsed.slice(0, count).map((q: any, i: number) => {
    if (!q.title || typeof q.title !== 'string') throw new Error(`Quest ${i + 1} missing title.`);
    if (!VALID_TYPES.has(q.quest_type)) q.quest_type = 'SIDE';
    if (!VALID_STATS.has(q.stat_focus)) q.stat_focus = 'stats_str';
    if (![1, 2, 3].includes(q.stat_gain)) q.stat_gain = 1;
    return {
      title:       String(q.title),
      description: String(q.description ?? ''),
      quest_type:  q.quest_type as QuestType,
      xp_gain:     Math.min(1000, Math.max(50, Number(q.xp_gain) || 100)),
      stat_focus:  q.stat_focus as StatFocus,
      stat_gain:   q.stat_gain as 1 | 2 | 3,
    };
  });
}

const QUEST_SCHEMA = {
  type: 'ARRAY',
  description: 'A list of generated quests.',
  items: {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING', description: 'A short, actionable title for the quest.' },
      description: { type: 'STRING', description: 'A motivating and thematic description of the quest, written by the Architect.' },
      quest_type: { type: 'STRING', description: "One of: 'DAILY', 'SIDE', 'EMERGENCY', 'RANK_UP'" },
      xp_gain: { type: 'INTEGER', description: 'XP gained upon completion.' },
      stat_focus: { type: 'STRING', description: "The specific stat to train: 'stats_str', 'stats_int', 'stats_vit', 'stats_dex', or 'stats_wis'" },
      stat_gain: { type: 'INTEGER', description: 'Amount of stat gained.' },
    },
    required: ['title', 'description', 'quest_type', 'xp_gain', 'stat_focus', 'stat_gain'],
  },
};

// ── Call Gemini ───────────────────────────────────────────────────────────────
async function callGemini(systemInstruction: string, userPrompt: string, count: number): Promise<ArchitectQuest[] | null> {
  if (!GEMINI_API_KEY) return null;

  const requestBody = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { 
      temperature: 0.85, 
      topK: 40, 
      topP: 0.95, 
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
      responseSchema: QUEST_SCHEMA,
    },
  };

  try {
    const response = await fetchWithRetry(
      `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
    );
    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini ${response.status}: ${errBody}`);
    }
    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!rawText) throw new Error('Empty Gemini response.');
    return parseResponse(rawText, count);
  } catch (err: any) {
    console.warn(`[Architect] Gemini call failed: ${err.message}`);
    return null;
  }
}

// ── Fallbacks ─────────────────────────────────────────────────────────────────
function buildFallbackPath(goalText: string): ArchitectQuest[] {
  const STATS: StatFocus[] = ['stats_str','stats_int','stats_vit','stats_dex','stats_wis',
                               'stats_str','stats_int','stats_vit','stats_dex','stats_wis'];
  return Array.from({ length: 10 }, (_, i) => ({
    title:       i === 9 ? '⚔ Final Gate — Prove Your Worth' : `Quest ${i + 1}: Advance Toward "${goalText.slice(0, 25)}"`,
    description: i === 9
      ? 'The System demands a reckoning. Complete a milestone that proves your goal is within reach.'
      : 'Take one concrete action today that moves you closer to your goal.',
    quest_type:  (i === 9 ? 'RANK_UP' : i % 3 === 0 ? 'DAILY' : 'SIDE') as QuestType,
    xp_gain:     i === 9 ? 900 : 100 + i * 30,
    stat_focus:  STATS[i],
    stat_gain:   (i < 3 ? 1 : i < 7 ? 2 : 3) as 1 | 2 | 3,
  }));
}

function buildFallbackDaily(goalText: string): ArchitectQuest[] {
  const pairs: [StatFocus, string][] = [
    ['stats_str', 'Physical Training'],
    ['stats_int', 'Study & Learn'],
    ['stats_wis', 'Reflect & Plan'],
  ];
  return pairs.map(([stat, label]) => ({
    title: `Daily: ${label}`,
    description: `Take meaningful action today toward your goal: "${goalText.slice(0, 40)}". The System is watching.`,
    quest_type: 'DAILY' as QuestType,
    xp_gain: 150,
    stat_focus: stat,
    stat_gain: 1,
  }));
}

// ── CORS headers ──────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json();
    const { action = 'generate_path' } = body;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // ── ACTION: generate_path ────────────────────────────────────────────────
    if (action === 'generate_path') {
      const { goalText, profile, pathId } = body as { goalText: string; profile: Profile; pathId: string };
      if (!goalText || !profile || !pathId) {
        return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
          status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      const quests = (await callGemini(PATH_SYSTEM_INSTRUCTION, buildPathPrompt(goalText, profile), 10))
        ?? buildFallbackPath(goalText);

      const rows = quests.map((q, i) => ({
        ...q, player_id: profile.id, path_id: pathId,
        status: i < 3 ? 'ACTIVE' : 'LOCKED',
      }));

      const { error: insertError } = await supabase.from('quests').insert(rows);
      if (insertError) throw new Error(`Supabase insert failed: ${insertError.message}`);

      // Also store goal_text on the path
      await supabase.from('paths').update({ goal_text: goalText }).eq('id', pathId);

      return new Response(JSON.stringify({ quests }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── ACTION: daily_refresh ────────────────────────────────────────────────
    if (action === 'daily_refresh') {
      const { profile, pathId } = body as { profile: Profile; pathId: string };
      if (!profile || !pathId) {
        return new Response(JSON.stringify({ error: 'Missing profile or pathId.' }), {
          status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      // Get the path's goal text
      const { data: pathData } = await supabase
        .from('paths').select('goal_text').eq('id', pathId).single();
      const goalText = pathData?.goal_text ?? 'Improve yourself';

      const quests = (await callGemini(DAILY_SYSTEM_INSTRUCTION, buildDailyPrompt(goalText, profile), 3))
        ?? buildFallbackDaily(goalText);

      const rows = quests.map((q) => ({
        ...q, player_id: profile.id, path_id: pathId, status: 'ACTIVE',
      }));

      const { error: insertError } = await supabase.from('quests').insert(rows);
      if (insertError) throw new Error(`Daily insert failed: ${insertError.message}`);

      // Mark the path as refreshed today
      const today = new Date().toISOString().slice(0, 10);
      await supabase.from('paths').update({ last_daily_refresh: today }).eq('id', pathId);

      return new Response(JSON.stringify({ quests }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── ACTION: recalibrate_path ──────────────────────────────────────────────
    if (action === 'recalibrate_path') {
      const { goalText, profile, pathId, recentPerformanceContext } = body as { goalText: string; profile: Profile; pathId: string; recentPerformanceContext: string };
      if (!goalText || !profile || !pathId || !recentPerformanceContext) {
        return new Response(JSON.stringify({ error: 'Missing required fields for recalibration.' }), {
          status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      // 1. Delete existing LOCKED quests for this path
      const { error: deleteError } = await supabase
        .from('quests')
        .delete()
        .eq('path_id', pathId)
        .eq('status', 'LOCKED');

      if (deleteError) throw new Error(`Failed to delete locked quests: ${deleteError.message}`);

      // 2. Generate new quests
      const contextPrompt = buildPathPrompt(goalText, profile, recentPerformanceContext);

      const quests = (await callGemini(PATH_SYSTEM_INSTRUCTION, contextPrompt, 10))
        ?? buildFallbackPath(goalText);

      // 3. Insert the newly calibrated quests, all as LOCKED
      const rows = quests.map((q) => ({
        ...q, player_id: profile.id, path_id: pathId,
        status: 'LOCKED',
      }));

      const { error: insertError } = await supabase.from('quests').insert(rows);
      if (insertError) throw new Error(`Supabase insert failed for recalibration: ${insertError.message}`);

      return new Response(JSON.stringify({ quests }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('[Architect] Fatal error:', err.stack || err.message);
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
