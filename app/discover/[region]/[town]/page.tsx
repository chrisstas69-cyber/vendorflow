import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PublicLayout } from '@/components/layout/public-layout';
import { DiscoverExplore } from '@/components/discover/discover-explore';
import {
  REGION_SLUG_TO_DB,
  TOWN_LANDING_PAGES,
} from '@/lib/marketplace';

interface PageProps {
  params: { region: string; town: string };
}

function titleCase(slug: string) {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function generateStaticParams() {
  return TOWN_LANDING_PAGES.map(({ region, town }) => ({ region, town }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const regionLabel = REGION_SLUG_TO_DB[params.region] ?? titleCase(params.region);
  const townLabel =
    TOWN_LANDING_PAGES.find(p => p.region === params.region && p.town === params.town)?.title ??
    titleCase(params.town);

  const title = `Events in ${townLabel}, ${regionLabel} | VendorFlow`;
  const description = `Discover fairs, festivals, markets, and family events in ${townLabel}, ${regionLabel}. Filter by kids zone, food trucks, free parking, and more.`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default function RegionalDiscoverPage({ params }: PageProps) {
  const regionLabel = REGION_SLUG_TO_DB[params.region] ?? titleCase(params.region);
  const townLabel =
    TOWN_LANDING_PAGES.find(p => p.region === params.region && p.town === params.town)?.title ??
    titleCase(params.town);
  const initialState = params.region === 'nj' ? 'NJ' : ('NY' as const);

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Suspense fallback={<p className="public-muted">Loading events…</p>}>
          <DiscoverExplore
            initialRegionSlug={params.region}
            initialTownSlug={params.town}
            initialState={initialState}
            pageTitle={`Events in ${townLabel}`}
            pageDescription={`Street fairs, festivals, and markets in ${townLabel}, ${regionLabel} — powered by the VendorFlow events index.`}
          />
        </Suspense>
      </div>
    </PublicLayout>
  );
}
