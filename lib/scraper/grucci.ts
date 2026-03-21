import { BaseScraper, ScrapedEvent } from './base';
import { detectRegionFromLocation } from '../event-tagger';

export class GrucciScraper extends BaseScraper {
  constructor() {
    super('grucci', 'https://www.grucci.com/events', 'Long Island');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    $('article, .event-item, .event, .entry, .post, .views-row, [class*="event"]').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('h2, h3, h4, .title, a').first().text().trim();
        const dateText = $el.find('time, .date, .event-date').first().text().trim() ||
          $el.find('time').attr('datetime') || '';
        const location = $el.find('.location, .venue, .event-location').first().text().trim();
        const link = $el.find('a').first().attr('href');

        if (!title || title.length < 3 || !dateText) return;

        const eventDate = this.parseDate(dateText);
        if (!eventDate || !this.isWithinDaysAhead(eventDate)) return;

        const region = detectRegionFromLocation(location || title, this.region);

        events.push({
          title: `Grucci Fireworks: ${title}`,
          event_date: eventDate,
          location: location || null,
          url: link ? new URL(link, this.baseUrl).href : this.baseUrl,
          source: this.name,
          event_type: 'fireworks',
          region,
        });
      } catch { /* skip */ }
    });

    return events;
  }
}
