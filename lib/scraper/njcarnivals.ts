import { BaseScraper, ScrapedEvent } from './base';

export class NJCarnivalsScraper extends BaseScraper {
  constructor() {
    super('nj-carnivals', 'https://nj-carnivals.com', 'NJ');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    $('table tr, .event-item, .carnival-listing, article, .entry').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('td:first-child, h2, h3, .title, a').first().text().trim();
        const dateText = $el.find('td:nth-child(2), .date, time').first().text().trim();
        const location = $el.find('td:nth-child(3), .location, .venue').first().text().trim();
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
