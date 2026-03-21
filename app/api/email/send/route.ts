import { NextResponse } from 'next/server';
import { sendDailyDigest } from '@/lib/email';

export async function POST() {
  try {
    const result = await sendDailyDigest();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
