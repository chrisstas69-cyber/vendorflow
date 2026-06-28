'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useDemoStore } from '@/contexts/demo-store-context';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { OrganizerPageHeader } from '@/components/organizer/organizer-page-header';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { getActiveOrganizerId } from '@/lib/pilot-config';
import { CATEGORY_LABELS } from '@/lib/platform-data';
import { Plus } from 'lucide-react';

export default function OrganizerEventsPage() {
  const { events, claimEvent } = useDemoStore();
  const { card, muted, heading, btnPrimary } = useOrganizerTheme();
  const organizerId = getActiveOrganizerId();
  const myEvents = events.filter(e => e.organizerId === organizerId);
  const claimable = events.filter(e => e.isClaimable);

  return (
    <OrganizerLayout>
      <OrganizerPageHeader
        title="Events"
        description="Manage dates in your season — claim scraped listings or create new ones."
        actions={
          <Link href="/organizer/events/new" className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${btnPrimary}`}>
            <Plus className="h-4 w-4" /> Create event
          </Link>
        }
      />

      {claimable.length > 0 && (
        <div className="mb-8 p-4 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
          <h2 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">Claim scraped events</h2>
          <p className={`text-sm mb-3 ${muted}`}>
            These events were found online — claim them to manage vendor applications.
          </p>
          <div className="space-y-2">
            {claimable.map(event => (
              <div key={event.id} className={`flex justify-between items-center p-3 rounded-lg border ${card}`}>
                <div>
                  <div className={`font-medium ${heading}`}>{event.name}</div>
                  <div className={`text-xs ${muted}`}>
                    {event.city}, {event.state} · {new Date(event.date).toLocaleDateString()}
                  </div>
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
            className={`block rounded-xl border overflow-hidden transition-colors hover:border-teal-300 ${card}`}
          >
            <div className="flex gap-0 sm:flex-row flex-col">
              <div className="relative w-full sm:w-36 h-28 sm:h-auto shrink-0">
                <Image src={event.coverImageUrl} alt="" fill className="object-cover" sizes="144px" />
              </div>
              <div className="p-4 flex-1 flex justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-teal-600">{CATEGORY_LABELS[event.category]}</span>
                  <h2 className={`font-bold text-lg ${heading}`}>{event.name}</h2>
                  <p className={`text-sm mt-1 ${muted}`}>
                    {new Date(event.date).toLocaleDateString()} · {event.location}
                  </p>
                </div>
                <div className={`text-right text-sm shrink-0 ${muted}`}>
                  <div className={event.listingStatus === 'published' ? 'text-emerald-600 font-medium' : ''}>
                    {event.listingStatus}
                    {event.promotionTier !== 'none' && (
                      <span className="block text-amber-600 text-xs">{event.promotionTier}</span>
                    )}
                  </div>
                  <div>
                    {event.vendorSlotsFilled}/{event.vendorSlots} filled
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </OrganizerLayout>
  );
}
