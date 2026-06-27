'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDemoStore } from '@/contexts/demo-store-context';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { CATEGORY_LABELS } from '@/lib/platform-data';
import { ExternalLink, Eye } from 'lucide-react';

export default function OrganizerEventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { getEvent, submissions } = useDemoStore();
  const event = getEvent(id);
  const eventSubs = submissions.filter(s => s.eventId === id);

  if (!event) {
    return (
      <OrganizerLayout>
        <p className="text-gray-500">Event not found.</p>
        <Link href="/organizer/events" className="text-indigo-600 underline text-sm">← Back</Link>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout>
      <Link href="/organizer/events" className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-block">
        ← All events
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-medium text-indigo-600">{CATEGORY_LABELS[event.category]}</span>
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <p className="text-gray-600 text-sm mt-1">
            {new Date(event.date).toLocaleDateString()} · {event.location}
          </p>
        </div>
        <Link
          href={`/events/${event.id}`}
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          <ExternalLink className="h-4 w-4" /> Public page
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-white border border-gray-200">
          <Eye className="h-5 w-5 text-indigo-600 mb-1" />
          <div className="text-2xl font-bold">{event.views}</div>
          <div className="text-xs text-gray-500">Page views</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-gray-200">
          <div className="text-2xl font-bold">{eventSubs.length}</div>
          <div className="text-xs text-gray-500">Applications</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-gray-200">
          <div className="text-2xl font-bold">{event.vendorSlotsFilled}/{event.vendorSlots}</div>
          <div className="text-xs text-gray-500">Booths filled</div>
        </div>
      </div>

      <h2 className="font-bold mb-3">Vendor applications</h2>
      {eventSubs.length === 0 ? (
        <p className="text-gray-500 text-sm">No applications yet. Share your public event page with vendors.</p>
      ) : (
        <div className="space-y-2">
          {eventSubs.map(sub => (
            <div key={sub.id} className="p-4 rounded-xl bg-white border border-gray-200 flex justify-between items-center">
              <div>
                <div className="font-semibold">{sub.vendorName}</div>
                <div className="text-sm text-gray-500">{sub.category}</div>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                sub.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                sub.status === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {sub.status}
              </span>
            </div>
          ))}
        </div>
      )}

      <Link href="/organizer/applications" className="inline-block mt-4 text-sm font-semibold text-indigo-600 hover:underline">
        Manage all applications →
      </Link>
    </OrganizerLayout>
  );
}
