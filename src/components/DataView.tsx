import { useRef, useState } from 'react';
import db, { type Item } from '../lib/db';
import { todayISO } from '../lib/dates';
import { buildICS, download, exportJSON, importJSON } from '../lib/exchange';

interface Props {
  items: Item[];
}

export default function DataView({ items }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const active = items.filter((i) => i.status === 'active');
  const resolved = items.filter((i) => i.status !== 'active');

  function exportICS() {
    if (active.length === 0) {
      setMsg('Nothing on the shelf to export yet.');
      return;
    }
    download(
      `perish-calendar-${todayISO()}.ics`,
      buildICS(active),
      'text/calendar'
    );
    setMsg(
      `Exported ${active.length} expiry ${
        active.length === 1 ? 'date' : 'dates'
      }. Import the .ics into any calendar app and it will handle the reminders.`
    );
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text();
      const n = await importJSON(text);
      setMsg(`Imported ${n} item${n === 1 ? '' : 's'}. (Import adds items; it does not deduplicate.)`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Import failed.');
    }
  }

  async function clearResolved() {
    if (resolved.length === 0) {
      setMsg('No resolved items to clear.');
      return;
    }
    if (window.confirm(`Delete ${resolved.length} resolved item(s) from history?`)) {
      await db.items.where('status').notEqual('active').delete();
      setMsg('Resolved history cleared.');
    }
  }

  async function eraseAll() {
    if (
      window.confirm('Erase EVERYTHING? This deletes the entire ledger on this device.') &&
      window.confirm('Last chance — this cannot be undone. Erase all data?')
    ) {
      await db.items.clear();
      setMsg('All data erased. The ledger is blank.');
    }
  }

  return (
    <section aria-label="Data and about" className="data">
      <h2 className="form-title">Your data</h2>
      <p>
        Everything lives in this browser's local database (IndexedDB). There is
        no account, no server, and no analytics. If you clear this site's data
        or switch devices, the ledger goes with it — so keep a backup.
      </p>

      <div className="data-group">
        <span className="eyebrow">Backup</span>
        <div className="data-actions">
          <button className="btn" onClick={() => exportJSON()}>
            Export backup (.json)
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Import backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      <div className="data-group">
        <span className="eyebrow">Reminders</span>
        <p className="data-note">
          perish has no push server on purpose. Export your expiry dates as a
          calendar file instead — every event carries a 2-days-before alarm, and
          your calendar app does the reminding.
        </p>
        <div className="data-actions">
          <button className="btn" onClick={exportICS}>
            Export calendar (.ics)
          </button>
        </div>
      </div>

      <div className="data-group">
        <span className="eyebrow">Danger</span>
        <div className="data-actions">
          <button className="btn" onClick={clearResolved}>
            Clear resolved history
          </button>
          <button className="btn btn-danger" onClick={eraseAll}>
            Erase everything
          </button>
        </div>
      </div>

      {msg && (
        <p className="data-msg" role="status">
          {msg}
        </p>
      )}

      <div className="data-group about">
        <span className="eyebrow">About</span>
        <p className="data-note">
          <strong>perish</strong> is free software under the{' '}
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.html"
            target="_blank"
            rel="noreferrer"
          >
            GNU AGPL v3
          </a>
          . Source:{' '}
          <a
            href="https://github.com/bell-kevin/perish"
            target="_blank"
            rel="noreferrer"
          >
            github.com/bell-kevin/perish
          </a>
          .
        </p>
        <p className="data-note">
          Barcode lookups (optional, online only) query{' '}
          <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">
            Open Food Facts
          </a>
          , the open product database — only the barcode digits are sent.
          Shelf-life hints are informed by the USDA FoodKeeper dataset (public
          domain) and common manufacturer guidance; they are conveniences, not
          food-safety or medical advice.
        </p>
      </div>
    </section>
  );
}
