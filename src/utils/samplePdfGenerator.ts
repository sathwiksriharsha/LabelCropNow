import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { encodeCode128B } from './barcodeUtils.js';

/**
 * Draws a crisp vector Code 128 barcode onto a pdf-lib PDFPage
 */
export function drawVectorBarcode(
  page: any,
  text: string,
  x: number,
  y: number,
  height: number,
  unitWidth: number = 1.0
) {
  const bars = encodeCode128B(text);
  let currentX = x;

  for (const bar of bars) {
    const barWidth = bar.widthUnits * unitWidth;
    if (bar.isBar) {
      page.drawRectangle({
        x: currentX,
        y,
        width: barWidth,
        height,
        color: rgb(0, 0, 0),
      });
    }
    currentX += barWidth;
  }

  return currentX - x;
}

export interface SampleOrderData {
  courier: string;
  awb: string;
  orderId: string;
  sku: string;
  size: string;
  qty: number;
  customerName: string;
  city: string;
  state: string;
  pincode: string;
}

export const MEESHO_SAMPLE_ORDERS: SampleOrderData[] = [
  {
    courier: 'Valmo',
    awb: 'VLM849201948',
    orderId: 'MEE-948201',
    sku: 'KURTI-COTTON-BLUE-M',
    size: 'M',
    qty: 1,
    customerName: 'Priya Sharma',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560103'
  },
  {
    courier: 'Delhivery',
    awb: 'DELH284910482',
    orderId: 'MEE-948202',
    sku: 'SAREE-SILK-RED-FREE',
    size: 'Free',
    qty: 2, // Multi-Qty!
    customerName: 'Anjali Verma',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302001'
  },
  {
    courier: 'Shadowfax',
    awb: 'SFX739104821',
    orderId: 'MEE-948203',
    sku: 'WATCH-ANALOG-BLACK',
    size: 'Standard',
    qty: 1,
    customerName: 'Rahul Mehta',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411014'
  },
  {
    courier: 'Valmo',
    awb: 'VLM849201949',
    orderId: 'MEE-948204',
    sku: 'KURTI-COTTON-BLUE-L',
    size: 'L',
    qty: 1,
    customerName: 'Sneha Patel',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380015'
  },
  {
    courier: 'XpressBees',
    awb: 'XPB592019482',
    orderId: 'MEE-948205',
    sku: 'JEANS-SLIM-32',
    size: '32',
    qty: 3, // Multi-Qty!
    customerName: 'Vikram Singh',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226010'
  },
  {
    courier: 'Delhivery',
    awb: 'DELH284910483',
    orderId: 'MEE-948206',
    sku: 'TSHIRT-OVERSIZE-XL',
    size: 'XL',
    qty: 1,
    customerName: 'Karan Joshi',
    city: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '452001'
  }
];

/**
 * Generates realistic 6-Page Meesho Ready-to-Ship A4 Sample PDF in browser memory
 */
export async function generateMeeshoSamplePdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // A4 dimensions in points
  const pageWidth = 595.28;
  const pageHeight = 841.89;

  for (const order of MEESHO_SAMPLE_ORDERS) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Outer border around shipping label (top half)
    page.drawRectangle({
      x: 20,
      y: 430,
      width: 555.28,
      height: 390,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.5,
    });

    // Top Header: Meesho branding + Courier Partner
    page.drawText('meesho', {
      x: 35,
      y: 795,
      size: 20,
      font: fontBold,
      color: rgb(0.85, 0.1, 0.45),
    });

    page.drawText(`Courier: ${order.courier.toUpperCase()}`, {
      x: 350,
      y: 795,
      size: 16,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Sub-header dividing line
    page.drawLine({
      start: { x: 20, y: 785 },
      end: { x: 575.28, y: 785 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Vector Barcode for Courier AWB
    const barcodeWidth = drawVectorBarcode(page, order.awb, 50, 705, 55, 1.4);
    page.drawText(`AWB: ${order.awb}`, {
      x: 50,
      y: 690,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Order ID: ${order.orderId}`, {
      x: 350,
      y: 730,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Date: 23-Oct-2026`, {
      x: 350,
      y: 715,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    // Divider line
    page.drawLine({
      start: { x: 20, y: 675 },
      end: { x: 575.28, y: 675 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Ship To Address Block
    page.drawText('SHIP TO (Customer Details):', {
      x: 35,
      y: 655,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(`${order.customerName}`, {
      x: 35,
      y: 638,
      size: 12,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Flat 402, Green Glen Layout, Bellandur,`, {
      x: 35,
      y: 622,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`${order.city}, ${order.state} - PIN: ${order.pincode}`, {
      x: 35,
      y: 606,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Return Address Block (Right column)
    page.drawText('RETURN ADDRESS (Seller):', {
      x: 330,
      y: 655,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    page.drawText('Radha Sarees & Apparels', {
      x: 330,
      y: 638,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText('Ring Road Market, Surat, GJ - 395002', {
      x: 330,
      y: 622,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText('GSTIN: 24AAACR1234F1Z8', {
      x: 330,
      y: 606,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    });

    // Divider line
    page.drawLine({
      start: { x: 20, y: 585 },
      end: { x: 575.28, y: 585 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Product SKU, Size, and Quantity Details
    page.drawText(`SKU: ${order.sku}`, {
      x: 35,
      y: 560,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Size: ${order.size}`, {
      x: 320,
      y: 560,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Highlight Multi-Qty in the text
    const qtyText = `Qty: ${order.qty}`;
    page.drawText(qtyText, {
      x: 440,
      y: 560,
      size: 12,
      font: fontBold,
      color: order.qty > 1 ? rgb(0.85, 0.1, 0.1) : rgb(0, 0, 0),
    });

    if (order.qty > 1) {
      page.drawRectangle({
        x: 35,
        y: 445,
        width: 525,
        height: 25,
        color: rgb(1, 0.92, 0.92),
        borderColor: rgb(0.85, 0.1, 0.1),
        borderWidth: 1,
      });
      page.drawText(`[!] MULTI-QUANTITY ORDER: ${order.qty} UNITS - PACK ALL ITEMS CAREFULLY!`, {
        x: 45,
        y: 453,
        size: 9,
        font: fontBold,
        color: rgb(0.85, 0.1, 0.1),
      });
    }

    // Scissor Cut Line (middle of page)
    page.drawLine({
      start: { x: 10, y: 415 },
      end: { x: 585.28, y: 415 },
      thickness: 1,
      dashArray: [5, 5],
      color: rgb(0.5, 0.5, 0.5),
    });

    page.drawText('--- CUT HERE TO REMOVE INVOICE BEFORE ATTACHING LABEL TO PARCEL ---', {
      x: 80,
      y: 405,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Bottom Half: Tax Invoice / Packing Slip
    page.drawRectangle({
      x: 20,
      y: 20,
      width: 555.28,
      height: 375,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    });

    page.drawText('TAX INVOICE / RETAIL PACKING SLIP', {
      x: 170,
      y: 370,
      size: 13,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Invoice No: INV-2026-${order.orderId.replace('MEE-', '')}`, {
      x: 35,
      y: 345,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Invoice Date: 23-10-2026`, {
      x: 350,
      y: 345,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    });

    // Invoice Table Box
    page.drawRectangle({
      x: 35,
      y: 200,
      width: 525,
      height: 125,
      borderColor: rgb(0.6, 0.6, 0.6),
      borderWidth: 1,
    });

    page.drawText('Item Description', { x: 45, y: 305, size: 9, font: fontBold });
    page.drawText('HSN', { x: 260, y: 305, size: 9, font: fontBold });
    page.drawText('Qty', { x: 340, y: 305, size: 9, font: fontBold });
    page.drawText('Taxable Val', { x: 390, y: 305, size: 9, font: fontBold });
    page.drawText('Total (INR)', { x: 470, y: 305, size: 9, font: fontBold });

    page.drawLine({
      start: { x: 35, y: 295 },
      end: { x: 560, y: 295 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    page.drawText(order.sku, { x: 45, y: 275, size: 9, font });
    page.drawText('610910', { x: 260, y: 275, size: 9, font });
    page.drawText(String(order.qty), { x: 345, y: 275, size: 9, font: fontBold });
    page.drawText(`INR ${(380 * order.qty).toFixed(2)}`, { x: 390, y: 275, size: 9, font });
    page.drawText(`INR ${(399 * order.qty).toFixed(2)}`, { x: 470, y: 275, size: 9, font: fontBold });

    page.drawText('Authorized Signatory: Radha Sarees', {
      x: 350,
      y: 50,
      size: 9,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  return await pdfDoc.save();
}

/**
 * Generates realistic Flipkart Ekart A4 Sample PDF
 */
export async function generateFlipkartSamplePdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Top half: Shipping label
  page.drawRectangle({
    x: 20,
    y: 430,
    width: 555.28,
    height: 390,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.5,
  });

  page.drawText('Flipkart', {
    x: 35,
    y: 795,
    size: 20,
    font: fontBold,
    color: rgb(0.12, 0.38, 0.88),
  });

  page.drawText('Courier: EKART LOGISTICS', {
    x: 300,
    y: 795,
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Ekart Tracking Barcode
  const ekartAwb = 'FMPC9482019482';
  drawVectorBarcode(page, ekartAwb, 45, 710, 50, 1.4);
  page.drawText(`Tracking ID: ${ekartAwb}`, { x: 45, y: 695, size: 10, font: fontBold });

  page.drawText('Order ID: OD30291049281', { x: 35, y: 660, size: 10, font });
  page.drawText('Customer: Rakesh Gupta, Indiranagar, Bengaluru - 560038', { x: 35, y: 640, size: 10, font });
  page.drawText('SKU: SHOES-SNEAK-WHITE-9 | Size: 9 | Qty: 1', { x: 35, y: 615, size: 11, font: fontBold });

  // Divider
  page.drawLine({
    start: { x: 10, y: 415 },
    end: { x: 585.28, y: 415 },
    thickness: 1,
    dashArray: [5, 5],
    color: rgb(0.5, 0.5, 0.5),
  });

  // Bottom half: Tax invoice
  page.drawText('FLIPKART TAX INVOICE & BILL OF SUPPLY', {
    x: 160,
    y: 380,
    size: 12,
    font: fontBold,
  });

  return await pdfDoc.save();
}

/**
 * Generates realistic Amazon FBA US Letter Sample PDF (8.5 x 11 inch)
 */
export async function generateAmazonFbaSamplePdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // US Letter dimensions in points: 612 x 792 pt
  const pageWidth = 612;
  const pageHeight = 792;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Label 1 (Top half): Amazon FBA Inbound Box Label
  page.drawRectangle({
    x: 36,
    y: 410,
    width: 540,
    height: 350,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.5,
  });

  page.drawText('FBA INBOUND SHIPMENT BOX 1 OF 1', {
    x: 50,
    y: 730,
    size: 14,
    font: fontBold,
  });

  const fbaBoxId = 'FBA17Z8W9Q4PU000001';
  drawVectorBarcode(page, fbaBoxId, 50, 650, 50, 1.3);
  page.drawText(`FBA Box ID: ${fbaBoxId}`, { x: 50, y: 635, size: 10, font: fontBold });

  page.drawText('SHIP TO: Amazon.com Services LLC, ONT8, Moreno Valley, CA 92551', {
    x: 50,
    y: 600,
    size: 9,
    font,
  });

  page.drawText('SHIP FROM: Apex Goods LLC, 100 Main St, Dallas, TX 75201', {
    x: 50,
    y: 580,
    size: 9,
    font,
  });

  // Label 2 (Bottom half): UPS Ground Carrier Shipping Label
  page.drawRectangle({
    x: 36,
    y: 30,
    width: 540,
    height: 350,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.5,
  });

  page.drawText('UPS GROUND — TRACKING #', {
    x: 50,
    y: 350,
    size: 14,
    font: fontBold,
  });

  const upsTracking = '1Z9999999999999999';
  drawVectorBarcode(page, upsTracking, 50, 270, 55, 1.4);
  page.drawText(`TRACKING: ${upsTracking}`, { x: 50, y: 255, size: 11, font: fontBold });

  return await pdfDoc.save();
}

/**
 * Generates realistic TikTok Shop US 4x6 Thermal Label Sample PDF
 */
export async function generateTikTokShopSamplePdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Standard 4x6" thermal label dimensions in points: 288 x 432 pt
  const pageWidth = 288;
  const pageHeight = 432;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Outer border
  page.drawRectangle({
    x: 10,
    y: 10,
    width: 268,
    height: 412,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.5,
  });

  // Header: TikTok Shop
  page.drawText('TikTok Shop', {
    x: 20,
    y: 395,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText('USPS GROUND ADVANTAGE(TM)', {
    x: 120,
    y: 395,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawLine({
    start: { x: 10, y: 385 },
    end: { x: 278, y: 385 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Sender
  page.drawText('SHIP FROM:', { x: 20, y: 372, size: 7, font: fontBold });
  page.drawText('TrendBoutique Official', { x: 20, y: 362, size: 8, font });
  page.drawText('1200 Fashion Way, Suite 400', { x: 20, y: 352, size: 8, font });
  page.drawText('Los Angeles, CA 90021', { x: 20, y: 342, size: 8, font });

  // Recipient (Ship To)
  page.drawText('SHIP TO:', { x: 20, y: 320, size: 8, font: fontBold });
  page.drawText('Emily Davis', { x: 20, y: 306, size: 12, font: fontBold });
  page.drawText('452 Broadway Ave, Apt 3B', { x: 20, y: 292, size: 10, font });
  page.drawText('NEW YORK, NY 10013', { x: 20, y: 278, size: 11, font: fontBold });

  page.drawLine({
    start: { x: 10, y: 265 },
    end: { x: 278, y: 265 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // USPS Tracking Barcode
  const tiktokTracking = '9400111899223344556677';
  drawVectorBarcode(page, tiktokTracking, 25, 175, 60, 1.0);

  page.drawText(`USPS TRACKING #: ${tiktokTracking}`, {
    x: 35,
    y: 160,
    size: 9,
    font: fontBold,
  });

  page.drawLine({
    start: { x: 10, y: 145 },
    end: { x: 278, y: 145 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Order & SKU Details
  page.drawText('ORDER ID: TT-2026-9481028', { x: 20, y: 125, size: 8, font: fontBold });
  page.drawText('SKU: TIK-OVERSIZED-TEE-BLK-L', { x: 20, y: 110, size: 9, font: fontBold });
  page.drawText('QTY: 1  |  WT: 12 OZ  |  ZONE 4', { x: 20, y: 95, size: 8, font });

  page.drawRectangle({
    x: 20,
    y: 25,
    width: 248,
    height: 55,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  page.drawText('TIKTOK PREPAID RETURN SERVICE', {
    x: 45,
    y: 55,
    size: 8,
    font: fontBold,
  });
  page.drawText('SCAN SHEET NOT REQUIRED', {
    x: 65,
    y: 40,
    size: 7,
    font,
  });

  return await pdfDoc.save();
}

/**
 * Returns contextual sample PDF bytes for the given preset slug
 */
export async function getSamplePdfForPreset(presetSlug?: string): Promise<{ bytes: Uint8Array; filename: string }> {
  const slug = (presetSlug || '').toLowerCase();

  if (slug.includes('tiktok')) {
    return {
      bytes: await generateTikTokShopSamplePdf(),
      filename: 'sample_tiktok_shop_label.pdf'
    };
  } else if (slug.includes('flipkart')) {
    return {
      bytes: await generateFlipkartSamplePdf(),
      filename: 'sample_flipkart_ekart_invoice.pdf'
    };
  } else if (slug.includes('fba') || slug.includes('usps') || slug.includes('ups') || slug.includes('fedex') || slug.includes('ebay') || slug.includes('poshmark')) {
    return {
      bytes: await generateAmazonFbaSamplePdf(),
      filename: 'sample_us_letter_thermal_label.pdf'
    };
  } else {
    return {
      bytes: await generateMeeshoSamplePdf(),
      filename: 'sample_meesho_ready_to_ship.pdf'
    };
  }
}

