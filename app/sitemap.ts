import type { MetadataRoute } from 'next';
import { mockPlatformEvents } from '@/lib/platform-data';
import { prisma } from '@/lib/prisma';
import { TOWN_LANDING_PAGES } from '@/lib/marketplace';

const BASE = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://vendorflow-mu.vercel.app').replace(/\/$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/discover`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/pricing`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/status`, changeFrequency: 'weekly', priority: 0.4 },
    { url: `${BASE}/for-vendors`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/for-organizers`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/login`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/submit-event`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/events-this-weekend`, changeFrequency: 'daily', priority: 0.9 },
  ];

  const eventPages: MetadataRoute.Sitemap = mockPlatformEvents
    .filter(e => e.listingStatus === 'published')
    .map(e => ({
      url: `${BASE}/events/${e.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  const townPages: MetadataRoute.Sitemap = TOWN_LANDING_PAGES.map(page => ({ url: `${BASE}/discover/${page.region}/${page.town}`, changeFrequency: 'daily', priority: 0.8 }));
  const categories = ['street-fairs','farmers-markets','festivals','car-shows','food-trucks','craft-fairs'];
  const categoryPages: MetadataRoute.Sitemap = categories.map(category => ({ url: `${BASE}/vendor-events/${category}`, changeFrequency: 'daily', priority: 0.8 }));
  let communityPages: MetadataRoute.Sitemap = [];
  try { const events = await prisma.publicEventListing.findMany({ where: { status: 'published', startDate: { gte: new Date(Date.now()-14*86400000) } }, select: { slug:true, updatedAt:true } }); communityPages = events.map(event => ({ url:`${BASE}/community-events/${event.slug}`, lastModified:event.updatedAt, changeFrequency:'weekly', priority:0.8 })); } catch {}
  return [...staticPages, ...eventPages, ...communityPages, ...townPages, ...categoryPages];
}
