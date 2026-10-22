import JSZip from 'jszip';

export interface CatalogVariation {
  id: number;
  name: string;
  filename: string;
  aspectRatio: '1:1' | '3:4';
  paddingPercent: number;
  bgColor: string;
  badgeText: string;
  badgeBg: string;
  badgeColor: string;
  dataUrl: string;
  width: number;
  height: number;
}

export const VARIATION_CONFIGS = [
  { id: 1, name: '15% White Frame + Best Seller (1:1)', aspect: '1:1', padding: 0.15, bg: '#FFFFFF', badge: 'BEST SELLER', badgeBg: '#DC2626', badgeColor: '#FFFFFF' },
  { id: 2, name: '20% Lemon Yellow + Fast Dispatch (1:1)', aspect: '1:1', padding: 0.20, bg: '#FEF08A', badge: 'FAST DISPATCH', badgeBg: '#059669', badgeColor: '#FFFFFF' },
  { id: 3, name: '25% Hot Coral + Combo Offer (1:1)', aspect: '1:1', padding: 0.25, bg: '#FEE2E2', badge: 'COMBO OFFER', badgeBg: '#EA580C', badgeColor: '#FFFFFF' },
  { id: 4, name: '30% Mint Green + Premium Quality (1:1)', aspect: '1:1', padding: 0.30, bg: '#D1FAE5', badge: 'PREMIUM QUALITY', badgeBg: '#2563EB', badgeColor: '#FFFFFF' },
  { id: 5, name: '20% Soft Lavender + Trending (3:4)', aspect: '3:4', padding: 0.20, bg: '#F3E8FF', badge: 'TRENDING #1', badgeBg: '#7C3AED', badgeColor: '#FFFFFF' },
  { id: 6, name: '25% Sky Blue + Free Delivery (3:4)', aspect: '3:4', padding: 0.25, bg: '#E0F2FE', badge: 'FREE DELIVERY', badgeBg: '#0284C7', badgeColor: '#FFFFFF' },
  { id: 7, name: '15% Pure White + Special Price (3:4)', aspect: '3:4', padding: 0.15, bg: '#FFFFFF', badge: 'SPECIAL PRICE', badgeBg: '#E11D48', badgeColor: '#FFFFFF' },
  { id: 8, name: '35% Peach Glow + Hot Deal (1:1)', aspect: '1:1', padding: 0.35, bg: '#FFEDD5', badge: 'HOT DEAL 🔥', badgeBg: '#DC2626', badgeColor: '#FFFFFF' },
  { id: 9, name: '20% Sunshine Gold + 100% Quality (1:1)', aspect: '1:1', padding: 0.20, bg: '#FEF9C3', badge: '100% QUALITY', badgeBg: '#D97706', badgeColor: '#FFFFFF' },
  { id: 10, name: '25% Clean Slate + Limited Stock (1:1)', aspect: '1:1', padding: 0.25, bg: '#F1F5F9', badge: 'LIMITED STOCK', badgeBg: '#0F172A', badgeColor: '#FFFFFF' },
  { id: 11, name: '30% Pastel Pink + Customer Choice (3:4)', aspect: '3:4', padding: 0.30, bg: '#FCE7F3', badge: 'TOP RATED ★★★★★', badgeBg: '#BE185D', badgeColor: '#FFFFFF' },
  { id: 12, name: '20% Vibrant Emerald + Lowest Price (1:1)', aspect: '1:1', padding: 0.20, bg: '#ECFDF5', badge: 'LOWEST PRICE', badgeBg: '#15803D', badgeColor: '#FFFFFF' },
  { id: 13, name: '15% Minimalist Frame + Verified (1:1)', aspect: '1:1', padding: 0.15, bg: '#FAFAFA', badge: 'VERIFIED SELLER', badgeBg: '#2563EB', badgeColor: '#FFFFFF' },
  { id: 14, name: '25% Warm Honey + Super Saver (3:4)', aspect: '3:4', padding: 0.25, bg: '#FFF7ED', badge: 'SUPER SAVER', badgeBg: '#EA580C', badgeColor: '#FFFFFF' },
  { id: 15, name: '30% Ice Cyan + Pack of 2 (1:1)', aspect: '1:1', padding: 0.30, bg: '#CFFAFE', badge: 'PACK OF 2', badgeBg: '#0891B2', badgeColor: '#FFFFFF' },
  { id: 16, name: '35% Deep Royal Border + Mega Sale (1:1)', aspect: '1:1', padding: 0.35, bg: '#EFF6FF', badge: 'MEGA SALE 🏷️', badgeBg: '#1D4ED8', badgeColor: '#FFFFFF' },
];

/**
 * Loads an image from a URL, data URL, or Blob
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));
    img.src = src;
  });
}

/**
 * Generates all 16 catalog variations using HTML5 Canvas
 */
export async function generate16CatalogVariations(imageSrc: string): Promise<CatalogVariation[]> {
  const img = await loadImage(imageSrc);
  const variations: CatalogVariation[] = [];

  for (const cfg of VARIATION_CONFIGS) {
    const width = cfg.aspect === '1:1' ? 1000 : 900;
    const height = cfg.aspect === '1:1' ? 1000 : 1200;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    // 1. Fill Background
    ctx.fillStyle = cfg.bg;
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle outer border line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width - 4, height - 4);

    // 3. Compute inner image dimensions with padding
    const padX = width * cfg.padding;
    const padY = height * cfg.padding;
    const availWidth = width - padX * 2;
    const availHeight = height - padY * 2;

    // Maintain aspect ratio inside available box
    const imgAspect = img.width / img.height;
    const boxAspect = availWidth / availHeight;

    let drawW: number;
    let drawH: number;

    if (imgAspect > boxAspect) {
      drawW = availWidth;
      drawH = availWidth / imgAspect;
    } else {
      drawH = availHeight;
      drawW = availHeight * imgAspect;
    }

    const drawX = (width - drawW) / 2;
    const drawY = (height - drawH) / 2;

    // Draw soft product shadow
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;

    // Draw product image
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();

    // 4. Draw Promotional Badge in top-left or top-right corner
    if (cfg.badge) {
      ctx.save();
      const badgeText = cfg.badge;
      const fontSize = Math.round(width * 0.028);
      ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;
      const textMetrics = ctx.measureText(badgeText);
      const textWidth = textMetrics.width;

      const badgePadX = 18;
      const badgePadY = 10;
      const badgeW = textWidth + badgePadX * 2;
      const badgeH = fontSize + badgePadY * 2;

      const badgeX = 32;
      const badgeY = 32;

      // Draw Badge Pill with Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;

      ctx.fillStyle = cfg.badgeBg;
      ctx.beginPath();
      const r = badgeH / 2;
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, r);
      ctx.fill();

      // Badge Text
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = cfg.badgeColor;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);

      ctx.restore();
    }

    // 5. Draw Watermark-free Low-Shipping Optimization Tag
    ctx.save();
    ctx.font = '600 14px monospace';
    ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
    ctx.textAlign = 'right';
    ctx.fillText(`${cfg.aspect} • ${Math.round(cfg.padding * 100)}% Border • Low-Shipping Slab`, width - 24, height - 20);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/png', 0.95);
    const filename = `meesho_catalog_variation_${String(cfg.id).padStart(2, '0')}_${cfg.aspect.replace(':', 'x')}_${Math.round(cfg.padding * 100)}pct.png`;

    variations.push({
      id: cfg.id,
      name: cfg.name,
      filename,
      aspectRatio: cfg.aspect as '1:1' | '3:4',
      paddingPercent: Math.round(cfg.padding * 100),
      bgColor: cfg.bg,
      badgeText: cfg.badge,
      badgeBg: cfg.badgeBg,
      badgeColor: cfg.badgeColor,
      dataUrl,
      width,
      height,
    });
  }

  return variations;
}

/**
 * Creates a beautiful sample product image (realistic embroidered kurti / shoes) in Canvas
 * so the "Load Sample Product Photo" button works instantly offline!
 */
export function generateSampleProductImage(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 750;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 600, 750);

  // Gradient Kurti / Apparel Silhouette
  const grad = ctx.createLinearGradient(150, 100, 450, 650);
  grad.addColorStop(0, '#be185d');
  grad.addColorStop(0.5, '#e11d48');
  grad.addColorStop(1, '#db2777');

  // Dress silhouette
  ctx.save();
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(250, 120);
  ctx.lineTo(200, 150);
  ctx.lineTo(160, 240);
  ctx.lineTo(210, 260);
  ctx.lineTo(220, 320);
  ctx.lineTo(130, 660);
  ctx.lineTo(470, 660);
  ctx.lineTo(380, 320);
  ctx.lineTo(390, 260);
  ctx.lineTo(440, 240);
  ctx.lineTo(400, 150);
  ctx.lineTo(350, 120);
  ctx.closePath();
  ctx.fill();

  // Neck pattern
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(300, 120, 50, 0, Math.PI);
  ctx.stroke();

  // Gold Embroidery lines
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
  ctx.lineWidth = 3;
  for (let y = 200; y <= 450; y += 45) {
    ctx.beginPath();
    ctx.moveTo(260, y);
    ctx.lineTo(340, y);
    ctx.stroke();
  }

  // Label text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EMBROIDERED RAYON ANARKALI', 300, 550);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('Catalog Sample • Premium Quality', 300, 580);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

/**
 * Builds a ZIP Blob of all catalog variations using JSZip
 */
export async function createCatalogVariationsZipBlob(variations: CatalogVariation[]): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('meesho_catalog_images');

  for (const v of variations) {
    const base64Data = v.dataUrl.split(',')[1];
    folder?.file(v.filename, base64Data, { base64: true });
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Downloads all 16 variations as a single ZIP archive using JSZip
 */
export async function downloadCatalogVariationsZip(
  variations: CatalogVariation[],
  zipFilename: string = 'meesho_low_shipping_catalog_variations.zip'
): Promise<void> {
  const content = await createCatalogVariationsZipBlob(variations);
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
