'use client';

import { FormEvent, useState } from 'react';

export function VendorDigestSignup() {
  const [message, setMessage] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const response = await fetch('/api/vendor-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          regions: [data.region],
          categories: data.category ? [data.category] : [],
        }),
      });
      const text = await response.text();
      const json = text ? (JSON.parse(text) as { message?: string; error?: string }) : {};
      setMessage(json.message ?? json.error ?? 'Unable to subscribe right now.');
    } catch {
      setMessage('Unable to subscribe right now. Please try again.');
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border vf-border vf-surface p-5">
      <h3 className="font-semibold vf-text">Weekly vendor opportunities</h3>
      <p className="mt-1 text-sm vf-text-muted">New events accepting vendors, matched to your area.</p>
      <p className="mt-1 text-xs vf-text-subtle">Free weekly email. Unsubscribe any time.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_120px_150px_auto]">
        <input name="email" type="email" required placeholder="you@business.com" className="rounded-lg border vf-border px-3 py-2 text-sm" />
        <select name="region" className="rounded-lg border vf-border px-2 py-2 text-sm">
          <option value="NY">New York</option><option value="NJ">New Jersey</option>
        </select>
        <select name="category" className="rounded-lg border vf-border px-2 py-2 text-sm">
          <option value="">All categories</option><option value="street-fair">Street fairs</option><option value="farmers-market">Markets</option><option value="festival">Festivals</option><option value="car-show">Car shows</option>
        </select>
        <button className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">Subscribe</button>
      </div>
      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
    </form>
  );
}
