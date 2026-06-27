import type { AiDecisionProvider } from '@/lib/intel/ai-decision-provider';
import type { IntelDecisionInput, IntelDecisionResult } from '@/lib/intel/types';
import { scoreVendorAgainstEvent, platformEventToMatchProfile } from '@/lib/intel/matching';
import { mockPlatformEvents } from '@/lib/platform-data';
import { getOrCreatePassport } from '@/lib/vendor-passport-store';
import { validatePassport } from '@/lib/vendor-passport';

export class RuleBasedDecisionProvider implements AiDecisionProvider {
  readonly lane = 'rule-based' as const;
  readonly modelVersion = 'rules-v1';

  async evaluate(input: IntelDecisionInput): Promise<IntelDecisionResult> {
    const passport = input.passport ?? getOrCreatePassport(input.vendorEmail);
    const event =
      input.eventProfile ??
      platformEventToMatchProfile(
        mockPlatformEvents.find(e => e.id === input.eventId) ?? mockPlatformEvents[0]
      );

    const match = scoreVendorAgainstEvent(passport, event, input.geo);
    const validation = validatePassport(passport);

    const passedLabels = match.rules.filter(r => r.passed).map(r => r.label);
    const failedLabels = match.rules.filter(r => !r.passed).map(r => r.detail);

    return {
      lane: this.lane,
      modelVersion: this.modelVersion,
      score: match.score,
      label: match.label,
      rules: match.rules,
      qualitativeSummary: `${match.score}% match — ${passedLabels.slice(0, 2).join(', ')}${failedLabels.length ? `. Watch: ${failedLabels[0]}` : ''}`,
      confidence: validation.score / 100,
      readyForMatching: validation.readyForMatching && match.score >= 75,
    };
  }
}

export const ruleBasedProvider = new RuleBasedDecisionProvider();
