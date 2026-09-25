// Typographic quotes at build time. Source files stay plain ASCII (straight quotes); the reader
// sees curly ones. Markdown text is already converted by smartypants; this covers what it cannot
// reach: raw HTML blocks inside articles and strings the template renders with set:html.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const OPEN = /[\s([{\u2014\u2013-]/;
const SKIP = new Set(['code', 'pre', 'script', 'style', 'kbd', 'samp', 'textarea']);

// Convert straight quotes in one run of text. `prev` is the character before the run.
export function curl(text, prev = ' ') {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const before = i === 0 ? prev : text[i - 1];
    const after = text[i + 1] || '';
    if (c === '"') {
      out += before === '' || OPEN.test(before) || before === '\u2018' ? '\u201c' : '\u201d';
    } else if (c === "'") {
      const opening = (before === '' || OPEN.test(before) || before === '\u201c') && !/\d/.test(after);
      out += opening ? '\u2018' : '\u2019';
    } else {
      out += c;
    }
  }
  return out;
}

// For HTML strings: convert text between tags only, never inside tags, attributes, scripts or code.
export function curlHtml(html) {
  let prev = ' ';
  let skip = null;
  return html.replace(/(<[^>]*>)|([^<]+)/g, (m, tag, text) => {
    if (tag) {
      const name = (tag.match(/^<\/?\s*([a-zA-Z0-9-]+)/) || [])[1];
      const lower = name ? name.toLowerCase() : '';
      if (skip) { if (tag.startsWith('</') && lower === skip) skip = null; return tag; }
      if (SKIP.has(lower) && !tag.startsWith('</') && !tag.endsWith('/>')) skip = lower;
      if (/^(p|li|h[1-6]|td|th|figcaption|blockquote|dt|dd|div|figure|section|aside)$/.test(lower)) prev = ' ';
      return tag;
    }
    if (skip) return text;
    const res = curl(text, prev);
    prev = text[text.length - 1] || prev;
    return res;
  });
}

// Astro integration: after the build, curl the quotes inside each article's body. Articles mix
// markdown (already curled) with raw HTML figures, which the markdown step never sees.
export function smartQuotes() {
  return {
    name: 'smart-quotes',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = join(fileURLToPath(dir), 'articles');
        let files = [];
        try { files = (await readdir(root)).filter((f) => f.endsWith('.html')); } catch { return; }
        for (const f of files) {
          const path = join(root, f);
          const html = await readFile(path, 'utf8');
          const start = html.indexOf('<div class="article-body"');
          const end = html.indexOf('</article>', start);
          if (start < 0 || end < 0) continue;
          await writeFile(path, html.slice(0, start) + curlHtml(html.slice(start, end)) + html.slice(end));
        }
        logger.info(`curled quotes in ${files.length} article(s)`);
      },
    },
  };
}
