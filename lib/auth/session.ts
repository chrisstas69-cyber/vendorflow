import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

export type AuthRole = 'vendor' | 'organizer';

export interface SessionPayload {
  email: string;
  role: AuthRole;
  exp: number;
}

const COOKIE_NAME = 'vf_session';
const TOKEN_BYTES = 32;
const SESSION_DAYS = 14;
const MAGIC_LINK_MINUTES = 30;

export function getAuthSecret(): string {
  return process.env.AUTH_SECRET ?? 'vendorflow-dev-secret-change-in-production';
}

export function sessionCookieName() {
  return COOKIE_NAME;
}

export function signSession(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', getAuthSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifySession(token: string): SessionPayload | null {
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = createHmac('sha256', getAuthSecret()).update(data).digest('base64url');
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as SessionPayload;
    if (!payload.email || !payload.role || !payload.exp) return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createSessionPayload(email: string, role: AuthRole): SessionPayload {
  return {
    email: email.toLowerCase().trim(),
    role,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function generateMagicToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

export function magicLinkExpiresAt(): Date {
  return new Date(Date.now() + MAGIC_LINK_MINUTES * 60 * 1000);
}

export function buildMagicLinkUrl(token: string, origin: string): string {
  return `${origin.replace(/\/$/, '')}/api/auth/verify?token=${encodeURIComponent(token)}`;
}

/** Prefer env, then request Origin/Host — avoids localhost links in production. */
export function resolveAppOrigin(headers: Headers): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const origin = headers.get('origin')?.trim();
  if (origin) return origin.replace(/\/$/, '');

  const host = headers.get('x-forwarded-host') ?? headers.get('host');
  if (host) {
    const proto = headers.get('x-forwarded-proto') ?? 'https';
    return `${proto}://${host}`.replace(/\/$/, '');
  }

  return 'http://localhost:3002';
}

export function canSendEmail(): boolean {
  return Boolean(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY);
}
