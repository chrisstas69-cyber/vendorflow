'use client';

import { useState } from 'react';
import { Calendar, MapPin, Users, TrendingUp, AlertTriangle, DollarSign, Info } from 'lucide-react';
import { TierBadge } from '@/components/tier-badge';
import type { MockEvent } from '@/lib/mock-data';

interface EventCardProps {
  event: MockEvent;
  onApply?: (event: MockEvent) => void;
  applying?: boolean;
}

export function EventCard({ event, onApply, applying }: EventCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const dudRiskColor =
    event.dudRisk < 15 ? 'text-green-500' : event.dudRisk < 30 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="border-2 border-border-primary bg-bg-secondary p-4 hover:border-accent-primary transition-colors flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <TierBadge tier={event.tier} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-1">
                <h3 className="text-lg font-bold leading-tight break-words">{event.name}</h3>
                <button
                  type="button"
                  onClick={() => setShowBreakdown(v => !v)}
                  className="shrink-0 p-0.5 text-text-secondary hover:text-accent-primary"
                  aria-label="Alpha score breakdown"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
              {showBreakdown && (
                <div className="mt-2 bg-bg-primary border-2 border-border-primary p-3 text-xs">
                  <div className="font-bold text-sm mb-2">ALPHA SCORE BREAKDOWN</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Family Density:</div>
                    <div className="font-bold">{event.familyDensity}%</div>
                    <div>Foot Traffic:</div>
                    <div className="font-bold">{event.footTraffic}</div>
                    <div>Fee Transparency:</div>
                    <div className="font-bold">100%</div>
                    <div>DUD Risk:</div>
                    <div className={`font-bold ${dudRiskColor}`}>{event.dudRisk}%</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />
              {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-accent-primary">{event.alphaScore}</div>
          <div className="text-xs text-text-secondary">ALPHA</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="border-2 border-border-primary bg-bg-primary p-2">
          <div className="flex items-center gap-1 text-xs text-text-secondary mb-1">
            <Users className="h-3 w-3" />
            FAMILY DENSITY
          </div>
          <div className="text-lg font-bold">{event.familyDensity}%</div>
        </div>
        <div className="border-2 border-border-primary bg-bg-primary p-2">
          <div className="flex items-center gap-1 text-xs text-text-secondary mb-1">
            <TrendingUp className="h-3 w-3" />
            FOOT TRAFFIC
          </div>
          <div className="text-lg font-bold">{event.footTraffic}</div>
        </div>
      </div>

      <div className="border-2 border-accent-primary bg-accent-primary/5 p-3 mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-text-secondary mb-1">PROJECTED ROI</div>
            <div className="text-base sm:text-lg font-bold">
              ${event.roiMin.toLocaleString()} - ${event.roiMax.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-secondary mb-1">TOTAL FEES</div>
            <div className="text-base sm:text-lg font-bold">${event.boothFee + event.permitFee}</div>
            <div className="text-xs text-text-secondary">
              Booth: ${event.boothFee} • Permit: ${event.permitFee}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`h-4 w-4 ${dudRiskColor}`} />
          <span className="text-xs font-bold">DUD RISK</span>
        </div>
        <div className={`text-sm font-bold ${dudRiskColor}`}>{event.dudRisk}%</div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {event.tags.map(tag => (
          <span
            key={tag}
            className="px-2 py-1 bg-bg-tertiary border border-border-primary text-xs font-bold"
          >
            {tag}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onApply?.(event)}
        disabled={applying}
        className="mt-auto w-full bg-accent-primary hover:bg-accent-secondary border-2 border-black text-black font-bold py-3 px-4 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <DollarSign className="h-4 w-4" />
        {applying ? 'ADDING...' : 'APPLY NOW'}
      </button>
    </div>
  );
}
