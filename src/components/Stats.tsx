import { useMemo } from 'react';
import db, { CATEGORIES, categoryMeta, type Item } from '../lib/db';
import { fmtDate, todayISO } from '../lib/dates';

interface Props {
  items: Item[];
}

function money(n: number): string {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  });
}

export default function Stats({ items }: Props) {
  const s = useMemo(() => {
    const active = items.filter((i) => i.status === 'active');
    const used = items.filter((i) => i.status === 'used');
    const wasted = items.filter((i) => i.status === 'wasted');
    const resolvedCount = used.length + wasted.length;
    const wasteRate = resolvedCount ? Math.round((wasted.length / resolvedCount) * 100) : 0;
    const sum = (list: Item[]) => list.reduce((acc, i) => acc + (i.price ?? 0), 0);

    const perCategory = CATEGORIES.map((c) => ({
      ...c,
      wasted: wasted.filter((i) => i.category === c.id).length,
      used: used.filter((i) => i.category === c.id).length
    })).filter((c) => c.wasted + c.used > 0);
    const maxCat = Math.max(1, ...perCategory.map((c) => c.wasted + c.used));

    const recent = items
      .filter((i) => i.status !== 'active' && i.resolvedAt)
      .sort((a, b) => (b.resolvedAt ?? '').localeCompare(a.resolvedAt ?? ''))
      .slice(0, 8);

    return {
      activeCount: active.length,
      usedCount: used.length,
      wastedCount: wasted.length,
      wasteRate,
      savedMoney: sum(used),
      wastedMoney: sum(wasted),
      shelfValue: sum(active),
      perCategory,
      maxCat,
      recent
    };
  }, [items]);

  async function restore(it: Item) {
    await db.items.update(it.id, { status: 'active', resolvedAt: undefined });
  }

  return (
    <section aria-label="Stats" className="stats">
      <h2 className="form-title">The waste ledger</h2>
      <p className="stats-intro">
        When something leaves the shelf, mark it <strong>used</strong> or{' '}
        <strong>wasted</strong>. The ledger keeps score.
      </p>

      <div className="stat-grid">
        <div className="stat">
          <span className="stat-num">{s.activeCount}</span>
          <span className="stat-label">on the shelf</span>
        </div>
        <div className="stat">
          <span className="stat-num">{s.usedCount}</span>
          <span className="stat-label">used up</span>
        </div>
        <div className="stat stat-bad">
          <span className="stat-num">{s.wastedCount}</span>
          <span className="stat-label">wasted</span>
        </div>
        <div className="stat">
          <span className="stat-num">{s.wasteRate}%</span>
          <span className="stat-label">waste rate</span>
        </div>
      </div>

      {(s.savedMoney > 0 || s.wastedMoney > 0 || s.shelfValue > 0) && (
        <div className="stat-grid">
          <div className="stat">
            <span className="stat-num">{money(s.savedMoney)}</span>
            <span className="stat-label">value used</span>
          </div>
          <div className="stat stat-bad">
            <span className="stat-num">{money(s.wastedMoney)}</span>
            <span className="stat-label">value wasted</span>
          </div>
          <div className="stat">
            <span className="stat-num">{money(s.shelfValue)}</span>
            <span className="stat-label">on the shelf now</span>
          </div>
        </div>
      )}

      {s.perCategory.length > 0 && (
        <div className="cat-bars">
          <span className="eyebrow">By category</span>
          {s.perCategory.map((c) => (
            <div key={c.id} className="cat-bar">
              <span className="cat-bar-label">
                <span aria-hidden="true">{c.glyph}</span> {c.label}
              </span>
              <span className="cat-bar-track">
                <span
                  className="cat-bar-used"
                  style={{ width: `${(c.used / s.maxCat) * 100}%` }}
                  title={`${c.used} used`}
                />
                <span
                  className="cat-bar-wasted"
                  style={{ width: `${(c.wasted / s.maxCat) * 100}%` }}
                  title={`${c.wasted} wasted`}
                />
              </span>
              <span className="cat-bar-nums">
                {c.used}✓ {c.wasted}✕
              </span>
            </div>
          ))}
        </div>
      )}

      {s.recent.length > 0 && (
        <div className="recent">
          <span className="eyebrow">Recently resolved</span>
          <ul className="rows">
            {s.recent.map((it) => (
              <li key={it.id} className="row row-resolved">
                <span className="row-glyph" aria-hidden="true">
                  {categoryMeta(it.category).glyph}
                </span>
                <div className="row-main">
                  <div className="row-name">{it.name}</div>
                  <div className="row-meta">
                    <span>
                      {it.status === 'used' ? 'used' : 'wasted'} ·{' '}
                      {it.resolvedAt ? fmtDate(it.resolvedAt) : ''}
                    </span>
                  </div>
                </div>
                <div className="row-actions">
                  <button
                    className="btn btn-small"
                    onClick={() => restore(it)}
                    title="Put back on the shelf"
                  >
                    Restore
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {s.usedCount + s.wastedCount === 0 && (
        <div className="empty">
          <h2>No history yet</h2>
          <p>
            Resolve items from the shelf with ✓ (used) or ✕ (wasted) and the
            ledger will start keeping score — including dollars, if you log
            prices. Today is {fmtDate(todayISO())}; the clock is running.
          </p>
        </div>
      )}
    </section>
  );
}
