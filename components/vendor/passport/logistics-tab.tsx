'use client';

import { useVendorPassport } from '@/contexts/vendor-passport-context';
import {
  VENDOR_CATEGORY_OPTIONS,
  VENDOR_SERVICE_TAG_OPTIONS,
  type VehicleType,
} from '@/lib/vendor-passport';

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
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? 'bg-amber-400 border-amber-400 text-gray-900'
          : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-amber-400'
      }`}
    >
      {label}
    </button>
  );
}

export function PassportLogisticsTab() {
  const { passport, updatePassport, saving } = useVendorPassport();
  const { logistics } = passport;

  const toggleCategory = (cat: string) => {
    const next = passport.categories.includes(cat)
      ? passport.categories.filter(c => c !== cat)
      : [...passport.categories, cat];
    updatePassport({ categories: next });
  };

  const toggleTag = (tag: string) => {
    const next = passport.serviceTags.includes(tag)
      ? passport.serviceTags.filter(t => t !== tag)
      : [...passport.serviceTags, tag];
    updatePassport({ serviceTags: next });
  };

  const numField = (
    label: string,
    key: 'trailerLengthFt' | 'boothWidthFt' | 'boothDepthFt' | 'setupTimeMinutes',
    step = 1
  ) => (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="number"
        min={0}
        step={step}
        value={logistics[key] ?? ''}
        onChange={e =>
          updatePassport({
            logistics: { ...logistics, [key]: e.target.value ? Number(e.target.value) : undefined },
          })
        }
        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
      />
    </label>
  );

  return (
    <div className="space-y-8 max-w-2xl">
      <section>
        <h3 className="font-semibold mb-2">Categories</h3>
        <p className="text-xs text-gray-500 mb-3">What type of vendor are you?</p>
        <div className="flex flex-wrap gap-2">
          {VENDOR_CATEGORY_OPTIONS.map(cat => (
            <TagToggle
              key={cat}
              label={cat}
              active={passport.categories.includes(cat)}
              onToggle={() => toggleCategory(cat)}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Matching tags</h3>
        <p className="text-xs text-gray-500 mb-3">Used by AI matching and organizer filters</p>
        <div className="flex flex-wrap gap-2">
          {VENDOR_SERVICE_TAG_OPTIONS.map(tag => (
            <TagToggle
              key={tag}
              label={tag.replace(/-/g, ' ')}
              active={passport.serviceTags.includes(tag)}
              onToggle={() => toggleTag(tag)}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-3">Setup &amp; trailer requirements</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Vehicle type</span>
            <select
              value={logistics.vehicleType}
              onChange={e =>
                updatePassport({
                  logistics: { ...logistics, vehicleType: e.target.value as VehicleType },
                })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
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
            <span className="text-sm font-medium">Power requirement</span>
            <input
              type="text"
              placeholder="e.g. 20A, none"
              value={logistics.ampRequirement ?? ''}
              onChange={e =>
                updatePassport({
                  logistics: {
                    ...logistics,
                    needsElectric: !!e.target.value,
                    ampRequirement: e.target.value || undefined,
                  },
                })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
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
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!logistics[key]}
                onChange={e =>
                  updatePassport({ logistics: { ...logistics, [key]: e.target.checked } })
                }
                className="rounded"
              />
              {label}
            </label>
          ))}
        </div>
      </section>
      {saving && <p className="text-xs text-amber-600">Saving…</p>}
    </div>
  );
}
