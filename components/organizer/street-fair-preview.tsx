'use client';

import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import type { BoothKind, BoothSpace, StreetFairLayoutDefinition } from '@/lib/booth/street-fair-schema';
import { sidePairLabels } from '@/lib/booth/street-fair-schema';
import { countBoothsInLayout } from '@/lib/booth/street-fair-generate';
import { Truck, Zap } from 'lucide-react';

interface StreetFairPreviewProps {
  layout: StreetFairLayoutDefinition;
  booths: BoothSpace[];
  selectedBoothId?: string | null;
  onSelectBooth?: (booth: BoothSpace) => void;
  printMode?: boolean;
}

function sortBoothsByLabel(a: BoothSpace, b: BoothSpace): number {
  const na = parseInt(a.label, 10);
  const nb = parseInt(b.label, 10);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return a.label.localeCompare(b.label, undefined, { numeric: true });
}

function BoothChip({
  booth,
  selected,
  onSelect,
}: {
  booth: BoothSpace;
  selected: boolean;
  onSelect?: () => void;
}) {
  const filled = Boolean(booth.vendorName);
  const isTruck = booth.boothKind === 'truck';

  return (
    <button
      type="button"
      onClick={onSelect}
      title={
        filled
          ? `${booth.label} — ${booth.vendorName}`
          : `${booth.label} — empty ${isTruck ? 'truck' : 'tent'} space`
      }
      className={`street-fair-booth-chip group relative flex flex-col items-center justify-center border-2 text-center transition-all ${
        isTruck ? 'min-w-[4.5rem] min-h-[3.5rem]' : 'min-w-[3rem] min-h-[3.5rem]'
      } ${
        selected
          ? 'border-teal-500 bg-teal-100 ring-2 ring-teal-400 z-10 scale-105'
          : filled
            ? isTruck
              ? 'border-blue-700 bg-blue-600 text-white'
              : 'border-teal-700 bg-teal-600 text-white'
            : isTruck
              ? 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200'
              : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100'
      }`}
    >
      <span className="text-xs font-bold font-mono leading-none print:text-sm">{booth.label}</span>
      {filled ? (
        <span className="street-fair-booth-vendor-name text-[9px] leading-tight mt-0.5 line-clamp-2 px-0.5 opacity-90 print:line-clamp-none print:text-[10px] print:font-semibold print:mt-1 print:px-1">
          {booth.vendorName}
        </span>
      ) : (
        <span className="text-[8px] uppercase tracking-wide opacity-60 mt-0.5 print:hidden">
          {isTruck ? 'truck' : 'tent'}
        </span>
      )}
      {booth.utilities.includes('electric') && (
        <Zap className="absolute top-0.5 right-0.5 h-2.5 w-2.5 opacity-70" />
      )}
    </button>
  );
}

function CrossStreetBar({ label }: { label: string }) {
  return (
    <div className="street-fair-cross my-1">
      <div className="h-9 bg-neutral-950 text-white flex items-center justify-center px-3 text-xs font-bold uppercase tracking-[0.15em]">
        {label || 'Cross street'}
      </div>
    </div>
  );
}

function StreetCenterLane({ name, isSecondary }: { name: string; isSecondary?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-2 py-3 min-h-[5rem] border-y-4 border-dashed ${
        isSecondary
          ? 'bg-neutral-400 border-neutral-500 dark:bg-neutral-600'
          : 'bg-neutral-300 border-neutral-500 dark:bg-neutral-700 dark:border-neutral-500'
      }`}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-800 dark:text-neutral-100 [writing-mode:vertical-rl] rotate-180">
        {name}
      </div>
    </div>
  );
}

function SideRow({
  sideLabel,
  boothKind,
  booths,
  selectedBoothId,
  onSelectBooth,
  align,
}: {
  sideLabel: string;
  boothKind?: BoothKind;
  booths: BoothSpace[];
  selectedBoothId?: string | null;
  onSelectBooth?: (booth: BoothSpace) => void;
  align: 'left' | 'right';
}) {
  return (
    <div className={`flex flex-col gap-1 ${align === 'right' ? 'items-end' : 'items-start'}`}>
      <div className={`text-[10px] font-bold uppercase tracking-wide mb-1 flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        {boothKind === 'truck' ? <Truck className="h-3 w-3" /> : null}
        <span>{sideLabel} side</span>
      </div>
      <div className={`flex flex-wrap gap-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {booths.length === 0 ? (
          <span className="text-xs text-neutral-400 italic px-2">No booths — save layout to generate</span>
        ) : (
          booths.map(booth => (
            <BoothChip
              key={booth.id}
              booth={booth}
              selected={selectedBoothId === booth.id}
              onSelect={() => onSelectBooth?.(booth)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function StreetFairPreview({
  layout,
  booths,
  selectedBoothId,
  onSelectBooth,
  printMode = false,
}: StreetFairPreviewProps) {
  const { cardInset, muted, heading } = useOrganizerTheme();
  const total = countBoothsInLayout(layout);
  const assigned = booths.filter(b => b.vendorName).length;
  const assignedBooths = booths.filter(b => b.vendorName).sort(sortBoothsByLabel);
  const [sideA, sideB] = sidePairLabels(layout.numberingScheme);

  if (!layout.streets?.length) {
    return (
      <div className={`rounded-xl p-8 text-center ${cardInset}`}>
        <p className={`text-sm ${muted}`}>Add a street and at least one block to build your map.</p>
      </div>
    );
  }

  return (
    <div id="street-fair-print-root" className={`space-y-6 ${printMode ? 'print:p-4' : ''}`}>
      <div className={`flex flex-wrap gap-3 text-sm no-print ${muted}`}>
        <span>{layout.streets.length} street{layout.streets.length !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{total} booth spaces</span>
        <span>·</span>
        <span className="text-teal-700 dark:text-teal-400 font-medium">{assigned} assigned</span>
        <span>·</span>
        <span className="capitalize">{layout.numberingScheme.replace('-', ' ')} numbering</span>
      </div>

      {/* Print header — visible only when printing */}
      <div className="hidden print:block mb-4 border-b-2 border-black pb-2">
        <h1 className="text-xl font-bold">Street Fair Booth Map</h1>
        <p className="text-sm">
          {assigned} of {total} booths assigned · Generated {new Date().toLocaleDateString()}
        </p>
      </div>

      <div className="space-y-8">
        {layout.streets.map(street => (
          <div key={street.id} className="street-fair-street break-inside-avoid">
            <div className={`rounded-xl border-2 border-neutral-800 overflow-hidden ${cardInset}`}>
              <div className="px-4 py-2 bg-neutral-900 text-white flex items-center justify-between">
                <span className="font-bold tracking-wide">{street.name}</span>
                {street.isSecondary && (
                  <span className="text-[10px] uppercase tracking-wider bg-neutral-700 px-2 py-0.5 rounded">
                    Side street
                  </span>
                )}
              </div>

              <div className="p-3 bg-neutral-100 dark:bg-neutral-900/40 space-y-0">
                {street.blocks.length === 0 ? (
                  <p className={`text-sm p-4 ${muted}`}>No blocks on this street yet — click Add block.</p>
                ) : (
                  street.blocks.map((block, blockIndex) => {
                    const blockBooths = booths.filter(
                      b => b.blockId === block.id && b.streetId === street.id
                    );
                    const sideLeft = block.sides[0];
                    const sideRight = block.sides[1];
                    const leftBooths = sideLeft
                      ? blockBooths.filter(b => b.sideId === sideLeft.id)
                      : [];
                    const rightBooths = sideRight
                      ? blockBooths.filter(b => b.sideId === sideRight.id)
                      : [];
                    const crossLabel =
                      block.startIntersection ||
                      block.name ||
                      `Block ${blockIndex + 1}`;

                    return (
                      <div key={block.id} className="street-fair-block break-inside-avoid">
                        <CrossStreetBar label={crossLabel} />
                        {block.name && block.startIntersection && (
                          <div className={`text-center text-xs font-semibold py-1 ${heading}`}>
                            {block.name}
                          </div>
                        )}

                        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-stretch py-2 px-1">
                          <SideRow
                            sideLabel={sideLeft?.label ?? sideA}
                            boothKind={sideLeft?.boothKind}
                            booths={leftBooths}
                            selectedBoothId={selectedBoothId}
                            onSelectBooth={onSelectBooth}
                            align="left"
                          />

                          <div className="w-14 sm:w-16 flex-shrink-0">
                            <StreetCenterLane name={street.name} isSecondary={street.isSecondary} />
                          </div>

                          <SideRow
                            sideLabel={sideRight?.label ?? sideB}
                            boothKind={sideRight?.boothKind}
                            booths={rightBooths}
                            selectedBoothId={selectedBoothId}
                            onSelectBooth={onSelectBooth}
                            align="right"
                          />
                        </div>

                        {blockIndex === street.blocks.length - 1 && (
                          <CrossStreetBar label={block.endIntersection || 'End of fair'} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend — screen only */}
      <div className={`flex flex-wrap gap-4 text-xs no-print ${muted}`}>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 bg-amber-50 border-2 border-amber-200 rounded-sm" /> Empty tent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 bg-blue-50 border-2 border-blue-200 rounded-sm" /> Empty truck
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 bg-teal-600 border-2 border-teal-700 rounded-sm" /> Assigned
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-8 h-2 bg-neutral-950 rounded-sm" /> Cross street
        </span>
      </div>

      {/* Vendor roster — print only, sorted by booth number */}
      {assignedBooths.length > 0 && (
        <div className="hidden print:block mt-6 pt-4 border-t-2 border-black break-inside-avoid">
          <h2 className="text-sm font-bold mb-3 uppercase tracking-wide">Vendor assignments</h2>
          <div className="text-sm leading-relaxed columns-2 gap-8">
            {assignedBooths.map(booth => (
              <div key={booth.id} className="mb-1.5 break-inside-avoid">
                <span className="font-bold">{booth.label})</span>{' '}
                {booth.vendorName}
                {booth.boothKind === 'truck' ? ' (truck)' : ''}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function buildSpotAssignmentEmail(booth: BoothSpace, eventLabel?: string): string {
  const subject = encodeURIComponent(
    `Your booth assignment${eventLabel ? ` — ${eventLabel}` : ''} — Spot #${booth.label}`
  );
  const body = encodeURIComponent(
    `Hi ${booth.vendorName ?? 'there'},\n\n` +
      `Your booth assignment for ${eventLabel ?? 'the street fair'}:\n\n` +
      `  Spot number: ${booth.label}\n` +
      `  Street: ${booth.streetName}\n` +
      `  Block: ${booth.blockLabel}\n` +
      `  Side: ${booth.sideLabel}\n` +
      (booth.boothSize ? `  Space size: ${booth.boothSize}\n` : '') +
      `\nPlease arrive early for setup. Reply if you have questions.\n\n— Event organizer`
  );
  return `mailto:${booth.vendorEmail}?subject=${subject}&body=${body}`;
}
