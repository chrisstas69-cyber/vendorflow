import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const envPath = path.join(process.cwd(), '.env.local');
  const status: Record<string, { set: boolean; valid: boolean }> = {
    AIRTABLE_PAT: { set: false, valid: false },
    AIRTABLE_BASE_ID: { set: false, valid: false },
    GOOGLE_SERVICE_ACCOUNT_JSON: { set: false, valid: false },
    GMAIL_FROM: { set: false, valid: false },
  };

  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      if (!line.includes('=') || line.startsWith('#')) continue;
      const [key, ...rest] = line.split('=');
      const val = rest.join('=').trim();
      if (!(key in status)) continue;
      status[key].set = val.length > 0;
      if (key === 'AIRTABLE_PAT') status[key].valid = val.startsWith('pat');
      if (key === 'AIRTABLE_BASE_ID') status[key].valid = val.startsWith('app');
      if (key === 'GOOGLE_SERVICE_ACCOUNT_JSON') status[key].valid = val.startsWith('{');
      if (key === 'GMAIL_FROM') status[key].valid = val.includes('@');
    }
  }

  const airtableReady = status.AIRTABLE_PAT.valid && status.AIRTABLE_BASE_ID.valid;
  const dbPath = path.join(process.cwd(), 'data', 'events.db');
  const hasEvents = fs.existsSync(dbPath) && fs.statSync(dbPath).size > 10000;

  return NextResponse.json({
    airtableReady,
    hasEvents,
    keys: status,
    nextSteps: airtableReady
      ? ['Run: npm run airtable:setup', 'Run scrape at /events/scrape', 'Add events to pipeline from /']
      : ['Fix Airtable at /setup — PAT must start with pat, Base ID with app'],
  });
}
