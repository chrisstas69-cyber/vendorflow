'use client';

import { useVendorTheme } from '@/components/vendor/use-vendor-theme';
import type { LucideIcon } from 'lucide-react';

export function VendorEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  const { card, muted } = useVendorTheme();

  return (
    <div className={`rounded-2xl border p-8 text-center ${card}`}>
      <Icon className={`h-10 w-10 mx-auto mb-3 text-amber-500`} />
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className={`text-sm max-w-sm mx-auto ${muted}`}>{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );

}
