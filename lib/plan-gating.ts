import { PRICING_TIERS, type PricingTier } from '@/lib/pricing-tiers';

export type GatedFeature =
  | 'intel_export'
  | 'journal_analytics'
  | 'bulk_booth_email'
  | 'advanced_intel'
  | 'assistant_full';

const FEATURE_MIN_TIER: Record<GatedFeature, string[]> = {
  intel_export: ['vendor-pro'],
  journal_analytics: ['vendor-pro'],
  advanced_intel: ['vendor-pro'],
  assistant_full: ['vendor-pro'],
  bulk_booth_email: ['org-pro', 'org-founders'],
};

export function tierForPlan(planId: string): PricingTier | undefined {
  return PRICING_TIERS.find(t => t.id === planId);
}

export function hasPlanFeature(planId: string, feature: GatedFeature): boolean {
  const allowed = FEATURE_MIN_TIER[feature];
  return allowed.includes(planId);
}

export function upgradePlanForFeature(feature: GatedFeature): PricingTier | undefined {
  const minId = FEATURE_MIN_TIER[feature][0];
  return tierForPlan(minId);
}

export function featureGateMessage(feature: GatedFeature): string {
  const tier = upgradePlanForFeature(feature);
  return tier
    ? `Upgrade to ${tier.name} (${tier.priceLabel}) to unlock this feature.`
    : 'Upgrade your plan to unlock this feature.';
}
