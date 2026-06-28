'use client';

import { rulesForEventCategory, type LiRegion } from '@/lib/long-island/compliance-rules';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { MapPin, FileText } from 'lucide-react';

interface ComplianceChecklistPanelProps {
  category: string;
  region?: LiRegion;
  uploadedDocTypes?: string[];
}

export function ComplianceChecklistPanel({
  category,
  region = 'nassau',
  uploadedDocTypes = [],
}: ComplianceChecklistPanelProps) {
  const { card, muted, heading, sectionTitle } = useOrganizerTheme();
  const rules = rulesForEventCategory(category, region);

  if (rules.length === 0) {
    return (
      <div className={`rounded-xl border p-4 text-sm ${card} ${muted}`}>
        No location-specific checklist for this event type.
      </div>
    );
  }

  return (
    <section>
      <h2 className={`${sectionTitle} mb-3 flex items-center gap-2 ${heading}`}>
        <MapPin className="h-5 w-5 text-teal-600" />
        {region === 'nassau' ? 'Nassau County' : 'Suffolk County'} compliance
      </h2>
      <div className={`rounded-xl border divide-y ${card}`}>
        {rules.map(rule => {
          const hasDoc = uploadedDocTypes.includes(rule.documentType);
          return (
            <div key={rule.id} className="p-4 flex gap-3">
              <FileText
                className={`h-5 w-5 shrink-0 ${hasDoc ? 'text-emerald-600' : 'text-stone-400'}`}
              />
              <div className="min-w-0">
                <div className="font-medium text-sm">{rule.label}</div>
                <p className={`text-xs mt-0.5 ${muted}`}>{rule.description}</p>
                <span
                  className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    hasDoc
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {hasDoc ? 'On file' : 'Required'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
