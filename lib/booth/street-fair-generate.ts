import type {
  BoothSpace,
  NumberingScheme,
  SideLabel,
  StreetFairLayoutDefinition,
  StreetSegment,
} from '@/lib/booth/street-fair-schema';
import { SIDE_PAIRS } from '@/lib/booth/street-fair-schema';

function boothLabel(
  scheme: NumberingScheme,
  side: SideLabel,
  index: number,
  customPrefix?: string,
  sidePrefix?: string
): string {
  const n = index + 1;
  if (scheme === 'custom' && customPrefix) {
    return `${customPrefix}${sidePrefix ?? ''}${String(n).padStart(2, '0')}`;
  }
  if (scheme === 'odd-even') {
    const num = side === 'odd' ? n * 2 - 1 : n * 2;
    return String(num);
  }
  if (scheme === 'north-south' || scheme === 'east-west') {
    const letter = side === 'north' || side === 'east' ? 'N' : 'S';
    if (scheme === 'east-west') {
      const letterEW = side === 'east' ? 'E' : 'W';
      return `${letterEW}-${n}`;
    }
    return `${letter}-${n}`;
  }
  return `${side.charAt(0).toUpperCase()}${n}`;
}

function blockLabel(block: { name?: string; startIntersection: string; endIntersection: string }): string {
  if (block.name?.trim()) return block.name.trim();
  if (block.startIntersection && block.endIntersection) {
    return `${block.startIntersection} → ${block.endIntersection}`;
  }
  return block.startIntersection || block.endIntersection || 'Block';
}

export function generateBoothInventory(
  layout: StreetFairLayoutDefinition,
  assignments?: Map<string, { vendorName: string; vendorEmail: string; applicationId?: string }>
): BoothSpace[] {
  const booths: BoothSpace[] = [];
  const { numberingScheme, customPrefix } = layout;

  for (const street of layout.streets) {
    for (const block of street.blocks) {
      for (const side of block.sides) {
        for (let i = 0; i < side.boothCount; i++) {
          const label = boothLabel(numberingScheme, side.label, i, customPrefix, side.boothPrefix);
          const id = `${street.id}-${block.id}-${side.id}-${i}`;
          const assignment = assignments?.get(label);
          booths.push({
            id,
            label,
            streetId: street.id,
            streetName: street.name,
            blockId: block.id,
            blockLabel: blockLabel(block),
            sideId: side.id,
            sideLabel: side.label,
            boothSize: side.boothSize,
            boothKind: side.boothKind ?? 'tent',
            utilities: side.label === 'odd' || side.label === 'north' || side.label === 'east' ? ['electric'] : [],
            vendorName: assignment?.vendorName,
            vendorEmail: assignment?.vendorEmail,
            applicationId: assignment?.applicationId,
          });
        }
      }
    }
  }

  return booths;
}

export function countBoothsInLayout(layout: StreetFairLayoutDefinition): number {
  return layout.streets.reduce(
    (sum, st) =>
      sum + st.blocks.reduce((bs, b) => bs + b.sides.reduce((ss, s) => ss + s.boothCount, 0), 0),
    0
  );
}

export function createEmptyStreet(name: string, secondary = false): StreetSegment {
  const id = `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    name,
    isSecondary: secondary,
    blocks: [],
  };
}

export function applyNumberingSchemeToLayout(
  layout: StreetFairLayoutDefinition
): StreetFairLayoutDefinition {
  const [sideA, sideB] = SIDE_PAIRS[layout.numberingScheme];
  return {
    ...layout,
    streets: layout.streets.map(street => ({
      ...street,
      blocks: street.blocks.map(block => ({
        ...block,
        sides: block.sides.map((side, index) => ({
          ...side,
          label: index === 0 ? sideA : sideB,
        })),
      })),
    })),
  };
}

export function createEmptyBlock(scheme: NumberingScheme = 'odd-even'): import('@/lib/booth/street-fair-schema').LayoutBlock {
  const id = `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const [sideA, sideB] = SIDE_PAIRS[scheme];
  return {
    id,
    startIntersection: '',
    endIntersection: '',
    sides: [
      { id: `${id}-a`, label: sideA, boothCount: 6, boothSize: '10×10', boothKind: 'tent' },
      { id: `${id}-b`, label: sideB, boothCount: 6, boothSize: '10×10', boothKind: 'tent' },
    ],
  };
}
