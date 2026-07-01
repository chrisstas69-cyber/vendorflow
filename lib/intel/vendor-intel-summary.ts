import { listDebriefs } from '@/lib/event-debrief-store';
import { listVendorFinancials } from '@/lib/vendor-financial-store';
import { validatePassport } from '@/lib/vendor-passport';
import { getOrCreatePassport } from '@/lib/vendor-passport-store';
import { mockPlatformEvents } from '@/lib/platform-data';
import { ruleBasedProvider } from '@/lib/intel/providers/rule-based';

export interface VendorIntelSummary {
  trustScore: number;
  dudRisk: number;
  completedEvents: number;
  avgNetProfit: number;
  bestEventProfit: number;
  avgMargin: number;
  fieldReports: { eventName: string; date: string; profit: number; weather?: string; notes: string }[];
  riskBreakdown: { label: string; value: string; note: string }[];
  earningsPeer: { label: string; value: string }[];
}

export async function buildVendorIntelSummary(vendorEmail: string): Promise<VendorIntelSummary> {
  const passport = getOrCreatePassport(vendorEmail);
  const validation = validatePassport(passport);
  const { items: debriefs } = await listDebriefs(vendorEmail);
  const { items: financials } = await listVendorFinancials(vendorEmail);

  const completed = debriefs.filter(d => d.status === 'completed' || d.netProfit != null);
  const profits = financials.map(f => f.netProfit);
  const avgNet = profits.length ? Math.round(profits.reduce((a, b) => a + b, 0) / profits.length) : 0;
  const bestProfit = profits.length ? Math.max(...profits) : 0;
  const margins = financials.map(f => f.margin);
  const avgMargin = margins.length ? Math.round(margins.reduce((a, b) => a + b, 0) / margins.length) : 0;

  const rainyDays = completed.filter(d => (d.weatherPrecipPct ?? 0) >= 40);
  const rainyLoss =
    rainyDays.length >= 2
      ? Math.round(
          rainyDays.reduce((s, d) => s + (d.netProfit ?? 0), 0) / rainyDays.length
        )
      : null;

  let dudRisk = 25;
  if (avgNet < 400) dudRisk += 25;
  if (validation.score < 60) dudRisk += 15;
  if (completed.some(d => d.crowdRating != null && d.crowdRating <= 2)) dudRisk += 10;
  if (rainyLoss != null && rainyLoss < avgNet * 0.7) dudRisk += 10;
  dudRisk = Math.min(85, Math.max(5, dudRisk));

  const trustScore = Math.min(
    99,
    Math.round(validation.score * 0.5 + Math.min(completed.length * 4, 30) + (avgMargin > 50 ? 15 : 5))
  );

  const nextEvent = mockPlatformEvents.find(e => e.listingStatus === 'published');
  let matchNote = 'Complete passport for match scores';
  if (nextEvent) {
    const match = await ruleBasedProvider.evaluate({ vendorEmail, eventId: nextEvent.id });
    matchNote = `${match.score}% match on ${nextEvent.name}`;
  }

  const fieldReports = completed.slice(0, 5).map(d => ({
    eventName: d.eventName,
    date: d.eventDate,
    profit: d.netProfit ?? financials.find(f => f.eventDate === d.eventDate)?.netProfit ?? 0,
    weather: d.weatherSummary,
    notes: d.notes || d.topSellers || 'No notes',
  }));

  return {
    trustScore,
    dudRisk,
    completedEvents: completed.length,
    avgNetProfit: avgNet,
    bestEventProfit: bestProfit,
    avgMargin,
    fieldReports,
    riskBreakdown: [
      { label: 'Passport readiness', value: `${validation.score}%`, note: validation.readyForMatching ? 'Ready' : 'Docs incomplete' },
      { label: 'Rain-day performance', value: rainyLoss != null ? `$${rainyLoss} avg` : '—', note: rainyDays.length ? `${rainyDays.length} rainy events logged` : 'Log weather in debrief' },
      { label: 'Next event match', value: matchNote, note: 'Rule-based score' },
    ],
    earningsPeer: [
      { label: 'Your avg net', value: `$${avgNet.toLocaleString()}` },
      { label: 'Your best event', value: `$${bestProfit.toLocaleString()}` },
      { label: 'Your avg margin', value: `${avgMargin}%` },
    ],
  };
}
