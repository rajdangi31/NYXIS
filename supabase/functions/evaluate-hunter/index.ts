import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
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

    const { data: logs } = await supabaseClient.from('quest_logs').select('completed').eq('user_id', user.id).order('timestamp', { ascending: false }).limit(7)

    if (!logs || logs.length < 7) {
      return new Response(JSON.stringify({ success: true, pending: true, message: "Evaluation pending." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const completedCount = logs.filter(l => l.completed).length
    const success_rate = Math.round((completedCount / logs.length) * 100)

    let difficulty_multiplier = 1.0
    let pressure_delta = 0
    let next_state = "NORMAL"

    if (success_rate >= 80) {
      difficulty_multiplier = 1.2
      pressure_delta = -15
      next_state = "FOCUSED"
    } else if (success_rate <= 40) {
      difficulty_multiplier = 0.8
      pressure_delta = +15
      next_state = "PRESSURED"
    } else {
      difficulty_multiplier = 1.0
      pressure_delta = -5
      next_state = "NORMAL"
    }

    const { data: profile } = await supabaseClient.from('profiles').select('pressure_level').eq('id', user.id).single()
    const { data: behavior } = await supabaseClient.from('behavior_profiles').select('avoidance_score, intensity_score').eq('user_id', user.id).single()

    const currentPressure = profile?.pressure_level || 0
    const newPressure = Math.max(0, Math.min(100, currentPressure + pressure_delta))
    if (newPressure >= 80) next_state = "PENALTY"

    // ==========================================
    // PHASE 18: PATTERN DETECTION & MEMORY LOGGING
    // ==========================================
    let memoryToLog = null;

    if (success_rate === 100 && behavior?.intensity_score > 60) {
      memoryToLog = { type: 'success_pattern', desc: 'Hunter executed a flawless cycle with high intensity. Ready for escalation.' };
    } else if (success_rate <= 20) {
      memoryToLog = { type: 'failure_pattern', desc: 'Systemic breakdown detected. Hunter abandoned almost all recent directives.' };
    } else if (behavior?.avoidance_score > 75) {
      memoryToLog = { type: 'avoidance_pattern', desc: 'Hunter is actively dodging high-friction tasks. Cowardice protocol triggered.' };
    }

    if (memoryToLog) {
      await supabaseClient.rpc('log_memory_event', {
        p_user_id: user.id,
        p_event_type: memoryToLog.type,
        p_description: memoryToLog.desc
      });
    }
    // ==========================================

    await supabaseClient.from('profiles').update({ pressure_level: newPressure, system_state: next_state }).eq('id', user.id)

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
    if (!OPENROUTER_API_KEY) throw new Error('Missing OpenRouter API Key.')
    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions'

    const systemPrompt = `You are The Architect of the NYXIS system. The Hunter just completed a 7-quest evaluation cycle.
- Success Rate: ${success_rate}%
- Pressure Change: ${pressure_delta > 0 ? '+' + pressure_delta : pressure_delta}%
- Assigned System State: ${next_state}
${memoryToLog ? `- NEW MEMORY ETCHED: ${memoryToLog.desc}` : ''}

Output a raw JSON object:
1. "message": A 2-sentence performance review. Be intimidating but constructive. Reference the etched memory if one exists.
2. "recommended_focus": Choose ONE stat (STR, INT, DEX, VIT, WIS).`

    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENROUTER_API_KEY}` },
      body: JSON.stringify({ model: "openai/gpt-4o-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: systemPrompt }] })
    })

    const aiData = await aiResponse.json()
    let parsedAI: { message?: string; recommended_focus?: string } = {}
    try {
      parsedAI = JSON.parse(aiData.choices[0].message.content)
    } catch {
      console.error('[Evaluate Hunter] Failed to parse AI response')
    }

    return new Response(JSON.stringify({ success: true, success_rate, difficulty_multiplier, pressure_delta, recommended_focus: parsedAI.recommended_focus || "STR", next_state, message: parsedAI.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})