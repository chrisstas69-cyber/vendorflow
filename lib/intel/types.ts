export interface MatchRuleResult {
  id: string;
  label: string;
  passed: boolean;
  weight: number;
  detail: string;
}

export interface IntelDecisionInput {
  vendorEmail: string;
  eventId: string;
  eventName?: string;
  passport?: import('@/lib/vendor-passport').VendorPassport;
  eventProfile?: import('@/lib/intel/matching').EventMatchProfile;
  geo?: { maxRadiusMiles?: number; vendorLat?: number; vendorLng?: number };
}

export interface IntelDecisionResult {
  lane: 'rule-based' | 'external-model';
  modelVersion: string;
  score: number;
  label: string;
  rules: MatchRuleResult[];
  qualitativeSummary?: string;
  aiReasoning?: string;
  confidence?: number;
  readyForMatching?: boolean;
}

export interface AiInsightPayload {
  score: number;
  label: string;
  rules: MatchRuleResult[];
  qualitativeSummary?: string;
  aiReasoning?: string;
  vendorEmail?: string;
  eventId?: string;
}
