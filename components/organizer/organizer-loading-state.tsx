'use client';

import { Loader2 } from 'lucide-react';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';

export function OrganizerLoadingState({ label = 'Loading…' }: { label?: string }) {
  const { muted } = useOrganizerTheme();

  return (
    <div className={`flex items-center justify-center gap-2 py-16 text-sm ${muted}`}>
      <Loader2 className="h-5 w-5 animate-spin" />
      {label}
    </div>
  );
}
