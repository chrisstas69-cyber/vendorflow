import { BaseScraper, ScrapedEvent } from './base';

export class FairsAndFestivalsNJScraper extends BaseScraper {
  constructor() {
    super('fairsandfestivals-nj', 'https://fairsandfestivals.net/states/NJ', 'NJ');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    $('table tr, .event-row, .fair-listing').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('td:first-child, .name').first().text().trim();
        const dateText = $el.find('td:nth-child(2), .dates').first().text().trim();
        const location = $el.find('td:nth-child(3), .location').first().text().trim();
        const link = $el.find('a').first().attr('href');

        if (!title || !dateText) return;

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
