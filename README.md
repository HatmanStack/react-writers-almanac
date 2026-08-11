<div align="center">

![Writer's Alamanac Banner](frontend/public/og-image.jpg)

A modern React application delivering daily poems and historical narratives, featuring audio narration by Garrison Keillor and AI-generated transcripts.

**Live Demo**: [The Writer's Almanac](https://writer.hatstack.fun)

---

</div>

## Tech Stack

### Frontend

- **React 19** with TypeScript 5.9 (strict)
- **Vite 8** - Build tool
- **Zustand 5** - State management
- **TanStack Query 5** - Server state & caching
- **Material-UI 9** - Component library
- **Tailwind CSS 4** - Styling
- **react-router-dom 7** - Routing
- **DOMPurify 3** - HTML sanitization
- **Vitest 4** - Unit testing
- **Playwright** - E2E testing (chromium)

### Backend

- **AWS Lambda** - Serverless API (Node.js 22)
- **AWS SAM** - Infrastructure as Code
- **API Gateway** - REST API endpoints
- **S3** - Content storage
- **CloudFront** - CDN

---

## Features

- Daily poems and historical events
- Audio narration with AI transcripts
- Author biographies from Poetry Foundation
- Search with autocomplete
- Date navigation and calendar picker
- Responsive design
- Animated particle effects

---

## Getting Started

### Prerequisites

- **Node.js 22+** — the version is pinned in [`.nvmrc`](.nvmrc) and enforced by
  `engines` in `package.json`. With nvm: `nvm use`.
- npm (bundled with Node)

### Install

This is an npm workspace with a single lockfile at the repository root, so one
`npm ci` installs the root and `frontend/` together:

```bash
npm ci
```

The Lambda sources need a **second, separate install**, which CI also runs:

```bash
cd backend/lambdas && npm ci
```

That step is separate because `backend/lambdas` is not itself a workspace
member. The `workspaces` glob in `package.json` is `backend/lambdas/*`, which
matches the four child directories (`get-author/`, `get-authors-by-letter/`,
`search-autocomplete/`, `shared/`) — not the `backend/lambdas` directory that
holds their shared `package.json` and lockfile. Only run it if you are working
on the backend; the frontend and the whole test suite do not need it.

These are exactly the two install commands `.github/workflows/ci.yml` runs.

### Environment Configuration

**Do this before your first `npm run dev`.** The app reads exactly two
environment variables, both documented in
[`frontend/.env.example`](frontend/.env.example):

```bash
cp frontend/.env.example frontend/.env
```

| Variable            | What it points at                                        | Fallback when unset (`frontend/src/api/client.ts:21-24`)                              |
| ------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `VITE_CDN_BASE_URL` | CloudFront distribution serving poems, authors and audio | `https://d3vq6af2mo7fcy.cloudfront.net` — a **real**, working distribution            |
| `VITE_API_BASE_URL` | API Gateway stage fronting the Lambda functions          | `https://placeholder-api-gateway.amazonaws.com/prod` — a host that **does not exist** |

The asymmetry between those two fallbacks is worth understanding before you
debug something confusing. On a fresh clone with no `.env`, poems, author pages
and audio all load, because the CDN fallback is a live distribution. Anything
routed through API Gateway resolves to a placeholder hostname and fails. **The
app therefore looks like it works.**

At present no rendered component calls the API path — `apiClient` is reached
only by `frontend/src/hooks/queries/useSearchQuery.ts`, which nothing but its
own test imports, and search runs entirely client-side against a bundled index.
So today the missing variable fails a path that is already unused. That is a
description of the current state, not a reason to leave it unset: the moment
anything wires the API tier up, an unset `VITE_API_BASE_URL` becomes a silent
failure against a hostname that will never resolve. Whether that tier is
revived or retired is an open question — see
[`backend/README.md`](backend/README.md) and
[`scripts/s3-structure.md`](scripts/s3-structure.md).

### Run

```bash
npm run dev      # dev server on http://localhost:3000
npm run build    # typecheck + production build to frontend/build
npm run preview  # serve the production build
```

---

## Quality Commands

Every command below is run from the repository root.

| Command                 | What it does                                                                   |
| ----------------------- | ------------------------------------------------------------------------------ |
| `npm run lint`          | ESLint over `frontend/src`, `tests/e2e` and `scripts`, with `--max-warnings 0` |
| `npm run typecheck`     | `tsc --noEmit` over the frontend and the E2E project                           |
| `npm test`              | Vitest, full unit suite, no coverage — the fast local loop                     |
| `npm run test:coverage` | Vitest with coverage, and **fails below the thresholds** in `vitest.config.ts` |
| `npm run format`        | Prettier `--write` over the repo                                               |
| `npm run format:check`  | Prettier `--check` over the repo — the CI formatting gate                      |
| `npm run check`         | `lint` → `typecheck` → `test`, in that order                                   |
| `npm run test:e2e`      | Playwright, which starts its own dev server (see `tests/e2e/README.md`)        |
| `npm run docs:lint`     | markdownlint over the documentation — config in `.markdownlint-cli2.jsonc`     |
| `npm run docs:api`      | typedoc — regenerates the API reference described below                        |

**Coverage is enforced, not merely collected.** `npm run test:coverage` gates at
78% statements / 66% branches / 80% functions / 78% lines, configured in
`vitest.config.ts`. The measured figures sit above them at 83.64 / 71.11 /
85.08 / 83.93. The margin is deliberately about five points rather than two:
the v8 provider only reports files that some test actually loaded, so adding a
test that merely imports a currently-unloaded module can move the numbers by
2-3 points with no change in test quality at all. The reasoning is recorded in
a comment in `vitest.config.ts`.

**A pre-commit hook runs on your first commit.** [lefthook](https://lefthook.dev)
is installed by `npm ci` via the `postinstall` script and provisions
`.git/hooks/`. On every commit it runs `lint` and `typecheck` in parallel — the
same commands as above, so nothing can drift between the hook and CI. Measured
wall time is about 4 seconds on a fast machine and about 9 on a slower one, so
budget up to ten. Bypass it with `git commit --no-verify` if you need to, but CI
runs the same checks.

Playwright needs its browser once before `npm run test:e2e` will run:

```bash
npx playwright install --with-deps chromium
```

### The generated API reference

```bash
npm run docs:api      # writes docs/api/, then open docs/api/index.html
```

typedoc renders the JSDoc from three modules — `frontend/src/api/endpoints.ts`,
`frontend/src/utils/routes.ts` and `frontend/src/utils/dateMapping.ts` — into a
browsable reference. Those three were chosen because each is a single source of
truth whose comments state invariants rather than restating the signature; the
entry set and the reasoning are in `typedoc.json`. Every CDN and API path
builder appears there with its `@example`, so the exact S3 key shapes are read
off the code rather than off prose.

**The output is deliberately not committed.** Generated HTML would need
regenerating on every source change and would be stale within a week, which is
the drift this reference exists to remove. `docs/api/` is gitignored; CI runs
`npm run docs:api` so a malformed doc comment fails the build. Regenerate
locally whenever you want to read it — it takes a few seconds.

---

## Backend Development

The backend deploys through AWS SAM. The scripted entrypoint is:

```bash
npm run deploy
```

It prompts for region, stack name, environment and data bucket, generates
`backend/samconfig.toml`, builds and deploys the stack, and writes the resulting
API URL into `frontend/.env`.

For local invocation and the full deployment reference, see
[`backend/README.md`](backend/README.md).

---

## Project Structure

```text
frontend/src/
├── api/              # CDN + API Gateway clients, endpoint builders, query client
├── assets/           # Images and the bundled author/poem search index
├── components/       # React components
│   ├── Audio/        # Player and transcript
│   ├── Author/       # Author biography page body
│   ├── ErrorBoundary/
│   ├── Note/
│   ├── Particles/
│   ├── PoemDates/    # Poem-by-title page body
│   ├── Search/       # Search bar and calendar picker
│   ├── SEOHead/      # SEO meta components
│   └── ui/           # Reusable UI primitives
├── hooks/            # Custom React hooks
│   └── queries/      # TanStack Query hooks
├── routes/           # Route components and the shared layout
├── store/            # Zustand state management
├── test/             # Vitest setup
├── types/            # TypeScript definitions
└── utils/            # Date mapping, routes, sanitization, search index

backend/
├── events/           # Sample events for `sam local invoke`
├── lambdas/
│   ├── get-author/             # Lambda: fetch author data
│   ├── get-authors-by-letter/  # Lambda: authors by letter
│   ├── search-autocomplete/    # Lambda: search API
│   └── shared/                 # Shared Lambda utilities
├── scripts/          # deploy.sh — the `npm run deploy` entrypoint
├── template.yaml     # SAM infrastructure definition
└── samconfig.toml    # SAM deployment configuration (generated by deploy.sh)

scripts/              # One-off data tooling and the S3 layout reference
tests/
└── e2e/              # Playwright E2E tests
docs/
└── plans/            # Historical audit working sets — see docs/README.md
```

---

## Notes for Developers

This codebase demonstrates:

- Modern React patterns (hooks, lazy loading, memoization)
- Type-safe development with strict TypeScript (zero `any` types)
- Testing with enforced coverage thresholds (see Quality Commands above)
- Code splitting — route bodies and the particle background load through
  `React.lazy` + dynamic `import()` (`routes/AuthorView.tsx`,
  `routes/PoemTitleView.tsx`, `routes/AppLayout.tsx`)
- Accessibility testing with vitest-axe
- Security best practices (DOMPurify sanitization)

The application uses AWS infrastructure:

- **S3**: Stores daily poems, author data, and audio files (not managed by this repo).
  The key layout is documented in [`scripts/s3-structure.md`](scripts/s3-structure.md).
- **Lambda + API Gateway**: Managed via AWS SAM (see `backend/` directory)
- **CloudFront**: CDN for content delivery (not managed by this repo)

---

## Releases

**`CHANGELOG.md` is what cuts a release.** This is not obvious from anywhere else
in the repository, so it is worth stating plainly.

`.github/workflows/release.yml` triggers on any push to `main` whose diff touches
`CHANGELOG.md`. It reads the **first** `## [x.y.z]` heading in the file, and if no
tag `vx.y.z` exists yet it creates one, pushes it, and publishes a GitHub release
with that section as the notes. Nothing else in the repository publishes anything.

To cut a release: add a semver `## [x.y.z]` heading at the top of `CHANGELOG.md`
and merge to `main`.

Two deliberate refusals:

- **`## [Unreleased]` is ignored.** The version pattern requires digits, so an
  `[Unreleased]` heading falls through to the skip branch. That is why entries can
  accumulate under it without publishing anything.
- **Prereleases are ignored too.** `## [1.4.0-rc.1]` does not match either, so
  cutting a prerelease stays a manual act. This workflow holds `contents: write`,
  and skipping is the safe direction for an automation that does.

If the tag for the top version already exists, the workflow skips — so re-touching
`CHANGELOG.md` without adding a new heading is harmless.

---

## Contributing

[`CONTRIBUTING.md`](CONTRIBUTING.md) covers setup, the local loop, how to run the
whole CI gate on your machine, the pre-commit hook, and the commit convention —
with two commits from this repository's own history as the worked examples.

---

## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](LICENSE) for the
full text.
