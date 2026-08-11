#!/usr/bin/env node

/**
 * Generate the client search index served as a static asset.
 *
 * WHY THIS EXISTS: `Authors_sorted.ts` and `Poems_sorted.ts` are 7,572 strings
 * — 186 kB raw, 67 kB gzipped. Importing them from application code compiles
 * them into the entry chunk, so every visitor downloads and parses the whole
 * archive index before first paint, including someone who reads today's poem
 * and leaves. Emitting them as a static JSON asset moves that weight out of the
 * JS bundle: the browser fetches it once, caches it, and never parses it as
 * JavaScript.
 *
 * The output lands in `frontend/public/`, so Vite copies it into the build and
 * it ships with the frontend deploy. That is deliberate — serving it from the
 * separate data bucket would make the app's correctness depend on an upload
 * ordering the deploy process does not enforce.
 *
 * The archive is frozen (1993-2017), so this is effectively a one-time
 * generation. It stays a script rather than a committed mystery blob so the
 * provenance of the JSON is checkable and it can be regenerated if the source
 * lists ever change.
 *
 * USAGE: npm run build:search-index
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SOURCES = {
  authors: 'frontend/src/assets/Authors_sorted.ts',
  poems: 'frontend/src/assets/Poems_sorted.ts',
};
const DEST = 'frontend/public/search-index.json';

/**
 * Read one of the sorted-list modules.
 *
 * The files carry no type annotations — each is a bare `export default [...]`
 * of string literals — so swapping the export keyword for a CommonJS
 * assignment makes them loadable without a TypeScript toolchain.
 */
function loadList(relativePath) {
  const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  if (!/^export default \[/.test(source)) {
    throw new Error(`${relativePath}: expected a bare 'export default [' module`);
  }

  const tmp = path.join(
    os.tmpdir(),
    `search-index-${path.basename(relativePath)}-${process.pid}.cjs`
  );
  fs.writeFileSync(tmp, source.replace(/^export default/, 'module.exports ='));
  try {
    const value = require(tmp);
    if (!Array.isArray(value) || value.some(entry => typeof entry !== 'string')) {
      throw new Error(`${relativePath}: expected an array of strings`);
    }
    return value;
  } finally {
    fs.unlinkSync(tmp);
  }
}

const authors = loadList(SOURCES.authors);
const poems = loadList(SOURCES.poems);

// Written without indentation on purpose: this is a machine-read asset shipped
// over the wire, not a document anyone edits by hand.
const destination = path.join(repoRoot, DEST);
fs.writeFileSync(destination, `${JSON.stringify({ authors, poems })}\n`);

const bytes = fs.statSync(destination).size;
console.log(`authors: ${authors.length}`);
console.log(`poems:   ${poems.length}`);
console.log(`wrote ${DEST} (${bytes.toLocaleString()} bytes)`);
