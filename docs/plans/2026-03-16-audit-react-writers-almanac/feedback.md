# Feedback — 2026-03-16-audit-react-writers-almanac

## Active Feedback

<!-- Feedback items are added here by Plan Reviewer and Code Reviewer -->
<!-- Format:
### [SOURCE] FB-NNN: Title
- **Status:** OPEN | IN_PROGRESS | RESOLVED
- **Phase:** Phase-N
- **Task:** Task N
- **Description:** What needs to change
- **Resolution:** (filled when resolved)
-->

## Resolved Feedback

<!-- Resolved items are moved here with resolution notes -->

### [PLAN_REVIEW] FB-001: Backend test file will not be picked up by vitest
- **Status:** RESOLVED
- **Phase:** Phase-2
- **Task:** Task 1
- **Description:** The task instructs the engineer to create `backend/lambdas/shared/utils.test.js` and verify it with `npm test`. However, the root `vitest.config.ts` include pattern is `frontend/src/**/*.{test,spec}.*` — backend test files are excluded. The test will never run. Either (a) update `vitest.config.ts` to include `backend/lambdas/**/*.test.js` in Phase 2 Task 1 steps, or (b) create a separate vitest config for backend tests, or (c) add a backend test script. The CI `test-backend` job also does not run any vitest tests — it only validates the SAM template.
- **Resolution:** Chose option (a). Phase 2 Task 1 now includes `vitest.config.ts` in Files to Modify/Create, with explicit instructions to expand the `include` array to add `backend/lambdas/**/*.{test,spec}.*`. Also added `environmentMatchGlobs` configuration to run backend tests in the `node` environment instead of jsdom. Testing Instructions updated to reflect these steps.

### [PLAN_REVIEW] FB-002: `sanitizePoemText` is not exported from transforms.ts
- **Status:** RESOLVED
- **Phase:** Phase-2
- **Task:** Task 3
- **Description:** The task says to "import `sanitizePoemText` from `../api/transforms`", but `sanitizePoemText` is not an exported function in `transforms.ts` — it is a module-private function. The engineer must first add an `export` to `sanitizePoemText` (and/or `sanitizePoemLines` for array inputs). The implementation steps should explicitly state: "Export `sanitizePoemText` (and `sanitizePoemLines` if needed) from `transforms.ts`." Additionally, the plan references only `sanitizePoemText` for handling both `string` and `string[]`, but the codebase already has a separate `sanitizePoemLines` function for arrays — the plan should mention using `sanitizePoemLines` for array inputs rather than modifying `sanitizePoemText` to accept arrays.
- **Resolution:** Phase 2 Task 3 implementation steps now explicitly instruct the engineer to add `export` to both `sanitizePoemText` and `sanitizePoemLines` in `transforms.ts`. The plan no longer suggests modifying `sanitizePoemText` to accept arrays — instead it directs the engineer to use `sanitizePoemLines` for `string[]` inputs and `sanitizePoemText` for `string` inputs, matching the existing codebase pattern. Verification checklist updated to confirm both functions are exported.

### [PLAN_REVIEW] FB-003: Phase 3 Task 3 coverage config may not pick up backend tests
- **Status:** RESOLVED
- **Phase:** Phase-3
- **Task:** Task 3
- **Description:** The coverage configuration is added to `vitest.config.ts` which only includes `frontend/src/**` tests. If FB-001 is resolved by expanding the vitest include pattern, the coverage thresholds and exclusions should account for backend test files as well. If a separate vitest config is used for backend, the CI step for coverage needs to cover both. The task should acknowledge this dependency on how FB-001 is resolved.
- **Resolution:** Phase 3 Task 3 now includes a dependency note acknowledging that Phase 2 Task 1 expanded `vitest.config.ts` to include backend tests. The coverage exclude list includes backend test files. The implementation steps note that coverage thresholds apply globally across both frontend and backend, and advise adjusting thresholds if backend code significantly lowers overall coverage. The CI step description notes that the single vitest invocation now covers both frontend and backend.
