/** Curated Unsplash photos — street fairs, crowds, vendor tents, festivals */

export const STOCK = {
  festivalCrowd:
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80&auto=format&fit=crop',
  streetFair:
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80&auto=format&fit=crop',
  carnival:
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80&auto=format&fit=crop',
  farmersMarket:
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=80&auto=format&fit=crop',
  schoolFair:
    'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=1200&q=80&auto=format&fit=crop',
  beachFest:
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80&auto=format&fit=crop',
  expoHall:
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80&auto=format&fit=crop',
  nightMarket:
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80&auto=format&fit=crop',
  vendorTent:
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80&auto=format&fit=crop',
  toyBooth:
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80&auto=format&fit=crop',
  balloonVendor:
    'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&q=80&auto=format&fit=crop',
  foodTrucks:
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80&auto=format&fit=crop',
  aerialFair:
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80&auto=format&fit=crop',
  crowdHands:
    'https://images.unsplash.com/photo-1459749411175-04bf8504cebf?w=1200&q=80&auto=format&fit=crop',
  carShow:
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80&auto=format&fit=crop',
  liveMusic:
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80&auto=format&fit=crop',
} as const;

export const EVENT_COVER_IMAGES: Record<string, string> = {
  'evt-001': STOCK.festivalCrowd,
  'evt-002': STOCK.carnival,
  'evt-003': STOCK.farmersMarket,
  'evt-004': STOCK.schoolFair,
  'evt-005': STOCK.streetFair,
  'evt-006': STOCK.expoHall,
  'evt-007': STOCK.beachFest,
  'evt-008': STOCK.aerialFair,
  'evt-009': STOCK.carShow,
};

export const DEFAULT_EVENT_IMAGE = STOCK.festivalCrowd;

export function getEventCoverImage(eventId: string, override?: string): string {
  return override || EVENT_COVER_IMAGES[eventId] || DEFAULT_EVENT_IMAGE;
}

export interface ShowcaseProfile {
  id: string;
  type: 'vendor' | 'organizer';
  name: string;
  subtitle: string;
  imageUrl: string;
  href: string;
}

export const mockShowcaseProfiles: ShowcaseProfile[] = [
  {
    id: 'v-1',
    type: 'vendor',
    name: 'Glow Toys NJ',
    subtitle: 'LED toys & light-up wands — 40+ fairs/year',
    imageUrl: STOCK.toyBooth,
    href: '/for-vendors',
  },
  {
    id: 'v-2',
    type: 'vendor',
    name: 'Smokin\' BBQ Co.',
    subtitle: 'Award-winning food tent — lines around the block',
    imageUrl: STOCK.foodTrucks,
    href: '/for-vendors',
  },
  {
    id: 'v-3',
    type: 'vendor',
    name: 'Fun Faces Balloons',
    subtitle: 'Balloons, face paint & carnival games',
    imageUrl: STOCK.balloonVendor,
    href: '/for-vendors',
  },
  {
    id: 'o-1',
    type: 'organizer',
    name: 'NYC Parks Events',
    subtitle: 'Central Park festivals — 12K+ attendees',
    imageUrl: STOCK.festivalCrowd,
    href: '/for-organizers',
  },
  {
    id: 'o-2',
    type: 'organizer',
    name: 'Main Street BID',
    subtitle: 'Hoboken street fair — aerial crowd shots',
    imageUrl: STOCK.aerialFair,
    href: '/for-organizers',
  },
  {
    id: 'o-3',
    type: 'organizer',
    name: 'LI Summer Events',
    subtitle: 'Jones Beach boardwalk festivals',
    imageUrl: STOCK.beachFest,
    href: '/for-organizers',
  },
];
