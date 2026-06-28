'use client';

import Link from 'next/link';
import { AlertCircle, FileWarning, MapPin, CreditCard } from 'lucide-react';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import type { OrganizerApplicationInboxItem } from '@/lib/organizer-schema';

export function AttentionSummary({
  items,
  displayCounts,
}: {
  items: OrganizerApplicationInboxItem[];
  displayCounts?: Record<string, number>;
}) {
  const { surface, muted, heading } = useOrganizerTheme();

  const pendingReview = items.filter(
    i => i.status === 'pending' && (i.displayStage === 'applied' || i.displayStage === 'docs')
  ).length;
  const missingDocs = items.filter(i => i.missingDocTypes.length > 0).length;
  const needsBooth = displayCounts?.approved ?? items.filter(i => i.displayStage === 'approved').length;
  const unpaid = items.filter(i => i.paymentStatus === 'invoiced' || i.paymentStatus === 'partial').length;

  const chips = [
    {
      label: `${pendingReview} need review`,
      href: '/organizer/applications',
      icon: AlertCircle,
      show: pendingReview > 0,
      tone: 'text-amber-700 bg-amber-50',
    },
    {
      label: `${missingDocs} missing docs`,
      href: '/organizer/compliance',
      icon: FileWarning,
      show: missingDocs > 0,
      tone: 'text-red-700 bg-red-50',
    },
    {
      label: `${needsBooth} awaiting booth`,
      href: '/organizer/booths',
      icon: MapPin,
      show: needsBooth > 0,
      tone: 'text-teal-700 bg-teal-50',
    },
    {
      label: `${unpaid} payments due`,
      href: '/organizer/invoicing',
      icon: CreditCard,
      show: unpaid > 0,
      tone: 'text-stone-700 bg-stone-100',
    },
  ].filter(c => c.show);

  if (chips.length === 0) {
    return (
      <div className={`rounded-2xl px-4 py-3 ${surface}`}>
        <p className={`text-sm ${muted}`}>All clear — no urgent items need attention.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-4 ${surface}`}>
      <h2 className={`text-sm font-semibold mb-3 ${heading}`}>Needs attention</h2>
      <div className="flex flex-wrap gap-2">
        {chips.map(chip => (
          <Link
            key={chip.label}
            href={chip.href}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold hover:opacity-90 ${chip.tone}`}
          >
            <chip.icon className="h-3.5 w-3.5" />
            {chip.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
