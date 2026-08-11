#!/usr/bin/env node

/**
 * Generate the list of broadcast dates that actually have an audio recording.
 *
 * WHY THIS EXISTS: audio availability used to be inferred from the date alone
 * — `date > 2009-01-11` — which is a guess, not a fact. Measured against the
 * bucket, 96 of the 3,244 broadcasts after that cutoff have no `.mp3` at all,
 * 94 of them in 2014. Every one of those was given a speaker icon, a glow ring
 * and an aria-label promising "(audio recording available)", and the player was
 * handed a URL that 403s.
 *
 * The archive is frozen (the last broadcast is 2017-11-29), so the set of dates
 * with audio is fixed and small enough to ship: 3,149 entries, about 10 kB
 * gzipped. Shipping the facts is both smaller and more honest than a heuristic
 * that is wrong 3% of the time.
 *
 * REGENERATING requires read access to the data bucket, because the only source
 * of truth for which recordings exist is the bucket itself:
 *
 *   aws s3 ls s3://garrison-twa/public/ --recursive --region us-west-1 |
 *     grep '[.]mp3$' |
 *     sed -E 's#.+/([0-9]{8})[.]mp3$#\1#' |
 *     sort -u > audio-dates.txt
 *   node scripts/generate-audio-index.mjs audio-dates.txt
 *
 * (the sed above is written with .+/ rather than .*''/ because the latter
 * would close this comment block)
 *
 * Note the bucket is us-west-1 even though the SAM stack deploys to us-west-2.
 *
 * The committed output is checked in so neither the build nor a contributor
 * needs AWS credentials. It only changes if the archive does.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEST = 'frontend/public/audio-dates.json';

const input = process.argv[2];
if (!input) {
  console.error('usage: node scripts/generate-audio-index.mjs <dates-file>');
  console.error('       one YYYYMMDD per line; see the header for the aws command');
  process.exit(1);
}

const dates = fs
  .readFileSync(path.resolve(input), 'utf8')
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean);

const invalid = dates.filter(d => !/^\d{8}$/.test(d));
if (invalid.length) {
  throw new Error(`${invalid.length} entries are not YYYYMMDD, first: ${invalid[0]}`);
}

const unique = [...new Set(dates)].sort();

/*
 * An empty input would write `[]` over a good manifest, and the author page
 * would then report that no broadcast in the archive has a recording -- a
 * silent, total regression from a truncated pipe or a failed aws call. The
 * range line below would also log `undefined .. undefined`. Fail before
 * writing anything.
 */
if (unique.length === 0) {
  throw new Error(
    `${input} contained no YYYYMMDD entries; refusing to overwrite ${DEST} with an empty manifest`
  );
}

const destination = path.join(repoRoot, DEST);
fs.writeFileSync(destination, `${JSON.stringify(unique)}\n`);

console.log(`dates:   ${unique.length}`);
console.log(`range:   ${unique[0]} .. ${unique[unique.length - 1]}`);
console.log(`wrote ${DEST} (${fs.statSync(destination).size.toLocaleString()} bytes)`);
