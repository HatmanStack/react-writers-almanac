# S3 Directory Structure

## Overview

This document describes the S3 directory structure for The Writer's Almanac data files.

## Directory Layout

```
s3://bucket-name/
├── public/                          # Daily poems and audio
│   ├── 20090111.json               # Daily poem (YYYYMMDD format)
│   ├── 20090111.mp3                # Audio file (dates after 2009-01-11)
│   ├── 20240101.json
│   ├── 20240101.mp3
│   └── ...
│
└── authors/                         # Author data (split from poets.json)
    ├── by-name/                     # Individual author files
    │   ├── a-a-milne.json
    │   ├── billy-collins.json
    │   ├── mary-oliver.json
    │   └── ...
    │
    └── by-letter/                   # Authors grouped by first letter
        ├── A.json                   # All authors starting with A
        ├── B.json                   # All authors starting with B
        ├── C.json
        └── ...
```

## File Formats

### Daily Poem Files (`public/{YYYYMMDD}.json`)

Structure:
```json
{
  "dayofweek": "Monday",
  "date": "January 1, 2024",
  "transcript": "Full transcript...",
  "poemtitle": ["Poem Title"],
  "poembyline": "Subtitle",
  "author": ["Author Name"],
  "poem": ["Line 1", "Line 2", ...],
  "notes": ["Note 1", "Note 2", ...]
}
```

### Individual Author Files (`authors/by-name/{slug}.json`)

Slug format: lowercase with hyphens (e.g., `billy-collins`, `a-a-milne`)

Structure:
```json
{
  "poets.org": { ... },
  "poetry foundation": {
    "poet_meta_data": {
      "lifetime": "1882–1956",
      "website": "..."
    },
    "biography": "...",
    "photo": "...",
    "poems": "...",
    "source": "Poetry Foundation",
    "url": "https://..."
  },
  "all poetry": { ... },
  "wikipedia": { ... }
}
```

### Letter-Grouped Files (`authors/by-letter/{A-Z}.json`)

Structure:
```json
{
  "letter": "A",
  "authors": [
    "A. A. Milne",
    "Anna Akhmatova",
    "Anne Sexton",
    ...
  ]
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

### Upload Individual Author Files

```bash
aws s3 sync ./output/authors/by-name/ s3://YOUR-BUCKET/authors/by-name/ \
  --cache-control "public, max-age=31536000" \
  --content-type "application/json"
```

### Upload Letter-Grouped Files

```bash
aws s3 sync ./output/authors/by-letter/ s3://YOUR-BUCKET/authors/by-letter/ \
  --cache-control "public, max-age=31536000" \
  --content-type "application/json"
```

### Upload All Author Files at Once

```bash
aws s3 sync ./output/authors/ s3://YOUR-BUCKET/authors/ \
  --cache-control "public, max-age=31536000" \
  --content-type "application/json"
```

## CloudFront Access

Files are accessed via CloudFront CDN:

```
Base URL: https://d3vq6af2mo7fcy.cloudfront.net

Examples:
- Daily poem: https://d3vq6af2mo7fcy.cloudfront.net/public/20240101.json
- Audio file:  https://d3vq6af2mo7fcy.cloudfront.net/public/20240101.mp3
- Author:      https://d3vq6af2mo7fcy.cloudfront.net/authors/by-name/billy-collins.json
- Letter:      https://d3vq6af2mo7fcy.cloudfront.net/authors/by-letter/B.json
```

## File Naming Conventions

### Slugification Rules

Author names are converted to slugs:

1. Convert to lowercase
2. Remove special characters (keep letters, numbers, spaces, hyphens)
3. Replace spaces with hyphens
4. Replace multiple hyphens with single hyphen
5. Trim leading/trailing hyphens

Examples:
- `"Billy Collins"` → `"billy-collins"`
- `"A. A. Milne"` → `"a-a-milne"`
- `"e.e. cummings"` → `"ee-cummings"`
- `"Hafiz of Shiraz"` → `"hafiz-of-shiraz"`

### Date Format

Daily poems use YYYYMMDD format:
- `20240101` = January 1, 2024
- `20091231` = December 31, 2009

## Manifest File

The `manifest.json` file (not uploaded to S3) provides metadata:

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
    },
    ...
  ],
  "letterFiles": [
    "authors/by-letter/A.json",
    "authors/by-letter/B.json",
    ...
  ]
}
```

## Validation

All JSON files are validated during generation:

1. **Syntax**: Valid JSON structure
2. **Parse test**: JSON.parse() succeeds
3. **Content**: Data matches expected structure

## Troubleshooting

### Issue: Author not found

Check:
1. Author name spelling
2. Slug conversion (use `scripts/split-poets-json.js` to see mapping)
3. S3 file exists: `aws s3 ls s3://bucket/authors/by-name/`

### Issue: 404 on CloudFront

Check:
1. File exists in S3
2. CloudFront cache (may need to wait or invalidate)
3. URL path is correct

### Issue: CORS errors

Ensure S3 bucket and CloudFront have CORS configured:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET`

## Generated Files Count

Expected output from script:
- **Individual author files**: ~150+ files
- **Letter groups**: 26 files (A-Z) + possibly # for special characters
- **Manifest**: 1 file

Total: ~180 files
