import type { PlatformEvent } from '@/lib/platform-data';

export type WorthItRating = 'worth-it' | 'borderline' | 'skip';

export interface WorthItResult {
  rating: WorthItRating;
  label: string;
  bandMin: number;
  bandMax: number;
  reasons: string[];
}

/** Rule-based worth-it estimate for vendors (demo — no ML required) */
export function computeWorthIt(
  event: Pick<
    PlatformEvent,
    'boothFee' | 'permitFee' | 'roiMin' | 'roiMax' | 'dudRisk' | 'alphaScore' | 'tier' | 'category'
  >,
  vendorCategory?: string
): WorthItResult {
  const totalFees = event.boothFee + event.permitFee;
  const netLow = event.roiMin - totalFees;
  const netHigh = event.roiMax - totalFees;
  const reasons: string[] = [];

  let score = event.alphaScore;
  if (event.tier === 'S' || event.tier === 'A') {
    score += 8;
    reasons.push(`${event.tier}-tier event`);
  }
  if (event.dudRisk <= 25) {
    score += 5;
    reasons.push('Low cancellation risk');
  } else if (event.dudRisk >= 55) {
    score -= 10;
    reasons.push('Higher no-show / weather risk');
  }
  if (totalFees > 400) {
    score -= 8;
    reasons.push('Booth fees above typical street-fair range');
  }
  if (vendorCategory && event.category === 'food-truck' && /food|bbq|truck/i.test(vendorCategory)) {
    score += 6;
    reasons.push('Category fit for food events');
  }

  let rating: WorthItRating;
  if (score >= 72 && netLow > 200) rating = 'worth-it';
  else if (score >= 50 && netLow > 0) rating = 'borderline';
  else rating = 'skip';

  const labels: Record<WorthItRating, string> = {
    'worth-it': 'Worth it',
    borderline: 'Borderline',
    skip: 'Skip',
  };

  return {
    rating,
    label: labels[rating],
    bandMin: Math.max(0, netLow),
    bandMax: Math.max(netLow, netHigh),
    reasons: reasons.slice(0, 3),
  };
}

export const WORTH_IT_STYLES: Record<
  WorthItRating,
  { bg: string; text: string; border: string }
> = {
  'worth-it': {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  borderline: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  skip: {
    bg: 'bg-gray-100 dark:bg-gray-800/50',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700',
  },
};
