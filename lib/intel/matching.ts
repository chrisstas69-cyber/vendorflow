import type { EventCategory, PlatformEvent } from '@/lib/platform-data';
import type { VendorPassport } from '@/lib/vendor-passport';
import { getRequiredForms } from '@/lib/documents';

export interface EventMatchProfile {
  eventId: string;
  eventName: string;
  category: EventCategory;
  city: string;
  state: string;
  region: string;
  lat?: number;
  lng?: number;
  vendorSlots: number;
  vendorSlotsFilled: number;
  maxBoothWidthFt?: number;
  maxBoothDepthFt?: number;
  maxTrailerLengthFt?: number;
  requiresInsurance: boolean;
  categoryCaps?: Record<string, number>;
}

export interface MatchRuleResult {
  id: string;
  label: string;
  passed: boolean;
  weight: number;
  detail: string;
}

export interface MatchScoreResult {
  score: number;
  label: string;
  rules: MatchRuleResult[];
  ready: boolean;
}

const REGION_COORDS: Record<string, { lat: number; lng: number }> = {
  NYC: { lat: 40.7128, lng: -74.006 },
  'Long Island': { lat: 40.7891, lng: -73.135 },
  'Nassau County': { lat: 40.7326, lng: -73.589 },
  'Suffolk County': { lat: 40.9176, lng: -72.645 },
  NJ: { lat: 40.0583, lng: -74.4057 },
  'Hudson County': { lat: 40.745, lng: -74.034 },
};

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function platformEventToMatchProfile(event: PlatformEvent): EventMatchProfile {
  const caps: Record<string, number> = {};
  caps[event.category] = Math.max(1, event.vendorSlots - event.vendorSlotsFilled);

  return {
    eventId: event.id,
    eventName: event.name,
    category: event.category,
    city: event.city,
    state: event.state,
    region: event.region,
    vendorSlots: event.vendorSlots,
    vendorSlotsFilled: event.vendorSlotsFilled,
    maxBoothWidthFt: event.category === 'food-truck' ? 12 : 20,
    maxBoothDepthFt: event.category === 'food-truck' ? 30 : 20,
    maxTrailerLengthFt: event.category === 'car-show' ? 40 : 24,
    requiresInsurance: true,
    categoryCaps: caps,
  };
}

export function scoreVendorAgainstEvent(
  passport: VendorPassport,
  event: EventMatchProfile,
  options?: { maxRadiusMiles?: number; vendorLat?: number; vendorLng?: number }
): MatchScoreResult {
  const maxRadius = options?.maxRadiusMiles ?? 75;
  const rules: MatchRuleResult[] = [];

  // Category cap / slot availability
  const slotsOpen = event.vendorSlots - event.vendorSlotsFilled;
  const categoryMatch =
    passport.categories.some(c => c.toLowerCase().includes(event.category.replace('-', ' '))) ||
    passport.categories.length > 0;
  rules.push({
    id: 'category',
    label: 'Category space',
    passed: slotsOpen > 0 && categoryMatch,
    weight: 25,
    detail:
      slotsOpen > 0
        ? categoryMatch
          ? `${slotsOpen} slot(s) open — category aligned`
          : `${slotsOpen} slot(s) open — category stretch`
        : 'No vendor slots remaining',
  });

  // Footprint / trailer
  const boothW = passport.logistics.boothWidthFt ?? 10;
  const boothD = passport.logistics.boothDepthFt ?? 10;
  const trailer = passport.logistics.trailerLengthFt ?? 0;
  const maxW = event.maxBoothWidthFt ?? 20;
  const maxD = event.maxBoothDepthFt ?? 20;
  const maxTrailer = event.maxTrailerLengthFt ?? 24;
  const footprintOk = boothW <= maxW && boothD <= maxD;
  const trailerOk =
    passport.logistics.vehicleType === 'tent-only' ||
    passport.logistics.vehicleType === 'van' ||
    trailer <= maxTrailer;
  rules.push({
    id: 'footprint',
    label: 'Booth footprint',
    passed: footprintOk && trailerOk,
    weight: 20,
    detail: footprintOk
      ? trailerOk
        ? `${boothW}×${boothD} ft fits event limits`
        : `Trailer ${trailer} ft exceeds ${maxTrailer} ft max`
      : `Booth ${boothW}×${boothD} ft exceeds ${maxW}×${maxD} ft max`,
  });

  // Insurance compliance
  const hasCoi = passport.documents.some(d => d.type === 'coi');
  const insuranceValid =
    hasCoi &&
    (!passport.insuranceExpiry || new Date(passport.insuranceExpiry) > new Date());
  rules.push({
    id: 'insurance',
    label: 'Insurance valid',
    passed: !event.requiresInsurance || insuranceValid,
    weight: 25,
    detail: insuranceValid
      ? passport.insuranceExpiry
        ? `COI on file · expires ${passport.insuranceExpiry}`
        : 'COI on file'
      : event.requiresInsurance
        ? 'Missing or expired COI'
        : 'Not required',
  });

  // Required documents for category
  const required = getRequiredForms(event.category);
  const uploadedTypes = new Set(passport.documents.map(d => d.type));
  const missingDocs = required.filter(t => !uploadedTypes.has(t));
  rules.push({
    id: 'documents',
    label: 'Document compliance',
    passed: missingDocs.length === 0,
    weight: 15,
    detail:
      missingDocs.length === 0
        ? 'All required forms on file'
        : `Missing: ${missingDocs.join(', ')}`,
  });

  // Geographic radius
  const eventCoord = REGION_COORDS[event.region] ?? REGION_COORDS.NYC;
  const vendorCoord =
    options?.vendorLat !== undefined && options?.vendorLng !== undefined
      ? { lat: options.vendorLat, lng: options.vendorLng }
      : REGION_COORDS['Long Island'];
  const miles = haversineMiles(vendorCoord.lat, vendorCoord.lng, eventCoord.lat, eventCoord.lng);
  const inRadius = miles <= maxRadius;
  rules.push({
    id: 'geo',
    label: 'Geographic radius',
    passed: inRadius,
    weight: 15,
    detail: inRadius
      ? `~${Math.round(miles)} mi from event region (${maxRadius} mi max)`
      : `~${Math.round(miles)} mi — outside ${maxRadius} mi radius`,
  });

  const earned = rules.filter(r => r.passed).reduce((s, r) => s + r.weight, 0);
  const total = rules.reduce((s, r) => s + r.weight, 0);
  const score = Math.round((earned / total) * 100);

  let label = 'Low match';
  if (score >= 90) label = 'Excellent match';
  else if (score >= 75) label = 'Strong match';
  else if (score >= 60) label = 'Moderate match';

  return {
    score,
    label,
    rules,
    ready: score >= 75 && rules.every(r => r.id === 'category' || r.passed || r.id === 'category'),
  };
}
