import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';
import {
  buildDefaultChecklist,
  type EventDebriefRecord,
} from '@/lib/event-debrief-schema';

function debrief(
  partial: Omit<EventDebriefRecord, 'vendorEmail' | 'checklist' | 'createdAt' | 'updatedAt'> & {
    checklist?: EventDebriefRecord['checklist'];
  }
): EventDebriefRecord {
  const now = new Date().toISOString();
  return {
    vendorEmail: DEMO_VENDOR_EMAIL,
    checklist: partial.checklist ?? buildDefaultChecklist(),
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

/** Sample logbook entries — prior years for "same event" lookups */
export function buildSeedEventDebriefs(): EventDebriefRecord[] {
  return [
    debrief({
      id: 'deb-val-2026',
      eventId: 'cal-valentine-2026',
      eventName: "Valentine's Day Fair",
      eventDate: '2026-02-14',
      status: 'completed',
      notes: 'Strong morning rush. Families buying impulse gifts.',
      issues: 'Power cord too short — extension needed.',
      bringNextTime: 'Extra extension cord, more $5 LED items',
      missedOpportunities: 'Ran out of bubble guns by 2pm',
      topSellers: 'LED swords, heart glasses, bubble guns',
      crowdRating: 4,
      weatherSummary: '38° / 28° · Partly cloudy · 15% rain',
      weatherHighF: 38,
      weatherLowF: 28,
      weatherPrecipPct: 15,
      weatherCondition: 'Partly cloudy',
      grossSales: 1420,
      expenses: 320,
      netProfit: 1100,
      margin: 77,
      breakEvenHour: '11:15 AM',
      bestHour: '1:30 PM ($245)',
      cashPercent: 42,
      cardPercent: 58,
      financialId: 'fin-001',
    }),
    debrief({
      id: 'deb-spring-2025',
      eventId: 'evt-001',
      eventName: 'Spring Family Festival',
      eventDate: '2025-03-15',
      status: 'completed',
      notes: 'Overcast until noon, then cleared. Slow first hour.',
      issues: 'Booth 14 was in shade — cold for kids.',
      bringNextTime: 'Heavier weights, hand warmers for staff',
      missedOpportunities: 'Should have had more spring-themed toys',
      topSellers: 'Kites, sidewalk chalk, LED wands',
      crowdRating: 3,
      weatherSummary: '58° / 48° · Overcast · 35% rain',
      weatherHighF: 58,
      weatherLowF: 48,
      weatherPrecipPct: 35,
      weatherCondition: 'Overcast',
      grossSales: 980,
      expenses: 350,
      netProfit: 630,
      margin: 64,
      breakEvenHour: '12:30 PM',
      bestHour: '2:00 PM ($180)',
      cashPercent: 48,
      cardPercent: 52,
    }),
    debrief({
      id: 'deb-spring-2024',
      eventId: 'evt-001',
      eventName: 'Spring Family Festival',
      eventDate: '2024-03-16',
      status: 'completed',
      notes: 'Rain at 3pm cut last hour short. Still profitable.',
      issues: 'Rain delay — packed up fast at 3.',
      bringNextTime: 'Clear tent sides, extra tarps',
      missedOpportunities: 'Glow items would have sold in drizzle',
      topSellers: 'Umbrellas (ours), plush toys',
      crowdRating: 4,
      weatherSummary: '62° / 52° · Rain showers · 60% rain',
      weatherHighF: 62,
      weatherLowF: 52,
      weatherPrecipPct: 60,
      weatherCondition: 'Rain showers',
      grossSales: 1150,
      expenses: 340,
      netProfit: 810,
      margin: 70,
      breakEvenHour: '11:45 AM',
      bestHour: '1:00 PM ($210)',
      cashPercent: 40,
      cardPercent: 60,
    }),
  ];
}
