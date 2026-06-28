export interface PricingTier {
  id: string;
  name: string;
  audience: 'organizer' | 'vendor';
  priceLabel: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'org-founders',
    name: 'Founders Edition',
    audience: 'organizer',
    priceLabel: 'Free',
    description: 'First 1–2 seasons for Long Island pilot organizers.',
    features: [
      'Season & multi-date events',
      'Vendor applications inbox',
      'Document tracking',
      'Basic booth map',
      'Payment status dashboard',
    ],
    highlighted: true,
  },
  {
    id: 'org-pro',
    name: 'Organizer Pro',
    audience: 'organizer',
    priceLabel: '$49 / event',
    description: 'Per-event pricing after pilot — scales with your calendar.',
    features: [
      'Everything in Founders',
      'AI vendor matching',
      'Compliance checklists by county',
      'Operational contact database',
      'Contract templates',
      'Priority support',
    ],
  },
  {
    id: 'vendor-free',
    name: 'Vendor Passport',
    audience: 'vendor',
    priceLabel: 'Free',
    description: 'One profile, apply everywhere.',
    features: [
      'Vendor Passport profile',
      'Event discovery & worth-it ratings',
      'Application pre-fill',
      'Post-event journal',
    ],
    highlighted: true,
  },
  {
    id: 'vendor-pro',
    name: 'Vendor Pro',
    audience: 'vendor',
    priceLabel: '$12 / mo',
    description: 'For vendors doing 4+ events per season.',
    features: [
      'Priority application visibility',
      'Advanced ROI forecasts',
      'Journal analytics & exports',
      'Assistant with full context',
    ],
  },
];
