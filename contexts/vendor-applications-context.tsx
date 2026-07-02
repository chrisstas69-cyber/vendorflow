'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Application } from '@/lib/mock-data';
import { useVendorEmail } from '@/lib/hooks/use-vendor-email';
import { useIsVendorSurface } from '@/lib/hooks/use-vendor-surface';

interface VendorApplicationsContextValue {
  ready: boolean;
  applications: Application[];
  refresh: () => Promise<void>;
  getStatusForEvent: (eventId: string) => Application | undefined;
  getPublicStatus: (eventId: string) => string | undefined;
}

const VendorApplicationsContext = createContext<VendorApplicationsContextValue | null>(null);

export function VendorApplicationsProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const { vendorEmail } = useVendorEmail();
  const isVendorSurface = useIsVendorSurface();

  const refresh = useCallback(async () => {
    const res = await fetch('/api/vendors/applications');
    const data = await res.json();
    if (data.ok && Array.isArray(data.applications)) {
      setApplications(data.applications);
    }
  }, []);

  useEffect(() => {
    if (!isVendorSurface) return;
    refresh().finally(() => setReady(true));
  }, [refresh, vendorEmail, isVendorSurface]);

  const getStatusForEvent = useCallback(
    (eventId: string) => applications.find(a => a.eventId === eventId),
    [applications]
  );

  const getPublicStatus = useCallback(
    (eventId: string) => {
      const app = applications.find(a => a.eventId === eventId);
      if (!app) return undefined;
      if (app.status === 'booked') return 'Booked';
      if (app.status === 'paid') return 'Paid';
      if (app.ce200Sent) return 'CE200 sent';
      if (app.status === 'coi') return 'Paperwork';
      if (app.status === 'applied') return 'Under review';
      return 'Applied';
    },
    [applications]
  );

  const value = useMemo(
    () => ({
      ready,
      applications,
      refresh,
      getStatusForEvent,
      getPublicStatus,
    }),
    [ready, applications, refresh, getStatusForEvent, getPublicStatus]
  );

  return (
    <VendorApplicationsContext.Provider value={value}>{children}</VendorApplicationsContext.Provider>
  );
}

export function useVendorApplications() {
  const ctx = useContext(VendorApplicationsContext);
  if (!ctx) {
    throw new Error('useVendorApplications must be used within VendorApplicationsProvider');
  }
  return ctx;
}
