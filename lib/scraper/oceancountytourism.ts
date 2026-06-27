import { BaseScraper, ScrapedEvent } from './base';

export class OceanCountyTourismScraper extends BaseScraper {
  constructor() {
    super('ocean-county-tourism', 'https://www.oceancountytourism.com/events', 'NJ');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    $('article, .event-item, .views-row, .event-card, [class*="event"], .node').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('h2, h3, .title, a').first().text().trim();
        const dateText = $el.find('time, .date, .field--name-field-date').first().text().trim() ||
          $el.find('time').attr('datetime') || '';
        const location = $el.find('.location, .venue').first().text().trim();
        const link = $el.find('a').first().attr('href');

        if (!title || title.length < 3 || !dateText) return;

        const eventDate = this.parseDate(dateText);
        if (!eventDate || !this.isWithinDaysAhead(eventDate)) return;

        events.push({
          title,
          event_date: eventDate,
          location: location || null,
          county: 'Ocean',
          url: link ? new URL(link, this.baseUrl).href : this.baseUrl,
          source: this.name,
        });
      } catch { /* skip */ }
    });

    return events;
  }
}
