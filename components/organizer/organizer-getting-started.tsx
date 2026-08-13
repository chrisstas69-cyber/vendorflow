'use client';

import Link from 'next/link';
import { ArrowRight, Check, Circle, PartyPopper } from 'lucide-react';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import type { OrganizerApplicationInboxItem } from '@/lib/organizer-schema';

export function OrganizerGettingStarted({ eventCount, items }: { eventCount: number; items: OrganizerApplicationInboxItem[] }) {
  const { surface, cardInset, muted, heading, btnPrimary } = useOrganizerTheme();
  const steps = [
    { label: 'Create your first event', description: 'Add the date, location, booth capacity, and application deadline.', href: '/organizer/events/new', action: 'Create event', complete: eventCount > 0 },
    { label: 'Invite vendors', description: 'Share your application link and start collecting vendor details.', href: '/organizer/applications', action: 'Invite vendors', complete: items.length > 0 },
    { label: 'Review an application', description: 'Check fit and required documents before making a decision.', href: '/organizer/applications', action: 'Review applications', complete: items.some(item => item.status === 'approved') },
    { label: 'Assign a booth', description: 'Place an approved vendor using the simple booth grid.', href: '/organizer/booths', action: 'Open booth planner', complete: items.some(item => Boolean(item.boothId)) },
  ];
  const completedCount = steps.filter(step => step.complete).length;
  const nextStep = steps.find(step => !step.complete);
  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <section className={`rounded-2xl p-5 md:p-6 ${surface}`} aria-labelledby="getting-started-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">Organizer setup</p>
          <h1 id="getting-started-title" className={`mt-1 text-xl font-bold ${heading}`}>
            {completedCount === steps.length ? 'Your organizer workspace is ready' : 'Get your event ready for vendors'}
          </h1>
          <p className={`mt-1 max-w-2xl text-sm ${muted}`}>Follow these steps in order. VendorFlow will mark them complete as you work.</p>
        </div>
        <div className="min-w-32">
          <div className="flex items-center justify-between text-xs font-semibold"><span>{completedCount} of {steps.length}</span><span>{progress}%</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200"><div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      </div>
      <ol className="mt-5 grid gap-3 md:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step.label} className={`rounded-xl border p-4 ${cardInset}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${step.complete ? 'bg-teal-600 text-white' : 'bg-white text-stone-400 ring-1 ring-stone-300'}`}>
                {step.complete ? <Check className="h-4 w-4" /> : <Circle className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><span className={`text-xs font-semibold ${muted}`}>Step {index + 1}</span>{step.complete && <span className="text-xs font-semibold text-teal-600">Complete</span>}</div>
                <h2 className={`mt-0.5 text-sm font-semibold ${heading}`}>{step.label}</h2>
                <p className={`mt-1 text-xs leading-5 ${muted}`}>{step.description}</p>
                {!step.complete && <Link href={step.href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">{step.action} <ArrowRight className="h-3.5 w-3.5" /></Link>}
              </div>
            </div>
          </li>
        ))}
      </ol>
      {nextStep ? (
        <Link href={nextStep.href} className={`mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${btnPrimary}`}>Continue: {nextStep.label} <ArrowRight className="h-4 w-4" /></Link>
      ) : (
        <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-teal-700"><PartyPopper className="h-4 w-4" /> Setup complete. You are ready to run your event.</div>
      )}
    </section>
  );
}
