import { getSafeSession, supabase } from './supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';
import type {
  ApiResult,
  QuestCompletionResult,
  QuestFailResult,
  PenaltyResult,
  EvalResult,
  ProofEvalResult,
  HunterContext,
  HunterContextInput,
} from './types';

/** Supabase returns a generic message for non-2xx; parse JSON body when present. */
async function describeFunctionInvokeError(err: unknown): Promise<string> {
  if (err instanceof FunctionsHttpError && err.context instanceof Response) {
    const res = err.context;
    try {
      const ct = res.headers.get('Content-Type') ?? '';
      if (ct.includes('application/json')) {
        const body = (await res.clone().json()) as {
          error?: string;
          message?: string;
        };
        if (typeof body.error === 'string') return body.error;
        if (typeof body.message === 'string') return body.message;
      } else {
        const text = (await res.clone().text()).trim();
        if (text) return text.slice(0, 500);
      }
    } catch {
      /* use fallback */
    }
    return `${err.message} (HTTP ${res.status})`;
  }
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

function describeSupabaseError(err: unknown): string {
  const error = err as { code?: string; message?: string; details?: string; hint?: string };
  return [error.code, error.message, error.details, error.hint].filter(Boolean).join(' - ') || 'Unknown Supabase error';
}

function isRpcSignatureError(err: unknown): boolean {
  const error = err as { code?: string; message?: string; details?: string; hint?: string };
  const message = `${error.code ?? ''} ${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();
  return (
    error.code === 'PGRST202' ||
    message.includes('could not find the function') ||
    message.includes('schema cache') ||
    message.includes('complete_quest_with_proof')
  );
}

function extractFirstUrl(value: string): string | null {
  return value.match(/https?:\/\/[^\s)]+/i)?.[0] ?? null;
}

export async function logExternalSignal(
  source: string,
  signalType: string,
  value: Record<string, unknown> = {}
): Promise<ApiResult> {
  try {
    const { error } = await supabase.rpc('log_external_signal', {
      p_source: source,
      p_signal_type: signalType,
      p_value: value,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function processTimePenalties(): Promise<ApiResult<PenaltyResult>> {
  try {
    const { data, error } = await supabase.rpc('process_time_penalties');
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as PenaltyResult };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function evaluateProofQuality(
  proof: string,
  title: string,
  type: string,
  verificationType: string = 'text'
): Promise<ProofEvalResult> {
  const localAudit = preflightProofQuality(proof, verificationType);
  const proofType = String(verificationType || 'text').toLowerCase();

  if (proofType === 'url' && localAudit.accepted) {
    return {
      ...localAudit,
      score: Math.max(localAudit.score, 82),
      reason: 'URL proof accepted: a shareable reality anchor URL and completion context were provided.',
      missing: [],
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('evaluate-proof-quality', {
      body: { proof, quest_title: title, quest_type: type, verification_type: verificationType },
    });
    if (error)
      return localAudit.accepted ? localAudit : {
        success: false,
        accepted: false,
        score: 0,
        reason: 'Proof audit failed before evaluation.',
        missing: ['proof audit unavailable'],
        adjustment: 0,
        error: await describeFunctionInvokeError(error),
      };
    const remoteAudit = {
      success: data.success !== false,
      accepted: Boolean(data.accepted),
      score: Number(data.score) || 0,
      reason: typeof data.reason === 'string' ? data.reason : 'Proof audit completed.',
      missing: Array.isArray(data.missing) ? data.missing.map(String) : [],
      adjustment: Number(data.adjustment) || 0,
      error: typeof data.error === 'string' ? data.error : undefined,
    };
    if (!remoteAudit.accepted && localAudit.accepted) {
      return {
        ...localAudit,
        reason: `${localAudit.reason} Remote audit was stricter than the visible evidence, so NYXIS accepted the structured proof.`,
      };
    }
    return remoteAudit;
  } catch {
    return localAudit.accepted ? localAudit : {
      success: false,
      accepted: false,
      score: 0,
      reason: 'Proof audit failed unexpectedly.',
      missing: ['proof audit unavailable'],
      adjustment: 0,
    };
  }
}

function preflightProofQuality(proof: string, verificationType: string = 'text'): ProofEvalResult {
  const proofType = String(verificationType || 'text').toLowerCase();
  const hasRealityAnchorUrl = /reality anchor url:\s*https?:\/\/[^\s)]+/i.test(proof);
  const hasUrl = hasRealityAnchorUrl || /https?:\/\/[^\s)]+/i.test(proof) || /\b[a-z0-9.-]+\.[a-z]{2,}[^\s)]*/i.test(proof);
  const hasGithub = /github\.com/i.test(proof);
  const hasCommitOrPr = /(\/commit\/|\/pull\/|\/pr\/|commit|pull request|branch)/i.test(proof);
  const hasSummary = /completion summary:\s*(?!not provided).{8,}/i.test(proof);
  const hasMetric = /metric or measurable result:\s*(?!not provided).{3,}/i.test(proof);
  const hasReality = /hard-to-fake detail:\s*(?!not provided).{8,}/i.test(proof);
  const hasFitnessMetric = /\b(\d+\s*(min|minute|minutes|hr|hour|hours|km|mi|mile|miles|steps|cal|calories|bpm|reps|sets|lbs|kg)|zone\s*\d)\b/i.test(proof);

  const missing: string[] = [];
  if (!hasSummary) missing.push('completion summary');

  if (proofType === 'url') {
    if (!hasUrl) missing.push('shareable URL');
  } else if (proofType === 'github') {
    if (!hasGithub) missing.push('GitHub URL');
    if (!hasCommitOrPr) missing.push('commit, PR, or branch reference');
  } else if (proofType === 'fitbit') {
    if (!hasFitnessMetric && !hasMetric) missing.push('traceable fitness metric');
  } else if (proofType === 'photo') {
    if (!hasUrl && !hasReality) missing.push('photo reference or contextual detail');
  } else if (!hasMetric && !hasReality && !hasUrl) {
    missing.push('measurable result or hard-to-fake detail');
  }

  const accepted = missing.length === 0;
  return {
    success: true,
    accepted,
    score: accepted ? 72 : Math.max(10, 42 - missing.length * 10),
    reason: accepted
      ? 'Proof contains the required structured evidence.'
      : 'Proof is missing required evidence for this verification type.',
    missing,
    adjustment: 0,
  };
}

export async function completeQuestWithProof(
  questId: string,
  proof: string = '',
  title: string = '',
  type: string = '',
  score: number = 100,
  verificationType: string = 'text'
): Promise<ApiResult<QuestCompletionResult>> {
  try {
    let aiAdjustment = 0;
    let proofAudit: ProofEvalResult | undefined;
    if (proof.trim() !== '') {
      const evaluation = await evaluateProofQuality(proof, title, type, verificationType);
      proofAudit = evaluation;
      if (!evaluation.accepted) {
        return {
          success: false,
          error: evaluation.reason || 'Proof rejected.',
          data: {
            xp_awarded: 0,
            stat_changes: { stat: 'STR', gained: 0 },
            completion_score: 0,
            pressure_relieved: 0,
            system_state: 'NORMAL',
            ai_adjustment: evaluation.adjustment,
            proof_audit: evaluation,
          },
        };
      }
      if (evaluation.success) aiAdjustment = evaluation.adjustment;
    }

    const normalizedVerificationType = String(verificationType || 'text').toLowerCase();
    if (
      proofAudit?.accepted &&
      normalizedVerificationType !== 'text' &&
      normalizedVerificationType !== 'none'
    ) {
      const signal = await logExternalSignal('proof_submission', normalizedVerificationType, {
        quest_id: questId,
        quest_title: title,
        quest_type: type,
        verification_type: normalizedVerificationType,
        url: extractFirstUrl(proof),
        submitted_at: new Date().toISOString(),
      });

      if (!signal.success) {
        return {
          success: false,
          error: `Reality anchor could not be logged: ${signal.error || 'unknown signal error'}`,
          data: {
            xp_awarded: 0,
            stat_changes: { stat: 'STR', gained: 0 },
            completion_score: 0,
            pressure_relieved: 0,
            system_state: 'NORMAL',
            ai_adjustment: aiAdjustment,
            proof_audit: proofAudit,
          },
        };
      }
    }

    let { data, error } = await supabase.rpc('complete_quest_with_proof', {
      p_quest_id: questId,
      p_proof_submitted: proof || null,
      p_completion_score: score,
      p_ai_adjustment: aiAdjustment,
    });

    if (error && isRpcSignatureError(error)) {
      const fallback = await supabase.rpc('complete_quest_with_proof', {
        p_quest_id: questId,
        p_proof_submitted: proof || null,
        p_completion_score: score,
      });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) return { success: false, error: describeSupabaseError(error) };
    return { success: true, data: { ...data, ai_adjustment: aiAdjustment, proof_audit: proofAudit } as QuestCompletionResult };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function failQuest(questId: string): Promise<ApiResult<QuestFailResult>> {
  try {
    const { data, error } = await supabase.rpc('fail_quest', { p_quest_id: questId });
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as QuestFailResult };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function evaluateHunter(): Promise<EvalResult> {
  try {
    const { data, error } = await supabase.functions.invoke('evaluate-hunter');
    if (error) return { success: false, error: await describeFunctionInvokeError(error) };
    if (data.pending) return { success: true, pending: true, message: data.message };
    return { success: true, pending: false, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function generateQuestPath(goal: string): Promise<ApiResult> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-quests', { body: { goal } });
    if (error) return { success: false, error: await describeFunctionInvokeError(error) };
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function getHunterContext(): Promise<ApiResult<HunterContext | null>> {
  try {
    const { session } = await getSafeSession();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const { data, error } = await supabase
      .from('hunter_contexts')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    return { success: true, data: (data as HunterContext | null) ?? null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function saveHunterContext(input: HunterContextInput): Promise<ApiResult<HunterContext>> {
  try {
    const { session } = await getSafeSession();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const { data, error } = await supabase
      .from('hunter_contexts')
      .upsert({
        user_id: session.user.id,
        ...input,
      }, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as HunterContext };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}
