import { prisma } from '@/lib/prisma';
import { PRICING_TIERS, type PricingTier } from '@/lib/pricing-tiers';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';
import { getActiveOrganizerId, PILOT_ORGANIZER } from '@/lib/pilot-config';

export async function getVendorPlanId(vendorEmail: string): Promise<string> {
  try {
    const p = await prisma.vendorPassport.findUnique({
      where: { vendorEmail },
      select: { planId: true },
    });
    return p?.planId ?? 'vendor-free';
  } catch {
    return 'vendor-free';
  }
}

export async function getOrganizerPlanId(organizerId?: string): Promise<string> {
  try {
    const id = organizerId ?? getActiveOrganizerId();
    const o = await prisma.organizerAccount.findUnique({
      where: { id },
      select: { planId: true },
    });
    return o?.planId ?? PILOT_ORGANIZER.planId;
  } catch {
    return 'org-founders';
  }
}

export async function setVendorPlan(vendorEmail: string, planId: string) {
  await prisma.vendorPassport.upsert({
    where: { vendorEmail },
    create: { vendorEmail, businessName: 'Vendor', planId },
    update: { planId },
  });
}

export async function setOrganizerPlan(organizerId: string, planId: string) {
  await prisma.organizerAccount.update({
    where: { id: organizerId },
    data: { planId },
  }).catch(() => null);
}

export function tierForPlan(planId: string): PricingTier | undefined {
  return PRICING_TIERS.find(t => t.id === planId);
}

export function planFeatures(planId: string): string[] {
  return tierForPlan(planId)?.features ?? [];
}

export async function getSubscriptionSummary(vendorEmail = DEMO_VENDOR_EMAIL) {
  const vendorPlanId = await getVendorPlanId(vendorEmail);
  const organizerPlanId = await getOrganizerPlanId();
  return {
    vendor: { planId: vendorPlanId, tier: tierForPlan(vendorPlanId) },
    organizer: { planId: organizerPlanId, tier: tierForPlan(organizerPlanId) },
  };
}
