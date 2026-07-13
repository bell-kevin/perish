import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db, { type Item } from './lib/db';
import { daysUntil, effectiveExpiry, todayISO } from './lib/dates';
import Shelf from './components/Shelf';
import ItemForm from './components/ItemForm';
import Stats from './components/Stats';
import DataView from './components/DataView';

type View = 'shelf' | 'form' | 'stats' | 'data';

export default function App() {
  const [view, setView] = useState<View>('shelf');
  const [editing, setEditing] = useState<Item | null>(null);

  const items = useLiveQuery(() => db.items.toArray(), []) ?? [];
  const active = items.filter((i) => i.status === 'active');
  const attention = active.filter(
    (i) => daysUntil(effectiveExpiry(i)) <= 7
  ).length;

  async function resolve(item: Item, how: 'used' | 'wasted') {
    await db.items.update(item.id, { status: how, resolvedAt: todayISO() });
  }

  function openAdd() {
    setEditing(null);
    setView('form');
  }

  function openEdit(item: Item) {
    setEditing(item);
    setView('form');
  }

  return (
    <div className="app">
      <header className="masthead">
        <div className="wordmark" title="perish — a ledger of things that end">
          <span className="wordmark-box">PERISH</span>
          <span className="wordmark-tag">a ledger of things that end</span>
        </div>

        <nav className="nav" aria-label="Main">
          <button
            className={`nav-btn ${view === 'shelf' ? 'nav-on' : ''}`}
            onClick={() => setView('shelf')}
          >
            Shelf
            {attention > 0 && (
              <span className="nav-badge" title={`${attention} due within 7 days`}>
                {attention}
              </span>
            )}
          </button>
          <button
            className={`nav-btn ${view === 'stats' ? 'nav-on' : ''}`}
            onClick={() => setView('stats')}
          >
            Stats
          </button>
          <button
            className={`nav-btn ${view === 'data' ? 'nav-on' : ''}`}
            onClick={() => setView('data')}
          >
            Data
          </button>
          <button className="btn btn-primary nav-add" onClick={openAdd}>
            + Add
          </button>
        </nav>
      </header>

      <main className="main">
        {view === 'shelf' && (
          <Shelf items={active} onResolve={resolve} onEdit={openEdit} onAdd={openAdd} />
        )}
        {view === 'form' && (
          <ItemForm
            editing={editing}
            onDone={() => {
              setEditing(null);
              setView('shelf');
            }}
          />
        )}
        {view === 'stats' && <Stats items={items} />}
        {view === 'data' && <DataView items={items} />}
      </main>

      <footer className="footer">
        <span>
          local-first · no account · your data stays here ·{' '}
          <a
            href="https://github.com/bell-kevin/perish"
            target="_blank"
            rel="noreferrer"
          >
            AGPL-3.0
          </a>
        </span>
      </footer>
    </div>
  );
}
