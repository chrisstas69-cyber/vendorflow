import type { MetadataRoute } from 'next';

const BASE = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://vendorflow-mu.vercel.app').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep crawlers out of app surfaces and APIs — only public marketing
        // and event pages should be indexed.
        disallow: [
          '/api/',
          '/organizer/',
          '/vendor/',
          '/command',
          '/intelligence',
          '/calendar',
          '/journal',
          '/pulse',
          '/setup',
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
