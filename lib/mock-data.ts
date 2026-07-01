import type { VendorDocument } from '@/lib/documents';

export type AlphaTier = 'S' | 'A' | 'B' | 'C';

export interface MockEvent {
  id: string;
  name: string;
  date: string;
  location: string;
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
  description: string;
}

export type ApplicationStatus = 'scraped' | 'applied' | 'coi' | 'paid' | 'booked';

export interface Application {
  id: string;
  eventId?: string;
  eventName: string;
  organizerName?: string;
  submissionId?: string;
  status: ApplicationStatus;
  microStatus: string;
  deadline?: string;
  boothFee: number;
  coiAttached: boolean;
  paid: boolean;
  documents: VendorDocument[];
  requiredForms: string[];
  ce200Sent?: boolean;
  setupPhotoUrl?: string;
}

export interface FinancialRecord {
  id: string;
  eventId?: string;
  eventName: string;
  date: string;
  grossSales: number;
  expenses: number;
  netProfit: number;
  margin: number;
  breakEvenHour: string;
  bestHour: string;
  cashPercent: number;
  cardPercent: number;
}

export interface CalendarEvent {
  date: string;
  name: string;
  status: 'booked' | 'completed';
  eventId?: string;
}

export const mockEvents: MockEvent[] = [
  {
    id: 'evt-001',
    name: 'Spring Family Festival',
    date: '2026-03-15',
    location: 'Central Park, NYC',
    tier: 'S',
    alphaScore: 94,
    familyDensity: 87,
    footTraffic: '8K-12K',
    boothFee: 350,
    permitFee: 50,
    roiMin: 1200,
    roiMax: 2400,
    dudRisk: 8,
    tags: ['Family', 'Outdoor', 'Food OK'],
    description: 'Premier family event with proven vendor success rate',
  },
  {
    id: 'evt-002',
    name: 'Kids Carnival Weekend',
    date: '2026-03-22',
    location: 'Riverside Plaza',
    tier: 'A',
    alphaScore: 86,
    familyDensity: 92,
    footTraffic: '5K-8K',
    boothFee: 275,
    permitFee: 0,
    roiMin: 900,
    roiMax: 1800,
    dudRisk: 12,
    tags: ['Family', 'Indoor', 'High Density'],
    description: 'Concentrated family traffic, smaller venue',
  },
  {
    id: 'evt-003',
    name: 'Community Market Days',
    date: '2026-03-29',
    location: 'Downtown Square',
    tier: 'B',
    alphaScore: 72,
    familyDensity: 64,
    footTraffic: '3K-6K',
    boothFee: 150,
    permitFee: 25,
    roiMin: 400,
    roiMax: 1000,
    dudRisk: 25,
    tags: ['Mixed', 'Outdoor', 'Local'],
    description: 'Mixed demographics, moderate foot traffic',
  },
  {
    id: 'evt-004',
    name: 'School Fair Extravaganza',
    date: '2026-04-05',
    location: 'Lincoln Elementary',
    tier: 'S',
    alphaScore: 91,
    familyDensity: 95,
    footTraffic: '4K-7K',
    boothFee: 200,
    permitFee: 0,
    roiMin: 1000,
    roiMax: 2000,
    dudRisk: 5,
    tags: ['Family', 'School', 'Premium'],
    description: 'School-sponsored, vetted vendors only',
  },
  {
    id: 'evt-005',
    name: 'Street Fair Bonanza',
    date: '2026-04-12',
    location: 'Main Street',
    tier: 'C',
    alphaScore: 58,
    familyDensity: 45,
    footTraffic: '2K-4K',
    boothFee: 100,
    permitFee: 50,
    roiMin: 200,
    roiMax: 600,
    dudRisk: 42,
    tags: ['Mixed', 'Outdoor', 'Unvetted'],
    description: 'Low barrier to entry, higher risk profile',
  },
  {
    id: 'evt-006',
    name: 'Toy Expo & Play Day',
    date: '2026-04-19',
    location: 'Convention Center',
    tier: 'A',
    alphaScore: 88,
    familyDensity: 89,
    footTraffic: '6K-10K',
    boothFee: 450,
    permitFee: 75,
    roiMin: 1400,
    roiMax: 2800,
    dudRisk: 10,
    tags: ['Family', 'Indoor', 'Toy-Focused'],
    description: 'Premium toy-focused event, higher booth investment',
  },
];

export const mockApplications: Application[] = [
  {
    id: 'app-001',
    eventId: 'evt-001',
    eventName: 'Spring Family Festival',
    organizerName: 'NYC Parks Events',
    submissionId: 'sub-001',
    status: 'paid',
    microStatus: 'All forms approved — payment confirmed',
    deadline: '2026-02-28',
    boothFee: 350,
    coiAttached: true,
    paid: true,
    documents: [
      { id: 'doc-1', type: 'coi', fileName: 'COI_GlowToys_2026.pdf', uploadedAt: '2026-02-10T10:00:00Z' },
      { id: 'doc-2', type: 'ce200', fileName: 'CE200_SpringFest.pdf', uploadedAt: '2026-02-11T14:00:00Z' },
      { id: 'doc-3', type: 'w9', fileName: 'W9_GlowToys.pdf', uploadedAt: '2026-02-11T14:05:00Z' },
    ],
    requiredForms: ['coi', 'ce200', 'w9'],
    ce200Sent: true,
    setupPhotoUrl: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 'app-002',
    eventId: 'evt-002',
    eventName: 'Kids Carnival Weekend',
    organizerName: 'Riverside Events Co.',
    status: 'coi',
    microStatus: 'Organizer sent CE200 — sign & upload back. Still need W-9.',
    deadline: '2026-03-01',
    boothFee: 275,
    coiAttached: true,
    paid: false,
    documents: [
      { id: 'doc-4', type: 'coi', fileName: 'COI_2026.pdf', uploadedAt: '2026-02-15T09:00:00Z' },
    ],
    requiredForms: ['coi', 'ce200', 'w9'],
    ce200Sent: true,
  },
  {
    id: 'app-003',
    eventId: 'evt-006',
    eventName: 'Toy Expo & Play Day',
    organizerName: 'Metro Expo Group',
    submissionId: 'sub-003',
    status: 'applied',
    microStatus: 'Waiting for organizer approval',
    deadline: '2026-03-10',
    boothFee: 450,
    coiAttached: false,
    paid: false,
    documents: [],
    requiredForms: ['coi', 'ce200', 'w9'],
    ce200Sent: false,
  },
  {
    id: 'app-004',
    eventId: 'evt-003',
    eventName: 'Community Market Days',
    organizerName: 'Downtown Newark Alliance',
    status: 'scraped',
    microStatus: 'Ready to apply — review event details first',
    boothFee: 150,
    coiAttached: false,
    paid: false,
    documents: [],
    requiredForms: ['coi', 'food-permit'],
    ce200Sent: false,
  },
];

export const mockFinancials: FinancialRecord[] = [
  {
    id: 'fin-001',
    eventName: "Valentine's Day Fair",
    date: '2026-02-14',
    grossSales: 2150,
    expenses: 485,
    netProfit: 1665,
    margin: 77,
    breakEvenHour: '10:30 AM',
    bestHour: '2:00 PM ($385)',
    cashPercent: 35,
    cardPercent: 65,
  },
  {
    id: 'fin-002',
    eventName: 'Winter Market',
    date: '2026-02-08',
    grossSales: 1420,
    expenses: 320,
    netProfit: 1100,
    margin: 77,
    breakEvenHour: '11:15 AM',
    bestHour: '1:30 PM ($245)',
    cashPercent: 42,
    cardPercent: 58,
  },
  {
    id: 'fin-003',
    eventName: 'Super Bowl Sunday Bazaar',
    date: '2026-02-01',
    grossSales: 890,
    expenses: 275,
    netProfit: 615,
    margin: 69,
    breakEvenHour: '12:00 PM',
    bestHour: '11:00 AM ($180)',
    cashPercent: 55,
    cardPercent: 45,
  },
];

export const mockCalendarEvents: CalendarEvent[] = [
  { date: '2026-02-14', name: "Valentine's Day Fair", status: 'completed', eventId: 'cal-valentine-2026' },
  { date: '2026-03-15', name: 'Spring Family Festival', status: 'booked', eventId: 'evt-001' },
  { date: '2026-03-22', name: 'Kids Carnival Weekend', status: 'booked', eventId: 'evt-002' },
];
