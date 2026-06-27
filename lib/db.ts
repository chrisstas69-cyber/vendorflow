import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'events.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    initDb(_db);
  }
  return _db;
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id        TEXT UNIQUE,
      title           TEXT NOT NULL,
      event_date      TEXT,
      event_time      TEXT,
      location        TEXT,
      town            TEXT,
      county          TEXT,
      source          TEXT,
      url             TEXT,
      description     TEXT,
      is_night_event  INTEGER DEFAULT 0,
      region          TEXT DEFAULT 'Long Island',
      first_seen      TEXT,
      last_seen       TEXT
    );

    CREATE TABLE IF NOT EXISTS scrape_log (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      run_date        TEXT,
      source          TEXT,
      events_found    INTEGER DEFAULT 0,
      new_events      INTEGER DEFAULT 0,
      status          TEXT DEFAULT 'ok',
      notes           TEXT
    );

    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Add new columns (safe to re-run — silently fails if already exists)
  try { db.exec('ALTER TABLE events ADD COLUMN event_type TEXT DEFAULT NULL'); } catch {}
  try { db.exec('ALTER TABLE events ADD COLUMN is_weekend INTEGER DEFAULT 0'); } catch {}
}

export interface EventRow {
  id: number;
  event_id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  town: string | null;
  county: string | null;
  source: string;
  url: string | null;
  description: string | null;
  is_night_event: number;
  region: string;
  event_type: string | null;
  is_weekend: number;
  first_seen: string;
  last_seen: string;
}

export function insertEvent(db: Database.Database, event: {
  event_id: string;
  title: string;
  event_date: string;
  event_time?: string | null;
  location?: string | null;
  town?: string | null;
  county?: string | null;
  source: string;
  url?: string | null;
  description?: string | null;
  is_night_event: number;
  region?: string;
  event_type?: string | null;
  is_weekend?: number;
}): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const existing = db.prepare('SELECT id FROM events WHERE event_id = ?').get(event.event_id);
  if (existing) {
    db.prepare('UPDATE events SET last_seen = ? WHERE event_id = ?').run(today, event.event_id);
    return false;
  }
  db.prepare(`
    INSERT INTO events (event_id, title, event_date, event_time, location, town, county, source, url, description, is_night_event, region, event_type, is_weekend, first_seen, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    event.event_id, event.title, event.event_date, event.event_time || null,
    event.location || null, event.town || null, event.county || null,
    event.source, event.url || null, event.description || null,
    event.is_night_event, event.region || 'Long Island',
    event.event_type || null, event.is_weekend || 0,
    today, today
  );
  return true;
}

export function getEvents(db: Database.Database, opts?: {
  nightOnly?: boolean;
  daysAhead?: number;
  newToday?: boolean;
  region?: string;
  event_type?: string;
  isWeekend?: boolean;
  town?: string;
  query?: string;
  state?: 'NY' | 'NJ';
  limit?: number;
}): EventRow[] {
  let sql = 'SELECT * FROM events WHERE 1=1';
  const params: unknown[] = [];
  const today = new Date().toISOString().slice(0, 10);

  if (opts?.nightOnly) {
    sql += ' AND is_night_event = 1';
  }
  if (opts?.daysAhead) {
    const future = new Date();
    future.setDate(future.getDate() + opts.daysAhead);
    sql += ' AND event_date >= ? AND event_date <= ?';
    params.push(today, future.toISOString().slice(0, 10));
  }
  if (opts?.newToday) {
    sql += ' AND first_seen = ?';
    params.push(today);
  }
  if (opts?.region) {
    sql += ' AND region = ?';
    params.push(opts.region);
  }
  if (opts?.state === 'NJ') {
    sql += " AND region = 'NJ'";
  } else if (opts?.state === 'NY') {
    sql += " AND region != 'NJ'";
  }
  if (opts?.event_type) {
    sql += ' AND event_type = ?';
    params.push(opts.event_type);
  }
  if (opts?.isWeekend) {
    sql += ' AND is_weekend = 1';
  }
  if (opts?.town) {
    const townLike = `%${opts.town}%`;
    sql += ' AND (LOWER(town) LIKE LOWER(?) OR LOWER(location) LIKE LOWER(?) OR LOWER(county) LIKE LOWER(?))';
    params.push(townLike, townLike, townLike);
  }
  if (opts?.query) {
    const qLike = `%${opts.query}%`;
    sql += ' AND (LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?) OR LOWER(town) LIKE LOWER(?) OR LOWER(location) LIKE LOWER(?))';
    params.push(qLike, qLike, qLike, qLike);
  }
  sql += ' ORDER BY event_date ASC, event_time ASC';
  if (opts?.limit) {
    sql += ' LIMIT ?';
    params.push(opts.limit);
  }
  return db.prepare(sql).all(...params) as EventRow[];
}

export function getEventStats(db: Database.Database) {
  const today = new Date().toISOString().slice(0, 10);
  const d30 = new Date(); d30.setDate(d30.getDate() + 30);
  const d90 = new Date(); d90.setDate(d90.getDate() + 90);
  const d7 = new Date(); d7.setDate(d7.getDate() + 7);

  const count = (sql: string, ...p: unknown[]) =>
    (db.prepare(sql).get(...p) as { c: number }).c;

  const total = count('SELECT COUNT(*) as c FROM events');
  const nightTotal = count('SELECT COUNT(*) as c FROM events WHERE is_night_event = 1');
  const next7 = count('SELECT COUNT(*) as c FROM events WHERE event_date >= ? AND event_date <= ?', today, d7.toISOString().slice(0, 10));
  const next30 = count('SELECT COUNT(*) as c FROM events WHERE event_date >= ? AND event_date <= ?', today, d30.toISOString().slice(0, 10));
  const next90 = count('SELECT COUNT(*) as c FROM events WHERE event_date >= ? AND event_date <= ?', today, d90.toISOString().slice(0, 10));
  const newToday = count('SELECT COUNT(*) as c FROM events WHERE first_seen = ?', today);
  const njTotal = count("SELECT COUNT(*) as c FROM events WHERE region = 'NJ'");
  const njNewToday = count("SELECT COUNT(*) as c FROM events WHERE region = 'NJ' AND first_seen = ?", today);
  const fireworksTotal = count("SELECT COUNT(*) as c FROM events WHERE event_type = 'fireworks'");
  const weekendTotal = count('SELECT COUNT(*) as c FROM events WHERE is_weekend = 1 AND event_date >= ?', today);
  const lastScrape = db.prepare('SELECT run_date FROM scrape_log ORDER BY id DESC LIMIT 1').get() as { run_date: string } | undefined;

  return {
    total, nightTotal, next7, next30, next90, newToday,
    njTotal, njNewToday, fireworksTotal, weekendTotal,
    lastScrape: lastScrape?.run_date || 'Never',
  };
}

export function logScrape(db: Database.Database, source: string, found: number, newEvents: number, status: string, notes?: string) {
  const today = new Date().toISOString().slice(0, 10);
  db.prepare('INSERT INTO scrape_log (run_date, source, events_found, new_events, status, notes) VALUES (?, ?, ?, ?, ?, ?)').run(today, source, found, newEvents, status, notes || null);
}
