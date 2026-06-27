import crypto from 'crypto';

export function makeEventId(title: string, date: string, location: string | null): string {
  const titleClean = title.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  const dateClean = date; // YYYY-MM-DD
  const locationClean = (location || '').toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  const key = `${titleClean}|${dateClean}|${locationClean}`;
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
}
