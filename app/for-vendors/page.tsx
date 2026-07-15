'use client';

import Link from 'next/link';
import { PublicLayout } from '@/components/layout/public-layout';
import { SafeImageFrame } from '@/components/public/safe-image-frame';
import { STOCK } from '@/lib/event-images';
import { FoundersEditionBanner } from '@/components/founders/founders-banner';
import { Activity, Command, DollarSign, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

const FEATURES = [
  {
    icon: Activity,
    title: 'Event Pulse',
    desc: 'Alpha scores, ROI projections, and DUD risk on every fair.',
    href: '/pulse',
  },
  {
    icon: Shield,
    title: 'Intel',
    desc: 'Trust scores, vendor reports, and earnings benchmarks.',
    href: '/intelligence',
  },
  {
    icon: Command,
    title: 'Command Center',
    desc: 'Track SCRAPED → APPLIED → COI → PAID → BOOKED.',
    href: '/command',
  },
  {
    icon: DollarSign,
    title: 'Journal',
    desc: 'Import Square CSV, track margin, receipt vault.',
    href: '/journal',
  },
];

export default function ForVendorsPage() {
  return (
    <PublicLayout>
      <div className="relative overflow-hidden">
        <SafeImageFrame
          src={STOCK.toyBooth}
          alt="Vendor booth at street fair"
          height={280}
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10 pt-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-3 py-1 text-[11px] font-medium text-white/90 mb-4">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
            </span>
            Vendor tools
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight max-w-2xl">
            Built for street fair vendors
          </h1>
          <p className="mt-3 text-white/80 max-w-xl text-sm md:text-base leading-relaxed">
            Find S-tier events, track applications, and log profit — all in one OS.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <FoundersEditionBanner />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {FEATURES.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border vf-border vf-surface p-6 hover:border-orange-500/40 transition-all hover:-translate-y-0.5 animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600/10 text-orange-600 mb-4">
                <item.icon className="h-5 w-5" />
              </div>
              <h2 className="font-semibold text-lg vf-text mb-1.5">{item.title}</h2>
              <p className="text-sm vf-text-muted mb-3 leading-relaxed">{item.desc}</p>
              <span className="text-xs font-semibold text-orange-600 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Open <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>

        <div className="rounded-2xl border vf-border vf-bg-subtle p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold vf-text">Ready to book better booths?</h3>
            <ul className="mt-2 space-y-1">
              {['Passport profile once', 'One-click applications', 'ROI before you pay'].map(t => (
                <li key={t} className="flex items-center gap-1.5 text-xs vf-text-muted">
                  <CheckCircle2 size={12} className="text-orange-600" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Link
              href="/pulse"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-orange-600/20"
            >
              Open Vendor Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border vf-border vf-surface hover:vf-surface-2 vf-text font-semibold rounded-xl text-sm"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
