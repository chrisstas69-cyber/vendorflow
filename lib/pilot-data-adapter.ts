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
import {
  getApplicationsInboxFromDb,
  performApplicationActionDb,
  createApplicationDb,
  getApplicationByIdFromDb,
} from '@/lib/organizer-db-store';
import { resetPilotDbSeed } from '@/lib/pilot-db-seed';
import type { InboxAction, OrganizerPipelineStage } from '@/lib/organizer-schema';

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

export async function resolveOrganizerInboxAsync(filters: InboxFilters = {}) {
  const organizerId = filters.organizerId ?? getActiveOrganizerId();

  if (getPilotDataSource() === 'db') {
    return getApplicationsInboxFromDb({ ...filters, organizerId });
  }

  return getApplicationsInbox({ ...filters, organizerId });
}

export async function resolveApplicationActionAsync(submissionId: string, action: InboxAction) {
  if (getPilotDataSource() === 'db') {
    return performApplicationActionDb(submissionId, action);
  }
  return performInboxAction(submissionId, action);
}

export async function resolveApplicationByIdAsync(id: string, organizerId?: string) {
  if (getPilotDataSource() === 'db') {
    return getApplicationByIdFromDb(id, organizerId);
  }
  const inbox = getApplicationsInbox({ organizerId: organizerId ?? getActiveOrganizerId() });
  return inbox.items.find(i => i.id === id) ?? null;
}

export async function resolveCreateApplicationAsync(
  input: Parameters<typeof createApplicationDb>[0]
) {
  if (getPilotDataSource() === 'db') {
    return createApplicationDb(input);
  }
  return null;
}

export async function resetPilotDataAsync() {
  if (getPilotDataSource() === 'db') {
    await resetPilotDbSeed();
    return;
  }
  resetOrganizerServerStore();
}

export { performInboxAction, resetOrganizerServerStore };
