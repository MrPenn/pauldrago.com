// HTML builders for the kit's data-driven figures, and the snippet highlighter.
// One copy, used two ways: the component registry builds its example snippets with them, and
// the /ui controls rebuild a snippet as someone types. Plain ES module with no imports, so the
// browser can load it too. readNumber and offScale serve the linter's bar-chart checks.

// The static bar charts in older articles stop their longest bar at this share of the track.
export const BAR_MAX = 78;

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Registry prose: escaped, with `backticks` set as code.
export const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');

// Numbers as the article prints them: thousands separators, at most the decimals the value has.
export function num(n) {
  if (!Number.isFinite(n)) return '';
  const [whole, frac] = String(Math.abs(n)).split('.');
  return (n < 0 ? '-' : '') + whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (frac ? `.${frac}` : '');
}

const pct = (n) => `${(Math.round(n * 10) / 10).toFixed(1)}%`;
const lines = (rows, pad = '') => rows.filter((r) => r !== null && r !== undefined && r !== '').map((r) => pad + r).join('\n');
// Wraps the shown value in a lineage mark when the row names a registry id.
const marked = (text, id) => (id ? `<data value="c:${esc(id)}">${text}</data>` : text);

const money = (n) => `$${num(Math.round(Number(n) || 0))}`;
const at = (n) => (n ? ` data-at="${Number(n)}"` : '');

/**
 * A unit stat: the number, its sentence, and a row of units with the share filled.
 * { num: '95%', label, value: 19, of: 20, cols, source }. cols defaults to `of` (at most 50).
 */
export function units({ num: shown = '', label = '', value = 0, of = 20, cols, source = '' } = {}) {
  const n = Math.max(1, Math.min(200, Number(of) || 1));
  const v = Math.max(0, Math.min(n, Number(value) || 0));
  const c = cols || (n === 100 ? 50 : Math.min(n, 50));
  const cells = Array.from({ length: n }, (_, i) => `<i class="pd-cell${i < v ? ' is-on' : ''}"></i>`).join('');
  return lines([
    `<figure class="pd-units" data-pd="units" data-value="${v}" data-of="${n}">`,
    `  <div class="pd-head"><span class="pd-num is-xl">${esc(shown)}</span><span class="pd-head-text">${esc(label)}</span></div>`,
    `  <div class="pd-units-cells" data-cols="${c}" aria-hidden="true">${cells}</div>`,
    source ? `  <figcaption>${esc(source)}</figcaption>` : null,
    '</figure>',
  ]);
}

/**
 * A unit grid: a hundred squares (or any count), some filled in the accent, some in ink.
 * { variant: 'opener' | 'callback', total: 100, on: 44, alt: 4, altFrom, legend: [{ num, label, kind }],
 *   source, caption, label }
 * `on` squares fill first from the top left; `alt` squares start at altFrom (default: right after
 * the on squares). legend kinds are 'on', 'alt' or '' (an empty swatch). The finished grid ships in
 * the HTML; the kit script replays it.
 */
export function grid({ variant = 'opener', total = 100, on = 0, alt = 0, altFrom, legend = [], source = '', caption = '', label = '' } = {}) {
  const n = Math.max(1, Math.min(400, Number(total) || 100));
  const a0 = altFrom === undefined || altFrom === '' ? Number(on) || 0 : Number(altFrom);
  const kind = (i) => (i < on ? ' is-on' : i >= a0 && i < a0 + (Number(alt) || 0) ? ' is-alt' : '');
  const cells = Array.from({ length: n }, (_, i) => `<i class="pd-cell${kind(i)}"></i>`).join('');
  // Each legend row keys its squares: accent for the `on` squares, ink for the `alt` ones, empty for the rest.
  const sw = { on: ' is-accent', alt: ' is-ink' };
  const rows = legend.map((l) => `      <div class="pd-legend-row"><span class="pd-swatch${sw[l.kind] ?? ''}"></span><span class="pd-num is-l"${l.kind ? ` data-count="${Number(String(l.num).replace(/,/g, ''))}"` : ''}>${esc(l.num)}</span><span class="pd-legend-label">${esc(l.label)}</span></div>`);
  if (variant === 'callback') {
    return lines([
      `<figure class="pd-figure pd-grid is-callback" data-pd="grid" data-pace="0" data-alt-pace="300" data-delay="400"${label ? ` aria-label="${esc(label)}"` : ''}>`,
      `  <div class="pd-grid-cells" aria-hidden="true">${cells}</div>`,
      caption ? `  <figcaption>${esc(caption)}</figcaption>` : null,
      '</figure>',
    ]);
  }
  return lines([
    `<div class="pd-grid is-opener" data-pd="grid" role="figure"${label ? ` aria-label="${esc(label)}"` : ''}>`,
    '  <div class="pd-grid-inner">',
    `    <div class="pd-grid-cells" aria-hidden="true">${cells}</div>`,
    rows.length ? '    <div class="pd-grid-legend">' : null,
    ...rows,
    rows.length ? '    </div>' : null,
    source ? `    <p class="pd-grid-source">${source}</p>` : null,
    '  </div>',
    '</div>',
  ]);
}

/**
 * A stacked bar: parts that build a total, an optional line to beat, and the ledger under it.
 * { eyebrow, num, sub, bars: [{ name, sub, at, text, html, ref, segs: [{ word, value, to, accent, at, text, html, ref }], mark: { value, label, at } }],
 *   ledger: [{ label, sub, value, total, at, ref }], note, noteAt, headroom, prefix, suffix, decimals, caption, label }
 * `text` prints in place of the formatted value ("nearly 80%", "3 to 5 versions"); `ref` wraps the
 * printed value in the data mark for that registry id; `html` prints trusted markup instead, for a
 * mark around part of a label ("<data value="c:x">1.3</data> cycles"). A bar's `sub` is a second line
 * under its name that says what it counts. A value known only as a range takes `to` on
 * the bar's last segment: the segment runs to `value` and a hatched range runs on to `to`.
 * A segment with `outline` draws as an outline: a figure the text doubts, next to measured ones.
 * Every bar shares one scale: the longest bar or line, times headroom (1.12 by default). `max`
 * fixes the scale's end instead: 100 for shares of a whole, so the track reads as 100%.
 * A bar with one segment prints its value once, at the end of the bar; only the parts of a bar
 * with several segments carry labels inside them.
 * Values print as dollars unless prefix and suffix say otherwise: { prefix: '', suffix: '%' },
 * { prefix: '', suffix: ' weeks' }, { prefix: '', suffix: ' million', decimals: 1 }.
 * `graphic: true` returns the inside of a pinned sequence's graphic instead of a figure.
 */
export function stack({ eyebrow = '', num: lead = '', sub = '', bars = [], ledger = [], note = '', noteAt, headroom = 1.12, max, prefix = '$', suffix = '', decimals = 0, caption = '', label = '', graphic = false } = {}) {
  const d = Math.max(0, Math.min(3, Number(decimals) || 0));
  const round = (n) => num(Math.round((Number(n) || 0) * 10 ** d) / 10 ** d);
  const unit = (n) => `${esc(prefix)}${round(n)}${esc(suffix)}`;
  const span = (a, b) => `${esc(prefix)}${round(a)} to ${round(b)}${esc(suffix)}`;
  const totals = bars.map((b) => (b.segs ?? []).reduce((t, s) => t + (Number(s.value) || 0), 0));
  // Only the last segment of a bar can carry a range, so the hatching never sits under another part.
  const extra = bars.map((b) => { const last = (b.segs ?? []).at(-1); return last && Number(last.to) > Number(last.value) ? Number(last.to) - Number(last.value) : 0; });
  const marks = bars.map((b) => Number(b.mark?.value) || 0);
  const scale = Number(max) > 0 ? Number(max) : (Math.max(...totals.map((t, i) => t + extra[i]), ...marks) || 1) * (Number(headroom) || 1);
  const w = (v) => (Number(v) / scale) * 100;
  const pad = graphic ? '' : '  ';
  const barHtml = bars.map((b, bi) => {
    let left = 0;
    const segs = (b.segs ?? []).flatMap((sg, si, all) => {
      const width = w(sg.value);
      const range = si === all.length - 1 && extra[bi] ? extra[bi] : 0;
      const shown = sg.html ?? (sg.text ? esc(sg.text) : range ? span(sg.value, sg.to) : unit(sg.value));
      // A lone segment's label would repeat the value printed at the end of the bar.
      const solo = all.length === 1;
      const inner = solo ? '' : `<span class="pd-seg-label">${sg.word ? `<span class="pd-seg-word">${esc(sg.word)} </span>` : ''}${sg.html ? shown : marked(shown, sg.ref)}</span>`;
      // Words in place of the number, or no label at all, keep the number in data-value, so the linter can check the scale.
      const cls = `pd-seg${sg.accent ? ' is-accent' : ''}${sg.outline ? ' is-outline' : ''}`;
      const html = [`    <div class="${cls}"${at(sg.at)}${solo || sg.text || sg.html ? ` data-value="${Number(sg.value)}"` : ''} style="left:${pct(left)};width:${pct(width)}">${inner}</div>`];
      left += width;
      if (range) html.push(`    <div class="pd-seg-range${sg.accent ? ' is-accent' : ''}"${at(sg.at)} data-to="${Number(sg.to)}" style="left:${pct(left)};width:${pct(w(range))}"></div>`);
      return html;
    });
    const mark = b.mark && b.mark.value !== undefined && b.mark.value !== ''
      ? `    <div class="pd-mark${w(b.mark.value) < 40 ? ' is-left' : ''}"${at(b.mark.at)} style="left:${pct(w(b.mark.value))}"><span class="label">${esc(b.mark.label ?? unit(b.mark.value))}</span></div>`
      : null;
    return lines([
      `<div class="pd-stack-bar"${at(b.at)}>`,
      `  <div class="pd-stack-head"><span class="label">${esc(b.name)}${b.sub ? `<small class="pd-stack-what">${esc(b.sub)}</small>` : ''}</span><span class="pd-num is-s">${b.html ?? marked(b.text ? esc(b.text) : extra[bi] ? span(totals[bi], totals[bi] + extra[bi]) : unit(totals[bi]), b.ref)}</span></div>`,
      '  <div class="pd-stack-track">',
      ...segs,
      mark,
      '  </div>',
      '</div>',
    ], pad);
  });
  const rows = ledger.map((r) => `${pad}  <div class="pd-ledger-row${r.total ? ' pd-ledger-total' : ''}"${at(r.at)}><span class="pd-ledger-label">${esc(r.label)}${r.sub ? ` <span class="pd-ledger-src">${esc(r.sub)}</span>` : ''}</span><span class="pd-num${r.total ? ' is-l' : ''} pd-ledger-value">${marked(r.text ? esc(r.text) : unit(r.value), r.ref)}</span></div>`);
  const inner = [
    eyebrow ? `${pad}<p class="pd-eyebrow">${esc(eyebrow)}</p>` : null,
    // A number to lead with makes a head; a sub line alone says what the bars count.
    lead ? `${pad}<div class="pd-head"><span class="pd-num is-xl">${esc(lead)}</span>${sub ? `<span class="pd-head-text">${esc(sub)}</span>` : ''}</div>` : sub ? `${pad}<p class="pd-stack-sub">${esc(sub)}</p>` : null,
    ...barHtml,
    rows.length ? `${pad}<div class="pd-ledger">` : null,
    ...rows,
    rows.length ? `${pad}</div>` : null,
    note ? `${pad}<p class="pd-stack-note"${at(noteAt)}>${note}</p>` : null,
  ];
  if (graphic) return lines(inner);
  return lines([`<figure class="pd-figure pd-stack" data-pd="build"${label ? ` aria-label="${esc(label)}"` : ''}>`, ...inner, caption ? `  <figcaption>${esc(caption)}</figcaption>` : null, '</figure>']);
}

/**
 * Rising columns: one column per period on one scale, and an event column a beat later.
 * { eyebrow, values: [..], start, step, labelEvery, prefix, suffix, ticks: [..], max,
 *   event: { value, label, sub, marker }, total: { label, sub }, caption }
 * Parts build in four steps: the marker, the columns, the event, the total.
 */
export function cols({ eyebrow = '', values = [], start = 0, step = 1, labelEvery = 5, prefix = '', suffix = '', ticks = [], max, event, total, caption = '', label = '', graphic = false } = {}) {
  const vals = values.map(Number).filter((v) => Number.isFinite(v));
  const top = Number(max) || Math.max(1, ...vals, Number(event?.value) || 0, ...ticks.map(Number));
  const h = (v) => (Number(v) / top) * 100;
  const pad = graphic ? '' : '  ';
  const n = vals.length + (event ? 1 : 0);
  const period = (i) => start + i * step;
  const colHtml = vals.map((v, i) => `${pad}    <span class="pd-col"><i style="height:${pct(h(v))};--i:${i}"></i></span>`);
  if (event) colHtml.push(`${pad}    <span class="pd-col is-event" data-at="1"><i data-at="3" style="height:${pct(h(event.value))}"></i></span>`);
  const xs = Array.from({ length: n }, (_, i) => {
    const last = event && i === n - 1;
    const show = last || i % labelEvery === 0;
    const strong = i === 0 || last;
    return `<span${strong ? ' class="is-strong"' : ''}>${show ? esc(String(period(i))) : ''}</span>`;
  }).join('');
  const inner = [
    eyebrow ? `${pad}<p class="pd-eyebrow">${esc(eyebrow)}</p>` : null,
    `${pad}<div class="pd-cols-callouts">`,
    total ? `${pad}  <p class="pd-cols-callout" data-at="4"><b>${esc(total.label)}</b><span>${esc(total.sub)}</span></p>` : `${pad}  <span></span>`,
    event ? `${pad}  <p class="pd-cols-callout is-accent" data-at="3"><b>${esc(event.label ?? prefix + num(event.value) + suffix)}</b><span>${esc(event.sub)}</span></p>` : null,
    `${pad}</div>`,
    `${pad}<div class="pd-cols-plot">`,
    ticks.length ? `${pad}  <div class="pd-cols-grid" aria-hidden="true">${ticks.map((t) => `<span style="bottom:${pct(h(t))}"><b>${esc(prefix + num(Number(t)) + suffix)}</b></span>`).join('')}</div>` : null,
    `${pad}  <div class="pd-cols-bars" data-at="2">`,
    ...colHtml,
    `${pad}  </div>`,
    `${pad}</div>`,
    `${pad}<div class="pd-cols-x" aria-hidden="true">${xs}</div>`,
    event?.marker ? `${pad}<p class="label accent pd-cols-marker" data-at="1">${esc(event.marker)}</p>` : null,
    caption ? `${pad}<figcaption>${esc(caption)}</figcaption>` : null,
  ];
  if (graphic) return lines(inner);
  return lines([`<figure class="pd-figure pd-cols" data-pd="build"${label ? ` aria-label="${esc(label)}"` : ''}>`, ...inner, '</figure>']);
}

/**
 * A record: one number from a primary record (a fine, a ruling, a filing), the sentence that says
 * what it was for, a line quoted from the record, and the record in the caption.
 * { num, lead, quote, source, ref, label }. The quote takes its quotation marks from the stylesheet.
 */
export function record({ num: shown = '', lead = '', quote = '', source = '', ref, label = '' } = {}) {
  return lines([
    `<figure class="pd-figure pd-record"${label ? ` aria-label="${esc(label)}"` : ''}>`,
    '  <div class="pd-head">',
    `    <span class="pd-num is-xl">${marked(esc(shown), ref)}</span>`,
    '    <div class="pd-head-text">',
    `      <p>${esc(lead)}</p>`,
    quote ? `      <p class="pd-record-quote">${esc(quote)}</p>` : null,
    '    </div>',
    '  </div>',
    source ? `  <figcaption>${esc(source)}</figcaption>` : null,
    '</figure>',
  ]);
}

// Dates for the as-of slider: 'YYYY-MM-DD' in UTC, printed "March 14".
const utc = (s) => { const [y, m, dd] = String(s).split('-').map(Number); return Date.UTC(y, m - 1, dd); };
const DAY = 86400000;
export const dayName = (t) => new Date(t).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });

/**
 * An as-of slider: pick a day and see the version of a piece that was live that day.
 * { eyebrow, question, slider, start, end, day, versions: [{ from, to, copy, meta, band }],
 *   live: { label, verdict }, latest: { label, meta, right, wrong }, caption, label }
 * A version's `band` is a short value printed on its band ("4.25%"), so the strip reads as a history
 * before anyone moves the slider. Give every version one or none.
 * Dates are 'YYYY-MM-DD'; the last version may leave `to` empty (still live at `end`). The finished
 * figure ships in the HTML at `day`, with every version listed; the kit script adds the slider.
 * `latest`, when given, adds a second answer: what a system that keeps only the newest version shows.
 */
export function asof({ eyebrow = '', question = '', slider = 'Pick a day', start, end, day, versions = [], live = {}, latest = null, caption = '', label = '' } = {}) {
  const t0 = utc(start);
  const t1 = utc(end);
  const days = Math.max(1, Math.round((t1 - t0) / DAY));
  // A day outside the slider's dates starts it at the nearer end.
  const at0 = Math.min(t1, Math.max(t0, day ? utc(day) : t0));
  const vs = versions.map((v, i) => {
    const f = utc(v.from);
    const t = v.to ? utc(v.to) : t1;
    return { ...v, n: i + 1, f, t, meta: v.meta ?? `Version ${i + 1}, live ${dayName(f)} to ${v.to ? dayName(t) : 'today'}.` };
  });
  const now = vs.find((v) => at0 >= v.f && at0 <= v.t) ?? vs.at(-1);
  const last = vs.at(-1);
  const labeled = vs.some((v) => v.band);
  const bands = vs.map((v) => `<span class="pd-asof-band${v === now ? ' is-live' : ''}" style="width:${pct(((v.t - v.f) / DAY + 1) / (days + 1) * 100)}">${v.band ? `<span class="pd-asof-band-label">${esc(v.band)}</span>` : ''}</span>`).join('');
  const months = [];
  for (let d = new Date(t0); d.getTime() <= t1; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))) {
    months.push(`<span style="left:${pct(Math.max(0, (d.getTime() - t0) / DAY / days * 100))}">${d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</span>`);
  }
  const wrong = latest && now !== last;
  return lines([
    `<figure class="pd-figure pd-asof" data-pd="asof" data-rail="block" data-start="${esc(start)}" data-end="${esc(end)}" data-day="${esc(day ?? start)}"${label ? ` aria-label="${esc(label)}"` : ''}>`,
    eyebrow ? `  <p class="pd-eyebrow">${esc(eyebrow)}</p>` : null,
    `  <p class="pd-asof-head"><span class="pd-asof-q">${esc(question)}</span> <output class="pd-num pd-asof-day">${dayName(at0)}</output></p>`,
    `  <input class="pd-asof-range" type="range" min="0" max="${days}" step="1" value="${Math.round((at0 - t0) / DAY)}" aria-label="${esc(slider)}" hidden>`,
    `  <div class="pd-asof-bands${labeled ? ' is-labeled' : ''}" aria-hidden="true">${bands}</div>`,
    `  <div class="pd-asof-months" aria-hidden="true">${months.join('')}</div>`,
    `  <div class="pd-asof-answers${latest ? '' : ' is-single'}">`,
    `    <div class="pd-asof-answer" data-show="live">${live.label ? `<p class="label">${esc(live.label)}</p>` : ''}<p class="pd-asof-copy">${esc(now.copy)}</p><p class="pd-asof-meta">${esc(now.meta)}</p>${live.verdict ? `<p class="pd-asof-verdict">${esc(live.verdict)}</p>` : ''}</div>`,
    latest ? `    <div class="pd-asof-answer${wrong ? ' is-wrong' : ''}" data-show="latest" data-right="${esc(latest.right)}" data-wrong="${esc(latest.wrong)}"><p class="label">${esc(latest.label)}</p><p class="pd-asof-copy">${esc(last.copy)}</p><p class="pd-asof-meta">${esc(latest.meta ?? `Version ${last.n}, the one published today.`)}</p><p class="pd-asof-verdict">${esc(wrong ? latest.wrong : latest.right)}</p></div>` : null,
    '  </div>',
    '  <ol class="pd-asof-versions">',
    ...vs.map((v) => `    <li data-from="${esc(v.from)}" data-to="${esc(v.to ?? '')}"><span class="pd-asof-copy">${esc(v.copy)}</span> <span class="pd-asof-meta">${esc(v.meta)}</span></li>`),
    '  </ol>',
    caption ? `  <figcaption>${esc(caption)}</figcaption>` : null,
    '</figure>',
  ]);
}

// Reads the first number out of a printed value: "1,099", "nearly 80%", "60 to 70%", "$5.4 million".
export function readNumber(text) {
  const m = String(text).replace(/<[^>]+>/g, '').match(/-?\d[\d,]*(?:\.\d+)?/);
  return m ? Number(m[0].replace(/,/g, '')) : null;
}

/**
 * Checks that every bar in a chart sits on one scale from zero. Takes the rows of a chart as
 * { value, width, rangeEnd } and returns the rows that disagree with the chart's scale, with the
 * width each should have. The scale is the median ratio of width to value, so one bad bar
 * cannot move it.
 */
export function offScale(rows, tolerance = 0.6) {
  const usable = rows.filter((r) => r.value > 0 && r.width > 0);
  if (usable.length < 2) return [];
  const byRatio = usable.map((r) => ({ r, k: r.width / r.value })).sort((a, b) => a.k - b.k);
  const mid = byRatio[Math.floor(byRatio.length / 2)];
  const k = mid.k;
  // Widths print to 0.1%, so a scale read off a small bar carries that rounding, magnified for
  // every larger bar. Each row may be off by that much on top of the tolerance.
  const slack = (v) => tolerance + (v * 0.05) / mid.r.value;
  const off = [];
  for (const r of usable) {
    const want = r.value * k;
    if (Math.abs(r.width - want) > slack(r.value)) off.push({ ...r, want: Math.round(want * 10) / 10 });
    if (r.to != null && r.rangeEnd != null) {
      const wantEnd = r.to * k;
      if (Math.abs(r.rangeEnd - wantEnd) > slack(r.to)) off.push({ ...r, value: r.to, width: r.rangeEnd, want: Math.round(wantEnd * 10) / 10, range: true });
    }
  }
  return off;
}

// Syntax colouring for snippets: tags, attribute names, attribute values and comments get a class.
export function highlight(src, lang = 'html') {
  if (lang === 'yaml') {
    return String(src).split('\n').map((l) => {
      const m = l.match(/^(\s*-?\s*)([\w-]+)(:)(.*)$/);
      if (m) return `${esc(m[1])}<span class="t-attr">${esc(m[2])}</span>${esc(m[3])}<span class="t-val">${esc(m[4])}</span>`;
      if (/^\s*#/.test(l)) return `<span class="t-com">${esc(l)}</span>`;
      if (/^---\s*$/.test(l)) return `<span class="t-com">${esc(l)}</span>`;
      return esc(l);
    }).join('\n');
  }
  if (lang === 'markdown') {
    return String(src).split('\n').map((l) => {
      if (/^---\s*$/.test(l)) return `<span class="t-com">${esc(l)}</span>`;
      if (/^#{1,6} /.test(l)) return `<span class="t-tag">${esc(l)}</span>`;
      if (/^\s*</.test(l)) return highlight(l, 'html');
      if (/^\[\^\d+\]:/.test(l)) return l.replace(/^(\[\^\d+\]:)(.*)$/, (_, a, b) => `<span class="t-attr">${esc(a)}</span>${esc(b)}`);
      return esc(l).replace(/(\[\^\d+\])/g, '<span class="t-attr">$1</span>');
    }).join('\n');
  }
  return String(src).replace(/(<!--[\s\S]*?-->)|(<\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?>)|([^<]+)/g, (m, com, open, name, attrs, close, text) => {
    if (com) return `<span class="t-com">${esc(com)}</span>`;
    if (text !== undefined) return esc(text);
    const a = attrs.replace(/([^\s=]+)(?:(=)("[^"]*"|'[^']*'|[^\s"']+))?|(\s+)/g, (mm, an, eq, av, ws) => {
      if (ws) return ws;
      return `<span class="t-attr">${esc(an)}</span>${eq ? `=<span class="t-val">${esc(av)}</span>` : ''}`;
    });
    return `<span class="t-tag">${esc(open)}${esc(name)}</span>${a}<span class="t-tag">${esc(close)}</span>`;
  });
}
