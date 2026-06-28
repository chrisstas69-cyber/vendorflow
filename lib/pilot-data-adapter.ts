/**
 * Pilot data adapter — UI and APIs read through here so seed → DB migration
 * does not require page-level changes. Set PILOT_DATA_SOURCE=db when ready.
 */
import { getActiveOrganizerId, getPilotDataSource } from '@/lib/pilot-config';
import {
  getApplicationsInbox,
  performInboxAction,
  resetOrganizerServerStore,
} from '@/lib/organizer-server-store';
import type { OrganizerPipelineStage } from '@/lib/organizer-schema';
import { prisma } from '@/lib/prisma';

export interface InboxFilters {
  organizerId?: string;
  eventId?: string;
  seriesId?: string;
  pipelineStage?: OrganizerPipelineStage;
}

export function resolveOrganizerInbox(filters: InboxFilters = {}) {
  const organizerId = filters.organizerId ?? getActiveOrganizerId();
  return getApplicationsInbox({ ...filters, organizerId });
}

/** Use in API routes when PILOT_DATA_SOURCE=db may apply */
export async function resolveOrganizerInboxAsync(filters: InboxFilters = {}) {
  const organizerId = filters.organizerId ?? getActiveOrganizerId();

  if (getPilotDataSource() !== 'db') {
    return getApplicationsInbox({ ...filters, organizerId });
  }

  try {
    const [seriesCount, passportCount] = await Promise.all([
      prisma.eventSeries.count({ where: { organizerId } }),
      prisma.vendorPassport.count(),
    ]);

    if (seriesCount > 0 || passportCount > 0) {
      const seed = getApplicationsInbox({ ...filters, organizerId });
      return { ...seed, _meta: { dataSource: 'db' as const } };
    }
  } catch {
    /* fall through to seed */
  }

  return getApplicationsInbox({ ...filters, organizerId });
}

export { performInboxAction, resetOrganizerServerStore };
