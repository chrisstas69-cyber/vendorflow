import type { EventRow } from '@/lib/db';
import type { PlatformEvent } from '@/lib/platform-data';
import { CATEGORY_LABELS } from '@/lib/platform-data';
import { DEFAULT_EVENT_IMAGE, getEventCoverImage } from '@/lib/event-images';

/** Experience tags extracted from SQLite rows — powers filter chips */
export interface ExperienceTagDef {
  id: string;
  label: string;
  icon: string;
  keywords: string[];
}

export const EXPERIENCE_TAGS: ExperienceTagDef[] = [
  { id: 'kids-zone', label: 'Kids zone', icon: '🎠', keywords: ['kids', 'children', 'family', 'carnival', 'school', 'toddler', 'youth'] },
  { id: 'food-trucks', label: 'Food trucks', icon: '🍔', keywords: ['food truck', 'food fest', 'taste of', 'bbq', 'culinary', 'food vendor'] },
  { id: 'free-parking', label: 'Free parking', icon: '🅿️', keywords: ['free parking', 'free admission', 'free entry', 'no admission', 'complimentary parking'] },
  { id: 'live-music', label: 'Live music', icon: '🎵', keywords: ['live music', 'concert', 'band', 'dj', 'performance'] },
  { id: 'fireworks', label: 'Fireworks', icon: '🎆', keywords: ['firework', 'pyrotechnic', 'july 4', '4th of july'] },
  { id: 'outdoor', label: 'Outdoor', icon: '🌳', keywords: ['outdoor', 'park', 'boardwalk', 'beach', 'street fair', 'farmers market'] },
  { id: 'indoor', label: 'Indoor', icon: '🏛️', keywords: ['indoor', 'expo hall', 'convention center', 'gymnasium'] },
  { id: 'free-event', label: 'Free event', icon: '🆓', keywords: ['free event', 'free admission', 'no charge', 'donation optional'] },
];

export type ListingSource = 'platform' | 'sqlite';

export interface EventListing {
  id: string;
  href: string;
  title: string;
  date: string;
  time?: string | null;
  locationLabel: string;
  city?: string;
  state?: string;
  region?: string;
  imageUrl: string;
  categoryLabel: string;
  tags: string[];
  experienceTags: string[];
  promotionTier: 'none' | 'featured' | 'spotlight';
  source: ListingSource;
  externalUrl?: string | null;
}

/** SEO region slugs → SQLite region values */
export const REGION_SLUG_TO_DB: Record<string, string> = {
  'long-island': 'Long Island',
  li: 'Long Island',
  nj: 'NJ',
  nyc: 'NYC',
  'hudson-county': 'Hudson County',
  'nassau-county': 'Nassau County',
  'suffolk-county': 'Suffolk County',
};

export const DB_REGION_TO_SLUG: Record<string, string> = {
  'Long Island': 'long-island',
  NJ: 'nj',
  NYC: 'nyc',
};

/** Curated town landing pages for static generation + SEO */
export const TOWN_LANDING_PAGES: { region: string; town: string; title: string }[] = [
  { region: 'long-island', town: 'hempstead', title: 'Hempstead' },
  { region: 'long-island', town: 'westbury', title: 'Westbury' },
  { region: 'long-island', town: 'huntington', title: 'Huntington' },
  { region: 'long-island', town: 'montauk', title: 'Montauk' },
  { region: 'long-island', town: 'patchogue', title: 'Patchogue' },
  { region: 'nj', town: 'hoboken', title: 'Hoboken' },
  { region: 'nj', town: 'jersey-city', title: 'Jersey City' },
  { region: 'nj', town: 'newark', title: 'Newark' },
  { region: 'nj', town: 'asbury-park', title: 'Asbury Park' },
  { region: 'nj', town: 'princeton', title: 'Princeton' },
  { region: 'nyc', town: 'manhattan', title: 'Manhattan' },
  { region: 'nyc', town: 'brooklyn', title: 'Brooklyn' },
];

export function slugifyGeo(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function townSlugToQuery(slug: string): string {
  return slug.replace(/-/g, ' ');
}

export function regionSlugToDb(slug: string): string | undefined {
  return REGION_SLUG_TO_DB[slug.toLowerCase()];
}

export function extractExperienceTags(text: string, eventType?: string | null): string[] {
  const haystack = `${text} ${eventType || ''}`.toLowerCase();
  const found: string[] = [];
  for (const tag of EXPERIENCE_TAGS) {
    if (tag.keywords.some(kw => haystack.includes(kw))) {
      found.push(tag.id);
    }
  }
  if (eventType === 'fireworks' && !found.includes('fireworks')) found.push('fireworks');
  if (eventType === 'carnival' && !found.includes('kids-zone')) found.push('kids-zone');
  return found;
}

export function eventTypeLabel(eventType: string | null | undefined): string {
  if (!eventType) return 'Community Event';
  return eventType
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function inferState(region: string | null | undefined, location: string | null): 'NY' | 'NJ' {
  if (region === 'NJ') return 'NJ';
  const loc = (location || '').toLowerCase();
  if (loc.includes(', nj') || loc.includes(' nj')) return 'NJ';
  return 'NY';
}

export function eventRowToListing(row: EventRow): EventListing {
  const text = `${row.title} ${row.description || ''} ${row.location || ''}`;
  const experienceTags = extractExperienceTags(text, row.event_type);
  const state = inferState(row.region, row.location);
  const city = row.town || row.county || row.region || 'NY/NJ';
  const href = row.url && row.url.startsWith('http') ? row.url : `/discover/event/${encodeURIComponent(row.event_id)}`;

  return {
    id: row.event_id,
    href,
    title: row.title,
    date: row.event_date,
    time: row.event_time,
    locationLabel: [row.town, row.county, row.region].filter(Boolean).join(', ') || row.location || 'NY/NJ',
    city: row.town || undefined,
    state,
    region: row.region,
    imageUrl: getEventCoverImage(row.event_id),
    categoryLabel: eventTypeLabel(row.event_type),
    tags: experienceTags.map(id => EXPERIENCE_TAGS.find(t => t.id === id)?.label || id),
    experienceTags,
    promotionTier: 'none',
    source: 'sqlite',
    externalUrl: row.url,
  };
}

export function platformEventToListing(event: PlatformEvent): EventListing {
  const text = `${event.name} ${event.description} ${event.audienceTags.join(' ')}`;
  const experienceTags = extractExperienceTags(text, event.category);
  return {
    id: event.id,
    href: `/events/${event.id}`,
    title: event.name,
    date: event.date,
    time: event.time,
    locationLabel: `${event.city}, ${event.state}`,
    city: event.city,
    state: event.state as 'NY' | 'NJ',
    region: event.region,
    imageUrl: event.coverImageUrl,
    categoryLabel: CATEGORY_LABELS[event.category],
    tags: event.audienceTags,
    experienceTags,
    promotionTier: event.promotionTier,
    source: 'platform',
  };
}

export function filterListingsByExperienceTags(
  listings: EventListing[],
  tagIds: string[]
): EventListing[] {
  if (tagIds.length === 0) return listings;
  return listings.filter(l => tagIds.every(t => l.experienceTags.includes(t)));
}

export function filterListingsByQuery(listings: EventListing[], q: string): EventListing[] {
  if (!q.trim()) return listings;
  const lower = q.toLowerCase();
  return listings.filter(
    l =>
      l.title.toLowerCase().includes(lower) ||
      l.locationLabel.toLowerCase().includes(lower) ||
      l.tags.some(t => t.toLowerCase().includes(lower))
  );
}

export function mergeListings(sqlite: EventListing[], platform: EventListing[]): EventListing[] {
  const seen = new Set<string>();
  const out: EventListing[] = [];
  for (const item of [...platform, ...sqlite]) {
    const key = `${item.source}:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
