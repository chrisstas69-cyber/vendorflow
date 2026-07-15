'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PublicLayout } from '@/components/layout/public-layout';
import { PRICING_TIERS } from '@/lib/pricing-tiers';
import { FoundersEditionBanner } from '@/components/founders/founders-banner';
import { Check, Sparkles, Store, Building2 } from 'lucide-react';

export default function PricingPage() {
  const organizerTiers = PRICING_TIERS.filter(t => t.audience === 'organizer');
  const vendorTiers = PRICING_TIERS.filter(t => t.audience === 'vendor');
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [errorPlan, setErrorPlan] = useState<string | null>(null);

  const selectPlan = async (role: 'vendor' | 'organizer', planId: string) => {
    setPendingPlan(planId);
    setErrorPlan(null);
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, planId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorPlan(planId);
        setSelectedPlan(null);
      } else {
        setSelectedPlan(planId);
      }
    } catch {
      setErrorPlan(planId);
      setSelectedPlan(null);
    } finally {
      setPendingPlan(null);
    }
  };

  return (
    <PublicLayout>
      <section className="border-b vf-border vf-bg-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center animate-fade-up">
          <div className="inline-flex items-center gap-1.5 rounded-full border vf-border vf-surface px-3 py-1 text-[11px] font-medium vf-text-muted mb-4">
            <Sparkles size={11} className="text-orange-600" /> Long Island Founders Edition
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold vf-text tracking-tight leading-tight">
            Pricing that scales with{' '}
            <span className="bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent">
              your hustle
            </span>
          </h1>
          <p className="mt-4 text-sm vf-text-muted max-w-2xl mx-auto leading-relaxed">
            Free while we&apos;re in Founders Edition — no card required. We&apos;ll email you
            before any billing begins.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <FoundersEditionBanner />
        </div>

        <section className="mb-14">
          <div className="flex items-center gap-2 mb-5">
            <Building2 size={18} className="text-emerald-700" />
            <h2 className="text-xl font-semibold vf-text">For organizers</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {organizerTiers.map(tier => (
              <TierCard
                key={tier.id}
                tier={tier}
                accent="emerald"
                pending={pendingPlan === tier.id}
                selected={selectedPlan === tier.id}
                errored={errorPlan === tier.id}
                onSelect={() => selectPlan('organizer', tier.id)}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-5">
            <Store size={18} className="text-orange-600" />
            <h2 className="text-xl font-semibold vf-text">For vendors</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {vendorTiers.map(tier => (
              <TierCard
                key={tier.id}
                tier={tier}
                accent="orange"
                pending={pendingPlan === tier.id}
                selected={selectedPlan === tier.id}
                errored={errorPlan === tier.id}
                onSelect={() => selectPlan('vendor', tier.id)}
              />
            ))}
          </div>
        </section>

        <p className="mt-12 text-center text-xs vf-text-subtle">
          Already have an account?{' '}
          <Link href="/login" className="text-orange-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </PublicLayout>
  );
}

function TierCard({
  tier,
  accent,
  pending,
  selected,
  errored,
  onSelect,
}: {
  tier: (typeof PRICING_TIERS)[number];
  accent: 'orange' | 'emerald';
  pending: boolean;
  selected: boolean;
  errored: boolean;
  onSelect: () => void;
}) {
  const isOrange = accent === 'orange';
  return (
    <div
      className={`rounded-2xl border vf-border vf-surface p-6 transition-all hover:-translate-y-0.5 animate-fade-up ${
        tier.highlighted
          ? isOrange
            ? 'ring-2 ring-orange-500/25 border-orange-500/40'
            : 'ring-2 ring-emerald-500/25 border-emerald-500/40'
          : ''
      }`}
    >
      <div
        className={`text-[11px] font-semibold uppercase tracking-wider ${
          isOrange ? 'text-orange-600' : 'text-emerald-700'
        }`}
      >
        {tier.name}
        {tier.highlighted && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-orange-600/10 px-2 py-0.5 text-[10px] text-orange-700 normal-case tracking-normal">
            <Sparkles size={10} /> Popular
          </span>
        )}
      </div>
      <div className="text-3xl font-bold vf-text mt-1">{tier.priceLabel}</div>
      <p className="text-sm vf-text-muted mt-2 mb-4 leading-relaxed">{tier.description}</p>
      <ul className="space-y-2 mb-5">
        {tier.features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm vf-text">
            <Check
              className={`h-4 w-4 shrink-0 mt-0.5 ${
                isOrange ? 'text-orange-600' : 'text-emerald-600'
              }`}
            />
            {f}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onSelect}
        disabled={pending}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors ${
          isOrange
            ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/15'
            : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg shadow-emerald-700/15'
        }`}
      >
        {pending ? 'Saving…' : selected ? '✓ Selected' : 'Select plan'}
      </button>
      {selected && (
        <p className={`text-xs mt-2 text-center ${isOrange ? 'text-orange-700' : 'text-emerald-700'}`}>
          You&apos;re on {tier.name} for the pilot — free, no card required.
        </p>
      )}
      {errored && (
        <p className="text-xs text-red-600 mt-2 text-center">
          Couldn&apos;t save that just now — please try again.
        </p>
      )}
    </div>
  );
}
