'use client';

import { useState } from 'react';
import Link from 'next/link';

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
  const [syncing, setSyncing] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [emailMsg, setEmailMsg] = useState('');

  const runScrape = async (region?: string) => {
    setRunning(true);
    setResults(null);
    setSummary(null);
    try {
      const body = region ? { region } : {};
      const res = await fetch('/api/events/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      setResults(data.results || []);
      setSummary(data.summary || null);
    } catch (err) {
      setResults([{ source: 'error', found: 0, new: 0, error: String(err) }]);
    }
    setRunning(false);
  };

  const syncSheets = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await fetch('/api/events/sheets-sync', { method: 'POST' });
      const data = await res.json();
      setSyncMsg(data.success ? `Synced! ${data.tabsUpdated} tabs updated.` : data.error);
    } catch (err) {
      setSyncMsg(String(err));
    }
    setSyncing(false);
  };

  const sendEmail = async () => {
    setEmailing(true);
    setEmailMsg('');
    try {
      const res = await fetch('/api/email/send', { method: 'POST' });
      const data = await res.json();
      setEmailMsg(data.success ? `Email sent! ${data.newEvents} new events in digest.` : data.error);
    } catch (err) {
      setEmailMsg(String(err));
    }
    setEmailing(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/events" className="text-blue-400 text-sm hover:underline">&larr; Dashboard</Link>
        <h1 className="text-2xl font-bold mt-2 mb-6">Run Scrape</h1>

        <div className="space-y-4">
          <button
            onClick={() => runScrape()}
            disabled={running}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {running ? 'Scraping all sources...' : 'Scrape All Sources (NY + NJ)'}
          </button>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => runScrape('NY')}
              disabled={running}
              className="bg-blue-800 hover:bg-blue-900 disabled:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              {running ? 'Scraping...' : 'Scrape NY Only'}
            </button>
            <button
              onClick={() => runScrape('NJ')}
              disabled={running}
              className="bg-red-800 hover:bg-red-900 disabled:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              {running ? 'Scraping...' : 'Scrape NJ Only'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={syncSheets}
              disabled={syncing}
              className="bg-green-700 hover:bg-green-800 disabled:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              {syncing ? 'Syncing...' : 'Sync to Google Sheets'}
            </button>
            <button
              onClick={sendEmail}
              disabled={emailing}
              className="bg-purple-700 hover:bg-purple-800 disabled:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              {emailing ? 'Sending...' : 'Send Email Digest'}
            </button>
          </div>

          {syncMsg && <div className="text-sm text-green-400 bg-green-900/20 p-3 rounded-lg">{syncMsg}</div>}
          {emailMsg && <div className="text-sm text-purple-400 bg-purple-900/20 p-3 rounded-lg">{emailMsg}</div>}
        </div>

        {summary && (
          <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="font-semibold mb-3">Scrape Results</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{summary.totalFound}</div>
                <div className="text-sm text-gray-400">Events Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{summary.totalNew}</div>
                <div className="text-sm text-gray-400">New Events</div>
              </div>
            </div>

            <div className="space-y-2">
              {results?.map((r, i) => (
                <div key={i} className={`flex justify-between items-center p-3 rounded-lg text-sm ${r.error ? 'bg-red-900/20 border border-red-900/50' : 'bg-gray-800/50'}`}>
                  <span className="font-medium">{r.source}</span>
                  <div className="flex gap-4 text-gray-400">
                    <span>{r.found} found</span>
                    <span className="text-green-400">{r.new} new</span>
                    {r.error && <span className="text-red-400 text-xs">{r.error}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
