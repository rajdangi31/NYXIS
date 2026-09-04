import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { proof, quest_title, quest_type, verification_type } = await req.json()
    const verificationType = String(verification_type || 'text').toLowerCase()

    if (!proof || proof.trim() === '') {
      return new Response(JSON.stringify({
        success: true,
        accepted: false,
        score: 0,
        reason: 'No proof was submitted.',
        missing: ['proof'],
        adjustment: -5,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
      })
    }

    const deterministic = preflightProof(proof, verificationType)

    if (!deterministic.accepted && deterministic.blocking) {
      return new Response(JSON.stringify({
        success: true,
        accepted: false,
        score: deterministic.score,
        reason: deterministic.reason,
        missing: deterministic.missing,
        adjustment: -3,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
      })
    }

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
    if (!OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({
        success: true,
        accepted: deterministic.accepted,
        score: deterministic.score,
        reason: deterministic.accepted
          ? 'Proof accepted by deterministic evidence checks; AI audit is unavailable.'
          : deterministic.reason,
        missing: deterministic.missing,
        adjustment: deterministic.accepted ? 0 : -3,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
      })
    }

    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions'

    const systemPrompt = `You are the Quality Assurance Auditor for the NYXIS system.
Your job is to evaluate the evidence submitted by a user for completing a quest.

Quest Context: "${quest_title}" (Type: ${quest_type})
Required Verification Type: ${verificationType}
Submitted Proof: "${proof}"

Rules:
Evaluate whether the proof actually satisfies the required verification type and the quest.

Verification type rules:
- github: require a repository URL plus a specific commit link, pull request link, or branch/commit reference. Reject vague claims without GitHub evidence.
- fitbit: require traceable fitness data such as activity URL, workout ID, steps, duration, distance, calories, heart-rate zone, or device screenshot reference.
- photo: require photo evidence context such as what the image shows, when it was taken, equipment/result visible, or before/after state.
- url: require a shareable artifact URL and an explanation of how it proves completion.
- text: require concrete, measurable details. Reject generic claims like "done" or "I completed it."

Scoring:
- 0-39: reject. Missing required proof, irrelevant, fake-looking, or too vague.
- 40-69: accept only if the required evidence is present but basic.
- 70-89: strong accepted proof.
- 90-100: exceptional accepted proof with detailed, specific evidence.

Output a raw JSON object:
{
  "accepted": Boolean,
  "score": Number from 0 to 100,
  "reason": "One concise sentence explaining the verdict.",
  "missing": ["short missing requirement strings"],
  "adjustment": Integer from -5 to 5
}`

    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENROUTER_API_KEY}` },
      body: JSON.stringify({ model: "openai/gpt-4o-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: systemPrompt }] })
    })

    if (!aiResponse.ok) throw new Error(`QA API Error: ${await aiResponse.text()}`)

    const aiData = await aiResponse.json()
    const result = JSON.parse(aiData.choices[0].message.content)

    // HARD CLAMP: Enforce the bounds safely inside the TS layer as well
    const safeScore = Math.max(0, Math.min(100, parseInt(result.score) || 0))
    const safeAdjustment = Math.max(-5, Math.min(5, parseInt(result.adjustment) || 0))
    const accepted = deterministic.accepted
      ? (Boolean(result.accepted) || safeScore >= 40 || deterministic.score >= 55)
      : false

    const finalScore = deterministic.accepted
      ? Math.max(safeScore, deterministic.score)
      : Math.min(safeScore, deterministic.score)

    return new Response(JSON.stringify({
      success: true,
      accepted,
      score: finalScore,
      reason: accepted
        ? (typeof result.reason === 'string' ? result.reason : 'Proof contains the required evidence.')
        : (typeof result.reason === 'string' ? result.reason : deterministic.reason),
      missing: accepted ? [] : mergeMissing(deterministic.missing, result.missing),
      adjustment: safeAdjustment,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    })

  } catch (error: any) {
    console.error(`[QA Auditor] FAILED:`, error.message);
    return new Response(JSON.stringify({
      success: false,
      accepted: false,
      score: 0,
      reason: 'Proof audit engine failed. Completion was blocked to protect system integrity.',
      missing: ['proof audit unavailable'],
      adjustment: 0,
      error: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
    })
  }
})

function preflightProof(proof: string, verificationType: string) {
  const text = proof.toLowerCase()
  const missing: string[] = []
  const hasSummary = /completion summary:\s*(?!not provided).{12,}/i.test(proof)
  const hasEvidence = !/evidence.*:\s*not provided/i.test(proof) && !/url:\s*not provided/i.test(proof) && !/reference:\s*not provided/i.test(proof)
  const hasMetric = /metric or measurable result:\s*(?!not provided).{3,}/i.test(proof)
  const hasReality = /hard-to-fake detail:\s*(?!not provided).{10,}/i.test(proof)
  const hasRealityAnchorUrl = /reality anchor url:\s*https?:\/\/[^\s)]+/i.test(proof)
  const hasUrl = hasRealityAnchorUrl || /https?:\/\/[^\s)]+/i.test(proof) || /\b[a-z0-9.-]+\.[a-z]{2,}[^\s)]*/i.test(proof)
  const hasGithub = /github\.com/i.test(text)
  const hasCommitOrPr = /(\/commit\/|\/pull\/|\/pr\/|commit|pull request|branch)/i.test(proof)
  const hasFitnessMetric = /\b(\d+\s*(min|minute|minutes|hr|hour|hours|km|mi|mile|miles|steps|cal|calories|bpm|reps|sets|lbs|kg)|zone\s*\d)\b/i.test(proof)

  if (!hasSummary) missing.push('completion summary')

  if (verificationType === 'github') {
    if (!hasGithub) missing.push('GitHub repository URL')
    if (!hasCommitOrPr) missing.push('commit, pull request, or branch reference')
    if (!hasMetric) missing.push('measurable code result')
  } else if (verificationType === 'url') {
    if (!hasUrl) missing.push('shareable artifact URL')
    if (!hasSummary) missing.push('explanation of what the URL proves')
  } else if (verificationType === 'fitbit') {
    if (!hasEvidence) missing.push('fitness source or activity reference')
    if (!hasFitnessMetric && !hasMetric) missing.push('traceable fitness metric')
  } else if (verificationType === 'photo') {
    if (!hasEvidence) missing.push('photo reference or upload note')
    if (!hasMetric && !hasReality) missing.push('timestamp, visible result, or before/after detail')
  } else {
    if (!hasMetric && !hasReality) missing.push('measurable result or hard-to-fake detail')
  }

  const accepted = missing.length === 0
  return {
    accepted,
    blocking: !accepted,
    score: accepted && verificationType === 'url' ? 82 : accepted ? 72 : Math.max(10, 42 - missing.length * 10),
    reason: accepted
      ? verificationType === 'url'
        ? 'URL proof includes a shareable reality anchor and completion context.'
        : 'Proof includes the required structured evidence fields.'
      : 'Proof is missing required evidence for this verification type.',
    missing,
  }
}

function mergeMissing(primary: string[], secondary: unknown) {
  const merged = [...primary]
  if (Array.isArray(secondary)) {
    for (const item of secondary) {
      const value = String(item)
      if (value && !merged.includes(value)) merged.push(value)
    }
  }
  return merged.slice(0, 6)
}
