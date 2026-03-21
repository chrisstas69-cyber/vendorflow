import { BaseScraper, ScrapedEvent } from './base';

export class DiscoverLongIslandScraper extends BaseScraper {
  constructor() {
    super('discoverlongisland', 'https://www.discoverlongisland.com/events/');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    // Official LI tourism board — structured event cards
    $('.event-card, .event-listing, article, .card').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('h2, h3, .event-title, .card-title').first().text().trim();
        const dateText = $el.find('.date, time, .event-date').first().text().trim();
        const location = $el.find('.location, .venue').first().text().trim();
        const desc = $el.find('.description, .excerpt, p').first().text().trim();
        const link = $el.find('a').first().attr('href');

        if (!title || !dateText) return;
        const eventDate = this.parseDate(dateText);
        if (!eventDate || !this.isWithinDaysAhead(eventDate)) return;

        events.push({
          title,
          event_date: eventDate,
          location: location || null,
          description: desc || null,
          url: link ? new URL(link, this.baseUrl).href : this.baseUrl,
          source: this.name,
        });
      } catch { /* skip */ }
    });

    return events;
  }
}
