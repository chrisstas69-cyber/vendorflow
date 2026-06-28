'use client';

import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import type { BoothSpace, StreetFairLayoutDefinition } from '@/lib/booth/street-fair-schema';
import { countBoothsInLayout } from '@/lib/booth/street-fair-generate';
import { MapPin, Zap } from 'lucide-react';

interface StreetFairPreviewProps {
  layout: StreetFairLayoutDefinition;
  booths: BoothSpace[];
  selectedBoothId?: string | null;
  onSelectBooth?: (booth: BoothSpace) => void;
}

export function StreetFairPreview({ layout, booths, selectedBoothId, onSelectBooth }: StreetFairPreviewProps) {
  const { cardInset, muted, heading } = useOrganizerTheme();
  const total = countBoothsInLayout(layout);
  const assigned = booths.filter(b => b.vendorName).length;

  return (
    <div className="space-y-4">
      <div className={`flex flex-wrap gap-3 text-sm ${muted}`}>
        <span>{layout.streets.length} street{layout.streets.length !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{total} booth spaces</span>
        <span>·</span>
        <span>{assigned} assigned</span>
        <span>·</span>
        <span className="capitalize">{layout.numberingScheme.replace('-', ' ')} numbering</span>
      </div>

      {layout.streets.map(street => (
        <div key={street.id} className={`rounded-xl border overflow-hidden ${cardInset}`}>
          <div className="px-4 py-2 border-b border-stone-200/80 dark:border-stone-700 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-teal-600" />
            <span className={`font-semibold ${heading}`}>{street.name}</span>
            {street.isSecondary && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700">Side street</span>
            )}
          </div>

          <div className="p-4 space-y-4">
            {street.blocks.map(block => {
              const blockBooths = booths.filter(b => b.blockId === block.id && b.streetId === street.id);
              return (
                <div key={block.id}>
                  <div className={`text-xs font-medium uppercase tracking-wide mb-2 ${muted}`}>
                    {block.startIntersection || '?'} → {block.endIntersection || '?'}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {block.sides.map(side => {
                      const sideBooths = blockBooths.filter(b => b.sideId === side.id);
                      return (
                        <div key={side.id} className="rounded-lg bg-stone-50 dark:bg-stone-900/50 p-3">
                          <div className={`text-xs font-semibold mb-2 capitalize ${heading}`}>
                            {side.label} side · {side.boothCount} × {side.boothSize ?? '10×10'}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {sideBooths.map(booth => {
                              const filled = Boolean(booth.vendorName);
                              const selected = selectedBoothId === booth.id;
                              return (
                                <button
                                  key={booth.id}
                                  type="button"
                                  onClick={() => onSelectBooth?.(booth)}
                                  title={filled ? booth.vendorName : 'Empty'}
                                  className={`min-w-[2.5rem] px-2 py-1.5 rounded text-xs font-mono font-semibold transition-colors ${
                                    selected
                                      ? 'ring-2 ring-teal-500 bg-teal-100 text-teal-900'
                                      : filled
                                        ? 'bg-teal-600 text-white'
                                        : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 text-stone-600'
                                  }`}
                                >
                                  {booth.label}
                                  {booth.utilities.includes('electric') && (
                                    <Zap className="inline h-2.5 w-2.5 ml-0.5 opacity-70" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
