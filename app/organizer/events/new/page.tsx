'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoStore } from '@/contexts/demo-store-context';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import type { EventCategory, PromotionTier } from '@/lib/platform-data';
import { CATEGORY_LABELS } from '@/lib/platform-data';
import { STOCK } from '@/lib/event-images';

const IMAGE_PRESETS = [
  { label: 'Street fair crowd', url: STOCK.streetFair },
  { label: 'Festival aerial', url: STOCK.aerialFair },
  { label: 'Vendor tents', url: STOCK.vendorTent },
  { label: 'Farmers market', url: STOCK.farmersMarket },
  { label: 'Beach festival', url: STOCK.beachFest },
];

export default function CreateEventPage() {
  const router = useRouter();
  const { createEvent } = useDemoStore();
  const [form, setForm] = useState({
    name: '',
    date: '',
    time: '10:00 AM – 6:00 PM',
    location: '',
    city: '',
    state: 'NJ',
    region: 'NY/NJ',
    description: '',
    category: 'street-fair' as EventCategory,
    audienceTags: 'Family, Outdoor',
    vendorSlots: 40,
    boothFee: 150,
    permitFee: 0,
    applicationDeadline: '',
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
      organizerId: 'org-demo',
      organizerName: form.organizerName,
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
    router.push(`/organizer/events/${event.id}`);
  };

  const field = (label: string, children: React.ReactNode) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm';

  return (
    <OrganizerLayout>
      <h1 className="text-2xl font-bold mb-6">Create Event</h1>
      <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
        {field('Event name', (
          <input required className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        ))}
        {field('Date', (
          <input required type="date" className={inputCls} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        ))}
        {field('Time', (
          <input className={inputCls} value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
        ))}
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
        {field('Description', (
          <textarea required rows={4} className={inputCls} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        ))}
        {field('Audience tags (comma-separated)', (
          <input className={inputCls} placeholder="Family, Food, Free" value={form.audienceTags} onChange={e => setForm({ ...form, audienceTags: e.target.value })} />
        ))}
        <div className="grid grid-cols-2 gap-4">
          {field('Vendor slots', (
            <input type="number" className={inputCls} value={form.vendorSlots} onChange={e => setForm({ ...form, vendorSlots: +e.target.value })} />
          ))}
          {field('Booth fee ($)', (
            <input type="number" className={inputCls} value={form.boothFee} onChange={e => setForm({ ...form, boothFee: +e.target.value })} />
          ))}
        </div>
        {field('Application deadline', (
          <input type="date" className={inputCls} value={form.applicationDeadline} onChange={e => setForm({ ...form, applicationDeadline: e.target.value })} />
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

        {field('Promotion (demo)', (
          <select
            className={inputCls}
            value={form.promotionTier}
            onChange={e => setForm({ ...form, promotionTier: e.target.value as PromotionTier })}
          >
            <option value="none">Standard listing</option>
            <option value="featured">Featured row ($)</option>
            <option value="spotlight">Top banner spotlight ($$$)</option>
          </select>
        ))}

        <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg">
          Publish Event
        </button>
      </form>
    </OrganizerLayout>
  );
}
