'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDemoStore } from '@/contexts/demo-store-context';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { OrganizerPageHeader } from '@/components/organizer/organizer-page-header';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { TrustGalleryEditor } from '@/components/gallery/trust-gallery-editor';
import { CATEGORY_LABELS } from '@/lib/platform-data';
import { useGallery } from '@/hooks/use-gallery';
import { ExternalLink, Eye } from 'lucide-react';

export default function OrganizerEventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { getEvent, submissions } = useDemoStore();
  const event = getEvent(id);
  const eventSubs = submissions.filter(s => s.eventId === id);
  const { surface, muted, heading, btnSecondary, btnPrimary } = useOrganizerTheme();
  const { items, loading, refresh } = useGallery('event', id);

  if (!event) {
    return (
      <OrganizerLayout>
        <p className="text-gray-500">Event not found.</p>
        <Link href="/organizer/events" className="text-indigo-600 underline text-sm">← Back</Link>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout showBanners={false}>
      <OrganizerPageHeader
        title={event.name}
        description={`${new Date(event.date).toLocaleDateString()} · ${event.location}`}
        actions={
          <Link
            href={`/events/${event.id}`}
            target="_blank"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${btnPrimary}`}
          >
            <ExternalLink className="h-4 w-4" /> Public page
          </Link>
        }
      />

      <p className={`text-xs font-medium mb-6 ${muted}`}>{CATEGORY_LABELS[event.category]}</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className={`p-4 rounded-2xl ${surface}`}>
          <Eye className="h-5 w-5 text-teal-600 mb-1" />
          <div className={`text-2xl font-bold ${heading}`}>{event.views}</div>
          <div className={`text-xs ${muted}`}>Page views</div>
        </div>
        <div className={`p-4 rounded-2xl ${surface}`}>
          <div className={`text-2xl font-bold ${heading}`}>{eventSubs.length}</div>
          <div className={`text-xs ${muted}`}>Applications</div>
        </div>
        <div className={`p-4 rounded-2xl ${surface}`}>
          <div className={`text-2xl font-bold ${heading}`}>
            {event.vendorSlotsFilled}/{event.vendorSlots}
          </div>
          <div className={`text-xs ${muted}`}>Booths filled</div>
        </div>
      </div>

      <div className={`rounded-2xl p-5 mb-8 ${surface}`}>
        <TrustGalleryEditor
          entityType="event"
          entityId={event.id}
          items={items}
          loading={loading}
          onRefresh={refresh}
          surfaceClass={`rounded-xl p-4 ring-1 ring-stone-200/80 dark:ring-stone-700 bg-stone-50/50 dark:bg-stone-900/50`}
          inputClass={`w-full text-sm rounded-lg border px-3 py-2 ${btnSecondary}`}
          mutedClass={muted}
          headingClass={`font-semibold ${heading}`}
          btnPrimaryClass={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${btnPrimary}`}
        />
      </div>

      <h2 className={`font-bold mb-3 ${heading}`}>Vendor applications</h2>
      {eventSubs.length === 0 ? (
        <p className={`text-sm ${muted}`}>
          No applications yet. Share your public event page — vendors trust events with real photos.
        </p>
      ) : (
        <div className="space-y-2">
          {eventSubs.map(sub => (
            <div key={sub.id} className={`p-4 rounded-2xl flex justify-between items-center ${surface}`}>
              <div>
                <div className={`font-semibold ${heading}`}>{sub.vendorName}</div>
                <div className={`text-sm ${muted}`}>{sub.category}</div>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  sub.status === 'pending'
                    ? 'bg-amber-100 text-amber-800'
                    : sub.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {sub.status}
              </span>
            </div>
          ))}
        </div>
      )}

      <Link href="/organizer/applications" className="inline-block mt-4 text-sm font-semibold text-teal-600 hover:underline">
        Manage all applications →
      </Link>
    </OrganizerLayout>
  );
}
