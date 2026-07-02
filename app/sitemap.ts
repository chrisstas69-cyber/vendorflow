import type { MetadataRoute } from 'next';
import { mockPlatformEvents } from '@/lib/platform-data';

const BASE = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://vendorflow-mu.vercel.app').replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/discover`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/pricing`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/for-vendors`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/for-organizers`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/login`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const eventPages: MetadataRoute.Sitemap = mockPlatformEvents
    .filter(e => e.listingStatus === 'published')
    .map(e => ({
      url: `${BASE}/events/${e.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  return [...staticPages, ...eventPages];
}
