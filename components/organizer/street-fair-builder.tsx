'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { getActiveOrganizerId } from '@/lib/pilot-config';
import {
  DEFAULT_STREET_FAIR_LAYOUT,
  type NumberingScheme,
  type StreetFairLayoutDefinition,
} from '@/lib/booth/street-fair-schema';
import { createEmptyBlock, createEmptyStreet, generateBoothInventory, applyNumberingSchemeToLayout } from '@/lib/booth/street-fair-generate';
import { StreetFairPreview, buildSpotAssignmentEmail } from '@/components/organizer/street-fair-preview';
import { buildBulkSpotAssignmentEmail } from '@/lib/booth/bulk-spot-email';
import type { BoothKind, BoothSpace } from '@/lib/booth/street-fair-schema';
import { Mail, Printer } from 'lucide-react';

interface PoolVendor {
  name: string;
  email: string;
  applicationId: string;
}

export function StreetFairBuilder({ eventId }: { eventId: string }) {
  const { surface, muted, heading, btnPrimary, btnSecondary, cardInset } = useOrganizerTheme();
  const [layout, setLayout] = useState<StreetFairLayoutDefinition>(DEFAULT_STREET_FAIR_LAYOUT);
  const [booths, setBooths] = useState<BoothSpace[]>([]);
  const [pool, setPool] = useState<PoolVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [selectedBooth, setSelectedBooth] = useState<BoothSpace | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const load = useCallback(async () => {
    setLoading(true);
    const orgId = getActiveOrganizerId();
    const [layoutRes, appRes] = await Promise.all([
      fetch(`/api/organizer/booths?organizerId=${orgId}&eventId=${eventId}`),
      fetch(`/api/organizer/applications?organizerId=${orgId}&eventId=${eventId}`),
    ]);
    const layoutData = await layoutRes.json();
    const appData = await appRes.json();

    if (layoutData.streetFair?.streets?.length) {
      setLayout(layoutData.streetFair);
    }
    const nextBooths =
      layoutData.generatedBooths?.length > 0
        ? layoutData.generatedBooths
        : layoutData.streetFair?.streets?.length
          ? generateBoothInventory(layoutData.streetFair)
          : [];
    if (nextBooths.length) setBooths(nextBooths);

    const assigned = new Set((layoutData.generatedBooths ?? []).map((b: BoothSpace) => b.vendorEmail).filter(Boolean));
    const approved = (appData.items ?? [])
      .filter((i: { status: string }) => i.status === 'approved')
      .map((i: { vendorName: string; vendorEmail: string; id: string }) => ({
        name: i.vendorName,
        email: i.vendorEmail,
        applicationId: i.id,
      }))
      .filter((v: PoolVendor) => !assigned.has(v.email));
    setPool(approved);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const saveLayout = async () => {
    setSaving(true);
    const orgId = getActiveOrganizerId();
    const res = await fetch('/api/organizer/booths', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizerId: orgId,
        eventId,
        layoutMode: 'street-fair',
        streetFair: layout,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      const regenerated =
        data.generatedBooths?.length > 0
          ? data.generatedBooths
          : generateBoothInventory(layout);
      setBooths(regenerated);
      showToast(`Street layout saved — ${regenerated.length} booth spaces`);
      if (regenerated.length) setStep(3);
    } else {
      showToast(data.error ?? 'Save failed');
    }
    setSaving(false);
  };

  const saveAssignments = async () => {
    setSaving(true);
    const orgId = getActiveOrganizerId();
    const assignments = booths
      .filter(b => b.vendorEmail)
      .map(b => ({
        boothLabel: b.label,
        vendorName: b.vendorName!,
        vendorEmail: b.vendorEmail!,
        applicationId: b.applicationId,
      }));
    const res = await fetch('/api/organizer/booths', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizerId: orgId, eventId, assignments }),
    });
    const data = await res.json();
    showToast(data.ok ? 'Assignments saved' : data.error ?? 'Save failed');
    setSaving(false);
  };

  const assignVendor = (vendor: PoolVendor) => {
    if (!selectedBooth) {
      showToast('Select a booth space first');
      return;
    }
    setBooths(prev =>
      prev.map(b =>
        b.id === selectedBooth.id
          ? { ...b, vendorName: vendor.name, vendorEmail: vendor.email, applicationId: vendor.applicationId }
          : b
      )
    );
    setPool(prev => prev.filter(v => v.email !== vendor.email));
    setSelectedBooth(null);
  };

  const updateScheme = (scheme: NumberingScheme) => {
    setLayout(prev => applyNumberingSchemeToLayout({ ...prev, numberingScheme: scheme }));
  };

  const handlePrint = () => {
    window.print();
  };

  const emailAssigned = (booth: BoothSpace) => {
    if (!booth.vendorEmail) return;
    window.location.href = buildSpotAssignmentEmail(booth);
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 p-8 ${muted}`}>
        <Loader2 className="h-5 w-5 animate-spin" /> Loading street layout…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="px-4 py-2 rounded-lg bg-emerald-100 text-emerald-800 text-sm font-medium">{toast}</div>
      )}

      {/* Wizard steps */}
      <div className="flex gap-2 flex-wrap">
        {([1, 2, 3] as const).map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${step === s ? btnPrimary : btnSecondary}`}
          >
            {s === 1 ? '1. Streets & blocks' : s === 2 ? '2. Numbering' : '3. Preview & assign'}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          {layout.streets.map((street, si) => (
            <div key={street.id} className={`rounded-xl p-4 ${cardInset}`}>
              <div className="flex items-center gap-2 mb-3">
                <input
                  value={street.name}
                  onChange={e => {
                    const name = e.target.value;
                    setLayout(prev => ({
                      ...prev,
                      streets: prev.streets.map((st, i) => (i === si ? { ...st, name } : st)),
                    }));
                  }}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${btnSecondary}`}
                  placeholder="Street name"
                />
                <label className={`text-xs flex items-center gap-1 ${muted}`}>
                  <input
                    type="checkbox"
                    checked={street.isSecondary ?? false}
                    onChange={e => {
                      const checked = e.target.checked;
                      setLayout(prev => ({
                        ...prev,
                        streets: prev.streets.map((st, i) =>
                          i === si ? { ...st, isSecondary: checked } : st
                        ),
                      }));
                    }}
                  />
                  Side street
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setLayout(prev => ({
                      ...prev,
                      streets: prev.streets.filter((_, i) => i !== si),
                    }))
                  }
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  aria-label="Remove street"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {street.blocks.map((block, bi) => (
                <div key={block.id} className="mb-3 pl-3 border-l-2 border-teal-200 dark:border-teal-800">
                  <label className={`block text-xs font-semibold mb-1 ${heading}`}>
                    Block name <span className={`font-normal ${muted}`}>(optional — e.g. Food Row, Block A)</span>
                    <input
                      value={block.name ?? ''}
                      onChange={e => {
                        const name = e.target.value;
                        setLayout(prev => ({
                          ...prev,
                          streets: prev.streets.map((st, i) =>
                            i !== si
                              ? st
                              : {
                                  ...st,
                                  blocks: st.blocks.map((bl, j) =>
                                    j === bi ? { ...bl, name } : bl
                                  ),
                                }
                          ),
                        }));
                      }}
                      placeholder="Food Row · Artist Alley · Block 1"
                      className={`w-full mt-1 rounded-lg border px-3 py-2 text-sm ${btnSecondary}`}
                    />
                  </label>
                  <div className="grid sm:grid-cols-2 gap-2 mb-2 mt-2">
                    <input
                      value={block.startIntersection}
                      onChange={e => {
                        const v = e.target.value;
                        setLayout(prev => ({
                          ...prev,
                          streets: prev.streets.map((st, i) =>
                            i !== si
                              ? st
                              : {
                                  ...st,
                                  blocks: st.blocks.map((bl, j) =>
                                    j === bi ? { ...bl, startIntersection: v } : bl
                                  ),
                                }
                          ),
                        }));
                      }}
                      placeholder="Start cross street (e.g. Oak Ave)"
                      className={`rounded-lg border px-3 py-2 text-sm ${btnSecondary}`}
                    />
                    <input
                      value={block.endIntersection}
                      onChange={e => {
                        const v = e.target.value;
                        setLayout(prev => ({
                          ...prev,
                          streets: prev.streets.map((st, i) =>
                            i !== si
                              ? st
                              : {
                                  ...st,
                                  blocks: st.blocks.map((bl, j) =>
                                    j === bi ? { ...bl, endIntersection: v } : bl
                                  ),
                                }
                          ),
                        }));
                      }}
                      placeholder="End cross street (e.g. Maple St)"
                      className={`rounded-lg border px-3 py-2 text-sm ${btnSecondary}`}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {block.sides.map((side, sidei) => (
                      <div key={side.id} className={`rounded-lg p-2 ${surface}`}>
                        <div className={`text-xs font-semibold capitalize mb-1 ${heading}`}>{side.label} side</div>
                        <label className={`text-xs ${muted}`}>
                          Booths
                          <input
                            type="number"
                            min={1}
                            max={40}
                            value={side.boothCount}
                            onChange={e => {
                              const boothCount = parseInt(e.target.value, 10) || 1;
                              setLayout(prev => ({
                                ...prev,
                                streets: prev.streets.map((st, i) =>
                                  i !== si
                                    ? st
                                    : {
                                        ...st,
                                        blocks: st.blocks.map((bl, j) =>
                                          j !== bi
                                            ? bl
                                            : {
                                                ...bl,
                                                sides: bl.sides.map((s, k) =>
                                                  k === sidei ? { ...s, boothCount } : s
                                                ),
                                              }
                                        ),
                                      }
                                ),
                              }));
                            }}
                            className={`w-full mt-1 rounded border px-2 py-1 text-sm ${btnSecondary}`}
                          />
                        </label>
                        <label className={`text-xs ${muted} block mt-2`}>
                          Space type
                          <select
                            value={side.boothKind ?? 'tent'}
                            onChange={e => {
                              const boothKind = e.target.value as BoothKind;
                              setLayout(prev => ({
                                ...prev,
                                streets: prev.streets.map((st, i) =>
                                  i !== si
                                    ? st
                                    : {
                                        ...st,
                                        blocks: st.blocks.map((bl, j) =>
                                          j !== bi
                                            ? bl
                                            : {
                                                ...bl,
                                                sides: bl.sides.map((s, k) =>
                                                  k === sidei ? { ...s, boothKind } : s
                                                ),
                                              }
                                        ),
                                      }
                                ),
                              }));
                            }}
                            className={`w-full mt-1 rounded border px-2 py-1 text-sm ${btnSecondary}`}
                          >
                            <option value="tent">Tents / canopies</option>
                            <option value="truck">Food trucks</option>
                          </select>
                        </label>
                        <input
                          value={side.boothSize ?? ''}
                          onChange={e => {
                            const boothSize = e.target.value;
                            setLayout(prev => ({
                              ...prev,
                              streets: prev.streets.map((st, i) =>
                                i !== si
                                  ? st
                                  : {
                                      ...st,
                                      blocks: st.blocks.map((bl, j) =>
                                        j !== bi
                                          ? bl
                                          : {
                                              ...bl,
                                              sides: bl.sides.map((s, k) =>
                                                k === sidei ? { ...s, boothSize } : s
                                              ),
                                            }
                                      ),
                                    }
                              ),
                            }));
                          }}
                          placeholder="Booth size"
                          className={`w-full mt-1 rounded border px-2 py-1 text-sm ${btnSecondary}`}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setLayout(prev => ({
                        ...prev,
                        streets: prev.streets.map((st, i) =>
                          i !== si ? st : { ...st, blocks: st.blocks.filter((_, j) => j !== bi) }
                        ),
                      }))
                    }
                    className="text-xs text-red-600 mt-1"
                  >
                    Remove block
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setLayout(prev => ({
                    ...prev,
                    streets: prev.streets.map((st, i) =>
                      i === si ? { ...st, blocks: [...st.blocks, createEmptyBlock(prev.numberingScheme)] } : st
                    ),
                  }))
                }
                className={`flex items-center gap-1 text-sm font-medium mt-2 ${muted}`}
              >
                <Plus className="h-4 w-4" /> Add block
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              setLayout(prev => ({
                ...prev,
                streets: [...prev.streets, createEmptyStreet('New Street', prev.streets.length > 0)],
              }))
            }
            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold ${btnSecondary}`}
          >
            <Plus className="h-4 w-4" /> Add street
          </button>

          <button
            type="button"
            onClick={saveLayout}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${btnPrimary}`}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Generate booth inventory
          </button>

          {layout.streets.some(s => s.blocks.length > 0) && (
            <div className="mt-6">
              <h3 className={`text-sm font-semibold mb-3 ${heading}`}>Live preview</h3>
              <StreetFairPreview
                layout={layout}
                booths={booths.length ? booths : generateBoothInventory(layout)}
              />
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className={`rounded-xl p-4 space-y-4 ${cardInset}`}>
          <h3 className={`font-semibold ${heading}`}>Booth numbering scheme</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {(['odd-even', 'north-south', 'east-west', 'custom'] as NumberingScheme[]).map(scheme => (
              <button
                key={scheme}
                type="button"
                onClick={() => updateScheme(scheme)}
                className={`px-4 py-3 rounded-lg text-sm font-medium text-left capitalize ${
                  layout.numberingScheme === scheme ? btnPrimary : btnSecondary
                }`}
              >
                {scheme.replace('-', ' / ')}
              </button>
            ))}
          </div>
          {layout.numberingScheme === 'custom' && (
            <label className={`block text-sm ${muted}`}>
              Custom prefix
              <input
                value={layout.customPrefix ?? ''}
                onChange={e =>
                  setLayout(prev => ({ ...prev, customPrefix: e.target.value }))
                }
                placeholder="e.g. MAIN-"
                className={`w-full mt-1 rounded-lg border px-3 py-2 ${btnSecondary}`}
              />
            </label>
          )}
          <button type="button" onClick={saveLayout} disabled={saving} className={`px-4 py-2 rounded-lg text-sm font-semibold ${btnPrimary}`}>
            Apply & regenerate
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 no-print">
              <button
                type="button"
                onClick={handlePrint}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${btnSecondary}`}
              >
                <Printer className="h-4 w-4" /> Print day-of map
              </button>
              <button
                type="button"
                onClick={() => {
                  const assigned = (booths.length ? booths : generateBoothInventory(layout)).filter(
                    b => b.vendorEmail
                  );
                  const mailto = buildBulkSpotAssignmentEmail(assigned, eventId);
                  if (mailto) window.location.href = mailto;
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${btnSecondary}`}
              >
                <Mail className="h-4 w-4" /> Email all assigned
              </button>
            </div>
            <StreetFairPreview
              layout={layout}
              booths={booths.length ? booths : generateBoothInventory(layout)}
              selectedBoothId={selectedBooth?.id}
              onSelectBooth={setSelectedBooth}
            />
          </div>
          <div className={`rounded-xl p-4 h-fit no-print ${cardInset}`}>
            <h3 className={`font-semibold text-sm mb-3 ${heading}`}>Assign vendors</h3>
            {selectedBooth ? (
              <div className="mb-3 space-y-2">
                <p className={`text-sm ${muted}`}>
                  Selected spot <strong className={heading}>#{selectedBooth.label}</strong>
                  {selectedBooth.vendorName ? ` — ${selectedBooth.vendorName}` : ' — empty'}
                </p>
                {selectedBooth.vendorEmail && (
                  <button
                    type="button"
                    onClick={() => emailAssigned(selectedBooth)}
                    className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm ${btnSecondary}`}
                  >
                    <Mail className="h-4 w-4" /> Email spot #{selectedBooth.label}
                  </button>
                )}
              </div>
            ) : (
              <p className={`text-sm mb-3 ${muted}`}>Click a spot on the map to assign a vendor.</p>
            )}
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {pool.length === 0 ? (
                <li className={`text-sm ${muted}`}>No unassigned approved vendors.</li>
              ) : (
                pool.map(v => (
                  <li key={v.email}>
                    <button
                      type="button"
                      onClick={() => assignVendor(v)}
                      disabled={!selectedBooth}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm disabled:opacity-50 ${btnSecondary}`}
                    >
                      <div className={`font-medium ${heading}`}>{v.name}</div>
                      <div className={`text-xs ${muted}`}>{v.email}</div>
                    </button>
                  </li>
                ))
              )}
            </ul>
            <button
              type="button"
              onClick={saveAssignments}
              disabled={saving}
              className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${btnPrimary}`}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save assignments
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
