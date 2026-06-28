/** Trust-building gallery tags — authentic event photography, not flyers */
export const GALLERY_TAGS = [
  'crowd',
  'booth',
  'food',
  'setup',
  'branding',
  'family',
  'night',
  'kids-zone',
] as const;

export type GalleryTag = (typeof GALLERY_TAGS)[number];
export type GalleryEntityType = 'event' | 'organizer' | 'vendor';

export interface GalleryItemRecord {
  id: string;
  entityType: GalleryEntityType;
  entityId: string;
  imageUrl: string;
  caption?: string;
  tags: GalleryTag[];
  sortOrder: number;
  isCover: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryListResponse {
  ok: boolean;
  entityType: GalleryEntityType;
  entityId: string;
  items: GalleryItemRecord[];
  coverImageUrl?: string;
  dataSource?: 'seed' | 'db';
}

export const GALLERY_TAG_LABELS: Record<GalleryTag, string> = {
  crowd: 'Crowd',
  booth: 'Booth',
  food: 'Food',
  setup: 'Setup',
  branding: 'Branding',
  family: 'Family',
  night: 'Night',
  'kids-zone': 'Kids zone',
};

export const GALLERY_CONTEXT_COPY: Record<
  GalleryEntityType,
  { title: string; subtitle: string; emptyTitle: string; emptyDescription: string }
> = {
  event: {
    title: 'What it feels like to be there',
    subtitle: 'Real moments from past seasons — crowds, energy, and vendor life on the ground.',
    emptyTitle: 'Show vendors what they’re signing up for',
    emptyDescription:
      'Upload 5–10 photos from a past edition: crowd shots, vendor rows, food lines, and the kids zone. Skip flyers — authentic photos convert better.',
  },
  organizer: {
    title: 'Past event proof',
    subtitle: 'Your track record in pictures — builds trust with vendors and sponsors.',
    emptyTitle: 'Build organizer credibility',
    emptyDescription:
      'Add 5–10 photos from events you’ve run: setup day, peak crowd, happy vendors, and teardown. Organizers with proof get faster vendor approvals.',
  },
  vendor: {
    title: 'Booth & setup portfolio',
    subtitle: 'Show organizers your real footprint — tent, products, and on-site branding.',
    emptyTitle: 'Stand out in the approval queue',
    emptyDescription:
      'Upload 5–10 photos of your booth, products, and setup at past events. Organizers approve vendors they can visualize on their map.',
  },
};

export function parseGalleryTags(raw: string | unknown): GalleryTag[] {
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw || '[]') : raw;
    if (!Array.isArray(arr)) return [];
    return arr.filter((t): t is GalleryTag => GALLERY_TAGS.includes(t as GalleryTag));
  } catch {
    return [];
  }
}

export function serializeGalleryTags(tags: GalleryTag[]): string {
  return JSON.stringify(tags.filter(t => GALLERY_TAGS.includes(t)));
}

export function getCoverImageUrl(items: GalleryItemRecord[]): string | undefined {
  const cover = items.find(i => i.isCover && i.isPublic);
  if (cover) return cover.imageUrl;
  const first = items.filter(i => i.isPublic).sort((a, b) => a.sortOrder - b.sortOrder)[0];
  return first?.imageUrl;
}

export function toGalleryRecord(row: {
  id: string;
  entityType: string;
  entityId: string;
  imageUrl: string;
  caption: string | null;
  tags: string;
  sortOrder: number;
  isCover: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}): GalleryItemRecord {
  return {
    id: row.id,
    entityType: row.entityType as GalleryEntityType,
    entityId: row.entityId,
    imageUrl: row.imageUrl,
    caption: row.caption ?? undefined,
    tags: parseGalleryTags(row.tags),
    sortOrder: row.sortOrder,
    isCover: row.isCover,
    isPublic: row.isPublic,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
