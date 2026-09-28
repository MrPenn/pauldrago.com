// Tests for the kit audit (src/styleguide/audit.mjs). Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { auditArticle, formatAudit, resolveArticle } from '../src/styleguide/audit.mjs';
import { LEGACY, legacyFor, legacyForTag, COMPONENTS } from '../src/styleguide/components.mjs';
import { units, stack, asof } from '../src/styleguide/build.mjs';
import { STACK_DEMO, UNITS_DEMO } from '../src/styleguide/components.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const byStatus = (a, st) => a.devices.filter((d) => d.status === st).map((d) => d.name);

test('every legacy entry is sorted, names real kit components, and a new device carries a proposal', () => {
  const ids = new Set(COMPONENTS.map((c) => c.id));
  for (const l of LEGACY) {
    assert.ok(['equivalent', 'derivative', 'novel', 'declined', 'remove'].includes(l.kind), `${l.match ?? l.attr} kind`);
    if (l.kind === 'declined') assert.ok(l.how && l.name, `${l.attr ?? l.match} needs the fallback Paul chose`);
    assert.ok(l.match || l.attr, 'match or attr');
    if (l.kind === 'equivalent' || l.kind === 'derivative') assert.ok(ids.has(l.kit), `${l.match ?? l.attr} -> ${l.kit}`);
    if (l.kind === 'derivative') assert.ok(l.how && l.why && l.name, `${l.match} needs a name, a reason and a how`);
    for (const i of l.alt ?? []) assert.ok(ids.has(i), `${l.match} alt ${i}`);
    if (l.kind === 'novel' && !l.part && l.proposal !== null) assert.ok(l.proposal?.name && l.proposal.shows && l.otherwise, `${l.match ?? l.attr} needs a proposal`);
    if (l.kind === 'remove') assert.ok(l.why && l.name);
  }
  assert.equal(legacyFor('fd-stat-units').kit, 'unit-stat');
  assert.equal(legacyFor('cd-bars-row').kind, 'derivative');
  assert.equal(legacyFor('cd-widget-title').kit, 'eyebrow');
  assert.equal(legacyForTag('<figure class="cd-widget" data-cd="asof">').kit, 'as-of');
  assert.equal(legacyForTag('<figure class="cd-widget" data-cd="graph">').kind, 'declined');
  assert.equal(legacyFor('cd-record').kit, 'record');
});

const figure = (a, line) => a.figures.find((f) => f.line === line);

// The article as it stood before it moved onto the kit (2026-09-26), kept to test the mapping.
const BEFORE = join(root, 'tests/fixtures/content-is-data-before.md');

test('the content-is-data article before the move: derivatives rebuild on the kit, new devices go to Paul', () => {
  const a = auditArticle(root, resolveArticle(root, BEFORE));
  assert.equal(a.kit.css, false);
  // Every static bar chart, all five of them, moves to the stacked bar; none becomes a table.
  const bars = a.figures.filter((f) => f.name === 'Static bar chart');
  assert.deepEqual(bars.map((f) => f.line), [53, 83, 184, 196, 226]);
  for (const f of bars) assert.equal(f.component, 'stacked-bar');
  assert.equal(figure(a, 33).status, 'rebuild');
  assert.equal(figure(a, 111).component, 'ledger');
  assert.equal(figure(a, 115).component, 'calculator');
  // The unit stat fits a share, but the front door ran two days earlier.
  assert.ok(figure(a, 53).alt.find((x) => x.id === 'unit-stat').blocked);
  // Paul's calls on 2026-09-26: the record and the slider joined the kit; the source map, small
  // multiples and the self-check did not, so each takes its fallback and nothing waits on him.
  assert.deepEqual(a.decisions, []);
  for (const line of [200, 241, 247]) assert.equal(figure(a, line).status, 'declined', `line ${line}`);
  assert.ok(!a.decisions.some((d) => d.kind === 'gap'));
  assert.equal(figure(a, 146).component, 'record');
  assert.equal(figure(a, 152).component, 'as-of');
  assert.equal(figure(a, 247).status, 'declined');
  // The widget title is the eyebrow, not a second figure.
  assert.ok(!a.figures.some((f) => f.name === 'Custom interactive figure'));
  assert.ok(byStatus(a, 'equivalent').includes('Deck'));
  assert.deepEqual(a.devices.find((d) => d.name === 'Deck').lines, [21, 37, 59, 79, 97, 123, 156, 180, 210, 232]);
  assert.equal(a.summary.unknown, 0);
  assert.match(formatAudit(a), /## Decisions for Paul/);
});

test('the content-is-data article is on the kit, with nothing left to decide', () => {
  const a = auditArticle(root, resolveArticle(root, 'your-content-has-no-parent'));
  assert.equal(a.summary.onKit, true);
  assert.equal(a.summary.errors, 0);
  assert.deepEqual(a.decisions, []);
  assert.deepEqual(a.figures.filter((f) => f.status !== 'kit'), []);
  for (const id of ['stacked-bar', 'ledger', 'calculator', 'record', 'as-of', 'illustration']) assert.ok(a.figures.some((f) => f.component === id), id);
});

test('the reference article maps onto the kit, with nothing left to remove', () => {
  const a = auditArticle(root, resolveArticle(root, 'the-digital-front-door-nobody-walks-through'));
  assert.equal(a.reference, true);
  assert.deepEqual(byStatus(a, 'remove'), []);
  assert.equal(a.summary.errors, 0);
  assert.equal(a.decisions.length, 0);
  assert.equal(a.summary.rebuild, 0);
  for (const n of ['Unit stat', 'Pinned sequence', 'Stacked bar', 'Rising columns', 'Calculator', 'Org fold', 'Unit grid', 'Pull quote']) {
    assert.ok(byStatus(a, 'equivalent').includes(n), n);
  }
  assert.equal(figure(a, 149).component, 'calculator');
  assert.ok(!a.findings.some((f) => /fd-wide/.test(f.message)));
});

test('the example draft is on the kit', () => {
  const a = auditArticle(root, resolveArticle(root, 'example-article'));
  assert.equal(a.kit.css && a.kit.js, true);
  assert.equal(a.summary.onKit, true);
  assert.equal(a.summary.errors, 0);
});

test('a draft outside the articles folder is audited, including spacing and the kit script', () => {
  const dir = mkdtempSync(join(tmpdir(), 'audit-'));
  const path = join(dir, 'draft.md');
  writeFileSync(path, `---
title: "A Draft About Checking"
description: "A description long enough for the dek check, which wants at least seventy characters."
date: 2026-10-01
kicker: "Test"
stylesheets: ["/assets/article-kit.css"]
brief:
  - 'One.'
  - 'Two.'
  - 'Three.'
---

## A section

<p class="pd-deck">A deck.</p>

${units({ ...UNITS_DEMO, value: 17 })}

${stack(STACK_DEMO).replace('<span class="pd-num pd-num--s">$418</span>', '<span class="pd-num pd-num--s">$450</span>')}

<figure class="cd-bars"><p class="cd-widget-title">T</p></figure>
`);
  try {
    const a = auditArticle(root, resolveArticle(root, path));
    const rules = new Set(a.findings.map((f) => f.rule));
    for (const r of ['kit-assets', 'units-count', 'stack-scale', 'class-defined', 'signature-spacing']) assert.ok(rules.has(r), `${r} in ${[...rules]}`);
    assert.ok(byStatus(a, 'rebuild').includes('Static bar chart'));
    // The chart's title class is the eyebrow, not a second device.
    assert.equal(a.figures.filter((f) => f.status !== 'kit').length, 1);
    assert.ok(a.cooldowns['unit-stat']);
    assert.match(formatAudit(a), /Kit script: not loaded/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// A draft outside the articles folder, audited and then removed.
function auditDraft(body, date = '2026-11-20', extra = '') {
  const dir = mkdtempSync(join(tmpdir(), 'audit-'));
  const path = join(dir, 'draft.md');
  writeFileSync(path, `---
title: "A Draft About Checking"
description: "A description long enough for the dek check, which wants at least seventy characters."
date: ${date}
kicker: "Test"
stylesheets: ["/assets/article-kit.css"]
scripts: ["/assets/article-kit.js"]${extra}
brief:
  - 'One.'
  - 'Two.'
  - 'Three.'
---

## A section

<p class="pd-deck">A deck.</p>

${body}
`);
  try {
    return auditArticle(root, resolveArticle(root, path));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('figures inside code fences and comments are not figures', () => {
  const a = auditDraft('```html\n<p class="ck-flow">fenced</p>\n```\n\n<div class="pd-figure">\n<!-- remove this <div> later -->\n<p>Real content</p>\n</div>\n\n<div class="ck-flow">Bands</div>');
  assert.equal(a.figures.filter((f) => f.name === 'ck-flow').length, 1);
  assert.equal(a.figures.find((f) => f.name === 'ck-flow').line, 27);
});

test('a class defined nowhere keeps the article off the kit', () => {
  const a = auditDraft('<span class="mystery-undefined">weird</span>');
  assert.equal(a.summary.onKit, false);
});

test('a percent stack built by the builder passes its own lint, rounding included', () => {
  const html = stack({ eyebrow: 'Shares', prefix: '', suffix: '%', bars: [{ name: 'Segment share', segs: [{ word: 'A', value: 33.4 }, { word: 'B', value: 33.3 }, { word: 'C', value: 33.3 }] }], caption: 'Source, 2025.' });
  const a = auditDraft(html);
  assert.ok(!a.findings.some((f) => f.rule === 'stack-scale'), JSON.stringify(a.findings.filter((f) => f.rule === 'stack-scale')));
  const off = auditDraft(html.replace('>100%<', '>90%<'));
  const finding = off.findings.find((f) => f.rule === 'stack-scale');
  assert.match(finding.message, /prints 90%/);
  assert.doesNotMatch(finding.message, /\$/);
});

test('the stack builder prints a sub line on its own, marks and printed text', () => {
  const html = stack({ sub: 'Share of each source', prefix: '', suffix: '%', bars: [{ name: 'Veeva', ref: 'veeva-unused', segs: [{ value: 80, text: 'nearly 80%', ref: 'veeva-unused' }] }] });
  assert.match(html, /<p class="pd-stack__sub">Share of each source<\/p>/);
  assert.doesNotMatch(html, /pd-seg__label/);
  assert.match(html, /<div class="pd-seg" data-value="80" style="[^"]*"><\/div>/);
  assert.match(html, /<span class="pd-num pd-num--s"><data value="c:veeva-unused">80%<\/data><\/span>/);
});

test('a lone segment prints its value once; the parts of a longer bar keep their labels', () => {
  const html = stack({ bars: [{ name: 'One', segs: [{ value: 40 }] }, { name: 'Two', segs: [{ word: 'A', value: 20 }, { word: 'B', value: 30 }] }] });
  assert.equal((html.match(/pd-seg__label/g) ?? []).length, 2);
  assert.match(html, /<div class="pd-seg" data-value="40" style="[^"]*"><\/div>/);
  const a = auditDraft(html);
  assert.ok(!a.findings.some((f) => f.rule === 'stack-scale'), JSON.stringify(a.findings.filter((f) => f.rule === 'stack-scale')));
});

test('max fixes the end of the scale, and a segment can be an outline', () => {
  const html = stack({ prefix: '', suffix: '%', max: 100, bars: [{ name: 'Measured', segs: [{ value: 52 }] }, { name: 'Folklore', segs: [{ value: 60, to: 70, outline: true }] }] });
  assert.match(html, /data-value="52" style="left:0\.0%;width:52\.0%"/);
  assert.match(html, /<div class="pd-seg pd-seg--outline" data-value="60" style="left:0\.0%;width:60\.0%">/);
  assert.match(html, /<div class="pd-range" data-to="70" style="left:60\.0%;width:10\.0%">/);
  const off = auditDraft(html.replace('width:52.0%', 'width:58.0%'));
  assert.ok(off.findings.some((f) => f.rule === 'stack-scale' && /the segment at 52/.test(f.message)));
});

test('the as-of builder prints a value on each band when versions carry one', () => {
  const html = asof({ start: '2026-01-01', end: '2026-01-31', day: '2026-01-20', versions: [{ from: '2026-01-01', to: '2026-01-15', copy: 'A', band: '4.10%' }, { from: '2026-01-16', copy: 'B', band: '3.85%' }] });
  assert.match(html, /<div class="pd-asof__bands pd-asof__bands--labeled" aria-hidden="true">/);
  assert.match(html, /<span class="pd-asof__band is-live" style="[^"]*"><span class="pd-asof__band-label">3\.85%<\/span><\/span>/);
});
