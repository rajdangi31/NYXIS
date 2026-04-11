import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { goal, stats, pressure, performance, behavior, memories } = await req.json()
    if (!goal || !stats) throw new Error('Goal and stats are required.')

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
    if (!OPENROUTER_API_KEY) throw new Error("Missing OpenRouter API Key.")

    // Format memories for the prompt
    const memoryContext = memories && memories.length > 0
      ? memories.map((m: any) => `- [${m.event_type.toUpperCase()}]: ${m.description}`).join('\n')
      : "No significant memories established yet.";

    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions'

    const systemPrompt = `You are the Strategist layer of the NYXIS system.
Your job is to analyze the Hunter's current state and dictate the parameters for their next Quest Path.

CURRENT STATE:
Goal: "${goal}"
Stats: STR ${stats.str}, INT ${stats.int}, DEX ${stats.dex}, VIT ${stats.vit}, WIS ${stats.wis}
Shadow Pressure: ${pressure}% 
Recent Success Rate: ${performance}%

BEHAVIORAL PROFILE:
Consistency: ${behavior.consistency_score}/100
Avoidance: ${behavior.avoidance_score}/100
Intensity: ${behavior.intensity_score}/100

LONG-TERM MEMORY (Recent Historical Patterns):
${memoryContext}

RULES FOR STRATEGY:
1. "focus_area": Choose ONE (STR, INT, DEX, VIT, WIS) that logically aligns with the goal.
2. "intensity": Choose ONE (LOW, MEDIUM, HIGH).
   - IF Pressure > 60%, force LOW to ensure survival.
   - IF Consistency < 40%, force LOW to rebuild habits.
   - IF Intensity > 70% OR Memory shows "success_pattern", force HIGH (Generate Boss Trials).
3. "quest_bias": Choose ONE (LEARNING, EXECUTION, DISCOMFORT, CONSISTENCY).
   - IF Avoidance > 60% OR Memory shows "avoidance_pattern", force DISCOMFORT.
   - IF Consistency < 40% OR Memory shows "failure_pattern", force CONSISTENCY.

Output a raw JSON object with exactly those three keys. No markdown. No quotes.`

    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENROUTER_API_KEY}` },
      body: JSON.stringify({ model: "openai/gpt-4o-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: systemPrompt }] })
    })

    const aiData = await aiResponse.json()
    let strategy = { focus_area: 'STR', intensity: 'MEDIUM', quest_bias: 'EXECUTION' }
    try {
      strategy = JSON.parse(aiData.choices[0].message.content)
    } catch {
      console.error('[Strategist] Failed to parse AI response')
    }

    return new Response(JSON.stringify({ success: true, strategy }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})