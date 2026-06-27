'use client';

import { Suspense } from 'react';
import VendorPassportPageInner from './vendor-passport-inner';

export default function VendorPassportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading…</div>}>
      <VendorPassportPageInner />
    </Suspense>
  );
}
