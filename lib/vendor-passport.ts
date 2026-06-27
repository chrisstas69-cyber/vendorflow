import type { DocumentType, VendorDocument } from '@/lib/documents';
import { missingDocuments } from '@/lib/documents';
import { STOCK } from '@/lib/event-images';

/** Canonical demo vendor — shared with apply form defaults */
export const DEMO_VENDOR_EMAIL = 'vendor@demo.vendorflow.app';
export const DEMO_VENDOR_ID = 'vp-demo';

export type VehicleType = 'tent-only' | 'van' | 'trailer' | 'food-truck' | 'other';

export type PassportValidationState =
  | 'incomplete'
  | 'documents_pending'
  | 'ready_for_matching'
  | 'needs_review';

export interface VendorLogistics {
  trailerLengthFt?: number;
  boothWidthFt?: number;
  boothDepthFt?: number;
  needsElectric: boolean;
  ampRequirement?: string;
  setupTimeMinutes?: number;
  vehicleType: VehicleType;
  waterAccess?: boolean;
  generatorOk?: boolean;
}

export interface VendorPassport {
  id: string;
  vendorEmail: string;
  businessName: string;
  dba?: string;
  contactName: string;
  phone: string;
  website?: string;
  description: string;
  /** Product / service categories shown to organizers */
  categories: string[];
  /** Matching tags — equipment, audience, specialties */
  serviceTags: string[];
  logistics: VendorLogistics;
  documents: VendorDocument[];
  setupPhotoUrl?: string;
  insuranceExpiry?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PassportValidation {
  state: PassportValidationState;
  score: number;
  label: string;
  message: string;
  missingFields: string[];
  missingDocuments: DocumentType[];
  readyForMatching: boolean;
}

const BASE_REQUIRED_DOCS: DocumentType[] = ['coi', 'w9'];

export function createEmptyPassport(vendorEmail: string): VendorPassport {
  const now = new Date().toISOString();
  return {
    id: `vp-${Date.now()}`,
    vendorEmail,
    businessName: '',
    contactName: '',
    phone: '',
    description: '',
    categories: [],
    serviceTags: [],
    logistics: {
      needsElectric: false,
      vehicleType: 'tent-only',
    },
    documents: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function validatePassport(passport: VendorPassport): PassportValidation {
  const missingFields: string[] = [];

  if (!passport.businessName.trim()) missingFields.push('Business name');
  if (!passport.contactName.trim()) missingFields.push('Contact name');
  if (!passport.phone.trim()) missingFields.push('Phone');
  if (!passport.description.trim()) missingFields.push('Business description');
  if (passport.categories.length === 0) missingFields.push('At least one category');
  if (passport.serviceTags.length === 0) missingFields.push('At least one service tag');
  if (!passport.setupPhotoUrl) missingFields.push('Setup / booth photo');

  const missingDocs = missingDocuments(BASE_REQUIRED_DOCS, passport.documents);

  let state: PassportValidationState = 'ready_for_matching';
  let message = 'Profile complete — ready for AI matching and organizer discovery.';
  let score = 100;

  if (missingFields.length > 0) {
    state = 'incomplete';
    message = `Complete ${missingFields.length} required field${missingFields.length > 1 ? 's' : ''} to unlock matching.`;
    score = Math.max(20, 100 - missingFields.length * 12 - missingDocs.length * 8);
  } else if (missingDocs.length > 0) {
    state = 'documents_pending';
    message = `Upload ${missingDocs.join(', ').toUpperCase()} to become match-ready.`;
    score = Math.max(40, 100 - missingDocs.length * 15);
  } else if (!passport.insuranceExpiry) {
    state = 'needs_review';
    message = 'Add insurance expiry date for full compliance scoring.';
    score = 85;
  }

  const labels: Record<PassportValidationState, string> = {
    incomplete: 'Profile incomplete',
    documents_pending: 'Documents needed',
    needs_review: 'Almost ready',
    ready_for_matching: 'Ready for matching',
  };

  return {
    state,
    score,
    label: labels[state],
    message,
    missingFields,
    missingDocuments: missingDocs,
    readyForMatching: state === 'ready_for_matching',
  };
}

export const VENDOR_CATEGORY_OPTIONS = [
  'LED Toys & Novelties',
  'Food & Beverage',
  'Balloons & Face Paint',
  'Craft & Artisan',
  'Games & Entertainment',
  'Apparel & Merch',
  'Car Show Vendor',
  'Health & Beauty',
] as const;

export const VENDOR_SERVICE_TAG_OPTIONS = [
  'family-friendly',
  'high-foot-traffic',
  'indoor-ok',
  'outdoor-only',
  'needs-20a-power',
  'food-handler-certified',
  'liability-insured',
  'quick-setup',
  'large-footprint',
  'compact-booth',
] as const;

export const mockVendorPassport: VendorPassport = {
  id: DEMO_VENDOR_ID,
  vendorEmail: DEMO_VENDOR_EMAIL,
  businessName: 'Demo Vendor Co.',
  dba: 'Glow Toys NJ',
  contactName: 'Alex Rivera',
  phone: '(516) 555-0142',
  website: 'https://glowtoysnj.example.com',
  description:
    'LED toys, light-up wands, and novelty items for street fairs and school events. 40+ events per season across LI and NJ.',
  categories: ['LED Toys & Novelties', 'Games & Entertainment'],
  serviceTags: ['family-friendly', 'high-foot-traffic', 'outdoor-only', 'compact-booth', 'liability-insured'],
  logistics: {
    trailerLengthFt: 0,
    boothWidthFt: 10,
    boothDepthFt: 10,
    needsElectric: true,
    ampRequirement: '20A',
    setupTimeMinutes: 45,
    vehicleType: 'van',
    generatorOk: true,
  },
  documents: [
    {
      id: 'doc-vp-1',
      type: 'coi',
      fileName: 'COI_DemoVendor_2026.pdf',
      uploadedAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'doc-vp-2',
      type: 'w9',
      fileName: 'W9_DemoVendor.pdf',
      uploadedAt: '2026-01-15T10:05:00Z',
    },
    {
      id: 'doc-vp-3',
      type: 'booth-layout',
      fileName: 'BoothLayout_10x10.pdf',
      uploadedAt: '2026-02-01T14:00:00Z',
    },
  ],
  setupPhotoUrl: STOCK.toyBooth,
  insuranceExpiry: '2026-12-31',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
};

export function normalizePassport(input: Partial<VendorPassport> & { vendorEmail: string }): VendorPassport {
  const base = mockVendorPassport.vendorEmail === input.vendorEmail
    ? { ...mockVendorPassport }
    : createEmptyPassport(input.vendorEmail);

  return {
    ...base,
    ...input,
    logistics: { ...base.logistics, ...input.logistics },
    categories: input.categories ?? base.categories,
    serviceTags: input.serviceTags ?? base.serviceTags,
    documents: input.documents ?? base.documents,
    updatedAt: new Date().toISOString(),
  };
}
