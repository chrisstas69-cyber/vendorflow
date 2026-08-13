'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Grid3X3, Map } from 'lucide-react';
import { BoothMapEditor } from '@/components/organizer/booth-map-editor';
import { StreetFairBuilder } from '@/components/organizer/street-fair-builder';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { getActiveOrganizerId } from '@/lib/pilot-config';
import type { LayoutMode } from '@/lib/booth/street-fair-schema';

export function BoothPlanningShell({ eventId }: { eventId: string }) {
  const { btnPrimary, btnSecondary, muted } = useOrganizerTheme();
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadMode = useCallback(async () => {
    setLoading(true);
    const orgId = getActiveOrganizerId();
    const res = await fetch(`/api/organizer/booths?organizerId=${orgId}&eventId=${eventId}`);
    const data = await res.json();
    // Always introduce organizers through the simple grid. Existing street
    // layouts remain available under the clearly labeled advanced option.
    if (data.layoutMode === 'grid') setLayoutMode('grid');
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
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">Recommended</p>
        <h2 className="mt-1 font-semibold">Start with a simple booth grid</h2>
        <p className={`mt-1 text-sm ${muted}`}>Create numbered spaces and assign approved vendors. This works for most school fairs, markets, and indoor events.</p>
        <button
          type="button"
          onClick={() => switchMode('grid')}
          className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${btnPrimary}`}
        >
          <Grid3X3 className="h-4 w-4" /> Use simple grid
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(value => !value)}
        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold ${btnSecondary}`}
        aria-expanded={showAdvanced}
      >
        <span><span className="block">Advanced street mapping</span><span className={`mt-0.5 block text-xs font-normal ${muted}`}>For events spanning streets, blocks, odd/even sides, or food-truck zones</span></span>
        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {showAdvanced && <div className="rounded-xl border border-stone-200 bg-white p-4">
        <button
          type="button"
          onClick={() => switchMode('street-fair')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
            layoutMode === 'street-fair' ? btnPrimary : btnSecondary
          }`}
        >
          <Map className="h-4 w-4" /> Open street mapping
        </button>
      </div>}

      {layoutMode === 'grid' ? <BoothMapEditor eventId={eventId} /> : <StreetFairBuilder eventId={eventId} />}
    </div>
  );
}
