'use client';

import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { VendorPulseCard } from '@/components/vendor/vendor-pulse-card';
import { useDemoStore } from '@/contexts/demo-store-context';
import type { AlphaTier } from '@/lib/mock-data';
import { CATEGORY_LABELS, type EventCategory } from '@/lib/platform-data';
import { Filter, X } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';

export default function EventPulsePage() {
  const { publishedEvents, applications, applyToEvent } = useDemoStore();
  const { mode } = useTheme();
  const dark = mode === 'night';
  const sidebar = dark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';
  const pipelineIds = useMemo(
    () => new Set(applications.map(a => a.eventId).filter(Boolean)),
    [applications]
  );

  const [showFilters, setShowFilters] = useState(true);
  const [selectedTiers, setSelectedTiers] = useState<AlphaTier[]>(['S', 'A', 'B', 'C']);
  const [category, setCategory] = useState<EventCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'roi' | 'family' | 'risk'>('roi');
  const [message, setMessage] = useState('');
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const toggleTier = (tier: AlphaTier) => {
    setSelectedTiers(prev =>
      prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]
    );
  };

  const filteredEvents = publishedEvents
    .filter(event => selectedTiers.includes(event.tier))
    .filter(event => category === 'all' || event.category === category)
    .sort((a, b) => {
      if (sortBy === 'roi') return b.roiMax - a.roiMax;
      if (sortBy === 'family') return b.familyDensity - a.familyDensity;
      return a.dudRisk - b.dudRisk;
    });

  const handleApply = (event: (typeof publishedEvents)[0]) => {
    setApplyingId(event.id);
    const result = applyToEvent({
      id: event.id,
      name: event.name,
      date: event.date,
      location: event.location,
      tier: event.tier,
      alphaScore: event.alphaScore,
      familyDensity: event.familyDensity,
      footTraffic: event.footTraffic,
      boothFee: event.boothFee,
      permitFee: event.permitFee,
      roiMin: event.roiMin,
      roiMax: event.roiMax,
      dudRisk: event.dudRisk,
      tags: event.tags,
      description: event.description,
    });
    setMessage(result.message);
    setApplyingId(null);
  };

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row min-h-0">
        {showFilters && (
          <aside className={`w-full lg:w-72 border-b lg:border-b-0 lg:border-r p-4 shrink-0 ${sidebar}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filters
              </span>
              <button type="button" onClick={() => setShowFilters(false)} className="lg:hidden p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-5">
              <div className={`text-xs font-medium mb-2 ${muted}`}>Event type</div>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as typeof category)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <option value="all">All types</option>
                {(Object.keys(CATEGORY_LABELS) as EventCategory[]).map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <div className="text-xs font-medium text-gray-500 mb-2">Quality tier</div>
              <div className="space-y-1">
                {(['S', 'A', 'B', 'C'] as AlphaTier[]).map(tier => (
                  <label key={tier} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedTiers.includes(tier)}
                      onChange={() => toggleTier(tier)}
                      className="rounded"
                    />
                    Tier {tier}
                    <span className="ml-auto text-gray-400 text-xs">
                      {publishedEvents.filter(e => e.tier === tier).length}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <div className="text-xs font-medium text-gray-500 mb-2">Sort by</div>
              <div className="space-y-1">
                {[
                  { value: 'roi', label: 'Best ROI' },
                  { value: 'family', label: 'Most family-friendly' },
                  { value: 'risk', label: 'Lowest risk' },
                ].map(option => (
                  <label key={option.value} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="sort"
                      checked={sortBy === option.value}
                      onChange={() => setSortBy(option.value as typeof sortBy)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm">
              <div className="font-semibold mb-1">{filteredEvents.length} events match</div>
              <div className="text-gray-600 dark:text-gray-400 text-xs">
                {pipelineIds.size} in your pipeline
              </div>
            </div>
          </aside>
        )}

        <div className="flex-1 min-w-0">
          <div className={`sticky top-0 z-10 backdrop-blur border-b p-4 ${dark ? 'bg-gray-950/95 border-gray-800' : 'bg-gray-50/95 border-gray-200'}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Find your next event</h1>
                <p className={`text-sm mt-1 ${muted}`}>
                  Browse fairs, car shows, festivals &amp; markets — add good fits to your pipeline
                </p>
              </div>
              {!showFilters && (
                <button
                  type="button"
                  onClick={() => setShowFilters(true)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm shrink-0 ${dark ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <Filter className="h-4 w-4" /> Filters
                </button>
              )}
            </div>
            {message && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-sm font-medium">
                {message}
              </div>
            )}
          </div>

          <div className="p-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map(event => (
              <VendorPulseCard
                key={event.id}
                event={event}
                onApply={handleApply}
                applying={applyingId === event.id}
                inPipeline={pipelineIds.has(event.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
