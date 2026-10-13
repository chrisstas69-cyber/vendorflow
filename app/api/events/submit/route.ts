import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { escapeHtml, eventToken, findPossibleDuplicate, sendEventEmail, type PublicEventInput } from '@/lib/public-events';
import { rateLimit } from '@/lib/auth/guards';
import { resolveAppOrigin } from '@/lib/auth/session';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const input = await req.json() as PublicEventInput;
    let sourceUrl: URL | null = null;
    try { sourceUrl = new URL(input.sourceUrl); } catch { sourceUrl = null; }
    if (!input.name?.trim() || input.name.length > 160 || !input.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.startDate) || !input.venueName?.trim() || input.venueName.length > 160 || !input.city?.trim() || input.city.length > 100 || !['NY', 'NJ'].includes(input.state) || !EMAIL_RE.test(input.email ?? '') || sourceUrl?.protocol !== 'https:' || (input.description?.length ?? 0) > 5000 || (input.organizerName?.length ?? 0) > 160) {
      return NextResponse.json({ ok: false, error: 'Name, date, venue, city, state, valid email, and original source URL are required.' }, { status: 400 });
    }
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (!rateLimit(`event-submit:${ip}`, 8, 60_000) || !rateLimit(`event-submit:${input.email.toLowerCase()}`, 5, 60 * 60_000)) return NextResponse.json({ ok: false, error: 'Too many submissions. Try again shortly.' }, { status: 429 });
    const duplicate = await findPossibleDuplicate(input);
    const token = eventToken();
    const row = await prisma.eventSubmission.create({
      data: { email: input.email.toLowerCase().trim(), verificationToken: token, payloadJson: JSON.stringify(input), duplicateOfId: duplicate?.id },
    });
    const link = `${resolveAppOrigin(req.headers)}/api/events/verify?token=${encodeURIComponent(token)}`;
    const sent = await sendEventEmail(row.email, 'Verify your VendorFlow event submission', `<p>Verify <strong>${escapeHtml(input.name)}</strong>:</p><p><a href="${link}">Verify event submission</a></p>`);
    return NextResponse.json({ ok: true, submissionId: row.id, duplicate: duplicate ? { name: duplicate.name, href: duplicate.href } : null, message: sent ? 'Check your email to verify the event.' : 'Email delivery is not configured. Use the verification link below for local testing.', devLink: process.env.NODE_ENV !== 'production' ? link : undefined });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Could not submit event.' }, { status: 500 });
  }
}
