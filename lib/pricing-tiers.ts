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
    name: 'Basic Event Listing',
    audience: 'organizer',
    priceLabel: 'Free',
    description: 'Get every legitimate event onto VendorFlow. No organizer subscription required.',
    features: [
      'Public event page',
      'Vendor application link',
      'Source attribution and corrections',
      'Claim and update your listing',
      'Views, saves, and interest count',
    ],
    highlighted: true,
  },
  {
    id: 'org-pro',
    name: 'Organizer Pro',
    audience: 'organizer',
    priceLabel: '$49 / event',
    description: 'Operate the event after the free listing starts bringing you vendors.',
    features: [
      'Everything in Basic Listing',
      'Vendor applications and document tracking',
      'Booth planning and payment status',
      'Compliance checklists by county',
      'Printable event-day field packet',
      'Event analytics and reporting',
    ],
  },
  {
    id: 'org-spotlight',
    name: 'Event Spotlight',
    audience: 'organizer',
    priceLabel: '$79 / event',
    description: 'Optional promotion when you need more public attention or vendor applications.',
    features: [
      'Featured discovery placement',
      'Homepage spotlight rotation',
      'Accepting-vendors badge',
      'Priority weekly digest placement',
      'Promotion performance report',
    ],
  },
  {
    id: 'vendor-free',
    name: 'Vendor Passport',
    audience: 'vendor',
    priceLabel: 'Free',
    description: 'Browse events and keep one reusable business profile.',
    features: [
      'Vendor Passport profile',
      'Public event discovery',
      'Application pre-fill',
      'Basic application tracking',
    ],
    highlighted: true,
  },
  {
    id: 'vendor-pro',
    name: 'Vendor Pro',
    audience: 'vendor',
    priceLabel: '$12 / mo',
    description: 'Paid intelligence and operating tools for active vendors.',
    features: [
      'Priority application visibility',
      'Advanced ROI forecasts',
      'Journal analytics & exports',
      'Assistant with full context',
    ],
  },
];
