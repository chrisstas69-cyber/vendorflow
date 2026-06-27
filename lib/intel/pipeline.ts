import { prisma } from '@/lib/prisma';
import { mergeDecisions, insightFromDecision } from '@/lib/intel/ai-decision-provider';
import { claudeExternalProvider } from '@/lib/intel/providers/claude-external';
import { ruleBasedProvider } from '@/lib/intel/providers/rule-based';
import type { IntelDecisionInput } from '@/lib/intel/types';
import { mockPlatformEvents } from '@/lib/platform-data';

const INSIGHT_TTL_HOURS = 24;

export async function runIntelPipeline(input: IntelDecisionInput, options?: { skipCache?: boolean; useAi?: boolean }) {
  const scopeId = `${input.vendorEmail}:${input.eventId}`;

  if (!options?.skipCache) {
    const cached = await prisma.aIInsight.findFirst({
      where: {
        scopeType: 'match',
        scopeId,
        status: 'active',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });
    if (cached) {
      return {
        cached: true,
        insight: cached,
        result: JSON.parse(cached.payload),
      };
    }
  }

  const baseline = await ruleBasedProvider.evaluate(input);
  const enhanced = options?.useAi !== false ? await claudeExternalProvider.evaluate(input) : undefined;
  const result = mergeDecisions(baseline, enhanced);

  const insightData = insightFromDecision(
    { ...input, eventName: input.eventName ?? mockPlatformEvents.find(e => e.id === input.eventId)?.name },
    result
  );

  const expiresAt = new Date(Date.now() + INSIGHT_TTL_HOURS * 60 * 60 * 1000);

  const insight = await prisma.aIInsight.create({
    data: {
      ...insightData,
      expiresAt,
    },
  });

  return { cached: false, insight, result };
}

export async function refreshEventInsights(eventId: string) {
  const event = mockPlatformEvents.find(e => e.id === eventId);
  if (!event) throw new Error('Event not found');

  const vendorEmails = ['vendor@demo.vendorflow.app'];
  const results = [];

  for (const vendorEmail of vendorEmails) {
    const r = await runIntelPipeline(
      { vendorEmail, eventId, eventName: event.name },
      { skipCache: true, useAi: true }
    );
    results.push(r);
  }

  await prisma.aIInsight.updateMany({
    where: {
      scopeType: 'event',
      scopeId: eventId,
      status: 'active',
    },
    data: { status: 'expired' },
  });

  const eventInsight = await prisma.aIInsight.create({
    data: {
      scopeType: 'event',
      scopeId: eventId,
      insightType: 'risk_score',
      title: `${event.name} — intelligence refresh`,
      summary: `Refreshed ${results.length} vendor match insight(s) for this event.`,
      payload: JSON.stringify({ eventId, refreshedAt: new Date().toISOString(), matchCount: results.length }),
      modelVersion: 'pipeline-v1',
      confidence: 0.9,
      expiresAt: new Date(Date.now() + INSIGHT_TTL_HOURS * 60 * 60 * 1000),
    },
  });

  return { eventInsight, matches: results };
}
