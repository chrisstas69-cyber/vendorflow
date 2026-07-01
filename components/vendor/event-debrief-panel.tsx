'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Cloud, Loader2, Save } from 'lucide-react';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';
import type { EventDebriefRecord } from '@/lib/event-debrief-schema';
import { useEventDebrief } from '@/contexts/event-debrief-context';

interface EventDebriefPanelProps {
  eventId?: string;
  applicationId?: string;
  eventName: string;
  eventDate: string;
  status: 'booked' | 'completed';
  compact?: boolean;
}

export function EventDebriefPanel({
  eventId,
  applicationId,
  eventName,
  eventDate,
  status,
  compact = false,
}: EventDebriefPanelProps) {
  const { card, cardInset, muted, btnPrimary } = useVendorTheme();
  const { getOrCreateDebriefDraft, getDebriefForEvent, upsertDebrief, saving } = useEventDebrief();
  const saved = getDebriefForEvent(eventName, eventDate);
  const [draft, setDraft] = useState<EventDebriefRecord>(() =>
    getOrCreateDebriefDraft({ eventId, applicationId, eventName, eventDate, status })
  );
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const next = saved ?? getOrCreateDebriefDraft({ eventId, applicationId, eventName, eventDate, status });
    setDraft(next);
  }, [saved, eventId, applicationId, eventName, eventDate, status, getOrCreateDebriefDraft]);

  const fetchWeather = async () => {
    setWeatherLoading(true);
    try {
      const params = new URLSearchParams({ date: eventDate });
      if (eventId) params.set('eventId', eventId);
      else params.set('eventName', eventName);
      const res = await fetch(`/api/weather/forecast?${params}`);
      const data = await res.json();
      if (data.ok && data.weather) {
        setDraft(d => ({
          ...d,
          weatherSummary: data.weather.summary,
          weatherHighF: data.weather.highF,
          weatherLowF: data.weather.lowF,
          weatherPrecipPct: data.weather.precipPct,
          weatherCondition: data.weather.condition,
        }));
      }
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'booked' && !draft.weatherSummary) {
      fetchWeather();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventDate, eventName, status]);

  const handleSave = async () => {
    await upsertDebrief({
      ...draft,
      eventId,
      applicationId,
      eventName,
      eventDate,
      status: draft.status === 'completed' ? 'completed' : status,
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const setField = <K extends keyof EventDebriefRecord>(key: K, value: EventDebriefRecord[K]) => {
    setDraft(d => ({ ...d, [key]: value }));
  };

  return (
    <div className={`rounded-2xl border p-4 ${card}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-amber-500" />
          <span className="font-semibold text-sm">Event log</span>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${btnPrimary}`}
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          {savedFlash ? 'Saved' : 'Save log'}
        </button>
      </div>

      {(draft.weatherSummary || status === 'booked') && (
        <div className={`rounded-xl p-3 mb-3 ${cardInset}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-sky-500" />
              <span className="font-semibold text-sm">Weather</span>
            </div>
            {status === 'booked' && (
              <button
                type="button"
                onClick={fetchWeather}
                disabled={weatherLoading}
                className={`text-xs ${muted} hover:underline`}
              >
                {weatherLoading ? 'Updating…' : 'Refresh'}
              </button>
            )}
          </div>
          {weatherLoading && !draft.weatherSummary ? (
            <div className={`text-sm mt-2 ${muted}`}>Loading forecast…</div>
          ) : (
            <div className="mt-2 text-sm">
              {draft.weatherSummary ?? 'Forecast unavailable'}
              {draft.weatherPrecipPct != null && draft.weatherPrecipPct >= 40 && (
                <div className="text-amber-600 text-xs font-medium mt-1">Rain risk — pack cover</div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <label className="block">
          <span className={`text-xs font-medium ${muted}`}>Crowd (1–5)</span>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setField('crowdRating', n)}
                className={`h-8 w-8 rounded-lg text-sm font-bold ${
                  draft.crowdRating === n
                    ? 'bg-amber-400 text-gray-900'
                    : `border ${cardInset}`
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </label>

        {!compact && (
          <>
            <Field label="How it went" value={draft.notes} onChange={v => setField('notes', v)} muted={muted} />
            <Field label="Top sellers" value={draft.topSellers} onChange={v => setField('topSellers', v)} muted={muted} />
            <Field
              label="Could've sold more"
              value={draft.missedOpportunities}
              onChange={v => setField('missedOpportunities', v)}
              muted={muted}
            />
            <Field label="Issues" value={draft.issues} onChange={v => setField('issues', v)} muted={muted} />
            <Field
              label="Bring next time"
              value={draft.bringNextTime}
              onChange={v => setField('bringNextTime', v)}
              muted={muted}
            />
          </>
        )}

        {compact && (
          <Field label="Quick notes" value={draft.notes} onChange={v => setField('notes', v)} muted={muted} rows={2} />
        )}

        {status === 'completed' && (
          <button
            type="button"
            onClick={() => setField('status', 'completed')}
            className={`text-xs ${muted}`}
          >
            Marked completed
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  muted,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  muted: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className={`text-xs font-medium ${muted}`}>{label}</span>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm resize-y min-h-[2.5rem]"
        placeholder={`${label}…`}
      />
    </label>
  );
}
