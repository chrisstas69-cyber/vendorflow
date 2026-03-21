import { BaseScraper, ScrapedEvent } from './base';

const PATCH_TOWNS = [
  { slug: 'huntington', name: 'Huntington', county: 'Suffolk' },
  { slug: 'babylon', name: 'Babylon', county: 'Suffolk' },
  { slug: 'patchogue', name: 'Patchogue', county: 'Suffolk' },
  { slug: 'smithtown', name: 'Smithtown', county: 'Suffolk' },
  { slug: 'massapequa', name: 'Massapequa', county: 'Nassau' },
  { slug: 'garden-city', name: 'Garden City', county: 'Nassau' },
  { slug: 'hempstead', name: 'Hempstead', county: 'Nassau' },
];

export class PatchScraper extends BaseScraper {
  constructor() {
    super('patch', 'https://patch.com/new-york');
  }

  async run(): Promise<{ events: ScrapedEvent[]; error?: string }> {
    const allEvents: ScrapedEvent[] = [];
    const errors: string[] = [];

    // Scrape 3 random towns per run to avoid rate limiting
    const towns = PATCH_TOWNS.sort(() => Math.random() - 0.5).slice(0, 3);

    for (const town of towns) {
      try {
        const url = `https://patch.com/new-york/${town.slug}/calendar`;
        const html = await this.fetch(url);
        const events = this.parseTown(html, town);
        allEvents.push(...events);
        // Rate limit: 2s between towns
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        errors.push(`${town.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return {
      events: allEvents,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };
  }

  parse(html: string): ScrapedEvent[] {
    // Not used directly — run() handles multi-town logic
    return this.parseTown(html, { name: '', county: '' });
  }

  private parseTown(html: string, town: { name: string; county: string }): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    $('.event-card, .calendar-event, article, [data-type="event"]').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('h2, h3, .event-title, .title').first().text().trim();
        const dateText = $el.find('.date, time, .event-date').first().text().trim();
        const timeText = $el.find('.time, .event-time').first().text().trim();
        const location = $el.find('.location, .venue').first().text().trim();
        const link = $el.find('a').first().attr('href');

        if (!title || !dateText) return;
        const eventDate = this.parseDate(dateText);
        if (!eventDate || !this.isWithinDaysAhead(eventDate)) return;

        events.push({
          title,
          event_date: eventDate,
          event_time: timeText || null,
          location: location || town.name,
          town: town.name,
          county: town.county,
          url: link ? new URL(link, 'https://patch.com').href : `https://patch.com/new-york/${town.name.toLowerCase()}`,
          source: this.name,
        });
      } catch { /* skip */ }
    });

    return events;
  }
}
