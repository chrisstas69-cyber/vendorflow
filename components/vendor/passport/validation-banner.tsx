'use client';

import type { PassportValidation, PassportValidationState } from '@/lib/vendor-passport';
import { CheckCircle2, AlertCircle, Clock, Sparkles } from 'lucide-react';

const STATE_STYLES: Record<
  PassportValidationState,
  { bg: string; text: string; icon: typeof CheckCircle2 }
> = {
  ready_for_matching: {
    bg: 'bg-green-100 dark:bg-green-950/50 border-green-300 dark:border-green-800',
    text: 'text-green-800 dark:text-green-300',
    icon: Sparkles,
  },
  documents_pending: {
    bg: 'bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-300',
    icon: Clock,
  },
  incomplete: {
    bg: 'bg-red-100 dark:bg-red-950/50 border-red-300 dark:border-red-800',
    text: 'text-red-800 dark:text-red-300',
    icon: AlertCircle,
  },
  needs_review: {
    bg: 'bg-blue-100 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-300',
    icon: CheckCircle2,
  },
};

export function PassportValidationBanner({ validation }: { validation: PassportValidation }) {
  const style = STATE_STYLES[validation.state];
  const Icon = style.icon;

  return (
    <div className={`rounded-xl border p-4 ${style.bg}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-6 w-6 shrink-0 ${style.text}`} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-bold ${style.text}`}>{validation.label}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20">
              Score {validation.score}%
            </span>
            {validation.readyForMatching && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-600 text-white">
                Match-ready
              </span>
            )}
          </div>
          <p className={`text-sm mt-1 ${style.text} opacity-90`}>{validation.message}</p>
          {(validation.missingFields.length > 0 || validation.missingDocuments.length > 0) && (
            <ul className={`text-xs mt-2 space-y-0.5 ${style.text} opacity-80`}>
              {validation.missingFields.map(f => (
                <li key={f}>• Missing: {f}</li>
              ))}
              {validation.missingDocuments.map(d => (
                <li key={d}>• Document: {d.toUpperCase()}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
