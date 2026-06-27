import type { VendorPassport } from '@/lib/vendor-passport';
import type { PlatformEvent } from '@/lib/platform-data';
import { rulesForEventCategory, type LiRegion } from '@/lib/long-island/compliance-rules';

export interface ComplianceCheckItem {
  ruleId: string;
  label: string;
  description: string;
  passed: boolean;
  documentType: string;
  salesTaxRateBps?: number;
}

export interface ComplianceCheckResult {
  region: LiRegion | null;
  items: ComplianceCheckItem[];
  missingCount: number;
  allPassed: boolean;
}

function detectLiRegion(event: PlatformEvent): LiRegion | null {
  const hay = `${event.city} ${event.region} ${event.location}`.toLowerCase();
  if (hay.includes('nassau') || hay.includes('hempstead') || hay.includes('westbury')) return 'nassau';
  if (hay.includes('suffolk') || hay.includes('huntington') || hay.includes('montauk')) return 'suffolk';
  if (event.region === 'Long Island') return 'nassau';
  return null;
}

export function runLongIslandComplianceCheck(
  passport: VendorPassport,
  event: PlatformEvent
): ComplianceCheckResult {
  const region = detectLiRegion(event);
  if (!region) {
    return { region: null, items: [], missingCount: 0, allPassed: true };
  }

  const rules = rulesForEventCategory(event.category, region);
  const uploadedTypes = new Set(passport.documents.map(d => d.type));
  const uploadedFileNames = passport.documents.map(d => d.fileName.toLowerCase());

  const items: ComplianceCheckItem[] = rules.map(rule => {
    const typeMatch = uploadedTypes.has(rule.documentType as import('@/lib/documents').DocumentType);
    const nameMatch =
      rule.documentType === 'nys-certificate-of-authority'
        ? uploadedFileNames.some(f => f.includes('authority') || f.includes('coa') || f.includes('sales tax'))
        : false;
    const passed = typeMatch || nameMatch;

    return {
      ruleId: rule.id,
      label: rule.label,
      description: rule.description,
      passed,
      documentType: rule.documentType,
      salesTaxRateBps: rule.salesTaxRateBps,
    };
  });

  const missingCount = items.filter(i => !i.passed).length;

  return {
    region,
    items,
    missingCount,
    allPassed: missingCount === 0,
  };
}
