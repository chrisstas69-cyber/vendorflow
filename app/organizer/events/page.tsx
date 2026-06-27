'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useDemoStore } from '@/contexts/demo-store-context';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { DEMO_ORGANIZER_ID, CATEGORY_LABELS } from '@/lib/platform-data';
import { Plus } from 'lucide-react';

export default function OrganizerEventsPage() {
  const { events, claimEvent } = useDemoStore();
  const myEvents = events.filter(e => e.organizerId === DEMO_ORGANIZER_ID);
  const claimable = events.filter(e => e.isClaimable);

  return (
    <OrganizerLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Events</h1>
        <Link
          href="/organizer/events/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm"
        >
          <Plus className="h-4 w-4" /> Create
        </Link>
      </div>

      {claimable.length > 0 && (
        <div className="mb-8 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <h2 className="font-semibold text-amber-900 mb-2">Claim scraped events</h2>
          <p className="text-sm text-amber-800 mb-3">These events were found online — claim them to manage vendor applications.</p>
          <div className="space-y-2">
            {claimable.map(event => (
              <div key={event.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-amber-100">
                <div>
                  <div className="font-medium">{event.name}</div>
                  <div className="text-xs text-gray-500">{event.city}, {event.state} · {new Date(event.date).toLocaleDateString()}</div>
                </div>
                <button
                  type="button"
                  onClick={() => claimEvent(event.id)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg"
                >
                  Claim
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {myEvents.map(event => (
          <Link
            key={event.id}
            href={`/organizer/events/${event.id}`}
            className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-indigo-300 overflow-hidden transition-colors"
          >
            <div className="flex gap-0 sm:flex-row flex-col">
              <div className="relative w-full sm:w-36 h-28 sm:h-auto shrink-0">
                <Image src={event.coverImageUrl} alt="" fill className="object-cover" sizes="144px" />
              </div>
              <div className="p-4 flex-1 flex justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-indigo-600">{CATEGORY_LABELS[event.category]}</span>
                  <h2 className="font-bold text-lg">{event.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(event.date).toLocaleDateString()} · {event.location}
                  </p>
                </div>
                <div className="text-right text-sm shrink-0">
                  <div className={`font-medium ${event.listingStatus === 'published' ? 'text-green-600' : 'text-gray-400'}`}>
                    {event.listingStatus}
                    {event.promotionTier !== 'none' && (
                      <span className="block text-amber-600 text-xs">{event.promotionTier}</span>
                    )}
                  </div>
                  <div className="text-gray-500">{event.vendorSlotsFilled}/{event.vendorSlots} filled</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </OrganizerLayout>
  );
}
