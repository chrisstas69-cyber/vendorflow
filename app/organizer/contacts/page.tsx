'use client';

import { Suspense } from 'react';
import OrganizerContactsPage from './contacts-page-inner';

export default function OrganizerContactsRoute() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500">Loading contacts…</div>}>
      <OrganizerContactsPage />
    </Suspense>
  );
}
