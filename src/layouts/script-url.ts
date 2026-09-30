// The address a page loads a browser script from. The ?v= is a hash of the script's source in
// src/scripts, so the address changes only when the script does and browsers can cache it for a
// year (public/_headers). A deploy that leaves a script alone leaves its cached copy in place.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const versions = new Map<string, string>();

/** '/assets/<name>.js' with ?v= set from src/scripts/<name>.ts. */
export function scriptUrl(href: string, root = process.cwd()) {
  const name = href.match(/^\/assets\/([\w-]+)\.js$/)?.[1];
  if (!name) throw new Error(`${href} is not a browser script. They are served at /assets/<name>.js from src/scripts/<name>.ts.`);
  let v = versions.get(name);
  if (!v) {
    v = createHash('sha256').update(readFileSync(join(root, 'src/scripts', `${name}.ts`))).digest('hex').slice(0, 10);
    versions.set(name, v);
  }
  return `${href}?v=${v}`;
}
