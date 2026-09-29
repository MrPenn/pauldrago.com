// /ui in the browser: copy buttons, the width and theme toolbar, frames that fit their content,
// and the controls that rebuild a chart and its snippet as someone types.
import { stack, cols, units, highlight } from './build.ts';
import type { StackOptions, ColsOptions, UnitsOptions } from './build.ts';

// A frame remembers the observer that fits it to its content; a status line, its clearing timer.
type Frame = HTMLIFrameElement & { observer?: ResizeObserver | null };
type Status = HTMLElement & { t?: ReturnType<typeof setTimeout> };
const target = (e: Event) => (e.target instanceof Element ? e.target : null);

// ---------------------------------------------------------------- copy
document.addEventListener('click', async (e) => {
  const btn = target(e)?.closest<HTMLElement>('[data-copy]');
  if (!btn) return;
  const code = document.getElementById(btn.dataset.copy ?? '');
  if (!code) return;
  const msg = btn.parentElement?.querySelector<Status>('.ui-code__status');
  const say = (t: string) => { if (msg) { msg.textContent = t; clearTimeout(msg.t); msg.t = setTimeout(() => { msg.textContent = ''; }, 2400); } };
  try {
    await navigator.clipboard.writeText(code.textContent ?? '');
    say('Copied');
  } catch {
    const range = document.createRange();
    range.selectNodeContents(code);
    const sel = getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    say('Selected; press Ctrl or Cmd and C');
  }
});

// ---------------------------------------------------------------- frames
function fit(frame: Frame) {
  const doc = frame.contentDocument;
  if (!doc || !doc.body) return;
  doc.documentElement.classList.add('is-embedded');
  const set = () => {
    const h = Math.ceil(doc.documentElement.scrollHeight);
    frame.style.height = `${h}px`;
    // A frame wider than the canvas is scaled down; the canvas takes the scaled height.
    const k = Number(frame.dataset.scale) || 1;
    if (frame.parentElement) frame.parentElement.style.height = k < 1 ? `${Math.ceil(h * k)}px` : '';
  };
  set();
  const win = frame.contentWindow as (Window & typeof globalThis) | null;
  if (!frame.observer && win?.ResizeObserver) {
    frame.observer = new win.ResizeObserver(set);
    frame.observer.observe(doc.body);
  }
  if (doc.fonts) doc.fonts.ready.then(set);
}
function whenLoaded(frame: Frame, fn: (frame: Frame) => void) {
  frame.addEventListener('load', () => { frame.observer = null; fn(frame); });
  const doc = frame.contentDocument;
  if (doc && doc.readyState === 'complete' && doc.body && doc.body.childElementCount) fn(frame);
}
// Renders the frame at a given width; wider than the canvas, it is scaled to fit.
function sizeFrame(frame: Frame, width: number) {
  const canvas = frame.parentElement;
  if (!canvas) return;
  const avail = canvas.clientWidth;
  if (width && width > avail) {
    const k = avail / width;
    frame.dataset.scale = String(k);
    frame.style.width = `${width}px`;
    frame.style.transform = `scale(${k})`;
    frame.style.transformOrigin = '0 0';
    canvas.classList.remove('is-narrow');
    canvas.classList.add('is-scaled');
  } else {
    frame.dataset.scale = '';
    frame.style.transform = '';
    frame.style.width = width ? `${width}px` : '';
    canvas.classList.remove('is-scaled');
    canvas.classList.toggle('is-narrow', Boolean(width));
  }
  if (frame.contentDocument && frame.contentDocument.body) fit(frame);
}
document.querySelectorAll<Frame>('.ui-canvas iframe').forEach((frame) => {
  if (frame.dataset.initialWidth) sizeFrame(frame, Number(frame.dataset.initialWidth));
  whenLoaded(frame, fit);
});

// ---------------------------------------------------------------- toolbar
document.addEventListener('click', (e) => {
  const btn = target(e)?.closest<HTMLElement>('.ui-story__toolbar button');
  const frame = btn?.closest('.ui-story')?.querySelector<Frame>('iframe');
  if (!btn || !frame) return;
  const kit = frame.contentWindow?.pdKit;
  if (!('replay' in btn.dataset)) btn.parentElement?.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  if ('width' in btn.dataset) sizeFrame(frame, Number(btn.dataset.width) || 0);
  if ('replay' in btn.dataset) {
    kit?.replay();
    return;
  }
  if ('step' in btn.dataset) kit?.step(Number(btn.dataset.step));
  const theme = btn.dataset.theme;
  if (theme !== undefined) {
    frame.dataset.theme = theme;
    frame.contentWindow?.uiTheme?.(theme);
  }
});

// ---------------------------------------------------------------- controls
// Each schema edits a flat state; `build` turns it into the builder's input.
type FieldValue = string | number | boolean | undefined;
type FieldDef = { key: string; label: string; type: 'text' | 'number' | 'checkbox'; size?: 'short'; wide?: boolean };
type Row = { word?: string; value?: number; to?: number; label?: string; sub?: string; accent?: boolean; outline?: boolean };
type StackState = { eyebrow?: string; num?: string; sub?: string; prefix?: string; suffix?: string; decimals?: number; caption?: string; headroom?: number; max?: number; name: string; mark?: number | string; markLabel?: string; ledger: boolean; totalLabel?: string; rows: Row[] };
type ColsState = { eyebrow?: string; values: string; start?: number; labelEvery?: number; prefix?: string; suffix?: string; max?: number; ticks: string; eventValue?: number | string; eventLabel?: string; eventSub?: string; marker?: string; totalLabel?: string; totalSub?: string; label?: string };
type Schema<S> = { build: (s: S) => string; start: (demo: never) => S; top: FieldDef[]; row?: FieldDef[]; blank?: Row };
// A state edited field by field, by key.
type Editable = { [key: string]: unknown };
const edit = (o: object, key: string, v: FieldValue) => { (o as Editable)[key] = v; };
const read = (o: object, key: string) => (o as Editable)[key] as FieldValue;

const stackSchema: Schema<StackState> = {
    build: (s) => stack({
      eyebrow: s.eyebrow, num: s.num, sub: s.sub, headroom: s.headroom || 1.12, max: s.max, prefix: s.prefix ?? '$', suffix: s.suffix ?? '', decimals: s.decimals, caption: s.caption,
      bars: [{ name: s.name, at: 1, segs: s.rows.map((r, i) => ({ word: r.word, value: r.value, to: r.to, accent: r.accent, outline: r.outline, at: i + 1 })), mark: s.mark === undefined || s.mark === '' ? undefined : { value: s.mark, label: s.markLabel, at: s.rows.length + 1 } }],
      ledger: s.ledger ? [...s.rows.map((r, i) => ({ label: r.label || r.word, sub: r.sub, value: r.value, at: i + 1 })), { label: s.totalLabel, value: s.rows.reduce((t, r) => t + (Number(r.value) || 0), 0), total: true, at: s.rows.length }] : [],
    }),
    top: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { key: 'num', label: 'Lead number', type: 'text', size: 'short' },
      { key: 'sub', label: 'Under the lead number', type: 'text' },
      { key: 'name', label: 'Bar name', type: 'text' },
      { key: 'mark', label: 'Line to clear', type: 'number' },
      { key: 'markLabel', label: 'Line label', type: 'text' },
      { key: 'ledger', label: 'Show the ledger', type: 'checkbox' },
      { key: 'totalLabel', label: 'Total label', type: 'text' },
      { key: 'prefix', label: 'Before each value', type: 'text', size: 'short' },
      { key: 'suffix', label: 'After each value', type: 'text', size: 'short' },
      { key: 'decimals', label: 'Decimals', type: 'number' },
      { key: 'max', label: 'Scale ends at (100 for shares)', type: 'number' },
      { key: 'caption', label: 'Caption', type: 'text', wide: true },
    ],
    row: [
      { key: 'word', label: 'Segment word', type: 'text' },
      { key: 'value', label: 'Amount', type: 'number' },
      { key: 'to', label: 'Up to (a range, last part only)', type: 'number' },
      { key: 'label', label: 'Ledger label', type: 'text' },
      { key: 'sub', label: 'Arithmetic', type: 'text' },
      { key: 'accent', label: 'Accent', type: 'checkbox' },
      { key: 'outline', label: 'Outline', type: 'checkbox' },
    ],
    blank: { word: 'part', value: 100, label: '', sub: '' },
    start: (d: StackOptions): StackState => {
      const bar = d.bars?.[0];
      const ledger = d.ledger ?? [];
      return { eyebrow: d.eyebrow, num: d.num, sub: d.sub, prefix: d.prefix ?? '$', suffix: d.suffix ?? '', decimals: Number(d.decimals ?? 0), caption: d.caption ?? '', name: bar?.name ?? '', mark: bar?.mark?.value, markLabel: bar?.mark?.label, ledger: true, totalLabel: ledger.find((r) => r.total)?.label ?? 'Total', rows: (bar?.segs ?? []).map((sg, i) => ({ word: sg.word, value: Number(sg.value), accent: sg.accent, label: ledger[i]?.label, sub: ledger[i]?.sub })) };
    },
};
const colsSchema: Schema<ColsState> = {
    build: (s) => cols({
      eyebrow: s.eyebrow, prefix: s.prefix, suffix: s.suffix, start: s.start, labelEvery: s.labelEvery || 5, max: s.max,
      values: String(s.values ?? '').split(',').map((v) => Number(v.trim())).filter((v) => Number.isFinite(v) && v >= 0),
      ticks: String(s.ticks ?? '').split(',').map((v) => Number(v.trim())).filter((v) => Number.isFinite(v)),
      event: s.eventValue === undefined || s.eventValue === '' ? undefined : { value: s.eventValue, label: s.eventLabel, sub: s.eventSub, marker: s.marker },
      total: s.totalLabel ? { label: s.totalLabel, sub: s.totalSub } : undefined,
      label: s.label,
    }),
    top: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { key: 'values', label: 'Column values, comma separated', type: 'text', wide: true },
      { key: 'start', label: 'First period', type: 'number' },
      { key: 'labelEvery', label: 'Label every', type: 'number' },
      { key: 'prefix', label: 'Before each value', type: 'text', size: 'short' },
      { key: 'suffix', label: 'After each value', type: 'text', size: 'short' },
      { key: 'max', label: 'Scale top', type: 'number' },
      { key: 'ticks', label: 'Gridlines, comma separated', type: 'text' },
      { key: 'eventValue', label: 'Event value', type: 'number' },
      { key: 'eventLabel', label: 'Event callout', type: 'text' },
      { key: 'eventSub', label: 'Under the callout', type: 'text' },
      { key: 'marker', label: 'Marker label', type: 'text' },
      { key: 'totalLabel', label: 'Total callout', type: 'text' },
      { key: 'totalSub', label: 'Under the total', type: 'text' },
      { key: 'label', label: 'The figure in one sentence, for screen readers', type: 'text', wide: true },
    ],
    start: (d: ColsOptions): ColsState => ({ eyebrow: d.eyebrow, values: (d.values ?? []).join(', '), start: d.start, labelEvery: d.labelEvery, prefix: d.prefix, suffix: d.suffix ?? '', max: d.max === undefined ? undefined : Number(d.max), ticks: (d.ticks ?? []).join(', '), eventValue: d.event?.value, eventLabel: d.event?.label, eventSub: d.event?.sub, marker: d.event?.marker, totalLabel: d.total?.label, totalSub: d.total?.sub, label: d.label ?? '' }),
};
const unitsSchema: Schema<UnitsOptions> = {
    build: units,
    start: (d: UnitsOptions) => ({ ...d }),
    top: [
      { key: 'num', label: 'Number', type: 'text', size: 'short' },
      { key: 'value', label: 'Units filled', type: 'number' },
      { key: 'of', label: 'Units in all', type: 'number' },
      { key: 'label', label: 'The sentence after the number', type: 'text', wide: true },
      { key: 'source', label: 'Caption', type: 'text', wide: true },
    ],
};

let uid = 0;
function field(f: FieldDef, value: FieldValue, onChange: (v: FieldValue) => void, prefix: string) {
  const id = `${prefix}-${f.key}-${(uid += 1)}`;
  const wrap = document.createElement('label');
  const short = f.size === 'short' || f.type === 'number';
  wrap.className = `ui-controls__field${f.type === 'checkbox' ? ' ui-controls__field--check' : ''}${f.wide ? ' ui-controls__field--wide' : ''}${short ? ' ui-controls__field--short' : ''}`;
  wrap.htmlFor = id;
  const input = document.createElement('input');
  input.id = id;
  input.type = f.type === 'number' ? 'text' : f.type;
  if (f.type === 'number') input.inputMode = 'decimal';
  if (f.type === 'checkbox') input.checked = Boolean(value);
  else input.value = String(value ?? '');
  input.addEventListener(f.type === 'checkbox' ? 'change' : 'input', () => {
    if (f.type === 'checkbox') { onChange(input.checked); return; }
    const v = input.value;
    onChange(f.type === 'number' ? (v.trim() === '' ? undefined : Number(v.replace(/,/g, ''))) : v);
  });
  const text = document.createElement('span');
  text.textContent = f.label;
  if (f.type === 'checkbox') wrap.append(input, text);
  else wrap.append(text, input);
  return wrap;
}

// Builds the controls for one figure: its fields, one set per row, and the buttons, and rebuilds the
// figure and its snippet on every edit.
function mount<S extends object>(box: HTMLElement, schema: Schema<S>, demo: unknown) {
  const start = (schema.start as (d: unknown) => S)(demo);
  let state = structuredClone(start);
  const story = box.parentElement?.querySelector('.ui-story');
  const frame = story?.querySelector<Frame>('iframe');
  const code = story?.querySelector('code');
  if (!frame || !code) return;
  const rowsOf = () => ((state as Editable).rows ?? []) as Row[];

  const render = () => {
    const html = schema.build(state);
    code.innerHTML = highlight(html);
    const slot = frame.contentDocument && frame.contentDocument.querySelector('.ui-frame__slot');
    if (slot) {
      slot.innerHTML = html;
      if (frame.dataset.theme) frame.contentWindow?.uiTheme?.(frame.dataset.theme);
      frame.contentWindow?.uiRefresh?.();
    }
  };
  whenLoaded(frame, () => render());

  const draw = () => {
    box.replaceChildren();
    const top = document.createElement('fieldset');
    top.className = 'ui-controls__top';
    top.innerHTML = '<legend class="label">Figure</legend>';
    schema.top.forEach((f) => top.append(field(f, read(state, f.key), (v) => { edit(state, f.key, v); render(); }, 'top')));
    const rows = document.createElement('div');
    rows.className = 'ui-controls__rows';
    const rowFields = schema.row;
    if (!rowFields) { box.append(top); return; }
    rowsOf().forEach((row, i) => {
      const set = document.createElement('fieldset');
      set.className = 'ui-controls__row';
      const legend = document.createElement('legend');
      legend.className = 'label';
      legend.textContent = `Row ${i + 1}`;
      set.append(legend);
      rowFields.forEach((f) => set.append(field(f, read(row, f.key), (v) => { edit(row, f.key, v); render(); }, `r${i}`)));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'pd-text-btn ui-controls__remove';
      remove.textContent = `Remove row ${i + 1}`;
      remove.addEventListener('click', () => { rowsOf().splice(i, 1); draw(); render(); });
      set.append(remove);
      rows.append(set);
    });
    const actions = document.createElement('p');
    actions.className = 'ui-controls__actions';
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'ui-btn';
    add.textContent = 'Add a row';
    add.addEventListener('click', () => { rowsOf().push({ ...schema.blank }); draw(); render(); });
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'pd-text-btn';
    reset.textContent = 'Back to the example';
    reset.addEventListener('click', () => { state = structuredClone(start); draw(); render(); });
    actions.append(add, reset);
    box.append(top, rows, actions);
  };
  draw();
}

const SCHEMAS: Record<string, Schema<StackState> | Schema<ColsState> | Schema<UnitsOptions>> = { stack: stackSchema, cols: colsSchema, units: unitsSchema };
document.querySelectorAll<HTMLElement>('[data-controls]').forEach((box) => {
  const schema = SCHEMAS[box.dataset.controls ?? ''];
  const demo = box.querySelector('script[type="application/json"]')?.textContent;
  if (schema && demo) mount(box, schema as Schema<object>, JSON.parse(demo));
});
