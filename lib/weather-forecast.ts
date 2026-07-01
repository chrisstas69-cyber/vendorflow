export interface WeatherSnapshot {
  summary: string;
  highF: number;
  lowF: number;
  precipPct: number;
  condition: string;
}

const WMO_LABELS: Record<number, string> = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Heavy showers',
  95: 'Thunderstorm',
};

export function wmoToCondition(code: number): string {
  return WMO_LABELS[code] ?? 'Mixed';
}

export function formatWeatherSnapshot(s: WeatherSnapshot): string {
  return `${s.highF}° / ${s.lowF}° · ${s.condition} · ${s.precipPct}% rain`;
}

interface GeocodeResult {
  latitude: number;
  longitude: number;
}

export async function geocodePlace(query: string): Promise<GeocodeResult | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query.split(',')[0].trim());
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const data = (await res.json()) as { results?: { latitude: number; longitude: number }[] };
  const hit = data.results?.[0];
  if (!hit) return null;
  return { latitude: hit.latitude, longitude: hit.longitude };
}

export async function fetchWeatherForDate(
  query: string,
  date: string
): Promise<WeatherSnapshot | null> {
  const geo = await geocodePlace(query);
  if (!geo) return null;

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(geo.latitude));
  url.searchParams.set('longitude', String(geo.longitude));
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode');
  url.searchParams.set('timezone', 'America/New_York');
  url.searchParams.set('start_date', date);
  url.searchParams.set('end_date', date);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    daily?: {
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      precipitation_probability_max?: number[];
      weathercode?: number[];
    };
  };

  const highC = data.daily?.temperature_2m_max?.[0];
  const lowC = data.daily?.temperature_2m_min?.[0];
  if (highC == null || lowC == null) return null;

  const highF = Math.round((highC * 9) / 5 + 32);
  const lowF = Math.round((lowC * 9) / 5 + 32);
  const precipPct = Math.round(data.daily?.precipitation_probability_max?.[0] ?? 0);
  const code = data.daily?.weathercode?.[0] ?? 0;
  const condition = wmoToCondition(code);

  return {
    summary: `${highF}° / ${lowF}° · ${condition} · ${precipPct}% rain`,
    highF,
    lowF,
    precipPct,
    condition,
  };
}
