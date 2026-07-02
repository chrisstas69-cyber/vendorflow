'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { PaymentUploadDialog } from '@/components/payment-upload-dialog';
import { EventDebriefPanel } from '@/components/vendor/event-debrief-panel';
import { PriorYearPanel } from '@/components/vendor/prior-year-panel';
import { SetupChecklist } from '@/components/vendor/setup-checklist';
import { QuickLogSaleDialog } from '@/components/quick-log-sale-dialog';
import { VendorEmptyState } from '@/components/vendor/vendor-empty-state';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';
import { useDemoStore } from '@/contexts/demo-store-context';
import { useVendorApplications } from '@/contexts/vendor-applications-context';
import { useEventDebrief } from '@/contexts/event-debrief-context';
import { useVendorFinancial } from '@/contexts/vendor-financial-context';
import { getVendorBookedEvents } from '@/lib/vendor-booked-events';
import { ApplicationStatusBadge } from '@/components/vendor/application-status-badge';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Upload,
} from 'lucide-react';

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarOpsPage() {
  const { applications: demoApps } = useDemoStore();
  const { applications: dbApps, getPublicStatus } = useVendorApplications();
  const applications = dbApps.length > 0 ? dbApps : demoApps;
  const { upsertFinancial } = useVendorFinancial();
  const { getOrCreateDebriefDraft, getDebriefForEvent, upsertDebrief, mergeFinancial } =
    useEventDebrief();
  const bookedEvents = useMemo(() => getVendorBookedEvents(applications), [applications]);
  const { card, muted, btnPrimary, btnSecondary } = useVendorTheme();

  const now = new Date();
  const [currentDate, setCurrentDate] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const today = todayYmd();
    return bookedEvents.some(e => e.date === today) ? today : bookedEvents[0]?.date ?? null;
  });
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getEventForDate = (date: string) => bookedEvents.find(e => e.date === date);
  const selectedEvent = selectedDate ? getEventForDate(selectedDate) : null;
  const selectedBooked = selectedEvent;

  const upcoming = useMemo(
    () =>
      bookedEvents
        .filter(e => e.date >= todayYmd())
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 4),
    [bookedEvents]
  );

  const initialImportEventId = selectedBooked?.id;

  const savedDebrief = selectedEvent && selectedDate
    ? getDebriefForEvent(selectedEvent.name, selectedDate)
    : undefined;

  const [checklist, setChecklist] = useState<ReturnType<typeof getOrCreateDebriefDraft>['checklist']>([]);

  useEffect(() => {
    if (!selectedEvent || !selectedDate) {
      setChecklist([]);
      return;
    }
    const d =
      savedDebrief ??
      getOrCreateDebriefDraft({
        eventId: selectedBooked?.eventId,
        applicationId: selectedBooked?.applicationId,
        eventName: selectedEvent.name,
        eventDate: selectedDate,
        status: selectedEvent.status,
      });
    setChecklist(d.checklist);
  }, [selectedEvent, selectedDate, selectedBooked, savedDebrief, getOrCreateDebriefDraft]);

  const persistChecklist = async (items: typeof checklist) => {
    if (!selectedEvent || !selectedDate) return;
    const base =
      savedDebrief ??
      getOrCreateDebriefDraft({
        eventId: selectedBooked?.eventId,
        applicationId: selectedBooked?.applicationId,
        eventName: selectedEvent.name,
        eventDate: selectedDate,
        status: selectedEvent.status,
      });
    await upsertDebrief({ ...base, checklist: items });
  };

  const handleImport = async (record: Parameters<typeof upsertFinancial>[0]) => {
    const created = await upsertFinancial(record, 'import');
    await mergeFinancial(created);
  };

  const handleQuickLog = async (record: Parameters<typeof upsertFinancial>[0]) => {
    const created = await upsertFinancial(record, 'quick-log');
    await mergeFinancial(created);
  };

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setCurrentDate(next);
    const prefix = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    const evt = bookedEvents.find(e => e.date.startsWith(prefix));
    setSelectedDate(evt?.date ?? null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(bookedEvents.some(e => e.date === todayYmd()) ? todayYmd() : null);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Calendar</h1>
            <p className={`text-sm mt-1 ${muted}`}>Booked events, weather, checklists, and your event log</p>
          </div>
          <button
            type="button"
            onClick={goToToday}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${btnSecondary}`}
          >
            Today
          </button>
        </div>

        {bookedEvents.length === 0 ? (
          <VendorEmptyState
            icon={CalendarDays}
            title="No booked events yet"
            description="Apply to fairs on Pulse — once you're booked, they'll show up here with checklists and log tools."
            action={
              <a href="/pulse" className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${btnPrimary}`}>
                Find events
              </a>
            }
          />
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className={`rounded-2xl border overflow-hidden ${card}`}>
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                  <button type="button" onClick={() => shiftMonth(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Previous month">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="font-bold">{monthNames[month]} {year}</div>
                  <button type="button" onClick={() => shiftMonth(1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Next month">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className={`text-center text-xs font-medium py-2 ${muted}`}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`e-${i}`} className="aspect-square" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const event = getEventForDate(dateStr);
                      const isSelected = selectedDate === dateStr;
                      const isToday = dateStr === todayYmd();
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setSelectedDate(dateStr)}
                          className={`aspect-square rounded-lg text-sm font-medium transition-colors relative ${
                            isSelected
                              ? 'bg-amber-400 text-gray-900'
                              : event
                                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          } ${isToday && !isSelected ? 'ring-2 ring-amber-400/50' : ''}`}
                        >
                          {day}
                          {event && !isSelected && (
                            <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full ${event.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className={`flex gap-4 text-xs ${muted}`}>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Booked</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Completed</span>
              </div>

              {upcoming.length > 0 && (
                <div className={`rounded-2xl border p-4 ${card}`}>
                  <h2 className="font-semibold text-sm mb-3">Coming up</h2>
                  <div className="space-y-2">
                    {upcoming.map(evt => (
                      <button
                        key={`${evt.id}-${evt.date}`}
                        type="button"
                        onClick={() => {
                          const [y, m] = evt.date.split('-').map(Number);
                          setCurrentDate(new Date(y, m - 1, 1));
                          setSelectedDate(evt.date);
                        }}
                        className={`w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex justify-between gap-2`}
                      >
                        <span className="font-medium truncate">{evt.name}</span>
                        <span className={`shrink-0 ${muted}`}>
                          {new Date(`${evt.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              {selectedDate && selectedEvent ? (
                <div className="space-y-4">
                  <div className={`rounded-2xl border p-4 ${card}`}>
                    <div className={`text-xs ${muted}`}>
                      {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                    <h3 className="font-bold text-lg mt-1">{selectedEvent.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${
                        selectedEvent.status === 'completed' ? 'bg-green-500/15 text-green-700' : 'bg-amber-500/15 text-amber-700'
                      }`}>
                        {selectedEvent.status}
                      </span>
                      {selectedBooked?.eventId && getPublicStatus(selectedBooked.eventId) && (
                        <ApplicationStatusBadge status={getPublicStatus(selectedBooked.eventId)} />
                      )}
                    </div>
                  </div>

                  <PriorYearPanel eventName={selectedEvent.name} eventDate={selectedDate} />

                  <div className={`rounded-2xl border p-4 ${card}`}>
                    <SetupChecklist
                      debriefId={savedDebrief?.id}
                      checklist={checklist}
                      onChange={items => {
                        setChecklist(items);
                        void persistChecklist(items);
                      }}
                    />
                  </div>

                  <EventDebriefPanel
                    eventId={selectedBooked?.eventId ?? selectedBooked?.id}
                    applicationId={selectedBooked?.applicationId}
                    eventName={selectedEvent.name}
                    eventDate={selectedDate}
                    status={selectedEvent.status}
                    compact={selectedEvent.status === 'booked'}
                  />

                  <button type="button" onClick={() => setShowUploadDialog(true)} className={`w-full rounded-xl py-3 flex items-center justify-center gap-2 ${btnPrimary}`}>
                    <Upload className="h-4 w-4" /> Import sales data
                  </button>
                  <button type="button" onClick={() => setShowQuickLog(true)} className={`w-full rounded-xl py-3 flex items-center justify-center gap-2 border ${btnSecondary}`}>
                    <DollarSign className="h-4 w-4" /> Quick log sale
                  </button>
                </div>
              ) : (
                <div className={`rounded-2xl border p-8 text-center ${card}`}>
                  <p className={`text-sm ${muted}`}>
                    {bookedEvents.length > 0
                      ? 'Select a highlighted date — or tap an event under Coming up'
                      : 'No events on your calendar yet'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <PaymentUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onImport={handleImport}
        bookedEvents={bookedEvents}
        initialEventId={initialImportEventId}
      />
      <QuickLogSaleDialog
        isOpen={showQuickLog}
        onClose={() => setShowQuickLog(false)}
        onSave={handleQuickLog}
        bookedEvents={bookedEvents}
        initialEventId={initialImportEventId}
      />
    </AppLayout>
  );
}
