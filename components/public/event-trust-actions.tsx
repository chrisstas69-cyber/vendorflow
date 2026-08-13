'use client';

import { FormEvent, useEffect, useState } from 'react';

export function EventTrustActions({ slug, eventId, claimable }: { slug?: string; eventId?: string; claimable: boolean }) {
  const [mode, setMode] = useState<'claim' | 'correction' | null>(null);
  const [message, setMessage] = useState('');
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    fetch(`/api/events/trust?eventId=${encodeURIComponent(eventId)}`)
      .then(response => response.json())
      .then(data => setClaimed(Boolean(data.claimed)))
      .catch(() => undefined);
  }, [eventId]);

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch('/api/events/trust', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, slug, eventId, type: mode }),
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) as { message?: string; error?: string } : {};
      setMessage(json.message ?? json.error ?? 'Unable to submit right now.');
      if (res.ok) setMode(null);
    } catch {
      setMessage('Unable to submit right now. Please try again.');
    }
  }

  return (
    <section className="mt-5">
      {claimed && <p className="mb-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Organizer verified</p>}
      <div className="flex flex-wrap gap-3 text-sm">
        {claimable && !claimed && <button onClick={() => setMode('claim')} className="font-semibold text-orange-600">Is this your event? Claim it</button>}
        <button onClick={() => setMode('correction')} className="font-semibold vf-text-muted">Report incorrect information</button>
      </div>
      {message && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
      {mode && <form onSubmit={send} className="mt-4 space-y-3 rounded-xl border vf-border vf-surface p-4">
        <h3 className="font-semibold vf-text">{mode === 'claim' ? 'Claim this event' : 'Report a correction'}</h3>
        <input name="email" type="email" required={mode === 'claim'} placeholder="Your email" className="w-full rounded-lg border vf-border px-3 py-2 text-sm" />
        {mode === 'claim' && <><input name="role" placeholder="Your role with the event" className="w-full rounded-lg border vf-border px-3 py-2 text-sm" /><input name="evidenceUrl" type="url" placeholder="Organizer website or proof URL" className="w-full rounded-lg border vf-border px-3 py-2 text-sm" /></>}
        <textarea name="message" required={mode === 'correction'} placeholder={mode === 'claim' ? 'Anything that helps us verify you' : 'What should be corrected?'} className="w-full rounded-lg border vf-border px-3 py-2 text-sm" />
        <div className="flex gap-2"><button className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">Submit</button><button type="button" onClick={() => setMode(null)} className="px-3 py-2 text-sm vf-text-muted">Cancel</button></div>
      </form>}
    </section>
  );
}
