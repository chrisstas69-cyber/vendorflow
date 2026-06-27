'use client';

import type { ComplianceCheckResult } from '@/lib/long-island/compliance-check';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export function LocalComplianceAlert({ result }: { result: ComplianceCheckResult }) {
  if (!result.region || result.items.length === 0) return null;

  return (
    <div
      className={`rounded-xl border p-4 mb-4 ${
        result.allPassed
          ? 'border-green-200 bg-green-50'
          : 'border-amber-300 bg-amber-50'
      }`}
    >
      <div className="flex items-center gap-2 font-semibold text-sm mb-2">
        {result.allPassed ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        )}
        Long Island compliance — {result.region === 'nassau' ? 'Nassau' : 'Suffolk'} County
      </div>
      <ul className="space-y-2 text-sm">
        {result.items.map(item => (
          <li key={item.ruleId} className="flex items-start gap-2">
            <span className={item.passed ? 'text-green-600' : 'text-amber-700'}>
              {item.passed ? '✓' : '○'}
            </span>
            <div>
              <div className="font-medium">{item.label}</div>
              {!item.passed && (
                <p className="text-xs text-gray-600">{item.description}</p>
              )}
              {item.salesTaxRateBps && !item.passed && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Sales tax rate: {(item.salesTaxRateBps / 100).toFixed(2)}%
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
