import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { proof, quest_title, quest_type } = await req.json()

    if (!proof || proof.trim() === '') {
      return new Response(JSON.stringify({ success: true, adjustment: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
      })
    }

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
    if (!OPENROUTER_API_KEY) throw new Error("Missing OpenRouter API Key.")

    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions'

    const systemPrompt = `You are the Quality Assurance Auditor for the NYXIS system.
Your job is to evaluate the evidence submitted by a user for completing a quest.

Quest Context: "${quest_title}" (Type: ${quest_type})
Submitted Proof: "${proof}"

Rules:
Evaluate the quality, effort, and relevance of the proof.
- If the proof is lazy, nonsensical, or clearly faked: adjustment = -5
- If the proof is basic but acceptable: adjustment = 0
- If the proof contains excellent detail, specific metrics, or high effort: adjustment = +5

Output a raw JSON object with a single key "adjustment" containing an integer between -5 and 5.`

    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENROUTER_API_KEY}` },
      body: JSON.stringify({ model: "openai/gpt-4o-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: systemPrompt }] })
    })

    if (!aiResponse.ok) throw new Error(`QA API Error: ${await aiResponse.text()}`)

    const aiData = await aiResponse.json()
    const result = JSON.parse(aiData.choices[0].message.content)

    // HARD CLAMP: Enforce the bounds safely inside the TS layer as well
    const safeAdjustment = Math.max(-5, Math.min(5, parseInt(result.adjustment) || 0))

    return new Response(JSON.stringify({ success: true, adjustment: safeAdjustment }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    })

  } catch (error: any) {
    console.error(`[QA Auditor] FAILED:`, error.message);
    return new Response(JSON.stringify({ success: true, adjustment: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
    })
  }
})