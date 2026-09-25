import { defineConfig } from 'astro/config';
import { readdirSync, readFileSync } from 'node:fs';
import sitemap from '@astrojs/sitemap';
import lineage from './src/integrations/lineage.ts';
import { smartQuotes } from './src/integrations/smart-quotes.mjs';

// Drafts are only built by `npm run build:drafts`; keep them out of the sitemap even then.
const drafts = readdirSync('src/content/articles')
  .filter((f) => /^draft:\s*true\s*$/m.test(readFileSync(`src/content/articles/${f}`, 'utf8')))
  .map((f) => `/articles/${f.replace(/\.md$/, '')}`);

export default defineConfig({
  site: 'https://pauldrago.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap({ filter: (page) => !drafts.some((d) => page.includes(d)) }), smartQuotes(), lineage()],
});
