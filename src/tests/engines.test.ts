import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
  generateMeeshoSamplePdf,
  generateFlipkartSamplePdf,
  generateAmazonFbaSamplePdf,
  MEESHO_SAMPLE_ORDERS,
} from '../utils/samplePdfGenerator.js';
import {
  parsePdfLabels,
  sortPagesBySku,
  sortPagesByCourier,
  sortHighlightMultiQty,
  generateManifestSummary,
} from '../utils/labelParser.js';
import { cropPdfLabels, DIMENSIONS } from '../utils/pdfCropEngine.js';
import { parseZpl, zplToPdf, SAMPLE_ZPL } from '../utils/zplEngine.js';

describe('ShipLabelKit Core Engines', () => {
  it('generates multi-page synthetic sample PDFs in memory', async () => {
    // Meesho 6-page sample
    const meeshoBytes = await generateMeeshoSamplePdf();
    expect(meeshoBytes).toBeInstanceOf(Uint8Array);
    const meeshoDoc = await PDFDocument.load(meeshoBytes);
    expect(meeshoDoc.getPageCount()).toBe(6);

    // Flipkart 1-page sample
    const flipkartBytes = await generateFlipkartSamplePdf();
    const flipkartDoc = await PDFDocument.load(flipkartBytes);
    expect(flipkartDoc.getPageCount()).toBe(1);

    // Amazon FBA US Letter sample
    const fbaBytes = await generateAmazonFbaSamplePdf();
    const fbaDoc = await PDFDocument.load(fbaBytes);
    expect(fbaDoc.getPageCount()).toBe(1);
    const fbaPage = fbaDoc.getPage(0);
    expect(Math.round(fbaPage.getWidth())).toBe(612);
    expect(Math.round(fbaPage.getHeight())).toBe(792);
  });

  it('extracts couriers, SKUs, and multi-quantity orders from PDF pages', async () => {
    const meeshoBytes = await generateMeeshoSamplePdf();
    const parsed = await parsePdfLabels(meeshoBytes);

    expect(parsed.length).toBe(6);

    // Check couriers detected
    const couriers = parsed.map((p) => p.courier);
    expect(couriers).toContain('Valmo');
    expect(couriers).toContain('Delhivery');
    expect(couriers).toContain('Shadowfax');
    expect(couriers).toContain('XpressBees');

    // Check Multi-Qty detection
    const multiQtyPages = parsed.filter((p) => p.qty > 1);
    expect(multiQtyPages.length).toBe(2);
    expect(multiQtyPages[0].qty).toBe(2);
    expect(multiQtyPages[0].sku).toBe('SAREE-SILK-RED-FREE');
    expect(multiQtyPages[1].qty).toBe(3);
    expect(multiQtyPages[1].sku).toBe('JEANS-SLIM-32');
  });

  it('sorts parsed labels by SKU (A→Z)', async () => {
    const meeshoBytes = await generateMeeshoSamplePdf();
    const parsed = await parsePdfLabels(meeshoBytes);
    const sorted = sortPagesBySku(parsed);

    const skus = sorted.map((p) => p.sku);
    const expected = [...skus].sort();
    expect(skus).toEqual(expected);
    expect(skus[0]).toBe('JEANS-SLIM-32');
  });

  it('sorts parsed labels by Courier Partner', async () => {
    const meeshoBytes = await generateMeeshoSamplePdf();
    const parsed = await parsePdfLabels(meeshoBytes);
    const sorted = sortPagesByCourier(parsed);

    // Courier names should be alphabetically ordered
    const couriers = sorted.map((p) => p.courier);
    expect(couriers[0]).toBe('Delhivery');
    expect(couriers[couriers.length - 1]).toBe('XpressBees');
  });

  it('floats multi-quantity orders to the front', async () => {
    const meeshoBytes = await generateMeeshoSamplePdf();
    const parsed = await parsePdfLabels(meeshoBytes);
    const sorted = sortHighlightMultiQty(parsed);

    // First two items should be multi-qty
    expect(sorted[0].qty).toBeGreaterThan(1);
    expect(sorted[1].qty).toBeGreaterThan(1);
    expect(sorted[2].qty).toBe(1);
  });

  it('generates an aggregated dispatch handover manifest summary', async () => {
    const meeshoBytes = await generateMeeshoSamplePdf();
    const parsed = await parsePdfLabels(meeshoBytes);
    const summary = generateManifestSummary(parsed);

    expect(summary.totalParcels).toBe(6);
    expect(summary.multiQtyParcels).toBe(2);
    expect(summary.totalUnits).toBe(1 + 2 + 1 + 1 + 3 + 1); // 9 units
    expect(summary.byCourier['Valmo']).toBe(2);
    expect(summary.byCourier['Delhivery']).toBe(2);
    expect(summary.byCourier['Shadowfax']).toBe(1);
    expect(summary.byCourier['XpressBees']).toBe(1);
  });

  it('crops vector PDF to 4x6 inch thermal roll format (288x432 pt)', async () => {
    const meeshoBytes = await generateMeeshoSamplePdf();
    const parsed = await parsePdfLabels(meeshoBytes);

    const result = await cropPdfLabels(meeshoBytes, {
      mode: 'thermal4x6',
      margins: { topPercent: 0, bottomPercent: 50, leftPercent: 0, rightPercent: 0 },
      parsedPages: parsed,
      stampMultiQty: true,
    });

    expect(result.totalPages).toBe(6);
    expect(result.layoutMode).toBe('thermal4x6');

    const outDoc = await PDFDocument.load(result.pdfBytes);
    expect(outDoc.getPageCount()).toBe(6);
    for (let i = 0; i < 6; i++) {
      const page = outDoc.getPage(i);
      expect(page.getWidth()).toBe(DIMENSIONS.THERMAL_4X6.width);
      expect(page.getHeight()).toBe(DIMENSIONS.THERMAL_4X6.height);
    }
  });

  it('crops and arranges 6 labels into A4 4-Up Grid layout (2 pages)', async () => {
    const meeshoBytes = await generateMeeshoSamplePdf();
    const parsed = await parsePdfLabels(meeshoBytes);

    const result = await cropPdfLabels(meeshoBytes, {
      mode: 'a4_4up',
      margins: { topPercent: 0, bottomPercent: 50, leftPercent: 0, rightPercent: 0 },
      parsedPages: parsed,
    });

    // 6 labels arranged 4-per-page = 2 pages
    expect(result.totalPages).toBe(2);
    const outDoc = await PDFDocument.load(result.pdfBytes);
    expect(outDoc.getPageCount()).toBe(2);

    for (let i = 0; i < 2; i++) {
      const page = outDoc.getPage(i);
      expect(Math.round(page.getWidth())).toBe(Math.round(DIMENSIONS.A4.width));
      expect(Math.round(page.getHeight())).toBe(Math.round(DIMENSIONS.A4.height));
    }
  });

  it('appends a courier handover manifest page when requested', async () => {
    const meeshoBytes = await generateMeeshoSamplePdf();
    const parsed = await parsePdfLabels(meeshoBytes);

    const result = await cropPdfLabels(meeshoBytes, {
      mode: 'thermal4x6',
      margins: { topPercent: 0, bottomPercent: 50, leftPercent: 0, rightPercent: 0 },
      parsedPages: parsed,
      appendManifest: true,
    });

    // 6 cropped label pages + 1 manifest page = 7 pages
    expect(result.totalPages).toBe(7);
    const outDoc = await PDFDocument.load(result.pdfBytes);
    expect(outDoc.getPageCount()).toBe(7);

    // Final page should be manifest summary in A4 size
    const manifestPage = outDoc.getPage(6);
    expect(Math.round(manifestPage.getWidth())).toBe(Math.round(DIMENSIONS.A4.width));
  });

  it('parses raw ZPL II commands and converts directly to 4x6 PDF', async () => {
    const parsed = parseZpl(SAMPLE_ZPL);
    expect(parsed.commands.length).toBeGreaterThan(5);

    const textCmds = parsed.commands.filter((c) => c.type === 'text');
    expect(textCmds.length).toBeGreaterThan(0);
    expect(textCmds.some((c) => c.content?.includes('SATHWIK REDDY'))).toBe(true);

    const barcodeCmds = parsed.commands.filter((c) => c.type === 'barcode128');
    expect(barcodeCmds.length).toBe(1);
    expect(barcodeCmds[0].content).toBe('1Z9999999999999999');

    // Render to PDF
    const zplPdfBytes = await zplToPdf(SAMPLE_ZPL);
    expect(zplPdfBytes).toBeInstanceOf(Uint8Array);

    const zplDoc = await PDFDocument.load(zplPdfBytes);
    expect(zplDoc.getPageCount()).toBe(1);
    const page = zplDoc.getPage(0);
    expect(page.getWidth()).toBe(288);
    expect(page.getHeight()).toBe(432);
  });

  it('generates TikTok Shop 4x6 sample PDF and resolves preset sample contextually', async () => {
    const { generateTikTokShopSamplePdf, getSamplePdfForPreset } = await import('../utils/samplePdfGenerator.js');
    
    // Direct TikTok Shop sample
    const tikTokBytes = await generateTikTokShopSamplePdf();
    expect(tikTokBytes).toBeInstanceOf(Uint8Array);
    const tikTokDoc = await PDFDocument.load(tikTokBytes);
    expect(tikTokDoc.getPageCount()).toBe(1);
    const page = tikTokDoc.getPage(0);
    expect(page.getWidth()).toBe(288);
    expect(page.getHeight()).toBe(432);

    // Contextual resolver for TikTok
    const tikTokResolved = await getSamplePdfForPreset('tiktok-shop-label-cropper');
    expect(tikTokResolved.filename).toBe('sample_tiktok_shop_label.pdf');
    expect(tikTokResolved.bytes).toBeInstanceOf(Uint8Array);

    // Contextual resolver for Flipkart
    const flipkartResolved = await getSamplePdfForPreset('flipkart');
    expect(flipkartResolved.filename).toBe('sample_flipkart_ekart_invoice.pdf');

    // Contextual resolver for USPS
    const uspsResolved = await getSamplePdfForPreset('usps-click-n-ship-4x6-cropper');
    expect(uspsResolved.filename).toBe('sample_us_letter_thermal_label.pdf');

    // Contextual resolver for Meesho
    const meeshoResolved = await getSamplePdfForPreset('meesho');
    expect(meeshoResolved.filename).toBe('sample_meesho_ready_to_ship.pdf');
  });

  it('verifies 16 catalog image variations configuration for Meesho Low-Shipping engine', async () => {
    const { VARIATION_CONFIGS, createCatalogVariationsZipBlob } = await import('../utils/catalogImageEngine.js');
    expect(VARIATION_CONFIGS.length).toBe(16);

    for (const config of VARIATION_CONFIGS) {
      expect(config.padding).toBeGreaterThanOrEqual(0.15);
      expect(config.padding).toBeLessThanOrEqual(0.35);
      expect(['1:1', '3:4']).toContain(config.aspect);
      expect(config.name.length).toBeGreaterThan(0);
      expect(config.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
    }

    // Verify ZIP export function produces valid Blob
    const dummyVariations = [
      {
        id: 1,
        name: 'Square-Minimal-White-15pct',
        filename: 'meesho_catalog_var_01.png',
        aspectRatio: '1:1' as const,
        paddingPercent: 15,
        bgColor: '#ffffff',
        badgeText: 'Best Seller',
        badgeBg: '#dc2626',
        badgeColor: '#ffffff',
        width: 1000,
        height: 1000,
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      }
    ];

    const zipBlob = await createCatalogVariationsZipBlob(dummyVariations);
    expect(zipBlob).toBeInstanceOf(Blob);
    expect(zipBlob.type).toBe('application/zip');
    expect(zipBlob.size).toBeGreaterThan(0);
  });
});
