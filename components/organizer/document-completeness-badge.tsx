'use client';

import { AlertTriangle, FileCheck } from 'lucide-react';

export function DocumentCompletenessBadge({
  received,
  total,
  expiringSoon = 0,
  compact,
}: {
  received: number;
  total: number;
  expiringSoon?: number;
  compact?: boolean;
}) {
  const complete = received >= total && total > 0;
  const missing = Math.max(0, total - received);

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${
        complete
          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
          : missing > 0
            ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
            : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
      }`}
    >
      <FileCheck className="h-3.5 w-3.5 shrink-0" />
      <span>
        {received}/{total} docs
        {!compact && missing > 0 && ` · ${missing} missing`}
      </span>
      {expiringSoon > 0 && (
        <span className="inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-3 w-3" />
          {expiringSoon} expiring
        </span>
      )}
    </div>
  );
}
