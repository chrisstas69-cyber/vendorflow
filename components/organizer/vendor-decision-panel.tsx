'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react';
import type { MatchRuleResult } from '@/lib/intel/types';

interface MatchData {
  score: number;
  label: string;
  rules: MatchRuleResult[];
  qualitativeSummary?: string;
  aiReasoning?: string;
  lane?: string;
}

export interface VendorDecisionPanelProps {
  vendorEmail: string;
  eventId: string;
  vendorName?: string;
}

export function VendorDecisionPanel({ vendorEmail, eventId, vendorName }: VendorDecisionPanelProps) {
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReasoning, setShowReasoning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch(
        `/api/intel/match?vendorEmail=${encodeURIComponent(vendorEmail)}&eventId=${encodeURIComponent(eventId)}&ai=1`
      );
      const data = await res.json();
      if (!cancelled && data.ok) setMatch(data.match);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [vendorEmail, eventId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
        <Loader2 className="h-4 w-4 animate-spin" /> Computing match…
      </div>
    );
  }

  if (!match) return null;

  const scoreColor =
    match.score >= 90 ? 'text-green-600' : match.score >= 75 ? 'text-indigo-600' : 'text-amber-600';

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 mb-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Decision Panel</div>
          {vendorName && <div className="text-sm text-gray-600">{vendorName}</div>}
        </div>
        <div className={`text-2xl font-bold ${scoreColor}`}>{match.score}% Match</div>
      </div>

      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">{match.label}</p>

      <ul className="space-y-1.5 mb-3">
        {match.rules.map(rule => (
          <li key={rule.id} className="flex items-start gap-2 text-sm">
            <span className={rule.passed ? 'text-green-600' : 'text-red-500'}>
              {rule.passed ? '✓' : '✗'}
            </span>
            <span>
              <span className="font-medium">{rule.label}</span>
              <span className="text-gray-500"> — {rule.detail}</span>
            </span>
          </li>
        ))}
      </ul>

      {match.qualitativeSummary && (
        <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-900/40 rounded-lg p-3">
          <Sparkles className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
          <p>{match.qualitativeSummary}</p>
        </div>
      )}

      {match.aiReasoning && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowReasoning(v => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
          >
            {showReasoning ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            View AI Reasoning
          </button>
          {showReasoning && (
            <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-white dark:bg-gray-900 rounded-lg p-3 border max-h-48 overflow-y-auto">
              {match.aiReasoning}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
