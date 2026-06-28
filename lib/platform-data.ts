import type { AlphaTier, MockEvent } from '@/lib/mock-data';
import { mockEvents } from '@/lib/mock-data';
import type { OrganizerPipelineStage } from '@/lib/organizer-schema';
import { getEventCoverImage, STOCK } from '@/lib/event-images';

export type UserRole = 'public' | 'vendor' | 'organizer';

export type EventCategory =
  | 'street-fair'
  | 'farmers-market'
  | 'festival'
  | 'school-fair'
  | 'carnival'
  | 'car-show'
  | 'music'
  | 'food-truck'
  | 'holiday'
  | 'sports'
  | 'craft-fair'
  | 'community';

export interface Organizer {
  id: string;
  name: string;
  email: string;
  organization: string;
  eventsHosted: number;
  verified: boolean;
}

export type PromotionTier = 'none' | 'featured' | 'spotlight';

export interface EventSeries {
  id: string;
  name: string;
  slug: string;
  description: string;
  organizerId: string;
  seasonLabel: string;
  eventIds: string[];
  coverImageUrl?: string;
}

export interface PlatformEvent {
  id: string;
  slug: string;
  name: string;
  date: string;
  time?: string;
  location: string;
  city: string;
  state: string;
  region: string;
  description: string;
  category: EventCategory;
  audienceTags: string[];
  organizerId: string;
  organizerName: string;
  seriesId?: string;
  listingStatus: 'published' | 'draft';
  vendorSlots: number;
  vendorSlotsFilled: number;
  applicationDeadline?: string;
  views: number;
  saves: number;
  isClaimable: boolean;
  coverImageUrl: string;
  galleryUrls: string[];
  promotionTier: PromotionTier;
  tier: AlphaTier;
  alphaScore: number;
  familyDensity: number;
  footTraffic: string;
  boothFee: number;
  permitFee: number;
  roiMin: number;
  roiMax: number;
  dudRisk: number;
  tags: string[];
}

export interface VendorSubmission {
  id: string;
  eventId: string;
  eventName: string;
  vendorName: string;
  vendorEmail: string;
  category: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  pipelineStage?: OrganizerPipelineStage;
  infoRequested?: boolean;
  submittedAt: string;
  hasInsurance: boolean;
  documents: import('@/lib/documents').VendorDocument[];
  requiredForms: string[];
  ce200SentAt?: string;
  applicationId?: string;
  setupPhotoUrl?: string;
  shortlisted?: boolean;
  boothId?: string;
  paymentStatus?: import('@/lib/organizer-schema').PaymentStatus;
  contractStatus?: import('@/lib/organizer-schema').ContractStatus;
}

/** Demo organizer owns seeded events; evt-003 stays claimable for scrape flow */
export const DEMO_ORGANIZER_ID = 'org-demo';
export const DEMO_ORGANIZER_NAME = 'My Events Co.';

const ORGANIZER_META: Record<string, Partial<PlatformEvent>> = {
  'evt-001': { city: 'New York', state: 'NY', region: 'NYC', organizerId: DEMO_ORGANIZER_ID, organizerName: DEMO_ORGANIZER_NAME, seriesId: 'series-spring-2026', category: 'festival', audienceTags: ['Family', 'Free', 'Outdoor'], vendorSlots: 80, vendorSlotsFilled: 62, applicationDeadline: '2026-02-28', views: 2840, saves: 412, promotionTier: 'featured' as const },
  'evt-002': { city: 'Jersey City', state: 'NJ', region: 'Hudson County', organizerId: DEMO_ORGANIZER_ID, organizerName: DEMO_ORGANIZER_NAME, seriesId: 'series-spring-2026', category: 'carnival', audienceTags: ['Family', 'Kids', 'Indoor'], vendorSlots: 45, vendorSlotsFilled: 38, applicationDeadline: '2026-03-01', views: 1920, saves: 287 },
  'evt-003': { city: 'Newark', state: 'NJ', region: 'Essex County', organizerId: 'org-scraped', organizerName: 'Unclaimed — scraped', category: 'farmers-market', audienceTags: ['Local', 'Food', 'Outdoor'], vendorSlots: 30, vendorSlotsFilled: 18, views: 980, saves: 134, isClaimable: true },
  'evt-004': { city: 'Westfield', state: 'NJ', region: 'Union County', organizerId: DEMO_ORGANIZER_ID, organizerName: DEMO_ORGANIZER_NAME, seriesId: 'series-spring-2026', category: 'school-fair', audienceTags: ['Family', 'School', 'Kids'], vendorSlots: 25, vendorSlotsFilled: 22, applicationDeadline: '2026-03-15', views: 1560, saves: 201 },
  'evt-005': { city: 'Hoboken', state: 'NJ', region: 'Hudson County', organizerId: DEMO_ORGANIZER_ID, organizerName: DEMO_ORGANIZER_NAME, seriesId: 'series-summer-expo', category: 'street-fair', audienceTags: ['Food', 'Outdoor', 'Live Music'], vendorSlots: 60, vendorSlotsFilled: 41, views: 2100, saves: 298 },
  'evt-006': { city: 'Edison', state: 'NJ', region: 'Middlesex County', organizerId: DEMO_ORGANIZER_ID, organizerName: DEMO_ORGANIZER_NAME, seriesId: 'series-summer-expo', category: 'festival', audienceTags: ['Family', 'Toys', 'Indoor'], vendorSlots: 100, vendorSlotsFilled: 74, applicationDeadline: '2026-03-10', views: 3200, saves: 445, promotionTier: 'spotlight' as const },
};

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function mockEventToPlatform(e: typeof mockEvents[0], extra?: Partial<PlatformEvent>): PlatformEvent {
  const meta = ORGANIZER_META[e.id] ?? {};
  const coverImageUrl = extra?.coverImageUrl ?? getEventCoverImage(e.id);
  return {
    id: e.id,
    slug: slugify(e.name),
    name: e.name,
    date: e.date,
    time: '10:00 AM – 6:00 PM',
    location: e.location,
    city: meta.city ?? 'New York',
    state: meta.state ?? 'NY',
    region: meta.region ?? 'NY/NJ',
    description: e.description,
    category: meta.category ?? 'festival',
    audienceTags: meta.audienceTags ?? e.tags,
    organizerId: meta.organizerId ?? 'org-scraped',
    organizerName: meta.organizerName ?? 'Community Organizer',
    listingStatus: 'published',
    vendorSlots: meta.vendorSlots ?? 40,
    vendorSlotsFilled: meta.vendorSlotsFilled ?? 20,
    applicationDeadline: meta.applicationDeadline,
    views: meta.views ?? 500,
    saves: meta.saves ?? 50,
    isClaimable: extra?.isClaimable ?? false,
    coverImageUrl,
    galleryUrls: extra?.galleryUrls ?? [coverImageUrl, STOCK.crowdHands],
    promotionTier: (meta.promotionTier as PlatformEvent['promotionTier']) ?? extra?.promotionTier ?? 'none',
    tier: e.tier,
    alphaScore: e.alphaScore,
    familyDensity: e.familyDensity,
    footTraffic: e.footTraffic,
    boothFee: e.boothFee,
    permitFee: e.permitFee,
    roiMin: e.roiMin,
    roiMax: e.roiMax,
    dudRisk: e.dudRisk,
    tags: e.tags,
    ...extra,
  };
}

export const mockPlatformEvents: PlatformEvent[] = [
  ...mockEvents.map(e => mockEventToPlatform(e)),
  mockEventToPlatform(
    {
      id: 'evt-007',
      name: 'Long Island Summer Fest',
      date: '2026-06-14',
      location: 'Jones Beach Boardwalk',
      tier: 'A',
      alphaScore: 82,
      familyDensity: 78,
      footTraffic: '10K-15K',
      boothFee: 400,
      permitFee: 50,
      roiMin: 1500,
      roiMax: 3000,
      dudRisk: 15,
      tags: ['Family', 'Outdoor', 'Beach'],
      description: 'Annual summer kickoff with live music, food trucks, and family activities.',
    },
    {
      city: 'Wantagh',
      state: 'NY',
      region: 'Long Island',
      organizerId: DEMO_ORGANIZER_ID,
      organizerName: DEMO_ORGANIZER_NAME,
      seriesId: 'series-li-summer',
      category: 'festival',
      audienceTags: ['Family', 'Beach', 'Music', 'Food'],
      vendorSlots: 120,
      vendorSlotsFilled: 45,
      applicationDeadline: '2026-05-01',
      views: 4100,
      saves: 620,
      promotionTier: 'featured' as const,
    }
  ),
  mockEventToPlatform(
    {
      id: 'evt-008',
      name: 'Maplewood Spring Street Fair',
      date: '2026-04-26',
      location: 'Maplewood Village',
      tier: 'B',
      alphaScore: 75,
      familyDensity: 70,
      footTraffic: '5K-8K',
      boothFee: 175,
      permitFee: 0,
      roiMin: 600,
      roiMax: 1400,
      dudRisk: 18,
      tags: ['Local', 'Outdoor', 'Artisan'],
      description: 'Beloved community street fair with artisan vendors and local food.',
    },
    {
      city: 'Maplewood',
      state: 'NJ',
      region: 'Essex County',
      organizerId: DEMO_ORGANIZER_ID,
      organizerName: DEMO_ORGANIZER_NAME,
      seriesId: 'series-spring-2026',
      category: 'street-fair',
      audienceTags: ['Family', 'Local', 'Artisan', 'Food'],
      vendorSlots: 55,
      vendorSlotsFilled: 48,
      views: 1680,
      saves: 245,
    }
  ),
  mockEventToPlatform(
    {
      id: 'evt-009',
      name: 'Classic Cars on the Hudson',
      date: '2026-05-18',
      location: 'Hoboken Waterfront',
      tier: 'A',
      alphaScore: 86,
      familyDensity: 55,
      footTraffic: '8K-12K',
      boothFee: 325,
      permitFee: 50,
      roiMin: 1200,
      roiMax: 2600,
      dudRisk: 12,
      tags: ['Cars', 'Outdoor', 'Food OK'],
      description: 'Premier car show on the waterfront — vendors welcome for food, merch, and accessories.',
    },
    {
      city: 'Hoboken',
      state: 'NJ',
      region: 'Hudson County',
      organizerId: DEMO_ORGANIZER_ID,
      organizerName: DEMO_ORGANIZER_NAME,
      seriesId: 'series-summer-expo',
      category: 'car-show',
      audienceTags: ['Cars', 'Outdoor', 'Food', 'Live Music'],
      vendorSlots: 40,
      vendorSlotsFilled: 28,
      applicationDeadline: '2026-04-20',
      views: 5200,
      saves: 890,
      promotionTier: 'featured' as const,
    }
  ),
];

export const mockEventSeries: EventSeries[] = [
  {
    id: 'series-spring-2026',
    name: 'Spring 2026 Fair Circuit',
    slug: 'spring-2026-fair-circuit',
    description: 'School fairs, festivals, and community markets across NY/NJ — March through April.',
    organizerId: DEMO_ORGANIZER_ID,
    seasonLabel: 'Spring 2026',
    eventIds: ['evt-001', 'evt-002', 'evt-004', 'evt-008'],
    coverImageUrl: STOCK.festivalCrowd,
  },
  {
    id: 'series-summer-expo',
    name: 'Summer Expo Series',
    slug: 'summer-expo-series',
    description: 'Large-format expos, street fairs, and car shows — May through June.',
    organizerId: DEMO_ORGANIZER_ID,
    seasonLabel: 'Summer 2026',
    eventIds: ['evt-005', 'evt-006', 'evt-009'],
    coverImageUrl: STOCK.expoHall,
  },
  {
    id: 'series-li-summer',
    name: 'LI Summer Tour',
    slug: 'li-summer-tour',
    description: 'Long Island boardwalk and beach festivals.',
    organizerId: DEMO_ORGANIZER_ID,
    seasonLabel: 'Summer 2026',
    eventIds: ['evt-007'],
    coverImageUrl: STOCK.beachFest,
  },
];

export const mockOrganizers: Organizer[] = [
  { id: 'org-001', name: 'Sarah Chen', email: 'sarah@nycparks.org', organization: 'NYC Parks Events', eventsHosted: 12, verified: true },
  { id: 'org-002', name: 'Mike Torres', email: 'mike@riversideevents.com', organization: 'Riverside Events Co.', eventsHosted: 8, verified: true },
  { id: 'org-demo', name: 'You (Demo)', email: 'organizer@demo.vendorflow.app', organization: 'My Events Co.', eventsHosted: 3, verified: false },
];

export const mockVendorSubmissions: VendorSubmission[] = [
  {
    id: 'sub-001',
    eventId: 'evt-001',
    eventName: 'Spring Family Festival',
    vendorName: 'Glow Toys NJ',
    vendorEmail: 'glow@example.com',
    category: 'LED Toys',
    message: 'We do spinning LED toys and light-up wands. 3 years at street fairs.',
    status: 'approved',
    pipelineStage: 'approved',
    submittedAt: '2026-02-20T14:30:00Z',
    hasInsurance: true,
    applicationId: 'app-001',
    setupPhotoUrl: STOCK.toyBooth,
    shortlisted: true,
    requiredForms: ['coi', 'ce200', 'w9'],
    ce200SentAt: '2026-02-21T10:00:00Z',
    documents: [
      { id: 'doc-s1', type: 'coi', fileName: 'COI_GlowToys_2026.pdf', uploadedAt: '2026-02-10T10:00:00Z' },
      { id: 'doc-s2', type: 'ce200', fileName: 'CE200_SpringFest.pdf', uploadedAt: '2026-02-11T14:00:00Z' },
      { id: 'doc-s3', type: 'w9', fileName: 'W9_GlowToys.pdf', uploadedAt: '2026-02-11T14:05:00Z' },
    ],
    boothId: 'A-12',
    paymentStatus: 'paid',
    contractStatus: 'signed',
  },
  {
    id: 'sub-002',
    eventId: 'evt-004',
    eventName: 'School Fair Extravaganza',
    vendorName: 'Fun Faces Balloons',
    vendorEmail: 'fun@example.com',
    category: 'Balloons & Face Paint',
    message: 'School fairs are our specialty. COI attached.',
    status: 'pending',
    pipelineStage: 'reviewing',
    shortlisted: true,
    infoRequested: false,
    submittedAt: '2026-02-22T09:15:00Z',
    hasInsurance: true,
    requiredForms: ['coi', 'w9'],
    setupPhotoUrl: STOCK.balloonVendor,
    documents: [
      { id: 'doc-s4', type: 'coi', fileName: 'COI_FunFaces.pdf', uploadedAt: '2026-02-22T09:10:00Z' },
    ],
  },
  {
    id: 'sub-003',
    eventId: 'evt-006',
    eventName: 'Toy Expo & Play Day',
    vendorName: 'Retro Arcade Mini',
    vendorEmail: 'arcade@example.com',
    category: 'Games & Toys',
    message: 'Portable mini arcade games for kids.',
    status: 'approved',
    pipelineStage: 'approved',
    submittedAt: '2026-02-18T11:00:00Z',
    hasInsurance: true,
    applicationId: 'app-003',
    requiredForms: ['coi', 'ce200', 'w9'],
    documents: [],
    setupPhotoUrl: STOCK.expoHall,
    paymentStatus: 'invoiced',
    contractStatus: 'sent',
  },
  {
    id: 'sub-004',
    eventId: 'evt-009',
    eventName: 'Classic Cars on the Hudson',
    vendorName: 'Smokin\' BBQ Co.',
    vendorEmail: 'bbq@example.com',
    category: 'Food Truck',
    message: 'Award-winning BBQ — perfect for car show crowds.',
    status: 'pending',
    pipelineStage: 'applied',
    submittedAt: '2026-02-25T16:00:00Z',
    hasInsurance: true,
    requiredForms: ['coi', 'ce200', 'w9', 'vehicle-info', 'food-permit'],
    documents: [
      { id: 'doc-s5', type: 'coi', fileName: 'COI_SmokinBBQ.pdf', uploadedAt: '2026-02-25T15:55:00Z' },
      { id: 'doc-s6', type: 'food-permit', fileName: 'FoodHandler_2026.pdf', uploadedAt: '2026-02-25T15:58:00Z' },
    ],
    setupPhotoUrl: STOCK.foodTrucks,
    paymentStatus: 'none',
    contractStatus: 'unsigned',
  },
  {
    id: 'sub-005',
    eventId: 'evt-002',
    eventName: 'Kids Carnival Weekend',
    vendorName: 'Sweet Treats Cart',
    vendorEmail: 'sweets@example.com',
    category: 'Desserts',
    message: 'Handmade cotton candy and funnel cakes — saw you at Riverside last year.',
    status: 'pending',
    pipelineStage: 'scraped',
    submittedAt: '2026-02-19T08:00:00Z',
    hasInsurance: false,
    requiredForms: ['coi', 'w9'],
    documents: [],
    setupPhotoUrl: STOCK.vendorTent,
  },
  {
    id: 'sub-006',
    eventId: 'evt-005',
    eventName: 'Hoboken Spring Street Fair',
    vendorName: 'Artisan Candle Co.',
    vendorEmail: 'candles@example.com',
    category: 'Craft',
    message: 'Local soy candles — need insurance docs by Friday.',
    status: 'pending',
    pipelineStage: 'reviewing',
    infoRequested: true,
    submittedAt: '2026-02-24T11:30:00Z',
    hasInsurance: true,
    requiredForms: ['coi', 'w9'],
    documents: [{ id: 'doc-s7', type: 'coi', fileName: 'COI_ArtisanCandle.pdf', uploadedAt: '2026-02-24T11:00:00Z' }],
    setupPhotoUrl: STOCK.farmersMarket,
  },
];

export function toVendorEvent(e: PlatformEvent): MockEvent {
  return {
    id: e.id,
    name: e.name,
    date: e.date,
    location: e.location,
    tier: e.tier,
    alphaScore: e.alphaScore,
    familyDensity: e.familyDensity,
    footTraffic: e.footTraffic,
    boothFee: e.boothFee,
    permitFee: e.permitFee,
    roiMin: e.roiMin,
    roiMax: e.roiMax,
    dudRisk: e.dudRisk,
    tags: e.tags,
    description: e.description,
  };
}

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  'street-fair': 'Street Fair',
  'farmers-market': 'Farmers Market',
  festival: 'Festival',
  'school-fair': 'School Fair',
  carnival: 'Carnival',
  'car-show': 'Car Show',
  music: 'Music & Live',
  'food-truck': 'Food & Trucks',
  holiday: 'Holiday Event',
  sports: 'Sports',
  'craft-fair': 'Craft Fair',
  community: 'Community',
};
