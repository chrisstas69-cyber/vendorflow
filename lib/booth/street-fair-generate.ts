import type {
  BoothSpace,
  NumberingScheme,
  SideLabel,
  StreetFairLayoutDefinition,
  StreetSegment,
} from '@/lib/booth/street-fair-schema';

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

function blockLabel(block: { startIntersection: string; endIntersection: string }): string {
  return `${block.startIntersection} → ${block.endIntersection}`;
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

export function createEmptyBlock(): import('@/lib/booth/street-fair-schema').LayoutBlock {
  const id = `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    startIntersection: '',
    endIntersection: '',
    sides: [
      { id: `${id}-a`, label: 'odd', boothCount: 6, boothSize: '10×10' },
      { id: `${id}-b`, label: 'even', boothCount: 6, boothSize: '10×10' },
    ],
  };
}
