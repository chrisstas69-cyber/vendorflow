import { NextRequest, NextResponse } from 'next/server';
import { verifySession, sessionCookieName } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(sessionCookieName())?.value;
  if (!token) return NextResponse.json({ ok: true, session: null });
  const session = verifySession(token);
  return NextResponse.json({ ok: true, session });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieName(), '', { path: '/', maxAge: 0 });
  return res;
}
