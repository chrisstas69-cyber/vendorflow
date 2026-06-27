import { BaseScraper, ScrapedEvent } from './base';
import { detectRegionFromLocation } from '../event-tagger';

export class MelroseScraper extends BaseScraper {
  constructor() {
    super('melrose', 'https://melrosepyrotechnics.com/schedule', 'Long Island');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    $('article, .event-item, .event, .entry, table tr, [class*="event"], [class*="schedule"]').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('h2, h3, h4, td:first-child, .title, a').first().text().trim();
        const dateText = $el.find('time, .date, td:nth-child(2)').first().text().trim() ||
          $el.find('time').attr('datetime') || '';
        const location = $el.find('.location, .venue, td:nth-child(3)').first().text().trim();
        const link = $el.find('a').first().attr('href');

        if (!title || title.length < 3 || !dateText) return;

        const eventDate = this.parseDate(dateText);
        if (!eventDate || !this.isWithinDaysAhead(eventDate)) return;

        const region = detectRegionFromLocation(location || title, this.region);

        events.push({
          title: `Melrose Fireworks: ${title}`,
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
