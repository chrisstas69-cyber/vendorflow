'use client';

import { useCallback, useEffect, useState } from 'react';
import { MapPin, Zap, Droplets, Loader2 } from 'lucide-react';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { DEMO_ORGANIZER_ID } from '@/lib/platform-data';

export interface BoothCell {
  id: string;
  label: string;
  vendorName?: string;
  vendorEmail?: string;
  utilities: ('electric' | 'water')[];
}

const DEFAULT_GRID: BoothCell[] = [
  { id: 'A-1', label: 'A-1', utilities: ['electric'] },
  { id: 'A-2', label: 'A-2', utilities: [] },
  { id: 'A-3', label: 'A-3', utilities: ['electric', 'water'] },
  { id: 'B-1', label: 'B-1', utilities: ['electric'] },
  { id: 'B-2', label: 'B-2', utilities: [] },
  { id: 'B-3', label: 'B-3', utilities: [] },
  { id: 'C-1', label: 'C-1', utilities: ['water'] },
  { id: 'C-2', label: 'C-2', utilities: [] },
  { id: 'C-3', label: 'C-3', utilities: ['electric'] },
];

export function BoothMapEditor() {
  const { card, cardInset, muted, heading, btnSecondary, dark } = useOrganizerTheme();
  const [booths, setBooths] = useState<BoothCell[]>(DEFAULT_GRID);
  const [pool, setPool] = useState<{ name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragVendor, setDragVendor] = useState<{ name: string; email: string } | null>(null);
  const [selectedBooth, setSelectedBooth] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/organizer/applications?organizerId=${DEMO_ORGANIZER_ID}`);
      const data = await res.json();
      const approved = (data.items ?? [])
        .filter(
          (i: { status: string; boothId?: string }) =>
            i.status === 'approved' && !i.boothId
        )
        .map((i: { vendorName: string; vendorEmail: string }) => ({
          name: i.vendorName,
          email: i.vendorEmail,
        }));

      const mapped = (data.items ?? []).filter(
        (i: { boothId?: string; vendorName: string; vendorEmail: string }) => i.boothId
      );

      setBooths(prev =>
        prev.map(b => {
          const match = mapped.find((m: { boothId: string }) => m.boothId === b.id);
          return match
            ? { ...b, vendorName: match.vendorName, vendorEmail: match.vendorEmail }
            : b;
        })
      );
      setPool(approved);
      setLoading(false);
    }
    load();
  }, []);

  const assign = useCallback((boothId: string, vendor: { name: string; email: string } | null) => {
    setBooths(prev =>
      prev.map(b => {
        if (b.id === boothId) {
          return vendor
            ? { ...b, vendorName: vendor.name, vendorEmail: vendor.email }
            : { ...b, vendorName: undefined, vendorEmail: undefined };
        }
        if (vendor && b.vendorEmail === vendor.email) {
          return { ...b, vendorName: undefined, vendorEmail: undefined };
        }
        return b;
      })
    );
    if (vendor) {
      setPool(prev => prev.filter(v => v.email !== vendor.email));
    }
  }, []);

  const onDrop = (boothId: string) => {
    if (dragVendor) {
      const prevBooth = booths.find(b => b.vendorEmail === dragVendor.email);
      if (prevBooth && prevBooth.id !== boothId) {
        setBooths(prev =>
          prev.map(b =>
            b.id === prevBooth.id
              ? { ...b, vendorName: undefined, vendorEmail: undefined }
              : b
          )
        );
      }
      assign(boothId, dragVendor);
      setDragVendor(null);
    }
  };

  const clearBooth = (boothId: string) => {
    const booth = booths.find(b => b.id === boothId);
    if (booth?.vendorName && booth.vendorEmail) {
      setPool(prev => [...prev, { name: booth.vendorName!, email: booth.vendorEmail! }]);
    }
    assign(boothId, null);
  };

  const assignedEmails = new Set(booths.map(b => b.vendorEmail).filter(Boolean));
  const unassigned = pool.filter(v => !assignedEmails.has(v.email));

  const selectedHighlight = dark
    ? 'border-teal-500 bg-teal-950/30'
    : 'border-teal-500 bg-teal-50';

  return (
    <div className="grid lg:grid-cols-[1fr_240px] gap-6">
      <div>
        <p className={`text-sm mb-4 ${muted}`}>
          Drag approved vendors onto booths. Electric and water tags show utility requirements.
        </p>
        {loading ? (
          <div className={`flex items-center gap-2 text-sm ${muted}`}>
            <Loader2 className="h-4 w-4 animate-spin" /> Loading vendors…
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 max-w-lg">
            {booths.map(booth => (
              <div
                key={booth.id}
                onDragOver={e => e.preventDefault()}
                onDrop={() => onDrop(booth.id)}
                onClick={() => setSelectedBooth(booth.id)}
                className={`aspect-square rounded-xl border-2 border-dashed p-2 flex flex-col justify-between cursor-pointer transition-colors ${
                  selectedBooth === booth.id
                    ? selectedHighlight
                    : booth.vendorName
                      ? `${cardInset} border-solid`
                      : `${card} hover:border-teal-300`
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold">{booth.label}</span>
                  <div className="flex gap-0.5">
                    {booth.utilities.includes('electric') && (
                      <Zap className="h-3 w-3 text-amber-500" aria-label="Electric" />
                    )}
                    {booth.utilities.includes('water') && (
                      <Droplets className="h-3 w-3 text-blue-500" aria-label="Water" />
                    )}
                  </div>
                </div>
                {booth.vendorName ? (
                  <div className="text-[10px] font-medium leading-tight truncate">{booth.vendorName}</div>
                ) : (
                  <div className={`text-[10px] ${muted}`}>Empty</div>
                )}
              </div>
            ))}
          </div>
        )}
        {selectedBooth && (
          <button
            type="button"
            onClick={() => clearBooth(selectedBooth)}
            className={`mt-4 text-sm px-3 py-1.5 rounded-lg border ${btnSecondary}`}
          >
            Clear booth {selectedBooth}
          </button>
        )}
      </div>

      <div className={`rounded-xl border p-4 ${card}`}>
        <h3 className={`font-semibold mb-3 flex items-center gap-2 ${heading}`}>
          <MapPin className="h-4 w-4" /> Unassigned
        </h3>
        <div className="space-y-2">
          {unassigned.length === 0 ? (
            <p className={`text-xs ${muted}`}>No approved vendors waiting for a booth.</p>
          ) : (
            unassigned.map(v => (
              <div
                key={v.email}
                draggable
                onDragStart={() => setDragVendor(v)}
                className={`rounded-lg p-2 text-sm cursor-grab active:cursor-grabbing border ${cardInset}`}
              >
                {v.name}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
