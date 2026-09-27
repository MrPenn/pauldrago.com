// The article audit: how far one article sits from the approved kit, and what it would take to
// move it. Paul's rule: a device that repeats something the kit already does moves onto the kit;
// a device that shows something new is a proposal for the kit, and that is his decision. So the
// audit sorts every figure in the body (on the kit, the same device in older classes, the same
// information rebuilt on a kit component, new to the kit, or dead), lists the decisions it needs
// from Paul, sorts every class for the class swaps, and attaches every lint finding for the article
// and its own stylesheets. The article-audit skill builds its report on this;
// `npm run audit:article -- <slug or path>` prints it.
import { readFileSync, existsSync } from 'node:fs';
import { join, basename, isAbsolute, resolve } from 'node:path';
import { COMPONENTS, legacyFor, legacyForTag, SIGNATURE_DEVICES, REFERENCE } from './components.mjs';
import { frontMatter, lintSite, cssClasses, readArticles, maskBody, RULES } from './lint.mjs';

const TEMPLATE_CSS = ['/assets/site-shell.css', '/assets/personal-site.css', '/assets/article.css'];
const KIT_CSS = '/assets/article-kit.css';
const KIT_JS = '/assets/article-kit.js';
const DAY = 86400000;

export function resolveArticle(root, arg) {
  if (!arg) return null;
  const direct = isAbsolute(arg) ? arg : resolve(process.cwd(), arg);
  if (existsSync(direct) && direct.endsWith('.md')) return direct;
  const slug = join(root, 'src/content/articles', `${arg.replace(/\.md$/, '')}.md`);
  return existsSync(slug) ? slug : null;
}

// For a figure the audit cannot sort: the kit component its class name points to, as a lead to check.
const HINTS = [[/bars?\b|barchart/, 'stacked-bar'], [/cols|columns|years/, 'rising-columns'], [/quote|\bpq\b/, 'pull-quote'], [/stat\b/, 'ledger or unit-stat'], [/timeline|\btl\b/, 'stacked-bar or rising-columns'], [/deck/, 'deck'], [/img|illo|image/, 'illustration'], [/calc/, 'calculator'], [/table/, 'table']];
function suggest(classes) {
  const stem = classes[0]?.split('-').slice(1).join(' ') ?? '';
  const hit = HINTS.find(([re]) => re.test(stem));
  const lead = hit ? ` Its class name points to ${hit[1]}; check what it shows before trusting that.` : '';
  return `No kit class and no record of it: decide whether it repeats a kit component (derivative) or shows something new (a decision for Paul).${lead}`;
}

// Kit components that only ever sit inside another figure.
const PARTS = new Set(['eyebrow', 'caption', 'field', 'toggle', 'button', 'data-mark']);
const lineAt = (text, index) => text.slice(0, index).split('\n').length;
const classesOf = (attrs) => (attrs.match(/\sclass="([^"]*)"/)?.[1] ?? '').split(/\s+/).filter(Boolean);
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
const clip = (s, n = 70) => (s.length <= n ? s : `${s.slice(0, n).replace(/\s+\S*$/, '')}...`);
// A value printed as a range: "60 to 70%", "3 to 5", "two to three months".
const RANGE = /\b(\d[\d,.]*|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:to|-)\s*(\d[\d,.]*|one|two|three|four|five|six|seven|eight|nine|ten)\b/i;

// A chart that prints one of its values as a range, or draws one.
const drawsRange = (html) => /class="[^"]*-range\b/.test(html)
  || [...html.matchAll(/class="[^"]*\b[a-z-]+-(?:val|v|value)\b[^"]*"[^>]*>([\s\S]*?)<\/(?:span|p|div)>/g)].some((m) => RANGE.test(text(m[1])));

// Block-level HTML in the body: a line that opens a tag, through the line that closes it.
const BLOCK = /^<(figure|section|div|aside|details|table|ol|ul|p|blockquote|picture|img)\b([^>]*)>/;
const TEXT_TAGS = new Set(['p', 'ol', 'ul', 'blockquote']);
function blocks(body, firstLine) {
  const lines = body.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(BLOCK);
    if (!m) continue;
    const [, tag, attrs] = m;
    let j = i;
    if (tag !== 'img') {
      let depth = 0;
      for (; j < lines.length; j += 1) {
        depth += (lines[j].match(new RegExp(`<${tag}\\b`, 'g')) ?? []).length;
        depth -= (lines[j].match(new RegExp(`</${tag}>`, 'g')) ?? []).length;
        if (depth <= 0) break;
      }
      j = Math.min(j, lines.length - 1);
    }
    out.push({ tag, attrs, open: m[0], line: firstLine + i, html: lines.slice(i, j + 1).join('\n') });
    i = j;
  }
  return out;
}

/**
 * Signature devices this article cannot use: one that runs in the article before or after it, or
 * in any article less than 30 days away. Returns { id: { name, slug, days, from } }.
 */
export function cooldowns(root, path, date) {
  const slug = basename(path).replace(/\.md$/, '');
  const when = new Date(date);
  if (Number.isNaN(when.getTime())) return {};
  const others = readArticles(root, [path]).filter((a) => a.slug !== slug && !a.draft && !Number.isNaN(a.date.getTime())).sort((a, b) => a.date - b.date);
  const prev = others.filter((a) => a.date <= when).pop();
  const next = others.find((a) => a.date > when);
  const out = {};
  for (const other of others) {
    const days = Math.round(Math.abs(other.date - when) / DAY);
    if (!(other === prev || other === next || days < 30)) continue;
    for (const id of other.devices) {
      if (out[id] && out[id].days <= days) continue;
      const device = SIGNATURE_DEVICES.find((d) => d.id === id);
      const adjacent = other === prev || other === next;
      // Next to it, the device waits for another article in between, whatever the date.
      const clears = adjacent ? 'another article runs between them' : new Date(other.date.getTime() + 30 * DAY).toISOString().slice(0, 10);
      out[id] = { name: device?.name ?? id, slug: other.slug, days, clears, adjacent };
    }
  }
  return out;
}

export function auditArticle(root, path) {
  const source = readFileSync(path, 'utf8');
  const { data, bodyStart } = frontMatter(source);
  const sheets = data.stylesheets ?? [];
  const scripts = Array.isArray(data.scripts) ? data.scripts : [];
  const read = (href) => (existsSync(join(root, 'public', href)) ? readFileSync(join(root, 'public', href), 'utf8') : '');
  const kitClasses = cssClasses(read(KIT_CSS));
  const templateClasses = new Set(TEMPLATE_CSS.flatMap((h) => [...cssClasses(read(h))]));
  const ownSheets = sheets.filter((s) => s !== KIT_CSS);
  const ownClasses = new Set(ownSheets.flatMap((h) => [...cssClasses(read(h))]));
  const componentOf = new Map();
  for (const c of COMPONENTS) for (const cls of c.classes) if (!componentOf.has(cls)) componentOf.set(cls, c.id);
  const comp = (id) => COMPONENTS.find((c) => c.id === id);
  const nameOf = (id) => comp(id)?.name ?? id;
  const signatureIds = new Set(COMPONENTS.filter((c) => c.status === 'signature').map((c) => c.id));
  const cool = cooldowns(root, path, data.date);
  const blocked = (id) => (signatureIds.has(id) && cool[id] ? cool[id] : null);

  // How one class sorts: a kit component, a template class, an older class and what becomes of
  // it, the article's own styles, or defined nowhere.
  const sortClass = (cls) => {
    if (/^is-/.test(cls)) return null;
    if (componentOf.has(cls) && (kitClasses.has(cls) || templateClasses.has(cls))) {
      const id = componentOf.get(cls);
      return { key: `kit:${id}`, status: comp(id).status === 'template' ? 'template' : 'kit', component: id, name: comp(id).name };
    }
    if (kitClasses.has(cls) && cls.startsWith('pd-')) return { key: 'kit:other', status: 'kit', component: null, name: 'Kit classes' };
    const legacy = /^(fd|cd)-|^k$/.test(cls) ? legacyFor(cls) : null;
    if (legacy) return { key: `legacy:${legacy.match}`, legacy, status: STATUS_OF[legacy.kind], component: legacy.kit ?? null, name: legacy.name ?? nameOf(legacy.kit) };
    if (templateClasses.has(cls)) return { key: 'template:other', status: 'template', component: null, name: 'Template and site classes' };
    if (ownClasses.has(cls)) {
      const stem = cls.split('-').slice(0, 2).join('-');
      return { key: `own:${stem}`, status: 'custom', component: null, name: `${stem} (the article's own stylesheet)` };
    }
    const stem = cls.split('-').slice(0, 2).join('-');
    return { key: `unknown:${stem}`, status: 'unknown', component: null, name: stem };
  };

  // Every class in the brief and the body, with every line it appears on.
  const uses = new Map();
  const scan = (chunk, offsetLine) => {
    for (const m of chunk.matchAll(/\sclass="([^"]*)"/g)) {
      for (const cls of m[1].split(/\s+/).filter(Boolean)) {
        if (/^is-/.test(cls)) continue;
        const u = uses.get(cls) ?? { count: 0, lines: [] };
        u.count += 1;
        u.lines.push(offsetLine + lineAt(chunk, m.index) - 1);
        uses.set(cls, u);
      }
    }
  };
  // Code fences and HTML comments never render, so they hold no figures.
  const body = maskBody(source.slice(bodyStart));
  const bodyLine = lineAt(source, bodyStart);
  scan(source.slice(0, bodyStart), 1);
  scan(body, bodyLine);

  const devices = new Map();
  for (const [cls, u] of uses) {
    const s = sortClass(cls);
    if (!s) continue;
    const d = devices.get(s.key) ?? { status: s.status, component: s.component, name: s.name, note: s.legacy?.note ?? '', why: s.legacy?.why ?? '', classes: [], count: 0, lines: [] };
    d.classes.push(cls);
    d.count += u.count;
    d.lines.push(...u.lines);
    devices.set(s.key, d);
  }
  const deviceList = [...devices.values()].map((d) => ({ ...d, lines: [...new Set(d.lines)].sort((a, b) => a - b) }))
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.lines[0] - b.lines[0]);

  // Every figure in the body, sorted as a whole. A figure's device comes from its opening tag,
  // then its own classes, then the first device inside it; other devices inside are its parts.
  const figures = [];
  for (const b of blocks(body, bodyLine)) {
    const rootClasses = classesOf(b.attrs);
    const inner = [...b.html.matchAll(/\sclass="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)).filter(Boolean);
    let legacy = legacyForTag(b.open);
    let sorted = null;
    if (!legacy) {
      const candidates = [...rootClasses, ...inner].map(sortClass).filter((s) => s && s.status !== 'template');
      const rank = (c) => (c.status === 'remove' ? 3 : c.legacy?.part || PARTS.has(c.component) || (!c.component && !c.legacy) ? 2 : 0);
      sorted = candidates.map((c, i) => ({ c, i })).sort((x, y) => rank(x.c) - rank(y.c) || x.i - y.i)[0]?.c ?? null;
      legacy = sorted?.legacy ?? null;
    }
    if (!legacy && !sorted) {
      // Raw HTML with no class: an image without the kit frame, or a paragraph that belongs in markdown.
      if (b.tag === 'img' || b.tag === 'picture') sorted = { status: 'equivalent', component: 'illustration', name: 'Bare image', note: 'Wrap it in the illustration snippet with its dark source, width, height and lazy loading.' };
      else if (b.tag === 'p' && !rootClasses.length) sorted = { status: 'equivalent', component: 'body-text', name: 'Paragraph in HTML', note: 'Body text is markdown; raw HTML is for figures.' };
      else continue;
    }
    const status = legacy ? STATUS_OF[legacy.kind] : sorted.status;
    const component = legacy ? legacy.kit ?? null : sorted.component;
    if (status === 'template') continue;
    if (TEXT_TAGS.has(b.tag) && (status === 'kit' || (status === 'equivalent' && component !== 'body-text'))) continue;
    const label = b.attrs.match(/aria-label="([^"]*)"/)?.[1] ?? '';
    const title = clip((label.length <= 60 ? label : '') || text(b.html.match(/class="[^"]*\b(?:pd-eyebrow|fd-eyebrow|[a-z]+(?:-[a-z]+)*-title|pd-head-text|fd-stat-label)\b[^"]*"[^>]*>([\s\S]*?)<\/p>|class="[^"]*\b(?:pd-head-text|fd-stat-label)\b[^"]*"[^>]*>([\s\S]*?)<\/span>/)?.slice(1).find(Boolean) ?? '')
      || label
      || (b.html.match(/<img\b[^>]*\salt="([^"]*)"/)?.[1] ?? '')
      || text(b.html.match(/<figcaption>([\s\S]*?)<\/figcaption>/)?.[1] ?? '')
      || text(b.html));
    const dead = rootClasses.map(sortClass).filter((c) => c && c.status === 'remove' && c !== sorted).map((c) => `${c.legacy.match.replace(/[\^$]/g, '')} does nothing: remove it.`);
    const parts = [...new Set(inner.map(sortClass).filter((s) => s && !s.legacy?.part && !PARTS.has(s.component) && s.status !== 'template' && s.component && s.component !== component).map((s) => nameOf(s.component)))];
    const fig = {
      line: b.line,
      status,
      name: legacy?.name ?? sorted?.name ?? nameOf(component),
      title,
      component,
      parts,
      why: legacy?.why ?? '',
      how: [legacy?.how ?? legacy?.note ?? sorted?.note ?? '', ...dead, status === 'unknown' || status === 'custom' ? suggest(rootClasses) : ''].filter(Boolean).join(' '),
      alt: (legacy?.alt ?? []).map((id) => ({ id, name: nameOf(id), blocked: blocked(id) })),
      blocked: component ? blocked(component) : null,
      gap: legacy?.gap && drawsRange(b.html) ? legacy.gap : '',
      gapName: legacy?.gapName ?? '',
      proposal: legacy?.proposal ?? null,
      otherwise: legacy?.otherwise ?? '',
    };
    figures.push(fig);
  }

  // What Paul decides: each new device once, with every figure it covers, and each kit gap.
  const decisions = [];
  for (const f of figures.filter((x) => x.status === 'decide')) {
    const d = decisions.find((x) => x.kind === 'new' && x.name === f.name);
    if (d) d.lines.push(f.line);
    else decisions.push({ kind: 'new', name: f.name, lines: [f.line], why: f.why, proposal: f.proposal, otherwise: f.otherwise });
  }
  for (const f of figures.filter((x) => x.gap)) {
    const d = decisions.find((x) => x.kind === 'gap' && x.component === f.component && x.name === f.gapName);
    if (d) {
      d.lines.push(f.line);
      if (!d.gaps.includes(f.gap)) d.gaps.push(f.gap);
    } else decisions.push({ kind: 'gap', name: f.gapName, gaps: [f.gap], component: f.component, componentName: nameOf(f.component), lines: [f.line] });
  }

  // Lint findings for this article and the stylesheets only it loads.
  const targets = [path, ...ownSheets.map((s) => join(root, 'public', s)).filter(existsSync)];
  const findings = lintSite(root, targets).map((f) => ({ ...f, file: f.file.replace(root + '/', '') }));

  const slug = basename(path).replace(/\.md$/, '');
  const signature = SIGNATURE_DEVICES.filter((d) => d.classes.some((c) => uses.has(c)) || (d.selector && source.includes(d.selector)))
    .map((d) => ({ id: d.id, name: d.name, from: d.article }));

  const count = (st) => figures.filter((f) => f.status === st).length;
  return {
    file: path.replace(root + '/', ''),
    slug,
    title: data.title ?? '',
    date: data.date ?? '',
    draft: data.draft === true,
    reference: slug === REFERENCE.slug,
    opener: data.opener ?? '',
    kit: { css: sheets.includes(KIT_CSS), js: scripts.includes(KIT_JS), notes: data.notes ?? 'rail', stylesheets: sheets, scripts },
    figures,
    decisions,
    devices: deviceList,
    findings,
    signature,
    cooldowns: cool,
    summary: {
      errors: findings.filter((f) => f.severity === 'error').length,
      warnings: findings.filter((f) => f.severity === 'warn').length,
      info: findings.filter((f) => f.severity === 'info').length,
      rebuild: count('rebuild'),
      declined: count('declined'),
      decide: count('decide'),
      remove: deviceList.filter((d) => d.status === 'remove').length,
      unknown: deviceList.filter((d) => d.status === 'unknown').length,
      verdict: figures.filter((f) => f.status === 'unknown' || f.status === 'custom').length,
      custom: count('custom'),
      equivalents: deviceList.filter((d) => d.status === 'equivalent').length,
      onKit: sheets.includes(KIT_CSS) && !deviceList.some((d) => ['rebuild', 'decide', 'declined', 'remove', 'equivalent', 'custom', 'unknown'].includes(d.status)) && !figures.some((f) => f.status === 'declined'),
    },
  };
}

const STATUS_OF = { equivalent: 'equivalent', derivative: 'rebuild', novel: 'decide', declined: 'declined', remove: 'remove' };
const ORDER = { decide: 0, unknown: 1, custom: 2, declined: 3, remove: 4, rebuild: 5, equivalent: 6, kit: 7, template: 8 };
const RULE = Object.fromEntries(RULES.map((r) => [r.id, r]));
const STATUS = {
  decide: 'New to the kit: Paul decides',
  unknown: 'Defined nowhere: needs a verdict',
  custom: "The article's own styles: needs a verdict",
  declined: 'Paul said no: use the fallback',
  remove: 'Does nothing: remove',
  rebuild: 'Rebuild on the kit',
  equivalent: 'Has a kit equivalent',
  kit: 'On the kit',
  template: 'Template',
};
const link = (id) => `[${id}](/ui/components/${id})`;
const cell = (s) => String(s ?? '').replace(/\|/g, '/').replace(/\n/g, ' ');

/** The audit as markdown: the evidence a report is written from. */
export function formatAudit(a) {
  const out = [];
  out.push(`# Kit audit: ${a.title || a.slug}`, '');
  out.push(`File: ${a.file}${a.draft ? ' (draft)' : ''}${a.date ? `, dated ${String(a.date).slice(0, 10)}` : ''}${a.reference ? '. This is the reference article the kit was taken from.' : ''}`);
  out.push(`Kit stylesheet: ${a.kit.css ? 'loaded' : 'not loaded'}. Kit script: ${a.kit.js ? 'loaded' : 'not loaded'}. Sources: ${a.kit.notes}. Own stylesheets: ${a.kit.stylesheets.filter((s) => s !== KIT_CSS).join(', ') || 'none'}.${a.opener ? ` Opener above the headline: "${a.opener}", rendered by a template component (the kit's unit grid).` : ''}`);
  out.push(`Lint: ${a.summary.errors} errors, ${a.summary.warnings} warnings, ${a.summary.info} info. Figures: ${a.summary.rebuild} to rebuild on the kit, ${a.summary.decide} new to the kit, ${a.summary.declined} Paul declined, ${a.summary.remove} to remove, ${a.summary.verdict} that need a verdict. Class groups with a kit equivalent: ${a.summary.equivalents}.`, '');
  out.push('The rule: a device that repeats something the kit already does moves onto the kit. A device that shows something new (a new visualization or a new type of information) is a proposal for the kit, and Paul decides.', '');

  out.push('## Figures', '');
  if (!a.figures.length) out.push('None.');
  else out.push('| Line | Figure | What it is | Verdict | Move to | Notes |', '|---|---|---|---|---|---|');
  for (const f of a.figures) {
    const to = f.status === 'decide' ? (f.proposal ? `proposal: ${f.proposal.name}` : 'see Decisions') : f.component ? link(f.component) : '';
    const alt = f.alt.length ? ` Also fits: ${f.alt.map((x) => `${link(x.id)}${x.blocked ? ` (on cooldown: runs in ${x.blocked.slug}, ${x.blocked.days} days away)` : ''}`).join(', ')}.` : '';
    const cooldown = f.blocked ? ` On cooldown: ${f.blocked.name} run in ${f.blocked.slug}, ${f.blocked.days} days away; use a shared component or hold it until ${f.blocked.clears}.` : '';
    const parts = f.parts.length ? ` Inside: ${f.parts.join(', ')}.` : '';
    const note = [f.why, f.how, f.gap ? `Kit gap: ${f.gap}` : ''].filter(Boolean).join(' ') + alt + cooldown + parts;
    out.push(`| ${f.line} | ${cell(f.title)} | ${cell(f.name)} | ${STATUS[f.status]} | ${to} | ${cell(note.trim())} |`);
  }

  out.push('', '## Decisions for Paul', '');
  if (!a.decisions.length) out.push('None.');
  for (const d of a.decisions) {
    if (d.kind === 'new') {
      const p = d.proposal;
      out.push(`- **${d.name}**, line ${d.lines.join(', ')}. ${d.why}${p ? ` Proposal: add "${p.name}" to the kit. ${p.shows} It reuses ${p.reuses}. Other uses: ${p.uses}.` : ''}${d.otherwise ? ` If not: ${d.otherwise}.` : ''}`);
    } else {
      out.push(`- **${d.name} in the ${d.componentName.toLowerCase()}** (${link(d.component)}), line ${d.lines.join(', ')}. ${d.gaps.join(' ')} Adding it changes what the component draws, so it is Paul's call. If not, the bar is drawn at one end of the range and its label prints the whole range.`);
    }
  }

  out.push('', '## Classes', '');
  out.push('| Status | Device | Kit component | Classes | Lines | Notes |', '|---|---|---|---|---|---|');
  for (const d of a.devices) {
    const kit = d.component ? link(d.component) : '';
    const note = [d.why, d.note].filter(Boolean).join(' ');
    out.push(`| ${STATUS[d.status]} | ${cell(d.name)} | ${kit} | ${cell(d.classes.slice(0, 6).join(' '))}${d.classes.length > 6 ? ' ...' : ''} | ${d.lines.join(', ')} | ${cell(note)} |`);
  }

  out.push('', '## Lint findings', '');
  if (!a.findings.length) out.push('None.');
  for (const f of a.findings) out.push(`- ${f.file}:${f.line} ${f.severity} [${f.rule}] ${f.message}${f.fix && f.severity !== 'info' ? `. Fix: ${f.fix}` : ''}${RULE[f.rule] ? ` (${RULE[f.rule].title})` : ''}`);

  out.push('', '## Signature devices', '');
  if (!a.signature.length) out.push('Used here: none.');
  for (const s of a.signature) out.push(`- Used here: ${s.name}, first used in ${s.from}.`);
  const cool = Object.entries(a.cooldowns);
  if (cool.length) out.push(`- On cooldown for this article (do not suggest them): ${cool.map(([, c]) => `${c.name} (${c.slug}, ${c.days} days away${c.adjacent ? ', the article next to it' : ''})`).join('; ')}.`);
  else out.push('- On cooldown for this article: none.');
  return out.join('\n');
}
