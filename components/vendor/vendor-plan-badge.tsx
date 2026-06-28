'use client';

import Link from 'next/link';
import { PRICING_TIERS } from '@/lib/pricing-tiers';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';

export function VendorPlanBadge() {
  const { card, muted } = useVendorTheme();
  const tier = PRICING_TIERS.find(t => t.id === 'vendor-free');

  if (!tier) return null;

  return (
    <Link
      href="/pricing"
      className={`block rounded-lg border p-3 text-xs transition-colors hover:border-amber-400 ${card}`}
    >
      <div className="font-semibold text-amber-700 dark:text-amber-400">{tier.name}</div>
      <div className={`mt-0.5 ${muted}`}>{tier.priceLabel} · upgrade to Pro</div>
    </Link>
  );
}
