import { google } from 'googleapis';
import { getDb, getEvents, getEventStats, EventRow } from './db';

function getAuth() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured');
  const creds = JSON.parse(json);
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  fireworks: 'Fireworks',
  street_fair: 'Street Fair',
  festival: 'Festival',
  carnival: 'Carnival',
  outdoor_movie: 'Outdoor Movie',
  light_festival: 'Light Festival',
};

function formatEventRow(e: EventRow): string[] {
  return [
    e.event_date,
    e.event_time || '',
    e.is_night_event ? '🌙' : '',
    e.event_type ? EVENT_TYPE_LABELS[e.event_type] || e.event_type : '',
    e.title,
    e.location || '',
    e.town || '',
    e.county || '',
    e.region,
    e.source,
    e.url || '',
  ];
}

const HEADERS = ['Date', 'Time', 'Night?', 'Type', 'Event Name', 'Location', 'Town', 'County', 'Region', 'Source', 'Link'];

export async function updateAllTabs() {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error('GOOGLE_SPREADSHEET_ID not configured');

  const db = getDb();
  const allEvents = getEvents(db);
  const nightEvents = getEvents(db, { nightOnly: true });
  const weekEvents = getEvents(db, { daysAhead: 7 });
  const newToday = getEvents(db, { newToday: true });
  const njEvents = getEvents(db, { region: 'NJ' });
  const njNightEvents = getEvents(db, { nightOnly: true, region: 'NJ' });
  const njNewToday = getEvents(db, { newToday: true, region: 'NJ' });
  const fireworksNY = getEvents(db, { event_type: 'fireworks', region: 'Long Island' });
  const fireworksNJ = getEvents(db, { event_type: 'fireworks', region: 'NJ' });
  const weekendEvents = getEvents(db, { isWeekend: true });
  const stats = getEventStats(db);

  // Get existing sheet names
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheets = meta.data.sheets?.map(s => s.properties?.title) || [];
  const tabNames = [
    '📋 All Events', '🆕 New Today', '📅 This Week', '📆 By Month', '🌙 Night Events',
    '🎆 Fireworks — NY', '🎆 Fireworks — NJ',
    '📋 NJ Events — All', '🌙 NJ Night Events', '🆕 NJ New Today',
    '🗓️ Weekend Events',
    '📊 Stats',
  ];

  // Create missing tabs
  for (const tab of tabNames) {
    if (!existingSheets.includes(tab)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: tab } } }],
        },
      });
    }
  }

  // Update each tab
  const updates = [
    { range: "'📋 All Events'!A1", values: [HEADERS, ...allEvents.map(formatEventRow)] },
    { range: "'🆕 New Today'!A1", values: [HEADERS, ...newToday.map(formatEventRow)] },
    { range: "'📅 This Week'!A1", values: [HEADERS, ...weekEvents.map(formatEventRow)] },
    { range: "'🌙 Night Events'!A1", values: [HEADERS, ...nightEvents.map(formatEventRow)] },
    { range: "'🎆 Fireworks — NY'!A1", values: [HEADERS, ...fireworksNY.map(formatEventRow)] },
    { range: "'🎆 Fireworks — NJ'!A1", values: [HEADERS, ...fireworksNJ.map(formatEventRow)] },
    { range: "'📋 NJ Events — All'!A1", values: [HEADERS, ...njEvents.map(formatEventRow)] },
    { range: "'🌙 NJ Night Events'!A1", values: [HEADERS, ...njNightEvents.map(formatEventRow)] },
    { range: "'🆕 NJ New Today'!A1", values: [HEADERS, ...njNewToday.map(formatEventRow)] },
    { range: "'🗓️ Weekend Events'!A1", values: [HEADERS, ...weekendEvents.map(formatEventRow)] },
    {
      range: "'📊 Stats'!A1",
      values: [
        ['Stat', 'Value'],
        ['Total Events', stats.total.toString()],
        ['Night Events', stats.nightTotal.toString()],
        ['NJ Events', stats.njTotal.toString()],
        ['Fireworks Events', stats.fireworksTotal.toString()],
        ['Weekend Events', stats.weekendTotal.toString()],
        ['Next 7 Days', stats.next7.toString()],
        ['Next 30 Days', stats.next30.toString()],
        ['Next 90 Days', stats.next90.toString()],
        ['New Today (All)', stats.newToday.toString()],
        ['New Today (NJ)', stats.njNewToday.toString()],
        ['Last Scrape', stats.lastScrape],
      ],
    },
  ];

  // Build "By Month" tab with month headers
  const byMonth: string[][] = [HEADERS];
  const months: Record<string, EventRow[]> = {};
  for (const e of allEvents) {
    const month = e.event_date.slice(0, 7);
    if (!months[month]) months[month] = [];
    months[month].push(e);
  }
  for (const [month, events] of Object.entries(months).sort()) {
    const d = new Date(month + '-01');
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    byMonth.push([`--- ${label} ---`, '', '', '', '', '', '', '', '', '', '']);
    byMonth.push(...events.map(formatEventRow));
  }
  updates.push({ range: "'📆 By Month'!A1", values: byMonth });

  // Clear and write each tab
  for (const update of updates) {
    const sheetName = update.range.split('!')[0].replace(/'/g, '');
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: sheetName });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: update.range,
      valueInputOption: 'RAW',
      requestBody: { values: update.values },
    });
  }

  return { tabsUpdated: updates.length, totalEvents: allEvents.length };
}
