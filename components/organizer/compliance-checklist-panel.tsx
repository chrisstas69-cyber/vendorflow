'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { LiRegion } from '@/lib/long-island/compliance-rules';
import { useOrganizerTheme } from '@/components/organizer/use-organizer-theme';
import { MapPin, FileText, Loader2 } from 'lucide-react';

interface ChecklistRule {
  id: string;
  documentType: string;
  label: string;
  description: string;
  status: 'on_file' | 'required';
}

interface ComplianceChecklistPanelProps {
  category: string;
  region?: LiRegion;
  uploadedDocTypes?: string[];
  compact?: boolean;
}

export function ComplianceChecklistPanel({
  category,
  region = 'nassau',
  uploadedDocTypes = [],
  compact,
}: ComplianceChecklistPanelProps) {
  const { surface, muted, heading, sectionTitle } = useOrganizerTheme();
  const [rules, setRules] = useState<ChecklistRule[]>([]);
  const [completePct, setCompletePct] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ region, category });
    if (uploadedDocTypes.length) params.set('uploaded', uploadedDocTypes.join(','));
    fetch(`/api/compliance/checklist?${params}`)
      .then(r => r.json())
      .then(json => {
        if (json.ok) {
          setRules(json.rules ?? []);
          setCompletePct(json.completePct ?? 0);
        }
      })
      .finally(() => setLoading(false));
  }, [region, category, uploadedDocTypes.join(',')]);

  const displayRules = compact ? rules.slice(0, 3) : rules;

  const content = loading ? (
    <div className={`flex items-center gap-2 text-sm py-4 ${muted}`}>
      <Loader2 className="h-4 w-4 animate-spin" /> Loading checklist…
    </div>
  ) : rules.length === 0 ? (
    <p className={`text-sm py-2 ${muted}`}>No location-specific checklist for this event type.</p>
  ) : (
    <div className={compact ? 'space-y-2' : 'divide-y'}>
      {displayRules.map(rule => (
        <div key={rule.id} className={`flex gap-3 ${compact ? 'py-1' : 'p-4'}`}>
          <FileText
            className={`h-4 w-4 shrink-0 mt-0.5 ${
              rule.status === 'on_file' ? 'text-emerald-600' : 'text-stone-400'
            }`}
          />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm">{rule.label}</div>
            {!compact && <p className={`text-xs mt-0.5 ${muted}`}>{rule.description}</p>}
            <span
              className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                rule.status === 'on_file'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {rule.status === 'on_file' ? 'On file' : 'Required'}
            </span>
          </div>
        </div>
      ))}
      {compact && rules.length > 3 && (
        <Link href="/organizer/compliance" className="text-xs font-semibold text-teal-600 hover:underline">
          +{rules.length - 3} more requirements
        </Link>
      )}
    </div>
  );

  if (compact) {
    return (
      <section className={`rounded-2xl p-5 ${surface}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-teal-600" />
            <h3 className={`font-semibold text-sm ${heading}`}>Compliance</h3>
          </div>
          <span className={`text-xs font-bold ${muted}`}>{completePct}%</span>
        </div>
        {content}
      </section>
    );
  }

  return (
    <section>
      <h2 className={`${sectionTitle} mb-3 flex items-center gap-2 ${heading}`}>
        <MapPin className="h-5 w-5 text-teal-600" />
        {region === 'nassau' ? 'Nassau County' : 'Suffolk County'} compliance
      </h2>
      <div className={`rounded-2xl ${surface}`}>{content}</div>
    </section>
  );
}
