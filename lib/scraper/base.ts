import * as cheerio from 'cheerio';

export interface ScrapedEvent {
  title: string;
  event_date: string; // YYYY-MM-DD
  event_time?: string | null;
  location?: string | null;
  town?: string | null;
  county?: string | null;
  url?: string | null;
  description?: string | null;
  source: string;
  region?: string;
  event_type?: string | null;
}

export abstract class BaseScraper {
  name: string;
  baseUrl: string;
  region: string;

  constructor(name: string, baseUrl: string, region = 'Long Island') {
    this.name = name;
    this.baseUrl = baseUrl;
    this.region = region;
  }

  async fetch(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
      return await res.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  load(html: string) {
    return cheerio.load(html);
  }

  abstract parse(html: string): ScrapedEvent[];

  async run(): Promise<{ events: ScrapedEvent[]; error?: string }> {
    try {
      const html = await this.fetch(this.baseUrl);
      const events = this.parse(html);
      return { events };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[${this.name}] Scrape failed: ${msg}`);
      return { events: [], error: msg };
    }
  }

  protected parseDate(dateStr: string): string | null {
    if (!dateStr) return null;
    const clean = dateStr.trim();

    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

    // Try native Date parse
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
    return null;
  }

  protected isWithinDaysAhead(dateStr: string, days = 90): boolean {
    const eventDate = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const future = new Date(now);
    future.setDate(future.getDate() + days);
    return eventDate >= now && eventDate <= future;
  }
}
