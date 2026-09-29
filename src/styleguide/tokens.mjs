// Design tokens, read out of the stylesheets at build time so /ui always shows what ships.
// site-shell.css defines one set of names for both themes: :root is light, and the
// prefers-color-scheme: dark block redefines them. This module reads both and measures contrast.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCss } from './lint.mjs';

const ROLES = {
  '--ground': 'Page background.',
  '--paper': 'Ink: text, rules, and the 2px rule over every figure.',
  '--secondary': 'Quieter text: decks, notes, captions, source lines.',
  '--brass': 'The one accent: the highlighted bar, section numbers, link underlines, the booking button.',
  '--on-brass': 'Text on the accent.',
  '--hairline': 'Hairline rules between rows and around fields.',
  '--panel': 'A shaded panel, such as the calculator.',
  '--panel-2': 'A second panel tone, for a focused field on service pages.',
  '--dark-navy': 'A raised surface: inputs and the calculator total. White in light mode.',
  '--ok': 'A status dot that means "working".',
};

// Tokens that carry text or a mark someone has to see, measured against the page background.
const TEXT_TOKENS = new Set(['--paper', '--secondary', '--brass']);

// The :root custom properties, in any layer, split into light and dark values: a colour written as
// light-dark(a, b) gives a to light and b to dark; anything else is the same in both.
function splitTopLevel(v) {
  const out = []; let depth = 0; let cur = '';
  for (const ch of v) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}
function rootBlocks(css) {
  const light = {};
  const dark = {};
  for (const rule of parseCss(css)) {
    if (rule.selector.trim() !== ':root') continue;
    if (rule.context.some((c) => !/^@layer\b/.test(c))) continue;
    for (const d of rule.declarations) {
      if (!d.prop.startsWith('--')) continue;
      const v = d.value.trim();
      const m = v.match(/^light-dark\((.*)\)$/s);
      if (m) { const [a, b] = splitTopLevel(m[1]); light[d.prop] = a; dark[d.prop] = b; } else { light[d.prop] = v; dark[d.prop] = v; }
    }
  }
  return { light, dark };
}

const hex = (v) => (/^#[0-9a-f]{6}$/i.test(v) ? v : /^#[0-9a-f]{3}$/i.test(v) ? '#' + v.slice(1).split('').map((c) => c + c).join('') : null);
function luminance(h) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
}

/** Every colour token with its light and dark value, its role, and contrast on the ground. */
export function colorTokens(root) {
  const { light, dark } = rootBlocks(readFileSync(join(root, 'public/assets/site-shell.css'), 'utf8'));
  return Object.keys(light).filter((k) => hex(light[k])).map((name) => {
    const l = hex(light[name]);
    const d = hex(dark[name] ?? light[name]);
    const text = TEXT_TOKENS.has(name);
    return {
      name,
      role: ROLES[name] ?? '',
      light: l,
      dark: d,
      text,
      lightContrast: text ? contrast(l, hex(light['--ground'])) : null,
      darkContrast: text ? contrast(d, hex(dark['--ground'])) : null,
      onBrass: name === '--on-brass' ? [contrast(l, hex(light['--brass'])), contrast(d, hex(dark['--brass']))] : null,
    };
  });
}

/** The base type tokens site-shell.css defines, other than the scale: faces, weights, line spacing, tracking. */
export function typeTokens(root) {
  const { light } = rootBlocks(readFileSync(join(root, 'public/assets/site-shell.css'), 'utf8'));
  const group = (prefix) => Object.entries(light).filter(([k]) => k.startsWith(prefix)).map(([name, value]) => ({ name, value }));
  return { fonts: group('--font-'), weights: group('--weight-'), leading: group('--leading-'), tracking: group('--tracking-') };
}

/** The spacing scale as site-shell.css defines it, smallest first. */
export function spaceTokens(root) {
  const { light } = rootBlocks(readFileSync(join(root, 'public/assets/site-shell.css'), 'utf8'));
  return Object.entries(light).filter(([k]) => k.startsWith('--space-')).map(([name, value]) => ({ name, value, px: Number(value.replace('px', '')) })).sort((a, b) => a.px - b.px);
}

/** The grid tokens: containers, gutter, rail and measures. */
export function gridTokens(root) {
  const { light } = rootBlocks(readFileSync(join(root, 'public/assets/site-shell.css'), 'utf8'));
  return Object.entries(light).filter(([k]) => /^--(?:container|gutter|rail|measure)/.test(k)).map(([name, value]) => ({ name, value }));
}

/** Motion, the focus ring's offsets and the stacking order as site-shell.css defines them; the z-index steps lowest first. */
export function behaviorTokens(root) {
  const { light } = rootBlocks(readFileSync(join(root, 'public/assets/site-shell.css'), 'utf8'));
  const group = (prefix) => Object.entries(light).filter(([k]) => k.startsWith(prefix)).map(([name, value]) => ({ name, value }));
  return { motion: group('--pd-'), focus: group('--focus-'), stack: group('--z-').sort((a, b) => Number(a.value) - Number(b.value)) };
}

/** The type scale's steps as site-shell.css defines them: [{ step, name, px }], smallest first. */
export function typeSteps(root) {
  const { light } = rootBlocks(readFileSync(join(root, 'public/assets/site-shell.css'), 'utf8'));
  return Object.entries(light)
    .map(([name, v]) => ({ name, m: name.match(/^--step-(-?\d+)$/), px: Math.round(Number(String(v).match(/^([\d.]+)rem$/)?.[1]) * 16) }))
    .filter((t) => t.m)
    .map((t) => ({ step: Number(t.m[1]), name: t.name, px: t.px }))
    .sort((a, b) => a.step - b.step);
}
