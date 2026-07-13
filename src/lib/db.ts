import Dexie, { type EntityTable } from 'dexie';

export type Category =
  | 'food'
  | 'medicine'
  | 'care'
  | 'document'
  | 'warranty'
  | 'subscription'
  | 'home'
  | 'other';

export type Resolution = 'active' | 'used' | 'wasted';

export interface Item {
  id: number;
  name: string;
  category: Category;
  /** Printed / official expiry date, ISO yyyy-mm-dd. */
  expiresOn: string;
  /** Date the item was opened, ISO yyyy-mm-dd (optional). */
  openedOn?: string;
  /** "Use within N days once opened" — caps the effective expiry. */
  useWithinDays?: number;
  quantity?: string;
  barcode?: string;
  /** Optional price, used for the waste ledger in Stats. */
  price?: number;
  notes?: string;
  status: Resolution;
  createdAt: string;
  resolvedAt?: string;
}

export const CATEGORIES: { id: Category; label: string; glyph: string }[] = [
  { id: 'food', label: 'Food', glyph: '🥫' },
  { id: 'medicine', label: 'Medicine', glyph: '💊' },
  { id: 'care', label: 'Personal care', glyph: '🧴' },
  { id: 'document', label: 'Document', glyph: '📄' },
  { id: 'warranty', label: 'Warranty', glyph: '🛠️' },
  { id: 'subscription', label: 'Subscription', glyph: '🔁' },
  { id: 'home', label: 'Household', glyph: '🏠' },
  { id: 'other', label: 'Other', glyph: '📦' }
];

export function categoryMeta(id: Category) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

const db = new Dexie('perish') as Dexie & {
  items: EntityTable<Item, 'id'>;
};

db.version(1).stores({
  items: '++id, status, category, expiresOn, name, resolvedAt'
});

export default db;
