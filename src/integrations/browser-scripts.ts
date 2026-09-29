// The browser scripts are written in TypeScript in src/scripts and served as plain scripts at
// /assets/<name>.js, the address pages, article front matter and the /ui frames load them from.
// Vite strips the types and nothing else, so each file stays a classic script and loads as before.

import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { transformWithOxc } from 'vite';
import type { AstroIntegration } from 'astro';

async function compile(file: string) {
  return (await transformWithOxc(await readFile(file, 'utf8'), file)).code;
}

export function browserScripts(): AstroIntegration {
  let src = '';
  return {
    name: 'browser-scripts',
    hooks: {
      // In development each script compiles when it is requested.
      'astro:config:setup': ({ config, updateConfig }) => {
        src = fileURLToPath(new URL('src/scripts/', config.root));
        updateConfig({
          vite: {
            plugins: [{
              name: 'browser-scripts',
              configureServer(server) {
                server.middlewares.use(async (req, res, next) => {
                  // A bare file name only, so a request cannot reach outside src/scripts.
                  const name = req.url?.match(/^\/assets\/([\w-]+)\.js(?:\?|$)/)?.[1];
                  const file = name ? join(src, `${name}.ts`) : '';
                  if (!file || !existsSync(file)) return next();
                  try {
                    const code = await compile(file);
                    res.setHeader('Content-Type', 'text/javascript');
                    res.end(code);
                  } catch (error) {
                    next(error);
                  }
                });
              },
            }],
          },
        });
      },
      'astro:build:done': async ({ dir, logger }) => {
        const out = join(fileURLToPath(dir), 'assets');
        await mkdir(out, { recursive: true });
        const names = (await readdir(src)).filter((f) => f.endsWith('.ts'));
        for (const f of names) await writeFile(join(out, f.replace(/\.ts$/, '.js')), await compile(join(src, f)));
        logger.info(`${names.length} browser scripts compiled to /assets`);
      },
    },
  };
}
