/**
 * Typical shelf-life hints shown while adding an item.
 *
 * Food figures are informed by the USDA FoodKeeper dataset (a public-domain
 * work of the U.S. government); household/care figures reflect common
 * manufacturer guidance. These are rough conveniences, not safety advice —
 * the printed label and your senses always win.
 */

export interface ShelfHint {
  /** Substrings of the item name that trigger this hint (lowercase). */
  match: string[];
  label: string;
  /** Suggests "opened today, use within N days". */
  openedDays?: number;
  /** Suggests an expiry of today + N days (for things with no printed date). */
  shelfDays?: number;
  note?: string;
}

export const SHELF_HINTS: ShelfHint[] = [
  // ── Dairy & eggs ──────────────────────────────────────────────
  { match: ['milk'], label: 'Milk', openedDays: 7 },
  { match: ['yogurt', 'yoghurt'], label: 'Yogurt', openedDays: 10 },
  { match: ['cream cheese'], label: 'Cream cheese', openedDays: 14 },
  { match: ['sour cream'], label: 'Sour cream', openedDays: 14 },
  { match: ['hard cheese', 'cheddar', 'parmesan', 'gouda', 'swiss'], label: 'Hard cheese', openedDays: 21 },
  { match: ['soft cheese', 'brie', 'feta', 'mozzarella'], label: 'Soft cheese', openedDays: 7 },
  { match: ['butter'], label: 'Butter', openedDays: 60 },
  { match: ['egg'], label: 'Eggs', shelfDays: 28, note: 'refrigerated, in shell' },
  { match: ['heavy cream', 'whipping cream', 'half and half', 'half-and-half'], label: 'Cream', openedDays: 7 },

  // ── Meat & leftovers (refrigerated) ───────────────────────────
  { match: ['chicken', 'poultry', 'turkey breast'], label: 'Raw poultry', shelfDays: 2, note: 'refrigerated raw' },
  { match: ['ground beef', 'ground turkey', 'mince'], label: 'Ground meat', shelfDays: 2, note: 'refrigerated raw' },
  { match: ['steak', 'pork chop', 'roast'], label: 'Raw red meat', shelfDays: 4, note: 'refrigerated raw' },
  { match: ['fish', 'salmon', 'shrimp', 'seafood'], label: 'Raw seafood', shelfDays: 2, note: 'refrigerated raw' },
  { match: ['deli', 'lunch meat', 'sliced ham', 'sliced turkey'], label: 'Deli meat', openedDays: 4 },
  { match: ['bacon'], label: 'Bacon', openedDays: 7 },
  { match: ['hot dog', 'sausage'], label: 'Hot dogs / sausage', openedDays: 7 },
  { match: ['leftover'], label: 'Leftovers', shelfDays: 4 },
  { match: ['tofu'], label: 'Tofu', openedDays: 4 },

  // ── Condiments & pantry (after opening) ───────────────────────
  { match: ['ketchup'], label: 'Ketchup', openedDays: 180 },
  { match: ['mustard'], label: 'Mustard', openedDays: 365 },
  { match: ['mayo', 'mayonnaise'], label: 'Mayonnaise', openedDays: 60 },
  { match: ['salsa'], label: 'Salsa', openedDays: 14 },
  { match: ['pasta sauce', 'marinara', 'tomato sauce'], label: 'Pasta sauce', openedDays: 5 },
  { match: ['soy sauce'], label: 'Soy sauce', openedDays: 365 },
  { match: ['salad dressing', 'ranch', 'vinaigrette'], label: 'Salad dressing', openedDays: 60 },
  { match: ['peanut butter'], label: 'Peanut butter', openedDays: 90 },
  { match: ['jam', 'jelly', 'preserves'], label: 'Jam / jelly', openedDays: 90 },
  { match: ['maple syrup'], label: 'Maple syrup', openedDays: 365, note: 'refrigerated' },
  { match: ['olive oil', 'vegetable oil', 'canola'], label: 'Cooking oil', openedDays: 180 },
  { match: ['canned', 'can of'], label: 'Canned food', openedDays: 4, note: 'once opened, refrigerated' },
  { match: ['broth', 'stock'], label: 'Broth / stock', openedDays: 4 },
  { match: ['pickle'], label: 'Pickles', openedDays: 90 },
  { match: ['hummus'], label: 'Hummus', openedDays: 5 },

  // ── Produce & bakery ──────────────────────────────────────────
  { match: ['strawberr', 'raspberr', 'blueberr', 'blackberr', 'berries'], label: 'Berries', shelfDays: 3 },
  { match: ['lettuce', 'spinach', 'salad mix', 'greens'], label: 'Leafy greens', shelfDays: 5 },
  { match: ['banana'], label: 'Bananas', shelfDays: 5 },
  { match: ['apple'], label: 'Apples', shelfDays: 30, note: 'refrigerated' },
  { match: ['avocado'], label: 'Avocados', shelfDays: 4 },
  { match: ['tomato'], label: 'Tomatoes', shelfDays: 5 },
  { match: ['carrot'], label: 'Carrots', shelfDays: 21 },
  { match: ['potato'], label: 'Potatoes', shelfDays: 30, note: 'cool, dark pantry' },
  { match: ['onion'], label: 'Onions', shelfDays: 30 },
  { match: ['mushroom'], label: 'Mushrooms', shelfDays: 5 },
  { match: ['grape'], label: 'Grapes', shelfDays: 7 },
  { match: ['bread', 'bagel', 'bun'], label: 'Bread', shelfDays: 7 },
  { match: ['tortilla'], label: 'Tortillas', openedDays: 14 },

  // ── Drinks & dry goods ────────────────────────────────────────
  { match: ['orange juice', 'apple juice', 'juice'], label: 'Juice', openedDays: 7 },
  { match: ['coffee'], label: 'Ground coffee', openedDays: 30, note: 'peak freshness' },
  { match: ['cereal'], label: 'Cereal', openedDays: 90 },
  { match: ['cracker'], label: 'Crackers', openedDays: 30 },
  { match: ['chips', 'crisps'], label: 'Chips', openedDays: 14 },
  { match: ['flour'], label: 'Flour', openedDays: 240 },
  { match: ['rice'], label: 'White rice', shelfDays: 720, note: 'dry, sealed' },
  { match: ['frozen'], label: 'Frozen food', shelfDays: 120, note: 'quality window' },

  // ── Medicine & personal care ──────────────────────────────────
  { match: ['eye drop'], label: 'Eye drops', openedDays: 28, note: 'follow the label' },
  { match: ['contact solution', 'lens solution'], label: 'Contact solution', openedDays: 90, note: 'follow the label' },
  { match: ['contact lens', 'contacts'], label: 'Contact lenses', openedDays: 30, note: 'per your prescription' },
  { match: ['sunscreen'], label: 'Sunscreen', openedDays: 365 },
  { match: ['mascara'], label: 'Mascara', openedDays: 90 },
  { match: ['toothbrush'], label: 'Toothbrush', shelfDays: 90, note: 'replacement interval' },
  { match: ['hydrogen peroxide'], label: 'Hydrogen peroxide', openedDays: 180 },

  // ── Household intervals ───────────────────────────────────────
  { match: ['water filter', 'brita', 'fridge filter'], label: 'Water filter', shelfDays: 60, note: 'typical cartridge life' },
  { match: ['hvac filter', 'furnace filter', 'air filter'], label: 'Air filter', shelfDays: 90 },
  { match: ['smoke detector', 'smoke alarm'], label: 'Smoke alarm battery', shelfDays: 365, note: 'test monthly, swap yearly' },
  { match: ['fire extinguisher'], label: 'Fire extinguisher check', shelfDays: 365, note: 'pressure check interval' }
];

export function findHints(name: string, limit = 2): ShelfHint[] {
  const q = name.trim().toLowerCase();
  if (q.length < 3) return [];
  const out: ShelfHint[] = [];
  for (const hint of SHELF_HINTS) {
    if (hint.match.some((m) => q.includes(m))) {
      out.push(hint);
      if (out.length >= limit) break;
    }
  }
  return out;
}
