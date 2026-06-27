import { BaseScraper, ScrapedEvent } from './base';

export class NJMomScraper extends BaseScraper {
  constructor() {
    super('njmom', 'https://njmom.com/things-to-do/events/', 'NJ');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    $('article, .event-item, .entry, .post, [class*="event"], .wp-block-list li').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('h2, h3, .title, a').first().text().trim();
        const dateText = $el.find('time, .date').first().text().trim() ||
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
          url: link ? new URL(link, this.baseUrl).href : this.baseUrl,
          source: this.name,
        });
      } catch { /* skip */ }
    });

    return events;
  }
}
