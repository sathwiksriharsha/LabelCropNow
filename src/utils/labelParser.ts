export interface ParsedPage {
  pageIndex: number; // 0-based
  pageNumber: number; // 1-based
  courier: string;
  sku: string;
  qty: number;
  orderId: string;
  customerName: string;
  rawText: string;
  isMultiQty: boolean;
}

export interface ManifestSummary {
  totalParcels: number;
  totalUnits: number;
  multiQtyParcels: number;
  byCourier: Record<string, number>;
  bySku: Record<string, { parcels: number; units: number }>;
}

const KNOWN_COURIERS: { name: string; pattern: RegExp }[] = [
  { name: 'Valmo', pattern: /\b(valmo|vlm\d+)\b/i },
  { name: 'Delhivery', pattern: /\b(delhivery|delh\d+)\b/i },
  { name: 'Shadowfax', pattern: /\b(shadowfax|sfx\d+)\b/i },
  { name: 'XpressBees', pattern: /\b(xpressbees|xpress\s*bees|xpb\d+)\b/i },
  { name: 'Ekart', pattern: /\b(ekart|fmpc\d+|flipkart\s*logistics)\b/i },
  { name: 'Ecom Express', pattern: /\b(ecom\s*express)\b/i },
  { name: 'BlueDart', pattern: /\b(bluedart|blue\s*dart)\b/i },
  { name: 'DTDC', pattern: /\b(dtdc)\b/i },
  { name: 'Amazon ATS', pattern: /\b(amazon\s*ats|amazon\s*transport|easy\s*ship)\b/i },
  { name: 'USPS', pattern: /\b(usps|priority\s*mail|ground\s*advantage|united\s*states\s*postal)\b/i },
  { name: 'UPS', pattern: /\b(ups\b|ups\s*ground|1z[0-9a-z]{16})\b/i },
  { name: 'FedEx', pattern: /\b(fedex|federal\s*express)\b/i },
  { name: 'DHL Express', pattern: /\b(dhl\s*express|dhl\b)\b/i },
  { name: 'Royal Mail', pattern: /\b(royal\s*mail|tracked\s*24|tracked\s*48)\b/i },
  { name: 'Australia Post', pattern: /\b(australia\s*post|mypost)\b/i },
  { name: 'Canada Post', pattern: /\b(canada\s*post|xpresspost)\b/i },
];

/**
 * Extracts plain text from a single PDF page's text items
 */
export function parsePageText(text: string, pageIndex: number): ParsedPage {
  // Detect Courier Partner
  let detectedCourier = 'Standard Courier';
  for (const c of KNOWN_COURIERS) {
    if (c.pattern.test(text)) {
      detectedCourier = c.name;
      break;
    }
  }

  // Detect Quantity: look for "Qty: 2", "Quantity: 2", "Qty - 2", "MULTI-QUANTITY ORDER: 2"
  let qty = 1;
  const qtyMatch = text.match(/\b(?:qty|quantity)\s*[:=-]?\s*(\d+)\b/i) ||
                   text.match(/MULTI-QUANTITY(?:\s*ORDER)?:\s*(\d+)/i);
  if (qtyMatch && qtyMatch[1]) {
    const parsed = parseInt(qtyMatch[1], 10);
    if (!isNaN(parsed) && parsed > 0 && parsed < 1000) {
      qty = parsed;
    }
  }

  // Detect SKU: look for "SKU: XYZ", "SKU - XYZ", or standard SKU patterns
  let sku = 'GENERAL-ITEM';
  const skuMatch = text.match(/\bSKU\s*[:=-]?\s*([A-Za-z0-9_-]+)/i) ||
                   text.match(/\bItem\s*[:=-]?\s*([A-Za-z0-9_-]+)/i);
  if (skuMatch && skuMatch[1]) {
    sku = skuMatch[1].trim();
  }

  // Detect Order ID
  let orderId = '';
  const orderMatch = text.match(/\bOrder\s*ID\s*[:=-]?\s*([A-Za-z0-9_-]+)/i) ||
                     text.match(/\b(OD\d{10,}|MEE-\d+|FBA[A-Z0-9]+)\b/i);
  if (orderMatch && orderMatch[1]) {
    orderId = orderMatch[1].trim();
  }

  // Detect Customer Name (optional)
  let customerName = '';
  const custMatch = text.match(/Customer(?:\s*Details)?:\s*([A-Za-z\s]{3,30})/i) ||
                    text.match(/SHIP\s*TO\s*[^:]*:\s*([A-Za-z\s]{3,30})/i);
  if (custMatch && custMatch[1]) {
    customerName = custMatch[1].trim();
  }

  return {
    pageIndex,
    pageNumber: pageIndex + 1,
    courier: detectedCourier,
    sku,
    qty,
    orderId,
    customerName,
    rawText: text,
    isMultiQty: qty > 1,
  };
}

/**
 * Extracts metadata for all pages of a PDF document using pdfjs-dist
 */
export async function parsePdfLabels(pdfData: Uint8Array | ArrayBuffer): Promise<ParsedPage[]> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const sourceBytes = pdfData instanceof Uint8Array ? pdfData : new Uint8Array(pdfData);
  const clonedBytes = new Uint8Array(sourceBytes.byteLength);
  clonedBytes.set(sourceBytes);

  const loadingTask = pdfjs.getDocument({
    data: clonedBytes,
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const doc = await loadingTask.promise;
  const parsedPages: ParsedPage[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const textItems = content.items.map((it: any) => it.str || '');
    const pageText = textItems.join(' ');
    parsedPages.push(parsePageText(pageText, i - 1));
  }

  return parsedPages;
}

/**
 * Sorts pages alphabetically by SKU (A→Z)
 */
export function sortPagesBySku(pages: ParsedPage[]): ParsedPage[] {
  return [...pages].sort((a, b) => {
    const cmp = a.sku.localeCompare(b.sku);
    if (cmp !== 0) return cmp;
    return a.pageIndex - b.pageIndex;
  });
}

/**
 * Sorts pages by Courier Partner, then by SKU
 */
export function sortPagesByCourier(pages: ParsedPage[]): ParsedPage[] {
  return [...pages].sort((a, b) => {
    const courierCmp = a.courier.localeCompare(b.courier);
    if (courierCmp !== 0) return courierCmp;
    const skuCmp = a.sku.localeCompare(b.sku);
    if (skuCmp !== 0) return skuCmp;
    return a.pageIndex - b.pageIndex;
  });
}

/**
 * Floats multi-quantity orders (Qty > 1) to the front, then sorts by SKU
 */
export function sortHighlightMultiQty(pages: ParsedPage[]): ParsedPage[] {
  return [...pages].sort((a, b) => {
    // Multi-qty (qty > 1) comes first
    const aMulti = a.qty > 1 ? 1 : 0;
    const bMulti = b.qty > 1 ? 1 : 0;
    if (aMulti !== bMulti) return bMulti - aMulti;
    const skuCmp = a.sku.localeCompare(b.sku);
    if (skuCmp !== 0) return skuCmp;
    return a.pageIndex - b.pageIndex;
  });
}

/**
 * Generates an aggregated manifest summary from parsed label pages
 */
export function generateManifestSummary(pages: ParsedPage[]): ManifestSummary {
  let totalParcels = pages.length;
  let totalUnits = 0;
  let multiQtyParcels = 0;
  const byCourier: Record<string, number> = {};
  const bySku: Record<string, { parcels: number; units: number }> = {};

  for (const p of pages) {
    totalUnits += p.qty;
    if (p.qty > 1) {
      multiQtyParcels++;
    }

    byCourier[p.courier] = (byCourier[p.courier] || 0) + 1;

    if (!bySku[p.sku]) {
      bySku[p.sku] = { parcels: 0, units: 0 };
    }
    bySku[p.sku].parcels += 1;
    bySku[p.sku].units += p.qty;
  }

  return {
    totalParcels,
    totalUnits,
    multiQtyParcels,
    byCourier,
    bySku,
  };
}
