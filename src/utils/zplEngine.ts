import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { encodeCode128B, getBarcodeTotalWidth } from './barcodeUtils.js';

export interface ZplCommand {
  type: 'text' | 'box' | 'barcode128' | 'qr';
  x: number;
  y: number;
  content?: string;
  width?: number;
  height?: number;
  thickness?: number;
  fontSize?: number;
  bold?: boolean;
}

export interface ZplParseResult {
  widthDots: number;
  heightDots: number;
  commands: ZplCommand[];
  rawZpl: string;
}

/**
 * Parses Zebra ZPL II string into structured drawable elements
 * Assumes standard 203 DPI (8 dots/mm) by default: 4x6 inch = 812 x 1218 dots
 */
export function parseZpl(zpl: string): ZplParseResult {
  const commands: ZplCommand[] = [];

  // Default coordinate and font state
  let currentX = 50;
  let currentY = 50;
  let currentFontSize = 24;
  let isBold = false;
  let barcodeHeight = 80;
  let barcodeUnitWidth = 2;

  // Split into tokens by caret `^`
  const tokens = zpl.split('^').filter((t) => t.trim().length > 0);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].trim();

    // Field Origin: ^FOx,y
    if (token.startsWith('FO')) {
      const match = token.match(/^FO(\d+),(\d+)/i);
      if (match) {
        currentX = parseInt(match[1], 10);
        currentY = parseInt(match[2], 10);
      }
    }
    // Barcode Field Default: ^BYwidth,ratio,height
    else if (token.startsWith('BY')) {
      const parts = token.slice(2).split(',');
      if (parts[0]) barcodeUnitWidth = parseInt(parts[0], 10) || 2;
      if (parts[2]) barcodeHeight = parseInt(parts[2], 10) || 80;
    }
    // Font: ^A0N,height,width or ^ADN
    else if (token.startsWith('A0') || token.startsWith('AD') || token.startsWith('A@')) {
      const parts = token.split(',');
      const h = parseInt(parts[1], 10);
      if (!isNaN(h) && h > 0) {
        currentFontSize = Math.max(12, Math.min(h, 96));
      }
      isBold = token.includes('B') || h > 28;
    }
    // Graphic Box: ^GBwidth,height,thickness,color,rounding
    else if (token.startsWith('GB')) {
      const parts = token.slice(2).split(',');
      const w = parseInt(parts[0], 10) || 100;
      const h = parseInt(parts[1], 10) || 2;
      const t = parseInt(parts[2], 10) || Math.min(w, h);
      commands.push({
        type: 'box',
        x: currentX,
        y: currentY,
        width: w,
        height: h,
        thickness: t,
      });
    }
    // Code 128 Barcode: ^BCo,height,f,g,e,m
    else if (token.startsWith('BC')) {
      const parts = token.slice(2).split(',');
      const h = parseInt(parts[1], 10) || barcodeHeight;
      // Look ahead for ^FD (field data)
      let data = '';
      for (let j = i + 1; j < Math.min(i + 5, tokens.length); j++) {
        if (tokens[j].startsWith('FD')) {
          data = tokens[j].slice(2).replace(/\^FS.*$/i, '').trim();
          i = j;
          break;
        }
      }
      if (data) {
        commands.push({
          type: 'barcode128',
          x: currentX,
          y: currentY,
          content: data,
          height: h,
          width: barcodeUnitWidth,
        });
      }
    }
    // QR Code: ^BQa,b,c
    else if (token.startsWith('BQ')) {
      let data = '';
      for (let j = i + 1; j < Math.min(i + 5, tokens.length); j++) {
        if (tokens[j].startsWith('FD')) {
          data = tokens[j].slice(2).replace(/\^FS.*$/i, '').replace(/^[A-Z],/i, '').trim();
          i = j;
          break;
        }
      }
      if (data) {
        commands.push({
          type: 'qr',
          x: currentX,
          y: currentY,
          content: data,
          width: 100,
          height: 100,
        });
      }
    }
    // Field Data: ^FD...^FS
    else if (token.startsWith('FD')) {
      const data = token.slice(2).replace(/\^FS.*$/i, '').trim();
      if (data) {
        commands.push({
          type: 'text',
          x: currentX,
          y: currentY,
          content: data,
          fontSize: currentFontSize,
          bold: isBold,
        });
      }
    }
  }

  return {
    widthDots: 812, // 203 DPI * 4 inches
    heightDots: 1218, // 203 DPI * 6 inches
    commands,
    rawZpl: zpl,
  };
}

/**
 * Converts parsed ZPL directly into a crisp vector 4x6 inch (288 x 432 pt) PDF
 */
export async function zplToPdf(zpl: string): Promise<Uint8Array> {
  const parsed = parseZpl(zpl);
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const targetW = 288;
  const targetH = 432;
  const scale = targetW / parsed.widthDots; // Convert dots to points

  const page = pdfDoc.addPage([targetW, targetH]);

  for (const cmd of parsed.commands) {
    // In ZPL, Y=0 is top-left. In PDF, Y=0 is bottom-left.
    const pdfX = cmd.x * scale;
    const pdfY = targetH - (cmd.y * scale);

    if (cmd.type === 'text' && cmd.content) {
      const fSize = (cmd.fontSize || 20) * scale;
      page.drawText(cmd.content, {
        x: pdfX,
        y: pdfY - fSize,
        size: Math.max(6, fSize),
        font: cmd.bold ? fontBold : font,
        color: rgb(0, 0, 0),
      });
    } else if (cmd.type === 'box') {
      const boxW = (cmd.width || 10) * scale;
      const boxH = (cmd.height || 2) * scale;
      page.drawRectangle({
        x: pdfX,
        y: pdfY - boxH,
        width: boxW,
        height: boxH,
        color: rgb(0, 0, 0),
      });
    } else if (cmd.type === 'barcode128' && cmd.content) {
      const bHeight = (cmd.height || 80) * scale;
      const bUnit = (cmd.width || 2) * scale * 0.6;
      const bars = encodeCode128B(cmd.content);
      let curX = pdfX;
      for (const bar of bars) {
        const barW = bar.widthUnits * bUnit;
        if (bar.isBar) {
          page.drawRectangle({
            x: curX,
            y: pdfY - bHeight,
            width: barW,
            height: bHeight,
            color: rgb(0, 0, 0),
          });
        }
        curX += barW;
      }
      // Print barcode human-readable text below
      page.drawText(cmd.content, {
        x: pdfX,
        y: pdfY - bHeight - 10,
        size: 8,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
    } else if (cmd.type === 'qr' && cmd.content) {
      // Draw simulated QR bounding box
      const qrSize = (cmd.width || 80) * scale;
      page.drawRectangle({
        x: pdfX,
        y: pdfY - qrSize,
        width: qrSize,
        height: qrSize,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.5,
      });
      page.drawText('[QR CODE]', {
        x: pdfX + 4,
        y: pdfY - qrSize / 2,
        size: 7,
        font,
      });
    }
  }

  return await pdfDoc.save();
}

/**
 * Standard Sample ZPL template for testing
 */
export const SAMPLE_ZPL = `^XA
^FO50,50^ADN,36,20^FDSHIPLABELKIT SAMPLE THERMAL LABEL^FS
^FO50,110^GB712,4,4^FS
^FO50,140^ADN,28,16^FDTO: SATHWIK REDDY^FS
^FO50,180^ADN,24,14^FD100 INDUSTRIAL PKWY, SUITE 400^FS
^FO50,220^ADN,24,14^FDDALLAS, TX 75201^FS
^FO50,280^GB712,2,2^FS
^FO50,320^BY3,3,100^BCN,100,Y,N,N^FD1Z9999999999999999^FS
^FO50,470^GB712,2,2^FS
^FO50,500^ADN,24,14^FDSKU: PREMIUM-TSHIRT-BLK-L | QTY: 2^FS
^FO50,540^ADN,24,14^FDORDER ID: OD9482019482^FS
^FO50,580^GB712,4,4^FS
^XZ`;
