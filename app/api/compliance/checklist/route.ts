import { NextRequest, NextResponse } from 'next/server';
import { ensurePlatformSeed } from '@/lib/platform-seed';
import { prisma } from '@/lib/prisma';
import { rulesForEventCategory } from '@/lib/long-island/compliance-rules';
import type { LiRegion } from '@/lib/long-island/compliance-rules';

export const dynamic = 'force-dynamic';

/** GET — server-driven compliance checklist by region + event category */
export async function GET(req: NextRequest) {
  await ensurePlatformSeed();

  const { searchParams } = new URL(req.url);
  const region = (searchParams.get('region') ?? 'nassau') as LiRegion;
  const category = searchParams.get('category') ?? 'festival';
  const uploaded = searchParams.get('uploaded')?.split(',').filter(Boolean) ?? [];

  let rules = rulesForEventCategory(category, region);

  try {
    const dbRules = await prisma.complianceRule.findMany({
      where: { region },
      orderBy: { label: 'asc' },
    });

    if (dbRules.length > 0) {
      rules = dbRules
        .filter(r => {
          const cats: string[] = JSON.parse(r.requiredForCategories || '[]');
          return cats.length === 0 || cats.includes(category);
        })
        .map(r => ({
          id: r.id,
          region: r.region as LiRegion,
          documentType: r.documentType,
          label: r.label,
          description: r.description,
          requiredForCategories: JSON.parse(r.requiredForCategories || '[]'),
          salesTaxRateBps: r.salesTaxRateBps ?? undefined,
          permitTemplateUrl: r.permitTemplateUrl ?? undefined,
          isFoundersEdition: r.isFoundersEdition,
        }));
    }
  } catch {
    /* use in-memory rules */
  }

  const checklist = rules.map(rule => ({
    id: rule.id,
    documentType: rule.documentType,
    label: rule.label,
    description: rule.description,
    region: rule.region,
    required: true,
    status: uploaded.includes(rule.documentType) ? 'on_file' : 'required',
    salesTaxRateBps: rule.salesTaxRateBps,
    permitTemplateUrl: rule.permitTemplateUrl,
  }));

  return NextResponse.json({
    ok: true,
    region,
    category,
    rules: checklist,
    completePct: checklist.length
      ? Math.round((checklist.filter(r => r.status === 'on_file').length / checklist.length) * 100)
      : 100,
  });
}
