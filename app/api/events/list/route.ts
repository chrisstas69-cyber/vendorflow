import { NextRequest, NextResponse } from 'next/server';
import type Database from 'better-sqlite3';
import { getDb, getEvents, getEventStats } from '@/lib/db';
import { mockPlatformEvents } from '@/lib/platform-data';
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
  total: 0,
  nightTotal: 0,
  next7: 0,
  next30: 0,
  next90: 0,
  newToday: 0,
  njTotal: 0,
  njNewToday: 0,
  fireworksTotal: 0,
  weekendTotal: 0,
  lastScrape: 'Never',
};

function safeStats(db: Database.Database | null) {
  if (!db) return EMPTY_STATS;
  try {
    return getEventStats(db);
  } catch {
    return EMPTY_STATS;
  }
}

function safeGetEvents(
  db: Database.Database | null,
  opts: Parameters<typeof getEvents>[1]
) {
  if (!db) return [];
  try {
    return getEvents(db, opts);
  } catch (err) {
    console.warn(
      '[events/list] Scrape query failed — platform events only:',
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

function platformListings(filters: {
  state?: 'NY' | 'NJ' | 'all' | string;
  dbRegion?: string;
  townQuery?: string;
  q?: string;
}): EventListing[] {
  return mockPlatformEvents
    .filter(e => e.listingStatus === 'published')
    .filter(e => {
      if (filters.state === 'NY' && e.state !== 'NY') return false;
      if (filters.state === 'NJ' && e.state !== 'NJ') return false;
      if (filters.dbRegion && e.region !== filters.dbRegion) return false;
      if (filters.townQuery) {
        const t = filters.townQuery.toLowerCase();
        if (!e.city.toLowerCase().includes(t) && !e.location.toLowerCase().includes(t)) {
          return false;
        }
      }
      if (filters.q) {
        const lower = filters.q.toLowerCase();
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
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'all';

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
      const rows = safeGetEvents(db, {
        region: dbRegion,
        town: townQuery,
        query: q,
        state: state === 'NY' || state === 'NJ' ? state : undefined,
        daysAhead: 90,
        limit: 200,
      });

      let listings: EventListing[] = rows.map(eventRowToListing);

      if (includePlatform) {
        listings = mergeListings(
          listings,
          platformListings({ state, dbRegion, townQuery, q })
        );
      }

      if (tagIds.length > 0) {
        listings = filterListingsByExperienceTags(listings, tagIds);
      }

      return NextResponse.json({
        listings,
        events: rows,
        stats: safeStats(db),
        meta: {
          total: listings.length,
          sqliteCount: rows.length,
          experienceTags: EXPERIENCE_TAGS.map(t => ({
            id: t.id,
            label: t.label,
            icon: t.icon,
          })),
          filters: { q, town: townSlug, regionSlug, state, tags: tagIds },
        },
      });
    }

    // Legacy view routing (ops dashboard)
    if (!db) {
      return NextResponse.json({ events: [], stats: EMPTY_STATS });
    }

    const region = searchParams.get('region') || undefined;
    const eventType = searchParams.get('event_type') || undefined;

    let events;
    switch (view) {
      case 'night':
        events = safeGetEvents(db, { nightOnly: true, region });
        break;
      case 'week':
        events = safeGetEvents(db, { daysAhead: 7, region });
        break;
      case 'month':
        events = safeGetEvents(db, { daysAhead: 30, region });
        break;
      case 'new':
        events = safeGetEvents(db, { newToday: true, region });
        break;
      case 'nj':
        events = safeGetEvents(db, { region: 'NJ' });
        break;
      case 'nj-night':
        events = safeGetEvents(db, { nightOnly: true, region: 'NJ' });
        break;
      case 'nj-new':
        events = safeGetEvents(db, { newToday: true, region: 'NJ' });
        break;
      case 'fireworks':
        events = safeGetEvents(db, { event_type: 'fireworks', region });
        break;
      case 'fireworks-ny':
        events = safeGetEvents(db, { event_type: 'fireworks', region: 'Long Island' });
        break;
      case 'fireworks-nj':
        events = safeGetEvents(db, { event_type: 'fireworks', region: 'NJ' });
        break;
      case 'weekend':
        events = safeGetEvents(db, { isWeekend: true, region });
        break;
      default:
        events = safeGetEvents(db, { region, event_type: eventType });
    }

    return NextResponse.json({ events, stats: safeStats(db) });
  } catch (err) {
    console.error('[events/list] unexpected error:', err);
    // Last-resort: never return an empty 500 body — Discover needs JSON
    const listings = platformListings({});
    return NextResponse.json(
      {
        listings,
        events: [],
        stats: EMPTY_STATS,
        meta: {
          total: listings.length,
          sqliteCount: 0,
          experienceTags: EXPERIENCE_TAGS.map(t => ({
            id: t.id,
            label: t.label,
            icon: t.icon,
          })),
          filters: {},
          degraded: true,
        },
      },
      { status: 200 }
    );
  }
}
