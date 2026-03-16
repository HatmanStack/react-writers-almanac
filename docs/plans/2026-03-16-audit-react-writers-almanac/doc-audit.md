---
type: doc-health
doc_scope: All docs, no constraints
language_stack: JS/TS and Python
drift_prevention: None — just fix existing docs
---

## DOCUMENTATION AUDIT

### SUMMARY
- Docs scanned: 5 files (README.md, backend/README.md, CHANGELOG.md, scripts/s3-structure.md, tests/e2e/README.md)
- Code modules scanned: 3 Lambda functions, ~50 frontend source files, 5 E2E test suites, 2 CI workflows
- Total findings: 7 drift, 2 gaps, 3 stale, 2 broken links, 2 config drift, 1 structure issue

---

### DRIFT (doc exists, doesn't match code)

1. **`README.md:73-74`** → `backend/`
   - Doc says: `cd lambda` then `sam build && sam deploy`
   - Code says: The backend directory is `backend/`, not `lambda/`. Correct command would be `cd backend`.

2. **`README.md:86-109`** → `frontend/src/`, `backend/lambdas/`
   - Doc says: `src/` contains api, components, hooks, store, types, utils
   - Reality: The frontend source lives at `frontend/src/`, not `src/`. Additional directories not listed: `components/ui/`, `components/PoemDates/`, `components/SEOHead/`, `assets/`.
   - Doc says: `lambda/` contains get-author, get-authors-by-letter, search-autocomplete, template.yaml, samconfig.toml, events
   - Reality: This directory is `backend/`, Lambda code is under `backend/lambdas/`. Also missing `backend/scripts/deploy.sh`.

3. **`README.md:26`** → `backend/template.yaml:31`
   - Doc says: AWS Lambda - Serverless API (Node.js 18)
   - Code says: `nodejs22.x`. The CHANGELOG v1.1.0 explicitly notes "Upgrade Lambda runtime from Node.js 18.x to 22.x".

4. **`backend/README.md:33,40`** → `backend/lambdas/`
   - Doc says: Path: `lambda/get-author/`, `lambda/get-authors-by-letter/`, `lambda/search-autocomplete/`
   - Reality: Lambdas live at `backend/lambdas/get-author/`, etc.

5. **`backend/README.md:253-258`** → `backend/template.yaml`
   - Doc says: `AWS_REGION`: AWS region (from parameter)
   - Reality: No `AWSRegion` parameter in `backend/template.yaml`. The template only defines `Environment` and `S3BucketName` parameters. `AWS_REGION` is a built-in Lambda env var set by AWS automatically.

6. **`backend/README.md:129-136,264-271`** → `backend/template.yaml`, `backend/samconfig.toml`
   - Doc says: `parameter_overrides` includes `"AWSRegion=us-east-1"` and lists it as a template parameter
   - Reality: Only two parameters: `Environment` and `S3BucketName`. Actual `samconfig.toml` has `region = "us-west-2"`.

7. **`tests/e2e/README.md:265`** → `playwright.config.ts:29`
   - Doc says: baseURL: `http://localhost:5173` (Vite dev server)
   - Code says: `baseURL: 'http://localhost:3000'` and webServer url is also `http://localhost:3000`.

---

### GAPS (code exists, no doc)

1. **`frontend/src/api/client.ts`** — Uses `VITE_CDN_BASE_URL` and `VITE_API_BASE_URL` with hardcoded defaults. These are in `.env.example`, but `VITE_DEBUG` (read in `debug.ts`) is not in `.env.example`.

2. **`frontend/src/hooks/queries/usePoemDatesQuery.ts`** — Exported hook with no documentation. README lists `hooks/` generically but does not mention the `queries/` subdirectory.

---

### STALE (doc exists, code doesn't)

1. **`README.md:80`** — Link says "See `lambda/README.md`"
   - The directory is `backend/`, and the README is at `backend/README.md`, not `lambda/README.md`.

2. **`README.md:107-108`** — Project structure lists `docs/SAM_DEPLOYMENT.md` and `docs/plans/`
   - No `docs/` directory exists in the repository at all.

3. **`backend/README.md:435-441,449-460`** — Legacy Manual Deployment section references `package-all.sh`
   - No file named `package-all.sh` exists anywhere. The deploy script is at `backend/scripts/deploy.sh`.

---

### BROKEN LINKS

1. **`README.md:80`** — `[lambda/README.md](lambda/README.md)` → target file does not exist. Correct path is `backend/README.md`.

2. **`backend/README.md:435`** — "See `docs/SAM_DEPLOYMENT.md`" → file does not exist. The `docs/` directory does not exist.

---

### STALE CODE EXAMPLES

1. **`README.md:72-74`** — Backend development commands use wrong directory:
   ```bash
   cd lambda
   sam build && sam deploy
   ```
   Should be `cd backend`.

2. **`README.md:77`** — `sam local start-api` shown with `cd lambda` prefix, should be `cd backend`.

3. **`tests/e2e/README.md:275-298`** — CI/CD Integration section shows GitHub Actions with `node-version: '18'` and `@v3` actions. Actual CI uses `node-version: '22'` and `@v4` actions. Section labeled "Future" but a CI workflow already exists.

---

### CONFIG DRIFT

1. **`.env.example` lists `VITE_S3_BUCKET` and `VITE_AWS_REGION`** — Neither variable is referenced anywhere in frontend source code. No `import.meta.env.VITE_S3_BUCKET` or `import.meta.env.VITE_AWS_REGION` exists. These are phantom config entries.

2. **`VITE_DEBUG` is read in `frontend/src/utils/debug.ts:27`** but is not listed in `.env.example`. The README Debugging section documents it but `.env.example` omits it.

---

### STRUCTURE ISSUES

1. **`README.md:117`** — Claims "Type-safe development with strict TypeScript (zero `any` types)" — grep confirms this is true. Also claims "75%+ coverage" which cannot be verified without running tests, and "Accessibility compliance (WCAG AA)" which is aspirational without evidence.

2. **`tests/e2e/README.md:16`** — States "Node.js 16+" as prerequisite but also says "tested with v22.20.0". The project requires Node 22. "Node.js 16+" is misleading.
