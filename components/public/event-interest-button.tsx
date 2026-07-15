'use client';

import { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck, Heart } from 'lucide-react';
import {
  getDeviceInterest,
  getInterestCounts,
  getInterestDeviceId,
  seedInterestCount,
  toggleInterest,
  type InterestKind,
} from '@/lib/event-interest';

interface Props {
  eventId: string;
  /** Seed from PlatformEvent.saves / mock so empty events don't show 0 forever */
  initialSaves?: number;
  kind?: InterestKind;
  compact?: boolean;
  className?: string;
  onChange?: (counts: { saves: number; rsvps: number }) => void;
}

export function EventInterestButton({
  eventId,
  initialSaves = 0,
  kind = 'save',
  compact,
  className = '',
  onChange,
}: Props) {
  const [active, setActive] = useState(false);
  const [counts, setCounts] = useState({ saves: initialSaves, rsvps: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedInterestCount(eventId, initialSaves);
    setActive(getDeviceInterest(eventId, kind));
    setCounts(getInterestCounts(eventId));
    setReady(true);
  }, [eventId, initialSaves, kind]);

  const handleToggle = () => {
    const result = toggleInterest(eventId, kind);
    setActive(result.active);
    setCounts(result.counts);
    onChange?.(result.counts);
    // Fire-and-forget server sync when hosted DB exists
    void fetch(`/api/events/interest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vf-device': getInterestDeviceId(),
      },
      body: JSON.stringify({ eventId, kind, active: result.active }),
    }).catch(() => {});
  };

  if (!ready) {
    return (
      <div
        className={`h-10 rounded-xl border vf-border vf-surface animate-pulse ${compact ? 'w-10' : 'w-36'} ${className}`}
      />
    );
  }

  const count = kind === 'save' ? counts.saves : counts.rsvps;
  const label = kind === 'save' ? (active ? 'Saved' : 'Save') : active ? 'Going' : 'I\'m interested';
  const Icon =
    kind === 'save' ? (active ? BookmarkCheck : Bookmark) : Heart;

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={active}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition-colors ${
        active
          ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
          : 'vf-surface vf-border vf-text hover:border-orange-500/40'
      } ${compact ? 'p-2.5' : 'px-4 py-2.5 text-sm'} ${className}`}
    >
      <Icon size={compact ? 16 : 15} className={active && kind === 'rsvp' ? 'fill-current' : ''} />
      {!compact && (
        <>
          <span>{label}</span>
          <span className={`tabular-nums text-xs ${active ? 'text-white/80' : 'vf-text-muted'}`}>
            {count}
          </span>
        </>
      )}
      {compact && count > 0 && (
        <span className="sr-only">
          {count} {kind === 'save' ? 'saves' : 'interested'}
        </span>
      )}
    </button>
  );
}

export function EventInterestStat({
  eventId,
  initialSaves = 0,
}: {
  eventId: string;
  initialSaves?: number;
}) {
  const [counts, setCounts] = useState({ saves: initialSaves, rsvps: 0 });

  useEffect(() => {
    seedInterestCount(eventId, initialSaves);
    setCounts(getInterestCounts(eventId));
    const onStorage = () => setCounts(getInterestCounts(eventId));
    window.addEventListener('storage', onStorage);
    const t = setInterval(onStorage, 1500);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(t);
    };
  }, [eventId, initialSaves]);

  const total = counts.saves + counts.rsvps;
  if (total <= 0) return null;

  return (
    <p className="text-xs vf-text-muted">
      <span className="font-semibold text-orange-600 tabular-nums">{total}</span> people interested
      {counts.saves > 0 && (
        <>
          {' '}
          · <span className="tabular-nums">{counts.saves}</span> saved
        </>
      )}
    </p>
  );
}
