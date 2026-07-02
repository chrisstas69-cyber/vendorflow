import type { NextRequest } from 'next/server';
import { verifySession, sessionCookieName } from '@/lib/auth/session';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';

/**
 * Session always wins; unauthenticated callers get the demo vendor.
 * The `fallback` parameter is intentionally NOT client-controlled — never
 * pass query params or request-body emails here.
 */
export function resolveVendorEmail(req: NextRequest, fallback?: string): string {
  const token = req.cookies.get(sessionCookieName())?.value;
  const session = token ? verifySession(token) : null;
  if (session?.role === 'vendor') return session.email;
  return fallback ?? DEMO_VENDOR_EMAIL;
}

export function resolveVendorEmailFromCookies(
  cookieHeader: string | null,
  fallback?: string
): string {
  if (!cookieHeader) return fallback ?? DEMO_VENDOR_EMAIL;
  const match = cookieHeader.match(new RegExp(`${sessionCookieName()}=([^;]+)`));
  const token = match?.[1];
  const session = token ? verifySession(decodeURIComponent(token)) : null;
  if (session?.role === 'vendor') return session.email;
  return fallback ?? DEMO_VENDOR_EMAIL;
}
