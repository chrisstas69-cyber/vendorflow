'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { VendorPulseCard } from '@/components/vendor/vendor-pulse-card';
import { OnboardingChecklist } from '@/components/vendor/onboarding-checklist';
import { VendorEmptyState } from '@/components/vendor/vendor-empty-state';
import { useDemoStore } from '@/contexts/demo-store-context';
import { useVendorPassport } from '@/contexts/vendor-passport-context';
import { useVendorApplications } from '@/contexts/vendor-applications-context';
import { submitVendorApplicationToOrganizer } from '@/lib/vendor-apply-api';
import { getInterestCounts, seedInterestCount } from '@/lib/event-interest';
import type { AlphaTier } from '@/lib/mock-data';
import { CATEGORY_LABELS, type EventCategory } from '@/lib/platform-data';
import { Filter, Heart, Search, X } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';

export default function EventPulsePage() {
  const { publishedEvents } = useDemoStore();
  const { passport } = useVendorPassport();
  const { applications, refresh, getPublicStatus } = useVendorApplications();
  const { mode } = useTheme();
  const dark = mode === 'night';
  const sidebar = dark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white';
  const muted = dark ? 'text-gray-400' : 'text-gray-500';
  const pipelineIds = useMemo(
    () => new Set(applications.map(a => a.eventId).filter(Boolean)),
    [applications]
  );

  const [interestTick, setInterestTick] = useState(0);
  const appliedDemand = useMemo(() => {
    void interestTick;
    const rows = applications
      .map(a => {
        const event = publishedEvents.find(e => e.id === a.eventId);
        if (!event) return null;
        seedInterestCount(event.id, event.saves);
        const counts = getInterestCounts(event.id);
        return {
          eventId: event.id,
          name: event.name,
          total: counts.saves + counts.rsvps,
          saves: counts.saves,
          rsvps: counts.rsvps,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null && r.total > 0)
      .sort((a, b) => b.total - a.total);
    const totalPeople = rows.reduce((sum, r) => sum + r.total, 0);
    return { rows, totalPeople };
  }, [applications, publishedEvents, interestTick]);

  useEffect(() => {
    const t = setInterval(() => setInterestTick(n => n + 1), 2000);
    return () => clearInterval(t);
  }, []);

  const [showFilters, setShowFilters] = useState(true);
  const [selectedTiers, setSelectedTiers] = useState<AlphaTier[]>(['S', 'A', 'B', 'C']);
  const [category, setCategory] = useState<EventCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'roi' | 'family' | 'risk'>('roi');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const toggleTier = (tier: AlphaTier) => {
    setSelectedTiers(prev =>
      prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]
    );
  };

  const filteredEvents = publishedEvents
    .filter(event => selectedTiers.includes(event.tier))
    .filter(event => category === 'all' || event.category === category)
    .filter(event => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        event.name.toLowerCase().includes(q) ||
        event.city.toLowerCase().includes(q) ||
        event.tags.some(t => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'roi') return b.roiMax - a.roiMax;
      if (sortBy === 'family') return b.familyDensity - a.familyDensity;
      return a.dudRisk - b.dudRisk;
    });

  const handleApply = async (event: (typeof publishedEvents)[0]) => {
    if (pipelineIds.has(event.id)) return;
    setApplyingId(event.id);
    setMessage(null);
    try {
      const result = await submitVendorApplicationToOrganizer(event, {
        vendorEmail: passport.vendorEmail,
        vendorName: passport.businessName || passport.contactName || 'Vendor',
        category: event.category,
        message: `Interested in ${event.name} via Event Pulse`,
        hasInsurance: passport.documents.some(d => d.type === 'coi'),
        setupPhotoUrl: passport.setupPhotoUrl,
      });
      setMessage({ text: result.message, ok: result.ok });
      if (result.ok) await refresh();
    } catch {
      setMessage({ text: 'Network error — try again', ok: false });
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <AppLayout>
      <OnboardingChecklist />
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
              <div className={`text-xs font-medium mb-2 ${muted}`}>Search</div>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${muted}`} />
                <input
                  type="search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Name, city, tag…"
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                />
              </div>
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
              <div className={`text-xs font-medium mb-2 ${muted}`}>Quality tier</div>
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
                    <span className={`ml-auto text-xs ${muted}`}>
                      {publishedEvents.filter(e => e.tier === tier).length}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <div className={`text-xs font-medium mb-2 ${muted}`}>Sort by</div>
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
              <div className={`text-xs ${muted}`}>
                {pipelineIds.size} application{pipelineIds.size === 1 ? '' : 's'} submitted
              </div>
            </div>

            {appliedDemand.totalPeople > 0 && (
              <div className="mt-4 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/80 dark:bg-orange-950/20 p-3 text-sm">
                <div className="font-semibold mb-1 flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-orange-600" />
                  Demand on your apps
                </div>
                <p className={`text-xs mb-2 ${muted}`}>
                  {appliedDemand.totalPeople} people interested across events you applied to
                </p>
                <ul className="space-y-1.5">
                  {appliedDemand.rows.slice(0, 4).map(row => (
                    <li key={row.eventId}>
                      <Link
                        href={`/events/${row.eventId}`}
                        className="flex justify-between gap-2 text-xs hover:underline"
                      >
                        <span className="truncate">{row.name}</span>
                        <span className="tabular-nums text-orange-600 font-semibold shrink-0">
                          {row.total}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        )}

        <div className="flex-1 min-w-0">
          <div className={`sticky top-0 z-10 backdrop-blur border-b p-4 ${dark ? 'bg-gray-950/95 border-gray-800' : 'bg-gray-50/95 border-gray-200'}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Find your next event</h1>
                <p className={`text-sm mt-1 ${muted}`}>
                  Apply directly — submissions land in the organizer inbox
                  {appliedDemand.totalPeople > 0 && (
                    <>
                      {' '}
                      ·{' '}
                      <span className="text-orange-600 font-medium tabular-nums">
                        {appliedDemand.totalPeople} interested
                      </span>{' '}
                      on your pipeline
                    </>
                  )}
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
              <div
                className={`mt-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  message.ok
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                }`}
              >
                {message.text}
              </div>
            )}
          </div>

          {filteredEvents.length === 0 ? (
            <div className="p-4">
              <VendorEmptyState
                icon={Search}
                title="No events match your filters"
                description="Try clearing search, widening tier filters, or switching event type."
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setCategory('all');
                      setSelectedTiers(['S', 'A', 'B', 'C']);
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-500 text-gray-900 text-sm font-semibold hover:bg-amber-600"
                  >
                    Reset filters
                  </button>
                }
              />
            </div>
          ) : (
            <div className="p-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map(event => (
                <VendorPulseCard
                  key={event.id}
                  event={event}
                  onApply={handleApply}
                  applying={applyingId === event.id}
                  inPipeline={pipelineIds.has(event.id)}
                  applicationStatus={getPublicStatus(event.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
