export type DocumentType = 'coi' | 'ce200' | 'w9' | 'booth-layout' | 'vehicle-info' | 'food-permit' | 'other';

export interface VendorDocument {
  id: string;
  type: DocumentType;
  fileName: string;
  uploadedAt: string;
}

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  coi: 'Certificate of Insurance (COI)',
  ce200: 'CE200 — Workers Comp Affidavit',
  w9: 'W-9 Tax Form',
  'booth-layout': 'Booth Layout / Setup',
  'vehicle-info': 'Vehicle Registration (Car Shows)',
  'food-permit': 'Food Handler Permit',
  other: 'Other Document',
};

/** Vendor uploads these TO the organizer */
export const VENDOR_SUBMITS_TO_ORGANIZER: DocumentType[] = [
  'coi',
  'w9',
  'food-permit',
  'vehicle-info',
  'booth-layout',
  'other',
];

/** Organizer sends CE200 TO vendor (no employees); vendor signs & uploads back */
export const ORGANIZER_SENDS_TO_VENDOR: DocumentType[] = ['ce200'];

export function splitRequiredForms(required: DocumentType[]) {
  const submit = required.filter(t => VENDOR_SUBMITS_TO_ORGANIZER.includes(t));
  const fromOrganizer = required.filter(t => ORGANIZER_SENDS_TO_VENDOR.includes(t));
  return { submit, fromOrganizer };
}

/** Forms organizers commonly require — varies by event type */
export const REQUIRED_FORMS_BY_CATEGORY: Record<string, DocumentType[]> = {
  'car-show': ['coi', 'ce200', 'w9', 'vehicle-info'],
  festival: ['coi', 'ce200', 'w9'],
  'street-fair': ['coi', 'ce200', 'w9'],
  carnival: ['coi', 'ce200'],
  'school-fair': ['coi', 'w9'],
  'farmers-market': ['coi', 'food-permit'],
  music: ['coi', 'ce200', 'w9'],
  'food-truck': ['coi', 'food-permit', 'w9'],
  holiday: ['coi', 'ce200'],
  sports: ['coi', 'w9'],
  'craft-fair': ['coi', 'w9'],
  community: ['coi', 'ce200'],
};

export function getRequiredForms(category: string): DocumentType[] {
  return REQUIRED_FORMS_BY_CATEGORY[category] ?? ['coi', 'ce200', 'w9'];
}

export function missingDocuments(
  required: DocumentType[],
  uploaded: VendorDocument[]
): DocumentType[] {
  const have = new Set(uploaded.map(d => d.type));
  return required.filter(t => !have.has(t));
}

export interface EventAmbassador {
  id: string;
  name: string;
  handle: string;
  followers: string;
  specialty: string;
  imageUrl: string;
  eventsPromoted: number;
}

export const mockAmbassadors: EventAmbassador[] = [
  {
    id: 'inf-1',
    name: 'Jess Rivera',
    handle: '@jessfindsevents',
    followers: '48K',
    specialty: 'Family events & street fairs',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80&auto=format&fit=crop',
    eventsPromoted: 24,
  },
  {
    id: 'inf-2',
    name: 'Mike Auto NJ',
    handle: '@mikeautonj',
    followers: '92K',
    specialty: 'Car shows & cruise nights',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop',
    eventsPromoted: 18,
  },
  {
    id: 'inf-3',
    name: 'Foodie Long Island',
    handle: '@lifoodtrucks',
    followers: '65K',
    specialty: 'Food festivals & markets',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80&auto=format&fit=crop',
    eventsPromoted: 31,
  },
];

export const BROWSE_CATEGORIES = [
  { id: 'all', label: 'All Events', icon: '🎪' },
  { id: 'music', label: 'Music & Live', icon: '🎵' },
  { id: 'car-show', label: 'Car Shows', icon: '🚗' },
  { id: 'festival', label: 'Festivals', icon: '🎡' },
  { id: 'street-fair', label: 'Street Fairs', icon: '🛍️' },
  { id: 'food-truck', label: 'Food & Trucks', icon: '🍔' },
  { id: 'school-fair', label: 'School & Kids', icon: '🎒' },
  { id: 'farmers-market', label: 'Markets', icon: '🥬' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'holiday', label: 'Holiday', icon: '🎄' },
  { id: 'craft-fair', label: 'Craft & Artisan', icon: '🎨' },
  { id: 'community', label: 'Community', icon: '🏘️' },
] as const;

export type BrowseCategoryId = (typeof BROWSE_CATEGORIES)[number]['id'];

export function eventMatchesBrowseCategory(
  category: string,
  audienceTags: string[],
  browseId: BrowseCategoryId
): boolean {
  if (browseId === 'all') return true;
  if (category === browseId) return true;
  const tagMatch: Record<string, string[]> = {
    music: ['Music', 'Live Music', 'Concert'],
    'food-truck': ['Food', 'Food OK', 'Food Truck'],
    sports: ['Sports', 'Outdoor'],
    holiday: ['Holiday', 'Seasonal'],
  };
  return tagMatch[browseId]?.some(t => audienceTags.some(at => at.includes(t))) ?? false;
}
