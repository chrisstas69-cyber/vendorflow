'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDemoStore } from '@/contexts/demo-store-context';
import { PublicLayout } from '@/components/layout/public-layout';
import { PublicEventCard } from '@/components/public/event-card';
import { BROWSE_CATEGORIES, eventMatchesBrowseCategory, type BrowseCategoryId } from '@/lib/documents';
import { Search } from 'lucide-react';

function DiscoverContent() {
  const { publishedEvents } = useDemoStore();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<'all' | 'NY' | 'NJ'>('all');
  const [browseCategory, setBrowseCategory] = useState<BrowseCategoryId>('all');

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && BROWSE_CATEGORIES.some(c => c.id === cat)) {
      setBrowseCategory(cat as BrowseCategoryId);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    return publishedEvents.filter(e => {
      if (state !== 'all' && e.state !== state) return false;
      if (!eventMatchesBrowseCategory(e.category, e.audienceTags, browseCategory)) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          e.name.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q) ||
          e.audienceTags.some(t => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [publishedEvents, query, state, browseCategory]);

  return (
    <>
      <h1 className="text-3xl font-bold public-heading mb-2">Discover Events</h1>
      <p className="public-muted mb-6">{filtered.length} events in NY &amp; NJ</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {BROWSE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setBrowseCategory(cat.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              browseCategory === cat.id
                ? 'bg-amber-400 border-amber-400 text-gray-900'
                : 'public-card public-muted hover:border-amber-400/50'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 public-muted" />
          <input
            type="search"
            placeholder="Search events, cities, tags..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border public-input focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <select
          value={state}
          onChange={e => setState(e.target.value as typeof state)}
          className="px-4 py-3 rounded-xl border public-input"
        >
          <option value="all">All states</option>
          <option value="NY">New York</option>
          <option value="NJ">New Jersey</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="public-muted text-center py-12">No events match your filters.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(event => (
            <PublicEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </>
  );
}

export default function DiscoverPage() {
  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Suspense fallback={<p className="public-muted">Loading events…</p>}>
          <DiscoverContent />
        </Suspense>
      </div>
    </PublicLayout>
  );
}
