'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { EventListingCard } from '@/components/event-listing-card';
import { BROWSE_CATEGORIES, type BrowseCategoryId } from '@/lib/documents';
import type { EventListing } from '@/lib/marketplace';
import { Search } from 'lucide-react';

interface ExperienceTagOption {
  id: string;
  label: string;
  icon: string;
}

export interface DiscoverExploreProps {
  initialRegionSlug?: string;
  initialTownSlug?: string;
  initialState?: 'all' | 'NY' | 'NJ';
  pageTitle?: string;
  pageDescription?: string;
}

export function DiscoverExplore({
  initialRegionSlug,
  initialTownSlug,
  initialState = 'all',
  pageTitle = 'Discover Events',
  pageDescription,
}: DiscoverExploreProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<'all' | 'NY' | 'NJ'>(initialState);
  const [browseCategory, setBrowseCategory] = useState<BrowseCategoryId>('all');
  const [experienceTags, setExperienceTags] = useState<string[]>([]);
  const [tagOptions, setTagOptions] = useState<ExperienceTagOption[]>([]);
  const [listings, setListings] = useState<EventListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && BROWSE_CATEGORIES.some(c => c.id === cat)) {
      setBrowseCategory(cat as BrowseCategoryId);
    }
  }, [searchParams]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('view', 'discover');
      params.set('format', 'marketplace');
      if (query) params.set('q', query);
      if (state !== 'all') params.set('state', state);
      if (initialRegionSlug) params.set('regionSlug', initialRegionSlug);
      if (initialTownSlug) params.set('town', initialTownSlug);
      if (experienceTags.length) params.set('tags', experienceTags.join(','));

      const res = await fetch(`/api/events/list?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load events');

      setListings(data.listings || []);
      if (data.meta?.experienceTags) setTagOptions(data.meta.experienceTags);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [query, state, initialRegionSlug, initialTownSlug, experienceTags]);

  useEffect(() => {
    const t = setTimeout(fetchListings, 250);
    return () => clearTimeout(t);
  }, [fetchListings]);

  const toggleExperienceTag = (id: string) => {
    setExperienceTags(prev => (prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]));
  };

  const filtered = useMemo(() => {
    if (browseCategory === 'all') return listings;
    const map: Record<string, string[]> = {
      music: ['music', 'concert', 'live'],
      'car-show': ['car show', 'car'],
      festival: ['festival', 'fair', 'carnival'],
      'street-fair': ['street fair', 'street'],
      'food-truck': ['food', 'truck', 'culinary'],
      'school-fair': ['school', 'kids', 'family'],
      'farmers-market': ['market', 'farmers'],
      sports: ['sport'],
      holiday: ['holiday', 'firework'],
      'craft-fair': ['craft', 'artisan'],
      community: ['community'],
    };
    const keys = map[browseCategory] ?? [browseCategory.replace('-', ' ')];
    return listings.filter(l => {
      const hay = `${l.categoryLabel} ${l.tags.join(' ')} ${l.title}`.toLowerCase();
      return keys.some(k => hay.includes(k));
    });
  }, [listings, browseCategory]);

  const description =
    pageDescription ??
    `${filtered.length} events${initialTownSlug ? ` near ${initialTownSlug.replace(/-/g, ' ')}` : ''} in NY & NJ`;

  return (
    <div className="animate-fade-up">
      <h1 className="text-3xl font-bold vf-text tracking-tight mb-2">{pageTitle}</h1>
      <p className="vf-text-muted mb-6 text-sm">{description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {BROWSE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setBrowseCategory(cat.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              browseCategory === cat.id
                ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                : 'vf-surface vf-border vf-text-muted hover:border-orange-500/40 hover:vf-text'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {tagOptions.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider vf-text-subtle mb-2">
            Experience tags
          </p>
          <div className="flex flex-wrap gap-2">
            {tagOptions.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleExperienceTag(tag.id)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  experienceTags.includes(tag.id)
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'vf-surface vf-border vf-text-muted hover:border-indigo-400/50'
                }`}
              >
                <span>{tag.icon}</span>
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 vf-text-muted" />
          <input
            type="search"
            placeholder="Search events, cities, tags..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border vf-border vf-surface vf-text placeholder:vf-text-subtle focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50"
          />
        </div>
        <select
          value={state}
          onChange={e => setState(e.target.value as typeof state)}
          className="px-4 py-3 rounded-xl border vf-border vf-surface vf-text"
        >
          <option value="all">All states</option>
          <option value="NY">New York</option>
          <option value="NJ">New Jersey</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="vf-text-muted text-center py-12 text-sm">Searching events index…</p>
      ) : filtered.length === 0 ? (
        <p className="vf-text-muted text-center py-12 text-sm">No events match your filters.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(listing => (
            <EventListingCard key={`${listing.source}-${listing.id}`} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
