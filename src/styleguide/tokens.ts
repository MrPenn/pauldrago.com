// Design tokens, read out of the stylesheets at build time so /ui always shows what ships.
// site-shell.css defines one set of names for both themes: :root is light, and the
// prefers-color-scheme: dark block redefines them. This module reads both and measures contrast.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCss } from './lint.ts';
import { must } from '../data/must.ts';

type Tokens = Record<string, string>;

const ROLES: Tokens = {
  '--ground': 'Page background.',
  '--paper': 'Ink: text, rules, and the 2px rule over every figure.',
  '--secondary': 'Quieter text: decks, notes, captions, source lines.',
  '--brass': 'The one accent: the highlighted bar, section numbers, link underlines, the booking button.',
  '--on-brass': 'Text on the accent.',
  '--hairline': 'Hairline rules between rows and around fields.',
  '--panel': 'A shaded panel, such as the calculator.',
  '--panel-2': 'A second panel tone, for a focused field on service pages.',
  '--well': 'A raised surface: inputs, the calculator total and the cookie banner. White in light mode, near black in dark.',
  '--ok': 'A status dot that means "working".',
};

// Tokens that carry text or a mark someone has to see, measured against the page background.
const TEXT_TOKENS = new Set(['--paper', '--secondary', '--brass']);

// The :root custom properties, in any layer, split into light and dark values: a colour written as
// light-dark(a, b) gives a to light and b to dark; anything else is the same in both.
function splitTopLevel(v: string) {
  const out: string[] = []; let depth = 0; let cur = '';
  for (const ch of v) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}
function rootBlocks(css: string) {
  const light: Tokens = {};
  const dark: Tokens = {};
  for (const rule of parseCss(css)) {
    if (rule.selector.trim() !== ':root') continue;
    if (rule.context.some((c) => !/^@layer\b/.test(c))) continue;
    for (const d of rule.declarations) {
      if (!d.prop.startsWith('--')) continue;
      const v = d.value.trim();
      const m = v.match(/^light-dark\((.*)\)$/s);
      if (m) { const [a = '', b = ''] = splitTopLevel(m[1] ?? ''); light[d.prop] = a; dark[d.prop] = b; } else { light[d.prop] = v; dark[d.prop] = v; }
    }
  }
  return { light, dark };
}

const hex = (v: string | undefined) => (v === undefined ? null : /^#[0-9a-f]{6}$/i.test(v) ? v : /^#[0-9a-f]{3}$/i.test(v) ? '#' + v.slice(1).split('').map((c) => c + c).join('') : null);
function luminance(h: string) {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string) {
  const [x = 0, y = 0] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
}

/** Every colour token with its light and dark value, its role, and contrast on the ground. */
export function colorTokens(root: string) {
  const { light, dark } = rootBlocks(readFileSync(join(root, 'public/assets/site-shell.css'), 'utf8'));
  const color = (tokens: Tokens, name: string) => must(hex(tokens[name]), `${name} as a hex colour`);
  return Object.keys(light).filter((k) => hex(light[k])).map((name) => {
    const l = color(light, name);
    const d = hex(dark[name]) ?? l;
    const text = TEXT_TOKENS.has(name);
    return {
      name,
      role: ROLES[name] ?? '',
      light: l,
      dark: d,
      text,
      lightContrast: text ? contrast(l, color(light, '--ground')) : null,
      darkContrast: text ? contrast(d, color(dark, '--ground')) : null,
      onBrass: name === '--on-brass' ? [contrast(l, color(light, '--brass')), contrast(d, color(dark, '--brass'))] : null,
    };
  });
}

/** The base type tokens site-shell.css defines, other than the scale: faces, weights, line spacing, tracking. */
export function typeTokens(root: string) {
  const { light } = rootBlocks(readFileSync(join(root, 'public/assets/site-shell.css'), 'utf8'));
  const group = (prefix: string) => Object.entries(light).filter(([k]) => k.startsWith(prefix)).map(([name, value]) => ({ name, value }));
  return { fonts: group('--font-'), weights: group('--weight-'), leading: group('--leading-'), tracking: group('--tracking-') };
}

/** The spacing scale as site-shell.css defines it, smallest first. */
export function spaceTokens(root: string) {
  const { light } = rootBlocks(readFileSync(join(root, 'public/assets/site-shell.css'), 'utf8'));
  return Object.entries(light).filter(([k]) => k.startsWith('--space-')).map(([name, value]) => ({ name, value, px: Number(value.replace('px', '')) })).sort((a, b) => a.px - b.px);
}

/** The grid tokens: containers, gutter, rail and measures. */
export function gridTokens(root: string) {
  const { light } = rootBlocks(readFileSync(join(root, 'public/assets/site-shell.css'), 'utf8'));
  return Object.entries(light).filter(([k]) => /^--(?:container|gutter|rail|measure)/.test(k)).map(([name, value]) => ({ name, value }));
}

/** Motion, the focus ring's offsets and the stacking order as site-shell.css defines them; the z-index steps lowest first. */
export function behaviorTokens(root: string) {
  const { light } = rootBlocks(readFileSync(join(root, 'public/assets/site-shell.css'), 'utf8'));
  const group = (prefix: string) => Object.entries(light).filter(([k]) => k.startsWith(prefix)).map(([name, value]) => ({ name, value }));
  return { motion: group('--pd-'), focus: group('--focus-'), stack: group('--z-').sort((a, b) => Number(a.value) - Number(b.value)) };
}

/** The type scale's steps as site-shell.css defines them: [{ step, name, px }], smallest first. */
export function typeSteps(root: string) {
  const { light } = rootBlocks(readFileSync(join(root, 'public/assets/site-shell.css'), 'utf8'));
  return Object.entries(light)
    .flatMap(([name, v]) => {
      const m = name.match(/^--step-(-?\d+)$/);
      return m ? [{ step: Number(m[1]), name, px: Math.round(Number(v.match(/^([\d.]+)rem$/)?.[1]) * 16) }] : [];
    })
    .sort((a, b) => a.step - b.step);
}
