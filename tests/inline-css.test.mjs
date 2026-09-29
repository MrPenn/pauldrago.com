// Tests for the stylesheet inliner (src/layouts/inline-css.mjs). Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'lightningcss';
import { inlineSheets } from '../src/layouts/inline-css.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

// Parses a sheet, counts its rules and declarations, and prints it back without comments.
const parse = (filename, css) => {
  let rules = 0;
  let declarations = 0;
  const { code } = transform({ filename, code: Buffer.from(css), visitor: { Rule() { rules++; }, Declaration() { declarations++; } } });
  return { rules, declarations, code: code.toString() };
};

// A comment marker inside a string, such as content: '/*', would make the strip cut real rules.
test('every stylesheet parses the same with its comments stripped', () => {
  const dir = join(root, 'public/assets');
  const sheets = readdirSync(dir).filter((f) => f.endsWith('.css'));
  assert.ok(sheets.length > 0, 'no stylesheets found');
  for (const f of sheets) {
    const source = parse(f, readFileSync(join(dir, f), 'utf8'));
    const inlined = parse(f, inlineSheets([`/assets/${f}`], root));
    assert.deepEqual({ rules: inlined.rules, declarations: inlined.declarations }, { rules: source.rules, declarations: source.declarations }, f);
    assert.ok(inlined.code === source.code, `${f} parses differently once its comments are stripped`);
  }
});
