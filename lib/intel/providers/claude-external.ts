import type { AiDecisionProvider } from '@/lib/intel/ai-decision-provider';
import type { IntelDecisionInput, IntelDecisionResult } from '@/lib/intel/types';
import { ruleBasedProvider } from '@/lib/intel/providers/rule-based';
import { mockPlatformEvents } from '@/lib/platform-data';
import { getOrCreatePassport } from '@/lib/vendor-passport-store';

export class ClaudeExternalModelProvider implements AiDecisionProvider {
  readonly lane = 'external-model' as const;
  readonly modelVersion = 'claude-sonnet-emulator-v1';

  async evaluate(input: IntelDecisionInput): Promise<IntelDecisionResult> {
    const baseline = await ruleBasedProvider.evaluate(input);
    const apiKey = process.env.CLAUDE_API_KEY;

    const passport = input.passport ?? getOrCreatePassport(input.vendorEmail);
    const event = mockPlatformEvents.find(e => e.id === input.eventId) ?? mockPlatformEvents[0];

    const contextBlock = JSON.stringify(
      {
        vendor: {
          business: passport.businessName,
          categories: passport.categories,
          tags: passport.serviceTags,
          vehicle: passport.logistics.vehicleType,
          booth: `${passport.logistics.boothWidthFt ?? 10}×${passport.logistics.boothDepthFt ?? 10} ft`,
          docs: passport.documents.map(d => d.type),
        },
        event: {
          name: event.name,
          category: event.category,
          city: event.city,
          slotsOpen: event.vendorSlots - event.vendorSlotsFilled,
          boothFee: event.boothFee,
          footTraffic: event.footTraffic,
        },
        ruleScore: baseline.score,
        ruleBreakdown: baseline.rules,
      },
      null,
      2
    );

    if (!apiKey) {
      return {
        ...baseline,
        lane: this.lane,
        modelVersion: this.modelVersion,
        qualitativeSummary: baseline.qualitativeSummary,
        aiReasoning: `[Demo mode — set CLAUDE_API_KEY for live advice]\n\nBased on ${passport.businessName}'s ${passport.logistics.vehicleType} setup and ${event.name}'s ${event.category} profile, this is a ${baseline.score >= 85 ? 'strong' : 'moderate'} fit. Category alignment and insurance status drive the score. Consider highlighting family-friendly tags if the event skews toward kids/families.`,
        confidence: (baseline.confidence ?? 0.8) * 0.95,
      };
    }

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 512,
          messages: [
            {
              role: 'user',
              content: `You are VendorFlow's organizer decision assistant. Given structured vendor and event data plus rule scores, write 2-3 sentences of qualitative advice for an organizer reviewing this vendor application. Be specific and actionable.\n\n${contextBlock}`,
            },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error(`Claude API ${res.status}`);
      }

      const data = (await res.json()) as { content?: { text?: string }[] };
      const text = data.content?.[0]?.text ?? baseline.qualitativeSummary ?? '';

      return {
        ...baseline,
        lane: this.lane,
        modelVersion: 'claude-sonnet-4-20250514',
        qualitativeSummary: text.split('\n')[0]?.slice(0, 200) ?? baseline.qualitativeSummary,
        aiReasoning: text,
        confidence: Math.min(0.98, (baseline.score / 100) * 0.9 + 0.1),
      };
    } catch {
      return {
        ...baseline,
        lane: this.lane,
        modelVersion: this.modelVersion,
        aiReasoning: `Rule score ${baseline.score}%. Live model unavailable — using deterministic baseline.`,
      };
    }
  }
}

export const claudeExternalProvider = new ClaudeExternalModelProvider();
