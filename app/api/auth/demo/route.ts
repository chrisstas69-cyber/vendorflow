import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/auth/guards';
import {
  createSessionPayload,
  safeAuthDestination,
  sessionCookieName,
  signSession,
  type AuthRole,
} from '@/lib/auth/session';
import { isPilotModeEnabled, PILOT_ORGANIZER } from '@/lib/pilot-config';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isPilotModeEnabled()) {
    return NextResponse.json({ ok: false, error: 'Demo access is disabled' }, { status: 404 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`demo-login:${ip}`, 20, 60_000)) {
    return NextResponse.json({ ok: false, error: 'Too many requests — try again shortly' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const role = body.role as AuthRole;
  if (role !== 'vendor' && role !== 'organizer') {
    return NextResponse.json({ ok: false, error: 'Valid role required' }, { status: 400 });
  }

  const email = role === 'organizer' ? PILOT_ORGANIZER.email : DEMO_VENDOR_EMAIL;
  const fallback = role === 'organizer' ? '/organizer' : '/pulse';
  const destination = safeAuthDestination(body.next, role) ?? fallback;
  const response = NextResponse.json({ ok: true, destination });
  response.cookies.set(sessionCookieName(), signSession(createSessionPayload(email, role)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60,
  });
  return response;
}
