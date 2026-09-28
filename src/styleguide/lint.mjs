// The styleguide linter: checks articles and their stylesheets against the rules documented at /ui,
// and the media queries scripts ask through matchMedia.
// RULES is the single list; /ui/lint prints it, and each check below reports under one of its ids.
// Prose (dashes, stock phrases, setup lines) is the anti-slop linter's job; this one checks
// structure, figures, images, sources, markup and the stylesheet.
//
// Suppress one finding with a comment on the same line or the line above, and say why:
//   <!-- style-ok: rule-id (reason) -->   in markdown or HTML
//   /* style-ok: rule-id (reason) */      in CSS and scripts
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { BAR_MAX, readNumber, offScale, num } from './build.mjs';
import { SIGNATURE_DEVICES, BREAKPOINTS, COLUMN_BREAKPOINTS } from './components.mjs';

export const RULES = [
  // Front matter
  { id: 'fm-brief', severity: 'error', group: 'Front matter', title: 'The short version has three to six points', why: 'Every article opens with the same numbered summary; fewer than three is not the argument, more than six is the article again.', fix: 'Add or merge points in the brief list.', good: "brief:\n  - 'A finding with its number.'\n  - 'A second finding.'\n  - 'What changes: the changes.'" },
  { id: 'fm-description', severity: 'warn', group: 'Front matter', title: 'The dek runs 70 to 200 characters', why: 'The description is the dek under the title and the search snippet; search engines cut it near 160 characters.', fix: 'State the argument in two sentences.' },
  { id: 'fm-kicker', severity: 'warn', group: 'Front matter', title: 'The article names its topic area', why: 'The kicker sits over the title and becomes the article section in structured data.', fix: 'Add kicker: "Content operations" or similar.' },
  { id: 'fm-title-case', severity: 'warn', group: 'Front matter', title: 'Article titles are in title case', why: 'Titles are in title case and section headings in sentence case, so a reader can tell them apart.', bad: 'title: "Your content has no parent"', good: 'title: "Your Content Has No Parent"' },
  { id: 'fm-social', severity: 'warn', group: 'Front matter', title: 'A social image has alt text', why: 'LinkedIn and screen readers read ogImageAlt; without ogImage the page shares the site default image.', fix: 'Add ogImageAlt that states what the image shows.' },

  // Headings
  { id: 'heading-h1', severity: 'error', group: 'Headings', title: 'The body has no h1', why: 'The template renders the title as the only h1.', bad: '# Heading', good: '## Heading' },
  { id: 'heading-order', severity: 'error', group: 'Headings', title: 'Headings step down one level at a time', why: 'A ### before any ## or a #### anywhere breaks the outline screen readers navigate by.', fix: 'Use ## for sections and ### for parts of a section.' },
  { id: 'heading-case', severity: 'warn', group: 'Headings', title: 'Section headings are in sentence case', why: 'A section heading is a claim, written as a sentence.', bad: '## Most Stages Are Never Measured', good: '## Most stages are never measured' },
  { id: 'heading-length', severity: 'warn', group: 'Headings', title: 'Section headings run twelve words or fewer, with no end punctuation', why: 'A heading longer than a line stops working as a signpost.', fix: 'Move the detail into the deck.' },
  { id: 'section-deck', severity: 'warn', group: 'Headings', title: 'Every section opens with a deck', why: 'The deck states what the section finds, so a reader skimming headings and decks gets the argument.', good: '## Reuse is the default\n\n<p class="pd-deck">One sentence that states the finding.</p>' },
  { id: 'deck-length', severity: 'warn', group: 'Headings', title: 'A deck runs 40 words or fewer', why: 'A deck is read at a glance.', fix: 'Keep the finding and its number; move the rest into the section.' },

  // Text
  { id: 'link-text', severity: 'error', group: 'Text', title: 'Link text says where it goes', why: 'Screen readers list links out of context, and "here" tells the reader nothing.', bad: '[here](https://...)', good: '[FINRA Rule 2210](https://...)' },
  { id: 'pullquote-length', severity: 'warn', group: 'Text', title: 'A pull quote runs 40 words or fewer', why: 'It is set at 29px; a long one fills the screen.', fix: 'Quote the one sentence that states the rule.' },
  { id: 'markdown-in-html', severity: 'warn', group: 'Text', title: 'No markdown inside HTML', why: 'Markdown inside a raw HTML block, or inside a brief item, prints as literal asterisks and brackets.', bad: '<p class="pd-deck">The **finding**.</p>', good: '<p class="pd-deck">The <strong>finding</strong>.</p>' },

  // Sources
  { id: 'footnote-refs', severity: 'error', group: 'Sources', title: 'Every citation has a footnote, and every footnote is cited', why: 'A marker with no footnote renders as literal text; a footnote nobody cites is dropped from the page.', fix: 'Add the missing [^n]: line, or cite the footnote where its figure appears.' },
  { id: 'footnote-format', severity: 'warn', group: 'Sources', title: 'Footnotes open with the publisher in bold and carry a link', why: 'The template reads "**Publisher.** Title" into the article\'s structured data as citations.', good: '[^9]: **Veeva.** Title, date. What was measured. What it does not show. [Report title](https://...)' },
  { id: 'data-mark', severity: 'error', group: 'Sources', title: 'Every data mark has a record', why: 'The build fails on a mark the component registry does not declare; this finds it before the build.', fix: 'Add the record to src/data/components/<article>.ts, or fix the id.' },

  // Figures
  { id: 'figure-title', severity: 'error', group: 'Figures', title: 'Charts and calculators are named', why: 'The eyebrow names what a chart shows, and the title names a calculator, for sighted readers and screen readers alike.', good: '<p class="pd-eyebrow">One primary checking customer, one year</p>' },
  { id: 'units-count', severity: 'error', group: 'Figures', title: 'A unit stat fills as many units as its number says', why: '95% is 19 of 20. A number edited without its units, or units without the number, shows the reader two different figures.', fix: 'Rebuild it with the unit stat controls at /ui/components/unit-stat.' },
  { id: 'stack-scale', severity: 'error', group: 'Figures', title: 'A stacked bar\'s parts sit on one scale and add up to its total', why: 'Every segment and line in the figure shares one scale, each segment starts where the last one ends, and the total printed on the bar is the sum of its parts.', fix: 'Rebuild it with the stacked bar controls at /ui/components/stacked-bar.' },
  { id: 'scrolly-steps', severity: 'error', group: 'Figures', title: 'A pinned sequence\'s steps run in order and its graphic uses only those steps', why: 'Steps numbered 1, 2, 3 in reading order drive the graphic; a part waiting for a step that does not exist never appears.', fix: 'Number the steps from 1 and keep every data-at in the graphic within them.' },
  { id: 'calc-names', severity: 'error', group: 'Figures', title: 'A calculator\'s formulas use only names it defines', why: 'A formula that names a field that does not exist computes nothing, and the output reads $0 with no error.', fix: 'Give the input a matching data-var, or define the name in data-define before it is used.' },
  { id: 'bars-scale', severity: 'error', group: 'Figures', title: 'Every bar in a static bar chart sits on one scale from zero', why: 'Older articles draw static bar charts by hand. A bar edited after its value changed misstates the comparison; the check reads each printed value and its width and finds the bar that disagrees.', fix: 'Set the width to the value the message gives, or rebuild the figure as a kit stacked bar.' },
  { id: 'bars-max', severity: 'warn', group: 'Figures', title: 'The longest static bar stops at 78% of the track', why: 'The value label sits at the tip of the bar and needs the rest of the track.', fix: 'Scale the chart so its largest value reaches 78%.' },
  { id: 'chart-source', severity: 'warn', group: 'Figures', title: 'Every figure that shows a number carries its source', why: 'A figure without its source asks the reader to trust it.', fix: 'Add a figcaption that names who measured it, the sample and the year.' },
  { id: 'source-line-footnote', severity: 'warn', group: 'Figures', title: 'A source line ends on its footnotes', why: 'The source line names the study; the footnote carries the link, the method and what the figure does not show.', good: '*Veeva Pulse, 2022 and 2025; Veeva sells the CRM.*[^14]' },
  { id: 'source-after-chart', severity: 'error', group: 'Figures', title: 'Prose does not follow a chart that styles its next paragraph', why: 'content-is-data.css styles any paragraph right after a cd- chart, stat or record as a source line, so prose placed there prints small and gray.', fix: 'Put the source line first, or move the paragraph.' },

  // Images
  { id: 'img-attrs', severity: 'error', group: 'Images', title: 'Images carry width, height and alt text, and load lazily', why: 'Width and height reserve the space so the page does not shift; alt text describes the image; lazy loading keeps illustrations off the first paint.', good: '<img src="/assets/postcard.webp" width="1200" height="720" loading="lazy" alt="A postcard buried under approval stamps.">' },
  { id: 'img-dark', severity: 'warn', group: 'Images', title: 'Illustrations have a dark version', why: 'The site follows the reader\'s theme; a light drawing on the navy ground reads as a hole in the page.', good: '<source srcset="/assets/postcard-dark.webp" type="image/webp" media="(prefers-color-scheme: dark)">' },
  { id: 'img-files', severity: 'error', group: 'Images', title: 'Every image file exists', why: 'A missing file is a broken image on the live page.', fix: 'Add the file to public/assets or fix the path.' },
  { id: 'img-aspect', severity: 'error', group: 'Images', title: 'Light and dark files share the declared aspect ratio', why: 'When the theme swaps the file, a different shape moves everything below it.', fix: 'Export both versions at the ratio in the img width and height.' },
  { id: 'img-weight', severity: 'warn', group: 'Images', title: 'Illustration files stay under 300 KB', why: 'PageSpeed holds in the high 90s only while images stay small.', fix: 'Export WebP at 1200 wide.' },

  // Markup
  { id: 'class-defined', severity: 'error', group: 'Markup', title: 'Every class is defined in a stylesheet the article loads', why: 'A typo in a class name fails silently; the figure just renders unstyled.', fix: 'Fix the name, or load the stylesheet that defines it.' },
  { id: 'kit-assets', severity: 'error', group: 'Markup', title: 'An article that uses the kit loads it', why: 'Kit figures need the kit stylesheet to look right and the kit script to build, fill, count up and compute. Without the script a calculator shows its first numbers and never changes.', fix: 'Add stylesheets: ["/assets/article-kit.css"] and scripts: ["/assets/article-kit.js"] to the front matter.' },
  { id: 'inline-style', severity: 'error', group: 'Markup', title: 'Inline styles only carry data geometry', why: 'Colours, fonts and spacing live in the stylesheet so both themes and every article stay in step. Bar widths, heights and positions are data, and custom properties carry counts.', bad: 'style="color:#B8411E"', good: 'style="left:44.0%;width:45.3%"' },

  // Stylesheets
  { id: 'css-color', severity: 'error', group: 'Stylesheets', title: 'Colours come from tokens', why: 'A literal colour does not switch with the theme. The print block and token definitions are exempt.', bad: 'color: #0A192F;', good: 'color: var(--paper);' },
  { id: 'type-tokens', severity: 'error', group: 'Stylesheets', title: 'Faces, weights, line spacing and tracking come from the base', why: 'site-shell.css is the root of the cascade: it names the three typefaces and their fallbacks, three weights, five kinds of line spacing and the tracking for small capitals. Every other sheet uses those tokens, so one change at the root moves the whole site, and nothing drifts a shade off.', bad: "font-family: 'IBM Plex Sans', sans-serif;\nline-height: 1.42;\nfont-weight: 500;", good: 'font-family: var(--font-sans);\nline-height: var(--leading-text);\nfont-weight: var(--weight-regular);' },
  { id: 'space-tokens', severity: 'error', group: 'Stylesheets', title: 'Spacing and the grid come from the base', why: 'Every margin, padding and gap is a step of the 4px spacing scale in site-shell.css, and the containers, gutter, rail and text measures are grid tokens, so the rhythm holds from page to page and one change at the root moves it everywhere. 0, auto, percentages, viewport units and a 1px hairline pass.', bad: 'padding: 18px 22px;\nmax-width: 68ch;', good: 'padding: var(--space-5) var(--space-6);\nmax-width: var(--measure-1);' },
  { id: 'css-layer', severity: 'error', group: 'Stylesheets', title: 'Every rule sits in a cascade layer', why: 'site-shell.css declares the order once: base, site, kit, page, utilities. A later layer wins over an earlier one whatever its selectors, so a page never needs !important to beat the base, and the order the sheets load in stops mattering. A rule outside the layers beats all of them, and a layer with another name has no place in the order.', fix: 'Wrap the sheet in @layer base, site, kit, page or utilities: the shell and article template are site, the kit is kit, one page\'s own sheet is page.', good: '@layer page {\n  .hero { margin: 0; }\n}' },
  { id: 'css-radius', severity: 'warn', group: 'Stylesheets', title: 'Corners stay square', why: 'Rounded cards read as a software template. Bar ends and inputs round by 4px at most; a 50% radius draws a dot and is allowed.' },
  { id: 'css-gradient', severity: 'warn', group: 'Stylesheets', title: 'No gradients', why: 'Flat fills and hard rules. Hatching with repeating-linear-gradient is allowed; it draws ranges.' },
  { id: 'css-shadow', severity: 'warn', group: 'Stylesheets', title: 'No soft shadows', why: 'Depth comes from rules and panels. A zero-blur inset shadow drawing a hairline is allowed.' },
  { id: 'type-scale', severity: 'error', group: 'Stylesheets', title: 'Font sizes come from the type scale', why: 'Every size on the site is a step of one scale in site-shell.css: body text is step 0 at 20px, each step is 1.2 times the one below, and 14px is the smallest. A size between steps, a clamp() or anything under 14px breaks the hierarchy.', bad: 'font-size: 13px;', good: 'font-size: var(--step--2);' },
  { id: 'css-breakpoint', severity: 'error', group: 'Stylesheets', title: 'Media and container queries use their breakpoint scales', why: 'The page changes layout at four widths: 480, 760, 1040 and 1180, in stylesheets and in scripts that call matchMedia. Range syntax, (width < 760px), cannot leave a 759/760 gap. Components answer to their column with container queries at 560 and 900 instead. A table keeps its columns from 760 up, so its rows turn into cards only below 760 or in print.', fix: 'Write it as (width < 760px) or (width >= 1040px), with a width from the scale.' },
  { id: 'css-bem', severity: 'error', group: 'Stylesheets', title: 'Class names say block, element or modifier', why: 'A class names a block (booking-line), a part of one (booking-line__button) or a variant of one (btn--small), so the name says where it belongs and what it changes. is- names are kept for states a script turns on and off, such as is-open. Two blocks chained in one selector hide a variant that should be a modifier.', bad: '.market-row.is-plan { }\n.plain-link .plain-link-title { }', good: '.market-row--plan { }\n.plain-link__title { }' },

  // Across articles
  { id: 'signature-spacing', severity: 'warn', group: 'Across articles', title: 'Signature devices are not reused back to back', why: 'A device that identifies one piece reads as repetition in the next one. Leave at least a month and at least one article between uses.', fix: 'Pick a shared component, or hold the device for a later piece.' },
];

const RULE = Object.fromEntries(RULES.map((r) => [r.id, r]));

// ------------------------------------------------------------------ helpers

const lineOf = (text, index) => {
  let line = 1;
  let last = -1;
  for (let i = 0; i < index && i < text.length; i++) if (text[i] === '\n') { line += 1; last = i; }
  return { line, col: index - last };
};

const plainText = (html) => String(html)
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z]+;|&#\d+;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const words = (s) => plainText(s).split(' ').filter(Boolean).length;

// Suppressions: line number -> set of rule ids ('*' when the comment names none we know).
function suppressions(text) {
  const map = new Map();
  const re = /(?:<!--|\/\*)\s*style-ok:\s*([^*]*?)(?:-->|\*\/)/g;
  for (const m of text.matchAll(re)) {
    const { line } = lineOf(text, m.index);
    const ids = m[1].replace(/\(.*$/s, '').split(/[\s,]+/).filter((t) => RULE[t]);
    const set = map.get(line) ?? new Set();
    (ids.length ? ids : ['*']).forEach((id) => set.add(id));
    map.set(line, set);
  }
  return map;
}
const suppressed = (map, line, id) => [line, line - 1].some((l) => map.get(l)?.has(id) || map.get(l)?.has('*'));

function makeReporter(file, text) {
  const sup = suppressions(text);
  const findings = [];
  const report = (id, index, message, extra = {}) => {
    const rule = RULE[id];
    const { line, col } = typeof index === 'object' ? index : lineOf(text, index);
    if (suppressed(sup, line, id)) return;
    findings.push({ file, line, col, rule: id, severity: extra.severity ?? rule.severity, message, fix: extra.fix ?? rule.fix ?? '' });
  };
  return { findings, report };
}

// A small reader for the front matter these articles use: scalars, quoted strings, inline
// arrays, and lists of quoted strings.
export function frontMatter(source) {
  const m = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, bodyStart: 0, lines: {} };
  const data = {};
  const lines = {};
  let listKey = null;
  const unquote = (v) => {
    v = v.trim();
    if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
    if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1).replace(/\\"/g, '"');
    if (v === 'true') return true;
    if (v === 'false') return false;
    return v;
  };
  m[1].split('\n').forEach((raw, i) => {
    const item = raw.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      data[listKey].push(unquote(item[1]));
      (lines[listKey + '[]'] ??= []).push(i + 2);
      return;
    }
    const kv = raw.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) return;
    const [, key, value] = kv;
    lines[key] = i + 2;
    if (value === '') { data[key] = []; listKey = key; return; }
    listKey = null;
    if (value.startsWith('[')) {
      data[key] = [...value.matchAll(/"([^"]*)"|'([^']*)'/g)].map((x) => x[1] ?? x[2]);
    } else data[key] = unquote(value);
  });
  return { data, bodyStart: m[0].length, lines };
}

// Blanks out code fences and HTML comments, keeping every newline so offsets still map to lines.
const blank = (s) => s.replace(/[^\n]/g, ' ');
export const maskBody = (body) => body.replace(/^```[\s\S]*?^```/gm, blank).replace(/<!--[\s\S]*?-->/g, blank);

// ------------------------------------------------------------------ images

export function imageSize(path) {
  const b = readFileSync(path);
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i += 1; continue; }
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      i += 2 + b.readUInt16BE(i + 2);
    }
    return null;
  }
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = b.toString('ascii', 12, 16);
    if (chunk === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (chunk === 'VP8L') { const n = b.readUInt32LE(21); return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 }; }
    if (chunk === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    return null;
  }
  const ispe = b.indexOf('ispe');
  if (ispe > 0 && b.toString('ascii', 4, 8) === 'ftyp') return { w: b.readUInt32BE(ispe + 8), h: b.readUInt32BE(ispe + 12) };
  return null;
}

// ------------------------------------------------------------------ stylesheets

// Walks a stylesheet into style rules: { selector, declarations: [{ prop, value, index }], index,
// print, context } with offsets into the original text; context lists the enclosing at-rules.
// Comments are blanked first.
export function parseCss(text) {
  const src = text.replace(/\/\*[\s\S]*?\*\//g, blank);
  const rules = [];
  const stack = [];
  let start = 0;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') {
      const prelude = src.slice(start, i).trim();
      const kind = prelude.startsWith('@') ? (/^@(media|supports|container|layer|keyframes|document)/.test(prelude) ? 'group' : 'at') : 'rule';
      const print = stack.some((s) => s.print) || (kind === 'group' && /^@media\s+print/.test(prelude));
      const frame = { kind, prelude, print, bodyStart: i + 1, keyframes: /^@keyframes/.test(prelude) || stack.some((s) => s.keyframes) };
      stack.push(frame);
      start = i + 1;
    } else if (ch === '}') {
      const frame = stack.pop();
      if (frame && (frame.kind === 'rule' || frame.kind === 'at')) {
        const body = src.slice(frame.bodyStart, i);
        const declarations = [];
        let off = frame.bodyStart;
        for (const part of body.split(';')) {
          const m = part.match(/^(\s*)([-\w]+)\s*:\s*([\s\S]*?)\s*$/);
          if (m) declarations.push({ prop: m[2].toLowerCase(), value: m[3], index: off + m[1].length });
          off += part.length + 1;
        }
        rules.push({ selector: frame.prelude, declarations, print: frame.print, keyframes: frame.keyframes, index: frame.bodyStart, context: stack.map((f) => f.prelude) });
      }
      start = i + 1;
    } else if (ch === ';' && (!stack.length || stack[stack.length - 1].kind === 'group')) {
      start = i + 1;
    }
  }
  return rules;
}

export const cssClasses = (text) => new Set(
  parseCss(text).flatMap((r) => [...r.selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1])),
);

// The base tokens site-shell.css defines for faces, weights, line spacing and tracking.
const CSS_KEYWORD = /^(?:inherit|initial|unset|revert|revert-layer)$/i;
const TYPE_TOKENS = {
  'font-family': [/^var\(--font-(?:display|serif|sans|mono)\)$/, 'var(--font-display), var(--font-serif), var(--font-sans) or var(--font-mono)'],
  'font-weight': [/^var\(--weight-(?:regular|semibold|bold)\)$/, 'var(--weight-regular), var(--weight-semibold) or var(--weight-bold)'],
  'line-height': [/^(?:0|normal|var\(--leading-(?:display|heading|snug|text|body|cap)\))$/, 'a --leading token, or 0'],
  'letter-spacing': [/^(?:0|normal|var\(--tracking-caps\))$/, '0 or var(--tracking-caps)'],
};
// A declaration's type values that are not base tokens, as [property, value] pairs. The font
// shorthand is read as weight, size/line-height and family.
function offTokens(prop, value) {
  const v = value.replace(/\s*!important\s*$/i, '').trim();
  if (CSS_KEYWORD.test(v)) return [];
  if (TYPE_TOKENS[prop]) return TYPE_TOKENS[prop][0].test(v) ? [] : [[prop, v]];
  if (prop !== 'font') return [];
  const out = [];
  const words = v.match(/(?:[^\s(,]+|\([^)]*\))+|,/g) ?? [];
  const at = words.findIndex((w) => shorthandSize(w) !== null);
  if (at < 0) return [];
  for (const w of words.slice(0, at)) if (/^(?:\d+|bold|bolder|lighter|var\(--weight-[\w-]+\))$/.test(w) && !TYPE_TOKENS['font-weight'][0].test(w)) out.push(['font-weight', w]);
  const lh = words[at].split('/')[1];
  if (lh && !TYPE_TOKENS['line-height'][0].test(lh)) out.push(['line-height', lh]);
  const family = words.slice(at + 1).join(' ').replace(/\s+,/g, ',');
  if (family && !TYPE_TOKENS['font-family'][0].test(family)) out.push(['font-family', family]);
  return out;
}

const SCALE = BREAKPOINTS.map((b) => b.px);
const COLUMN_SCALE = COLUMN_BREAKPOINTS.map((b) => b.px);

// One width query, from @media, @container or matchMedia: every width it names must be on `scale`,
// and it must be written in range syntax. The lookahead reads both ends of (760px <= width < 1040px).
function checkQuery(report, index, name, shown, q, scale, scaleName, extra = {}) {
  const widths = [...q.matchAll(/\((?:min|max)-(?:width|inline-size)\s*:\s*([\d.]+)px\)|(?:width|inline-size)\s*[<>]=?\s*([\d.]+)px|([\d.]+)px\s*[<>]=?\s*(?=width|inline-size)/g)];
  for (const w of widths.map((r) => Number(r[1] ?? r[2] ?? r[3]))) {
    if (!scale.includes(w)) report('css-breakpoint', index, `${name} uses ${w}px, which is not on the ${scaleName} (${scale.join(', ')})`, extra);
  }
  if (/\((?:min|max)-(?:width|inline-size)\s*:/.test(q)) report('css-breakpoint', index, `${shown} uses min-width or max-width; write it in range syntax`, extra);
}

// Table cards: rows and cells set to block, grid or flex lose the table's columns. That is only for
// phones and print; from 760 up a table keeps its columns.
const TABLE_PART = /^(?:thead|tbody|tfoot|tr|th|td)(?![-\w])/i;
const TABLE_DISPLAY = /^(?:none|table(?:-[\w-]+)?|inherit|initial|unset|revert|revert-layer|var\(.*)$/i;
// True when every query in an @media list holds only below 760px, or only in print.
const phoneOrPrint = (prelude) => /^@media\b/.test(prelude) && prelude.replace(/^@media\s+/, '').split(',').every((q) => {
  if (/^\s*not\b/.test(q)) return false;
  if (/\bprint\b/.test(q)) return true;
  return [...q.matchAll(/width\s*(<=?)\s*([\d.]+)px|([\d.]+)px\s*(>=?)\s*width|max-width\s*:\s*([\d.]+)px/g)].some((m) => {
    const n = Number(m[2] ?? m[3] ?? m[5]);
    return (m[1] ?? m[4]) === '<' || (m[1] ?? m[4]) === '>' ? n <= 760 : n < 760;
  });
});

// The type scale's steps, --step--2 to --step-10.
const STEPS = new Set(Array.from({ length: 13 }, (_, i) => i - 2));
// A size is a step (var(--step-1)), or it takes its parent's (inherit and its kin).
function offScaleSize(v) {
  const size = v.replace(/\s*!important\s*$/i, '').trim();
  if (/^(?:inherit|initial|unset|revert|revert-layer)$/i.test(size)) return null;
  const step = size.match(/^var\(--step-(-?\d+)\)$/);
  if (step && STEPS.has(Number(step[1]))) return null;
  return size;
}
// Spacing: every part of a margin, padding or gap is a --space step, the gutter, 0, auto, a percentage,
// a viewport unit or a 1px hairline; a calc() may combine those. Text measures and containers are grid tokens.
const SPACE_PROP = /^(?:margin|padding)(?:-(?:top|right|bottom|left|block|inline|block-start|block-end|inline-start|inline-end))?$|^(?:gap|row-gap|column-gap)$/;
function offSpace(value) {
  const v = value.replace(/\s*!important\s*$/i, '').trim();
  if (CSS_KEYWORD.test(v)) return [];
  const bad = [];
  for (const w of v.match(/(?:[^\s(]+\([^()]*(?:\([^()]*\)[^()]*)*\)[^\s]*|[^\s]+)/g) ?? []) {
    if (/^(?:0|auto|-?1px|-?[\d.]+(?:%|vh|vw|svh|dvh|lvh))$/.test(w)) continue;
    if (/^var\(--(?:space-(?:half|\d+)|gutter|rail-gap)\)$/.test(w)) continue;
    if (/^calc\(/.test(w) && !/\d(?:px|em|rem|ch)\b/.test(w.replace(/\b1px\b/g, ''))) continue;
    bad.push(w);
  }
  return bad;
}
const offGrid = (prop, value) => {
  const bad = [];
  if (/^(?:max-width|width|min-width)$/.test(prop)) for (const m of value.matchAll(/(\d+(?:\.\d+)?)ch\b/g)) if (Number(m[1]) >= 26) bad.push(`${m[0]} (a text measure: use a --measure token)`);
  for (const m of value.matchAll(/\b(1240|1060)px\b/g)) bad.push(`${m[0]} (a container: use var(--container-page) or var(--container-article))`);
  return bad;
};

// The size inside a font shorthand: the first word that is a length or a step, before any /line-height.
function shorthandSize(v) {
  if (/^\s*(?:inherit|initial|unset|revert|revert-layer)\s*$/i.test(v)) return null;
  for (const word of v.match(/(?:[^\s(]+|\([^)]*\))+/g) ?? []) {
    const size = word.split('/')[0];
    if (/^(?:var\(--(?!weight-|font-|leading-|tracking-)[\w-]+\)|-?[\d.]+(?:px|rem|em|%|pt)|clamp\(|calc\()/.test(size)) return size;
  }
  return null;
}

export const LAYERS = ['base', 'site', 'kit', 'page', 'utilities'];

// Class names: block, block__element, block--modifier; hyphens inside a name are fine. is- names are
// the states a script turns on and off.
const BEM_NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$/;
export const STATES = ['is-active', 'is-alt', 'is-armed', 'is-current', 'is-embedded', 'is-hot', 'is-landing', 'is-live', 'is-narrow', 'is-on', 'is-open', 'is-scaled', 'is-shown', 'is-tight', 'is-unpinned', 'is-wrong'];

function checkBem(report, rule) {
  const selector = rule.selector.replace(/\[[^\]]*\]/g, '');
  for (const [, n] of selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
    if (n.startsWith('is-')) {
      if (!STATES.includes(n)) report('css-bem', rule.index, `.${n} is not a state a script sets`, { fix: `Write it as a modifier of its block, block--${n.slice(3)}, or add it to STATES if a script toggles it.` });
    } else if (!BEM_NAME.test(n)) report('css-bem', rule.index, `.${n} is not block, block__element or block--modifier`);
  }
  // Chaining: two blocks on one element. What :not(), :has(), :is() and :where() hold is another element or a test.
  for (const sel of selector.replace(/:(?:not|has|is|where)\((?:[^()]|\([^()]*\))*\)/g, '').split(',')) {
    for (const compound of sel.trim().split(/\s*[>+~]\s*|\s+/)) {
      const blocks = [...compound.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]).filter((n) => !n.startsWith('is-') && !n.includes('--'));
      if (blocks.length > 1) report('css-bem', rule.index, `${compound} chains ${blocks.map((n) => '.' + n).join(' and ')}`, { fix: 'Make the variant a modifier (block--variant), or give the part its own element class.' });
    }
  }
}

export function lintCss(file, text) {
  const { findings, report } = makeReporter(file, text);
  const src = text.replace(/\/\*[\s\S]*?\*\//g, blank);
  // Media queries: widths from the scale only, written in range syntax.
  for (const m of src.matchAll(/@media\s+([^{]+)\{/g)) checkQuery(report, m.index, '@media', `@media ${m[1].trim()}`, m[1], SCALE, 'scale');
  // Container queries: widths from the column scale, in range syntax.
  const columnFix = { fix: `Use a width from the column scale (${COLUMN_SCALE.join(', ')}), in range syntax: @container column (width < 560px).` };
  for (const m of src.matchAll(/@container\s+([^{]+)\{/g)) checkQuery(report, m.index, '@container', `@container ${m[1].trim()}`, m[1], COLUMN_SCALE, 'column scale', columnFix);
  for (const rule of parseCss(text)) {
    // A style rule sits in a layer; @page and @font-face describe the paper and the fonts, not the document.
    if (!/^@(?:page|font-face)\b/.test(rule.selector) && !rule.context.some((c) => /^@page\b/.test(c))) {
      const layers = rule.context.filter((c) => /^@layer\b/.test(c)).map((c) => c.replace(/^@layer\s+/, '').trim());
      if (!layers.length) report('css-layer', rule.index, `${rule.selector.slice(0, 60)} is outside the cascade layers`);
      for (const l of layers) if (!LAYERS.includes(l)) report('css-layer', rule.index, `layer "${l}" is not one of ${LAYERS.join(', ')}`);
    }
    if (!rule.selector.startsWith('@')) checkBem(report, rule);
    const parts = rule.selector.split(',').map((s) => s.trim()).filter((s) => {
      const subject = s.split(/\s*[>+~]\s*|\s+/).pop();
      return TABLE_PART.test(subject) && !/::?(?:before|after|marker)/i.test(subject);
    });
    if (parts.length && !rule.print && !rule.context.some(phoneOrPrint)) {
      for (const d of rule.declarations.filter((x) => x.prop === 'display')) {
        const v = d.value.replace(/\s*!important\s*$/i, '').trim();
        if (!TABLE_DISPLAY.test(v)) report('css-breakpoint', d.index, `${parts.join(', ')} set to display: ${v} outside (width < 760px); the table loses its columns from 760 up`, { fix: 'Move it into @media (width < 760px), so the table keeps its columns from 760 up.' });
      }
    }
    for (const d of rule.declarations) {
      if (d.prop.startsWith('--')) continue;
      const v = d.value;
      if (!rule.print && /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/i.test(v)) {
        report('css-color', d.index, `${d.prop}: ${v.slice(0, 60)} uses a literal colour`);
      }
      if ((d.prop === 'font-size' || d.prop === 'font') && !rule.print) {
        const size = d.prop === 'font-size' ? v : shorthandSize(v);
        const off = size === null ? null : offScaleSize(size);
        if (off) report('type-scale', d.index, `${d.prop}: ${off} is not a step of the type scale`, { fix: 'Use var(--step--2) to var(--step-10); /ui/components/type-scale lists what each step is for.' });
      }
      if (!rule.print && SPACE_PROP.test(d.prop)) for (const off of offSpace(v)) report('space-tokens', d.index, `${d.prop}: ${off} is not a step of the spacing scale`, { fix: 'Use var(--space-half) to var(--space-32), or var(--gutter); /ui/foundations lists the scale.' });
      if (!rule.print) for (const off of offGrid(d.prop, v)) report('space-tokens', d.index, `${d.prop}: ${off}`);
      for (const [prop, off] of offTokens(d.prop, v)) {
        report('type-tokens', d.index, `${prop}: ${off} is not a base token`, { fix: `Use ${TYPE_TOKENS[prop][1]}, from site-shell.css.` });
      }
      if (d.prop.includes('radius')) {
        // 50% draws a circle (a dot or a marker), which is a shape rather than a rounded card.
        const big = [...v.matchAll(/(\d+(?:\.\d+)?)(px|rem|em|%)/g)].some(([, n, u]) => (u === 'px' ? Number(n) : u === '%' ? (Number(n) === 50 ? 0 : 50) : Number(n) * 16) > 4);
        if (big) report('css-radius', d.index, `${d.prop}: ${v} rounds corners past 4px`);
      }
      if (/(?<!repeating-)(?:linear|radial|conic)-gradient\(/.test(v)) report('css-gradient', d.index, `${d.prop} draws a gradient`);
      if (d.prop === 'box-shadow' && v !== 'none') {
        for (const layer of v.split(/,(?![^(]*\))/)) {
          const lens = [...layer.replace(/\([^)]*\)/g, '').matchAll(/(-?\d*\.?\d+)(px|rem|em)?/g)].map((m) => Number(m[1]));
          if (lens.length >= 3 && lens[2] !== 0) report('css-shadow', d.index, `box-shadow has a ${lens[2]}px blur`);
        }
      }
    }
  }
  return findings;
}

// ------------------------------------------------------------------ scripts

// A script that asks matchMedia for a width asks the stylesheet's question, so it uses the same scale
// and range syntax. Queries without a width (prefers-reduced-motion) pass untouched.
export function lintScript(file, text) {
  const { findings, report } = makeReporter(file, text);
  for (const m of text.matchAll(/matchMedia\s*\(\s*(['"`])([^'"`]*)\1/g)) checkQuery(report, m.index, 'matchMedia', `matchMedia('${m[2]}')`, m[2], SCALE, 'scale');
  return findings;
}

// ------------------------------------------------------------------ articles

const ROOT_CSS = ['/assets/site-shell.css', '/assets/personal-site.css', '/assets/article.css'];
const TITLE_MINOR = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet', 'as', 'at', 'by', 'in', 'of', 'on', 'to', 'up', 'via', 'vs']);
const COLOPHON = /^(about the numbers|sources|notes|method|methodology)$/i;
const FIGURE_NAMES = { tl: 'timeline', units: 'unit stat', stack: 'stacked bar', cols: 'rising columns chart', asof: 'as-of slider', stat: 'stat line', bars: 'bar chart' };
const FIGURE_TYPES = /\b(?:pd|cd)-(bars|tl|markets|widget|stat|record|units|stack|cols|calc|asof)\b/;

export function isTitleCase(title) {
  const ws = title.replace(/[^\w\s'-]/g, ' ').split(/\s+/).filter(Boolean);
  return ws.every((w, i) => i === 0 || i === ws.length - 1 || TITLE_MINOR.has(w.toLowerCase()) || /^[A-Z0-9]/.test(w));
}
// Title case: three or more words, and every word past the first that is not a minor word is capitalized.
export function looksTitleCased(heading) {
  const ws = heading.replace(/[^\w\s'-]/g, ' ').split(/\s+/).filter(Boolean).slice(1).filter((w) => !TITLE_MINOR.has(w.toLowerCase()) && /^[a-z]/i.test(w));
  return ws.length >= 2 && ws.every((w) => /^[A-Z]/.test(w));
}

// Registry ids from src/data/components/*.ts, read as text so this module needs no TypeScript.
export function registryIds(root) {
  const dir = join(root, 'src/data/components');
  const ids = new Set();
  if (!existsSync(dir)) return ids;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts'))) {
    for (const m of readFileSync(join(dir, f), 'utf8').matchAll(/\bid:\s*'([^']+)'/g)) ids.add(m[1]);
  }
  return ids;
}

// The figures in a body: { type, open, html, start, end, after } where `after` is the next block.
function figures(body) {
  const out = [];
  const re = /<(figure|p)\b[^>]*class="([^"]*)"[^>]*>/g;
  for (const m of body.matchAll(re)) {
    const type = m[2].match(FIGURE_TYPES)?.[1];
    if (!type) continue;
    if (m[1] === 'p' && type !== 'stat') continue;
    const close = m[1] === 'figure' ? body.indexOf('</figure>', m.index) : body.indexOf('</p>', m.index);
    if (close < 0) continue;
    const end = close + (m[1] === 'figure' ? 9 : 4);
    const rest = body.slice(end);
    const nextBlock = rest.match(/^\s*\n\s*\n?([^\n]*)/)?.[1] ?? '';
    out.push({ type, ns: m[2].match(/\b(pd|cd)-(?:bars|tl|markets|widget|stat|record|units|stack|cols|calc|asof)\b/)[1], cls: m[2], html: body.slice(m.index, end), start: m.index, end, after: nextBlock });
  }
  return out;
}

function barRows(html) {
  const parts = html.split(/<div class="(?:pd|cd)-bars-row\b/).slice(1);
  return parts.map((part) => {
    const width = (cls) => {
      const m = part.match(new RegExp(`class="[^"]*-bars-${cls}"[^>]*style="([^"]*)"`));
      if (!m) return null;
      const left = Number(m[1].match(/left:\s*([\d.]+)%/)?.[1] ?? 0);
      const w = Number(m[1].match(/width:\s*([\d.]+)%/)?.[1] ?? NaN);
      return { left, width: w };
    };
    const bar = width('bar');
    const range = width('range');
    const val = part.match(/class="[^"]*-bars-val"[^>]*style="left:\s*([\d.]+)%"[^>]*>([\s\S]*?)<\/span>\s*<\/div>/);
    const text = val ? val[2].replace(/<[^>]+>/g, '') : '';
    const nums = [...text.replace(/,/g, '').matchAll(/\d+(?:\.\d+)?/g)].map((x) => Number(x[0]));
    return {
      text,
      value: readNumber(text),
      to: range && nums.length > 1 ? nums[1] : null,
      width: bar?.width ?? null,
      rangeEnd: range ? range.left + range.width : null,
      rangeStart: range ? range.left : null,
      label: val ? Number(val[1]) : null,
    };
  });
}

const money = (t) => { const m = String(t).replace(/<[^>]+>/g, '').match(/-?\$?\s*([\d,]+(?:\.\d+)?)/); return m ? Number(m[1].replace(/,/g, '')) : null; };
const geom = (style, prop) => { const m = String(style ?? '').match(new RegExp(`(?:^|;)\\s*${prop}:\\s*(-?[\\d.]+)%`)); return m ? Number(m[1]) : null; };

// Unit stats: data-value of data-of, the printed percent, and (in the kit) the cells in the HTML.
function checkUnits(html, where, report) {
  const value = Number(html.match(/data-value="(\d+)"/)?.[1]);
  const of = Number(html.match(/data-of="(\d+)"/)?.[1]);
  if (!Number.isFinite(value) || !Number.isFinite(of) || !of) { report('units-count', where, 'the unit stat has no data-value and data-of'); return; }
  const printed = Number(html.match(/class="(?:pd-num pd-num--xl|fd-stat-num)"[^>]*>\s*([\d.]+)\s*%/)?.[1]);
  if (Number.isFinite(printed) && Math.abs((value / of) * 100 - printed) > 1) report('units-count', where, `${value} of ${of} is ${Math.round((value / of) * 1000) / 10}%, but the stat prints ${printed}%`);
  const cells = (html.match(/class="pd-cell\b/g) ?? []).length;
  if (cells) {
    const on = (html.match(/class="pd-cell is-on"/g) ?? []).length;
    if (cells !== of) report('units-count', where, `the stat has ${cells} units but data-of says ${of}`);
    if (on !== value) report('units-count', where, `${on} units are filled but data-value says ${value}`);
  }
}

// Stacked bars: one scale for every segment and line, segments end to end, totals that add up.
function checkStack(html, where, report) {
  const scale = [];
  for (const bar of html.split(/<div class="pd-bar"/).slice(1)) {
    // A lone segment has no label; its number is in data-value.
    const segs = [...bar.matchAll(/<div class="pd-seg(?=[\s"])[^"]*"[^>]*style="([^"]*)"[^>]*>(?:<span class="pd-seg__label">([\s\S]*?)<\/span>)?<\/div>/g)].map((m) => {
      const shown = (m[2] ?? '').replace(/<span class="pd-seg__word">[^<]*<\/span>/, '').replace(/<[^>]+>/g, '').trim();
      const given = m[0].match(/data-value="([\d.]+)"/);
      return { left: geom(m[1], 'left'), width: geom(m[1], 'width'), value: given ? Number(given[1]) : money(shown), shown, places: (shown.match(/\.(\d+)/)?.[1] ?? '').length };
    });
    let edge = 0;
    for (const sg of segs) {
      if (sg.left !== null && Math.abs(sg.left - edge) > 0.3) report('stack-scale', where, `a segment starts at ${sg.left}% but the one before it ends at ${Math.round(edge * 10) / 10}%`);
      edge = (sg.left ?? edge) + (sg.width ?? 0);
      if (sg.value && sg.width) scale.push({ value: sg.value, width: sg.width, text: sg.shown || `the segment at ${sg.value}` });
    }
    // A range runs on from the end of the last segment to its data-to value, on the same scale.
    const range = bar.match(/<div class="pd-range\b[^"]*"[^>]*data-to="([\d.]+)"[^>]*style="([^"]*)"/);
    if (range && segs.length) {
      const last = segs[segs.length - 1];
      const left = geom(range[2], 'left');
      const width = geom(range[2], 'width') ?? 0;
      if (left !== null && Math.abs(left - edge) > 0.3) report('stack-scale', where, `a range starts at ${left}% but its segment ends at ${Math.round(edge * 10) / 10}%`);
      const to = Number(range[1]);
      if (last.value !== null && to > last.value) scale.push({ value: segs.reduce((t, sg) => t + (sg.value ?? 0), 0) - last.value + to, width: (left ?? edge) + width, text: `the range to ${to}` });
      else report('stack-scale', where, `a range ends at ${to}, which is not above its segment's ${last.value}`);
    }
    const mark = bar.match(/<div class="pd-mark\b[^"]*"[^>]*style="([^"]*)"[^>]*><span[^>]*>([^<]*)<\/span>/);
    if (mark && money(mark[2])) scale.push({ value: money(mark[2]), width: geom(mark[1], 'left'), text: mark[2] });
    const shownTotal = (bar.match(/class="pd-num pd-num--s(?: pd-bar__value)?"[^>]*>([\s\S]*?)<\/span><\/div>/)?.[1] ?? '').replace(/<[^>]+>/g, '').trim();
    const total = money(shownTotal);
    const sum = segs.reduce((t, sg) => t + (sg.value ?? 0), 0);
    // Each printed part can be off by half its last digit, so the parts may drift that far from the total.
    const slack = segs.reduce((t, sg) => t + 0.5 * 10 ** -sg.places, 0) + 1e-9;
    if (total !== null && segs.length && Math.abs(total - sum) > Math.max(0.5, slack)) report('stack-scale', where, `the bar prints ${shownTotal} but its parts add up to ${shownTotal.replace(/[\d,]+(?:\.\d+)?/, num(Math.round(sum * 100) / 100))}`);
  }
  for (const r of offScale(scale, 0.4)) report('stack-scale', where, `"${r.text}" is drawn at ${r.width}% but the figure's scale puts it at ${r.want}%`);
}

// Pinned sequences: steps 1..n in order, and no part waiting for a step past n.
function checkScrolly(html, where, report) {
  const steps = [...html.matchAll(/class="(?:pd-scrolly__step|fd-step)"[^>]*data-step="(\d+)"/g)].map((m) => Number(m[1]));
  steps.forEach((n, i) => { if (n !== i + 1) report('scrolly-steps', where, `step ${i + 1} is numbered ${n}`); });
  const graphic = html.slice(html.search(/class="(?:pd-scrolly__sticky|fd-sticky)"/));
  const ats = [...graphic.matchAll(/data-at="(\d+)"/g)].map((m) => Number(m[1]));
  const late = ats.filter((a) => a > steps.length);
  if (late.length) report('scrolly-steps', where, `the graphic waits for step ${Math.max(...late)}, but there are ${steps.length} steps`);
  if (!/aria-label="[^"]+"/.test(html.slice(0, html.indexOf('>')))) report('scrolly-steps', where, 'the section has no aria-label', { severity: 'warn' });
}

// Calculators: every name a formula, output, bar or toggle uses is an input or an earlier definition.
const CALC_FN = new Set(['round', 'ceil', 'floor', 'min', 'max', 'abs']);
function checkCalc(html, where, report) {
  const known = new Set([...html.matchAll(/data-var="([\w]+)"/g)].map((m) => m[1]));
  const names = (expr) => [...String(expr).matchAll(/[A-Za-z_]\w*/g)].map((m) => m[0]).filter((n) => !CALC_FN.has(n));
  const define = html.match(/data-define="([^"]*)"/)?.[1] ?? '';
  for (const part of define.split(';').map((d) => d.trim()).filter(Boolean)) {
    const [name, expr] = part.split('=').map((x) => x.trim());
    if (!name || expr === undefined) { report('calc-names', where, `"${part}" is not name = formula`); continue; }
    for (const n of names(expr)) if (!known.has(n)) report('calc-names', where, `${name} uses "${n}", which no input or earlier formula defines`);
    known.add(name);
  }
  const uses = [...html.matchAll(/data-(out|w|x|scale)="([^"]*)"/g)].flatMap((m) => names(m[2]).map((n) => [m[1], n]));
  uses.push(...[...html.matchAll(/data-set="(\w+)=/g)].map((m) => ['set', m[1]]));
  for (const [attr, n] of uses) if (!known.has(n)) report('calc-names', where, `data-${attr} uses "${n}", which the calculator never defines`);
}

/**
 * Lints one article. `ctx` gives the site root, the registry ids and, for the spacing rule, every
 * article as { slug, date, draft, devices }.
 */
export function lintArticle(file, source, ctx) {
  const { findings, report } = makeReporter(file, source);
  const { data, bodyStart, lines } = frontMatter(source);
  const at = (key) => ({ line: lines[key] ?? 1, col: 1 });
  const body = maskBody(source.slice(bodyStart));
  const off = (i) => bodyStart + i;
  const brief = Array.isArray(data.brief) ? data.brief : [];

  // Front matter
  if (brief.length < 3 || brief.length > 6) report('fm-brief', at('brief'), brief.length ? `the brief has ${brief.length} points` : 'there is no brief');
  const desc = String(data.description ?? '');
  if (desc.length < 70 || desc.length > 200) report('fm-description', at('description'), `the description is ${desc.length} characters`);
  if (!data.kicker) report('fm-kicker', at('title'), 'no kicker');
  if (data.title && !isTitleCase(String(data.title))) report('fm-title-case', at('title'), `"${data.title}" is not in title case`);
  if (data.ogImage && !data.ogImageAlt) report('fm-social', at('ogImage'), 'ogImage has no ogImageAlt');
  if (!data.ogImage) report('fm-social', at('title'), 'no ogImage; the page shares the site default image', { severity: 'info' });
  brief.forEach((item, i) => {
    const where = { line: lines['brief[]']?.[i] ?? at('brief').line, col: 1 };
    if (/\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)/.test(item)) report('markdown-in-html', where, 'brief items render as HTML; markdown prints literally');
  });

  // Headings, decks, prose lines
  let seenH2 = false;
  const blockLines = body.split('\n');
  let pos = 0;
  let inHtml = false;
  let quote = null;
  const flushQuote = () => {
    if (quote && words(quote.text) > 40) report('pullquote-length', off(quote.index), `the pull quote runs ${words(quote.text)} words`);
    quote = null;
  };
  for (let i = 0; i < blockLines.length; i++) {
    const line = blockLines[i];
    const idx = pos;
    pos += line.length + 1;
    if (!line.trim()) { inHtml = false; flushQuote(); continue; }
    if (/^\s{0,3}</.test(line) && !inHtml) inHtml = true;
    const h = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (h && !inHtml) {
      const level = h[1].length;
      const text = h[2];
      if (level === 1) report('heading-h1', off(idx), 'the template renders the only h1');
      if (level === 2) seenH2 = true;
      if ((level === 3 && !seenH2) || level >= 4) report('heading-order', off(idx), level >= 4 ? `h${level} goes deeper than a section and its parts` : 'a ### comes before any ## section');
      if (level >= 2 && looksTitleCased(text)) report('heading-case', off(idx), `"${text}" reads as title case`);
      if (level >= 2 && (words(text) > 12 || /[.:]$/.test(text))) report('heading-length', off(idx), words(text) > 12 ? `"${text}" runs ${words(text)} words` : `"${text}" ends in punctuation`);
      if (level === 2 && !COLOPHON.test(text.trim())) {
        const next = blockLines.slice(i + 1).find((l) => l.trim());
        if (!next || !/class="[^"]*\b(?:pd|cd|fd)-deck\b/.test(next)) report('section-deck', off(idx), `"${text}" opens without a deck`);
      }
      continue;
    }
    if (/^>\s?/.test(line) && !inHtml) {
      quote = quote ?? { index: idx, text: '' };
      quote.text += ` ${line.replace(/^>\s?/, '')}`;
    }
    const deck = line.match(/class="[^"]*\b(?:pd|cd|fd)-deck\b[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    if (deck && words(deck[1]) > 40) report('deck-length', off(idx), `the deck runs ${words(deck[1])} words`);
    if (inHtml) {
      if (/\*\*[^*\s][^*]*\*\*/.test(line.replace(/<[^>]+>/g, ' ')) || /(?<!\])\[[^\]^]+\]\((?:https?:|\/)[^)]*\)/.test(line)) report('markdown-in-html', off(idx), 'markdown inside a raw HTML block prints literally');
      continue;
    }
    if (/^\s*(\||\[\^\d+\]:)/.test(line)) continue;
  }
  flushQuote();

  // Links
  for (const m of body.matchAll(/\[([^\]^][^\]]*)\]\([^)]*\)|<a\b[^>]*>([\s\S]*?)<\/a>/g)) {
    const text = plainText(m[1] ?? m[2]).toLowerCase();
    if (/^(here|click here|this|link|read more|learn more|more|this link)$/.test(text)) report('link-text', off(m.index), `link text "${text}"`);
  }

  // Footnotes
  const defs = new Map();
  for (const m of body.matchAll(/^\[\^([^\]]+)\]:\s*(.*)$/gm)) defs.set(m[1], { index: m.index, text: m[2] });
  const refs = new Map();
  for (const m of body.matchAll(/\[\^([^\]]+)\](?!:)/g)) if (!refs.has(m[1])) refs.set(m[1], m.index);
  for (const [id, index] of refs) if (!defs.has(id)) report('footnote-refs', off(index), `[^${id}] has no footnote`);
  for (const [id, d] of defs) {
    if (!refs.has(id)) report('footnote-refs', off(d.index), `footnote [^${id}] is never cited, so the page drops it`, { severity: 'warn' });
    if (!/^\*\*[^*]+\*\*/.test(d.text)) report('footnote-format', off(d.index), `footnote [^${id}] does not open with the publisher in bold`);
    else if (!/\]\(https?:\/\//.test(d.text)) report('footnote-format', off(d.index), `footnote [^${id}] has no link`);
  }

  // Data marks, in the body and the brief
  const ids = ctx.registryIds;
  if (ids) {
    for (const m of body.matchAll(/<data value="c:([^"]+)">/g)) if (!ids.has(m[1])) report('data-mark', off(m.index), `"${m[1]}" has no record in src/data/components`);
    brief.forEach((item, i) => {
      for (const m of item.matchAll(/<data value="c:([^"]+)">/g)) if (!ids.has(m[1])) report('data-mark', { line: lines['brief[]']?.[i] ?? 1, col: 1 }, `"${m[1]}" has no record in src/data/components`);
    });
  }

  // Figures
  for (const f of figures(body)) {
    const where = off(f.start);
    const named = f.type === 'calc' ? /class="[^"]*\bpd-calc__title\b/ : /class="[^"]*\b(?:pd-eyebrow|cd-widget-title)\b/;
    if (['bars', 'tl', 'markets', 'widget', 'stack', 'cols', 'calc', 'asof'].includes(f.type) && !named.test(f.html)) report('figure-title', where, f.type === 'calc' ? 'the calculator has no pd-calc-title' : `the ${f.type} figure has no eyebrow`);
    const italicNext = /^\s*(\*[^*]|_[^_]|<p[^>]*>\s*<em>|<p class="[^"]*pd-source)/.test(f.after);
    if (['bars', 'tl', 'stat', 'record', 'units', 'stack', 'cols', 'asof'].includes(f.type) && !/<figcaption/.test(f.html) && !italicNext) report('chart-source', where, `the ${FIGURE_NAMES[f.type] ?? f.type} has no caption`);
    if (f.type === 'units') checkUnits(f.html, where, report);
    if (f.type === 'stack') checkStack(f.html, where, report);
    if (f.type === 'calc') checkCalc(f.html, where, report);
    if (italicNext && /^\s*[*_]/.test(f.after) && !/\[\^[^\]]+\]\s*$/.test(f.after.trim())) report('source-line-footnote', off(f.end), 'the source line after this figure cites no footnote');
    if (f.ns === 'cd' && ['bars', 'stat', 'record'].includes(f.type) && f.after.trim() && !italicNext && !/^\s*</.test(f.after)) {
      report('source-after-chart', off(f.end), `the paragraph after this ${f.type} renders as a source line: "${plainText(f.after).slice(0, 50)}..."`);
    }
    if (f.type === 'bars') {
      const rows = barRows(f.html);
      for (const r of offScale(rows)) report('bars-scale', where, `"${r.text}" is drawn at ${r.width}% but the chart's scale puts ${r.value} at ${r.want}%${r.range ? ' (range end)' : ''}`);
      for (const r of rows) {
        const tip = r.rangeEnd ?? r.width;
        if (r.label !== null && tip !== null && Math.abs(r.label - tip) > 0.3) report('bars-scale', where, `the label "${r.text}" sits at ${r.label}% but its bar ends at ${Math.round(tip * 10) / 10}%`);
      }
      const longest = Math.max(...rows.map((r) => r.rangeEnd ?? r.width ?? 0));
      if (longest > BAR_MAX + 0.5) report('bars-max', where, `the longest bar reaches ${longest}%`);
    }
  }

  // Pinned sequences, and the front door's own unit stats
  for (const m of body.matchAll(/<section\b[^>]*class="[^"]*\b(?:pd|fd)-scrolly\b[^"]*"[^>]*>[\s\S]*?<\/section>/g)) checkScrolly(m[0], off(m.index), report);
  for (const m of body.matchAll(/<figure\b[^>]*class="fd-stat"[^>]*>[\s\S]*?<\/figure>/g)) checkUnits(m[0], off(m.index), report);

  // Images
  for (const m of body.matchAll(/<picture\b[\s\S]*?<\/picture>|<img\b[^>]*>/g)) {
    if (m[0].startsWith('<img') && body.slice(Math.max(0, m.index - 400), m.index).match(/<picture\b(?![\s\S]*<\/picture>)/)) continue;
    const img = m[0].match(/<img\b[^>]*>/)?.[0] ?? '';
    const attr = (name) => img.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
    const where = off(m.index);
    const missing = ['width', 'height'].filter((a) => !attr(a));
    if (attr('alt') === undefined || (attr('alt') === '' && !/aria-hidden="true"/.test(m[0]))) missing.push('alt');
    if (missing.length) report('img-attrs', where, `the image has no ${missing.join(', ')}`);
    if (attr('loading') !== 'lazy') report('img-attrs', where, 'the image does not load lazily', { severity: 'warn' });
    const dark = m[0].match(/<source\b[^>]*media="\(prefers-color-scheme:\s*dark\)"[^>]*>/)?.[0];
    if (!dark) report('img-dark', where, 'no dark version');
    const files = [attr('src'), dark?.match(/srcset="([^"\s]+)/)?.[1]].filter((s) => s && s.startsWith('/'));
    const sizes = [];
    for (const src of files) {
      const path = join(ctx.root, 'public', src);
      if (!existsSync(path)) { report('img-files', where, `${src} does not exist`); continue; }
      const bytes = statSync(path).size;
      if (bytes > 300 * 1024) report('img-weight', where, `${src} is ${Math.round(bytes / 1024)} KB`);
      const size = imageSize(path);
      if (size) sizes.push({ src, ...size });
    }
    const declared = Number(attr('width')) / Number(attr('height'));
    for (const s of sizes) {
      const ratio = s.w / s.h;
      if (Number.isFinite(declared) && Math.abs(ratio - declared) / declared > 0.01) report('img-aspect', where, `${s.src} is ${s.w} by ${s.h}; the img declares ${attr('width')} by ${attr('height')}`);
    }
  }

  // Classes and inline styles, in the body and the brief
  const html = [body, ...brief].join('\n');
  const known = ctx.classesFor ? ctx.classesFor([...ROOT_CSS, ...(data.stylesheets ?? [])]) : null;
  const seenClass = new Set();
  for (const m of html.matchAll(/\sclass="([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/).filter(Boolean)) {
      if (!known || known.has(c) || c.startsWith('js-') || seenClass.has(c)) continue;
      seenClass.add(c);
      report('class-defined', m.index < body.length ? off(m.index) : at('brief'), `"${c}" is not defined in ${[...ROOT_CSS, ...(data.stylesheets ?? [])].map((s) => basename(s)).join(', ')}`);
    }
  }
  // Kit figures need the kit's stylesheet and script.
  const sheets = data.stylesheets ?? [];
  const scripts = Array.isArray(data.scripts) ? data.scripts : [];
  if (/\sclass="[^"]*\bpd-/.test(html) && !sheets.includes('/assets/article-kit.css')) report('kit-assets', at('title'), 'uses kit classes but does not load /assets/article-kit.css');
  const needsJs = html.match(/data-pd="(build|units|grid|scrolly|calc|asof)"/);
  if (needsJs && !scripts.includes('/assets/article-kit.js')) report('kit-assets', at('title'), `a data-pd="${needsJs[1]}" figure needs /assets/article-kit.js, which the article does not load, so it never builds${needsJs[1] === 'calc' ? ' and the calculator never computes' : ''}`);

  for (const m of body.matchAll(/\sstyle="([^"]*)"/g)) {
    for (const decl of m[1].split(';').map((s) => s.trim()).filter(Boolean)) {
      const [prop, value = ''] = decl.split(':').map((s) => s.trim());
      if (prop.startsWith('--')) continue;
      if (!['width', 'left', 'height', 'bottom'].includes(prop) || !/^-?[\d.]+%$/.test(value)) report('inline-style', off(m.index), `style="${decl}"`);
    }
  }

  // Signature devices, against the articles either side
  if (ctx.articles && data.date) {
    const slug = basename(file).replace(/\.md$/, '');
    const mine = ctx.articles.find((a) => a.slug === slug);
    const others = ctx.articles.filter((a) => a.slug !== slug && !a.draft).sort((a, b) => a.date - b.date);
    const date = new Date(data.date);
    const prev = others.filter((a) => a.date <= date).pop();
    const next = others.find((a) => a.date > date);
    for (const d of mine?.devices ?? []) {
      for (const other of others) {
        if (!other.devices.includes(d)) continue;
        const days = Math.abs(other.date - date) / 86400000;
        if (other === prev || other === next || days < 30) {
          const device = SIGNATURE_DEVICES.find((x) => x.id === d);
          report('signature-spacing', at('title'), `${device?.name ?? d} also runs in "${other.slug}", ${Math.round(days)} days away`);
        }
      }
    }
  }

  return findings;
}

export function devicesIn(source) {
  return SIGNATURE_DEVICES.filter((d) => d.classes.some((c) => new RegExp(`class="[^"]*\\b${c}\\b`).test(source)) || (d.selector && source.includes(d.selector))).map((d) => d.id);
}

// ------------------------------------------------------------------ the whole site

const KIT_CSS = '/assets/article-kit.css';

/** Every article with its date and signature devices, plus any draft outside the folder in `extra`. */
export function readArticles(root, extra = []) {
  const dir = join(root, 'src/content/articles');
  const articleFiles = readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => join(dir, f));
  // A draft kept outside the articles folder is still read against the published ones.
  const outside = extra.filter((p) => p.endsWith('.md') && !articleFiles.includes(p) && existsSync(p));
  return [...articleFiles, ...outside].map((path) => {
    const source = readFileSync(path, 'utf8');
    const { data } = frontMatter(source);
    return { path, source, data, slug: basename(path).replace(/\.md$/, ''), date: new Date(data.date), draft: data.draft === true, devices: devicesIn(source) };
  });
}

// Every file under `dir` whose name ends in one of `exts`.
const walk = (dir, exts) => (existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).flatMap((e) => (
  e.isDirectory() ? walk(join(dir, e.name), exts) : exts.some((x) => e.name.endsWith(x)) ? [join(dir, e.name)] : []
)) : []);

/** Lints every article (or the given files), the stylesheets they load and the scripts' media queries. */
export function lintSite(root, only = null) {
  const dir = join(root, 'src/content/articles');
  const articleFiles = readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => join(dir, f));
  const cssCache = new Map();
  const readCss = (href) => {
    if (!cssCache.has(href)) {
      const path = join(root, 'public', href);
      cssCache.set(href, existsSync(path) ? readFileSync(path, 'utf8') : '');
    }
    return cssCache.get(href);
  };
  const classesFor = (hrefs) => {
    const set = new Set();
    for (const h of hrefs) for (const c of cssClasses(readCss(h))) set.add(c);
    return set;
  };
  const articles = readArticles(root, only ?? []);
  const ctx = { root, registryIds: registryIds(root), classesFor, articles };
  // Every stylesheet the site ships, whoever loads it: articles through front matter, pages through
  // their .astro props, and the shell on every page.
  const sheets = readdirSync(join(root, 'public/assets')).filter((f) => f.endsWith('.css')).map((f) => join(root, 'public/assets', f));
  // Scripts, for their matchMedia calls: the shipped ones and every component, page and module.
  const scripts = [
    ...readdirSync(join(root, 'public/assets')).filter((f) => f.endsWith('.js')).map((f) => join(root, 'public/assets', f)),
    ...walk(join(root, 'src'), ['.astro', '.mjs', '.js', '.ts']),
  ];
  const targets = only ?? [...articleFiles, ...sheets, ...scripts];
  const findings = [];
  for (const path of targets) {
    if (!existsSync(path)) { findings.push({ file: path, line: 1, col: 1, rule: 'usage', severity: 'error', message: 'file not found', fix: '' }); continue; }
    const text = readFileSync(path, 'utf8');
    if (path.endsWith('.css')) findings.push(...lintCss(path, text));
    else if (path.endsWith('.md')) findings.push(...lintArticle(path, text, ctx));
    else if (/\.(?:astro|mjs|js|ts)$/.test(path)) findings.push(...lintScript(path, text));
  }
  return findings;
}
