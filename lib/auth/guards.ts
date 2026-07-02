import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifySession, sessionCookieName, type SessionPayload } from '@/lib/auth/session';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';

export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get(sessionCookieName())?.value;
  return token ? verifySession(token) : null;
}

/**
 * Vendor identity for the request. The session ALWAYS wins — client-supplied
 * emails (query param or body) are never honored, killing cross-vendor IDOR.
 * Unauthenticated requests get the shared demo vendor only.
 */
export function vendorEmailForRequest(req: NextRequest): string {
  const session = getSessionFromRequest(req);
  if (session?.role === 'vendor') return session.email;
  return DEMO_VENDOR_EMAIL;
}

/** 403 when a signed-in non-organizer hits an organizer route. */
export function assertOrganizerOrDemo(req: NextRequest): NextResponse | null {
  const session = getSessionFromRequest(req);
  if (session && session.role !== 'organizer') {
    return NextResponse.json(
      { ok: false, error: 'Organizer access required' },
      { status: 403 }
    );
  }
  return null;
}

/** Strict organizer session — for destructive actions in production. */
export function requireOrganizer(req: NextRequest): NextResponse | null {
  const session = getSessionFromRequest(req);
  if (session?.role === 'organizer') return null;
  if (process.env.NODE_ENV !== 'production') return null;
  return NextResponse.json(
    { ok: false, error: 'Organizer sign-in required' },
    { status: 401 }
  );
}

/**
 * The `viewerRole=internal` escalation is only honored for signed-in
 * organizers in production. Dev keeps the frictionless demo behavior.
 */
export function canUseInternalViewer(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  const session = getSessionFromRequest(req);
  return session?.role === 'organizer';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

// Naive in-memory rate limiter (per serverless instance) — good enough to
// blunt magic-link spam and AI abuse in the pilot.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}
