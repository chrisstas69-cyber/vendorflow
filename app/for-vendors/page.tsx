'use client';

import Link from 'next/link';
import { PublicLayout } from '@/components/layout/public-layout';
import { SafeImageFrame } from '@/components/public/safe-image-frame';
import { STOCK } from '@/lib/event-images';
import { Activity, Command, DollarSign, Shield, ArrowRight } from 'lucide-react';

export default function ForVendorsPage() {
  return (
    <PublicLayout>
      <div
        className="relative mb-8 overflow-hidden"
        style={{ position: 'relative', width: '100%', overflow: 'hidden' }}
      >
        <SafeImageFrame src={STOCK.toyBooth} alt="Vendor booth at street fair" height={256} priority sizes="100vw" />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 pointer-events-none"
          style={{ position: 'absolute', inset: 0 }}
        />
        <div
          className="absolute bottom-6 left-0 right-0 max-w-4xl mx-auto px-4"
          style={{ position: 'absolute', bottom: 24, left: 0, right: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white">Built for street fair vendors</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-12">
        <p className="text-xl public-muted mb-10">
          Find S-tier events, track applications, and log profit — all in one OS.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {[
            { icon: Activity, title: 'Event Pulse', desc: 'Alpha scores, ROI projections, and DUD risk on every fair.', href: '/pulse' },
            { icon: Shield, title: 'Intel', desc: 'Trust scores, vendor reports, and earnings benchmarks.', href: '/intelligence' },
            { icon: Command, title: 'Command Center', desc: 'Track SCRAPED → APPLIED → COI → PAID → BOOKED.', href: '/command' },
            { icon: DollarSign, title: 'Journal', desc: 'Import Square CSV, track margin, receipt vault.', href: '/journal' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="p-6 rounded-2xl border public-card hover:border-amber-400/50 transition-all group"
            >
              <item.icon className="h-8 w-8 text-amber-500 mb-3" />
              <h2 className="font-bold text-lg public-heading mb-2">{item.title}</h2>
              <p className="text-sm public-muted mb-3">{item.desc}</p>
              <span className="text-sm font-semibold text-amber-600 group-hover:underline flex items-center gap-1">
                Open <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>

        <Link
          href="/pulse"
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold rounded-xl"
        >
          Open Vendor Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </PublicLayout>
  );
}
