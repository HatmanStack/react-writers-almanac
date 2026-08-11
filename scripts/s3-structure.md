# S3 Directory Structure

## Overview

This document describes the S3 key layout for The Writer's Almanac data files, as
served through CloudFront.

**The authority for every path below is
[`frontend/src/api/endpoints.ts`](../frontend/src/api/endpoints.ts).** That module
is what the running application uses to build request paths, so it is the
definition rather than a description of one. Every path and every JSON shape in
this document was checked against it, and then checked again by fetching the key
through CloudFront — the observed HTTP statuses are recorded in
[CloudFront Access](#cloudfront-access) below.

Everything under the bucket sits beneath a single `public/` prefix. An earlier
version of this document showed `authors/` at the bucket root and daily poems as
flat `public/{YYYYMMDD}.json`; neither key exists.

## Directory Layout

```text
s3://bucket-name/
└── public/
    ├── {YYYY}/                          # Daily poems and audio, nested by year
    │   └── {MM}/                        # then by month
    │       ├── 20150315.json            # Daily poem (YYYYMMDD)
    │       ├── 20150315.mp3             # Audio (dates after 2009-01-11)
    │       └── ...
    │
    ├── authors/
    │   ├── by-name/                     # Individual author files
    │   │   ├── a-a-milne.json
    │   │   ├── billy-collins.json
    │   │   ├── e-e-cummings.json
    │   │   └── ...
    │   │
    │   └── by-letter/                   # Authors grouped by first letter
    │       ├── A.json                   # NOTE: no objects exist under this
    │       ├── B.json                   #       prefix today. See Known
    │       └── ...                      #       discrepancies.
    │
    └── poems/
        └── by-title/                    # Dates a given poem was broadcast
            ├── the-lanyard.json
            └── ...
```

## Path Reference

Each row is a builder in `frontend/src/api/endpoints.ts`.

| Builder              | Key                                      |
| -------------------- | ---------------------------------------- |
| `getPoemByDate`      | `public/{YYYY}/{MM}/{YYYYMMDD}.json`     |
| `getPoemAudio`       | `public/{YYYY}/{MM}/{YYYYMMDD}.mp3`      |
| `getAuthorBySlug`    | `public/authors/by-name/{slug}.json`     |
| `getAuthorsByLetter` | `public/authors/by-letter/{LETTER}.json` |
| `getPoemBySlug`      | `public/poems/by-title/{slug}.json`      |

The year/month nesting on the daily poem is the part most often got wrong: the
date appears three times in the key, twice split apart and once whole.
`20150315` becomes `public/2015/03/20150315.json`, not `public/20150315.json`.

## File Formats

### Daily Poem Files (`public/{YYYY}/{MM}/{YYYYMMDD}.json`)

Fetched by `usePoemData`; the consumer's view of the shape is the `PoemResponse`
interface at `frontend/src/hooks/usePoemData.ts:17-26`. Note that `PoemResponse`
declares only the fields the app reads — the stored objects carry two more,
`filename` and `audiolink`, which nothing consumes (audio is addressed by the
`getPoemAudio` key instead).

Several fields contain HTML — `dayofweek`, `date`, `poembyline` and `notes` all
arrive wrapped in tags. That is why every one of them is passed through DOMPurify
before rendering, via `sanitizeHtml` (`frontend/src/utils/sanitize.ts`) or a
direct `DOMPurify.sanitize` call in `routes/AppLayout.tsx`. Structure, from
`public/2015/03/20150315.json`:

```json
{
  "filename": "20150315",
  "dayofweek": "<span class=\"day\">Sunday</span>",
  "date": "<span class=\"date\">Mar. 15, 2015</span>",
  "audiolink": "NotAvailable",
  "transcript": "And here is the writer's almanac for Sunday...",
  "poemtitle": ["Consuming Desire"],
  "poembyline": "<b>Poem</b>: \"Consuming Desire\" by Katrina Vandenberg...",
  "author": ["Katrina Vandenberg"],
  "poem": ["Line 1<br/>Line 2", "..."],
  "notes": ["<strong>It was on this day...</strong>", "..."]
}
```

`poem`, `poemtitle`, `author` and `notes` are arrays in the stored data but the
consumer accepts `string | string[]` for each, so do not rely on the array form
when writing new data.

### Individual Author Files (`public/authors/by-name/{slug}.json`)

Slug format: lowercase with hyphens — see
[Slugification Rules](#slugification-rules).

Structure, from `public/authors/by-name/billy-collins.json`:

```json
{
  "author": "Billy Collins",
  "authorId": "1574",
  "biography": "William \"Billy\" Collins is a highly regarded...",
  "photos": { "primary": "BillyCollins_NewBioImage.jpg" },
  "poems": [{ "title": "1960", "dates": ["Nov. 7, 2016"] }],
  "additionalWorks": [
    {
      "title": "Carbon Dating",
      "url": "https://poets.org/poem/carbon-dating",
      "source": "poets.org"
    }
  ]
}
```

`additionalWorks` is optional — `a-a-milne.json`, for one, does not have it.

**A second, older shape also exists in the type system.** `Author` in
`frontend/src/types/author.ts` describes a source-keyed object
(`"poetry foundation"`, `"wikipedia"`, `"poets.org"`, `"all poetry"`), and
`frontend/src/components/Author/Author.tsx` reads both, calling them "old
structure" and "new structure" in its own comments. Every author file spot-checked
in the live bucket uses the flat shape above. Write the flat shape; the
source-keyed reader is there for data that predates it.

### Poem-by-Title Files (`public/poems/by-title/{slug}.json`)

Records every date a given poem was broadcast, so the poem-title route can list
them. Fetched by `usePoemDatesQuery`; typed as `PoemDates` in
`frontend/src/types/poemDates.ts`. Structure, from
`public/poems/by-title/the-lanyard.json`:

```json
{
  "title": "The Lanyard",
  "dates": ["Jan. 26, 2005", "Jan. 26, 2008"]
}
```

The slug is derived from the poem title by the same `slugify` the author path
uses.

### Letter-Grouped Files (`public/authors/by-letter/{A-Z}.json`)

**No objects exist under this prefix today** — see
[Known discrepancies](#known-discrepancies). The shape below is what
`AuthorsByLetter` in `frontend/src/types/author.ts` expects, should the data ever
be published:

```json
{
  "letter": "A",
  "authors": ["A. A. Milne", "Anna Akhmatova", "Anne Sexton"]
}
```

## Cache Control Settings

### Immutable Content (poems, audio, author data)

All content in S3 is immutable once published. Use aggressive caching:

```bash
--cache-control "public, max-age=31536000"  # 1 year
```

### Content Type

Ensure proper MIME types:

```bash
--content-type "application/json"  # For .json files
--content-type "audio/mpeg"        # For .mp3 files
```

## Upload Commands

`scripts/split-poets-json.js` writes to a local `output/authors/` tree. The
destination keys must carry the `public/` prefix, or the frontend will not find
them.

### Upload Individual Author Files

```bash
aws s3 sync ./output/authors/by-name/ s3://YOUR-BUCKET/public/authors/by-name/ \
  --cache-control "public, max-age=31536000" \
  --content-type "application/json"
```

### Upload Letter-Grouped Files

```bash
aws s3 sync ./output/authors/by-letter/ s3://YOUR-BUCKET/public/authors/by-letter/ \
  --cache-control "public, max-age=31536000" \
  --content-type "application/json"
```

### Upload All Author Files at Once

```bash
aws s3 sync ./output/authors/ s3://YOUR-BUCKET/public/authors/ \
  --cache-control "public, max-age=31536000" \
  --content-type "application/json"
```

## CloudFront Access

Files are accessed via CloudFront CDN. Base URL:
`https://d3vq6af2mo7fcy.cloudfront.net` — this is also the fallback compiled into
`frontend/src/api/client.ts:21-22` when `VITE_CDN_BASE_URL` is unset.

Every URL below was fetched on 2026-08-10 and its status recorded. The failing
rows are included on purpose: they are the shapes that look plausible and are
not.

| URL                                                                   | Status |
| --------------------------------------------------------------------- | ------ |
| `.../public/2015/03/20150315.json`                                    | 200    |
| `.../public/2015/03/20150315.mp3`                                     | 200    |
| `.../public/authors/by-name/billy-collins.json`                       | 200    |
| `.../public/poems/by-title/the-lanyard.json`                          | 200    |
| `.../public/authors/by-letter/B.json`                                 | 403    |
| `.../public/20240101.json` — flat, unnested; the old documented shape | 403    |
| `.../authors/by-name/billy-collins.json` — no `public/` prefix        | 403    |

Check any key yourself with:

```bash
curl -sI https://d3vq6af2mo7fcy.cloudfront.net/public/2015/03/20150315.json | head -1
```

A missing object returns **403, not 404**, because the distribution's origin
access does not grant `s3:ListBucket`. Do not read a 403 as a permissions
problem before checking that the key is spelled the way the table above spells
it.

## Known discrepancies

Three facts, recorded because they are load-bearing for anyone changing this
tier. **This document does not recommend a resolution for any of them; the
disposition of the backend is an open decision.**

1. **`public/authors/by-letter/` has no backing data.** `getAuthorsByLetter` is
   defined at `frontend/src/api/endpoints.ts:52`, and the
   `get-authors-by-letter` Lambda is deployed in `backend/template.yaml` behind
   `GET /api/authors/letter/{letter}`. Both address a prefix that returns 403 for
   every letter tried. Nothing in the running frontend calls either one.

2. **The Lambdas read keys without the `public/` prefix.** All three read
   unprefixed paths: `authors/by-name/` at `backend/lambdas/get-author/index.js:26`
   and `backend/lambdas/search-autocomplete/index.js:27`, and
   `authors/by-letter/` at `backend/lambdas/get-authors-by-letter/index.js:27`.
   The frontend and the bucket both use `public/authors/…`. As written, the
   Lambdas therefore read keys that do not exist.

3. **Whether to correct the Lambda prefixes or retire that tier is an open
   decision**, not settled by this document. Both are live options with cost on
   either side, and neither is implied by anything written above.

## File Naming Conventions

### Slugification Rules

Author names and poem titles are converted to slugs by `slugify` in
`frontend/src/utils/string.ts`, which `scripts/split-poets-json.js:54` mirrors:

1. Convert to lowercase and trim
2. Replace whitespace, underscores **and dots** with hyphens
3. Drop everything that is not a Unicode letter, number, or hyphen
4. Collapse runs of hyphens into one
5. Trim leading/trailing hyphens

Note step 2: a dot becomes a hyphen before step 3 removes anything, so initials
keep their separation.

Examples, each verified against the live bucket:

- `"Billy Collins"` → `"billy-collins"`
- `"A. A. Milne"` → `"a-a-milne"`
- `"e.e. cummings"` → `"e-e-cummings"` (**not** `ee-cummings`; that key 403s)
- `"W. S. Merwin"` → `"w-s-merwin"`

### Date Format

Daily poems use YYYYMMDD format inside a `{YYYY}/{MM}/` prefix:

- `20150315` → `public/2015/03/20150315.json`
- `20091231` → `public/2009/12/20091231.json`

The archive runs 1993-01-01 to 2017-11-29; the boundaries are defined in
`frontend/src/utils/dateMapping.ts`.

## Manifest File

`scripts/split-poets-json.js` writes a `manifest.json` beside its output. It is
**not** uploaded to S3 and nothing reads it at runtime; it exists so a human can
check the name-to-slug mapping the run produced.

```json
{
  "totalAuthors": 150,
  "generatedAt": "2024-10-24T12:00:00.000Z",
  "authors": [
    {
      "name": "Billy Collins",
      "slug": "billy-collins",
      "letter": "B",
      "file": "authors/by-name/billy-collins.json"
    }
  ],
  "letterFiles": ["authors/by-letter/A.json", "authors/by-letter/B.json"]
}
```

The `file` and `letterFiles` values are paths within the local `output/` tree, so
they carry no `public/` prefix. The prefix is added by the `aws s3 sync`
destination, not by the manifest.

## Validation

All JSON files are validated during generation:

1. **Syntax**: Valid JSON structure
2. **Parse test**: `JSON.parse()` succeeds
3. **Content**: Data matches expected structure

## Troubleshooting

### Issue: Author not found

Check:

1. Author name spelling
2. Slug conversion — run `slugify` from `frontend/src/utils/string.ts` on the
   name rather than guessing; dots become hyphens
3. S3 key exists: `aws s3 ls s3://bucket/public/authors/by-name/`

### Issue: 403 on CloudFront

A 403 is the normal response for a key that does not exist, so check spelling
before permissions:

1. The key carries the `public/` prefix
2. For a daily poem, the key is nested `public/{YYYY}/{MM}/`
3. The file exists in S3
4. CloudFront cache (may need to wait or invalidate)

### Issue: CORS errors

Ensure S3 bucket and CloudFront have CORS configured:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET`

## Generated Files Count

Expected output from `scripts/split-poets-json.js`:

- **Individual author files**: one per key in `poets.json`
- **Letter groups**: up to 27 — A-Z plus `#` for names starting with a digit or
  symbol
- **Manifest**: 1 file

For scale: the search index the app ships with
(`frontend/src/assets/Authors_sorted.ts`) carries 1,572 author names, so a full
run is on that order rather than the ~180 files an older version of this document
predicted.
