'use client';

import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import type { LucideIcon } from 'lucide-react';

export function OrganizerEmptyState({
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
  const { muted, heading, surface } = useOrganizerTheme();

  return (
    <div className={`rounded-2xl p-8 text-center ${surface}`}>
      <Icon className={`h-10 w-10 mx-auto mb-3 ${muted}`} />
      <h3 className={`font-semibold mb-1 ${heading}`}>{title}</h3>
      <p className={`text-sm max-w-sm mx-auto ${muted}`}>{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
