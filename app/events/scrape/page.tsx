'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';

interface ScrapeResult {
  source: string;
  found: number;
  new: number;
  error?: string;
}

export default function ScrapePage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ScrapeResult[] | null>(null);
  const [summary, setSummary] = useState<{ totalFound: number; totalNew: number } | null>(null);

  const runScrape = async (region?: string) => {
    setRunning(true);
    setResults(null);
    setSummary(null);
    try {
      const body = region ? { region } : {};
      const res = await fetch('/api/events/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResults(data.results || []);
      setSummary(data.summary || null);
    } catch (err) {
      setResults([{ source: 'error', found: 0, new: 0, error: String(err) }]);
    }
    setRunning(false);
  };

  return (
    <AppLayout title="RUN SCRAPE">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-sm text-text-secondary mb-6">
          Scrapes 28 NY/NJ sources into local database. Takes 2–5 minutes for full run.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => runScrape()}
            disabled={running}
            className="w-full bg-accent-primary hover:bg-accent-secondary disabled:opacity-50 text-black font-bold py-3 border-2 border-black"
          >
            {running ? 'Scraping all sources...' : 'Scrape All Sources (NY + NJ)'}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => runScrape('NY')} disabled={running} className="border-2 border-border-primary py-2 font-bold text-sm hover:border-accent-primary disabled:opacity-50">
              NY Only
            </button>
            <button type="button" onClick={() => runScrape('NJ')} disabled={running} className="border-2 border-border-primary py-2 font-bold text-sm hover:border-accent-primary disabled:opacity-50">
              NJ Only
            </button>
          </div>
        </div>

        {summary && (
          <div className="mt-8 border-2 border-border-primary bg-bg-secondary p-5">
            <h2 className="font-bold mb-3">Results</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-2xl font-bold text-accent-primary">{summary.totalFound}</div>
                <div className="text-sm text-text-secondary">Events Found</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{summary.totalNew}</div>
                <div className="text-sm text-text-secondary">New Events</div>
              </div>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto text-sm">
              {results?.map((r, i) => (
                <div key={i} className={`flex justify-between p-2 border border-border-primary ${r.error ? 'border-accent-tertiary' : ''}`}>
                  <span>{r.source}</span>
                  <span className="text-text-secondary">{r.found} found · {r.new} new</span>
                </div>
              ))}
            </div>
            <Link href="/" className="inline-block mt-4 text-accent-primary font-bold text-sm underline">
              View events in Event Pulse →
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
