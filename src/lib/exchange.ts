import db, { type Item } from './db';
import { addDays, effectiveExpiry, todayISO } from './dates';

/** Trigger a client-side file download. */
export function download(filename: string, text: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── iCalendar ─────────────────────────────────────────────────────
// Reminders without a push server: export an .ics, import it into any
// calendar app, and the calendar does the notifying. Each item becomes
// an all-day event on its effective expiry date with a 2-days-before alarm.

function icsEscape(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function icsDate(iso: string): string {
  return iso.replace(/-/g, '');
}

function foldLine(line: string): string {
  // RFC 5545 §3.1: lines longer than 75 octets should be folded.
  const chunks: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    chunks.push(rest.slice(0, 74));
    rest = ' ' + rest.slice(74);
  }
  chunks.push(rest);
  return chunks.join('\r\n');
}

export function buildICS(items: Item[]): string {
  const now = new Date();
  const dtstamp =
    now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//perish//perish 0.1//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:perish — expiry dates'
  ];

  for (const it of items) {
    const eff = effectiveExpiry(it);
    lines.push(
      'BEGIN:VEVENT',
      `UID:perish-${it.id}-${icsDate(eff)}@perish.local`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${icsDate(eff)}`,
      `DTEND;VALUE=DATE:${icsDate(addDays(eff, 1))}`,
      foldLine(`SUMMARY:${icsEscape(it.name)} expires`),
      foldLine(
        `DESCRIPTION:${icsEscape(
          `${it.name} (${it.category}) reaches its date today. Logged in perish.`
        )}`
      ),
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      foldLine(`DESCRIPTION:${icsEscape(it.name)} expires in 2 days`),
      'TRIGGER:-P2D',
      'END:VALARM',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

// ── JSON backup ───────────────────────────────────────────────────

export interface Backup {
  app: 'perish';
  version: 1;
  exportedAt: string;
  items: Item[];
}

export async function exportJSON(): Promise<void> {
  const items = await db.items.toArray();
  const backup: Backup = {
    app: 'perish',
    version: 1,
    exportedAt: new Date().toISOString(),
    items
  };
  download(
    `perish-backup-${todayISO()}.json`,
    JSON.stringify(backup, null, 2),
    'application/json'
  );
}

const CATEGORY_IDS = new Set([
  'food',
  'medicine',
  'care',
  'document',
  'warranty',
  'subscription',
  'home',
  'other'
]);

/** Returns the number of items imported, or throws with a readable message. */
export async function importJSON(text: string): Promise<number> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  const maybe = parsed as Partial<Backup>;
  if (!maybe || maybe.app !== 'perish' || !Array.isArray(maybe.items)) {
    throw new Error('That file is not a perish backup.');
  }
  const clean = maybe.items
    .filter(
      (it): it is Item =>
        !!it &&
        typeof it.name === 'string' &&
        typeof it.expiresOn === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(it.expiresOn)
    )
    .map((it) => {
      const { id: _drop, ...rest } = it;
      return {
        ...rest,
        category: CATEGORY_IDS.has(rest.category) ? rest.category : 'other',
        status:
          rest.status === 'used' || rest.status === 'wasted'
            ? rest.status
            : 'active',
        createdAt: rest.createdAt || todayISO()
      };
    });
  if (clean.length === 0) throw new Error('No usable items found in that file.');
  await db.items.bulkAdd(clean as Item[]);
  return clean.length;
}
