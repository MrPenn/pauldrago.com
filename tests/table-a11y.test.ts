import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tableA11yHtml } from '../src/integrations/table-a11y.ts';

test('an article table sits in a named region with scoped headers', () => {
  const out = tableA11yHtml('<h2 id="x">Rules &amp; records</h2><p>Text.</p><table><thead><tr><th>Rule</th><th>Binds</th></tr></thead><tbody><tr><th>FINRA</th><td>Brokers</td></tr></tbody></table>');
  assert.match(out, /<div class="article__table" role="region" aria-label="Rules &amp; records" tabindex="0"><table>/);
  assert.match(out, /<th scope="col">Rule<\/th><th scope="col">Binds<\/th>/);
  assert.match(out, /<th scope="row">FINRA<\/th>/);
});

test('a caption names the region, and a scope already written is kept', () => {
  const out = tableA11yHtml('<h2>Section</h2><table><caption class="sr-only">One ad, three languages</caption><thead><tr><th scope="col">Slot</th></tr></thead><tbody><tr><th scope="row">Headline</th></tr></tbody></table>');
  assert.match(out, /aria-label="One ad, three languages"/);
  assert.equal((out.match(/scope=/g) ?? []).length, 2);
});
