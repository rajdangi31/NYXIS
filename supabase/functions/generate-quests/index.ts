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
      // Pass memories into the payload
      body: { goal, stats: { str: profile.str, int: profile.int, dex: profile.dex, vit: profile.vit, wis: profile.wis }, pressure: profile.pressure_level, performance: successRate, behavior, memories }
    });

    if (strategistErr || !strategistRes.success) throw new Error(`Strategist Failure: ${strategistErr?.message || strategistRes.error}`);
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

    // NEW: We specifically request `depends_on_index` to build progression logic natively
    const systemPrompt = `You are The Architect of the NYXIS system. Generate exactly 10 actionable quests for: "${goal}".

CRITICAL STRATEGY DIRECTIVES:
- Focus Area: ${strategy.focus_area}
- Intensity: ${strategy.intensity}
- Quest Bias: ${strategy.quest_bias}
- Progression Chains: If tasks logically follow one another (e.g. Step A must happen before Step B), use 'depends_on_index' to link them.
${enforcementPrompt}

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

    const aiData = await aiResponse.json()
    let parsedData: { quests: any[] }
    try {
      parsedData = JSON.parse(aiData.choices[0].message.content)
    } catch {
      throw new Error('AI returned unparseable response')
    }

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
        verification_required: q.verification_required || false,
        verification_type: q.verification_type || null,
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
    // Supabase array inserts return rows in the exact order they were provided.
    const { data: insertedQuests, error: questsError } = await supabaseClient.from('quests').insert(dbQuests).select()
    if (questsError) throw new Error(`Database Error (Quests): ${questsError.message}`)

    // ==========================================
    // PHASE 17: DEPENDENCY MAPPER
    // ==========================================
    const dependenciesToInsert: any[] = [];

    questsToPrepare.forEach((q: any, i: number) => {
      const depIndex = q.__depends_on_index;
      // Verify the AI returned a valid index (not itself, not out of bounds)
      if (depIndex !== null && depIndex !== undefined && typeof depIndex === 'number' && depIndex >= 0 && depIndex < insertedQuests.length && depIndex !== i) {
        dependenciesToInsert.push({
          quest_id: insertedQuests[i].id,               // The quest that is locked
          depends_on_quest_id: insertedQuests[depIndex].id // The quest that must be cleared first
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