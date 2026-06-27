'use client';

import { Suspense } from 'react';
import { PublicLayout } from '@/components/layout/public-layout';
import { DiscoverExplore } from '@/components/discover/discover-explore';

export default function DiscoverPage() {
  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Suspense fallback={<p className="public-muted">Loading events…</p>}>
          <DiscoverExplore />
        </Suspense>
      </div>
    </PublicLayout>
  );
}
