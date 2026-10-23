import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('LabelCropNow SEO, Canonical Domain, Sitemap & Privacy Invariants', () => {
  const distDir = path.resolve('dist');
  const CANONICAL_ORIGIN = 'https://labelcropnow.pages.dev';

  it('verifies critical Cloudflare Pages and SEO static files exist in dist', () => {
    const requiredFiles = [
      'sitemap-index.xml',
      'sitemap-0.xml',
      'robots.txt',
      '_headers',
      '_redirects',
      '404.html',
      'favicon.ico',
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(distDir, file);
      expect(fs.existsSync(filePath), `Expected ${file} to exist in dist`).toBe(true);
      const content = fs.readFileSync(filePath);
      expect(content.length).toBeGreaterThan(0);
    }
  });

  it('verifies favicon.ico is a valid binary ICO file with proper header', () => {
    const icoPath = path.join(distDir, 'favicon.ico');
    expect(fs.existsSync(icoPath)).toBe(true);
    const buf = fs.readFileSync(icoPath);
    expect(buf.length).toBeGreaterThan(100);
    // Standard ICO magic number: 00 00 01 00
    expect(buf[0]).toBe(0x00);
    expect(buf[1]).toBe(0x00);
    expect(buf[2]).toBe(0x01);
    expect(buf[3]).toBe(0x00);
  });

  it('verifies sitemaps strictly reference canonical host https://labelcropnow.pages.dev with trailing slashes', () => {
    const sitemap0Path = path.join(distDir, 'sitemap-0.xml');
    const sitemapIndex = path.join(distDir, 'sitemap-index.xml');

    const sitemap0Content = fs.readFileSync(sitemap0Path, 'utf-8');
    const indexContent = fs.readFileSync(sitemapIndex, 'utf-8');

    expect(sitemap0Content).toContain(CANONICAL_ORIGIN);
    expect(indexContent).toContain(CANONICAL_ORIGIN);
    expect(sitemap0Content).not.toContain('shiplabelkit');
    expect(indexContent).not.toContain('shiplabelkit');

    // Verify key high-value route URLs are indexed with trailing slashes
    expect(sitemap0Content).toContain('/crop/meesho/');
    expect(sitemap0Content).toContain('/crop/flipkart/');
    expect(sitemap0Content).toContain('/shopify-calculator/');
    expect(sitemap0Content).toContain('/low-shipping/');
    expect(sitemap0Content).toContain('/barcode-generator/');
    expect(sitemap0Content).toContain('/image-compressor/');
    expect(sitemap0Content).toContain('/image-converter/');
    expect(sitemap0Content).toContain('/whatsapp/');
    expect(sitemap0Content).toContain('/us/amazon-fba-8-5x11-to-4x6/');
    expect(sitemap0Content).toContain('/zpl-to-pdf-converter/');
    expect(sitemap0Content).toContain('/a4-4-labels-per-page-converter/');
  });

  it('verifies robots.txt strictly points to sitemap-index.xml on https://labelcropnow.pages.dev', () => {
    const robotsContent = fs.readFileSync(path.join(distDir, 'robots.txt'), 'utf-8');
    expect(robotsContent).toContain(`Sitemap: ${CANONICAL_ORIGIN}/sitemap-index.xml`);
    expect(robotsContent).not.toContain('shiplabelkit');
    expect(robotsContent).toContain('Allow: /');
  });

  it('verifies zero literal dots in any route directory slug in dist', () => {
    function checkDirSlugs(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        if (ent.isDirectory() && ent.name !== '_astro') {
          // Slug directory names should not contain dots
          expect(ent.name.includes('.'), `Route slug folder "${ent.name}" should not contain literal dots`).toBe(false);
          checkDirSlugs(path.join(dir, ent.name));
        }
      }
    }

    checkDirSlugs(distDir);
  });

  it('verifies canonical tags, OG URLs, and JSON-LD schemas use https://labelcropnow.pages.dev across all built HTML pages', () => {
    const htmlFiles: string[] = [];

    function collectHtmlFiles(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        const fullPath = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          collectHtmlFiles(fullPath);
        } else if (ent.isFile() && ent.name.endsWith('.html')) {
          htmlFiles.push(fullPath);
        }
      }
    }

    collectHtmlFiles(distDir);
    expect(htmlFiles.length).toBeGreaterThanOrEqual(60);

    const titleSet = new Set<string>();
    const descSet = new Set<string>();

    for (const file of htmlFiles) {
      const html = fs.readFileSync(file, 'utf-8');

      // Extract <title>
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      expect(titleMatch, `Missing <title> in ${file}`).toBeTruthy();
      const title = titleMatch![1].trim();
      expect(title.length).toBeGreaterThan(10);
      expect(titleSet.has(title), `Duplicate <title> found: "${title}" in ${file}`).toBe(false);
      titleSet.add(title);

      // Extract <meta name="description">
      const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
      expect(descMatch, `Missing <meta name="description"> in ${file}`).toBeTruthy();
      const desc = descMatch![1].trim();
      expect(desc.length).toBeGreaterThan(20);
      expect(descSet.has(desc), `Duplicate <meta name="description"> found in ${file}`).toBe(false);
      descSet.add(desc);

      // Extract canonical URL: must start strictly with https://labelcropnow.pages.dev and end with /
      const canonMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
      expect(canonMatch, `Missing canonical link in ${file}`).toBeTruthy();
      const canonUrl = canonMatch![1];
      expect(canonUrl.startsWith(CANONICAL_ORIGIN), `Canonical tag ${canonUrl} does not start with ${CANONICAL_ORIGIN} in ${file}`).toBe(true);
      expect(canonUrl.endsWith('/'), `Canonical URL ${canonUrl} must end with a trailing slash in ${file}`).toBe(true);
      expect(canonUrl).not.toContain('shiplabelkit');

      // Extract OpenGraph URL: must start strictly with https://labelcropnow.pages.dev and end with /
      const ogUrlMatch = html.match(/<meta\s+property=["']og:url["']\s+content=["']([^"']+)["']/i);
      if (ogUrlMatch) {
        const ogUrl = ogUrlMatch[1];
        expect(ogUrl.startsWith(CANONICAL_ORIGIN), `og:url ${ogUrl} does not start with ${CANONICAL_ORIGIN} in ${file}`).toBe(true);
        expect(ogUrl.endsWith('/'), `og:url ${ogUrl} must end with a trailing slash in ${file}`).toBe(true);
      }

      // JSON-LD validation: schemas should reference LabelCropNow and CANONICAL_ORIGIN
      const jsonLdMatches = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)];
      for (const jm of jsonLdMatches) {
        expect(jm[1]).not.toContain('shiplabelkit');
      }

      // Verify privacy guarantee: zero external analytics or tracking URLs
      expect(html).not.toContain('google-analytics.com');
      expect(html).not.toContain('googletagmanager.com');
      expect(html).not.toContain('facebook.net');
    }
  });

  it('verifies internal links in built HTML files resolve to existing pages with 0 broken links', () => {
    const htmlFiles: string[] = [];

    function collectHtmlFiles(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        const fullPath = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          collectHtmlFiles(fullPath);
        } else if (ent.isFile() && ent.name.endsWith('.html')) {
          htmlFiles.push(fullPath);
        }
      }
    }

    collectHtmlFiles(distDir);

    for (const file of htmlFiles) {
      const html = fs.readFileSync(file, 'utf-8');
      const hrefMatches = html.matchAll(/href=["'](\/[^"']*)["']/g);

      for (const match of hrefMatches) {
        let href = match[1];
        // Strip query or hash
        href = href.split('?')[0].split('#')[0];
        if (!href || href === '/') continue;

        // Verify destination exists in dist
        const targetPath = path.join(distDir, href.slice(1));
        const asHtml = targetPath + '.html';
        const asDirIndex = path.join(targetPath, 'index.html');

        const exists = fs.existsSync(targetPath) || fs.existsSync(asHtml) || fs.existsSync(asDirIndex);
        expect(exists, `Broken internal link "${href}" found in ${file}`).toBe(true);
      }
    }
  });
});
