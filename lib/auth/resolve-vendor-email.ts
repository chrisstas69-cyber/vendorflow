import type { NextRequest } from 'next/server';
import { verifySession, sessionCookieName } from '@/lib/auth/session';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';
import { NextResponse } from 'next/server';

const NO_VENDOR_IDENTITY = '__unauthenticated__@invalid.vendorflow';

function anonymousVendorFallback(fallback?: string): string {
  if (fallback) return fallback;
  return process.env.NODE_ENV === 'production' ? NO_VENDOR_IDENTITY : DEMO_VENDOR_EMAIL;
}

/**
 * Session always wins; unauthenticated callers get the demo vendor.
 * The `fallback` parameter is intentionally NOT client-controlled — never
 * pass query params or request-body emails here.
 */
export function resolveVendorEmail(req: NextRequest, fallback?: string): string {
  const token = req.cookies.get(sessionCookieName())?.value;
  const session = token ? verifySession(token) : null;
  if (session?.role === 'vendor') return session.email;
  return anonymousVendorFallback(fallback);
}

export function resolveVendorEmailFromCookies(
  cookieHeader: string | null,
  fallback?: string
): string {
  if (!cookieHeader) return anonymousVendorFallback(fallback);
  const match = cookieHeader.match(new RegExp(`${sessionCookieName()}=([^;]+)`));
  const token = match?.[1];
  const session = token ? verifySession(decodeURIComponent(token)) : null;
  if (session?.role === 'vendor') return session.email;
  return anonymousVendorFallback(fallback);
}

export function requireVendorEmail(
  req: NextRequest
): { ok: true; email: string } | { ok: false; response: NextResponse } {
  const token = req.cookies.get(sessionCookieName())?.value;
  const session = token ? verifySession(token) : null;
  if (session?.role === 'vendor') return { ok: true, email: session.email };
  if (process.env.NODE_ENV !== 'production' && !session) {
    return { ok: true, email: DEMO_VENDOR_EMAIL };
  }
  return {
    ok: false,
    response: NextResponse.json(
      {
        ok: false,
        error: session ? 'Vendor access required' : 'Vendor sign-in required',
      },
      { status: session ? 403 : 401 }
    ),
  };
}
