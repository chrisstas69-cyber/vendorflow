import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifySession, sessionCookieName, type SessionPayload } from '@/lib/auth/session';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';
import { getActiveOrganizerId } from '@/lib/pilot-config';
import { timingSafeEqual } from 'crypto';

export type AuthorizedSession = NonNullable<ReturnType<typeof getSessionFromRequest>>;

export type AuthResult =
  | { ok: true; session: AuthorizedSession }
  | { ok: false; response: NextResponse };

export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get(sessionCookieName())?.value;
  return token ? verifySession(token) : null;
}

export function requireSession(req: NextRequest): AuthResult {
  const session = getSessionFromRequest(req);
  if (session) return { ok: true, session };
  return {
    ok: false,
    response: NextResponse.json(
      { ok: false, error: 'Sign-in required' },
      { status: 401 }
    ),
  };
}

export function requireRole(req: NextRequest, role: 'vendor' | 'organizer'): AuthResult {
  const auth = requireSession(req);
  if (!auth.ok) return auth;
  if (auth.session.role === role) return auth;
  return {
    ok: false,
    response: NextResponse.json(
      { ok: false, error: `${role === 'organizer' ? 'Organizer' : 'Vendor'} access required` },
      { status: 403 }
    ),
  };
}

export function requireAdmin(req: NextRequest): AuthResult {
  const auth = requireSession(req);
  if (!auth.ok) return auth;
  const allowed = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
  if (auth.session.role === 'organizer' && allowed.includes(auth.session.email)) return auth;
  return {
    ok: false,
    response: NextResponse.json({ ok: false, error: 'Administrator access required' }, { status: 403 }),
  };
}

export function requireCronSecret(req: NextRequest): NextResponse | null {
  const configured = process.env.CRON_SECRET;
  if (!configured) {
    if (process.env.NODE_ENV !== 'production') return null;
    return NextResponse.json({ ok: false, error: 'Automation is not configured' }, { status: 503 });
  }
  const supplied = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (supplied && supplied.length === configured.length) {
    try {
      if (timingSafeEqual(Buffer.from(supplied), Buffer.from(configured))) return null;
    } catch {
      // Fall through to the same generic unauthorized response.
    }
  }
  return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
}

/** Resolve the organizer tenant from the signed-in email, never from client input. */
export async function organizerIdForRequest(
  req: NextRequest
): Promise<{ ok: true; organizerId: string; session: AuthorizedSession } | { ok: false; response: NextResponse }> {
  const auth = requireRole(req, 'organizer');
  if (!auth.ok) {
    if (process.env.NODE_ENV !== 'production' && !getSessionFromRequest(req)) {
      return {
        ok: true,
        organizerId: getActiveOrganizerId(),
        session: {
          email: 'organizer@demo.vendorflow.app',
          role: 'organizer',
          exp: Date.now() + 60_000,
        },
      };
    }
    return auth;
  }

  const { prisma } = await import('@/lib/prisma');
  const organizer = await prisma.organizerAccount.findUnique({
    where: { email: auth.session.email },
    select: { id: true },
  });
  if (!organizer) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'Organizer account is not provisioned' },
        { status: 403 }
      ),
    };
  }
  return { ok: true, organizerId: organizer.id, session: auth.session };
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
  if (session?.role === 'organizer') return null;
  if (process.env.NODE_ENV !== 'production' && !session) return null;
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'Organizer sign-in required' },
      { status: 401 }
    );
  }
  return NextResponse.json(
    { ok: false, error: 'Organizer access required' },
    { status: 403 }
  );
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
  const allowed = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
  return session?.role === 'organizer' && allowed.includes(session.email);
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
