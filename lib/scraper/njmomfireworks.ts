import { BaseScraper, ScrapedEvent } from './base';

export class NJMomFireworksScraper extends BaseScraper {
  constructor() {
    super('njmom-fireworks', 'https://njmom.com/things-to-do/fireworks-in-new-jersey/', 'NJ');
  }

  parse(html: string): ScrapedEvent[] {
    const $ = this.load(html);
    const events: ScrapedEvent[] = [];

    // njmom.com typically lists fireworks in article content with dates/locations
    $('article, .entry-content p, .entry-content li, .wp-block-list li, h2, h3').each((_, el) => {
      try {
        const $el = $(el);
        const text = $el.text().trim();
        if (!text || text.length < 10) return;

        // Look for date patterns in the text
        const dateMatch = text.match(/(\w+ \d{1,2},?\s*\d{4})|(\d{1,2}\/\d{1,2}\/\d{4})/);
        if (!dateMatch) return;

        const eventDate = this.parseDate(dateMatch[0]);
        if (!eventDate || !this.isWithinDaysAhead(eventDate)) return;

        // Extract title — use first sentence or heading
        const title = text.split(/[.!]/).find(s => s.length > 5)?.trim() || text.slice(0, 100);
        const link = $el.find('a').first().attr('href') || $el.closest('a').attr('href');

        events.push({
          title,
          event_date: eventDate,
          location: null,
          url: link ? new URL(link, this.baseUrl).href : this.baseUrl,
          source: this.name,
          event_type: 'fireworks',
        });
      } catch { /* skip */ }
    });

    return events;
  }
}
