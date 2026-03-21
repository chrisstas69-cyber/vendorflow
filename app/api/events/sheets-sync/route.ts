import { NextResponse } from 'next/server';
import { updateAllTabs } from '@/lib/sheets';

export async function POST() {
  try {
    const result = await updateAllTabs();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
