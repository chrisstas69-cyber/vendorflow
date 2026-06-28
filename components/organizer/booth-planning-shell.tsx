'use client';

import { useCallback, useEffect, useState } from 'react';
import { Grid3X3, Map } from 'lucide-react';
import { BoothMapEditor } from '@/components/organizer/booth-map-editor';
import { StreetFairBuilder } from '@/components/organizer/street-fair-builder';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { getActiveOrganizerId } from '@/lib/pilot-config';
import type { LayoutMode } from '@/lib/booth/street-fair-schema';

export function BoothPlanningShell({ eventId }: { eventId: string }) {
  const { btnPrimary, btnSecondary, muted } = useOrganizerTheme();
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [loading, setLoading] = useState(true);

  const loadMode = useCallback(async () => {
    setLoading(true);
    const orgId = getActiveOrganizerId();
    const res = await fetch(`/api/organizer/booths?organizerId=${orgId}&eventId=${eventId}`);
    const data = await res.json();
    if (data.layoutMode) setLayoutMode(data.layoutMode);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    loadMode();
  }, [loadMode]);

  const switchMode = async (mode: LayoutMode) => {
    setLayoutMode(mode);
    const orgId = getActiveOrganizerId();
    await fetch('/api/organizer/booths', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizerId: orgId, eventId, layoutMode: mode }),
    });
  };

  if (loading) {
    return <p className={`text-sm ${muted}`}>Loading booth planner…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => switchMode('grid')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
            layoutMode === 'grid' ? btnPrimary : btnSecondary
          }`}
        >
          <Grid3X3 className="h-4 w-4" /> Quick Grid Mode
        </button>
        <button
          type="button"
          onClick={() => switchMode('street-fair')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
            layoutMode === 'street-fair' ? btnPrimary : btnSecondary
          }`}
        >
          <Map className="h-4 w-4" /> Street Fair Mode
        </button>
      </div>

      <p className={`text-sm ${muted}`}>
        {layoutMode === 'grid'
          ? 'Drag approved vendors onto a simple grid — best for indoor halls and school fairs.'
          : 'Model streets, blocks, and both sides — auto-generates numbered booth inventory for festivals.'}
      </p>

      {layoutMode === 'grid' ? <BoothMapEditor eventId={eventId} /> : <StreetFairBuilder eventId={eventId} />}
    </div>
  );
}
