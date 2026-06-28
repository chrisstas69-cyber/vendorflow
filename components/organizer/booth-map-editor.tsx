'use client';

import { useCallback, useEffect, useState } from 'react';
import { MapPin, Zap, Droplets, Loader2, Save } from 'lucide-react';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { getActiveOrganizerId } from '@/lib/pilot-config';
import { useOrganizerContext } from '@/contexts/organizer-context';

export interface BoothCell {
  id: string;
  label: string;
  vendorName?: string;
  vendorEmail?: string;
  applicationId?: string;
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

interface PoolVendor {
  name: string;
  email: string;
  applicationId: string;
}

export function BoothMapEditor({ eventId: eventIdProp }: { eventId?: string | null }) {
  const { eventId: ctxEventId } = useOrganizerContext();
  const eventId = eventIdProp ?? ctxEventId ?? 'evt-001';
  const { surface, cardInset, muted, heading, btnPrimary, btnSecondary, dark } = useOrganizerTheme();
  const [booths, setBooths] = useState<BoothCell[]>(DEFAULT_GRID);
  const [pool, setPool] = useState<PoolVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [dragVendor, setDragVendor] = useState<PoolVendor | null>(null);
  const [selectedBooth, setSelectedBooth] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const orgId = getActiveOrganizerId();
    const [appRes, boothRes] = await Promise.all([
      fetch(`/api/organizer/applications?organizerId=${orgId}&eventId=${eventId}`),
      fetch(`/api/organizer/booths?organizerId=${orgId}&eventId=${eventId}`),
    ]);
    const appData = await appRes.json();
    const boothData = await boothRes.json();

    const grid: BoothCell[] =
      boothData.grid?.length > 0
        ? boothData.grid.map((c: BoothCell) => ({ ...c, id: c.label || c.id }))
        : DEFAULT_GRID;

    const assignmentMap = new Map<string, { vendorName: string; vendorEmail: string; applicationId?: string }>();
    for (const a of boothData.assignments ?? []) {
      assignmentMap.set(a.boothLabel, {
        vendorName: a.vendorName,
        vendorEmail: a.vendorEmail,
        applicationId: a.applicationId,
      });
    }

    const merged = grid.map(b => {
      const a = assignmentMap.get(b.label);
      return a
        ? { ...b, vendorName: a.vendorName, vendorEmail: a.vendorEmail, applicationId: a.applicationId }
        : b;
    });

    const assignedEmails = new Set(merged.map(b => b.vendorEmail).filter(Boolean));
    const approved = (appData.items ?? [])
      .filter((i: { status: string; eventId: string }) => i.status === 'approved' && i.eventId === eventId)
      .filter((i: { vendorEmail: string }) => !assignedEmails.has(i.vendorEmail))
      .map((i: { vendorName: string; vendorEmail: string; id: string }) => ({
        name: i.vendorName,
        email: i.vendorEmail,
        applicationId: i.id,
      }));

    setBooths(merged);
    setPool(approved);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const assign = useCallback((boothId: string, vendor: PoolVendor | null) => {
    setBooths(prev =>
      prev.map(b => {
        if (b.id === boothId) {
          return vendor
            ? {
                ...b,
                vendorName: vendor.name,
                vendorEmail: vendor.email,
                applicationId: vendor.applicationId,
              }
            : { ...b, vendorName: undefined, vendorEmail: undefined, applicationId: undefined };
        }
        if (vendor && b.vendorEmail === vendor.email) {
          return { ...b, vendorName: undefined, vendorEmail: undefined, applicationId: undefined };
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
      assign(boothId, dragVendor);
      setDragVendor(null);
    }
  };

  const clearBooth = (boothId: string) => {
    const booth = booths.find(b => b.id === boothId);
    if (booth?.vendorName && booth.vendorEmail && booth.applicationId) {
      setPool(prev => [
        ...prev,
        { name: booth.vendorName!, email: booth.vendorEmail!, applicationId: booth.applicationId! },
      ]);
    }
    assign(boothId, null);
  };

  const save = async () => {
    setSaving(true);
    const assignments = booths
      .filter(b => b.vendorEmail && b.applicationId)
      .map(b => ({
        boothLabel: b.label,
        applicationId: b.applicationId,
        vendorEmail: b.vendorEmail!,
        vendorName: b.vendorName!,
      }));

    const res = await fetch('/api/organizer/booths', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizerId: getActiveOrganizerId(),
        eventId,
        assignments,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.ok) {
      setToast('Booth assignments saved');
      setTimeout(() => setToast(''), 3000);
    } else {
      setToast(json.error ?? 'Save failed — enable PILOT_DATA_SOURCE=db');
      setTimeout(() => setToast(''), 4000);
    }
  };

  const assignedEmails = new Set(booths.map(b => b.vendorEmail).filter(Boolean));
  const unassigned = pool.filter(v => !assignedEmails.has(v.email));
  const selectedHighlight = dark ? 'border-teal-500 bg-teal-950/30' : 'border-teal-500 bg-teal-50';

  return (
    <div>
      {toast && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-emerald-100 text-emerald-800 text-sm">{toast}</div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" onClick={save} disabled={saving} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${btnPrimary} disabled:opacity-60`}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save assignments
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_240px] gap-6">
        <div>
          <p className={`text-sm mb-4 ${muted}`}>
            Drag approved vendors onto booths for event <strong>{eventId}</strong>.
          </p>
          {loading ? (
            <div className={`flex items-center gap-2 text-sm ${muted}`}>
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
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
                        : `${surface} hover:border-teal-300`
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
              className={`mt-4 text-sm px-3 py-1.5 rounded-lg ${btnSecondary}`}
            >
              Clear booth {selectedBooth}
            </button>
          )}
        </div>

        <div className={`rounded-2xl p-4 ${surface}`}>
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
                  className={`rounded-lg p-2 text-sm cursor-grab active:cursor-grabbing ${cardInset}`}
                >
                  {v.name}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
