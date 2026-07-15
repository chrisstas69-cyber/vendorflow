'use client';

import { useEffect, useState } from 'react';
import { useVendorPassport } from '@/contexts/vendor-passport-context';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';
import {
  VENDOR_CATEGORY_OPTIONS,
  VENDOR_SERVICE_TAG_OPTIONS,
  type VehicleType,
  type VendorLogistics,
  type VendorLogisticsPatch,
} from '@/lib/vendor-passport';
import { Check, Loader2 } from 'lucide-react';

const VEHICLE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: 'tent-only', label: 'Tent / table only' },
  { value: 'van', label: 'Van' },
  { value: 'trailer', label: 'Trailer' },
  { value: 'food-truck', label: 'Food truck' },
  { value: 'other', label: 'Other' },
];

function TagToggle({
  label,
  active,
  onToggle,
  dark,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  dark: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? 'bg-amber-400 border-amber-400 text-gray-900'
          : dark
            ? 'border-gray-700 text-gray-400 hover:border-amber-400'
            : 'border-gray-300 text-gray-600 hover:border-amber-400'
      }`}
    >
      {label}
    </button>
  );
}

function logisticsPayload(logistics: VendorLogistics): VendorLogisticsPatch {
  return {
    vehicleType: logistics.vehicleType,
    needsElectric: logistics.needsElectric,
    generatorOk: logistics.generatorOk ?? null,
    waterAccess: logistics.waterAccess ?? null,
    ampRequirement: logistics.ampRequirement?.trim() || null,
    trailerLengthFt: logistics.trailerLengthFt ?? null,
    boothWidthFt: logistics.boothWidthFt ?? null,
    boothDepthFt: logistics.boothDepthFt ?? null,
    setupTimeMinutes: logistics.setupTimeMinutes ?? null,
  };
}

export function PassportLogisticsTab() {
  const { passport, updatePassport, saving } = useVendorPassport();
  const { input, label, muted, heading, accent, btnPrimary, dark } = useVendorTheme();

  const [categories, setCategories] = useState(passport.categories);
  const [serviceTags, setServiceTags] = useState(passport.serviceTags);
  const [logistics, setLogistics] = useState(passport.logistics);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCategories(passport.categories);
    setServiceTags(passport.serviceTags);
    setLogistics(passport.logistics);
    setDirty(false);
  }, [passport.categories, passport.serviceTags, passport.logistics, passport.updatedAt]);

  const markDirty = () => {
    setDirty(true);
    setSaved(false);
  };

  const toggleCategory = (cat: string) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
    markDirty();
  };

  const toggleTag = (tag: string) => {
    setServiceTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    markDirty();
  };

  const updateLogistics = (patch: Partial<VendorLogistics>) => {
    setLogistics(prev => ({ ...prev, ...patch }));
    markDirty();
  };

  const numField = (
    fieldLabel: string,
    key: 'trailerLengthFt' | 'boothWidthFt' | 'boothDepthFt' | 'setupTimeMinutes',
    step = 1
  ) => (
    <label className="block">
      <span className={`text-sm font-medium ${label}`}>{fieldLabel}</span>
      <input
        type="number"
        min={0}
        step={step}
        value={logistics[key] ?? ''}
        onChange={e =>
          updateLogistics({
            [key]: e.target.value === '' ? undefined : Number(e.target.value),
          })
        }
        className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${input}`}
      />
    </label>
  );

  const handleSave = async () => {
    await updatePassport({
      categories,
      serviceTags,
      logistics: logisticsPayload(logistics),
    });
    setDirty(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <section>
        <h3 className={`font-semibold mb-2 ${heading}`}>Categories</h3>
        <p className={`text-xs mb-3 ${muted}`}>What type of vendor are you?</p>
        <div className="flex flex-wrap gap-2">
          {VENDOR_CATEGORY_OPTIONS.map(cat => (
            <TagToggle
              key={cat}
              label={cat}
              active={categories.includes(cat)}
              onToggle={() => toggleCategory(cat)}
              dark={dark}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className={`font-semibold mb-2 ${heading}`}>Matching tags</h3>
        <p className={`text-xs mb-3 ${muted}`}>Used by AI matching and organizer filters</p>
        <div className="flex flex-wrap gap-2">
          {VENDOR_SERVICE_TAG_OPTIONS.map(tag => (
            <TagToggle
              key={tag}
              label={tag.replace(/-/g, ' ')}
              active={serviceTags.includes(tag)}
              onToggle={() => toggleTag(tag)}
              dark={dark}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className={`font-semibold mb-3 ${heading}`}>Setup &amp; trailer requirements</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block sm:col-span-2">
            <span className={`text-sm font-medium ${label}`}>Vehicle type</span>
            <select
              value={logistics.vehicleType}
              onChange={e => updateLogistics({ vehicleType: e.target.value as VehicleType })}
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${input}`}
            >
              {VEHICLE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {numField('Booth width (ft)', 'boothWidthFt')}
          {numField('Booth depth (ft)', 'boothDepthFt')}
          {numField('Trailer length (ft)', 'trailerLengthFt')}
          {numField('Setup time (minutes)', 'setupTimeMinutes', 15)}
          <label className="block sm:col-span-2">
            <span className={`text-sm font-medium ${label}`}>Power requirement (optional)</span>
            <input
              type="text"
              placeholder="Leave blank if you don't need power — e.g. 20A"
              value={logistics.ampRequirement ?? ''}
              onChange={e => updateLogistics({ ampRequirement: e.target.value })}
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${input}`}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          {(
            [
              ['needsElectric', 'Needs electric hookup'],
              ['generatorOk', 'Can bring generator'],
              ['waterAccess', 'Needs water access'],
            ] as const
          ).map(([key, fieldLabel]) => (
            <label key={key} className={`flex items-center gap-2 text-sm ${label}`}>
              <input
                type="checkbox"
                checked={!!logistics[key]}
                onChange={e => updateLogistics({ [key]: e.target.checked })}
                className="rounded"
              />
              {fieldLabel}
            </label>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 ${btnPrimary}`}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Save changes'
          )}
        </button>
        {saved && !dirty && (
          <span className={`inline-flex items-center gap-1 text-sm ${accent}`}>
            <Check className="h-4 w-4" />
            Saved
          </span>
        )}
        {dirty && !saving && (
          <span className={`text-xs ${muted}`}>You have unsaved changes</span>
        )}
      </div>
    </div>
  );
}
