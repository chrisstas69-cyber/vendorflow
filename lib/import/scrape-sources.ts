/**
 * Event scrape sources — synced from LI Event Tracker registry + VendorFlow scrapers.
 * Used by organizer intel and future source-health UI.
 */
export interface ScrapeSourceRecord {
  id: string;
  name: string;
  baseUrl: string;
  listUrls: string[];
  parserKind: string;
  region: string;
  county?: string;
  town?: string;
  tier: number;
  category: 'aggregator' | 'chamber' | 'patch' | 'fireworks' | 'nj' | 'family';
  active: boolean;
}

export const SCRAPE_SOURCES: ScrapeSourceRecord[] = [
  {
    id: 'nassau-county-fairs',
    name: 'Nassau County Fairs',
    baseUrl: 'https://nassaucountyfairs.com',
    listUrls: ['https://nassaucountyfairs.com'],
    parserKind: 'nassau_list',
    region: 'long-island',
    county: 'nassau',
    tier: 1,
    category: 'aggregator',
    active: true,
  },
  {
    id: 'li-fairs',
    name: 'LI Fairs',
    baseUrl: 'https://lifairs.com',
    listUrls: ['https://lifairs.com'],
    parserKind: 'lifairs_list',
    region: 'long-island',
    tier: 1,
    category: 'aggregator',
    active: true,
  },
  {
    id: 'long-island-events',
    name: 'Long Island Events',
    baseUrl: 'https://events.longisland.com',
    listUrls: [
      'https://events.longisland.com/festivals-carnivals',
      'https://events.longisland.com/kids-family',
      'https://events.longisland.com/craft-fairs-shopping',
    ],
    parserKind: 'generic_html',
    region: 'long-island',
    tier: 1,
    category: 'aggregator',
    active: true,
  },
  {
    id: 'eventbrite-li',
    name: 'Eventbrite LI',
    baseUrl: 'https://www.eventbrite.com',
    listUrls: [
      'https://www.eventbrite.com/d/ny--long-island/street-fair/',
      'https://www.eventbrite.com/d/ny--long-island/festival/',
    ],
    parserKind: 'json_ld',
    region: 'long-island',
    tier: 2,
    category: 'aggregator',
    active: true,
  },
  {
    id: 'discover-long-island',
    name: 'Discover Long Island',
    baseUrl: 'https://www.discoverlongisland.com',
    listUrls: ['https://www.discoverlongisland.com/sports/upcoming-events/'],
    parserKind: 'generic_html',
    region: 'long-island',
    tier: 2,
    category: 'aggregator',
    active: true,
  },
  {
    id: 'mommy-poppins-li',
    name: 'Mommy Poppins LI',
    baseUrl: 'https://mommypoppins.com',
    listUrls: ['https://mommypoppins.com/local-feeds/long-island'],
    parserKind: 'generic_html',
    region: 'long-island',
    tier: 2,
    category: 'family',
    active: true,
  },
  {
    id: 'long-island-press',
    name: 'Long Island Press Events',
    baseUrl: 'https://events.longislandpress.com',
    listUrls: ['https://events.longislandpress.com'],
    parserKind: 'longislandpress_list',
    region: 'long-island',
    tier: 2,
    category: 'aggregator',
    active: true,
  },
  {
    id: 'fairs-and-festivals-ny',
    name: 'Fairs And Festivals NY',
    baseUrl: 'https://fairsandfestivals.net',
    listUrls: ['https://fairsandfestivals.net/states/NY/'],
    parserKind: 'generic_html',
    region: 'long-island',
    tier: 1,
    category: 'aggregator',
    active: true,
  },
  {
    id: 'patch-huntington',
    name: 'Patch Huntington',
    baseUrl: 'https://patch.com/new-york/huntington',
    listUrls: ['https://patch.com/new-york/huntington/calendar'],
    parserKind: 'generic_html',
    region: 'long-island',
    county: 'suffolk',
    town: 'Huntington',
    tier: 3,
    category: 'patch',
    active: true,
  },
  {
    id: 'patch-babylon',
    name: 'Patch Babylon',
    baseUrl: 'https://patch.com/new-york/babylonvillage',
    listUrls: ['https://patch.com/new-york/babylonvillage/calendar'],
    parserKind: 'generic_html',
    region: 'long-island',
    county: 'suffolk',
    town: 'Babylon',
    tier: 3,
    category: 'patch',
    active: true,
  },
  {
    id: 'patch-patchogue',
    name: 'Patch Patchogue',
    baseUrl: 'https://patch.com/new-york/patchogue',
    listUrls: ['https://patch.com/new-york/patchogue/calendar'],
    parserKind: 'generic_html',
    region: 'long-island',
    county: 'suffolk',
    town: 'Patchogue',
    tier: 3,
    category: 'patch',
    active: true,
  },
  {
    id: 'chambers-csv',
    name: 'Chamber of Commerce sites (CSV)',
    baseUrl: '',
    listUrls: [],
    parserKind: 'chamber_csv',
    region: 'long-island',
    tier: 3,
    category: 'chamber',
    active: true,
  },
];

export function getScrapeSourceCount(): number {
  return SCRAPE_SOURCES.length;
}
