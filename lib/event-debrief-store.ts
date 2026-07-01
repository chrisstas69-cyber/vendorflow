import { getEffectiveDataSource } from '@/lib/pilot-config';
import type { EventDebriefInput, EventDebriefRecord } from '@/lib/event-debrief-schema';
import {
  deleteDebriefDb,
  ensureDebriefDbSeed,
  getDebriefDb,
  listDebriefsDb,
  upsertDebriefDb,
} from '@/lib/event-debrief-db-store';
import {
  deleteDebriefSeed,
  getDebriefSeed,
  listDebriefsSeed,
  upsertDebriefSeed,
} from '@/lib/event-debrief-seed-store';

export async function listDebriefs(
  vendorEmail: string
): Promise<{ items: EventDebriefRecord[]; dataSource: 'seed' | 'db' }> {
  if (getEffectiveDataSource() === 'db') {
    await ensureDebriefDbSeed();
    return { items: await listDebriefsDb(vendorEmail), dataSource: 'db' };
  }
  return { items: listDebriefsSeed(vendorEmail), dataSource: 'seed' };
}

export async function getDebrief(id: string): Promise<EventDebriefRecord | null> {
  if (getEffectiveDataSource() === 'db') {
    return getDebriefDb(id);
  }
  return getDebriefSeed(id);
}

export async function upsertDebrief(
  vendorEmail: string,
  input: EventDebriefInput
): Promise<EventDebriefRecord> {
  if (getEffectiveDataSource() === 'db') {
    await ensureDebriefDbSeed();
    return upsertDebriefDb(vendorEmail, input);
  }
  return upsertDebriefSeed(vendorEmail, input);
}

export async function deleteDebrief(id: string): Promise<boolean> {
  if (getEffectiveDataSource() === 'db') {
    return deleteDebriefDb(id);
  }
  return deleteDebriefSeed(id);
}
