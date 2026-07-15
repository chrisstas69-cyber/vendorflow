import { NextRequest, NextResponse } from 'next/server';
import type Database from 'better-sqlite3';
import { getDb, getEvents, getEventStats } from '@/lib/db';
import { mockPlatformEvents } from '@/lib/platform-data';

/**
 * The scraped-events store is better-sqlite3, which cannot open on Vercel's
 * read-only serverless filesystem. When that happens we still serve the static
 * platform listings instead of 500-ing the whole Discover page.
 */
function openScrapeDb(): Database.Database | null {
  try {
    return getDb();
  } catch (err) {
    console.warn(
      '[events/list] Scrape DB unavailable — serving platform events only:',
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

const EMPTY_STATS = {
  total: 0, nightTotal: 0, next7: 0, next30: 0, next90: 0, newToday: 0,
  njTotal: 0, njNewToday: 0, fireworksTotal: 0, weekendTotal: 0, lastScrape: 'Never',
};

function safeStats(db: Database.Database | null) {
  if (!db) return EMPTY_STATS;
  try {
    return getEventStats(db);
  } catch {
    return EMPTY_STATS;
  }
}
import {
  EXPERIENCE_TAGS,
  eventRowToListing,
  filterListingsByExperienceTags,
  mergeListings,
  platformEventToListing,
  regionSlugToDb,
  townSlugToQuery,
  type EventListing,
} from '@/lib/marketplace';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view') || 'all';

  // Unified marketplace / discover search params
  const q = searchParams.get('q') || undefined;
  const townSlug = searchParams.get('town') || undefined;
  const regionSlug = searchParams.get('regionSlug') || undefined;
  const state = (searchParams.get('state') as 'NY' | 'NJ' | 'all' | null) || undefined;
  const tagsParam = searchParams.get('tags');
  const tagIds = tagsParam ? tagsParam.split(',').filter(Boolean) : [];
  const includePlatform = searchParams.get('includePlatform') !== '0';
  const format = searchParams.get('format') || 'legacy';

  const db = openScrapeDb();
  const dbRegion = regionSlug ? regionSlugToDb(regionSlug) : searchParams.get('region') || undefined;
  const townQuery = townSlug ? townSlugToQuery(townSlug) : undefined;

  const isDiscoverSearch =
    view === 'discover' ||
    view === 'search' ||
    !!q ||
    !!townSlug ||
    !!regionSlug ||
    tagIds.length > 0 ||
    format === 'marketplace';

  if (isDiscoverSearch) {
    const rows = db
      ? getEvents(db, {
          region: dbRegion,
          town: townQuery,
          query: q,
          state: state === 'NY' || state === 'NJ' ? state : undefined,
          daysAhead: 90,
          limit: 200,
        })
      : [];

    let listings: EventListing[] = rows.map(eventRowToListing);

    if (includePlatform) {
      const platform = mockPlatformEvents
        .filter(e => e.listingStatus === 'published')
        .filter(e => {
          if (state === 'NY' && e.state !== 'NY') return false;
          if (state === 'NJ' && e.state !== 'NJ') return false;
          if (dbRegion && e.region !== dbRegion) return false;
          if (townQuery) {
            const t = townQuery.toLowerCase();
            if (!e.city.toLowerCase().includes(t) && !e.location.toLowerCase().includes(t)) return false;
          }
          if (q) {
            const lower = q.toLowerCase();
            if (
              !e.name.toLowerCase().includes(lower) &&
              !e.city.toLowerCase().includes(lower) &&
              !e.description.toLowerCase().includes(lower)
            ) {
              return false;
            }
          }
          return true;
        })
        .map(platformEventToListing);
      listings = mergeListings(listings, platform);
    }

    if (tagIds.length > 0) {
      listings = filterListingsByExperienceTags(listings, tagIds);
    }

    const stats = safeStats(db);

    return NextResponse.json({
      listings,
      events: rows,
      stats,
      meta: {
        total: listings.length,
        sqliteCount: rows.length,
        experienceTags: EXPERIENCE_TAGS.map(t => ({ id: t.id, label: t.label, icon: t.icon })),
        filters: { q, town: townSlug, regionSlug, state, tags: tagIds },
      },
    });
  }

  // Legacy view routing (ops dashboard)
  if (!db) {
    return NextResponse.json({ events: [], stats: EMPTY_STATS });
  }
  let events;
  const region = searchParams.get('region') || undefined;
  const eventType = searchParams.get('event_type') || undefined;

  switch (view) {
    case 'night':
      events = getEvents(db, { nightOnly: true, region });
      break;
    case 'week':
      events = getEvents(db, { daysAhead: 7, region });
      break;
    case 'month':
      events = getEvents(db, { daysAhead: 30, region });
      break;
    case 'new':
      events = getEvents(db, { newToday: true, region });
      break;
    case 'nj':
      events = getEvents(db, { region: 'NJ' });
      break;
    case 'nj-night':
      events = getEvents(db, { nightOnly: true, region: 'NJ' });
      break;
    case 'nj-new':
      events = getEvents(db, { newToday: true, region: 'NJ' });
      break;
    case 'fireworks':
      events = getEvents(db, { event_type: 'fireworks', region });
      break;
    case 'fireworks-ny':
      events = getEvents(db, { event_type: 'fireworks', region: 'Long Island' });
      break;
    case 'fireworks-nj':
      events = getEvents(db, { event_type: 'fireworks', region: 'NJ' });
      break;
    case 'weekend':
      events = getEvents(db, { isWeekend: true, region });
      break;
    default:
      events = getEvents(db, { region, event_type: eventType });
  }

  const stats = getEventStats(db);
  return NextResponse.json({ events, stats });
}
