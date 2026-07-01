'use client';

import { useEffect, useState } from 'react';
import { useVendorEmail } from '@/lib/hooks/use-vendor-email';

export function useVendorPlanId() {
  const { vendorEmail } = useVendorEmail();
  const [planId, setPlanId] = useState('vendor-free');

  useEffect(() => {
    fetch(`/api/subscription?vendorEmail=${encodeURIComponent(vendorEmail)}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.summary?.vendor?.planId) {
          setPlanId(data.summary.vendor.planId);
        }
      })
      .catch(() => {});
  }, [vendorEmail]);

  return planId;
}

export function useOrganizerPlanId() {
  const [planId, setPlanId] = useState('org-founders');

  useEffect(() => {
    fetch('/api/subscription')
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.summary?.organizer?.planId) {
          setPlanId(data.summary.organizer.planId);
        }
      })
      .catch(() => {});
  }, []);

  return planId;
}
