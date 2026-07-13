/**
 * Optional product lookup against Open Food Facts — a free, open database
 * of food products (data under the Open Database License, server software
 * under AGPL). This is the only network request perish ever makes, it only
 * happens when you scan or look up a barcode, and only the barcode digits
 * are sent. Everything degrades gracefully when offline.
 *
 * https://world.openfoodfacts.org
 */

export interface OffProduct {
  name?: string;
  brand?: string;
  quantity?: string;
}

export async function lookupBarcode(code: string): Promise<OffProduct | null> {
  const clean = code.replace(/[^0-9A-Za-z]/g, '');
  if (!clean) return null;
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
        clean
      )}.json?fields=product_name,brands,quantity`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 1 || !json.product) return null;
    const p = json.product;
    return {
      name: typeof p.product_name === 'string' ? p.product_name : undefined,
      brand:
        typeof p.brands === 'string' && p.brands.length > 0
          ? p.brands.split(',')[0].trim()
          : undefined,
      quantity: typeof p.quantity === 'string' ? p.quantity : undefined
    };
  } catch {
    return null; // offline, blocked, or CORS hiccup — manual entry still works
  }
}
