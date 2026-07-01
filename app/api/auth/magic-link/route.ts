import { NextRequest, NextResponse } from 'next/server';
import {
  buildMagicLinkUrl,
  canSendEmail,
  createSessionPayload,
  generateMagicToken,
  magicLinkExpiresAt,
  sessionCookieName,
  signSession,
  type AuthRole,
} from '@/lib/auth/session';
import { ensurePlatformSeed } from '@/lib/platform-seed';

export const dynamic = 'force-dynamic';

/** POST — request magic link { email, role } */
export async function POST(req: NextRequest) {
  await ensurePlatformSeed();
  const { prisma } = await import('@/lib/prisma');
  const body = await req.json();
  const email = String(body.email ?? '').toLowerCase().trim();
  const role = body.role as AuthRole;

  if (!email || !['vendor', 'organizer'].includes(role)) {
    return NextResponse.json({ ok: false, error: 'email and role required' }, { status: 400 });
  }

  const token = generateMagicToken();
  await prisma.magicLinkToken.create({
    data: { email, role, token, expiresAt: magicLinkExpiresAt() },
  });

  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002';
  const link = buildMagicLinkUrl(token, origin);

  if (canSendEmail() && process.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
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
    } catch {
      /* fall through to dev link */
    }
  }

  return NextResponse.json({
    ok: true,
    message: canSendEmail() ? 'Check your email for a sign-in link' : 'Copy the link below to sign in',
    devLink: canSendEmail() ? undefined : link,
  });
}
