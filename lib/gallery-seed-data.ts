import { STOCK } from '@/lib/event-images';
import { DEMO_ORGANIZER_ID } from '@/lib/platform-data';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';
import type { GalleryEntityType, GalleryItemRecord, GalleryTag } from '@/lib/gallery-schema';
import { serializeGalleryTags } from '@/lib/gallery-schema';

function item(
  id: string,
  entityType: GalleryEntityType,
  entityId: string,
  imageUrl: string,
  opts: {
    caption?: string;
    tags?: GalleryTag[];
    sortOrder: number;
    isCover?: boolean;
    isPublic?: boolean;
  }
): GalleryItemRecord {
  const now = new Date().toISOString();
  return {
    id,
    entityType,
    entityId,
    imageUrl,
    caption: opts.caption,
    tags: opts.tags ?? [],
    sortOrder: opts.sortOrder,
    isCover: opts.isCover ?? false,
    isPublic: opts.isPublic ?? true,
    createdAt: now,
    updatedAt: now,
  };
}

/** Demo galleries — authentic photography, not flyers */
export function buildSeedGalleryItems(): GalleryItemRecord[] {
  const eventGallery = (eventId: string, prefix: string, photos: { url: string; caption: string; tags: GalleryTag[]; isCover?: boolean }[]) =>
    photos.map((p, i) =>
      item(`${prefix}-${i}`, 'event', eventId, p.url, {
        caption: p.caption,
        tags: p.tags,
        sortOrder: i,
        isCover: p.isCover ?? i === 0,
        isPublic: true,
      })
    );

  return [
    ...eventGallery('evt-001', 'eg1', [
      { url: STOCK.festivalCrowd, caption: 'Main stage crowd at peak hour', tags: ['crowd', 'family'], isCover: true },
      { url: STOCK.streetFair, caption: 'Vendor row along the avenue', tags: ['booth', 'setup'] },
      { url: STOCK.foodTrucks, caption: 'Food court line — lunch rush', tags: ['food', 'crowd'] },
      { url: STOCK.schoolFair, caption: 'Kids zone with face paint', tags: ['kids-zone', 'family'] },
      { url: STOCK.liveMusic, caption: 'Evening crowd under the lights', tags: ['night', 'crowd'] },
    ]),
    ...eventGallery('evt-006', 'eg6', [
      { url: STOCK.expoHall, caption: 'Expo hall floor during setup', tags: ['setup', 'booth'], isCover: true },
      { url: STOCK.toyBooth, caption: 'Toy vendor display at aisle 12', tags: ['booth', 'branding'] },
      { url: STOCK.crowdHands, caption: 'Families browsing the main aisle', tags: ['crowd', 'family'] },
    ]),
    item('og1-0', 'organizer', DEMO_ORGANIZER_ID, STOCK.festivalCrowd, {
      caption: '2025 Summer Street Fair — opening day crowd',
      tags: ['crowd', 'family'],
      sortOrder: 0,
      isCover: true,
    }),
    item('og1-1', 'organizer', DEMO_ORGANIZER_ID, STOCK.streetFair, {
      caption: 'Vendor check-in and booth assignment',
      tags: ['setup', 'booth'],
      sortOrder: 1,
    }),
    item('og1-2', 'organizer', DEMO_ORGANIZER_ID, STOCK.foodTrucks, {
      caption: 'Food vendor row — fully booked',
      tags: ['food', 'booth'],
      sortOrder: 2,
    }),
    item('og1-3', 'organizer', DEMO_ORGANIZER_ID, STOCK.schoolFair, {
      caption: 'Chamber team on-site during school fair',
      tags: ['family', 'branding'],
      sortOrder: 3,
    }),
    item('og1-4', 'organizer', DEMO_ORGANIZER_ID, STOCK.aerialFair, {
      caption: 'Aerial view — 60+ booths, full capacity',
      tags: ['crowd', 'setup'],
      sortOrder: 4,
      isPublic: true,
    }),
    item('og1-private', 'organizer', DEMO_ORGANIZER_ID, STOCK.expoHall, {
      caption: 'Internal layout draft — not public',
      tags: ['setup'],
      sortOrder: 5,
      isPublic: false,
    }),
    item('vg1-0', 'vendor', DEMO_VENDOR_EMAIL, STOCK.toyBooth, {
      caption: '10×10 tent setup — LED toy display',
      tags: ['booth', 'setup', 'branding'],
      sortOrder: 0,
      isCover: true,
    }),
    item('vg1-1', 'vendor', DEMO_VENDOR_EMAIL, STOCK.balloonVendor, {
      caption: 'Product table with branded signage',
      tags: ['booth', 'branding'],
      sortOrder: 1,
    }),
    item('vg1-2', 'vendor', DEMO_VENDOR_EMAIL, STOCK.vendorTent, {
      caption: 'Side view — generator and cable run',
      tags: ['setup'],
      sortOrder: 2,
    }),
    item('vg1-3', 'vendor', DEMO_VENDOR_EMAIL, STOCK.crowdHands, {
      caption: 'Customers at Edison Expo — busy Saturday',
      tags: ['crowd', 'family'],
      sortOrder: 3,
    }),
  ];
}

export { serializeGalleryTags };
