// When each page last changed, so neither the structured data (dateModified) nor the sitemap
// (lastmod) carries a date typed by hand. A page's date is the last commit that touched its file
// in src/pages; an article's is its front matter (updated, or else date), as the article shows it.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

// A shallow clone holds only the latest commit, which would date every page to it. The rest of the
// history is fetched once; if that fails, pages get no date rather than a wrong one.
let history: boolean | undefined;
function hasHistory() {
  if (history === undefined) {
    try {
      if (git('rev-parse', '--is-shallow-repository') === 'true') git('fetch', '--quiet', '--unshallow');
      history = true;
    } catch {
      history = false;
    }
  }
  return history;
}

const commitDates = new Map<string, string | undefined>();
/** YYYY-MM-DD of the last commit that changed a file (a path from the project root), if there is one. */
export function lastCommitDate(file: string) {
  if (!commitDates.has(file)) {
    let date: string | undefined;
    if (existsSync(file) && hasHistory()) {
      try {
        date = git('log', '-1', '--format=%cs', '--', file) || undefined;
      } catch {}
    }
    commitDates.set(file, date);
  }
  return commitDates.get(file);
}

/** The file a page route is built from: '/' is src/pages/index.astro, '/privacy' is src/pages/privacy.astro. */
export const pageFile = (route: string) => `src/pages${route === '/' ? '/index' : route}.astro`;

const ARTICLES = 'src/content/articles';
/** An article's front matter date: updated if it has one, else date. Drafts have none. */
function articleDate(slug: string) {
  const file = `${ARTICLES}/${slug}.md`;
  if (!existsSync(file)) return undefined;
  const front = readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  if (/^draft:\s*true\s*$/m.test(front)) return undefined;
  const field = (key: string) => front.match(new RegExp(`^${key}:\\s*["']?(\\d{4}-\\d{2}-\\d{2})`, 'm'))?.[1];
  return field('updated') ?? field('date');
}

/** When the page at a path last changed, for the sitemap. The articles index changes with its newest article. */
export function pathModified(path: string) {
  const slug = path.match(/^\/articles\/([\w-]+)$/)?.[1];
  if (slug) return articleDate(slug);
  if (path === '/articles') {
    const dates = readdirSync(ARTICLES).filter((f) => f.endsWith('.md')).map((f) => articleDate(f.slice(0, -3))).filter((d) => d !== undefined);
    return dates.sort().at(-1);
  }
  return lastCommitDate(pageFile(path));
}
