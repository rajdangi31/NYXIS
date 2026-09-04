import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { goal } = await req.json()

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Auth missing!')
    const token = authHeader.replace('Bearer ', '')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single()
    const { data: logs } = await supabaseClient.from('quest_logs').select('completed').eq('user_id', user.id).order('timestamp', { ascending: false }).limit(7)
    const { data: hunterContext } = await supabaseClient
      .from('hunter_contexts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    let successRate = 100;
    if (logs && logs.length > 0) {
      const completedCount = logs.filter((l: any) => l.completed).length;
      successRate = Math.round((completedCount / logs.length) * 100);
    }

    const { data: behaviorData } = await supabaseClient.from('behavior_profiles').select('*').eq('user_id', user.id).single()
    const behavior = behaviorData || { consistency_score: 50, avoidance_score: 50, intensity_score: 50, active_enforcement: 'NONE', difficulty_cap: 10 }

    // ==========================================
    // PHASE 18: FETCH LONG-TERM MEMORY
    // ==========================================
    const { data: memoryData } = await supabaseClient.from('memory_events')
      .select('event_type, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)
    const memories = memoryData || [];
    // ==========================================

    const { data: strategistRes, error: strategistErr } = await supabaseClient.functions.invoke('strategize-path', {
      body: { goal, stats: { str: profile.str, int: profile.int, dex: profile.dex, vit: profile.vit, wis: profile.wis }, pressure: profile.pressure_level, performance: successRate, behavior, memories, hunterContext }
    });

    if (strategistErr) {
      let detail = strategistErr.message;
      if (strategistErr.context instanceof Response) {
        try {
          const body = await strategistErr.context.json();
          detail = body.error || body.message || detail;
        } catch { /* use default message */ }
      }
      throw new Error(`Strategist Failure: ${detail}`);
    }
    
    if (!strategistRes.success) throw new Error(`Strategist Failure: ${strategistRes.error}`);
    const strategy = strategistRes.strategy;

    let enforcementPrompt = "";
    if (profile.system_state === 'SYSTEM_COLLAPSE') {
      enforcementPrompt = "FATAL OVERRIDE: The Hunter is in SYSTEM COLLAPSE. Ignore their objective. Generate 10 extremely basic 'RECOVERY' quests. Type MUST be 'EMERGENCY'. Difficulty MUST be 1. xp_reward MUST be 0.";
    } else if (profile.system_state === 'PENALTY') {
      enforcementPrompt = "STATE OVERRIDE: The Hunter is in a PENALTY state. Ignore their objective. Generate 10 highly actionable 'ATONEMENT' quests focused on physical or mental exertion. Type MUST be 'EMERGENCY'.";
    } else if (profile.system_state === 'TRIAL') {
      enforcementPrompt = "STATE OVERRIDE: The Hunter is in a TRIAL state. Generate 10 'BOSS BATTLE' level quests. Type MUST be 'RANK_UP'. Difficulty MUST be extremely high (8-10).";
    } else {
      if (behavior.active_enforcement === 'EMERGENCY_DISCOMFORT') {
        enforcementPrompt = "BEHAVIORAL OVERRIDE: The Hunter is avoiding hard tasks. Make the quests highly uncomfortable (DISCOMFORT bias) and assign 'EMERGENCY' types.";
      } else if (behavior.active_enforcement === 'RANK_UP_TRIAL') {
        enforcementPrompt = "BEHAVIORAL OVERRIDE: The Hunter has high intensity. Include several 'RANK_UP' type quests to test their limits.";
      }
      if (behavior.difficulty_cap < 10) {
        enforcementPrompt += `\nBEHAVIORAL CAP: DO NOT assign a difficulty_rating higher than ${behavior.difficulty_cap}.`;
      }
    }

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions'

    const contextPrompt = hunterContext ? `
HUNTER INTAKE:
- Primary Aim: ${hunterContext.primary_aim}
- Current Conditions: ${hunterContext.current_conditions || 'Not specified'}
- Constraints: ${hunterContext.constraints || 'Not specified'}
- Available Time: ${hunterContext.available_time || 'Not specified'}
- Preferred Intensity: ${hunterContext.preferred_intensity}
` : `
HUNTER INTAKE:
- No intake record found. Generate conservative onboarding-caliber directives and require text proof for every quest.
`;

    const proofTypes = "text, url, photo, github, fitbit";

    const systemPrompt = `You are The Architect of the NYXIS system. Generate exactly 10 serious, concrete quests for: "${goal}".

The quests must be personalized to the Hunter and must be strict enough that completion requires evidence.
${contextPrompt}

CRITICAL STRATEGY DIRECTIVES:
- Focus Area: ${strategy.focus_area}
- Intensity: ${strategy.intensity}
- Quest Bias: ${strategy.quest_bias}
- Progression Chains: If tasks logically follow one another (e.g. Step A must happen before Step B), use 'depends_on_index' to link them.
${enforcementPrompt}

STRICTNESS RULES:
- Every quest MUST require proof. Set verification_required to true for all 10 quests.
- verification_type MUST be one of: ${proofTypes}. Never use "none".
- Choose verification_type by task domain, not user preference.
- Code/software tasks MUST use "github" and must mention repository URL plus commit or pull request link in the description.
- Exercise/fitness tasks SHOULD use "fitbit" when metrics are traceable, otherwise "photo"; descriptions must request duration, reps, sets, distance, steps, or heart-rate zone.
- Writing/design/research/build artifacts SHOULD use "url" when a shareable artifact can exist.
- Physical environment, chores, meal prep, setup, or before/after tasks SHOULD use "photo".
- Use "text" only when no stronger proof is realistic, and require specific measurable details.
- Avoid vague quests like "reflect", "research", "exercise", or "practice" unless the output is measurable.
- Each description must include an exact deliverable, time box, quantity, or acceptance criterion.
- At least 6 quests must include a measurable result in the description.
- At least 3 quests should require external or artifact proof (url, github, photo, or fitbit) when compatible with the goal.
- Keep quests achievable within the Hunter's stated time and constraints.

Output a raw JSON object with a single key "quests" containing an array of 10 objects:
{
  "title": "String", "description": "String", "type": "String (DAILY, SIDE, RANK_UP, EMERGENCY)", 
  "xp_reward": Number, "stat_focus": "String", "difficulty_rating": Number, 
  "verification_required": Boolean, "verification_type": "String (none, github, fitbit, etc)",
  "depends_on_index": Number | null (The array index 0-9 of the prerequisite quest, or null if independent)
}`;

    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENROUTER_API_KEY}` },
      body: JSON.stringify({ model: "openai/gpt-4o-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: systemPrompt }] })
    })

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json()
      const errorMsg = errorData.error?.message || errorData.error || 'AI quest generation failed'
      throw new Error(`Generator Error: ${errorMsg}`)
    }

    const aiData = await aiResponse.json()
    let parsedData: { quests: any[] }
    try {
      parsedData = JSON.parse(aiData.choices[0].message.content)
    } catch {
      throw new Error('AI returned unparseable response')
    }

    if (!parsedData || !Array.isArray(parsedData.quests) || parsedData.quests.length === 0) {
      throw new Error('AI response structure is missing the quests list or is empty')
    }

    // Sanitize and validate quests schema
    parsedData.quests = parsedData.quests.slice(0, 10).map((q: any, index: number) => {
      if (typeof q !== 'object' || q === null) {
        return {
          title: `Quest Directive ${index + 1}`,
          description: "No details provided.",
          type: "DAILY",
          xp_reward: 50,
          stat_focus: "NONE",
          difficulty_rating: 3,
          verification_required: true,
          verification_type: "text",
          depends_on_index: null
        }
      }

      const title = typeof q.title === 'string' ? q.title.trim() : `Quest Directive ${index + 1}`
      const description = typeof q.description === 'string' ? q.description.trim() : "No details provided."
      
      let type = "DAILY"
      if (typeof q.type === 'string') {
        const t = q.type.toUpperCase().trim()
        if (["DAILY", "SIDE", "RANK_UP", "EMERGENCY"].includes(t)) {
          type = t
        }
      }

      let xp_reward = 50
      if (typeof q.xp_reward === 'number') {
        xp_reward = Math.max(0, q.xp_reward)
      } else if (typeof q.xp_reward === 'string') {
        const val = parseInt(q.xp_reward, 10)
        if (!isNaN(val)) xp_reward = Math.max(0, val)
      }

      let stat_focus = "NONE"
      if (typeof q.stat_focus === 'string') {
        const sf = q.stat_focus.toUpperCase().trim()
        if (["STR", "INT", "DEX", "VIT", "WIS", "NONE"].includes(sf)) {
          stat_focus = sf
        }
      }

      let difficulty_rating = 3
      if (typeof q.difficulty_rating === 'number') {
        difficulty_rating = Math.max(1, Math.min(10, q.difficulty_rating))
      } else if (typeof q.difficulty_rating === 'string') {
        const val = parseInt(q.difficulty_rating, 10)
        if (!isNaN(val)) difficulty_rating = Math.max(1, Math.min(10, val))
      }

      const verification_required = typeof q.verification_required === 'boolean' ? q.verification_required : true
      const verification_type = typeof q.verification_type === 'string' ? q.verification_type.toLowerCase().trim() : 'text'

      let depends_on_index = null
      if (typeof q.depends_on_index === 'number') {
        depends_on_index = q.depends_on_index
      } else if (typeof q.depends_on_index === 'string') {
        const val = parseInt(q.depends_on_index, 10)
        if (!isNaN(val)) depends_on_index = val
      }

      return {
        title,
        description,
        type,
        xp_reward,
        stat_focus,
        difficulty_rating,
        verification_required,
        verification_type,
        depends_on_index
      }
    })

    const { data: pathData, error: pathError } = await supabaseClient.from('paths').insert({ user_id: user.id, goal: goal }).select().single()
    if (pathError) throw new Error(`Database Error (Paths): ${pathError.message}`)

    // 1. Prepare Quests and temporarily store the AI's requested dependency index
    const questsToPrepare = parsedData.quests.map((q: any) => {
      let finalType = q.type;
      let finalDiff = Math.min(q.difficulty_rating, behavior.difficulty_cap);
      let finalXp = q.xp_reward;

      if (profile.system_state === 'SYSTEM_COLLAPSE') { finalType = 'EMERGENCY'; finalDiff = 1; finalXp = 0; }
      else if (profile.system_state === 'PENALTY') { finalType = 'EMERGENCY'; }
      else if (profile.system_state === 'TRIAL') { finalType = 'RANK_UP'; finalDiff = Math.max(8, q.difficulty_rating); }
      else {
        if (behavior.active_enforcement === 'EMERGENCY_DISCOMFORT') finalType = 'EMERGENCY';
        else if (behavior.active_enforcement === 'RANK_UP_TRIAL' && Math.random() > 0.5) finalType = 'RANK_UP';
      }

      return {
        path_id: pathData.id,
        user_id: user.id,
        title: q.title,
        description: q.description,
        type: finalType,
        xp_reward: finalXp,
        stat_focus: q.stat_focus,
        difficulty_rating: finalDiff,
        verification_required: true,
        verification_type: determineVerificationType(q, goal, hunterContext),
        status: 'PENDING',
        __depends_on_index: q.depends_on_index // Temp holding variable
      }
    });

    // Remove the temp variable for insertion
    const dbQuests = questsToPrepare.map((q: any) => {
      const { __depends_on_index, ...rest } = q;
      return rest;
    });

    // 2. Insert quests and immediately SELECT them to get their UUIDs
    const { data: insertedQuests, error: questsError } = await supabaseClient.from('quests').insert(dbQuests).select()
    if (questsError) throw new Error(`Database Error (Quests): ${questsError.message}`)

    // ==========================================
    // PHASE 17: DEPENDENCY MAPPER
    // ==========================================
    const dependenciesToInsert: any[] = [];

    questsToPrepare.forEach((q: any, i: number) => {
      const depIndex = q.__depends_on_index;
      if (depIndex !== null && depIndex !== undefined && typeof depIndex === 'number' && depIndex >= 0 && depIndex < insertedQuests.length && depIndex !== i) {
        dependenciesToInsert.push({
          quest_id: insertedQuests[i].id,
          depends_on_quest_id: insertedQuests[depIndex].id
        });
      }
    });

    // 3. Batch insert the dependencies
    if (dependenciesToInsert.length > 0) {
      const { error: depError } = await supabaseClient.from('quest_dependencies').insert(dependenciesToInsert);
      if (depError) console.error("Dependency Linking Failed:", depError.message);
    }

    return new Response(JSON.stringify({ success: true, path: pathData, strategy }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})

function determineVerificationType(quest: Record<string, unknown>, goal: string, hunterContext?: Record<string, unknown> | null): string {
  const text = [
    goal,
    hunterContext?.primary_aim,
    quest.title,
    quest.description,
    quest.stat_focus,
  ].filter(Boolean).join(' ').toLowerCase();

  if (containsAny(text, [
    'github', 'git ', 'commit', 'pull request', 'pr ', 'repo', 'repository', 'code', 'coding',
    'software', 'bug', 'feature', 'test suite', 'typescript', 'javascript', 'python', 'api',
    'component', 'app', 'website', 'deploy'
  ])) {
    return 'github';
  }

  if (containsAny(text, [
    'run', 'running', 'walk', 'walking', 'steps', 'cardio', 'workout', 'exercise', 'gym',
    'lift', 'lifting', 'reps', 'sets', 'squat', 'pushup', 'pullup', 'plank', 'bike',
    'cycling', 'swim', 'heart rate', 'calories', 'fitbit', 'strava'
  ])) {
    return containsAny(text, ['steps', 'run', 'walk', 'cardio', 'heart rate', 'calories', 'distance', 'fitbit', 'strava'])
      ? 'fitbit'
      : 'photo';
  }

  if (containsAny(text, [
    'document', 'doc', 'draft', 'essay', 'article', 'post', 'publish', 'portfolio', 'design',
    'figma', 'notion', 'spreadsheet', 'sheet', 'slides', 'presentation', 'demo', 'landing page',
    'resume', 'application'
  ])) {
    return 'url';
  }

  if (containsAny(text, [
    'clean', 'organize', 'room', 'desk', 'equipment', 'meal', 'cook', 'prep', 'setup',
    'before', 'after', 'repair', 'install', 'arrange'
  ])) {
    return 'photo';
  }

  return normalizeVerificationType(quest.verification_type);
}

function containsAny(value: string, needles: string[]): boolean {
  return needles.some(needle => value.includes(needle));
}

function normalizeVerificationType(input: unknown): string {
  const allowed = new Set(['text', 'url', 'photo', 'github', 'fitbit']);
  const value = typeof input === 'string' ? input.toLowerCase() : '';
  if (allowed.has(value) && value !== 'none') return value;

  return 'text';
}
