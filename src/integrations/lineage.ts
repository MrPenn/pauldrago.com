// Lineage: after every build, read the component marks back out of the finished HTML, check each
// against the registries, and write the graph to /assets/lineage.json. The build fails when a page
// marks a component the registries do not have, when a component has no declared parent, or when
// a marked figure does not match its record. The graph is what rendered, not what was intended.
import type { AstroIntegration } from 'astro';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';
import { REGISTRIES } from '../data/components';
import type { Component } from '../data/components/types';

type Mark = { page: string; section: string | null; id: string; text: string | null };

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', rsquo: '\u2019', lsquo: '\u2018', rdquo: '\u201d', ldquo: '\u201c', times: '\u00d7', nbsp: ' ' };
const plain = (html: string) => html
  .replace(/<[^>]+>/g, '')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n] ?? m)
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201c\u201d]/g, '"')
  .replace(/\s+/g, ' ')
  .trim();

async function htmlFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const pagePath = (root: string, file: string) => {
  const rel = relative(root, file).split(sep).join('/').replace(/\.html$/, '');
  return rel === 'index' ? '/' : `/${rel.replace(/\/index$/, '')}`;
};

// Walk the page in order so every inline mark belongs to the heading above it.
function readPage(page: string, html: string) {
  const marks: Mark[] = [];
  const sections: { id: string; title: string }[] = [];
  const title = plain(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '') || page;
  const footnotes = new Set([...html.matchAll(/id="user-content-fn-(\d+)"/g)].map((m) => Number(m[1])));
  const token = /<h([23])[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>|<data value="c:([^"]+)">([\s\S]*?)<\/data>|\sdata-c="([^"]+)"/g;
  let section: string | null = null;
  for (const m of html.matchAll(token)) {
    if (m[2]) {
      section = m[2];
      sections.push({ id: m[2], title: plain(m[3]) });
    } else if (m[4]) {
      marks.push({ page, section, id: m[4], text: plain(m[5]) });
    } else if (m[6]) {
      marks.push({ page, section: null, id: m[6], text: null });
      // The short version sits above the first heading; its marks belong to it.
      if (m[6] === 'short-version') {
        section = 'short-version';
        sections.push({ id: section, title: 'The short version' });
      }
    }
  }
  return { title, sections, marks, footnotes };
}

export default function lineage(): AstroIntegration {
  return {
    name: 'lineage',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const errors: string[] = [];

        const components = new Map<string, Component & { article?: string }>();
        for (const reg of REGISTRIES) {
          for (const c of reg.components) {
            if (components.has(c.id)) errors.push(`component "${c.id}" is declared twice`);
            components.set(c.id, { ...c, article: reg.article });
          }
        }

        const pages = [];
        const marks: Mark[] = [];
        const footnotesByPage = new Map<string, Set<number>>();
        for (const file of await htmlFiles(root)) {
          const page = pagePath(root, file);
          const read = readPage(page, await readFile(file, 'utf8'));
          if (!read.marks.length) continue;
          pages.push({ path: page, title: read.title, sections: read.sections });
          marks.push(...read.marks);
          footnotesByPage.set(page, read.footnotes);
        }

        // Every mark has to point at a record, and a marked figure has to say what the record says.
        for (const m of marks) {
          const c = components.get(m.id);
          const where = `${m.page}${m.section ? `#${m.section}` : ''}`;
          if (!c) {
            errors.push(`${where} marks "${m.id}", which no registry declares`);
            continue;
          }
          if (m.text !== null && c.match) {
            const allowed = [...c.match, ...(c.versions ?? []).map((v) => v.value)];
            if (!allowed.some((a) => m.text!.toLowerCase().includes(a.toLowerCase()))) {
              errors.push(`${where} marks "${m.id}" as "${m.text}", which matches none of: ${allowed.join(' | ')}`);
            }
          }
        }

        // Every record has to say where it came from. Article records are checked only when their
        // page was built, so a draft left out of a normal build does not fail it.
        const builtArticles = new Set(pages.map((p) => p.path));
        for (const c of components.values()) {
          const articlePage = c.article ? `/articles/${c.article}` : null;
          if (articlePage && !builtArticles.has(articlePage)) continue;
          const parents = (c.sources?.length ?? 0) + (c.derivedFrom?.length ?? 0);
          if (c.status === 'sourced' && !c.sources?.length) errors.push(`"${c.id}" is marked sourced but lists no sources`);
          if (c.status === 'derived' && !c.derivedFrom?.length) errors.push(`"${c.id}" is marked derived but lists nothing it derives from`);
          if (['placeholder', 'hypothetical', 'orphan'].includes(c.status) && !c.note) errors.push(`"${c.id}" is a declared ${c.status} and needs a note saying why`);
          if (c.status === 'orphan' && parents) errors.push(`"${c.id}" is declared an orphan but lists a parent`);
          for (const d of c.derivedFrom ?? []) if (!components.has(d)) errors.push(`"${c.id}" derives from "${d}", which no registry declares`);
          if (articlePage) {
            const notes = footnotesByPage.get(articlePage) ?? new Set();
            for (const n of c.sources ?? []) if (!notes.has(n)) errors.push(`"${c.id}" cites footnote ${n}, which ${articlePage} does not have`);
            if (!marks.some((m) => m.id === c.id && m.page === articlePage)) errors.push(`"${c.id}" is declared for ${articlePage} but never marked there`);
          }
        }

        if (errors.length) {
          errors.forEach((e) => logger.error(e));
          throw new Error(`lineage: ${errors.length} problem${errors.length === 1 ? '' : 's'}; every component needs a parent and every mark a component`);
        }

        // Edges count how many times each page section carries each component.
        const edges = new Map<string, { page: string; section: string | null; component: string; count: number }>();
        for (const m of marks) {
          const key = `${m.page}|${m.section ?? ''}|${m.id}`;
          const e = edges.get(key) ?? { page: m.page, section: m.section, component: m.id, count: 0 };
          e.count += 1;
          edges.set(key, e);
        }
        const used = new Set(marks.map((m) => m.id));
        const graph = {
          generated: new Date().toISOString(),
          pages,
          components: [...components.values()].filter((c) => used.has(c.id)),
          edges: [...edges.values()],
        };
        await writeFile(join(root, 'assets', 'lineage.json'), JSON.stringify(graph));
        logger.info(`${marks.length} marks, ${used.size} components, ${pages.length} pages`);
      },
    },
  };
}
