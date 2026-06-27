import { BaseScraper, ScrapedEvent } from './base';

export class LongIslandPressScraper extends BaseScraper {
  constructor() {
    super('longislandpress', 'https://events.longislandpress.com');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    $('.event-listing, .event-card, article, .event-item').each((_, el) => {
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
          location: location || null,
          url: link ? new URL(link, this.baseUrl).href : this.baseUrl,
          source: this.name,
        });
      } catch { /* skip */ }
    });

    return events;
  }
}
