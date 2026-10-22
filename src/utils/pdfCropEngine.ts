import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import type { ParsedPage, ManifestSummary } from './labelParser.js';

export type OutputLayoutMode = 'thermal4x6' | 'a4_4up' | 'letter_4up' | 'keep_invoice';

export interface CropMargins {
  topPercent: number;    // e.g. 0 to 90
  bottomPercent: number; // e.g. 0 to 90 (50 for Meesho/Flipkart bottom invoice)
  leftPercent: number;   // e.g. 0 to 50
  rightPercent: number;  // e.g. 0 to 50
}

export interface CropOptions {
  mode: OutputLayoutMode;
  margins: CropMargins;
  pageOrder?: number[]; // list of original 0-based page indices in desired order
  parsedPages?: ParsedPage[];
  stampMultiQty?: boolean;
  appendManifest?: boolean;
}

export interface CropResult {
  pdfBytes: Uint8Array;
  totalPages: number;
  layoutMode: OutputLayoutMode;
}

// Standard paper dimensions in points (72 points = 1 inch)
export const DIMENSIONS = {
  THERMAL_4X6: { width: 288, height: 432 }, // 4 x 6 inches
  A4: { width: 595.28, height: 841.89 },     // 210 x 297 mm
  LETTER: { width: 612, height: 792 },      // 8.5 x 11 inches
};

/**
 * Executes high-precision vector cropping and grid re-assembly without rasterization
 */
export async function cropPdfLabels(
  sourcePdfBytes: Uint8Array | ArrayBuffer,
  options: CropOptions
): Promise<CropResult> {
  const sourceBytes = sourcePdfBytes instanceof Uint8Array ? sourcePdfBytes : new Uint8Array(sourcePdfBytes);
  const clonedBytes = new Uint8Array(sourceBytes.byteLength);
  clonedBytes.set(sourceBytes);
  const sourceDoc = await PDFDocument.load(clonedBytes);
  const outDoc = await PDFDocument.create();
  const font = await outDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await outDoc.embedFont(StandardFonts.HelveticaBold);

  const totalSourcePages = sourceDoc.getPageCount();
  const indices = options.pageOrder && options.pageOrder.length > 0
    ? options.pageOrder
    : Array.from({ length: totalSourcePages }, (_, i) => i);

  // Map metadata by original page index for quick lookup
  const metaMap = new Map<number, ParsedPage>();
  if (options.parsedPages) {
    for (const p of options.parsedPages) {
      metaMap.set(p.pageIndex, p);
    }
  }

  const { margins, mode } = options;

  if (mode === 'thermal4x6') {
    // Generate individual 4x6 inch (288 x 432 pt) thermal pages
    const targetW = DIMENSIONS.THERMAL_4X6.width;
    const targetH = DIMENSIONS.THERMAL_4X6.height;

    for (const origIdx of indices) {
      if (origIdx < 0 || origIdx >= totalSourcePages) continue;

      const [embedded] = await outDoc.embedPdf(sourceDoc, [origIdx]);
      const origW = embedded.width;
      const origH = embedded.height;

      // Calculate vector crop bounding box
      const cropLeft = origW * (margins.leftPercent / 100);
      const cropBottom = origH * (margins.bottomPercent / 100);
      const cropW = origW * (1 - (margins.leftPercent + margins.rightPercent) / 100);
      const cropH = origH * (1 - (margins.topPercent + margins.bottomPercent) / 100);

      const page = outDoc.addPage([targetW, targetH]);

      // Target printable area with 8pt safe edge margin
      const safeMargin = 8;
      const printW = targetW - safeMargin * 2;
      const printH = targetH - safeMargin * 2 - (options.stampMultiQty ? 26 : 0);

      // Fit cropped vector area into print area preserving aspect ratio
      const scale = Math.min(printW / cropW, printH / cropH);
      const scaledW = cropW * scale;
      const scaledH = cropH * scale;

      const posX = safeMargin + (printW - scaledW) / 2;
      const posY = (options.stampMultiQty ? 26 : safeMargin) + (printH - scaledH) / 2;

      // Draw embedded vector page clipped to bounding box
      page.drawPage(embedded, {
        x: posX - cropLeft * scale,
        y: posY - cropBottom * scale,
        xScale: scale,
        yScale: scale,
      });

      // Optional Multi-Quantity Warning Stamp
      const meta = metaMap.get(origIdx);
      if (options.stampMultiQty && meta && meta.qty > 1) {
        page.drawRectangle({
          x: 6,
          y: 4,
          width: targetW - 12,
          height: 20,
          color: rgb(1, 0.9, 0.9),
          borderColor: rgb(0.85, 0.1, 0.1),
          borderWidth: 1,
        });

        const stampText = `[!] MULTI-QTY: ${meta.qty} UNITS | SKU: ${meta.sku}`;
        page.drawText(stampText, {
          x: 12,
          y: 9,
          size: 8.5,
          font: fontBold,
          color: rgb(0.85, 0.1, 0.1),
        });
      }
    }
  } else if (mode === 'a4_4up' || mode === 'letter_4up') {
    // 4-Up Grid Mode (2x2 grid on A4 or US Letter)
    const sheetDim = mode === 'a4_4up' ? DIMENSIONS.A4 : DIMENSIONS.LETTER;
    const sheetW = sheetDim.width;
    const sheetH = sheetDim.height;
    const colW = sheetW / 2;
    const rowH = sheetH / 2;

    for (let i = 0; i < indices.length; i += 4) {
      const sheet = outDoc.addPage([sheetW, sheetH]);

      // Subtle dashed cutting guide lines
      sheet.drawLine({
        start: { x: colW, y: 15 },
        end: { x: colW, y: sheetH - 15 },
        thickness: 0.75,
        dashArray: [4, 4],
        color: rgb(0.75, 0.75, 0.75),
      });

      sheet.drawLine({
        start: { x: 15, y: rowH },
        end: { x: sheetW - 15, y: rowH },
        thickness: 0.75,
        dashArray: [4, 4],
        color: rgb(0.75, 0.75, 0.75),
      });

      // Cells: Top-Left (0), Top-Right (1), Bottom-Left (2), Bottom-Right (3)
      const cellPositions = [
        { x: 0, y: rowH },       // Top-Left
        { x: colW, y: rowH },    // Top-Right
        { x: 0, y: 0 },          // Bottom-Left
        { x: colW, y: 0 },       // Bottom-Right
      ];

      for (let c = 0; c < 4; c++) {
        const itemIdx = i + c;
        if (itemIdx >= indices.length) break;

        const origIdx = indices[itemIdx];
        if (origIdx < 0 || origIdx >= totalSourcePages) continue;

        const [embedded] = await outDoc.embedPdf(sourceDoc, [origIdx]);
        const origW = embedded.width;
        const origH = embedded.height;

        const cropLeft = origW * (margins.leftPercent / 100);
        const cropBottom = origH * (margins.bottomPercent / 100);
        const cropW = origW * (1 - (margins.leftPercent + margins.rightPercent) / 100);
        const cropH = origH * (1 - (margins.topPercent + margins.bottomPercent) / 100);

        const cellPos = cellPositions[c];
        const padding = 12;
        const maxCellW = colW - padding * 2;
        const maxCellH = rowH - padding * 2;

        const scale = Math.min(maxCellW / cropW, maxCellH / cropH);
        const scaledW = cropW * scale;
        const scaledH = cropH * scale;

        const posX = cellPos.x + padding + (maxCellW - scaledW) / 2;
        const posY = cellPos.y + padding + (maxCellH - scaledH) / 2;

        sheet.drawPage(embedded, {
          x: posX - cropLeft * scale,
          y: posY - cropBottom * scale,
          xScale: scale,
          yScale: scale,
        });

        // Small multi-qty indicator in 4-up mode
        const meta = metaMap.get(origIdx);
        if (options.stampMultiQty && meta && meta.qty > 1) {
          sheet.drawText(`[! MULTI-QTY: ${meta.qty}]`, {
            x: cellPos.x + padding + 4,
            y: cellPos.y + padding + 4,
            size: 8,
            font: fontBold,
            color: rgb(0.85, 0.1, 0.1),
          });
        }
      }
    }
  } else if (mode === 'keep_invoice') {
    // Keep Invoice Attached: Top 65% for label, bottom 35% for compressed invoice
    const targetW = DIMENSIONS.THERMAL_4X6.width;
    const targetH = DIMENSIONS.THERMAL_4X6.height;

    for (const origIdx of indices) {
      if (origIdx < 0 || origIdx >= totalSourcePages) continue;

      const [embedded] = await outDoc.embedPdf(sourceDoc, [origIdx]);
      const origW = embedded.width;
      const origH = embedded.height;

      const page = outDoc.addPage([targetW, targetH]);

      // Label top half (y: 140 to 424)
      const labelCropLeft = 0;
      const labelCropBottom = origH * 0.5;
      const labelCropW = origW;
      const labelCropH = origH * 0.5;

      const labelScale = Math.min((targetW - 16) / labelCropW, (270) / labelCropH);
      page.drawPage(embedded, {
        x: 8 - labelCropLeft * labelScale,
        y: 145 - labelCropBottom * labelScale,
        xScale: labelScale,
        yScale: labelScale,
      });

      // Divider line
      page.drawLine({
        start: { x: 5, y: 140 },
        end: { x: targetW - 5, y: 140 },
        thickness: 0.75,
        dashArray: [3, 3],
        color: rgb(0.6, 0.6, 0.6),
      });

      // Invoice bottom strip (y: 8 to 135)
      const invCropLeft = 0;
      const invCropBottom = 0;
      const invCropW = origW;
      const invCropH = origH * 0.5;

      const invScale = Math.min((targetW - 16) / invCropW, (125) / invCropH);
      page.drawPage(embedded, {
        x: 8 - invCropLeft * invScale,
        y: 8 - invCropBottom * invScale,
        xScale: invScale,
        yScale: invScale,
      });
    }
  }

  // Append Dispatch Manifest Summary Page if requested
  if (options.appendManifest && options.parsedPages && options.parsedPages.length > 0) {
    await appendManifestPage(outDoc, options.parsedPages, font, fontBold);
  }

  const pdfBytes = await outDoc.save();
  return {
    pdfBytes,
    totalPages: outDoc.getPageCount(),
    layoutMode: mode,
  };
}

/**
 * Appends a clean, professional Courier Pickup & Dispatch Handover Manifest page
 */
async function appendManifestPage(
  doc: PDFDocument,
  pages: ParsedPage[],
  font: any,
  fontBold: any
) {
  // Use A4 size for manifest summary
  const page = doc.addPage([DIMENSIONS.A4.width, DIMENSIONS.A4.height]);
  const w = DIMENSIONS.A4.width;

  // Header Box
  page.drawRectangle({
    x: 25,
    y: 770,
    width: w - 50,
    height: 50,
    color: rgb(0.08, 0.12, 0.2),
  });

  page.drawText('SHIPLABELKIT — DAILY DISPATCH & COURIER HANDOVER MANIFEST', {
    x: 35,
    y: 798,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Date: ${new Date().toLocaleDateString('en-GB')} | Total Parcels: ${pages.length}`, {
    x: 35,
    y: 780,
    size: 9.5,
    font,
    color: rgb(0.7, 0.85, 1),
  });

  // Calculate stats
  let totalUnits = 0;
  let multiQtyCount = 0;
  const courierCounts: Record<string, number> = {};
  const skuCounts: Record<string, { parcels: number; units: number }> = {};

  for (const p of pages) {
    totalUnits += p.qty;
    if (p.qty > 1) multiQtyCount++;
    courierCounts[p.courier] = (courierCounts[p.courier] || 0) + 1;
    if (!skuCounts[p.sku]) skuCounts[p.sku] = { parcels: 0, units: 0 };
    skuCounts[p.sku].parcels++;
    skuCounts[p.sku].units += p.qty;
  }

  // Section 1: Courier Handover Summary Table
  page.drawText('1. Courier Partner Parcel Handover Breakdown', {
    x: 25,
    y: 745,
    size: 11,
    font: fontBold,
  });

  let curY = 725;
  page.drawRectangle({
    x: 25,
    y: curY,
    width: w - 50,
    height: 20,
    color: rgb(0.92, 0.94, 0.96),
  });

  page.drawText('Courier Partner', { x: 35, y: curY + 6, size: 9, font: fontBold });
  page.drawText('Total Parcels', { x: 220, y: curY + 6, size: 9, font: fontBold });
  page.drawText('Pickup Executive Signature', { x: 360, y: curY + 6, size: 9, font: fontBold });

  curY -= 22;
  for (const [courier, count] of Object.entries(courierCounts)) {
    page.drawText(courier, { x: 35, y: curY + 5, size: 9.5, font });
    page.drawText(`${count} Parcels`, { x: 220, y: curY + 5, size: 9.5, font: fontBold });
    page.drawLine({
      start: { x: 360, y: curY + 3 },
      end: { x: 530, y: curY + 3 },
      thickness: 0.75,
      dashArray: [2, 2],
      color: rgb(0.6, 0.6, 0.6),
    });
    curY -= 22;
  }

  // Section 2: SKU Packing Breakdown
  curY -= 15;
  page.drawText('2. SKU Packing & Quantity Summary', {
    x: 25,
    y: curY,
    size: 11,
    font: fontBold,
  });

  curY -= 20;
  page.drawRectangle({
    x: 25,
    y: curY,
    width: w - 50,
    height: 20,
    color: rgb(0.92, 0.94, 0.96),
  });

  page.drawText('SKU Code', { x: 35, y: curY + 6, size: 9, font: fontBold });
  page.drawText('Parcels', { x: 280, y: curY + 6, size: 9, font: fontBold });
  page.drawText('Total Item Units', { x: 420, y: curY + 6, size: 9, font: fontBold });

  curY -= 20;
  for (const [sku, sData] of Object.entries(skuCounts).slice(0, 15)) {
    page.drawText(sku, { x: 35, y: curY + 5, size: 9, font });
    page.drawText(`${sData.parcels}`, { x: 280, y: curY + 5, size: 9, font });
    page.drawText(`${sData.units}`, { x: 420, y: curY + 5, size: 9, font: fontBold });
    curY -= 18;
  }

  // Signatures Footer
  page.drawText('Warehouse Dispatch Manager: ______________________', {
    x: 35,
    y: 50,
    size: 9,
    font,
  });

  page.drawText('Official Seller Stamp & Date: ______________________', {
    x: 320,
    y: 50,
    size: 9,
    font,
  });
}
