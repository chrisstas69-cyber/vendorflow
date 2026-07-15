'use client';

import { Suspense } from 'react';
import { PublicLayout } from '@/components/layout/public-layout';
import { DiscoverExplore } from '@/components/discover/discover-explore';

export default function DiscoverPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <Suspense fallback={<p className="vf-text-muted text-sm">Loading events…</p>}>
          <DiscoverExplore />
        </Suspense>
      </div>
    </PublicLayout>
  );
}
