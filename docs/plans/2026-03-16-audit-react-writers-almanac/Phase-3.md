# Phase 3 — Guardrails [FORTIFIER]

## Phase Goal

Add automated guardrails to prevent regression: enable stricter lint rules, re-introduce pre-commit hooks (removed in commit `18e1375`), add coverage reporting to CI, and resolve skipped tests. These are additive changes that lock in the improvements made in Phases 1-2.

**Success criteria:**
- `eqeqeq` lint rule enabled and enforced
- `@typescript-eslint/no-explicit-any` elevated from `warn` to `error`
- Pre-commit hooks re-introduced (using lefthook or husky) running lint and typecheck
- Coverage reporting added to CI with threshold enforcement
- Skipped tests in `Audio.test.tsx` resolved or removed with justification
- All tests pass, build succeeds

**Estimated tokens:** ~10,000

## Prerequisites

- Phase 2 complete (structural fixes done)
- `npm run check` passing

---

## Tasks

### Task 1: Enable Stricter ESLint Rules

**Goal:** Enable the `eqeqeq` rule to prevent loose equality operators from returning, and elevate `@typescript-eslint/no-explicit-any` from `warn` to `error` to enforce the existing zero-`any` discipline.

**Files to Modify/Create:**
- `frontend/.eslintrc.cjs` — Add/modify rules

**Prerequisites:** Phase 1 Task 3 complete (loose equality already fixed in Poem.tsx)

**Implementation Steps:**
- In `frontend/.eslintrc.cjs`, add to the `rules` object:
  ```js
  'eqeqeq': ['error', 'always'],
  ```
- Change the existing `@typescript-eslint/no-explicit-any` rule from `'warn'` to `'error'`.
- Run `cd frontend && npm run lint` to verify no new violations. If any violations appear, fix them in this same task (they should be minimal since Phase 1 already fixed the known `==` usage and the codebase has zero `any` types).

**Verification Checklist:**
- [x] `eqeqeq` rule set to `['error', 'always']` in `.eslintrc.cjs`
- [x] `@typescript-eslint/no-explicit-any` set to `'error'`
- [x] `cd frontend && npm run lint -- --max-warnings 0` passes
- [x] `npm run check` passes

**Testing Instructions:**
- No new tests — this is a lint config change
- Run `npm run check` to verify

**Commit Message Template:**
```
style(frontend): enable eqeqeq and strict no-explicit-any lint rules

- Add eqeqeq rule to prevent loose equality operators
- Elevate no-explicit-any from warn to error
- Addresses health-audit quick-win #2, eval code quality target
```

---

### Task 2: Re-introduce Pre-commit Hooks

**Goal:** Pre-commit hooks were explicitly removed (commit `18e1375`). Re-introduce them using `lefthook` (lightweight, zero-dependency alternative to husky) to run lint and typecheck before commits.

**Files to Modify/Create:**
- `package.json` (root) — Add lefthook devDependency and postinstall script
- `lefthook.yml` (root) — Create hook configuration

**Prerequisites:** None

**Implementation Steps:**
- Install `lefthook` as a root devDependency: add `"lefthook": "^1.11.0"` (or latest) to `devDependencies` in root `package.json`.
- Add a `"postinstall"` script to root `package.json`: `"postinstall": "lefthook install"`. This auto-installs hooks after `npm ci`.
- Create `lefthook.yml` at the repository root:
  ```yaml
  pre-commit:
    parallel: true
    commands:
      lint:
        run: cd frontend && npm run lint -- --max-warnings 0
      typecheck:
        run: cd frontend && npm run typecheck
  ```
- Run `npm install` to trigger the postinstall hook installation.
- Verify the hook works by making a test commit (or running `npx lefthook run pre-commit`).

**Verification Checklist:**
- [x] `lefthook` in root `package.json` devDependencies
- [x] `postinstall` script calls `lefthook install`
- [x] `lefthook.yml` exists at root with lint and typecheck commands
- [x] `npx lefthook run pre-commit` succeeds
- [x] `npm run check` passes

**Testing Instructions:**
- Run `npx lefthook run pre-commit` to simulate a commit
- Verify it runs lint and typecheck successfully

**Commit Message Template:**
```
ci(hooks): re-introduce pre-commit hooks with lefthook

- Add lefthook for pre-commit lint and typecheck
- Auto-installs via postinstall script
- Addresses eval reproducibility concern, Day 2 red flag
```

---

### Task 3: Add Coverage Reporting to CI

**Goal:** Add test coverage reporting to the CI pipeline. Configure a coverage threshold to prevent coverage regression.

**Files to Modify/Create:**
- `.github/workflows/ci.yml` — Add coverage flag to test command
- `vitest.config.ts` (root) — Add coverage configuration with thresholds

**Prerequisites:** None

**Implementation Steps:**
- **Dependency note:** Phase 2 Task 1 expanded `vitest.config.ts` to include backend test files (`backend/lambdas/**`) and added `environmentMatchGlobs` for the `node` environment. The coverage configuration below builds on that already-modified `vitest.config.ts`.
- Open the root `vitest.config.ts` and add coverage configuration. The `exclude` list must account for both frontend and backend source that should not be measured:
  ```ts
  coverage: {
    provider: 'v8',
    reporter: ['text', 'text-summary'],
    exclude: [
      '**/node_modules/**',
      '**/test/**',
      '**/*.test.*',
      '**/dist/**',
      'backend/lambdas/shared/utils.test.js',
    ],
    thresholds: {
      statements: 50,
      branches: 50,
      functions: 50,
      lines: 50,
    },
  },
  ```
  Note: Set thresholds conservatively at 50% to start. These can be ratcheted up over time. The exact current coverage is unknown — if tests fail at 50%, lower the threshold to match current coverage minus 2%. Since backend Lambda tests now run in the same vitest invocation (per Phase 2 Task 1), the coverage report will include backend source files. The thresholds apply globally across both frontend and backend. If backend code significantly lowers overall coverage, consider setting per-directory thresholds or adjusting the global threshold accordingly.
- In `.github/workflows/ci.yml`, modify the test command in the `test-frontend` job to include coverage. Since vitest now runs both frontend and backend tests (per Phase 2 Task 1 changes), this single CI step covers both:
  ```yaml
  - name: Run tests
    run: npm test -- --reporter=verbose --coverage
  ```
- The `@vitest/coverage-v8` package is already in root devDependencies, so no new dependency is needed.

**Verification Checklist:**
- [x] `vitest.config.ts` has coverage configuration with thresholds
- [x] CI test step includes `--coverage` flag
- [x] `npm test -- --coverage` passes locally
- [x] Coverage thresholds are met
- [x] `npm run check` passes

**Testing Instructions:**
- Run `npm test -- --coverage` locally and verify coverage report is generated
- Verify thresholds are met (adjust if needed)

**Commit Message Template:**
```
ci(testing): add coverage reporting with threshold enforcement

- Add V8 coverage provider configuration to vitest
- Set initial coverage thresholds at 50%
- Add --coverage flag to CI test step
- Addresses eval Day 2 reproducibility target
```

---

### Task 4: Resolve Skipped Tests in Audio.test.tsx

**Goal:** `Audio.test.tsx` has two `it.skip` tests (near lines 206 and 219) with no tracking issue. Either fix and unskip them, or remove them with a comment explaining why.

**Files to Modify/Create:**
- `frontend/src/components/Audio/Audio.test.tsx` — Fix or remove skipped tests

**Prerequisites:** None

**Implementation Steps:**
- Open `Audio.test.tsx` and find the two `it.skip` tests.
- Read the test descriptions and try to understand why they were skipped.
- Attempt to unskip and run them (`npm test`):
  - If they pass, simply remove the `.skip`.
  - If they fail due to a fixable issue (missing mock, outdated assertion), fix the test.
  - If they fail due to a fundamental issue (testing browser audio APIs that can't work in jsdom), remove the tests and add a comment: `// Removed: [test description] - requires browser audio API not available in jsdom`
- Do NOT spend more than 30 minutes trying to fix failing tests. If they require significant work, remove them with a clear comment.

**Verification Checklist:**
- [ ] No `it.skip` in `Audio.test.tsx`
- [ ] All remaining tests pass
- [ ] If tests were removed, a comment explains why
- [ ] `npm run check` passes

**Testing Instructions:**
- Run `npm test` to verify all tests pass
- Run `npm test -- --reporter=verbose` to see individual test results

**Commit Message Template:**
```
fix(tests): resolve skipped tests in Audio.test.tsx

- [Unskip/Remove] accessibility tests that were skipped without tracking issue
- [Details of what was done]
- Addresses eval Day 2 red flag on skipped tests
```

---

## Phase Verification

After completing all tasks in this phase:

1. Run `npm run check` — all linting (with stricter rules), typechecking, and tests must pass
2. Run `npm run build` — build must succeed
3. Run `npm test -- --coverage` — coverage thresholds met
4. Run `npx lefthook run pre-commit` — pre-commit hooks work
5. Verify no `it.skip` in test files
6. Verify `eqeqeq` rule is active: temporarily add `x == 1` to a file, run lint, confirm it fails, then revert

**Known limitations:**
- Coverage thresholds are set conservatively. They should be ratcheted up as more tests are added in future work.
- Pre-commit hooks run the full lint + typecheck suite, which may be slow on large changes. If this becomes a problem, consider switching to `lint-staged` for incremental linting in a future iteration.
- CSS class assertion tests in `Poem.test.tsx` are not addressed in this phase. Removing/refactoring them requires understanding which assertions are valuable vs. brittle, which is subjective. This is noted as tech debt.
