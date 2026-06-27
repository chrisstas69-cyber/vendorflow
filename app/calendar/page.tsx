'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { PaymentUploadDialog } from '@/components/payment-upload-dialog';
import { useVendorTheme } from '@/components/vendor/use-vendor-theme';
import { mockCalendarEvents } from '@/lib/mock-data';
import { useDemoStore } from '@/contexts/demo-store-context';
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  CheckSquare,
  DollarSign,
  Upload,
  Cloud,
} from 'lucide-react';

export default function CalendarOpsPage() {
  const { importFinancial } = useDemoStore();
  const { card, cardInset, muted, btnPrimary, btnSecondary } = useVendorTheme();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1));
  const [selectedDate, setSelectedDate] = useState<string | null>('2026-03-15');
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getEventForDate = (date: string) => mockCalendarEvents.find(e => e.date === date);
  const selectedEvent = selectedDate ? getEventForDate(selectedDate) : null;

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setCurrentDate(next);
    const prefix = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    const evt = mockCalendarEvents.find(e => e.date.startsWith(prefix));
    setSelectedDate(evt?.date ?? null);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className={`text-sm mt-1 ${muted}`}>Booked events, weather, and day-of checklists</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className={`rounded-2xl border overflow-hidden ${card}`}>
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => shiftMonth(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="font-bold">{monthNames[month]} {year}</div>
                <button type="button" onClick={() => shiftMonth(1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
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
                        }`}
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
            <div className={`flex gap-4 mt-3 text-xs ${muted}`}>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Booked</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Completed</span>
            </div>
          </div>

          <div>
            {selectedDate && selectedEvent ? (
              <div className="space-y-4">
                <div className={`rounded-2xl border p-4 ${card}`}>
                  <div className={`text-xs ${muted}`}>
                    {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                  <h3 className="font-bold text-lg mt-1">{selectedEvent.name}</h3>
                  <span className={`inline-block mt-2 text-xs font-semibold px-2 py-1 rounded-full ${
                    selectedEvent.status === 'completed' ? 'bg-green-500/15 text-green-700' : 'bg-amber-500/15 text-amber-700'
                  }`}>
                    {selectedEvent.status}
                  </span>
                </div>

                {selectedEvent.status === 'booked' && (
                  <div className={`rounded-2xl border p-4 ${card}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Cloud className="h-4 w-4 text-sky-500" />
                      <span className="font-semibold text-sm">Weather</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Sun className="h-10 w-10 text-yellow-500" />
                      <div className="text-right">
                        <div className="text-2xl font-bold">72°</div>
                        <div className={`text-xs ${muted}`}>Clear · 5% rain</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-green-600 font-medium">Ideal conditions</div>
                  </div>
                )}

                <div className={`rounded-2xl border p-4 ${card}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckSquare className="h-4 w-4" />
                    <span className="font-semibold text-sm">Setup checklist</span>
                  </div>
                  <div className="space-y-2">
                    {['Load vehicle', 'Confirm booth location', 'Setup canopy & table', 'Display inventory', 'Test card reader'].map(item => (
                      <label key={item} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${cardInset}`}>
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="button" onClick={() => setShowUploadDialog(true)} className={`w-full rounded-xl py-3 flex items-center justify-center gap-2 ${btnPrimary}`}>
                  <Upload className="h-4 w-4" /> Import sales data
                </button>
                <button type="button" className={`w-full rounded-xl py-3 flex items-center justify-center gap-2 border ${btnSecondary}`}>
                  <DollarSign className="h-4 w-4" /> Quick log sale
                </button>
              </div>
            ) : (
              <div className={`rounded-2xl border p-8 text-center ${card}`}>
                <p className={`text-sm ${muted}`}>Select a highlighted date to see event details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PaymentUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onImport={importFinancial}
        eventName={selectedEvent?.name || ''}
        eventDate={selectedDate || ''}
      />
    </AppLayout>
  );
}
