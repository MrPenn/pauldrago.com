// /ui in the browser: copy buttons, the width and theme toolbar, frames that fit their content,
// and the controls that rebuild a chart and its snippet as someone types.
import { stack, cols, units, highlight } from './build.mjs';

// ---------------------------------------------------------------- copy
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  const code = document.getElementById(btn.dataset.copy);
  const msg = btn.parentElement.querySelector('.ui-code__status');
  const say = (t) => { if (msg) { msg.textContent = t; clearTimeout(msg.t); msg.t = setTimeout(() => { msg.textContent = ''; }, 2400); } };
  try {
    await navigator.clipboard.writeText(code.textContent);
    say('Copied');
  } catch {
    const range = document.createRange();
    range.selectNodeContents(code);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    say('Selected; press Ctrl or Cmd and C');
  }
});

// ---------------------------------------------------------------- frames
function fit(frame) {
  const doc = frame.contentDocument;
  if (!doc || !doc.body) return;
  doc.documentElement.classList.add('is-embedded');
  const set = () => {
    const h = Math.ceil(doc.documentElement.scrollHeight);
    frame.style.height = `${h}px`;
    // A frame wider than the canvas is scaled down; the canvas takes the scaled height.
    const k = Number(frame.dataset.scale) || 1;
    frame.parentElement.style.height = k < 1 ? `${Math.ceil(h * k)}px` : '';
  };
  set();
  if (!frame.observer && frame.contentWindow.ResizeObserver) {
    frame.observer = new frame.contentWindow.ResizeObserver(set);
    frame.observer.observe(doc.body);
  }
  if (doc.fonts) doc.fonts.ready.then(set);
}
function whenLoaded(frame, fn) {
  frame.addEventListener('load', () => { frame.observer = null; fn(frame); });
  const doc = frame.contentDocument;
  if (doc && doc.readyState === 'complete' && doc.body && doc.body.childElementCount) fn(frame);
}
// Renders the frame at a given width; wider than the canvas, it is scaled to fit.
function sizeFrame(frame, width) {
  const canvas = frame.parentElement;
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
document.querySelectorAll('.ui-canvas iframe').forEach((frame) => {
  if (frame.dataset.initialWidth) sizeFrame(frame, Number(frame.dataset.initialWidth));
  whenLoaded(frame, fit);
});

// ---------------------------------------------------------------- toolbar
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.ui-story__toolbar button');
  if (!btn) return;
  const story = btn.closest('.ui-story');
  const frame = story.querySelector('iframe');
  if (!('replay' in btn.dataset)) btn.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  if ('width' in btn.dataset) sizeFrame(frame, Number(btn.dataset.width) || 0);
  if ('replay' in btn.dataset) {
    if (frame.contentWindow.pdKit) frame.contentWindow.pdKit.replay();
    return;
  }
  if ('step' in btn.dataset) {
    if (frame.contentWindow.pdKit) frame.contentWindow.pdKit.step(Number(btn.dataset.step));
  }
  if ('theme' in btn.dataset) {
    const apply = () => frame.contentWindow.uiTheme && frame.contentWindow.uiTheme(btn.dataset.theme);
    frame.dataset.theme = btn.dataset.theme;
    apply();
  }
});

// ---------------------------------------------------------------- controls
// Each schema edits a flat state; `build` turns it into the builder's input.
const SCHEMA = {
  stack: {
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
  },
  cols: {
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
  },
  units: {
    build: units,
    top: [
      { key: 'num', label: 'Number', type: 'text', size: 'short' },
      { key: 'value', label: 'Units filled', type: 'number' },
      { key: 'of', label: 'Units in all', type: 'number' },
      { key: 'label', label: 'The sentence after the number', type: 'text', wide: true },
      { key: 'source', label: 'Caption', type: 'text', wide: true },
    ],
  },
};
// The demo data each schema starts from, flattened to the fields above.
export const START = {
  stack: (d) => ({ eyebrow: d.eyebrow, num: d.num, sub: d.sub, prefix: d.prefix ?? '$', suffix: d.suffix ?? '', decimals: d.decimals ?? 0, caption: d.caption ?? '', name: d.bars[0].name, mark: d.bars[0].mark?.value, markLabel: d.bars[0].mark?.label, ledger: true, totalLabel: d.ledger.find((r) => r.total)?.label ?? 'Total', rows: d.bars[0].segs.map((sg, i) => ({ word: sg.word, value: sg.value, accent: sg.accent, label: d.ledger[i]?.label, sub: d.ledger[i]?.sub })) }),
  cols: (d) => ({ eyebrow: d.eyebrow, values: d.values.join(', '), start: d.start, labelEvery: d.labelEvery, prefix: d.prefix, suffix: d.suffix ?? '', max: d.max, ticks: d.ticks.join(', '), eventValue: d.event?.value, eventLabel: d.event?.label, eventSub: d.event?.sub, marker: d.event?.marker, totalLabel: d.total?.label, totalSub: d.total?.sub, label: d.label ?? '' }),
  units: (d) => ({ ...d }),
};

let uid = 0;
function field(f, value, onChange, prefix) {
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
  else input.value = value ?? '';
  input.addEventListener(f.type === 'checkbox' ? 'change' : 'input', () => {
    const v = f.type === 'checkbox' ? input.checked : input.value;
    onChange(f.type === 'number' ? (v.trim() === '' ? undefined : Number(v.replace(/,/g, ''))) : v);
  });
  const text = document.createElement('span');
  text.textContent = f.label;
  if (f.type === 'checkbox') wrap.append(input, text);
  else wrap.append(text, input);
  return wrap;
}

document.querySelectorAll('[data-controls]').forEach((box) => {
  const schema = SCHEMA[box.dataset.controls];
  const start = START[box.dataset.controls](JSON.parse(box.querySelector('script[type="application/json"]').textContent));
  let state = structuredClone(start);
  const story = box.parentElement.querySelector('.ui-story');
  const frame = story.querySelector('iframe');
  const code = story.querySelector('code');

  const render = () => {
    const html = schema.build(state);
    code.innerHTML = highlight(html);
    const slot = frame.contentDocument && frame.contentDocument.querySelector('.ui-frame__slot');
    if (slot) {
      slot.innerHTML = html;
      if (frame.dataset.theme) frame.contentWindow.uiTheme(frame.dataset.theme);
      if (frame.contentWindow.uiRefresh) frame.contentWindow.uiRefresh();
    }
  };
  whenLoaded(frame, () => render());

  const draw = () => {
    box.replaceChildren();
    const top = document.createElement('fieldset');
    top.className = 'ui-controls__top';
    top.innerHTML = '<legend class="label">Figure</legend>';
    schema.top.forEach((f) => top.append(field(f, state[f.key], (v) => { state[f.key] = v; render(); }, 'top')));
    const rows = document.createElement('div');
    rows.className = 'ui-controls__rows';
    if (!schema.row) { box.append(top); return; }
    state.rows.forEach((row, i) => {
      const set = document.createElement('fieldset');
      set.className = 'ui-controls__row';
      const legend = document.createElement('legend');
      legend.className = 'label';
      legend.textContent = `Row ${i + 1}`;
      set.append(legend);
      schema.row.forEach((f) => set.append(field(f, row[f.key], (v) => { row[f.key] = v; render(); }, `r${i}`)));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'ui-link-btn ui-controls__remove';
      remove.textContent = `Remove row ${i + 1}`;
      remove.addEventListener('click', () => { state.rows.splice(i, 1); draw(); render(); });
      set.append(remove);
      rows.append(set);
    });
    const actions = document.createElement('p');
    actions.className = 'ui-controls__actions';
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'ui-btn';
    add.textContent = 'Add a row';
    add.addEventListener('click', () => { state.rows.push({ ...schema.blank }); draw(); render(); });
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'ui-link-btn';
    reset.textContent = 'Back to the example';
    reset.addEventListener('click', () => { state = structuredClone(start); draw(); render(); });
    actions.append(add, reset);
    box.append(top, rows, actions);
  };
  draw();
});
