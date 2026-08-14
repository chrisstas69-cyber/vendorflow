import { NextRequest, NextResponse } from 'next/server';
import {
  buildMagicLinkUrl,
  canSendEmail,
  generateMagicToken,
  magicLinkExpiresAt,
  resolveAppOrigin,
  type AuthRole,
} from '@/lib/auth/session';
import { rateLimit } from '@/lib/auth/guards';
import { ensurePlatformSeed } from '@/lib/platform-seed';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Dev links let anyone mint a session for any email — never expose them in
 * production. Local development returns a link when email is not configured.
 */
function devLinkAllowed(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/** POST — request magic link { email, role } */
export async function POST(req: NextRequest) {
  await ensurePlatformSeed();
  const { prisma } = await import('@/lib/prisma');
  const body = await req.json();
  const email = String(body.email ?? '').toLowerCase().trim();
  const role = body.role as AuthRole;

  if (!email || !EMAIL_RE.test(email) || !['vendor', 'organizer'].includes(role)) {
    return NextResponse.json({ ok: false, error: 'valid email and role required' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`magic:${ip}`, 10, 60_000) || !rateLimit(`magic:${email}`, 5, 60_000)) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests — try again in a minute' },
      { status: 429 }
    );
  }

  if (process.env.NODE_ENV === 'production' && !process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { ok: false, error: 'Sign-in email is temporarily unavailable' },
      { status: 503 }
    );
  }

  const token = generateMagicToken();
  await prisma.magicLinkToken.create({
    data: { email, role, token, expiresAt: magicLinkExpiresAt() },
  });

  const link = buildMagicLinkUrl(token, resolveAppOrigin(req.headers));

  if (canSendEmail() && process.env.RESEND_API_KEY) {
    try {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? 'VendorFlow <onboarding@resend.dev>',
          to: email,
          subject: 'Your VendorFlow sign-in link',
          html: `<p>Click to sign in (expires in 30 min):</p><p><a href="${link}">${link}</a></p>`,
        }),
      });
      if (!emailResponse.ok) {
        throw new Error(`Email provider rejected request (${emailResponse.status})`);
      }
    } catch (error) {
      await prisma.magicLinkToken.delete({ where: { token } }).catch(() => undefined);
      return NextResponse.json(
        { ok: false, error: 'Unable to send the sign-in email. Please try again.' },
        { status: 502 }
      );
    }
  }

  const showDevLink = !canSendEmail() && devLinkAllowed();
  return NextResponse.json({
    ok: true,
    message: canSendEmail()
      ? 'Check your email for a sign-in link'
      : showDevLink
        ? 'Copy the link below to sign in'
        : 'Sign-in email is not configured yet — contact the VendorFlow team',
    devLink: showDevLink ? link : undefined,
  });
}
