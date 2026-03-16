# Phase 4 — Documentation [DOC-ENGINEER]

## Phase Goal

Fix all documentation drift, broken links, stale references, and config drift identified in the doc-audit. After Phases 1-3 have changed the codebase, documentation must reflect the actual state. This phase also removes the debugging section from README since the debug utility was deleted in Phase 1.

**Success criteria:**
- All 7 drift findings resolved
- All 2 broken links fixed
- All 3 stale references corrected
- All 2 config drift items addressed
- Stale code examples updated
- Structure issues corrected
- No broken internal links in any doc file

**Estimated tokens:** ~8,000

## Prerequisites

- Phases 1-3 complete (codebase changes finalized)
- `npm run check` passing

---

## Tasks

### Task 1: Fix Root README — Directory Paths, Runtime Version, and Project Structure

**Goal:** The root `README.md` has multiple drift findings: references to `lambda/` instead of `backend/`, Node.js 18 instead of 22, incorrect project structure listing, and a broken link to `lambda/README.md`. Fix all of them in one pass.

**Files to Modify/Create:**
- `README.md` (root) — Fix all path and version references

**Prerequisites:** None

**Implementation Steps:**
- **Fix backend commands** (drift #1, stale code example #1-2): Change lines 72-78 from `cd lambda` to `cd backend`. Update both the `sam build && sam deploy` and `sam local start-api` commands.
- **Fix broken link** (broken link #1): Change line 80 from `[lambda/README.md](lambda/README.md)` to `[backend/README.md](backend/README.md)`.
- **Fix runtime version** (drift #3): Change line 26 from `Node.js 18` to `Node.js 22`.
- **Fix project structure** (drift #2): Update the project structure section (lines 86-109):
  - Change `src/` to `frontend/src/`
  - Add missing directories: `components/ui/`, `components/PoemDates/`, `components/SEOHead/`, `assets/`
  - Change `lambda/` to `backend/lambdas/`
  - Update Lambda subdirectory paths to `backend/lambdas/get-author/` etc.
  - Move `template.yaml` and `samconfig.toml` to `backend/` level
  - Add `backend/scripts/` directory
  - Remove reference to `backend/lambdas/shared/` if already added in Phase 2
- **Remove stale docs reference** (stale #2): Remove lines 107-108 that reference `docs/SAM_DEPLOYMENT.md` and `docs/plans/`. The `docs/` directory does not exist in the tracked repository (it's gitignored or only exists for plans).
- **Fix infrastructure reference** (line 125): Change `see lambda/ directory` to `see backend/ directory`.
- **Remove debugging section** (lines 130-166): The entire "Debugging > Transcript Debugging" section references `debug.ts` utilities that were deleted in Phase 1. Remove this section entirely.
- **Fix developer notes** (structure issue #1):
  - Line 118: Remove the "75%+ coverage" claim (unverified) or qualify it as "with coverage enforcement" (since Phase 3 added coverage thresholds).
  - Line 120: Remove "Accessibility compliance (WCAG AA)" claim or qualify as "Accessibility testing with vitest-axe".

**Verification Checklist:**
- [x] No `lambda/` references in README (should all be `backend/`)
- [x] Node.js version is 22
- [x] Project structure matches actual directory layout
- [x] Link to backend README resolves correctly
- [x] No reference to `docs/SAM_DEPLOYMENT.md`
- [x] No "Transcript Debugging" section
- [x] Developer claims are accurate or qualified

**Testing Instructions:**
- No code tests — documentation only
- Manually verify all internal links resolve to existing files

**Commit Message Template:**
```
docs(readme): fix directory paths, version, structure, and stale sections

- Replace lambda/ with backend/ throughout
- Update Node.js 18 to Node.js 22
- Fix project structure to match actual layout
- Fix broken link to backend/README.md
- Remove stale transcript debugging section (debug.ts deleted)
- Remove unverified claims
- Addresses doc-audit drifts #1-3, broken link #1, stale #1-2, structure #1
```

---

### Task 2: Fix Backend README — Directory Paths, Parameters, and Stale References

**Goal:** The `backend/README.md` has drift in Lambda paths, a phantom `AWSRegion` parameter, and references to a non-existent `package-all.sh` script.

**Files to Modify/Create:**
- `backend/README.md` — Fix path references, parameters, and stale content

**Prerequisites:** None

**Implementation Steps:**
- **Fix Lambda paths** (drift #4): Near lines 33, 40 — change `lambda/get-author/` to `backend/lambdas/get-author/` (and similarly for the other two Lambdas). Since this README lives inside `backend/`, relative paths like `lambdas/get-author/` are also acceptable.
- **Remove phantom AWSRegion parameter** (drift #5-6): Near lines 253-258, 129-136, 264-271 — remove all references to `AWS_REGION` as a template parameter. The `template.yaml` only defines `Environment` and `S3BucketName` parameters. `AWS_REGION` is a built-in Lambda env var set automatically by AWS. Also remove `AWSRegion=us-east-1` from any `parameter_overrides` examples.
- **Fix region** (drift #6): If there are references to `us-east-1` as the deployment region, verify against `samconfig.toml` which uses `us-west-2`. Update examples to use `us-west-2` or remove hardcoded regions.
- **Remove stale manual deployment section** (stale #3): Near lines 435-460 — remove or update the "Legacy Manual Deployment" section that references `package-all.sh` (which does not exist). The actual deploy script is at `backend/scripts/deploy.sh`. Either remove the legacy section entirely or update it to reference the correct script.
- **Fix broken link** (broken link #2): Near line 435 — remove the reference to `docs/SAM_DEPLOYMENT.md` (file does not exist).

**Verification Checklist:**
- [x] No `lambda/` path references (should be `lambdas/` or `backend/lambdas/`)
- [x] No `AWSRegion` parameter references
- [x] No `package-all.sh` references
- [x] No `docs/SAM_DEPLOYMENT.md` reference
- [x] Region references consistent with `samconfig.toml` (`us-west-2`)

**Testing Instructions:**
- No code tests — documentation only
- Verify `backend/template.yaml` parameters match what's documented

**Commit Message Template:**
```
docs(backend): fix paths, parameters, and stale deployment references

- Fix Lambda directory paths from lambda/ to lambdas/
- Remove phantom AWSRegion template parameter references
- Remove stale package-all.sh references
- Remove broken link to docs/SAM_DEPLOYMENT.md
- Addresses doc-audit drifts #4-6, stale #3, broken link #2
```

---

### Task 3: Fix E2E Test README — Base URL and Node Version

**Goal:** The E2E test README has incorrect base URL and misleading Node.js version requirement.

**Files to Modify/Create:**
- `tests/e2e/README.md` — Fix base URL and Node version

**Prerequisites:** None

**Implementation Steps:**
- **Fix base URL** (drift #7): Near line 265 — change `http://localhost:5173` to `http://localhost:3000` to match `playwright.config.ts:29`.
- **Fix Node.js version** (structure issue #2): Near line 16 — change `Node.js 16+` to `Node.js 22+`. The requirement of Node 16+ is misleading when the project requires Node 22.
- **Fix CI section** (stale code example #3): Near lines 275-298 — update the CI/CD section to reflect actual CI config: `node-version: '22'` and `@v4` actions. Remove the "Future" label since CI already exists.

**Verification Checklist:**
- [x] Base URL is `http://localhost:3000`
- [x] Node.js requirement is `22+`
- [x] CI section matches actual `.github/workflows/ci.yml`

**Testing Instructions:**
- No code tests — documentation only
- Cross-reference with `playwright.config.ts` and `.github/workflows/ci.yml`

**Commit Message Template:**
```
docs(e2e): fix base URL, Node version, and CI section

- Change baseURL from localhost:5173 to localhost:3000
- Update Node.js requirement from 16+ to 22+
- Update CI section to match actual workflow
- Addresses doc-audit drift #7, stale code example #3, structure issue #2
```

---

### Task 4: Fix .env.example — Remove Phantom Vars, Add Missing Var

**Goal:** `.env.example` lists `VITE_S3_BUCKET` and `VITE_AWS_REGION` which are not used anywhere in frontend code. It also omits `VITE_DEBUG` which is read in `debug.ts`. Since `debug.ts` was deleted in Phase 1, `VITE_DEBUG` is also no longer used. Clean up the file to list only the two variables actually consumed by the frontend.

**Files to Modify/Create:**
- `frontend/.env.example` — Remove unused variables

**Prerequisites:** Phase 1 complete (debug.ts deleted, so VITE_DEBUG is also unused)

**Implementation Steps:**
- Remove `VITE_S3_BUCKET=` and its comment — grep confirms no `import.meta.env.VITE_S3_BUCKET` exists in frontend source.
- Remove `VITE_AWS_REGION=` and its comment — grep confirms no `import.meta.env.VITE_AWS_REGION` exists in frontend source.
- Do NOT add `VITE_DEBUG` — the debug utility was deleted in Phase 1, so this variable is also unused.
- The resulting file should contain only:
  ```
  # API Configuration
  # Copy this file to .env and replace with your actual values

  # Base URL for API Gateway endpoints (Lambda functions)
  VITE_API_BASE_URL=

  # CloudFront CDN URL for static content (poems, authors)
  VITE_CDN_BASE_URL=
  ```

**Verification Checklist:**
- [x] No `VITE_S3_BUCKET` in `.env.example`
- [x] No `VITE_AWS_REGION` in `.env.example`
- [x] No `VITE_DEBUG` in `.env.example`
- [x] `VITE_API_BASE_URL` and `VITE_CDN_BASE_URL` remain
- [x] Both listed variables are actually used in `client.ts`

**Testing Instructions:**
- No code tests — config file cleanup
- Verify with grep that only `VITE_API_BASE_URL` and `VITE_CDN_BASE_URL` are used in `frontend/src/`

**Commit Message Template:**
```
docs(config): remove phantom env vars from .env.example

- Remove VITE_S3_BUCKET and VITE_AWS_REGION — not used in frontend code
- Keep only VITE_API_BASE_URL and VITE_CDN_BASE_URL
- Addresses doc-audit config drift #1-2
```

---

## Phase Verification

After completing all tasks in this phase:

1. Verify no broken internal links in any markdown file:
   - `README.md` link to `backend/README.md` resolves
   - No references to `lambda/` directory
   - No references to `docs/SAM_DEPLOYMENT.md`
   - No references to `package-all.sh`
2. Verify version consistency:
   - All Node.js references say 22 (or 22+)
   - No Node.js 18 or Node.js 16 references
3. Verify directory references match actual layout:
   - Backend is `backend/`, Lambdas are `backend/lambdas/`
   - Frontend source is `frontend/src/`
4. Verify `.env.example` lists only used variables
5. Run `npm run check` — still passes (no code changes in this phase)

**Known limitations:**
- The `backend/README.md` is extensive (~460 lines). This phase fixes identified drift but does not rewrite the entire document. Some sections may have minor inaccuracies not caught by the audit.
- The CHANGELOG is not updated in this phase. CHANGELOG entries should be added when changes are released, not during remediation.
