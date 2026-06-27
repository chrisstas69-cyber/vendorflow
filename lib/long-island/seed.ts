import { prisma } from '@/lib/prisma';
import { LONG_ISLAND_COMPLIANCE_RULES } from '@/lib/long-island/compliance-rules';

export async function seedLongIslandComplianceRules() {
  for (const rule of LONG_ISLAND_COMPLIANCE_RULES) {
    await prisma.complianceRule.upsert({
      where: { id: rule.id },
      create: {
        id: rule.id,
        region: rule.region,
        documentType: rule.documentType,
        label: rule.label,
        description: rule.description,
        requiredForCategories: JSON.stringify(rule.requiredForCategories),
        salesTaxRateBps: rule.salesTaxRateBps,
        permitTemplateUrl: rule.permitTemplateUrl,
        isFoundersEdition: rule.isFoundersEdition ?? false,
      },
      update: {
        label: rule.label,
        description: rule.description,
        salesTaxRateBps: rule.salesTaxRateBps,
        permitTemplateUrl: rule.permitTemplateUrl,
      },
    });
  }
}
