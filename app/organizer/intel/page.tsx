'use client';

import Link from 'next/link';
import { OrganizerLayout } from '@/components/layout/organizer-layout';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { ArrowRight, Sparkles, Users } from 'lucide-react';

export default function OrganizerIntelPage() {
  const { card, heading, muted, pageTitle, btnPrimary } = useOrganizerTheme();

  return (
    <OrganizerLayout>
      <div className="mb-6">
        <h1 className={`${pageTitle} ${heading}`}>Organizer intelligence</h1>
        <p className={`text-base mt-1 ${muted}`}>
          AI matching, vendor scores, and decision support for your season.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/organizer/applications" className={`rounded-xl border p-5 hover:shadow-md transition-shadow ${card}`}>
          <Users className="h-8 w-8 text-teal-600 mb-3" />
          <h2 className="font-semibold text-lg mb-1">Application decisions</h2>
          <p className={`text-sm mb-3 ${muted}`}>
            Review booth photos with AI match scores and accept/waitlist actions.
          </p>
          <span className="text-sm font-semibold text-teal-600 inline-flex items-center gap-1">
            Open applications <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        <div className={`rounded-xl border p-5 ${card}`}>
          <Sparkles className="h-8 w-8 text-teal-600 mb-3" />
          <h2 className="font-semibold text-lg mb-1">Match engine</h2>
          <p className={`text-sm mb-3 ${muted}`}>
            Deterministic scoring plus optional Claude reasoning per vendor–event pair.
          </p>
          <code className="text-xs bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded">
            GET /api/intel/match
          </code>
        </div>
      </div>

      <div className={`mt-6 rounded-xl border p-5 ${card}`}>
        <h3 className="font-semibold mb-2">Quick actions</h3>
        <div className="flex flex-wrap gap-2">
          <Link href="/organizer/assistant" className={`px-4 py-2 rounded-lg text-sm ${btnPrimary}`}>
            Ask Assistant
          </Link>
          <Link href="/organizer" className={`px-4 py-2 rounded-lg text-sm border ${card}`}>
            View pipeline
          </Link>
        </div>
      </div>
    </OrganizerLayout>
  );
}
