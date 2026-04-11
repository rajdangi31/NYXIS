import { supabase } from './supabase';
import type {
  ApiResult,
  QuestCompletionResult,
  QuestFailResult,
  PenaltyResult,
  EvalResult,
  ProofEvalResult,
} from './types';

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
  type: string
): Promise<ProofEvalResult> {
  try {
    const { data, error } = await supabase.functions.invoke('evaluate-proof-quality', {
      body: { proof, quest_title: title, quest_type: type },
    });
    if (error) return { success: false, adjustment: 0 };
    return { success: true, adjustment: data.adjustment };
  } catch {
    return { success: false, adjustment: 0 };
  }
}

export async function completeQuestWithProof(
  questId: string,
  proof: string = '',
  title: string = '',
  type: string = '',
  score: number = 100
): Promise<ApiResult<QuestCompletionResult>> {
  try {
    let aiAdjustment = 0;
    if (proof.trim() !== '') {
      const evaluation = await evaluateProofQuality(proof, title, type);
      if (evaluation.success) aiAdjustment = evaluation.adjustment;
    }
    const { data, error } = await supabase.rpc('complete_quest_with_proof', {
      p_quest_id: questId,
      p_proof_submitted: proof || null,
      p_completion_score: score,
      p_ai_adjustment: aiAdjustment,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data: { ...data, ai_adjustment: aiAdjustment } as QuestCompletionResult };
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
    if (error) return { success: false, error: error.message };
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
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}