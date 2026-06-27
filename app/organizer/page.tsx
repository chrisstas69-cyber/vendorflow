'use client';

import Link from 'next/link';
import { useDemoStore } from '@/contexts/demo-store-context';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { DEMO_ORGANIZER_ID } from '@/lib/platform-data';
import { Calendar, Eye, FileText, Plus, Users } from 'lucide-react';

export default function OrganizerDashboardPage() {
  const { events, submissions } = useDemoStore();
  const myEvents = events.filter(e => e.organizerId === DEMO_ORGANIZER_ID);
  const pendingApps = submissions.filter(s => s.status === 'pending');
  const totalViews = myEvents.reduce((s, e) => s + e.views, 0);

  return (
    <OrganizerLayout>
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-gray-600 text-sm mb-8">Welcome back — here&apos;s your event overview</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'My Events', value: myEvents.length, icon: Calendar },
          { label: 'Pending Apps', value: pendingApps.length, icon: FileText },
          { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye },
          { label: 'Vendor Slots', value: myEvents.reduce((s, e) => s + (e.vendorSlots - e.vendorSlotsFilled), 0), icon: Users },
        ].map(stat => (
          <div key={stat.label} className="p-4 rounded-xl bg-white border border-gray-200">
            <stat.icon className="h-5 w-5 text-indigo-600 mb-2" />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-8">
        <Link
          href="/organizer/events/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm"
        >
          <Plus className="h-4 w-4" /> Create Event
        </Link>
        <Link
          href="/organizer/applications"
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 font-semibold rounded-lg text-sm"
        >
          <FileText className="h-4 w-4" /> Review Applications ({pendingApps.length})
        </Link>
      </div>

      {pendingApps.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold mb-3">Needs your attention</h2>
          <div className="space-y-2">
            {pendingApps.slice(0, 3).map(sub => (
              <div key={sub.id} className="p-4 rounded-xl bg-white border border-amber-200 flex justify-between items-center gap-4">
                <div>
                  <div className="font-semibold">{sub.vendorName}</div>
                  <div className="text-sm text-gray-500">{sub.eventName} · {sub.category}</div>
                </div>
                <Link href="/organizer/applications" className="text-sm font-semibold text-indigo-600 hover:underline">
                  Review
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-bold mb-3">Your events</h2>
      <div className="space-y-3">
        {myEvents.length === 0 ? (
          <p className="text-gray-500 text-sm">No events yet. <Link href="/organizer/events/new" className="text-indigo-600 underline">Create one</Link></p>
        ) : (
          myEvents.map(event => (
            <Link
              key={event.id}
              href={`/organizer/events/${event.id}`}
              className="block p-4 rounded-xl bg-white border border-gray-200 hover:border-indigo-300 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{event.name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(event.date).toLocaleDateString()} · {event.city}, {event.state}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium">{event.views} views</div>
                  <div className="text-gray-500">{event.vendorSlotsFilled}/{event.vendorSlots} vendors</div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </OrganizerLayout>
  );
}
