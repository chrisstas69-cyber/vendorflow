import type { AiInsightPayload, IntelDecisionInput, IntelDecisionResult } from '@/lib/intel/types';

/** Abstract execution lane — rule-based baseline vs external model */
export interface AiDecisionProvider {
  readonly lane: 'rule-based' | 'external-model';
  readonly modelVersion: string;

  evaluate(input: IntelDecisionInput): Promise<IntelDecisionResult>;
}

export function mergeDecisions(
  baseline: IntelDecisionResult,
  enhanced?: IntelDecisionResult
): IntelDecisionResult {
  if (!enhanced) return baseline;
  return {
    ...baseline,
    qualitativeSummary: enhanced.qualitativeSummary ?? baseline.qualitativeSummary,
    aiReasoning: enhanced.aiReasoning ?? baseline.aiReasoning,
    confidence: enhanced.confidence ?? baseline.confidence,
    modelVersion: enhanced.modelVersion,
    lane: enhanced.lane,
  };
}

export function insightFromDecision(
  input: IntelDecisionInput,
  result: IntelDecisionResult
): {
  scopeType: string;
  scopeId: string;
  insightType: string;
  title: string;
  summary: string;
  payload: string;
  modelVersion: string;
  confidence: number;
} {
  const payload: AiInsightPayload = {
    score: result.score,
    label: result.label,
    rules: result.rules,
    qualitativeSummary: result.qualitativeSummary,
    aiReasoning: result.aiReasoning,
    vendorEmail: input.vendorEmail,
    eventId: input.eventId,
  };

  return {
    scopeType: 'match',
    scopeId: `${input.vendorEmail}:${input.eventId}`,
    insightType: 'match_recommendation',
    title: `${result.score}% Match — ${input.eventName}`,
    summary: result.qualitativeSummary ?? result.label,
    payload: JSON.stringify(payload),
    modelVersion: result.modelVersion,
    confidence: result.confidence ?? result.score / 100,
  };
}
