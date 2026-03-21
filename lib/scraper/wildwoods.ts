import { BaseScraper, ScrapedEvent } from './base';

export class WildwoodsScraper extends BaseScraper {
  constructor() {
    super('wildwoods', 'https://www.wildwoodsnj.com/events', 'NJ');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    $('article, .event-item, .views-row, .event-card, [class*="event"], .node, .entry').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('h2, h3, .title, a').first().text().trim();
        const dateText = $el.find('time, .date').first().text().trim() ||
          $el.find('time').attr('datetime') || '';
        const location = $el.find('.location, .venue').first().text().trim();
        const link = $el.find('a').first().attr('href');
        const description = $el.find('.description, .summary, p').first().text().trim();

        if (!title || title.length < 3 || !dateText) return;

        const eventDate = this.parseDate(dateText);
        if (!eventDate || !this.isWithinDaysAhead(eventDate)) return;

        events.push({
          title,
          event_date: eventDate,
          location: location || 'Wildwood, NJ',
          county: 'Cape May',
          url: link ? new URL(link, this.baseUrl).href : this.baseUrl,
          description: description || null,
          source: this.name,
        });
      } catch { /* skip */ }
    });

    return events;
  }
}
