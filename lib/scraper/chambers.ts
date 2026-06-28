import { BaseScraper, ScrapedEvent } from './base';
import { loadChamberListFromFile } from '@/lib/import/chamber-list';

export class ChambersScraper extends BaseScraper {
  constructor() {
    super('chambers', '');
  }

  async run(): Promise<{ events: ScrapedEvent[]; error?: string }> {
    const chambers = loadChamberListFromFile();
    if (chambers.length === 0) {
      return { events: [], error: 'chamber_list.csv not found or empty' };
    }

    // Scrape 8 chambers per run — rotate through full list over time
    const dayBucket = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    const start = (dayBucket * 8) % chambers.length;
    const selected = [
      ...chambers.slice(start, start + 8),
      ...chambers.slice(0, Math.max(0, start + 8 - chambers.length)),
    ].slice(0, 8);

    const allEvents: ScrapedEvent[] = [];
    const errors: string[] = [];

    for (const chamber of selected) {
      try {
        const html = await this.fetch(chamber.eventsUrl);
        const events = this.parseChamber(html, chamber);
        allEvents.push(...events);
        await new Promise(r => setTimeout(r, 1500));
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
    return this.parseChamber(html, {
      name: '',
      url: '',
      town: '',
      county: '',
      eventsUrl: '',
    });
  }

  private parseChamber(
    html: string,
    chamber: { town: string; county: string; name: string; url: string; eventsUrl: string }
  ): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

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
      } catch {
        /* skip */
      }
    });

    return events;
  }
}
