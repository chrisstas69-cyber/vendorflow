import { NextRequest, NextResponse } from 'next/server';
import { listLeads, LEAD_FIELDS } from '@/lib/airtable';
import { ALERT_SORT, GRADE_SORT } from '@/lib/engines';
import { requireAdmin } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req); if (!auth.ok) return auth.response;
  try {
    const records = await listLeads();
    const leads = records
      .map(r => ({ id: r.id, ...r.fields } as Record<string, unknown> & { id: string }))
      .sort((a, b) => {
        const alertA = ALERT_SORT[String(a[LEAD_FIELDS.alertLevel] || '')] ?? 99;
        const alertB = ALERT_SORT[String(b[LEAD_FIELDS.alertLevel] || '')] ?? 99;
        if (alertA !== alertB) return alertA - alertB;
        const gradeA = GRADE_SORT[String(a[LEAD_FIELDS.eventGrade] || '')] ?? 99;
        const gradeB = GRADE_SORT[String(b[LEAD_FIELDS.eventGrade] || '')] ?? 99;
        return gradeA - gradeB;
      });
    return NextResponse.json({ leads });
  } catch (err) {
    return NextResponse.json({ error: String(err), leads: [] }, { status: 500 });
  }
}
