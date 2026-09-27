#!/usr/bin/env node
// Styleguide linter. Checks every article, every stylesheet and the width queries in scripts against the rules at /ui/lint.
//
//   npm run lint:style                         every article, the kit and each article's stylesheet
//   npm run lint:style -- path/to/article.md   one file (articles are still read for the spacing rule)
//   --format=json    machine-readable findings
//   --strict         warnings fail the run too
//   --only=a,b       only these rule ids
//   --prose          also run the anti-slop linter over the articles, when it is installed
//                    (SLOP_LINT=/path/to/slop_lint.py, or ~/.claude/skills/anti-slop/slop_lint.py)
//   --list-rules     print the rules and exit
//
// Exit codes: 0 clean, 1 an error (or a warning with --strict), 2 bad arguments.
import { resolve, relative, join } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { RULES, lintSite } from '../src/styleguide/lint.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
const value = (name) => flag(name)?.split('=')[1];
const files = args.filter((a) => !a.startsWith('--'));
const known = ['format', 'strict', 'only', 'prose', 'list-rules', 'help'];
const unknown = args.filter((a) => a.startsWith('--') && !known.includes(a.slice(2).split('=')[0]));
if (unknown.length || flag('help')) {
  if (unknown.length) console.error(`unknown option ${unknown.join(', ')}`);
  console.error('usage: lint-style [files] [--format=json] [--strict] [--only=ids] [--prose] [--list-rules]');
  process.exit(unknown.length ? 2 : 0);
}

if (flag('list-rules')) {
  for (const r of RULES) console.log(`${r.id.padEnd(20)} ${r.severity.padEnd(6)} ${r.title}`);
  process.exit(0);
}

const only = value('only')?.split(',').filter(Boolean);
if (only?.some((id) => !RULES.find((r) => r.id === id))) {
  console.error(`unknown rule in --only: ${only.filter((id) => !RULES.find((r) => r.id === id)).join(', ')}`);
  process.exit(2);
}

const targets = files.length ? files.map((f) => resolve(f)) : null;
let findings = lintSite(root, targets);
if (only) findings = findings.filter((f) => only.includes(f.rule));
const order = { error: 0, warn: 1, info: 2 };
findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || order[a.severity] - order[b.severity]);

const count = (s) => findings.filter((f) => f.severity === s).length;
if (value('format') === 'json') {
  console.log(JSON.stringify(findings.map((f) => ({ ...f, file: relative(root, f.file) })), null, 2));
} else {
  const label = { error: 'error', warn: 'warning', info: 'info' };
  for (const f of findings) {
    console.log(`${relative(root, f.file)}:${f.line}:${f.col}  ${label[f.severity].padEnd(7)} [${f.rule}] ${f.message}`);
    if (f.fix && f.severity !== 'info') console.log(`    fix: ${f.fix}`);
  }
  const checked = targets ? targets.length : 'all';
  console.log(`\n${count('error')} errors, ${count('warn')} warnings, ${count('info')} info (${checked === 'all' ? 'every article, stylesheet and script' : `${checked} file${checked === 1 ? '' : 's'}`}). Rules: /ui/lint`);
}

let status = count('error') || (flag('strict') && count('warn')) ? 1 : 0;

if (flag('prose')) {
  const slop = process.env.SLOP_LINT || join(homedir(), '.claude/skills/anti-slop/slop_lint.py');
  if (!existsSync(slop)) {
    console.log(`\nprose: anti-slop linter not found at ${slop}; skipped`);
  } else {
    const articles = targets?.filter((t) => t.endsWith('.md')) ?? readdirSync(join(root, 'src/content/articles')).filter((f) => f.endsWith('.md')).map((f) => join(root, 'src/content/articles', f));
    console.log('\nprose (anti-slop):');
    const run = spawnSync('python3', [slop, '--min-severity=warn', ...articles], { stdio: 'inherit' });
    if (run.status === 1) status = 1;
  }
}

process.exit(status);
