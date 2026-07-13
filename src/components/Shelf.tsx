import { useMemo, useState } from 'react';
import { CATEGORIES, type Category, type Item } from '../lib/db';
import { daysUntil, effectiveExpiry } from '../lib/dates';
import ItemRow from './ItemRow';

interface Props {
  items: Item[];
  onResolve: (item: Item, how: 'used' | 'wasted') => void;
  onEdit: (item: Item) => void;
  onAdd: () => void;
}

interface Bucket {
  key: string;
  title: string;
  items: Item[];
}

export default function Shelf({ items, onResolve, onEdit, onAdd }: Props) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<Category | 'all'>('all');

  const buckets = useMemo<Bucket[]>(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((it) => {
      if (cat !== 'all' && it.category !== cat) return false;
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        (it.notes ?? '').toLowerCase().includes(q) ||
        (it.barcode ?? '').includes(q)
      );
    });
    const withDays = filtered
      .map((it) => ({ it, d: daysUntil(effectiveExpiry(it)) }))
      .sort((a, b) => a.d - b.d || a.it.name.localeCompare(b.it.name));

    const expired = withDays.filter((x) => x.d < 0).map((x) => x.it);
    const week = withDays.filter((x) => x.d >= 0 && x.d <= 7).map((x) => x.it);
    const month = withDays.filter((x) => x.d > 7 && x.d <= 30).map((x) => x.it);
    const later = withDays.filter((x) => x.d > 30).map((x) => x.it);

    return [
      { key: 'expired', title: 'Expired', items: expired },
      { key: 'week', title: 'This week', items: week },
      { key: 'month', title: 'This month', items: month },
      { key: 'later', title: 'Later', items: later }
    ].filter((b) => b.items.length > 0);
  }, [items, query, cat]);

  const nothingAtAll = items.length === 0;
  const nothingMatches = !nothingAtAll && buckets.length === 0;

  return (
    <section aria-label="Shelf">
      <div className="toolbar">
        <input
          type="search"
          className="search"
          placeholder="Search the shelf…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search items"
        />
      </div>

      <div className="chip-row" role="group" aria-label="Filter by category">
        <button
          className={`chip ${cat === 'all' ? 'chip-on' : ''}`}
          onClick={() => setCat('all')}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`chip ${cat === c.id ? 'chip-on' : ''}`}
            onClick={() => setCat(cat === c.id ? 'all' : c.id)}
          >
            <span aria-hidden="true">{c.glyph}</span> {c.label}
          </button>
        ))}
      </div>

      {nothingAtAll && (
        <div className="empty">
          <HourglassArt />
          <h2>The ledger is empty</h2>
          <p>
            Add the milk in your fridge, the ibuprofen in your cabinet, the
            warranty on your laptop. perish keeps the dates so you don't have to.
          </p>
          <button className="btn btn-primary" onClick={onAdd}>
            Add your first item
          </button>
        </div>
      )}

      {nothingMatches && (
        <div className="empty">
          <h2>Nothing matches</h2>
          <p>No items fit that search or filter. Clear it to see the full shelf.</p>
        </div>
      )}

      {buckets.map((b) => (
        <div key={b.key} className="bucket">
          <div className={`bucket-head bucket-${b.key}`}>
            <span className="eyebrow">{b.title}</span>
            <span className="bucket-count">{b.items.length}</span>
          </div>
          <ul className="rows">
            {b.items.map((it) => (
              <ItemRow key={it.id} item={it} onResolve={onResolve} onEdit={onEdit} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function HourglassArt() {
  return (
    <svg
      className="empty-art"
      viewBox="0 0 64 80"
      width="64"
      height="80"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M12 6h40M12 74h40" />
        <path d="M16 6c0 18 12 20 16 26 4-6 16-8 16-26M16 74c0-18 12-20 16-26 4 6 16 8 16 26" />
      </g>
      <path d="M24 66c2-8 6-10 8-12 2 2 6 4 8 12z" fill="currentColor" opacity="0.55" />
      <circle cx="32" cy="38" r="2" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
