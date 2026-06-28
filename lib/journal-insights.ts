export interface JournalRecord {
  id: string;
  eventName: string;
  date: string;
  grossSales: number;
  expenses: number;
  netProfit: number;
  margin: number;
  category?: string;
  town?: string;
}

export interface JournalInsight {
  id: string;
  headline: string;
  detail: string;
  type: 'positive' | 'neutral' | 'warning';
}

/** Surface simple patterns from vendor journal entries */
export function deriveJournalInsights(records: JournalRecord[]): JournalInsight[] {
  if (records.length === 0) {
    return [
      {
        id: 'empty',
        headline: 'Log your first event',
        detail: 'After each fair, record sales and costs — patterns emerge after 2–3 entries.',
        type: 'neutral',
      },
    ];
  }

  const insights: JournalInsight[] = [];
  const avgMargin =
    records.reduce((s, r) => s + r.margin, 0) / Math.max(records.length, 1);
  const best = [...records].sort((a, b) => b.netProfit - a.netProfit)[0];
  const worst = [...records].sort((a, b) => a.netProfit - b.netProfit)[0];

  if (best) {
    insights.push({
      id: 'best',
      headline: `${best.eventName} was your top earner`,
      detail: `$${best.netProfit.toLocaleString()} net at ${best.margin}% margin — prioritize similar events.`,
      type: 'positive',
    });
  }

  const festivalLike = records.filter(
    r =>
      /fest|fair|street|market/i.test(r.eventName) ||
      r.category === 'festival' ||
      r.category === 'street-fair'
  );
  const schoolLike = records.filter(r => /school/i.test(r.eventName) || r.category === 'school-fair');

  if (festivalLike.length >= 2 && schoolLike.length >= 1) {
    const festAvg =
      festivalLike.reduce((s, r) => s + r.netProfit, 0) / festivalLike.length;
    const schoolAvg =
      schoolLike.reduce((s, r) => s + r.netProfit, 0) / schoolLike.length;
    if (festAvg > schoolAvg * 1.2) {
      insights.push({
        id: 'fest-vs-school',
        headline: 'Festivals outperform school fairs for you',
        detail: `Avg festival net $${Math.round(festAvg).toLocaleString()} vs school $${Math.round(schoolAvg).toLocaleString()}.`,
        type: 'positive',
      });
    }
  }

  if (avgMargin < 35 && records.length >= 2) {
    insights.push({
      id: 'margin',
      headline: 'Margins are tight — watch booth fees',
      detail: `Average margin ${Math.round(avgMargin)}%. Target events with lower fees or higher foot traffic.`,
      type: 'warning',
    });
  }

  if (worst && worst.netProfit < 0) {
    insights.push({
      id: 'loss',
      headline: `${worst.eventName} lost money`,
      detail: `Net −$${Math.abs(worst.netProfit).toLocaleString()} — worth skipping similar listings unless fees drop.`,
      type: 'warning',
    });
  }

  return insights.slice(0, 4);
}
