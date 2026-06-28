'use client';

import { PublicLayout } from '@/components/layout/public-layout';
import { PRICING_TIERS } from '@/lib/pricing-tiers';
import { FoundersEditionBanner } from '@/components/founders/founders-banner';
import { Check } from 'lucide-react';

export default function PricingPage() {
  const organizerTiers = PRICING_TIERS.filter(t => t.audience === 'organizer');
  const vendorTiers = PRICING_TIERS.filter(t => t.audience === 'vendor');

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <FoundersEditionBanner />
        <div className="text-center mb-10 mt-8">
          <h1 className="text-3xl font-bold mb-2">Long Island Founders Edition</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Pilot pricing — no billing enforced yet. Plans show what Pro tiers will include at launch.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">For organizers</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {organizerTiers.map(tier => (
              <div
                key={tier.id}
                className={`rounded-2xl border p-6 ${
                  tier.highlighted ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-gray-200'
                }`}
              >
                <div className="text-sm font-semibold text-teal-600 uppercase tracking-wide">{tier.name}</div>
                <div className="text-3xl font-bold mt-1">{tier.priceLabel}</div>
                <p className="text-sm text-gray-600 mt-2 mb-4">{tier.description}</p>
                <ul className="space-y-2">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">For vendors</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {vendorTiers.map(tier => (
              <div
                key={tier.id}
                className={`rounded-2xl border p-6 ${
                  tier.highlighted ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-gray-200'
                }`}
              >
                <div className="text-sm font-semibold text-amber-700 uppercase tracking-wide">{tier.name}</div>
                <div className="text-3xl font-bold mt-1">{tier.priceLabel}</div>
                <p className="text-sm text-gray-600 mt-2 mb-4">{tier.description}</p>
                <ul className="space-y-2">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
