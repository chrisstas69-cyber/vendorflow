import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createSessionPayload,
  sessionCookieName,
  signSession,
  verifySession,
} from '@/lib/auth/session';
import { ensurePlatformSeed } from '@/lib/platform-seed';

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

  await prisma.magicLinkToken.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });

  const session = signSession(createSessionPayload(row.email, row.role as 'vendor' | 'organizer'));
  const dest = row.role === 'organizer' ? '/organizer' : '/pulse';
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
