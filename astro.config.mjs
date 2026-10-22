// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const siteUrl = process.env.PUBLIC_SITE_URL || 'https://labelcropnow.pages.dev';

export default defineConfig({
  output: 'static',
  site: siteUrl,
  integrations: [sitemap()],
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
