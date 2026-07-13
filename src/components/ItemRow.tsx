import { categoryMeta, type Item } from '../lib/db';
import {
  daysUntil,
  effectiveExpiry,
  relLabel,
  stampDate,
  urgencyOf
} from '../lib/dates';

interface Props {
  item: Item;
  onResolve: (item: Item, how: 'used' | 'wasted') => void;
  onEdit: (item: Item) => void;
}

export default function ItemRow({ item, onResolve, onEdit }: Props) {
  const eff = effectiveExpiry(item);
  const days = daysUntil(eff);
  const urgency = urgencyOf(days);
  const meta = categoryMeta(item.category);
  const openedCapped =
    item.openedOn && item.useWithinDays && eff !== item.expiresOn;

  return (
    <li className={`row urgency-${urgency}`}>
      <span className="row-glyph" aria-hidden="true">
        {meta.glyph}
      </span>

      <div className="row-main">
        <div className="row-name">{item.name}</div>
        <div className="row-meta">
          <span>{meta.label}</span>
          {item.quantity && <span>· {item.quantity}</span>}
          {openedCapped && <span>· opened, use by stamp</span>}
          {item.notes && <span className="row-notes">· {item.notes}</span>}
        </div>
      </div>

      <div className="row-when">
        <span className={`stamp stamp-${urgency}`} title={relLabel(days)}>
          {urgency === 'expired' ? 'EXPIRED ' : ''}
          {stampDate(eff)}
        </span>
        <span className="row-rel">{relLabel(days)}</span>
      </div>

      <div className="row-actions">
        <button
          className="btn btn-icon"
          title="Mark as used up"
          aria-label={`Mark ${item.name} as used`}
          onClick={() => onResolve(item, 'used')}
        >
          ✓
        </button>
        <button
          className="btn btn-icon"
          title="Mark as wasted"
          aria-label={`Mark ${item.name} as wasted`}
          onClick={() => onResolve(item, 'wasted')}
        >
          ✕
        </button>
        <button
          className="btn btn-icon"
          title="Edit"
          aria-label={`Edit ${item.name}`}
          onClick={() => onEdit(item)}
        >
          ✎
        </button>
      </div>
    </li>
  );
}
