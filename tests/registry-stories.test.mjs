// Tests that the /ui stories copied from an article match the article's own text. Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { byId } from '../src/styleguide/components.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
// HTML comments never render, so they are left out of the comparison.
const read = (slug) => readFileSync(join(root, 'src/content/articles', `${slug}.md`), 'utf8').replace(/[ \t]*<!--[\s\S]*?-->/g, '');
const FRONT_DOOR = read('the-digital-front-door-nobody-walks-through');
const NO_PARENT = read('your-content-has-no-parent');

const story = (id, sid) => byId(id).stories.find((s) => s.id === sid);
// The first line of the story the article does not have, so a failure shows where they part.
const firstMissing = (snippet, article) => snippet.split('\n').find((l) => !article.includes(l)) ?? '(every line appears in the article, but not as one block)';
const assertIn = (snippet, article, name) => assert.ok(article.includes(snippet), `${name} drifted from the article at: ${firstMissing(snippet, article)}`);

test('each pinned sequence story is the article markdown, with its footnotes', () => {
  for (const [id, sid] of [['pinned-sequence', 'customer'], ['pinned-sequence', 'wait'], ['org-fold', 'twelve']]) {
    const code = story(id, sid).code;
    const end = code.indexOf('</section>') + '</section>'.length;
    assertIn(code.slice(0, end), FRONT_DOOR, `${id}/${sid}`);
    // The footnotes sit at the end of the article, one per line.
    const notes = code.slice(end).split('\n').filter(Boolean);
    for (const n of notes) assert.ok(FRONT_DOOR.split('\n').includes(n), `${id}/${sid} footnote drifted: ${n.slice(0, 80)}`);
  }
});

test('each figure story is the HTML its article prints', () => {
  const cases = [
    ['calculator', 'customer', FRONT_DOOR],
    ['dialogue', 'exchange', FRONT_DOOR],
    ['unit-stat', 'twenty', FRONT_DOOR],
    ['unit-stat', 'hundred', FRONT_DOOR],
    ['unit-grid', 'callback', FRONT_DOOR],
    ['record', 'fine', NO_PARENT],
    ['as-of', 'disclosure', NO_PARENT],
  ];
  for (const [id, sid, article] of cases) assertIn(story(id, sid).html, article, `${id}/${sid}`);
});
