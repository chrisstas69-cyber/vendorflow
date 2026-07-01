import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { getEffectiveDataSource } from '@/lib/pilot-config';
import { listVendorFinancials, upsertVendorFinancial } from '@/lib/vendor-financial-store';
import type { VendorFinancialInput } from '@/lib/vendor-financial-schema';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';
import { verifySession, sessionCookieName } from '@/lib/auth/session';

function resolveEmail(req: NextRequest, fallback?: string) {
  const token = req.cookies.get(sessionCookieName())?.value;
  const session = token ? verifySession(token) : null;
  if (session?.role === 'vendor') return session.email;
  return fallback ?? DEMO_VENDOR_EMAIL;
}

export async function GET(req: NextRequest) {
  await ensurePlatformSeed();
  const { searchParams } = new URL(req.url);
  const vendorEmail = searchParams.get('vendorEmail') ?? resolveEmail(req);
  const { items } = await listVendorFinancials(vendorEmail);
  return NextResponse.json({ ok: true, dataSource: getEffectiveDataSource(), items });
}

export async function POST(req: NextRequest) {
  await ensurePlatformSeed();
  const body = await req.json();
  const vendorEmail = (body.vendorEmail as string) ?? resolveEmail(req);
  const input = body.financial as VendorFinancialInput;
  if (!input?.eventName || !input?.eventDate) {
    return NextResponse.json({ ok: false, error: 'eventName and eventDate required' }, { status: 400 });
  }
  const saved = await upsertVendorFinancial(vendorEmail, input);
  return NextResponse.json({ ok: true, financial: saved });
}
