import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { mockPlatformEvents } from '@/lib/platform-data';
import { getDb, type EventRow } from '@/lib/db';

export interface PublicEventInput {
  name: string; startDate: string; endDate?: string; timeLabel?: string; venueName: string;
  streetAddress?: string; city: string; state: 'NY' | 'NJ'; postalCode?: string;
  description: string; category: string; imageUrl?: string; organizerName: string;
  email: string; sourceUrl: string; vendorApplicationUrl?: string; vendorDeadline?: string;
  boothFee?: number; vendorDetails?: string;
}

export function slugifyEvent(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function normalizeEventName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function eventToken() { return randomBytes(24).toString('base64url'); }

export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] ?? character);
}

export async function findPossibleDuplicate(input: Pick<PublicEventInput, 'name' | 'startDate' | 'city' | 'state'>) {
  const normalized = normalizeEventName(input.name);
  const staticMatch = mockPlatformEvents.find(event =>
    normalizeEventName(event.name) === normalized && event.date === input.startDate &&
    event.city.toLowerCase() === input.city.toLowerCase() && event.state === input.state
  );
  if (staticMatch) return { id: staticMatch.id, name: staticMatch.name, href: `/events/${staticMatch.id}` };
  try {
    const rows = getDb().prepare('SELECT * FROM events WHERE event_date = ?').all(input.startDate) as EventRow[];
    const scrapedMatch = rows.find(event => normalizeEventName(event.title) === normalized && `${event.town ?? ''} ${event.location ?? ''}`.toLowerCase().includes(input.city.toLowerCase()));
    if (scrapedMatch) return { id: scrapedMatch.event_id, name: scrapedMatch.title, href: `/discover/event/${encodeURIComponent(scrapedMatch.event_id)}` };
  } catch {
    // The scrape index is optional in serverless environments.
  }
  const day = new Date(`${input.startDate}T12:00:00Z`);
  const start = new Date(day); start.setUTCDate(start.getUTCDate() - 1);
  const end = new Date(day); end.setUTCDate(end.getUTCDate() + 1);
  const candidates = await prisma.publicEventListing.findMany({
    where: { state: input.state, city: { equals: input.city, mode: 'insensitive' }, startDate: { gte: start, lte: end }, status: { in: ['pending', 'published'] } },
    select: { id: true, name: true, slug: true }, take: 20,
  });
  const match = candidates.find(item => normalizeEventName(item.name) === normalized);
  return match ? { ...match, href: `/community-events/${match.slug}` } : null;
}

export async function sendEventEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return false;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.RESEND_FROM ?? 'VendorFlow <onboarding@resend.dev>', to, subject, html }),
  });
  return response.ok;
}

export function publicEventToListing(event: {
  id: string; slug: string; name: string; startDate: Date; timeLabel: string | null; venueName: string;
  city: string; state: string; category: string; imageUrl: string | null; sourceUrl: string | null;
}) {
  return {
    id: event.id,
    href: `/community-events/${event.slug}`,
    title: event.name,
    date: event.startDate.toISOString().slice(0, 10),
    time: event.timeLabel,
    locationLabel: `${event.city}, ${event.state}`,
    city: event.city,
    state: event.state,
    region: event.state === 'NY' ? 'Long Island' : 'NJ',
    imageUrl: event.imageUrl ?? 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80&auto=format&fit=crop',
    categoryLabel: event.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    tags: [], experienceTags: [], promotionTier: 'none' as const, source: 'platform' as const,
    externalUrl: event.sourceUrl,
  };
}
