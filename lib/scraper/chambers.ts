import { BaseScraper, ScrapedEvent } from './base';
import fs from 'fs';
import path from 'path';

interface ChamberEntry {
  town: string;
  county: string;
  name: string;
  url: string;
  eventsUrl: string;
}

export class ChambersScraper extends BaseScraper {
  constructor() {
    super('chambers', '');
  }

  async run(): Promise<{ events: ScrapedEvent[]; error?: string }> {
    const csvPath = path.join(process.cwd(), 'data', 'chamber_list.csv');
    if (!fs.existsSync(csvPath)) {
      return { events: [], error: 'chamber_list.csv not found' };
    }

    const csv = fs.readFileSync(csvPath, 'utf-8');
    const lines = csv.split('\n').slice(1).filter(l => l.trim());
    const chambers: ChamberEntry[] = lines.map(line => {
      const [town, county, name, url, eventsUrl] = line.split(',').map(s => s.trim());
      return { town, county, name, url, eventsUrl };
    }).filter(c => c.eventsUrl);

    // Scrape 5 random chambers per run to avoid rate limiting
    const selected = chambers.sort(() => Math.random() - 0.5).slice(0, 5);
    const allEvents: ScrapedEvent[] = [];
    const errors: string[] = [];

    for (const chamber of selected) {
      try {
        const html = await this.fetch(chamber.eventsUrl);
        const events = this.parseChamber(html, chamber);
        allEvents.push(...events);
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        errors.push(`${chamber.town}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return {
      events: allEvents,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };
  }

  parse(html: string): ScrapedEvent[] {
    return this.parseChamber(html, { town: '', county: '', name: '', url: '', eventsUrl: '' });
  }

  private parseChamber(html: string, chamber: ChamberEntry): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    // Chamber sites vary widely — look for common event calendar patterns
    $('article, .event, .event-item, .calendar-event, tr, li').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('h2, h3, h4, .title, .event-name, td:first-child a').first().text().trim();
        const dateText = $el.find('.date, time, .event-date, td:nth-child(2)').first().text().trim();
        const link = $el.find('a').first().attr('href');

        if (!title || title.length < 5 || !dateText) return;
        const eventDate = this.parseDate(dateText);
        if (!eventDate || !this.isWithinDaysAhead(eventDate)) return;

        events.push({
          title,
          event_date: eventDate,
          town: chamber.town,
          county: chamber.county,
          url: link ? new URL(link, chamber.url).href : chamber.eventsUrl,
          source: `chamber_${chamber.town.toLowerCase().replace(/\s+/g, '_')}`,
        });
      } catch { /* skip */ }
    });

    return events;
  }
}
