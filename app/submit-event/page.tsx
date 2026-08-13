'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Send } from 'lucide-react';
import { PublicLayout } from '@/components/layout/public-layout';

const input = 'mt-1 w-full rounded-lg border vf-border vf-surface px-3 py-2.5 text-sm vf-text';
export default function SubmitEventPage() {
  const [result, setResult] = useState<{ message: string; devLink?: string; duplicate?: { name: string; href: string } | null } | null>(null);
  const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch('/api/events/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, boothFee: data.boothFee ? Number(data.boothFee) : undefined }) });
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      if (!res.ok) return setResult({ message: json.error ?? 'Submission failed.' });
      setResult(json);
    } catch {
      setResult({ message: 'Submission is temporarily unavailable. Please try again.' });
    } finally {
      setLoading(false);
    }
  }
  return <PublicLayout><div className="mx-auto max-w-3xl px-4 py-10">
    <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Free community listing</p>
    <h1 className="mt-1 text-3xl font-bold vf-text">Submit an event</h1>
    <p className="mt-2 vf-text-muted">No paid organizer account is required. Verify your email, then VendorFlow reviews the listing before it goes live.</p>
    {result ? <div className="mt-7 rounded-2xl border vf-border vf-surface p-6"><CheckCircle2 className="h-8 w-8 text-emerald-600" /><h2 className="mt-3 text-lg font-semibold vf-text">Submission received</h2><p className="mt-1 text-sm vf-text-muted">{result.message}</p>{result.duplicate && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Possible duplicate: <Link className="font-semibold underline" href={result.duplicate.href}>{result.duplicate.name}</Link>. We’ll review before publishing another listing.</p>}{result.devLink && <a href={result.devLink} className="mt-4 inline-block rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">Verify locally</a>}</div> :
    <form onSubmit={submit} className="mt-7 space-y-6 rounded-2xl border vf-border vf-surface p-5 md:p-7">
      <section><h2 className="font-semibold vf-text">Event details</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2 text-sm vf-text-muted">Event name<input name="name" required className={input} /></label>
        <label className="text-sm vf-text-muted">Start date<input name="startDate" type="date" required className={input} /></label><label className="text-sm vf-text-muted">End date (optional)<input name="endDate" type="date" className={input} /></label>
        <label className="text-sm vf-text-muted">Time<input name="timeLabel" placeholder="10:00 AM – 6:00 PM" className={input} /></label><label className="text-sm vf-text-muted">Category<select name="category" className={input}><option value="street-fair">Street fair</option><option value="farmers-market">Farmers market</option><option value="festival">Festival</option><option value="car-show">Car show</option><option value="school-fair">School fair</option><option value="community">Community event</option></select></label>
        <label className="sm:col-span-2 text-sm vf-text-muted">Description<textarea name="description" required rows={4} className={input} /></label>
      </div></section>
      <section><h2 className="font-semibold vf-text">Location</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2 text-sm vf-text-muted">Venue name<input name="venueName" required className={input} /></label><label className="sm:col-span-2 text-sm vf-text-muted">Street address<input name="streetAddress" className={input} /></label><label className="text-sm vf-text-muted">City<input name="city" required className={input} /></label><label className="text-sm vf-text-muted">State<select name="state" className={input}><option value="NY">New York</option><option value="NJ">New Jersey</option></select></label></div></section>
      <section><h2 className="font-semibold vf-text">Organizer and source</h2><p className="mt-1 text-xs vf-text-muted">The original link lets us verify the event and properly attribute the source.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm vf-text-muted">Organizer name<input name="organizerName" required className={input} /></label><label className="text-sm vf-text-muted">Contact email<input name="email" type="email" required className={input} /></label><label className="sm:col-span-2 text-sm vf-text-muted">Original event URL<input name="sourceUrl" type="url" required placeholder="https://…" className={input} /></label></div></section>
      <section><h2 className="font-semibold vf-text">Vendor opportunity (optional)</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2 text-sm vf-text-muted">Vendor application URL<input name="vendorApplicationUrl" type="url" className={input} /></label><label className="text-sm vf-text-muted">Vendor deadline<input name="vendorDeadline" type="date" className={input} /></label><label className="text-sm vf-text-muted">Booth fee ($)<input name="boothFee" type="number" min="0" className={input} /></label><label className="sm:col-span-2 text-sm vf-text-muted">Vendor requirements<textarea name="vendorDetails" rows={3} placeholder="Food permits, electricity, booth sizes, category limits…" className={input} /></label></div></section>
      <button disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white disabled:opacity-50"><Send className="h-4 w-4" /> {loading ? 'Submitting…' : 'Submit free listing'}</button>
    </form>}
  </div></PublicLayout>;
}
