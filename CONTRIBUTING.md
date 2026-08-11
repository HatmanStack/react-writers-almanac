# Contributing

Everything below was run before it was written down. If a command here does not
work, that is a bug in this file — please say so.

## Setup

**Node 22.** The version is pinned in [`.nvmrc`](.nvmrc) and enforced by `engines`
in `package.json`. With nvm: `nvm use`.

```bash
npm ci
```

That one command installs the root and `frontend/` together — they are npm
workspaces sharing a single lockfile at the repository root.

**The Lambda sources need a second install:**

```bash
cd backend/lambdas && npm ci
```

`backend/lambdas` is not a workspace member. The `workspaces` glob in
`package.json` is `backend/lambdas/*`, which matches the four handler directories
(`get-author/`, `get-authors-by-letter/`, `search-autocomplete/`, `shared/`) and
not the `backend/lambdas` directory that holds their shared `package.json` and
lockfile. Skip this unless you are working on the backend — CI runs it only in the
`validate-sam` job.

**Environment variables.** Copy the example and read the table in
[`README.md`](README.md#environment-configuration) before your first run:

```bash
cp frontend/.env.example frontend/.env
```

The short version: with no `.env` the CDN falls back to a real distribution and
the API falls back to a hostname that does not exist, so poems load and anything
API-backed silently fails. Knowing that in advance saves an hour.

**Playwright's browser**, once, before running E2E tests:

```bash
npx playwright install --with-deps chromium
```

## The local loop

```bash
npm run dev     # dev server on http://localhost:3000
npm test        # the unit suite, no coverage — fast
npm run check   # lint, then typecheck, then the unit suite
```

`npm run test:e2e` starts its own dev server, so stop `npm run dev` first or it
will collide on port 3000. `npm run test:e2e:ui` gives the interactive runner and
`npm run test:e2e:report` opens the last HTML report.

## Running the whole CI gate locally

CI is `.github/workflows/ci.yml`. A `changes` job computes two path filters and
three jobs run off them; `format` and `docs` deliberately run unconditionally,
and `status-check` requires all five to pass or skip.

| Job            | Runs when                          | Commands, in order                                                                                                                          |
| -------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `check`        | the `frontend` filter matches      | `npm ci` → `npm audit --omit=dev --audit-level=moderate` → `npm run lint` → `npm run typecheck` → `npm run test:coverage` → `npm run build` |
| `format`       | **always** — no filter, no `needs` | `npm ci` → `npm run format:check`                                                                                                           |
| `docs`         | **always** — no filter, no `needs` | `npm ci` → `npm run docs:lint` → lychee `--offline` → `npm run docs:api`                                                                    |
| `e2e`          | the `frontend` filter matches      | `npm ci` → `npx playwright install --with-deps chromium` → `npm run test:e2e`                                                               |
| `validate-sam` | the `backend` filter matches       | `cd backend/lambdas && npm ci` → `pip install aws-sam-cli` → `cd backend && sam validate --region us-west-2`                                |

`format` and `docs` have no filter for the same reason: both run repo-wide
commands, and pairing one of those with a subtree trigger leaves files inside a
gate that no job can fire. That is also why the workflow's `paths-ignore` no
longer lists `*.md` or `docs/**` — it would have meant a documentation-only
change ran nothing at all. What remains ignored is `docs/plans/**` (audit
records, excluded from both gates by config) and `.claude/**`.

So the whole frontend gate, in one line:

```bash
npm audit --omit=dev --audit-level=moderate && npm run lint && npm run typecheck \
  && npm run test:coverage && npm run build && npm run format:check && npm run test:e2e \
  && npm run docs:lint && npm run docs:api
```

Three of these deserve a note:

- **`npm run test:coverage` is a gate, not a report.** It fails below
  78% statements / 66% branches / 80% functions / 78% lines, set in
  `vitest.config.ts`. Coverage here is load-dependent as well as
  quality-dependent — the v8 provider only counts files some test loaded — so a
  new test that merely imports a previously-unloaded module can move the numbers
  a couple of points on its own. The comment in `vitest.config.ts` has the
  measurements.
- **`npm run format:check` is repo-wide** and runs in a job nothing can filter
  out, so a change to a workflow file or `backend/README.md` is checked even
  though it does not touch `frontend/`. Run `npm run format` to fix.
- **Link checking is split across two workflows, on purpose.** The `docs` job
  runs lychee with `--offline`, so it checks relative file links and heading
  fragments — the ones that fail deterministically and that documentation drift
  actually breaks. External URLs are checked weekly by
  `.github/workflows/link-check.yml`, which is not a merge gate: it depends on
  third-party uptime, and a PR that goes red because someone else's docs site is
  rate-limiting is how a link checker gets disabled. Run it on demand from the
  Actions tab (`workflow_dispatch`). URLs that cannot be fetched without
  credentials are listed with their reasons in `.lycheeignore`. Both passes take
  `'**/*.md'` **plus `.github/PULL_REQUEST_TEMPLATE.md` by name**: lychee skips
  hidden paths and `.github/` is one, and `--hidden` would sweep
  `.claude/worktrees/` into a local run but not into CI — the locally-red,
  CI-green split these gates exist to avoid. Naming the one file keeps lychee's
  input set equal to markdownlint's eight.

## Three CI surfaces have never actually executed on GitHub Actions

Two remediation pipelines added jobs to this repository and both were constrained
to committing only — no push, so nothing they wrote has ever run on a runner. All
three are green locally, which is not the same thing. What is unverified is the
**runner path**, and that is different for each:

| Surface          | Gates a merge?                                               | What has never run                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `e2e` job        | yes, when the `frontend` filter matches — otherwise it skips | `npx playwright install --with-deps chromium` on a clean image, the `setup-node` npm cache, the artifact upload path, Vite's cold start inside the webServer timeout           |
| `docs` job       | **yes, always** — it has no filter                           | the `lycheeverse/lychee-action` step's runner path: binary download, job summary write, `GITHUB_TOKEN` rate-limit handling. `docs:lint` and `docs:api` run identically locally |
| `link-check.yml` | no — `schedule` + `workflow_dispatch` only                   | the whole workflow. It has never been dispatched, and `schedule` only fires on the default branch                                                                              |

`status-check` aggregates the two jobs, so a red `e2e` or `docs` blocks the merge;
a skipped one counts as a pass. The `docs` job is the one to watch hardest,
because nothing can filter it out — every pull request depends on it.

**If you are the first person to see any of these run, watch it go both green and
red before trusting it.** A job that has only ever been seen green is not a proven
gate; make it fail on purpose once, and confirm the failure reaches
`status-check`.

For `link-check.yml`, run it from the Actions tab (`workflow_dispatch`) before
relying on the weekly schedule. The link set itself has been verified against the
live network with the same lychee version the action pins — it is the action's
runner path, not the links, that is untested.

## The pre-commit hook

[lefthook](https://lefthook.dev) is installed by `npm ci` through the
`postinstall` script and provisions `.git/hooks/`. On commit it runs `lint` and
`typecheck` in parallel — the same scripts CI runs, so the two cannot drift.

**Measured wall time: about 4 seconds** on a fast machine, about 9 on a slower
one. It is skipped entirely when nothing relevant is staged. `git commit
--no-verify` bypasses it; CI will run the same checks anyway.

If hooks are not firing, `npm ci` re-provisions them. There is no `.husky/`
directory — hook installation was moved to lefthook's default `.git/hooks/`
location, and `core.hooksPath` should be unset.

## Commits

Conventional commits: `type(scope): imperative summary`.

Types in use: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `ci`, `build`,
`perf`, `style`. Scopes in use: `frontend`, `backend`, `e2e`, `ci`, `deps`,
`docs`, `repo`.

**The body is the part that matters here, and this repository is unusually good at
it.** Rather than describe a house style in the abstract, read two:

- **`3979ed8`** — `fix(frontend): reject impossible calendar dates at the source`.
  Opens with what was wrong and why it was worse than the obvious alternative
  ("callers read `''` as no date but treat anything non-empty as usable"), states
  what was _already_ protected so the reader knows the blast radius, and explains
  why the fix went in the formatter rather than at each call site.
- **`1f8407b`** — a merge commit that reconciles two branches, going file by file
  through what was kept, what was deleted, and why. `git show 1f8407b` is worth
  reading before writing your first non-trivial commit message here.

The pattern in both: say what changed and _why a reviewer should believe it is
right_, not what the diff already shows.

## Pull requests

[`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md) asks four
things: what changed, why, how you verified it, and what it closes. "How you
verified it" is the one people skip and the one reviewers want — name the command
you ran and what it printed.

## Releases

A release is cut by adding a semver `## [x.y.z]` heading to the top of
`CHANGELOG.md` and merging to `main`. Add entries under `## [Unreleased]` instead
unless you intend to publish — see the
[Releases section of `README.md`](README.md#releases) for what the workflow does
and what it deliberately refuses to do.

## Two things this repository will not decide for you

Both are recorded rather than fixed, and a PR that resolves either should say
which way it went and why:

- **The backend's disposition.** The three Lambdas read S3 keys without the
  `public/` prefix the bucket actually uses, and `useSearchQuery` — the only
  consumer of the API client — is imported by nothing but its own test. Fixing
  the prefix and reviving the tier, or deleting `backend/`, are both live options.
  See the Known discrepancies section of
  [`scripts/s3-structure.md`](scripts/s3-structure.md).
- **Cross-region infrastructure.** The stack deploys to `us-west-2`; the data
  bucket is in `us-west-1`. See the Region section of
  [`backend/README.md`](backend/README.md).

Known open issues on the frontend side, both deferred design decisions rather than
defects with an obvious fix:

- The dated-poem page has no error state. With the poem JSON 404ing it renders the
  header and nothing else — no message, no retry — unlike the author and
  poem-title pages, which both render an error and a working Retry button.
- The prev/next arrows measure 22×22 on a 375px viewport, below WCAG 2.2
  SC 2.5.8's 24×24 AA minimum. Enlarging them changes the audio row's layout.

Both have a `test.fixme` in `tests/e2e/` carrying the real assertion, so whatever
fix lands can be verified by removing the `fixme`.
