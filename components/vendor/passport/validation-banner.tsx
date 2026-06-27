'use client';

import type { PassportValidation, PassportValidationState } from '@/lib/vendor-passport';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';
import { CheckCircle2, AlertCircle, Clock, Sparkles } from 'lucide-react';

function stateStyles(
  dark: boolean
): Record<PassportValidationState, { bg: string; text: string; icon: typeof CheckCircle2 }> {
  return {
    ready_for_matching: {
      bg: dark
        ? 'bg-green-950/50 border-green-800'
        : 'bg-green-100 border-green-300',
      text: dark ? 'text-green-300' : 'text-green-800',
      icon: Sparkles,
    },
    documents_pending: {
      bg: dark
        ? 'bg-amber-950/50 border-amber-800'
        : 'bg-amber-100 border-amber-300',
      text: dark ? 'text-amber-300' : 'text-amber-800',
      icon: Clock,
    },
    incomplete: {
      bg: dark ? 'bg-red-950/50 border-red-800' : 'bg-red-100 border-red-300',
      text: dark ? 'text-red-300' : 'text-red-800',
      icon: AlertCircle,
    },
    needs_review: {
      bg: dark ? 'bg-blue-950/50 border-blue-800' : 'bg-blue-100 border-blue-300',
      text: dark ? 'text-blue-300' : 'text-blue-800',
      icon: CheckCircle2,
    },
  };
}

export function PassportValidationBanner({ validation }: { validation: PassportValidation }) {
  const { dark } = useVendorTheme();
  const style = stateStyles(dark)[validation.state];
  const Icon = style.icon;

  return (
    <div className={`rounded-xl border p-4 ${style.bg}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-6 w-6 shrink-0 ${style.text}`} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-bold ${style.text}`}>{validation.label}</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                dark ? 'bg-black/20' : 'bg-white/60'
              }`}
            >
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
