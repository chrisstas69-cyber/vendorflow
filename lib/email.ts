import nodemailer from 'nodemailer';
import { getDb, getEvents, getEventStats } from './db';

function formatEventList(events: { event_date: string; event_time: string | null; title: string; location: string | null; is_night_event: number; url: string | null; event_type: string | null }[]) {
  if (events.length === 0) return '<li>None</li>';
  return events.map(e => {
    const typeTag = e.event_type ? ` [${e.event_type.replace('_', ' ')}]` : '';
    return `<li><strong>${e.event_date}</strong>${e.event_time ? ` ${e.event_time}` : ''} — ${e.title}${e.location ? `, ${e.location}` : ''}${e.is_night_event ? ' 🌙' : ''}${typeTag}${e.url ? ` — <a href="${e.url}">Link</a>` : ''}</li>`;
  }).join('\n');
}

export async function sendDailyDigest() {
  const from = process.env.GMAIL_FROM;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.GMAIL_TO;
  if (!from || !pass || !to) throw new Error('Email credentials not configured');

  const db = getDb();
  const newToday = getEvents(db, { newToday: true });
  const weekEvents = getEvents(db, { daysAhead: 7 });
  const nightEvents = getEvents(db, { nightOnly: true, daysAhead: 30 });
  const fireworks = getEvents(db, { event_type: 'fireworks' });
  const stats = getEventStats(db);

  // Split by region
  const newNY = newToday.filter(e => e.region !== 'NJ');
  const newNJ = newToday.filter(e => e.region === 'NJ');
  const weekNY = weekEvents.filter(e => e.region !== 'NJ');
  const weekNJ = weekEvents.filter(e => e.region === 'NJ');
  const nightNY = nightEvents.filter(e => e.region !== 'NJ');
  const nightNJ = nightEvents.filter(e => e.region === 'NJ');

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const sheetUrl = process.env.GOOGLE_SPREADSHEET_ID
    ? `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SPREADSHEET_ID}`
    : '#';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1e3a5f;">🎪 NY & NJ Event Tracker</h1>
      <p style="color: #666;">${today}</p>

      <h2 style="color: #1d4ed8;">🗽 New York — ${newNY.length} New Events</h2>
      <ul>${formatEventList(newNY)}</ul>

      <h2 style="color: #1d4ed8;">📅 NY This Week</h2>
      <ul>${formatEventList(weekNY)}</ul>

      <h2 style="color: #f59e0b;">🌙 NY Night Events (5 PM+)</h2>
      <ul>${formatEventList(nightNY)}</ul>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

      <h2 style="color: #dc2626;">🏖️ New Jersey — ${newNJ.length} New Events</h2>
      <ul>${formatEventList(newNJ)}</ul>

      <h2 style="color: #dc2626;">📅 NJ This Week</h2>
      <ul>${formatEventList(weekNJ)}</ul>

      <h2 style="color: #f59e0b;">🌙 NJ Night Events (5 PM+)</h2>
      <ul>${formatEventList(nightNJ)}</ul>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

      ${fireworks.length > 0 ? `
      <h2 style="color: #dc2626;">🎆 Fireworks (Both States)</h2>
      <ul>${formatEventList(fireworks)}</ul>
      ` : ''}

      <h2 style="color: #1d4ed8;">📊 Stats</h2>
      <ul>
        <li>Total events tracked: ${stats.total}</li>
        <li>Night events: ${stats.nightTotal}</li>
        <li>NJ events: ${stats.njTotal}</li>
        <li>Fireworks: ${stats.fireworksTotal}</li>
        <li>Weekend events: ${stats.weekendTotal}</li>
        <li>Next 30 days: ${stats.next30}</li>
        <li>Next 90 days: ${stats.next90}</li>
      </ul>

      <p><a href="${sheetUrl}" style="color: #1d4ed8; font-weight: bold;">View Full Sheet</a></p>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">NY & NJ Event Tracker — LED Toy Vendor Street Fair Finder</p>
    </div>
  `;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: from, pass },
  });

  await transporter.sendMail({
    from,
    to,
    subject: `🎪 Events Update — ${newNY.length} NY + ${newNJ.length} NJ New Events (${today})`,
    html,
  });

  return { sent: true, newEvents: newToday.length };
}
