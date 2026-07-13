import { useMemo, useState } from 'react';
import db, { CATEGORIES, type Category, type Item } from '../lib/db';
import {
  addDays,
  addMonths,
  daysUntil,
  effectiveExpiry,
  fmtDate,
  relLabel,
  todayISO
} from '../lib/dates';
import { findHints } from '../lib/shelfLife';
import { lookupBarcode } from '../lib/off';
import Scanner from './Scanner';

interface Props {
  editing: Item | null;
  onDone: () => void;
}

const QUICK_DATES: { label: string; calc: (t: string) => string }[] = [
  { label: 'Today', calc: (t) => t },
  { label: '+3 d', calc: (t) => addDays(t, 3) },
  { label: '+1 wk', calc: (t) => addDays(t, 7) },
  { label: '+2 wk', calc: (t) => addDays(t, 14) },
  { label: '+1 mo', calc: (t) => addMonths(t, 1) },
  { label: '+3 mo', calc: (t) => addMonths(t, 3) },
  { label: '+6 mo', calc: (t) => addMonths(t, 6) },
  { label: '+1 yr', calc: (t) => addMonths(t, 12) },
  { label: '+2 yr', calc: (t) => addMonths(t, 24) }
];

export default function ItemForm({ editing, onDone }: Props) {
  const today = todayISO();

  const [name, setName] = useState(editing?.name ?? '');
  const [category, setCategory] = useState<Category>(editing?.category ?? 'food');
  const [expiresOn, setExpiresOn] = useState(editing?.expiresOn ?? '');
  const [opened, setOpened] = useState(Boolean(editing?.openedOn));
  const [openedOn, setOpenedOn] = useState(editing?.openedOn ?? today);
  const [useWithinDays, setUseWithinDays] = useState(
    editing?.useWithinDays ? String(editing.useWithinDays) : ''
  );
  const [quantity, setQuantity] = useState(editing?.quantity ?? '');
  const [price, setPrice] = useState(
    editing?.price !== undefined ? String(editing.price) : ''
  );
  const [barcode, setBarcode] = useState(editing?.barcode ?? '');
  const [notes, setNotes] = useState(editing?.notes ?? '');

  const [scanning, setScanning] = useState(false);
  const [lookupState, setLookupState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hints = useMemo(() => findHints(name), [name]);

  const preview = useMemo(() => {
    if (!expiresOn) return null;
    const eff = effectiveExpiry({
      expiresOn,
      openedOn: opened ? openedOn : undefined,
      useWithinDays:
        opened && useWithinDays ? Number(useWithinDays) : undefined
    });
    return { eff, days: daysUntil(eff) };
  }, [expiresOn, opened, openedOn, useWithinDays]);

  async function handleDetected(code: string) {
    setScanning(false);
    setBarcode(code);
    if (!navigator.onLine) {
      setLookupState('Offline — barcode saved, name lookup skipped.');
      return;
    }
    setLookupState('Looking up on Open Food Facts…');
    const product = await lookupBarcode(code);
    if (product?.name) {
      if (!name.trim()) {
        setName(product.brand ? `${product.brand} ${product.name}` : product.name);
      }
      if (!quantity && product.quantity) setQuantity(product.quantity);
      setLookupState(`Found: ${product.name}`);
    } else {
      setLookupState('No match on Open Food Facts — enter the name manually.');
    }
  }

  async function save() {
    if (!name.trim()) {
      setError('Give the item a name.');
      return;
    }
    if (!expiresOn) {
      setError('Set a date — tap a quick chip if the item has no printed one.');
      return;
    }
    setError(null);

    const record: Omit<Item, 'id'> = {
      name: name.trim(),
      category,
      expiresOn,
      openedOn: opened ? openedOn : undefined,
      useWithinDays:
        opened && useWithinDays && Number(useWithinDays) > 0
          ? Number(useWithinDays)
          : undefined,
      quantity: quantity.trim() || undefined,
      price: price && !Number.isNaN(Number(price)) ? Number(price) : undefined,
      barcode: barcode.trim() || undefined,
      notes: notes.trim() || undefined,
      status: editing?.status ?? 'active',
      createdAt: editing?.createdAt ?? today,
      resolvedAt: editing?.resolvedAt
    };

    if (editing) {
      await db.items.update(editing.id, record);
    } else {
      await db.items.add(record as Item);
    }
    onDone();
  }

  async function remove() {
    if (!editing) return;
    if (window.confirm(`Delete “${editing.name}” from the ledger?`)) {
      await db.items.delete(editing.id);
      onDone();
    }
  }

  return (
    <section aria-label={editing ? 'Edit item' : 'Add item'} className="form">
      <h2 className="form-title">{editing ? 'Edit item' : 'Add to the ledger'}</h2>

      <label className="field">
        <span className="field-label">Name</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Whole milk, ibuprofen, laptop warranty…"
        />
      </label>

      {hints.length > 0 && (
        <div className="hints">
          {hints.map((h) => (
            <div key={h.label} className="hint">
              <span className="hint-text">
                {h.label}:{' '}
                {h.openedDays
                  ? `typically ${h.openedDays} days once opened`
                  : `typically ~${h.shelfDays} days`}
                {h.note ? ` (${h.note})` : ''}
              </span>
              <button
                type="button"
                className="btn btn-small"
                onClick={() => {
                  if (h.openedDays) {
                    setOpened(true);
                    setOpenedOn(today);
                    setUseWithinDays(String(h.openedDays));
                    if (!expiresOn) setExpiresOn(addDays(today, h.openedDays));
                  } else if (h.shelfDays) {
                    setExpiresOn(addDays(today, h.shelfDays));
                  }
                }}
              >
                Apply
              </button>
            </div>
          ))}
          <p className="hint-disclaimer">
            Typical guidance only — the printed label and your senses win.
          </p>
        </div>
      )}

      <label className="field">
        <span className="field-label">Category</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.glyph} {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field-label">Expires on</span>
        <input
          type="date"
          value={expiresOn}
          onChange={(e) => setExpiresOn(e.target.value)}
        />
      </label>

      <div className="chip-row" role="group" aria-label="Quick expiry dates">
        {QUICK_DATES.map((q) => (
          <button
            key={q.label}
            type="button"
            className="chip"
            onClick={() => setExpiresOn(q.calc(today))}
          >
            {q.label}
          </button>
        ))}
      </div>

      <label className="field field-toggle">
        <input
          type="checkbox"
          checked={opened}
          onChange={(e) => setOpened(e.target.checked)}
        />
        <span>Opened — track a "use within" window</span>
      </label>

      {opened && (
        <div className="field-pair">
          <label className="field">
            <span className="field-label">Opened on</span>
            <input
              type="date"
              value={openedOn}
              onChange={(e) => setOpenedOn(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Use within (days)</span>
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={useWithinDays}
              onChange={(e) => setUseWithinDays(e.target.value)}
              placeholder="7"
            />
          </label>
        </div>
      )}

      {preview && (
        <p className="preview">
          Effective date: <strong>{fmtDate(preview.eff)}</strong>{' '}
          <span className="preview-rel">({relLabel(preview.days)})</span>
        </p>
      )}

      <div className="field-pair">
        <label className="field">
          <span className="field-label">Quantity (optional)</span>
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="1 L, 24 tablets…"
          />
        </label>
        <label className="field">
          <span className="field-label">Price (optional)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="3.49"
          />
        </label>
      </div>

      <label className="field">
        <span className="field-label">Barcode (optional)</span>
        <div className="field-inline">
          <input
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            inputMode="numeric"
            placeholder="Scan or type"
          />
          <button type="button" className="btn" onClick={() => setScanning(true)}>
            Scan
          </button>
        </div>
      </label>
      {lookupState && <p className="lookup-state">{lookupState}</p>}

      <label className="field">
        <span className="field-label">Notes (optional)</span>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Back of the fridge, second shelf…"
        />
      </label>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button className="btn btn-primary" onClick={save}>
          {editing ? 'Save changes' : 'Add to ledger'}
        </button>
        <button className="btn" onClick={onDone}>
          Cancel
        </button>
        {editing && (
          <button className="btn btn-danger" onClick={remove}>
            Delete
          </button>
        )}
      </div>

      {scanning && (
        <Scanner onDetected={handleDetected} onClose={() => setScanning(false)} />
      )}
    </section>
  );
}
