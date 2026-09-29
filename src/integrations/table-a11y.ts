// Tables in articles, after the build. Each table sits in a region a keyboard can reach and scroll,
// named by its caption or else by the section heading above it, and every header cell says whether
// it heads a column or a row. Markdown tables cannot carry these, so the build adds them.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import type { AstroIntegration } from 'astro';

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };
const plain = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&(#?\w+);/g, (m: string, n: string) => ENTITIES[n] ?? m).replace(/\s+/g, ' ').trim();
const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

// A header cell without a scope heads its column in the table head and its row in the body.
function scope(table: string) {
  const head = table.match(/<thead\b[\s\S]*?<\/thead>/)?.[0] ?? '';
  const scoped = (part: string, s: string) => part.replace(/<th\b(?![^>]*\bscope=)/g, `<th scope="${s}"`);
  return head ? table.replace(head, scoped(head, 'col')).replace(/<tbody\b[\s\S]*?<\/tbody>/g, (b: string) => scoped(b, 'row')) : scoped(table, 'row');
}

export function tableA11yHtml(html: string) {
  let heading = '';
  return html.replace(/<h([23])\b[^>]*>([\s\S]*?)<\/h\1>|<table\b[\s\S]*?<\/table>/g, (m: string, level: string | undefined, inner: string) => {
    if (level) { heading = plain(inner); return m; }
    const caption = m.match(/<caption\b[^>]*>([\s\S]*?)<\/caption>/);
    const label = (caption ? plain(caption[1] ?? '') : heading) || 'Table';
    return `<div class="article__table" role="region" aria-label="${attr(label)}" tabindex="0">${scope(m)}</div>`;
  });
}

// Astro integration: rewrite each built article's body.
export function tableA11y(): AstroIntegration {
  return {
    name: 'table-a11y',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = join(fileURLToPath(dir), 'articles');
        let files = [];
        try { files = (await readdir(root)).filter((f) => f.endsWith('.html')); } catch { return; }
        let tables = 0;
        for (const f of files) {
          const path = join(root, f);
          const html = await readFile(path, 'utf8');
          const start = html.indexOf('<div class="article__body"');
          const end = html.indexOf('</article>', start);
          if (start < 0 || end < 0) continue;
          const body = tableA11yHtml(html.slice(start, end));
          tables += (body.match(/class="article__table"/g) ?? []).length;
          await writeFile(path, html.slice(0, start) + body + html.slice(end));
        }
        logger.info(`named ${tables} article table(s)`);
      },
    },
  };
}
