import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { goal, stats, pressure, performance, behavior, memories, hunterContext } = await req.json()
    if (!goal || !stats) throw new Error('Goal and stats are required.')

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
    if (!OPENROUTER_API_KEY) throw new Error("Missing OpenRouter API Key.")

    // Format memories for the prompt
    const memoryContext = memories && memories.length > 0
      ? memories.map((m: any) => `- [${m.event_type.toUpperCase()}]: ${m.description}`).join('\n')
      : "No significant memories established yet.";

    const intakeContext = hunterContext
      ? `Primary Aim: ${hunterContext.primary_aim}
Current Conditions: ${hunterContext.current_conditions || 'Not specified'}
Constraints: ${hunterContext.constraints || 'Not specified'}
Available Time: ${hunterContext.available_time || 'Not specified'}
Preferred Intensity: ${hunterContext.preferred_intensity}`
      : 'No Hunter intake record found.';

    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions'

    const systemPrompt = `You are the Strategist layer of the NYXIS system.
Your job is to analyze the Hunter's current state and dictate the parameters for their next Quest Path.

CURRENT STATE:
Goal: "${goal}"
Stats: STR ${stats.str}, INT ${stats.int}, DEX ${stats.dex}, VIT ${stats.vit}, WIS ${stats.wis}
Shadow Pressure: ${pressure}% 
Recent Success Rate: ${performance}%

HUNTER INTAKE:
${intakeContext}

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
   - IF Hunter Preferred Intensity is LOW, do not exceed MEDIUM unless the goal is urgent.
   - IF Hunter Preferred Intensity is HIGH and Pressure < 60%, prefer HIGH.
3. "quest_bias": Choose ONE (LEARNING, EXECUTION, DISCOMFORT, CONSISTENCY).
   - IF Avoidance > 60% OR Memory shows "avoidance_pattern", force DISCOMFORT.
   - IF Consistency < 40% OR Memory shows "failure_pattern", force CONSISTENCY.

Output a raw JSON object with exactly those three keys. No markdown. No quotes.`

    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENROUTER_API_KEY}` },
      body: JSON.stringify({ model: "openai/gpt-4o-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: systemPrompt }] })
    })

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json();
      const errorMsg = errorData.error?.message || errorData.error || 'AI request failed';
      throw new Error(`OpenRouter Error: ${errorMsg}`);
    }

    const aiData = await aiResponse.json()
    if (!aiData.choices || aiData.choices.length === 0) {
      throw new Error('AI returned no choices. Check your credits or model availability.');
    }

    let strategy = { focus_area: 'STR', intensity: 'MEDIUM', quest_bias: 'EXECUTION' }
    try {
      strategy = JSON.parse(aiData.choices[0].message.content)
    } catch {
      console.error('[Strategist] Failed to parse AI response:', aiData.choices[0].message.content)
      throw new Error('AI returned unparseable strategy content.');
    }

    return new Response(JSON.stringify({ success: true, strategy }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error: any) {
    console.error('[Strategist Error]:', error.message)
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
