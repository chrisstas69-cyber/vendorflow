import { NextRequest, NextResponse } from 'next/server';
import { sendDailyDigest } from '@/lib/email';
import { requireAdmin } from '@/lib/auth/guards';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req); if (!auth.ok) return auth.response;
  try {
    const result = await sendDailyDigest();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
