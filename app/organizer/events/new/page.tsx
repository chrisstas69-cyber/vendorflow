'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Eye, Save } from 'lucide-react';
import { useDemoStore } from '@/contexts/demo-store-context';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import type { EventCategory, PromotionTier } from '@/lib/platform-data';
import { CATEGORY_LABELS, DEMO_ORGANIZER_ID, mockEventSeries } from '@/lib/platform-data';
import { STOCK } from '@/lib/event-images';

const IMAGE_PRESETS = [
  { label: 'Street fair crowd', url: STOCK.streetFair },
  { label: 'Festival aerial', url: STOCK.aerialFair },
  { label: 'Vendor tents', url: STOCK.vendorTent },
  { label: 'Farmers market', url: STOCK.farmersMarket },
  { label: 'Beach festival', url: STOCK.beachFest },
];

const MY_SERIES = mockEventSeries.filter(s => s.organizerId === DEMO_ORGANIZER_ID);

export default function CreateEventPage() {
  const router = useRouter();
  const { createEvent } = useDemoStore();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '',
    date: '',
    time: '10:00 AM – 6:00 PM',
    location: '',
    city: '',
    state: 'NY',
    region: 'NY/NJ',
    description: '',
    category: 'street-fair' as EventCategory,
    audienceTags: 'Family, Outdoor',
    vendorSlots: 40,
    boothFee: 150,
    permitFee: 0,
    applicationDeadline: '',
    seriesId: '' as string,
    tier: 'B' as const,
    alphaScore: 70,
    familyDensity: 65,
    footTraffic: '3K-6K',
    roiMin: 400,
    roiMax: 1200,
    dudRisk: 20,
    tags: 'Local, Outdoor',
    organizerName: 'My Events Co.',
    listingStatus: 'published' as const,
    coverImageUrl: STOCK.streetFair as string,
    promotionTier: 'none' as PromotionTier,
  });

  useEffect(() => {
    const draft = window.localStorage.getItem('vendorflow:event-draft');
    if (!draft) return;
    try {
      setForm(current => ({ ...current, ...JSON.parse(draft) }));
    } catch {
      window.localStorage.removeItem('vendorflow:event-draft');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const event = createEvent({
      name: form.name,
      date: form.date,
      time: form.time,
      location: form.location,
      city: form.city,
      state: form.state,
      region: form.region,
      description: form.description,
      category: form.category,
      audienceTags: form.audienceTags.split(',').map(t => t.trim()).filter(Boolean),
      organizerId: DEMO_ORGANIZER_ID,
      organizerName: form.organizerName,
      seriesId: form.seriesId || undefined,
      listingStatus: form.listingStatus,
      vendorSlots: form.vendorSlots,
      applicationDeadline: form.applicationDeadline || undefined,
      isClaimable: false,
      tier: form.tier,
      alphaScore: form.alphaScore,
      familyDensity: form.familyDensity,
      footTraffic: form.footTraffic,
      boothFee: form.boothFee,
      permitFee: form.permitFee,
      roiMin: form.roiMin,
      roiMax: form.roiMax,
      dudRisk: form.dudRisk,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      coverImageUrl: form.coverImageUrl,
      galleryUrls: [form.coverImageUrl],
      promotionTier: form.promotionTier,
    });
    window.localStorage.removeItem('vendorflow:event-draft');
    router.push(`/organizer/events/${event.id}`);
  };

  const saveDraft = () => {
    window.localStorage.setItem('vendorflow:event-draft', JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const canContinue = [
    Boolean(form.name.trim() && form.date && form.location.trim() && form.city.trim()),
    form.vendorSlots > 0 && form.boothFee >= 0 && Boolean(form.applicationDeadline),
    Boolean(form.description.trim()),
    true,
  ][step];

  const steps = ['Event basics', 'Vendor setup', 'Listing details', 'Review'];

  const field = (label: string, children: React.ReactNode) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm';

  return (
    <OrganizerLayout>
      <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-teal-600">New event</p><h1 className="text-2xl font-bold">Create an event</h1><p className="mt-1 text-sm text-stone-500">Complete one short section at a time. Nothing publishes until the final step.</p></div>
        <button type="button" onClick={saveDraft} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold"><Save className="h-4 w-4" /> {saved ? 'Saved' : 'Save draft'}</button>
      </div>
      <ol className="mb-7 grid grid-cols-4 gap-2" aria-label="Event creation progress">
        {steps.map((label, index) => <li key={label} className="min-w-0"><div className={`h-1.5 rounded-full ${index <= step ? 'bg-teal-600' : 'bg-stone-200'}`} /><span className={`mt-2 hidden text-xs font-medium sm:block ${index === step ? 'text-teal-700' : 'text-stone-500'}`}>{index + 1}. {label}</span></li>)}
      </ol>
      <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:p-7">
        <div className="space-y-5">
        {step === 0 && <>
          <div><h2 className="text-lg font-semibold">Event basics</h2><p className="text-sm text-stone-500">Start with what attendees and vendors need to identify the event.</p></div>
        {field('Event name', (
          <input required autoFocus className={inputCls} placeholder="e.g. Hempstead Summer Street Fair" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        ))}
        {field('Date', (
          <input required type="date" className={inputCls} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        ))}
        {field('Time', (
          <input className={inputCls} value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
        ))}
        {field('Event series (optional)', (
          <select
            className={inputCls}
            value={form.seriesId}
            onChange={e => setForm({ ...form, seriesId: e.target.value })}
          >
            <option value="">Standalone event</option>
            {MY_SERIES.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.seasonLabel}
              </option>
            ))}
          </select>
        ))}
        {form.seriesId ? (
          <p className="text-xs text-gray-500 -mt-3">
            {MY_SERIES.find(s => s.id === form.seriesId)?.description}
          </p>
        ) : null}
        {field('Venue / address', (
          <input required className={inputCls} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
        ))}
        <div className="grid grid-cols-2 gap-4">
          {field('City', (
            <input required className={inputCls} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
          ))}
          {field('State', (
            <select className={inputCls} value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}>
              <option value="NY">NY</option>
              <option value="NJ">NJ</option>
            </select>
          ))}
        </div>
        {field('Category', (
          <select className={inputCls} value={form.category} onChange={e => setForm({ ...form, category: e.target.value as EventCategory })}>
            {(Object.keys(CATEGORY_LABELS) as EventCategory[]).map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        ))}
        </>}
        {step === 1 && <>
        <div><h2 className="text-lg font-semibold">Vendor setup</h2><p className="text-sm text-stone-500">Set capacity, pricing, and when applications close.</p></div>
        <div className="grid grid-cols-2 gap-4">
          {field('Vendor slots', (<input min={1} type="number" className={inputCls} value={form.vendorSlots} onChange={e => setForm({ ...form, vendorSlots: +e.target.value })} />))}
          {field('Booth fee ($)', (<input min={0} type="number" className={inputCls} value={form.boothFee} onChange={e => setForm({ ...form, boothFee: +e.target.value })} />))}
        </div>
        {field('Application deadline', (<input required type="date" className={inputCls} value={form.applicationDeadline} onChange={e => setForm({ ...form, applicationDeadline: e.target.value })} />))}
        <div className="rounded-xl bg-teal-50 p-4 text-sm text-teal-900"><strong>Next after publishing:</strong> choose which documents vendors must provide, then share the application link.</div>
        </>}
        {step === 2 && <>
        <div><h2 className="text-lg font-semibold">Public listing</h2><p className="text-sm text-stone-500">Describe the experience and choose the image people will see.</p></div>
        {field('Description', (
          <textarea required rows={4} className={inputCls} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        ))}
        {field('Audience tags (comma-separated)', (
          <input className={inputCls} placeholder="Family, Food, Free" value={form.audienceTags} onChange={e => setForm({ ...form, audienceTags: e.target.value })} />
        ))}
        {field('Cover photo', (
          <div className="space-y-2">
            <input
              className={inputCls}
              placeholder="Image URL"
              value={form.coverImageUrl}
              onChange={e => setForm({ ...form, coverImageUrl: e.target.value })}
            />
            <div className="flex flex-wrap gap-2">
              {IMAGE_PRESETS.map(p => (
                <button
                  key={p.url}
                  type="button"
                  onClick={() => setForm({ ...form, coverImageUrl: p.url })}
                  className={`text-xs px-2 py-1 rounded-lg border ${
                    form.coverImageUrl === p.url ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        {field('Listing placement', (
          <select
            className={inputCls}
            value={form.promotionTier}
            onChange={e => setForm({ ...form, promotionTier: e.target.value as PromotionTier })}
          >
            <option value="none">Standard listing</option>
            <option value="featured">Featured listing</option>
            <option value="spotlight">Homepage spotlight</option>
          </select>
        ))}
        </>}
        {step === 3 && <>
          <div><h2 className="flex items-center gap-2 text-lg font-semibold"><Eye className="h-5 w-5 text-teal-600" /> Review before publishing</h2><p className="text-sm text-stone-500">Confirm the details below. You can edit the event after publishing.</p></div>
          <div className="overflow-hidden rounded-xl border border-stone-200">
            <div className="bg-stone-50 px-4 py-3"><h3 className="font-semibold">{form.name || 'Untitled event'}</h3><p className="text-sm text-stone-500">{form.date || 'No date'} · {form.time}</p></div>
            <dl className="grid gap-4 p-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs uppercase tracking-wide text-stone-500">Location</dt><dd className="mt-1 font-medium">{form.location}, {form.city}, {form.state}</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-stone-500">Vendor applications</dt><dd className="mt-1 font-medium">{form.vendorSlots} spaces · ${form.boothFee} · closes {form.applicationDeadline}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs uppercase tracking-wide text-stone-500">Description</dt><dd className="mt-1 text-stone-700">{form.description}</dd></div>
            </dl>
          </div>
          <label className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-950"><input required type="checkbox" className="mt-1" /><span>I reviewed the date, location, fee, capacity, and application deadline.</span></label>
        </>}
        </div>
        <div className="mt-7 flex items-center justify-between border-t border-stone-200 pt-5">
          <button type="button" onClick={() => setStep(value => Math.max(0, value - 1))} disabled={step === 0} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 disabled:invisible"><ArrowLeft className="h-4 w-4" /> Back</button>
          {step < steps.length - 1 ? <button type="button" disabled={!canContinue} onClick={() => setStep(value => value + 1)} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Continue <ArrowRight className="h-4 w-4" /></button> : <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"><Check className="h-4 w-4" /> Publish event</button>}
        </div>
      </form>
      </div>
    </OrganizerLayout>
  );
}
