/** Street Fair Mode — structured layout types (stored as JSON on BoothMap) */

export type LayoutMode = 'grid' | 'street-fair';

export type NumberingScheme = 'odd-even' | 'north-south' | 'east-west' | 'custom';

export type SideLabel = 'odd' | 'even' | 'north' | 'south' | 'east' | 'west';

export type BoothKind = 'tent' | 'truck';

export interface BlockSide {
  id: string;
  label: SideLabel;
  boothCount: number;
  boothSize?: string;
  boothPrefix?: string;
  boothKind?: BoothKind;
}

export interface LayoutBlock {
  id: string;
  /** Optional friendly label, e.g. "Food Row" or "Block A — Artist Alley" */
  name?: string;
  startIntersection: string;
  endIntersection: string;
  sides: BlockSide[];
}

export interface StreetSegment {
  id: string;
  name: string;
  isSecondary?: boolean;
  blocks: LayoutBlock[];
}

export interface StreetFairLayoutDefinition {
  streets: StreetSegment[];
  numberingScheme: NumberingScheme;
  customPrefix?: string;
}

export interface BoothSpace {
  id: string;
  label: string;
  streetId: string;
  streetName: string;
  blockId: string;
  blockLabel: string;
  sideId: string;
  sideLabel: SideLabel;
  boothSize?: string;
  boothKind?: BoothKind;
  utilities: ('electric' | 'water')[];
  vendorName?: string;
  vendorEmail?: string;
  applicationId?: string;
}

export interface EventLayoutState {
  layoutMode: LayoutMode;
  grid: import('@/components/organizer/booth-map-editor').BoothCell[];
  streetFair: StreetFairLayoutDefinition;
  generatedBooths: BoothSpace[];
}

export const DEFAULT_STREET_FAIR_LAYOUT: StreetFairLayoutDefinition = {
  numberingScheme: 'odd-even',
  streets: [
    {
      id: 'st-main',
      name: 'Main Street',
      blocks: [
        {
          id: 'blk-1',
          startIntersection: 'Oak Ave',
          endIntersection: 'Maple St',
          sides: [
            { id: 'side-1o', label: 'odd', boothCount: 8, boothSize: '10×10' },
            { id: 'side-1e', label: 'even', boothCount: 8, boothSize: '10×10' },
          ],
        },
        {
          id: 'blk-2',
          startIntersection: 'Maple St',
          endIntersection: 'Pine Rd',
          sides: [
            { id: 'side-2o', label: 'odd', boothCount: 10, boothSize: '10×10' },
            { id: 'side-2e', label: 'even', boothCount: 10, boothSize: '10×10' },
          ],
        },
      ],
    },
  ],
};

export const SIDE_PAIRS: Record<NumberingScheme, [SideLabel, SideLabel]> = {
  'odd-even': ['odd', 'even'],
  'north-south': ['north', 'south'],
  'east-west': ['east', 'west'],
  custom: ['odd', 'even'],
};

export function sidePairLabels(scheme: NumberingScheme): [string, string] {
  const [a, b] = SIDE_PAIRS[scheme];
  return [a.charAt(0).toUpperCase() + a.slice(1), b.charAt(0).toUpperCase() + b.slice(1)];
}
