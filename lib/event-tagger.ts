const TYPE_KEYWORDS: [string, string[]][] = [
  ['fireworks', ['firework', 'fireworks', 'pyrotechnic', 'sparkle sky', 'july 4th fireworks', '4th of july fireworks']],
  ['outdoor_movie', ['outdoor movie', 'movie night', 'movies in the park', 'film under', 'cinema under', 'movie under the stars']],
  ['light_festival', ['lantern festival', 'lantern fest', 'light show', 'glow walk', 'illumination', 'luminaria', 'lights fest', 'water lantern', 'night lights']],
  ['carnival', ['carnival', 'amusement', 'rides and games', 'midway', 'funfair']],
  ['street_fair', ['street fair', 'sidewalk sale', 'block party', 'street festival']],
  ['festival', ['festival', 'fest ', ' fest', 'festiva']],
];

export function detectEventType(title: string, description?: string | null): string | null {
  const text = `${title} ${description || ''}`.toLowerCase();
  for (const [type, keywords] of TYPE_KEYWORDS) {
    for (const kw of keywords) {
      if (text.includes(kw)) return type;
    }
  }
  return null;
}

export function detectIsWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  return day === 0 || day === 6;
}

const NJ_INDICATORS = [
  'new jersey', ', nj', ' nj ', 'newark', 'jersey city', 'atlantic city',
  'cape may', 'wildwood', 'seaside', 'asbury park', 'trenton', 'princeton',
  'hoboken', 'morristown', 'toms river', 'ocean county', 'bergen county',
  'essex county', 'hudson county', 'middlesex county', 'monmouth county',
  'morris county', 'passaic county', 'union county', 'burlington county',
  'camden county', 'gloucester county', 'mercer county', 'somerset county',
  'sussex county', 'warren county', 'hunterdon county', 'cumberland county',
  'salem county', 'atlantic county',
];

export function detectRegionFromLocation(locationText: string, defaultRegion: string): string {
  const lower = locationText.toLowerCase();
  if (NJ_INDICATORS.some(k => lower.includes(k))) return 'NJ';
  return defaultRegion;
}
