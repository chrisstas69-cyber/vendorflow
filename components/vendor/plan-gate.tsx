'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { featureGateMessage, type GatedFeature } from '@/lib/plan-gating';

interface PlanGateProps {
  feature: GatedFeature;
  allowed: boolean;
  children: React.ReactNode;
  className?: string;
}

export function PlanGate({ feature, allowed, children, className }: PlanGateProps) {
  if (allowed) return <>{children}</>;

  return (
    <div className={className}>
      <div className="relative">
        <div className="opacity-40 pointer-events-none select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="rounded-xl border bg-white/95 dark:bg-gray-900/95 shadow-lg p-4 max-w-sm text-center">
            <Lock className="h-5 w-5 mx-auto mb-2 text-amber-600" />
            <p className="text-sm font-medium mb-2">{featureGateMessage(feature)}</p>
            <Link
              href="/pricing"
              className="inline-block text-sm font-semibold text-amber-600 hover:underline"
            >
              View plans →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
