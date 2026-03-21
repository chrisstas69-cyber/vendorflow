import { BaseScraper, ScrapedEvent } from './base';

export class DreamlandScraper extends BaseScraper {
  constructor() {
    super('dreamland', 'https://www.dreamlandamusements.com/schedule', 'Long Island');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    $('article, .event-item, .event, table tr, [class*="event"], [class*="schedule"], .entry').each((_, el) => {
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

        events.push({
          title,
          event_date: eventDate,
          location: location || null,
          url: link ? new URL(link, this.baseUrl).href : this.baseUrl,
          source: this.name,
          event_type: 'carnival',
        });
      } catch { /* skip */ }
    });

    return events;
  }
}
