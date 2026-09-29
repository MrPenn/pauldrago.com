// Reads the stylesheets a page inlines and joins them for one <style> element.
// The files in public/ keep their comments for people and the linter. Pages ship without them.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const COMMENT = /\/\*[\s\S]*?\*\//g;
// A url() with no scheme, no leading slash and no fragment. Inlined, it would resolve against each page.
const RELATIVE_URL = /url\((?!\s*['"]?(?:[a-z][a-z\d+.-]*:|[/#]))/i;

/** The sheets at public/<href>, in order, with comments and blank lines removed. */
export function inlineSheets(hrefs: string[], root = process.cwd()) {
  return hrefs.map((href) => {
    const css = readFileSync(join(root, 'public', href), 'utf8')
      .replace(COMMENT, '')
      .replace(/[ \t]+$/gm, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    if (RELATIVE_URL.test(css)) throw new Error(`${href} has a relative url(). Start the path with a slash so it resolves from every page.`);
    return css;
  }).join('\n');
}
