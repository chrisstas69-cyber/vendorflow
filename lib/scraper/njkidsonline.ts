import { BaseScraper, ScrapedEvent } from './base';

export class NJKidsOnlineScraper extends BaseScraper {
  constructor() {
    super('njkidsonline', 'https://www.njkidsonline.com/events/', 'NJ');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    $('article, .event-item, .entry, .post, .tribe-events-calendar-list__event, [class*="event"]').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('h2, h3, .title, .tribe-events-calendar-list__event-title, a').first().text().trim();
        const dateText = $el.find('time, .date, .tribe-events-calendar-list__event-date-tag').first().text().trim() ||
          $el.find('time').attr('datetime') || '';
        const location = $el.find('.location, .venue, .tribe-events-calendar-list__event-venue').first().text().trim();
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
        });
      } catch { /* skip */ }
    });

    return events;
  }
}
