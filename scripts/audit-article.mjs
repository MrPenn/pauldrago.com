#!/usr/bin/env node
// Kit audit for one article: npm run audit:article -- <slug | path/to/article.md> [--format=json]
// Prints how the article sits against the approved kit: whether it loads the kit, every figure
// sorted into on the kit, has a kit equivalent, rebuild on the kit, new to the kit (Paul decides) or
// remove, the decisions it needs from Paul, every class, every lint finding, and the signature
// devices it uses or cannot use yet. Exit codes: 0 no errors, 1 lint errors, 2 bad arguments.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditArticle, formatAudit, resolveArticle } from '../src/styleguide/audit.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('--'));
const json = args.includes('--format=json');
const path = resolveArticle(root, target);
if (!path) {
  console.error(target ? `no article found for "${target}"` : 'usage: audit-article <slug | path/to/article.md> [--format=json]');
  process.exit(2);
}
const audit = auditArticle(root, path);
console.log(json ? JSON.stringify(audit, null, 2) : formatAudit(audit));
process.exit(audit.summary.errors ? 1 : 0);
