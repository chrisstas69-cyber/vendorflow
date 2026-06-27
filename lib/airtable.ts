import { LEAD_FIELDS, HISTORY_FIELDS } from '@/lib/constants';

const AIRTABLE_API = 'https://api.airtable.com/v0';

export const LEADS_TABLE = 'Event_Leads';
export const HISTORY_TABLE = 'Event_History';
export { LEAD_FIELDS, HISTORY_FIELDS };

export type LeadRecord = {
  id: string;
  fields: Record<string, unknown>;
};

function getConfig() {
  const pat = process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!pat?.startsWith('pat')) {
    throw new Error('AIRTABLE_PAT missing or invalid (must start with pat)');
  }
  if (!baseId?.startsWith('app')) {
    throw new Error('AIRTABLE_BASE_ID missing or invalid (must start with app)');
  }
  return { pat, baseId };
}

async function airtableFetch(path: string, init?: RequestInit) {
  const { pat, baseId } = getConfig();
  const url = path.startsWith('http') ? path : `${AIRTABLE_API}/${baseId}/${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${pat}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable ${res.status}: ${body}`);
  }
  return res.json();
}

export async function listLeads(): Promise<LeadRecord[]> {
  const records: LeadRecord[] = [];
  let offset: string | undefined;
  do {
    const qs = new URLSearchParams({ pageSize: '100' });
    if (offset) qs.set('offset', offset);
    const data = await airtableFetch(`${LEADS_TABLE}?${qs}`);
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);
  return records;
}

export async function listHistory(): Promise<LeadRecord[]> {
  const records: LeadRecord[] = [];
  let offset: string | undefined;
  do {
    const qs = new URLSearchParams({ pageSize: '100' });
    if (offset) qs.set('offset', offset);
    const data = await airtableFetch(`${HISTORY_TABLE}?${qs}`);
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);
  return records;
}

export async function findLeadByNameAndDate(name: string, eventDate: string) {
  const formula = `AND({${LEAD_FIELDS.eventName}}='${name.replace(/'/g, "\\'")}',{${LEAD_FIELDS.eventDate}}='${eventDate}')`;
  const data = await airtableFetch(
    `${LEADS_TABLE}?${new URLSearchParams({ filterByFormula: formula, maxRecords: '1' })}`
  );
  return data.records?.[0] as LeadRecord | undefined;
}

export async function createLead(fields: Record<string, unknown>) {
  const data = await airtableFetch(LEADS_TABLE, {
    method: 'POST',
    body: JSON.stringify({ records: [{ fields }] }),
  });
  return data.records[0] as LeadRecord;
}

export async function updateLead(id: string, fields: Record<string, unknown>) {
  const data = await airtableFetch(LEADS_TABLE, {
    method: 'PATCH',
    body: JSON.stringify({ records: [{ id, fields }] }),
  });
  return data.records[0] as LeadRecord;
}

export async function createHistory(fields: Record<string, unknown>) {
  const data = await airtableFetch(HISTORY_TABLE, {
    method: 'POST',
    body: JSON.stringify({ records: [{ fields }] }),
  });
  return data.records[0] as LeadRecord;
}

export async function updateHistory(id: string, fields: Record<string, unknown>) {
  const data = await airtableFetch(HISTORY_TABLE, {
    method: 'PATCH',
    body: JSON.stringify({ records: [{ id, fields }] }),
  });
  return data.records[0] as LeadRecord;
}
