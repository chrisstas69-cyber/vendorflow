'use client';

import Link from 'next/link';
import { PublicLayout } from '@/components/layout/public-layout';
import { SafeImageFrame } from '@/components/public/safe-image-frame';
import { STOCK } from '@/lib/event-images';
import { BarChart3, FileText, Megaphone, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

const FEATURES = [
  {
    icon: Megaphone,
    title: 'Free marketing + paid spotlight',
    desc: 'Featured row and top banner slots for maximum visibility.',
    href: '/organizer/events',
  },
  {
    icon: FileText,
    title: 'Application inbox',
    desc: 'Drag vendors across your pipeline. Review docs, approve, assign booths.',
    href: '/organizer/applications',
  },
  {
    icon: Users,
    title: 'Vendor network',
    desc: 'Toy vendors, food trucks, and artisans actively browsing fairs.',
    href: '/organizer/vendors',
  },
  {
    icon: BarChart3,
    title: 'Event analytics',
    desc: 'Page views, applications, and booth fill rate at a glance.',
    href: '/organizer',
  },
];

export default function ForOrganizersPage() {
  return (
    <PublicLayout>
      <div className="relative overflow-hidden">
        <SafeImageFrame
          src={STOCK.aerialFair}
          alt="Aerial view of street fair crowd"
          height={280}
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10 pt-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-3 py-1 text-[11px] font-medium text-white/90 mb-4">
            Organizer hub
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight max-w-2xl">
            List once. Reach vendors &amp; families.
          </h1>
          <p className="mt-3 text-white/80 max-w-xl text-sm md:text-base leading-relaxed">
            Put your event in the public directory free. Upgrade only when you want promotion,
            vendor management, booth planning, and day-of operations.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {FEATURES.map((item, i) => (
            <a
              key={item.title}
              href={item.href}
              className="rounded-2xl border vf-border vf-surface p-6 hover:border-emerald-500/40 transition-all hover:-translate-y-0.5 animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700/10 text-emerald-700 mb-4">
                <item.icon className="h-5 w-5" />
              </div>
              <h2 className="font-semibold text-lg vf-text mb-1.5">{item.title}</h2>
              <p className="text-sm vf-text-muted leading-relaxed">{item.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Open tool <ArrowRight className="h-4 w-4" /></span>
            </a>
          ))}
        </div>

        <div className="rounded-2xl border vf-border vf-bg-subtle p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold vf-text">Start with a free event listing</h3>
            <ul className="mt-2 space-y-1">
              {['Free public page and organizer claim', 'Optional $49 event operations', 'Optional $79 event spotlight'].map(t => (
                <li key={t} className="flex items-center gap-1.5 text-xs vf-text-muted">
                  <CheckCircle2 size={12} className="text-emerald-700" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <a
              href="/organizer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-700/20"
            >
              Open Organizer Dashboard
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/submit-event"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border vf-border vf-surface hover:vf-surface-2 vf-text font-semibold rounded-xl text-sm"
            >
              Submit event free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border vf-border vf-surface hover:vf-surface-2 vf-text font-semibold rounded-xl text-sm"
            >
              Compare paid tools
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
