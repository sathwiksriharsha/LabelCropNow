/**
 * Pure TypeScript Code 128 Barcode Generator (Code 128 Set B)
 * Produces binary bar patterns for 100% vector drawing in PDF and Canvas.
 */

// Code 128 Code B table (patterns of 6 elements: bar/space widths adding to 11 units, stop pattern is 13 units)
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106 (104 is Start B, 106 is Stop)
];

const START_B = 104;
const STOP = 106;

export interface BarcodeBar {
  isBar: boolean;
  widthUnits: number;
}

/**
 * Encodes text into Code 128 Set B sequence of bars and spaces
 */
export function encodeCode128B(text: string): BarcodeBar[] {
  const codes: number[] = [START_B];
  let checksum = START_B;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const codeVal = charCode - 32;
    if (codeVal >= 0 && codeVal <= 95) {
      codes.push(codeVal);
      checksum += codeVal * (i + 1);
    }
  }

  const checkValue = checksum % 103;
  codes.push(checkValue);
  codes.push(STOP);

  const bars: BarcodeBar[] = [];

  for (const c of codes) {
    const pattern = CODE128_PATTERNS[c];
    if (!pattern) continue;
    let isBar = true;
    for (let j = 0; j < pattern.length; j++) {
      const widthUnits = parseInt(pattern[j], 10);
      bars.push({ isBar, widthUnits });
      isBar = !isBar;
    }
  }

  return bars;
}

/**
 * Calculates total barcode width in points given unit bar width
 */
export function getBarcodeTotalWidth(bars: BarcodeBar[], unitWidthPt: number): number {
  const totalUnits = bars.reduce((sum, b) => sum + b.widthUnits, 0);
  return totalUnits * unitWidthPt;
}
