'use client';

import type { PassportValidation } from '@/lib/vendor-passport';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';

export function PassportCompletionMeter({ validation }: { validation: PassportValidation }) {
  const { heading, muted, dark } = useVendorTheme();
  const pct = validation.score;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (pct / 100) * circumference;

  const ringColor =
    pct >= 80 ? 'stroke-emerald-500' : pct >= 50 ? 'stroke-amber-500' : 'stroke-red-400';
  const trackColor = dark ? 'stroke-gray-700' : 'stroke-gray-200';

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" strokeWidth="6" className={trackColor} />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className={ringColor}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${heading}`}>{pct}%</span>
        </div>
      </div>
      <div className="min-w-0">
        <div className={`font-semibold ${heading}`}>Passport {pct}% complete</div>
        <p className={`text-sm mt-0.5 ${muted}`}>
          {validation.readyForMatching
            ? 'Match-ready — organizers can discover you.'
            : validation.missingDocuments.length > 0
              ? `Missing: ${validation.missingDocuments.map(d => d.toUpperCase()).join(', ')}`
              : validation.missingFields.length > 0
                ? `Fill in: ${validation.missingFields.slice(0, 2).join(', ')}`
                : 'Almost there — finish your profile.'}
        </p>
      </div>
    </div>
  );
}
