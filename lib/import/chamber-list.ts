/** Shared parser for chamber_list.csv — supports tracker + legacy VendorFlow formats */

import fs from 'fs';
import path from 'path';

export interface ChamberListRecord {
  id: string;
  name: string;
  url: string;
  town: string;
  county: string;
  eventsUrl: string;
  notes?: string;
  status?: string;
  lastChecked?: string;
  source: 'tracker' | 'legacy';
  sourceFile?: string;
  rowIndex?: number;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeCounty(county: string): string {
  return county.toLowerCase().replace(/\s+county$/i, '').trim();
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function detectFormat(header: string[]): 'tracker' | 'legacy' {
  const h = header.map(x => x.toLowerCase());
  if (h.includes('name') && h.includes('url') && h.includes('town')) return 'tracker';
  return 'legacy';
}

export function loadChamberListFromFile(filePath?: string): ChamberListRecord[] {
  const csvPath = filePath ?? path.join(process.cwd(), 'data', 'chamber_list.csv');
  if (!fs.existsSync(csvPath)) return [];

  const raw = fs.readFileSync(csvPath, 'utf-8');
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]);
  const format = detectFormat(header);

  const records: ChamberListRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cols = parseCsvLine(line);
    const rowIndex = i + 1;
    if (format === 'tracker') {
      const row: Record<string, string> = {};
      header.forEach((h, i) => {
        row[h.toLowerCase()] = cols[i] ?? '';
      });
      const name = row.name ?? '';
      const url = row.url ?? '';
      if (!name || !url) continue;
      const calendarPath = row.calendar_path ?? '';
      const eventsUrl = calendarPath
        ? calendarPath.startsWith('http')
          ? calendarPath
          : new URL(calendarPath, url).href
        : url;
      records.push({
        id: `chamber-${slugify(name)}`,
        name: name.includes('Chamber') ? name : `${name} Chamber of Commerce`,
        url,
        town: row.town ?? '',
        county: normalizeCounty(row.county ?? ''),
        eventsUrl,
        notes: [row.notes, row.review_note].filter(Boolean).join(' · ') || undefined,
        status: row.status || undefined,
        lastChecked: row.last_checked || undefined,
        source: 'tracker',
        sourceFile: path.basename(csvPath),
        rowIndex,
      });
    } else {
      const [town, county, name, url, eventsUrl] = cols;
      if (!name || !url) continue;
      records.push({
        id: `chamber-${slugify(name)}`,
        name,
        url,
        town: town ?? '',
        county: normalizeCounty(county ?? ''),
        eventsUrl: eventsUrl || url,
        source: 'legacy',
        sourceFile: path.basename(csvPath),
        rowIndex,
      });
    }
  }

  return records;
}

export function countyToRegion(county: string): 'nassau' | 'suffolk' | 'nyc' | 'nj' {
  const c = county.toLowerCase();
  if (c === 'nassau') return 'nassau';
  if (c === 'suffolk') return 'suffolk';
  if (c.includes('nj') || c.includes('hudson') || c.includes('bergen')) return 'nj';
  return 'nassau';
}
