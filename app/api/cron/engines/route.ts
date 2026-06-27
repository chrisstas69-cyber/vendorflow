import { NextRequest, NextResponse } from 'next/server';
import {
  listLeads,
  listHistory,
  updateLead,
  updateHistory,
  LEAD_FIELDS,
  HISTORY_FIELDS,
} from '@/lib/airtable';
import {
  classifyDeadline,
  gradeEvent,
  calculateProfit,
  isSTierZip,
} from '@/lib/engines';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runEngines();
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runEngines();
}

async function runEngines() {
  const results = { deadlines: 0, grading: 0, profits: 0, zip: 0 };

  try {
    const leads = await listLeads();
    for (const record of leads) {
      const f = record.fields;
      const updates: Record<string, unknown> = {};

      const deadline = f[LEAD_FIELDS.applicationDeadline] as string | undefined;
      const { alertLevel, needsAction } = classifyDeadline(deadline);
      if (alertLevel !== f[LEAD_FIELDS.alertLevel]) updates[LEAD_FIELDS.alertLevel] = alertLevel;
      if (needsAction !== f[LEAD_FIELDS.needsAction]) updates[LEAD_FIELDS.needsAction] = needsAction;
      if (Object.keys(updates).length) {
        await updateLead(record.id, updates);
        results.deadlines++;
      }

      const density = Number(f[LEAD_FIELDS.familyDensity] || 0);
      const alpha = Number(f[LEAD_FIELDS.alphaScore] || 0);
      if (density > 0 || alpha > 0) {
        const grade = gradeEvent(density, alpha);
        if (grade !== f[LEAD_FIELDS.eventGrade]) {
          await updateLead(record.id, { [LEAD_FIELDS.eventGrade]: grade });
          results.grading++;
        }
      }

      const zip = f[LEAD_FIELDS.zip];
      const sTier = isSTierZip(zip as string);
      if (sTier !== Boolean(f[LEAD_FIELDS.sTierPriority])) {
        await updateLead(record.id, { [LEAD_FIELDS.sTierPriority]: sTier });
        results.zip++;
      }
    }

    const history = await listHistory();
    for (const record of history) {
      const f = record.fields;
      const sales = Number(f[HISTORY_FIELDS.actualSales] || 0);
      const fee = Number(f[HISTORY_FIELDS.boothFee] || 0);
      const miles = Number(f[HISTORY_FIELDS.miles] || 0);
      if (sales > 0) {
        const { netTakeHome, profitable } = calculateProfit(sales, fee, miles);
        await updateHistory(record.id, {
          [HISTORY_FIELDS.netTakeHome]: netTakeHome,
          [HISTORY_FIELDS.profitable]: profitable,
        });
        results.profits++;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
