'use client';

import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import { useVendorPassport } from '@/contexts/vendor-passport-context';
import { useVendorApplications } from '@/contexts/vendor-applications-context';
import { useVendorFinancial } from '@/contexts/vendor-financial-context';
import { useVendorEmail } from '@/lib/hooks/use-vendor-email';

export function OnboardingChecklist() {
  const { isSignedIn } = useVendorEmail();
  const { validation } = useVendorPassport();
  const { applications } = useVendorApplications();
  const { financials } = useVendorFinancial();

  if (!isSignedIn) return null;

  const steps = [
    {
      id: 'passport',
      label: 'Complete your Vendor Passport',
      done: validation.state === 'ready_for_matching',
      href: '/vendor',
    },
    {
      id: 'apply',
      label: 'Apply to an event',
      done: applications.some(a => a.status !== 'scraped'),
      href: '/pulse',
    },
    {
      id: 'log',
      label: 'Log your first event sale',
      done: financials.length > 0,
      href: '/calendar',
    },
  ];

  const doneCount = steps.filter(s => s.done).length;
  if (doneCount === steps.length) return null;

  return (
    <div className="mx-4 mt-4 mb-2 rounded-2xl border border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 dark:border-amber-800 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="font-semibold text-sm">Getting started</h2>
        <span className="text-xs text-amber-700 dark:text-amber-300">
          {doneCount}/{steps.length} done
        </span>
      </div>
      <ul className="space-y-2">
        {steps.map(step => (
          <li key={step.id}>
            <Link
              href={step.href}
              className="flex items-center gap-2 text-sm hover:opacity-80"
            >
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-amber-500 shrink-0" />
              )}
              <span className={step.done ? 'line-through text-gray-500' : ''}>{step.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
