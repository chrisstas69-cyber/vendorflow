import { NextRequest, NextResponse } from 'next/server';
import {
  listHistory,
  createHistory,
  updateHistory,
  LEAD_FIELDS,
  HISTORY_FIELDS,
} from '@/lib/airtable';
import { calculateProfit } from '@/lib/engines';

export async function GET() {
  try {
    const records = await listHistory();
    const history = records.map(r => ({ id: r.id, ...r.fields }));
    return NextResponse.json({ history });
  } catch (err) {
    return NextResponse.json({ error: String(err), history: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventName = body.eventName as string;
    const actualSales = Number(body.actualSales);
    const boothFee = Number(body.boothFee);
    const miles = Number(body.miles);

    if (!eventName || Number.isNaN(actualSales)) {
      return NextResponse.json({ error: 'eventName and actualSales required' }, { status: 400 });
    }

    const { netTakeHome, profitable } = calculateProfit(
      actualSales,
      boothFee || 0,
      miles || 0
    );

    const fields = {
      [HISTORY_FIELDS.eventName]: eventName,
      [HISTORY_FIELDS.actualSales]: actualSales,
      [HISTORY_FIELDS.boothFee]: boothFee || 0,
      [HISTORY_FIELDS.miles]: miles || 0,
      [HISTORY_FIELDS.netTakeHome]: netTakeHome,
      [HISTORY_FIELDS.profitable]: profitable,
    };

    const record = body.id
      ? await updateHistory(body.id, fields)
      : await createHistory(fields);

    return NextResponse.json({ success: true, record, netTakeHome, profitable });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
