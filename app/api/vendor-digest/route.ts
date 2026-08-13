import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { eventToken, sendEventEmail } from '@/lib/public-events';

function stringList(value: string): string[] {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.map(String) : []; } catch { return []; }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? '').toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, error: 'Valid email required.' }, { status: 400 });
    await prisma.vendorDigestSubscription.upsert({
      where: { email },
      create: { email, regions: JSON.stringify(body.regions ?? []), categories: JSON.stringify(body.categories ?? []), unsubscribeToken: eventToken() },
      update: { active: true, regions: JSON.stringify(body.regions ?? []), categories: JSON.stringify(body.categories ?? []) },
    });
    return NextResponse.json({ ok: true, message: 'You’re subscribed to weekly vendor opportunities.' });
  } catch (error) {
    console.error('Vendor digest subscription failed', error);
    return NextResponse.json({ ok: false, error: 'Subscriptions are temporarily unavailable. Please try again shortly.' }, { status: 503 });
  }
}

export async function GET(req: NextRequest) {
  const unsubscribe = new URL(req.url).searchParams.get('unsubscribe');
  if (unsubscribe) {
    await prisma.vendorDigestSubscription.updateMany({ where: { unsubscribeToken: unsubscribe }, data: { active: false } });
    return new NextResponse('<!doctype html><html><body style="font-family:system-ui;padding:48px"><h1>You are unsubscribed</h1><p>You will no longer receive VendorFlow weekly opportunity emails.</p><a href="/">Return to VendorFlow</a></body></html>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
  }
  if (!process.env.CRON_SECRET || req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ ok: false }, { status: 401 });
  await prisma.publicEventListing.updateMany({ where: { status: 'published', expiresAt: { lt: new Date() } }, data: { status: 'expired' } });
  const subscribers = await prisma.vendorDigestSubscription.findMany({ where: { active: true } });
  const upcoming = await prisma.publicEventListing.findMany({ where: { status: 'published', startDate: { gte: new Date() }, vendorApplicationUrl: { not: null } }, orderBy: { startDate: 'asc' }, take: 30 });
  let sent = 0;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vendorflow-mu.vercel.app';
  for (const sub of subscribers) {
    const regions = stringList(sub.regions); const categories = stringList(sub.categories);
    const matches = upcoming.filter(event => (!regions.length || regions.includes(event.state) || regions.includes(event.city)) && (!categories.length || categories.includes(event.category))).slice(0, 8);
    if (!matches.length) continue;
    const token = sub.unsubscribeToken ?? eventToken();
    if (!sub.unsubscribeToken) await prisma.vendorDigestSubscription.update({ where: { id: sub.id }, data: { unsubscribeToken: token } });
    const html = `<h2>New vendor opportunities</h2><ul>${matches.map(event => `<li><a href="${appUrl}/community-events/${event.slug}">${event.name}</a> — ${event.city}, ${event.state} — ${event.startDate.toLocaleDateString()}</li>`).join('')}</ul><p style="font-size:12px;color:#666"><a href="${appUrl}/api/vendor-digest?unsubscribe=${encodeURIComponent(token)}">Unsubscribe</a></p>`;
    if (await sendEventEmail(sub.email, 'New vendor opportunities near you', html)) { sent++; await prisma.vendorDigestSubscription.update({ where: { id: sub.id }, data: { lastSentAt: new Date() } }); }
  }
  return NextResponse.json({ ok: true, subscribers: subscribers.length, sent, opportunities: upcoming.length });
}
