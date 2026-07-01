import type { EventDebriefRecord } from '@/lib/event-debrief-schema';
import { normalizeEventName } from '@/lib/event-debrief-schema';

function escapeCsv(value: string | number | undefined | null): string {
  const s = value == null ? '' : String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function debriefsToCsv(items: EventDebriefRecord[]): string {
  const headers = [
    'Date',
    'Event',
    'Status',
    'Gross Sales',
    'Expenses',
    'Net Profit',
    'Margin %',
    'Weather',
    'Crowd (1-5)',
    'Top Sellers',
    'Missed Opportunities',
    'Issues',
    'Bring Next Time',
    'Notes',
  ];

  const rows = items.map(d => [
    d.eventDate,
    d.eventName,
    d.status,
    d.grossSales ?? '',
    d.expenses ?? '',
    d.netProfit ?? '',
    d.margin ?? '',
    d.weatherSummary ?? '',
    d.crowdRating ?? '',
    d.topSellers,
    d.missedOpportunities,
    d.issues,
    d.bringNextTime,
    d.notes,
  ]);

  return [headers, ...rows].map(row => row.map(escapeCsv).join(',')).join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildLogbookPrintHtml(items: EventDebriefRecord[], vendorLabel = 'Vendor'): string {
  const sorted = [...items].sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  const rows = sorted
    .map(d => {
      const money =
        d.netProfit != null
          ? `$${d.netProfit.toLocaleString()} net · $${(d.grossSales ?? 0).toLocaleString()} gross`
          : '—';
      return `
      <article class="log-entry">
        <header>
          <h2>${escapeHtml(d.eventName)}</h2>
          <div class="meta">${escapeHtml(d.eventDate)} · ${escapeHtml(d.status)}</div>
        </header>
        <div class="grid">
          <div><strong>Money</strong><br/>${escapeHtml(money)}</div>
          <div><strong>Weather</strong><br/>${escapeHtml(d.weatherSummary ?? '—')}</div>
          <div><strong>Crowd</strong><br/>${d.crowdRating ? `${d.crowdRating}/5` : '—'}</div>
        </div>
        ${field('Top sellers', d.topSellers)}
        ${field('Missed opportunities', d.missedOpportunities)}
        ${field('Issues', d.issues)}
        ${field('Bring next time', d.bringNextTime)}
        ${field('Notes', d.notes)}
      </article>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Event Logbook — ${escapeHtml(vendorLabel)}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #111; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .subtitle { color: #555; margin-bottom: 2rem; font-size: 0.9rem; }
    .log-entry { border-bottom: 1px solid #ccc; padding: 1.25rem 0; break-inside: avoid; }
    .log-entry h2 { font-size: 1.1rem; margin: 0 0 0.25rem; }
    .meta { color: #666; font-size: 0.85rem; margin-bottom: 0.75rem; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 0.9rem; margin-bottom: 0.75rem; }
    .field { font-size: 0.9rem; margin: 0.35rem 0; }
    .field strong { display: inline-block; min-width: 140px; }
    @media print { body { padding: 12px; } }
  </style>
</head>
<body>
  <h1>Event Logbook</h1>
  <p class="subtitle">${escapeHtml(vendorLabel)} · ${sorted.length} events · printed ${new Date().toLocaleDateString()}</p>
  ${rows || '<p>No logbook entries yet.</p>'}
</body>
</html>`;
}

function field(label: string, value: string): string {
  if (!value?.trim()) return '';
  return `<div class="field"><strong>${escapeHtml(label)}</strong> ${escapeHtml(value)}</div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function printLogbook(items: EventDebriefRecord[], vendorLabel?: string) {
  const html = buildLogbookPrintHtml(items, vendorLabel);
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

export function getPriorYearDebriefs(
  items: EventDebriefRecord[],
  eventName: string,
  beforeDate: string
): EventDebriefRecord[] {
  const norm = normalizeEventName(eventName);
  return items
    .filter(
      d =>
        normalizeEventName(d.eventName) === norm &&
        d.eventDate < beforeDate &&
        d.status === 'completed'
    )
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate));
}
