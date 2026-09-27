// Tests for the styleguide linter, the kit builders and the registry. Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULES, lintArticle, lintCss, lintScript, lintSite, cssClasses, imageSize, registryIds, frontMatter } from '../src/styleguide/lint.mjs';
import * as BUILD from '../src/styleguide/build.mjs';
import { stack, cols, units, offScale, readNumber, highlight } from '../src/styleguide/build.mjs';
import { COMPONENTS, SIGNATURE_DEVICES, STACK_DEMO, COLS_DEMO, UNITS_DEMO, RECORD_DEMO, ASOF_DEMO, TYPE_SCALE, stepName } from '../src/styleguide/components.mjs';
import { typeSteps, typeTokens } from '../src/styleguide/tokens.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const css = (href) => readFileSync(join(root, 'public', href), 'utf8');
const SHELL = ['/assets/site-shell.css', '/assets/personal-site.css', '/assets/article.css', '/assets/article-kit.css'];
const classesFor = (hrefs) => new Set(hrefs.flatMap((h) => [...cssClasses(css(h))]));
const ctx = { root, registryIds: registryIds(root), classesFor, articles: [] };
const ids = (findings) => [...new Set(findings.map((f) => f.rule))].sort();
const errors = (findings) => findings.filter((f) => f.severity === 'error');
const lint = (body) => lintArticle(join(root, 'x.md'), article(body), ctx);

const article = (body, fm = '') => `---
title: "A Test Article"
description: "A description long enough to pass the length check, which wants seventy characters or more."
date: 2026-10-01
kicker: "Test"
stylesheets: ["/assets/article-kit.css"]
brief:
  - 'One.'
  - 'Two.'
  - 'Three.'
${fm}---

${body}
`;

test('every rule has an id, a severity, a group, a title and a reason', () => {
  for (const r of RULES) {
    assert.ok(r.id && r.title && r.why && r.group, r.id);
    assert.ok(['error', 'warn', 'info'].includes(r.severity), r.id);
  }
  assert.equal(new Set(RULES.map((r) => r.id)).size, RULES.length, 'rule ids are unique');
});

test('the builders and the chart checks agree', () => {
  const body = [stack(STACK_DEMO), cols(COLS_DEMO), units(UNITS_DEMO)].join('\n\n');
  assert.deepEqual(ids(lint(body)).filter((i) => ['stack-scale', 'units-count', 'figure-title', 'inline-style', 'class-defined'].includes(i)), []);
});

test('a stacked bar whose total does not add up is caught', () => {
  const html = stack(STACK_DEMO).replace('<span class="pd-num is-s">$418</span>', '<span class="pd-num is-s">$450</span>');
  assert.ok(lint(html).some((f) => f.rule === 'stack-scale' && /\$450/.test(f.message)));
});

test('a stacked bar segment drawn off the scale is caught', () => {
  const html = stack(STACK_DEMO).replace('width:45.3%', 'width:30.0%');
  const found = lint(html).filter((f) => f.rule === 'stack-scale');
  assert.ok(found.some((f) => /\$212/.test(f.message)), JSON.stringify(found));
});

test('a unit stat whose units disagree with its number is caught', () => {
  const html = units({ ...UNITS_DEMO, value: 17 });
  const found = lint(html).filter((f) => f.rule === 'units-count');
  assert.ok(found.some((f) => /17 of 20 is 85%/.test(f.message)), JSON.stringify(found));
});

test('a pinned sequence that waits for a missing step is caught', () => {
  const html = '<section class="pd-scrolly" data-pd="scrolly" aria-label="x">\n<div class="pd-steps">\n<div class="pd-step" data-step="1">\n<p>One.</p>\n</div>\n<div class="pd-step" data-step="3">\n<p>Two.</p>\n</div>\n</div>\n<div class="pd-sticky">\n<div class="pd-graphic"><p class="pd-eyebrow" data-at="4">x</p></div>\n</div>\n</section>';
  const found = lint(html).filter((f) => f.rule === 'scrolly-steps').map((f) => f.message);
  assert.ok(found.some((m) => /step 2 is numbered 3/.test(m)), JSON.stringify(found));
  assert.ok(found.some((m) => /waits for step 4/.test(m)), JSON.stringify(found));
});

test('a calculator formula that names nothing is caught', () => {
  const html = '<figure class="pd-figure pd-calc" data-pd="calc" data-define="spread = bal * nim / 100; total = spread + fees"><p class="pd-calc-title">T</p><input data-var="bal"><input data-var="nim"><span data-out="total" data-format="money">$0</span><span data-out="payback">x</span></figure>';
  const found = lint(html).filter((f) => f.rule === 'calc-names').map((f) => f.message);
  assert.ok(found.some((m) => /"fees"/.test(m)), JSON.stringify(found));
  assert.ok(found.some((m) => /"payback"/.test(m)), JSON.stringify(found));
});

test('offScale uses the median, so one bad bar cannot move the scale', () => {
  const off = offScale([{ value: 1, width: 10 }, { value: 2, width: 20 }, { value: 4, width: 70 }]);
  assert.equal(off.length, 1);
  assert.equal(off[0].value, 4);
  assert.equal(off[0].want, 40);
});

test('older static bar charts are still checked against one scale', () => {
  const row = (v, w) => `<div class="cd-bars-row"><p class="cd-bars-label">A<span></span></p><div class="cd-bars-track"><span class="cd-bars-bar" style="width:${w}%" aria-hidden="true"></span><span class="cd-bars-val" style="left:${w}%">${v}</span></div></div>`;
  const html = `<figure class="cd-bars"><p class="cd-widget-title">T</p>${row(10, '19.5')}${row(20, '30.0')}${row(40, '78.0')}<figcaption>Source.</figcaption></figure>`;
  assert.ok(lint(html).some((f) => f.rule === 'bars-scale' && /"20"/.test(f.message)));
});

test('readNumber reads printed values', () => {
  assert.equal(readNumber('1,099'), 1099);
  assert.equal(readNumber('nearly 80%'), 80);
  assert.equal(readNumber('<data value="c:x">$5.4 million</data>'), 5.4);
  assert.equal(readNumber('none'), null);
});

test('the reference article passes every chart check', () => {
  const path = join(root, 'src/content/articles/the-digital-front-door-nobody-walks-through.md');
  const found = lintArticle(path, readFileSync(path, 'utf8'), { ...ctx, classesFor: (h) => classesFor(h.filter((x) => x !== '/assets/article-kit.css')) });
  assert.deepEqual(errors(found).filter((f) => !['img-aspect', 'class-defined'].includes(f.rule)), []);
});

test('the content-is-data article, on the kit, has no errors', () => {
  const path = join(root, 'src/content/articles/your-content-has-no-parent.md');
  const found = lintArticle(path, readFileSync(path, 'utf8'), ctx);
  assert.deepEqual(errors(found), []);
});

test('the kit stylesheet passes its own rules', () => {
  assert.deepEqual(lintCss('article-kit.css', css('/assets/article-kit.css')), []);
});

test('a page of mistakes reports each rule', () => {
  const body = `# A second title

### Before any section

## Most Stages Are Never Measured

See [here](https://example.com).[^9]

<p class="pd-deck" style="color:#B8411E">The **finding**.</p>

<figure class="pd-figure pd-stack" data-pd="build"><div class="pd-stack-bar"><div class="pd-stack-track"></div></div></figure>

<p class="pd-dek">Typo.</p>

<img src="/assets/postcard.webp" alt="">

[^3]: Unformatted source.`;
  const found = ids(lint(body));
  for (const id of ['heading-h1', 'heading-order', 'heading-case', 'link-text', 'footnote-refs', 'footnote-format', 'inline-style', 'markdown-in-html', 'figure-title', 'class-defined', 'img-attrs', 'img-dark']) {
    assert.ok(found.includes(id), `expected ${id} in ${found.join(', ')}`);
  }
});

test('style-ok on the line above suppresses one rule', () => {
  const body = `<!-- style-ok: link-text (a quoted instruction) -->\nSee [here](https://example.com).\n\nSee [here](https://example.com) again.`;
  assert.equal(lint(body).filter((f) => f.rule === 'link-text').length, 1);
});

test('stylesheet rules find literal colours, fonts, radii, gradients and soft shadows', () => {
  const found = ids(lintCss('x.css', `.a { color: #fff; font-family: Inter, sans-serif; border-radius: 12px; background: linear-gradient(red, blue); box-shadow: 0 8px 24px rgba(0,0,0,.2); }
.ok { border-radius: 50%; background: repeating-linear-gradient(90deg, var(--paper) 0 3px, transparent 3px 6px); box-shadow: inset 0 0 0 1px var(--hairline); }
:root { --ground: #F1F2F4; }
@media print { .p { color: #000; } }`));
  assert.deepEqual(found, ['css-color', 'css-gradient', 'css-radius', 'css-shadow', 'type-tokens']);
});

test('spacing and the grid come from the base tokens', () => {
  const rule = (css) => lintCss('x.css', css).filter((f) => f.rule === 'space-tokens').map((f) => f.message);
  assert.deepEqual(rule(`.a { margin: 0 auto var(--space-6); padding: var(--space-half) var(--gutter); gap: var(--space-3) 0; }
.b { margin: calc(-1 * var(--gutter)) 0 0 calc(50% - 50vw); padding: 4vh 0; margin-top: -1px; max-width: var(--measure-0); }
.c { margin: 0 10%; padding: inherit; width: calc(min(var(--container-article), 100vw) - 2 * var(--gutter)); }
@media print { .p { margin: 0.5in; } }
:root { --space-5: 20px; }`), []);
  assert.equal(rule('.a { margin: 18px 0; }').length, 1);
  assert.equal(rule('.a { padding: 0 1.5em; }').length, 1);
  assert.equal(rule('.a { gap: clamp(40px, 6.7vw, 64px); }').length, 1);
  assert.equal(rule('.a { margin: calc(-1 * 20px); }').length, 1);
  assert.equal(rule('.a { max-width: 68ch; }').length, 1);
  assert.equal(rule('.a { max-width: 1060px; }').length, 1);
  assert.deepEqual(rule('.a { min-width: 2ch; flex: 1 1 14ch; }'), []);
});

test('faces, weights, line spacing and tracking come from the base tokens', () => {
  const rule = (css) => lintCss('x.css', css).filter((f) => f.rule === 'type-tokens').map((f) => f.message);
  assert.deepEqual(rule(`.a { font-family: var(--font-serif); font-weight: var(--weight-bold); line-height: var(--leading-body); letter-spacing: var(--tracking-caps); }
.b { font: var(--weight-semibold) var(--step--2)/var(--leading-snug) var(--font-sans); }
.c { font: inherit; line-height: 0; letter-spacing: 0; font-weight: inherit; }
:root { --font-sans: 'IBM Plex Sans', sans-serif; }`), []);
  assert.equal(rule(".a { font-family: 'IBM Plex Sans', sans-serif; }").length, 1);
  assert.equal(rule('.a { font-weight: 500; }').length, 1);
  assert.equal(rule('.a { line-height: 1.42; }').length, 1);
  assert.equal(rule('.a { line-height: 24px; }').length, 1);
  assert.equal(rule('.a { letter-spacing: 0.08em; }').length, 1);
  // The shorthand is read in its parts.
  assert.deepEqual(rule(".a { font: 600 var(--step--2)/1.2 'IBM Plex Sans', sans-serif; }").map((m) => m.split(':')[0]).sort(), ['font-family', 'font-weight', 'line-height']);
});

test('image sizes are read from WebP and PNG headers', () => {
  assert.deepEqual(imageSize(join(root, 'public/assets/postcard.webp')), { w: 1200, h: 720 });
  const png = imageSize(join(root, 'public/assets/front-door.png'));
  assert.deepEqual(png, { w: 1200, h: 681 });
});

test('front matter reader handles lists, arrays and quoted strings', () => {
  const { data } = frontMatter(article('Body.', 'ogImage: "/assets/x.png"\n'));
  assert.equal(data.title, 'A Test Article');
  assert.deepEqual(data.stylesheets, ['/assets/article-kit.css']);
  assert.equal(data.brief.length, 3);
  assert.equal(data.ogImage, '/assets/x.png');
});

test('every story in the registry uses only defined classes', () => {
  // Classes the markdown renderer adds to footnotes; writers never type them.
  const known = new Set([...classesFor(SHELL), 'footnotes']);
  for (const c of COMPONENTS) {
    for (const s of c.stories) {
      for (const m of s.html.matchAll(/\sclass="([^"]*)"/g)) {
        for (const cls of m[1].split(/\s+/).filter(Boolean)) {
          assert.ok(known.has(cls) || cls.startsWith('ui-'), `${c.id}/${s.id} uses undefined class "${cls}"`);
        }
      }
    }
  }
});

test('every story passes the chart checks it would face in an article', () => {
  const checks = ['stack-scale', 'units-count', 'scrolly-steps', 'calc-names', 'inline-style'];
  for (const c of COMPONENTS) {
    for (const s of c.stories) {
      if (s.wrap === 'page') continue;
      const bad = lint(s.html).filter((f) => checks.includes(f.rule));
      assert.deepEqual(bad, [], `${c.id}/${s.id}`);
    }
  }
});

test('registry entries are complete and point at real rules', () => {
  const ruleIds = new Set(RULES.map((r) => r.id));
  const seen = new Set();
  for (const c of COMPONENTS) {
    assert.ok(!seen.has(c.id), `duplicate ${c.id}`);
    seen.add(c.id);
    assert.ok(c.name && c.summary && c.stories.length, c.id);
    assert.ok(['atom', 'molecule', 'organism', 'template'].includes(c.level), c.id);
    assert.ok(['template', 'shared', 'signature'].includes(c.status), c.id);
    for (const r of c.lint) assert.ok(ruleIds.has(r), `${c.id} lists unknown rule ${r}`);
  }
  for (const d of SIGNATURE_DEVICES) assert.ok(d.classes.length || d.selector, d.id);
});

test('a signature device in consecutive articles is flagged', () => {
  const a = { slug: 'a', date: new Date('2026-10-01'), draft: false, devices: ['unit-stat'] };
  const b = { slug: 'b', date: new Date('2026-12-20'), draft: false, devices: ['unit-stat'] };
  const found = lintArticle(join(root, 'a.md'), article(units(UNITS_DEMO)), { ...ctx, articles: [a, b] });
  assert.ok(found.some((f) => f.rule === 'signature-spacing'));
});

test('highlight escapes markup and marks tags and attributes', () => {
  const out = highlight('<p class="x">a &amp; b</p>');
  assert.match(out, /<span class="t-tag">&lt;p<\/span>/);
  assert.match(out, /<span class="t-attr">class<\/span>=<span class="t-val">&quot;x&quot;<\/span>/);
  assert.ok(!out.includes('<p'));
});

test('the column builder scales columns to the top gridline and labels every fifth period', () => {
  const html = cols(COLS_DEMO);
  assert.match(html, /<span class="pd-col"><i style="height:6\.7%;--i:0"><\/i><\/span>/);
  assert.match(html, /<span class="pd-col is-event" data-at="1"><i data-at="3" style="height:16\.2%"><\/i><\/span>/);
  assert.match(html, /<span class="is-strong">25<\/span>/);
  assert.match(html, /<span class="is-strong">40<\/span>/);
});

test('lintSite runs over the whole repository and the kit is clean', () => {
  const findings = lintSite(root);
  assert.ok(Array.isArray(findings));
  assert.ok(!findings.some((f) => f.file.endsWith('article-kit.css')));
  assert.ok(!findings.some((f) => f.file.endsWith('example-article.md') && f.severity !== 'info'));
});

test('the new figures carry their titles and sources, and the slider needs the kit script', () => {
  const { record, asof } = BUILD;
  const withJs = (body) => lintArticle(join(root, 'x.md'), article(body, 'scripts: ["/assets/article-kit.js"]\n'), ctx);
  for (const html of [record(RECORD_DEMO), asof(ASOF_DEMO)]) {
    const bad = withJs(html).filter((f) => ['chart-source', 'figure-title', 'kit-assets', 'inline-style', 'class-defined'].includes(f.rule));
    assert.deepEqual(bad, [], html.slice(0, 60));
  }
  assert.ok(lint(asof(ASOF_DEMO)).some((f) => f.rule === 'kit-assets' && /asof/.test(f.message)));
  assert.ok(withJs(record({ ...RECORD_DEMO, source: '' })).some((f) => f.rule === 'chart-source' && /record/.test(f.message)));
});

test('a range segment sits on the chart scale, and a range drawn off it is caught', () => {
  const html = stack({ eyebrow: 'Weeks', prefix: '', suffix: ' weeks', decimals: 1, bars: [{ name: 'A', segs: [{ value: 8.7, to: 13, text: 'two to three months' }] }, { name: 'B', segs: [{ value: 2 }] }], caption: 'Source, 2026.' });
  assert.match(html, /<div class="pd-seg-range" data-to="13" style="left:\d+\.\d%;width:\d+\.\d%"><\/div>/);
  assert.deepEqual(lint(html).filter((f) => f.rule === 'stack-scale'), []);
  const off = html.replace(/(pd-seg-range" data-to="13" style="left:[\d.]+%;width:)[\d.]+%/, '$120.0%');
  assert.ok(lint(off).some((f) => f.rule === 'stack-scale' && /range to 13/.test(f.message)));
});

test('the calculator fold keeps its fields in the formulas', () => {
  const fold = COMPONENTS.find((c) => c.id === 'calculator').stories.find((s) => s.id === 'fold').html;
  assert.match(fold, /<details class="pd-calc-more">[\s\S]*data-var="fee"[\s\S]*data-var="cac"[\s\S]*<\/details>/);
  assert.deepEqual(lint(fold).filter((f) => f.rule === 'calc-names'), []);
});

test('font sizes are steps of the type scale', () => {
  const rule = (css, file = 'x.css') => lintCss(file, css).filter((f) => f.rule === 'type-scale');
  assert.deepEqual(rule('.a { font-size: var(--step--2); }\n.b { font-size: var(--step-10) !important; }\n.c { font: inherit; }\n.d { font: 600 var(--step-0)/1.4 \'IBM Plex Sans\', sans-serif; }\n.e { font-size: inherit; }'), []);
  assert.match(rule('.a { font-size: 13px; }')[0].message, /13px/);
  assert.equal(rule('.a { font-size: clamp(24px, 2.4vw, 29px); }').length, 1);
  assert.equal(rule('.a { font-size: 0.88em; }').length, 1);
  assert.equal(rule('.a { font-size: var(--step-11); }').length, 1);
  assert.equal(rule('.a { font: 600 13px/1.2 \'IBM Plex Sans\', sans-serif; }').length, 1);
  // Print is exempt, and custom properties are the scale itself.
  assert.deepEqual(rule('@media print { .a { font-size: 10pt; } }\n:root { --step-0: 20px; }'), []);
});

test('every stylesheet takes its type from the base', () => {
  for (const f of readdirSync(join(root, 'public/assets')).filter((x) => x.endsWith('.css'))) {
    assert.deepEqual(lintCss(f, css('/assets/' + f)).filter((x) => ['type-scale', 'type-tokens', 'space-tokens', 'css-color'].includes(x.rule)), [], f);
  }
});

test('the type scale in the registry is the one site-shell.css defines', () => {
  const steps = typeSteps(root);
  assert.deepEqual(steps.map((t) => [t.step, t.px]), TYPE_SCALE.map((t) => [t.step, t.px]));
  assert.equal(steps[0].px, 14);
  assert.equal(steps.find((t) => t.step === 0).px, 20);
  // Each step is 1.2 times the one below, rounded to the pixel.
  for (const t of steps) assert.equal(t.px, Math.round(20 * 1.2 ** t.step), stepName(t.step));
});

test('the base defines every type token the linter accepts', () => {
  const t = typeTokens(root);
  const names = new Set([...t.fonts, ...t.weights, ...t.leading, ...t.tracking].map((x) => x.name));
  for (const n of ['--font-display', '--font-serif', '--font-sans', '--font-mono', '--weight-regular', '--weight-semibold', '--weight-bold', '--leading-display', '--leading-heading', '--leading-snug', '--leading-text', '--leading-body', '--leading-cap', '--tracking-caps']) assert.ok(names.has(n), n);
  // Line spacing runs from tight to open.
  const lead = ['display', 'heading', 'snug', 'text', 'body'].map((k) => Number(t.leading.find((x) => x.name === `--leading-${k}`).value));
  assert.deepEqual([...lead].sort((a, b) => a - b), lead);
});

test('every part a component names exists, is smaller or the same size, and each class has one owner', () => {
  const byId = Object.fromEntries(COMPONENTS.map((c) => [c.id, c]));
  const rank = { atom: 0, molecule: 1, organism: 2, template: 3 };
  for (const c of COMPONENTS) {
    for (const id of c.parts ?? []) {
      assert.ok(byId[id], `${c.id} names part ${id}`);
      assert.notEqual(id, c.id);
      assert.ok(rank[byId[id].level] <= rank[c.level], `${c.id} (${c.level}) is built from ${id} (${byId[id].level})`);
    }
  }
  const owner = new Map();
  for (const c of COMPONENTS) for (const cls of c.classes) {
    assert.ok(!owner.has(cls), `${cls} is listed by ${owner.get(cls)} and ${c.id}`);
    owner.set(cls, c.id);
  }
});

test('media queries stay on the breakpoint scale, in range syntax', () => {
  const rule = (css) => lintCss('x.css', css).filter((f) => f.rule === 'css-breakpoint');
  assert.deepEqual(rule('@media (width < 760px) { .a { margin: 0; } }\n@media (760px <= width < 1180px) { .b { margin: 0; } }\n@media (width >= 1040px) and (prefers-reduced-motion: reduce) { .c { margin: 0; } }'), []);
  const off = rule('@media (max-width: 900px) { .a { margin: 0; } }');
  assert.equal(off.length, 2);
  assert.match(off[0].message, /900px/);
  assert.match(off[1].message, /range syntax/);
  assert.equal(rule('@media (min-width: 760px) { .a { margin: 0; } }').length, 1);
  assert.deepEqual(rule('@container column (width < 560px) { .a { margin: 0; } }'), []);
  // Both ends of a double range are read.
  assert.match(rule('@media (760px <= width < 1100px) { .a { margin: 0; } }')[0].message, /1100px/);
});

test('matchMedia width queries in scripts use the same scale and range syntax', () => {
  const rule = (js) => lintScript('x.js', js).filter((f) => f.rule === 'css-breakpoint');
  assert.deepEqual(rule("var wide = window.matchMedia('(width >= 1180px)');\nvar tab = matchMedia(\"(760px <= width < 1040px)\");\nvar calm = window.matchMedia('(prefers-reduced-motion: reduce)');"), []);
  const legacy = rule("var wide = window.matchMedia('(min-width: 1180px)');\nvar stacked = window.matchMedia('(max-width: 1179px)');");
  assert.deepEqual(legacy.map((f) => f.line), [1, 2, 2]);
  assert.match(legacy[1].message, /1179px/);
  assert.match(legacy[2].message, /range syntax/);
  assert.match(rule("<script>if (window.matchMedia('(width < 700px)').matches) {}</script>")[0].message, /700px/);
  // Every shipped script and every component, page and module is read, and today they pass.
  assert.deepEqual(lintSite(root).filter((f) => f.rule === 'css-breakpoint' && !f.file.endsWith('.css')), []);
});

test('container queries use the column scale, in range syntax', () => {
  const rule = (css) => lintCss('x.css', css).filter((f) => f.rule === 'css-breakpoint');
  assert.deepEqual(rule('@container column (width < 560px) { .a { margin: 0; } }\n@container calc (560px <= width < 900px) { .b { margin: 0; } }\n@container (width >= 900px) { .c { margin: 0; } }'), []);
  assert.match(rule('@container column (width < 600px) { .a { margin: 0; } }')[0].message, /600px, which is not on the column scale/);
  assert.match(rule('@container calc (width >= 1040px) { .a { margin: 0; } }')[0].message, /1040px/);
  const legacy = rule('@container column (max-width: 560px) { .a { margin: 0; } }');
  assert.equal(legacy.length, 1);
  assert.match(legacy[0].message, /range syntax/);
  assert.match(legacy[0].fix, /column scale/);
});

test('table rows turn into cards only below 760 or in print', () => {
  const rule = (css) => lintCss('x.css', css).filter((f) => f.rule === 'css-breakpoint');
  assert.deepEqual(rule(`@media (width < 760px) { .t, .t tbody, .t tr, .t th, .t td { display: block; } .t td.crit { display: inline-block; } }
@media (width < 480px) { .t tr { display: grid; } }
@media print { .t td { display: block; } }
.t td .note, .t td::before { display: block; }
.t td { display: table-cell; }
.t tr.is-off { display: none; }`), []);
  assert.match(rule('.t tr, .t td { display: block; }')[0].message, /\.t tr, \.t td set to display: block/);
  assert.equal(rule('@media (width >= 760px) { .t > tbody > tr { display: grid; } }').length, 1);
  assert.equal(rule('@media (width < 1040px) { .t td { display: flex; } }').length, 1);
});
