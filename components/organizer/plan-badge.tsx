'use client';

import Link from 'next/link';
import { PRICING_TIERS } from '@/lib/pricing-tiers';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';

export function OrganizerPlanBadge() {
  const { card, muted } = useOrganizerTheme();
  const tier = PRICING_TIERS.find(t => t.id === 'org-founders');

  if (!tier) return null;

  return (
    <Link
      href="/pricing"
      className={`block rounded-lg border p-3 text-xs transition-colors hover:border-teal-400 ${card}`}
    >
      <div className="font-semibold text-teal-600">{tier.name}</div>
      <div className={`mt-0.5 ${muted}`}>{tier.priceLabel} · {tier.description.split('.')[0]}</div>
      <div className="mt-1 text-teal-600 font-medium">View plans →</div>
    </Link>
  );
}
