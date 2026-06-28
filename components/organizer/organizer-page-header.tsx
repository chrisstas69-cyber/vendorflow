'use client';

import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';

export function OrganizerPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  const { heading, muted, pageTitle } = useOrganizerTheme();

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
      <div>
        <h1 className={`${pageTitle} ${heading}`}>{title}</h1>
        {description && <p className={`text-base mt-1 max-w-2xl ${muted}`}>{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
