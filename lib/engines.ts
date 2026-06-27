const MILEAGE_RATE = 0.67;
const S_TIER_ZIPS = new Set(['11730', '11784']);

export type AlertLevel = '🔴 URGENT' | '🟡 WARNING' | '🟢 HEADS UP' | null;
export type EventGrade = 'S' | 'A' | 'B' | 'C';

export function classifyDeadline(deadline: string | null | undefined): {
  alertLevel: AlertLevel;
  needsAction: boolean;
} {
  if (!deadline) return { alertLevel: null, needsAction: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  const days = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { alertLevel: null, needsAction: false };
  if (days <= 30) return { alertLevel: '🔴 URGENT', needsAction: true };
  if (days <= 60) return { alertLevel: '🟡 WARNING', needsAction: true };
  if (days <= 90) return { alertLevel: '🟢 HEADS UP', needsAction: true };
  return { alertLevel: null, needsAction: false };
}

export function gradeEvent(familyDensity: number, alphaScore: number): EventGrade {
  let grade: EventGrade;
  if (familyDensity >= 40) grade = 'S';
  else if (familyDensity >= 25) grade = 'A';
  else if (familyDensity >= 15) grade = 'B';
  else grade = 'C';
  const ladder: EventGrade[] = ['C', 'B', 'A', 'S'];
  let idx = ladder.indexOf(grade);
  if (alphaScore >= 75 && idx < 3) idx += 1;
  if (alphaScore < 30 && idx > 0) idx -= 1;
  return ladder[idx];
}

export function calculateProfit(sales: number, fee: number, miles: number) {
  const net = sales - fee - miles * MILEAGE_RATE;
  return { netTakeHome: Math.round(net * 100) / 100, profitable: net > 0 };
}

export function isSTierZip(zip: string | number | null | undefined): boolean {
  if (zip == null || zip === '') return false;
  return S_TIER_ZIPS.has(String(zip).trim());
}

export const ALERT_SORT: Record<string, number> = {
  '🔴 URGENT': 0,
  '🟡 WARNING': 1,
  '🟢 HEADS UP': 2,
};

export const GRADE_SORT: Record<string, number> = { S: 0, A: 1, B: 2, C: 3 };
