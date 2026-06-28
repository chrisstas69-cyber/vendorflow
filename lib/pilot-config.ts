import { DEMO_ORGANIZER_ID } from '@/lib/platform-data';
import type { LiRegion } from '@/lib/long-island/compliance-rules';

/** Where organizer pilot data is loaded from — flip to `db` when Prisma records are ready */
export type PilotDataSource = 'seed' | 'db';

export interface PilotOrganizerProfile {
  id: string;
  contactName: string;
  organization: string;
  email: string;
  region: LiRegion;
  defaultSeriesId: string;
  seasonLabel: string;
  planId: 'org-founders';
  tagline: string;
}

/**
 * Long Island Founders Edition pilot organizer.
 * Uses `org-demo` id so existing seed data works; swap to a real id when onboarding live organizers.
 */
export const PILOT_ORGANIZER: PilotOrganizerProfile = {
  id: DEMO_ORGANIZER_ID,
  contactName: 'Maria Lopez',
  organization: 'Hempstead Chamber of Commerce',
  email: 'events@hempsteadchamber.org',
  region: 'nassau',
  defaultSeriesId: 'series-li-summer',
  seasonLabel: '2026 Summer Street Fair Series',
  planId: 'org-founders',
  tagline: 'Long Island Founders Edition · Pilot',
};

export function getPilotDataSource(): PilotDataSource {
  const v =
    (typeof process !== 'undefined' && process.env.PILOT_DATA_SOURCE) ||
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_PILOT_DATA_SOURCE) ||
    'seed';
  return v === 'db' ? 'db' : 'seed';
}

export function isPilotModeEnabled(): boolean {
  const v =
    (typeof process !== 'undefined' && process.env.PILOT_MODE) ||
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_PILOT_MODE) ||
    'true';
  return v !== 'false';
}

export function getActiveOrganizerId(): string {
  return PILOT_ORGANIZER.id;
}

export function getPilotConfigSnapshot() {
  return {
    enabled: isPilotModeEnabled(),
    dataSource: getPilotDataSource(),
    organizer: PILOT_ORGANIZER,
  };
}
