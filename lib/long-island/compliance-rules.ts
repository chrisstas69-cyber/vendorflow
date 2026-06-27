/** Long Island Founders Edition — Nassau & Suffolk compliance rules */

export type LiRegion = 'nassau' | 'suffolk';

export interface LocalComplianceRule {
  id: string;
  region: LiRegion | 'nyc' | 'nj';
  documentType: string;
  label: string;
  description: string;
  requiredForCategories: string[];
  salesTaxRateBps?: number;
  permitTemplateUrl?: string;
  isFoundersEdition?: boolean;
}

export const LONG_ISLAND_COMPLIANCE_RULES: LocalComplianceRule[] = [
  {
    id: 'li-nassau-coa',
    region: 'nassau',
    documentType: 'nys-certificate-of-authority',
    label: 'NYS Certificate of Authority',
    description: 'Required for vendors collecting sales tax at Nassau County fairs and markets.',
    requiredForCategories: ['food-truck', 'craft-fair', 'farmers-market', 'festival'],
    salesTaxRateBps: 8625,
    isFoundersEdition: true,
  },
  {
    id: 'li-suffolk-coa',
    region: 'suffolk',
    documentType: 'nys-certificate-of-authority',
    label: 'NYS Certificate of Authority',
    description: 'Required for Suffolk County events when selling taxable goods.',
    requiredForCategories: ['food-truck', 'craft-fair', 'farmers-market', 'festival'],
    salesTaxRateBps: 8625,
    isFoundersEdition: true,
  },
  {
    id: 'li-nassau-health',
    region: 'nassau',
    documentType: 'food-permit',
    label: 'Nassau County Dept. of Health — Temporary Food Permit',
    description: 'Temporary food service permit for outdoor fairs in Nassau.',
    requiredForCategories: ['food-truck', 'farmers-market', 'festival'],
    permitTemplateUrl: 'https://www.nassaucountyny.gov/agencies/Health/',
    isFoundersEdition: true,
  },
  {
    id: 'li-suffolk-health',
    region: 'suffolk',
    documentType: 'food-permit',
    label: 'Suffolk County Health — Mobile Food Unit Permit',
    description: 'Health department permit for mobile food vendors in Suffolk.',
    requiredForCategories: ['food-truck', 'farmers-market', 'festival'],
    permitTemplateUrl: 'https://www.suffolkcountyny.gov/departments/health-services',
    isFoundersEdition: true,
  },
  {
    id: 'li-nassau-fire',
    region: 'nassau',
    documentType: 'other',
    label: 'Nassau Fire Marshal — Tent/Canopy Permit',
    description: 'Required for tents over 400 sq ft at Nassau outdoor events.',
    requiredForCategories: ['festival', 'street-fair', 'carnival'],
    isFoundersEdition: true,
  },
  {
    id: 'li-suffolk-park',
    region: 'suffolk',
    documentType: 'other',
    label: 'Suffolk County Parks — Vendor Authorization',
    description: 'County parks vendor authorization for beach and park events.',
    requiredForCategories: ['festival', 'community', 'farmers-market'],
    isFoundersEdition: true,
  },
];

export function rulesForRegion(region: LiRegion): LocalComplianceRule[] {
  return LONG_ISLAND_COMPLIANCE_RULES.filter(r => r.region === region);
}

export function rulesForEventCategory(category: string, region?: LiRegion): LocalComplianceRule[] {
  return LONG_ISLAND_COMPLIANCE_RULES.filter(r => {
    if (region && r.region !== region) return false;
    if (r.requiredForCategories.length === 0) return true;
    return r.requiredForCategories.includes(category);
  });
}
