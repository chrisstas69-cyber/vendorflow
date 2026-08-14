import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createSessionPayload,
  sessionCookieName,
  signSession,
  safeAuthDestination,
} from '@/lib/auth/session';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { ensurePassportForEmail } from '@/lib/vendor-applications-store';

/** GET — verify magic link token and set session cookie */
export async function GET(req: NextRequest) {
  await ensurePlatformSeed();
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', req.url));
  }

  const row = await prisma.magicLinkToken.findUnique({ where: { token } });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return NextResponse.redirect(new URL('/login?error=expired', req.url));
  }

  const consumed = await prisma.magicLinkToken.updateMany({
    where: { id: row.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (consumed.count !== 1) {
    return NextResponse.redirect(new URL('/login?error=expired', req.url));
  }

  if (row.role === 'vendor') {
    await ensurePassportForEmail(row.email);
  } else {
    const existing = await prisma.organizerAccount.findUnique({ where: { email: row.email } });
    if (!existing) {
      const localPart = row.email.split('@')[0] || 'organizer';
      await prisma.organizerAccount.create({
        data: {
          slug: `${localPart.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${row.id.slice(-6)}`,
          name: localPart.replace(/[._-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()),
          email: row.email,
          organization: `${localPart.replace(/[._-]+/g, ' ')} events`,
        },
      });
    }
  }

  const session = signSession(createSessionPayload(row.email, row.role as 'vendor' | 'organizer'));
  const role = row.role as 'vendor' | 'organizer';
  const dest = safeAuthDestination(searchParams.get('next'), role) ?? (role === 'organizer' ? '/organizer' : '/pulse');
  const res = NextResponse.redirect(new URL(dest, req.url));
  res.cookies.set(sessionCookieName(), session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 14 * 24 * 60 * 60,
  });
  return res;
}
