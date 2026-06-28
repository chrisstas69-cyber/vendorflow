'use client';

import Link from 'next/link';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { OrganizerPageHeader } from '@/components/organizer/organizer-page-header';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { usePilotConfig } from '@/hooks/use-pilot-config';
import { TrustGalleryEditor } from '@/components/gallery/trust-gallery-editor';
import { useGallery } from '@/hooks/use-gallery';
import { BarChart3, MessageSquare, FlaskConical, ExternalLink, BookUser } from 'lucide-react';

export default function OrganizerSettingsPage() {
  const { surface, muted, heading, btnSecondary, btnPrimary } = useOrganizerTheme();
  const { organizer, dataSource } = usePilotConfig();
  const { items, loading, refresh } = useGallery('organizer', organizer.id);

  const links = [
    {
      href: '/organizer/contacts',
      icon: BookUser,
      title: 'Contact intelligence',
      description: 'Private directory of chambers, agencies, and event-day contacts for Long Island.',
    },
    {
      href: '/organizer/assistant',
      icon: MessageSquare,
      title: 'Organizer Assistant',
      description: 'AI help with call sheets, vendor matching, and permit deadlines.',
    },
    {
      href: '/organizer/founder',
      icon: BarChart3,
      title: 'Founder metrics',
      description: 'Internal pilot traction dashboard — organizers, vendors, applications.',
    },
    {
      href: '/pricing',
      icon: FlaskConical,
      title: 'Plan & pricing',
      description: 'Founders Edition and Pro tier scaffolding.',
    },
  ];

  return (
    <OrganizerLayout showBanners={false}>
      <OrganizerPageHeader
        title="Settings"
        description="Pilot configuration, assistant, and internal tools."
      />

      <div className={`rounded-2xl p-5 mb-6 ${surface}`}>
        <h3 className={`font-semibold mb-2 ${heading}`}>Pilot organizer</h3>
        <dl className={`text-sm space-y-1 ${muted}`}>
          <div>
            <span className="font-medium text-stone-700 dark:text-stone-300">Organization:</span>{' '}
            {organizer.organization}
          </div>
          <div>
            <span className="font-medium text-stone-700 dark:text-stone-300">Season:</span>{' '}
            {organizer.seasonLabel}
          </div>
          <div>
            <span className="font-medium text-stone-700 dark:text-stone-300">Data source:</span>{' '}
            {dataSource}
          </div>
          <div>
            <span className="font-medium text-stone-700 dark:text-stone-300">Region:</span>{' '}
            {organizer.region}
          </div>
        </dl>
      </div>

      <div className={`rounded-2xl p-5 mb-6 ${surface}`}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className={`font-semibold ${heading}`}>Organizer proof gallery</h3>
            <p className={`text-sm mt-1 ${muted}`}>
              Past event photos build vendor trust before they apply.
            </p>
          </div>
          <Link
            href="/organizers/hempstead-chamber"
            target="_blank"
            className={`inline-flex items-center gap-1 text-sm ${btnSecondary} px-3 py-2 rounded-lg`}
          >
            <ExternalLink className="h-4 w-4" /> Public profile
          </Link>
        </div>
        <TrustGalleryEditor
          entityType="organizer"
          entityId={organizer.id}
          items={items}
          loading={loading}
          onRefresh={refresh}
          surfaceClass={`rounded-xl p-4 ring-1 ring-stone-200/80 dark:ring-stone-700 bg-stone-50/50`}
          inputClass={`w-full text-sm rounded-lg border px-3 py-2 ${btnSecondary}`}
          mutedClass={muted}
          headingClass={`font-semibold ${heading}`}
          btnPrimaryClass={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${btnPrimary}`}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {links.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-2xl p-5 transition-shadow hover:shadow-md ${surface}`}
          >
            <item.icon className="h-6 w-6 text-teal-600 mb-3" />
            <h3 className={`font-semibold ${heading}`}>{item.title}</h3>
            <p className={`text-sm mt-1 ${muted}`}>{item.description}</p>
          </Link>
        ))}
      </div>

      <p className={`text-xs mt-8 ${muted}`}>
        Set <code className="px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800">PILOT_DATA_SOURCE=db</code>{' '}
        in .env.local to use Prisma-backed workflow data.
      </p>
    </OrganizerLayout>
  );
}
