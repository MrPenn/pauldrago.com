import { defineConfig } from 'astro/config';
import { readdirSync, readFileSync } from 'node:fs';
import sitemap from '@astrojs/sitemap';
import lineage from './src/integrations/lineage.ts';
import { smartQuotes } from './src/integrations/smart-quotes.ts';
import { tableA11y } from './src/integrations/table-a11y.ts';
import { browserScripts } from './src/integrations/browser-scripts.ts';
import { pathModified } from './src/data/page-modified.ts';

// Drafts are only built by `npm run build:drafts`; keep them out of the sitemap even then.
const drafts = readdirSync('src/content/articles')
  .filter((f) => /^draft:\s*true\s*$/m.test(readFileSync(`src/content/articles/${f}`, 'utf8')))
  .map((f) => `/articles/${f.replace(/\.md$/, '')}`);

export default defineConfig({
  site: 'https://pauldrago.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  // The /ui styleguide is a working tool: noindex, and left out of the sitemap too.
  // Each entry carries the date its page last changed (src/data/page-modified.ts).
  integrations: [sitemap({
    filter: (page) => !drafts.some((d) => page.includes(d)) && !/\/ui(\/|$)/.test(new URL(page).pathname),
    serialize: (item) => {
      const lastmod = pathModified(new URL(item.url).pathname.replace(/\/$/, '') || '/');
      return lastmod ? { ...item, lastmod } : item;
    },
  }), smartQuotes(), tableA11y(), lineage(), browserScripts()],
});
