// Design tokens, read out of the stylesheets at build time so /ui always shows what ships.
// site-shell.css defines one set of names for both themes: :root is light, and the
// prefers-color-scheme: dark block redefines them. This module reads both, measures contrast,
// and writes the CSS that lets a /ui frame force either theme.
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

function rootBlocks(css) {
  const light = {};
  const dark = {};
  for (const rule of parseCss(css)) {
    if (rule.selector.trim() !== ':root') continue;
    const isDark = rule.context.some((c) => /prefers-color-scheme:\s*dark/.test(c));
    if (rule.context.length && !isDark) continue;
    for (const d of rule.declarations) if (d.prop.startsWith('--')) (isDark ? dark : light)[d.prop] = d.value.trim();
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

/** The type scale's steps as site-shell.css defines them: [{ step, name, px }], smallest first. */
export function typeSteps(root) {
  const { light } = rootBlocks(readFileSync(join(root, 'public/assets/site-shell.css'), 'utf8'));
  return Object.entries(light)
    .map(([name, v]) => ({ name, m: name.match(/^--step-(-?\d+)$/), px: Number(String(v).match(/^([\d.]+)px$/)?.[1]) }))
    .filter((t) => t.m)
    .map((t) => ({ step: Number(t.m[1]), name: t.name, px: t.px }))
    .sort((a, b) => a.step - b.step);
}

/**
 * CSS that forces a theme on a frame: :root[data-theme="light"] and :root[data-theme="dark"]
 * carry every custom property the given stylesheets define for that theme.
 */
export function themeOverrides(root, hrefs) {
  const light = {};
  const dark = {};
  for (const href of hrefs) {
    const blocks = rootBlocks(readFileSync(join(root, 'public', href), 'utf8'));
    Object.assign(light, blocks.light);
    Object.assign(dark, blocks.dark);
  }
  const block = (sel, vars, scheme) => `${sel} { ${Object.entries(vars).map(([k, v]) => `${k}: ${v};`).join(' ')} color-scheme: ${scheme}; }`;
  return [block(':root[data-theme="light"]', light, 'light'), block(':root[data-theme="dark"]', { ...light, ...dark }, 'dark')].join('\n');
}
