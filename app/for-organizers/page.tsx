'use client';

import Link from 'next/link';
import { PublicLayout } from '@/components/layout/public-layout';
import { SafeImageFrame } from '@/components/public/safe-image-frame';
import { STOCK } from '@/lib/event-images';
import { BarChart3, FileText, Megaphone, Users, ArrowRight } from 'lucide-react';

export default function ForOrganizersPage() {
  return (
    <PublicLayout>
      <div
        className="relative mb-8 overflow-hidden"
        style={{ position: 'relative', width: '100%', overflow: 'hidden' }}
      >
        <SafeImageFrame src={STOCK.aerialFair} alt="Aerial view of street fair crowd" height={256} priority sizes="100vw" />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 pointer-events-none"
          style={{ position: 'absolute', inset: 0 }}
        />
        <div
          className="absolute bottom-6 left-0 right-0 max-w-4xl mx-auto px-4"
          style={{ position: 'absolute', bottom: 24, left: 0, right: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white">List once. Reach vendors &amp; families.</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-12">
        <p className="text-xl public-muted mb-10">
          Upload crowd photos, promote to the top banner, and manage vendor applications.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {[
            { icon: Megaphone, title: 'Free marketing + paid spotlight', desc: 'Featured row and top banner slots for maximum visibility.' },
            { icon: FileText, title: 'Application inbox', desc: 'Review vendor apps, approve or reject, track COI and payments.' },
            { icon: Users, title: 'Vendor network', desc: 'Toy vendors, food trucks, and artisans actively browsing fairs.' },
            { icon: BarChart3, title: 'Event analytics', desc: 'Page views, applications, and booth fill rate at a glance.' },
          ].map(item => (
            <div key={item.title} className="p-6 rounded-2xl border public-card">
              <item.icon className="h-8 w-8 text-indigo-500 mb-3" />
              <h2 className="font-bold text-lg public-heading mb-2">{item.title}</h2>
              <p className="text-sm public-muted">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/organizer/events/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
          >
            Create Your Event
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/organizer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border public-card font-semibold rounded-xl public-heading"
          >
            Organizer Dashboard
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
