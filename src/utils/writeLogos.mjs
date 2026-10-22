import fs from 'fs';
import path from 'path';

const logosDir = path.resolve('public/logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

const logos = {
  'flipkart.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#FFE500"/>
  <path d="M19 17h26c1.1 0 2 .9 2 2v26c0 1.1-.9 2-2 2H19c-1.1 0-2-.9-2-2V19c0-1.1.9-2 2-2z" fill="#2874F0"/>
  <path d="M26 17v-4c0-3.3 2.7-6 6-6s6 2.7 6 6v4" stroke="#FFE500" stroke-width="3" stroke-linecap="round"/>
  <path d="M37 25h-8v6h6v4h-6v9h-5V21h13v4z" fill="#FFFFFF"/>
</svg>`,

  'meesho.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#591745"/>
  <path d="M18 42V25c0-4 3.5-7.5 7.5-7.5s7.5 3.5 7.5 7.5v17" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M31 42V25c0-4 3.5-7.5 7.5-7.5s7.5 3.5 7.5 7.5v17" stroke="#F43397" stroke-width="4.5" stroke-linecap="round"/>
  <text x="32" y="53" fill="#FFFFFF" font-family="'Inter', system-ui, sans-serif" font-size="8.5" font-weight="800" text-anchor="middle" letter-spacing="0.5">meesho</text>
</svg>`,

  'amazon.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#FFF3E0"/>
  <path d="M37 32.5c0-4.2-3.1-6.5-8-6.5-4.4 0-7.2 2.1-7.8 5.4l4.5.6c.4-1.6 1.7-2.6 3.5-2.6 2.1 0 3.3 1.1 3.3 3.1v1.1c-5.8.3-9.5 1.7-9.5 5.5 0 2.8 2.2 4.6 5.4 4.6 2.7 0 4.7-1.3 5.5-3.3v2.8h4.4v-10.7H37zm-4.4 6.6c0 1.4-1.2 2.6-3 2.6-1.5 0-2.5-.8-2.5-2 0-1.8 1.8-2.5 5.5-2.7v2.1z" fill="#111111"/>
  <path d="M16 45c9.5 5.5 22.5 4.5 30-1.5" stroke="#FF9900" stroke-width="3" stroke-linecap="round"/>
  <path d="M43.5 41l4 2.5-3.5 3.5" fill="#FF9900"/>
</svg>`,

  'snapdeal.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#E40046"/>
  <path d="M32 14L16 22l16 8 16-8-16-8z" fill="#FFFFFF" fill-opacity="0.95"/>
  <path d="M16 24v16l15 8V32L16 24z" fill="#FFFFFF" fill-opacity="0.8"/>
  <path d="M48 24v16l-15 8V32l15-8z" fill="#FFFFFF"/>
  <circle cx="32" cy="31" r="3" fill="#E40046"/>
</svg>`,

  'usps.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#004B87"/>
  <path d="M16 38l6-16h14l4 6-8 4 12 2-18 8-10-4z" fill="#FFFFFF"/>
  <path d="M26 22l14 4-8 5 12 2-16 7-2-18z" fill="#004B87"/>
  <path d="M32 24l-4 6 6 1-2 4 8-1-8-10z" fill="#FFFFFF"/>
  <rect x="14" y="44" width="36" height="4" rx="2" fill="#DA291C"/>
</svg>`,

  'ups.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#351C15"/>
  <path d="M32 12c10 0 16 3 16 3v20c0 10-10 16-16 18-6-2-16-8-16-18V15s6-3 16-3z" fill="#FFB500"/>
  <path d="M32 15c8.5 0 13.5 2.5 13.5 2.5v17.5c0 8.5-8.5 13.5-13.5 15.5-5-2-13.5-7-13.5-15.5V17.5s5-2.5 13.5-2.5z" fill="#351C15"/>
  <text x="32" y="34" fill="#FFB500" font-family="'Inter', system-ui, sans-serif" font-size="13" font-weight="900" text-anchor="middle" letter-spacing="-0.5">ups</text>
</svg>`,

  'fedex.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2"/>
  <text x="8" y="39" fill="#4D148C" font-family="'Inter', system-ui, sans-serif" font-size="20" font-weight="900">Fed</text>
  <text x="43" y="39" fill="#FF6600" font-family="'Inter', system-ui, sans-serif" font-size="20" font-weight="900">Ex</text>
</svg>`,

  'ebay.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
  <text x="12" y="38" fill="#E53238" font-family="'Inter', system-ui, sans-serif" font-size="18" font-weight="900">e</text>
  <text x="21" y="36" fill="#0064D2" font-family="'Inter', system-ui, sans-serif" font-size="19" font-weight="900">b</text>
  <text x="33" y="38" fill="#F5AF02" font-family="'Inter', system-ui, sans-serif" font-size="18" font-weight="900">a</text>
  <text x="44" y="42" fill="#86B817" font-family="'Inter', system-ui, sans-serif" font-size="19" font-weight="900">y</text>
</svg>`,

  'myntra.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#FFF0F5"/>
  <path d="M15 42c0-10 6-18 13-18 5 0 9 4 9 9 0 6-4 11-9 11-4 0-7-2-9-5l-4 3z" fill="#FF3F6C"/>
  <path d="M49 42c0-10-6-18-13-18-5 0-9 4-9 9 0 6 4 11 9 11 4 0 7-2 9-5l4 3z" fill="#F16522"/>
  <path d="M28 24c4-4 9-6 13-4 3 2 5 6 4 10-2 4-6 7-10 7-3 0-5-2-7-5v-8z" fill="#FFC107" fill-opacity="0.85"/>
</svg>`,

  'ajio.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1C2D37"/>
  <text x="32" y="38" fill="#FFFFFF" font-family="'Inter', system-ui, sans-serif" font-size="15" font-weight="900" text-anchor="middle" letter-spacing="1.5">AJIO</text>
  <circle cx="49" cy="27" r="2.5" fill="#E11D48"/>
</svg>`,

  'shopify.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#ECFDF5"/>
  <path d="M44 20h-5c-.4-4-3-7-7-7s-6.6 3-7 7h-5l-4 28h32l-4-28z" fill="#95BF47"/>
  <path d="M32 16c2.5 0 4.5 2 4.8 4h-9.6c.3-2 2.3-4 4.8-4z" fill="#5E8E3E"/>
  <path d="M35 29c-1-1-2.5-1.5-4-1.2-2.5.4-3.5 2.2-3.3 3.8.3 2.5 3.5 3.2 4.2 4.8.5 1.2 0 2.4-1.5 2.7-1.8.3-3.2-.8-3.4-2.1l-3 .6c.5 2.8 2.8 4.2 5.5 3.8 2.8-.4 4.5-2.2 4.1-4.4-.4-2.4-3.5-3.2-4.1-4.7-.5-1.2 0-2.2 1.3-2.4 1.5-.2 2.6.5 2.8 1.6l3-.6z" fill="#FFFFFF"/>
</svg>`,

  'shiprocket.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#6C25FF"/>
  <path d="M32 15c-6 4-9 11-9 17 0 5 2 9 4 11l5-3 5 3c2-2 4-6 4-11 0-6-3-13-9-17z" fill="#FFFFFF"/>
  <circle cx="32" cy="26" r="3" fill="#6C25FF"/>
  <path d="M23 43l-5 5 4 1 3-3 2 1-4-4z" fill="#FFB703"/>
  <path d="M41 43l5 5-4 1-3-3-2 1 4-4z" fill="#FFB703"/>
  <path d="M32 40v9" stroke="#FF5400" stroke-width="3" stroke-linecap="round"/>
</svg>`,

  'glowroad.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="grGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF6B00"/>
      <stop offset="100%" stop-color="#FF1361"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#grGrad)"/>
  <circle cx="32" cy="32" r="15" fill="none" stroke="#FFFFFF" stroke-width="4.5"/>
  <path d="M32 28h12v8H32" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,

  'poshmark.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#7E1B38"/>
  <circle cx="28" cy="27" r="7.5" fill="none" stroke="#FFFFFF" stroke-width="3.5"/>
  <path d="M20.5 19.5v25" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="36" cy="35" r="7.5" fill="none" stroke="#F43F5E" stroke-width="3.5"/>
  <path d="M43.5 27.5v17" stroke="#F43F5E" stroke-width="3.5" stroke-linecap="round"/>
</svg>`,

  'walmart.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#0071DC"/>
  <g transform="translate(32,32)" stroke="#FFC220" stroke-width="4" stroke-linecap="round">
    <line x1="0" y1="-5" x2="0" y2="-16"/>
    <line x1="0" y1="5" x2="0" y2="16"/>
    <line x1="-4.3" y1="-2.5" x2="-13.8" y2="-8"/>
    <line x1="4.3" y1="2.5" x2="13.8" y2="8"/>
    <line x1="-4.3" y1="2.5" x2="-13.8" y2="8"/>
    <line x1="4.3" y1="-2.5" x2="13.8" y2="-8"/>
  </g>
</svg>`,

  'tiktok.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#000000"/>
  <g transform="translate(4, 2)">
    <path d="M34 16c2.5 3 6 4.5 10 4.8v6c-4-.2-7.5-1.5-10-4v12a10 10 0 11-10-10c1.2 0 2.4.2 3.5.6v6a4.5 4.5 0 104.5 4.4V16h2z" fill="#00F2FE"/>
    <path d="M32 14c2.5 3 6 4.5 10 4.8v6c-4-.2-7.5-1.5-10-4v12a10 10 0 11-10-10c1.2 0 2.4.2 3.5.6v6a4.5 4.5 0 104.5 4.4V14h2z" fill="#FE2C55" style="mix-blend-mode: screen"/>
    <path d="M33 15c2.5 3 6 4.5 10 4.8v6c-4-.2-7.5-1.5-10-4v12a10 10 0 11-10-10c1.2 0 2.4.2 3.5.6v6a4.5 4.5 0 104.5 4.4V15h2z" fill="#FFFFFF"/>
  </g>
</svg>`,

  'delhivery.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#BA141A"/>
  <path d="M19 18h14c7 0 12 5 12 14s-5 14-12 14H19V18zm8 21h6c3.5 0 6-2.5 6-7s-2.5-7-6-7h-6v14z" fill="#FFFFFF"/>
  <polygon points="34,28 41,32 34,36" fill="#BA141A"/>
</svg>`,

  'ekart.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#0284C7"/>
  <path d="M16 32h24M32 22l10 10-10 10" stroke="#FFE500" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="18" cy="40" r="3" fill="#FFFFFF"/>
  <circle cx="34" cy="40" r="3" fill="#FFFFFF"/>
</svg>`
};

for (const [filename, content] of Object.entries(logos)) {
  fs.writeFileSync(path.join(logosDir, filename), content.trim(), 'utf8');
}

console.log('Successfully wrote', Object.keys(logos).length, 'brand SVG logos to', logosDir);
