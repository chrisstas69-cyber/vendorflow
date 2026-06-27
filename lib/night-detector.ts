const NIGHT_KEYWORDS = [
  'evening', 'night', 'dusk', 'sunset', 'after dark',
  'nighttime', 'twilight', 'glow', 'illuminated', 'lights', 'led',
  'outdoor movie', 'movie night', 'lantern', 'firework', 'fireworks',
  'pyrotechnic', 'luminaria', 'glow walk', 'light show',
];

export function parseHour(timeStr: string): number | null {
  if (!timeStr) return null;
  const clean = timeStr.trim().toLowerCase();

  // "5:00 PM", "5 PM", "5:30pm"
  const match12 = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    if (match12[3] === 'pm' && hour !== 12) hour += 12;
    if (match12[3] === 'am' && hour === 12) hour = 0;
    return hour;
  }

  // "17:00", "17"
  const match24 = clean.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (match24) {
    const hour = parseInt(match24[1], 10);
    if (hour >= 0 && hour <= 23) return hour;
  }

  return null;
}

export function isNightEvent(timeStr: string | null, description?: string | null): { isNight: boolean; confidence: 'time_confirmed' | 'keyword_inferred' | 'none' } {
  if (timeStr) {
    const hour = parseHour(timeStr);
    if (hour !== null && hour >= 17) {
      return { isNight: true, confidence: 'time_confirmed' };
    }
    if (hour !== null) {
      return { isNight: false, confidence: 'none' };
    }
  }

  if (description) {
    const lower = description.toLowerCase();
    for (const kw of NIGHT_KEYWORDS) {
      if (lower.includes(kw)) {
        return { isNight: true, confidence: 'keyword_inferred' };
      }
    }
  }

  return { isNight: false, confidence: 'none' };
}
