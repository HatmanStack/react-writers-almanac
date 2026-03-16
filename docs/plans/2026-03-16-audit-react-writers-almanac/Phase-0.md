# Phase 0 — Foundation

This phase establishes conventions, architectural decisions, and strategies that apply across all subsequent phases.

## Architecture Decisions

### ADR-1: Remediation-Only Scope
- **Decision:** This plan addresses only findings from the three audits. No new features are added.
- **Rationale:** Audit remediation must be scoped tightly. Feature work mixed with cleanup leads to scope creep and harder reviews.

### ADR-2: Preserve Existing Patterns Where Functional
- **Decision:** Reuse existing patterns (Zustand slices, TanStack Query hooks, transforms layer, ErrorBoundary pattern) rather than introducing new abstractions.
- **Rationale:** The codebase already has well-structured patterns. The problem is inconsistent adoption, not missing patterns.

### ADR-3: No MUI Removal in This Plan
- **Decision:** The eval suggests replacing MUI with headless alternatives. This plan does NOT do that. MUI stays.
- **Rationale:** Replacing the component library is a feature-level change that touches every component. It is out of scope for audit remediation. The eval's suggestion is captured but deferred.

### ADR-4: No Backend TypeScript Migration
- **Decision:** Backend Lambdas remain in JavaScript. No TypeScript migration.
- **Rationale:** The backend is 3 small Lambda files. Migrating them to TypeScript requires build tooling changes and is out of scope for this remediation.

### ADR-5: Consolidate Data Fetching Through TanStack Query
- **Decision:** Wire `usePoemData` through TanStack Query (the existing `usePoemQuery` pattern) instead of raw axios.
- **Rationale:** The codebase already has TanStack Query set up with proper retry, caching, and stale management. The raw axios path in `usePoemData` bypasses all of this. The `usePoemQuery` hook already exists but is unused.

## Tech Stack (No Changes)

- **Frontend:** React 18, Vite 7, TypeScript 5.9, Zustand 5, TanStack Query 5
- **Styling:** Tailwind CSS 3 + MUI 5 (dual-styling preserved per ADR-3)
- **Backend:** AWS Lambda (Node.js 22), AWS SAM, S3
- **Testing:** Vitest 4, Testing Library, Playwright (E2E), vitest-axe
- **CI:** GitHub Actions

## Testing Strategy

- **Unit tests:** Vitest with jsdom. Co-located with source files (`.test.ts` / `.test.tsx`).
- **Mocking:** Use `vi.mock()` for module mocks. Mock `axios`/`cdnClient` for API tests. No live AWS calls.
- **Backend tests:** New tests for Lambda shared utilities. Use Vitest (already in root devDependencies).
- **Existing tests:** Must continue passing after each task. Run `npm test` to verify.
- **CI compatibility:** All tests must pass in CI (GitHub Actions, ubuntu-latest, Node 22). No tests that require AWS credentials, network access, or browser.

## Commit Convention

All commits use conventional commits format:

```text
type(scope): brief description

- Detail 1
- Detail 2
```

Types used in this plan:
- `chore`: dead code removal, dependency cleanup
- `refactor`: structural improvements, DRY consolidation
- `fix`: bug fixes, error handling improvements
- `perf`: performance improvements
- `docs`: documentation fixes
- `ci`: CI/CD changes
- `style`: code style (lint fixes, formatting)

Scopes: `frontend`, `backend`, `search`, `author`, `poem`, `lambda`, `ci`, `docs`

## Shared Patterns

### Extracting shared Lambda utilities
When consolidating duplicated Lambda code, create `backend/lambdas/shared/utils.js` with exported functions. Each Lambda imports from the relative path `../shared/utils.js`.

### Responsive layout pattern
When eliminating desktop/mobile JSX duplication, extract layout-specific classes into variables or a wrapper component. Do NOT create a generic `<ResponsiveLayout>` abstraction — keep it simple with conditional class names.

### Environment variable pattern
All environment-specific values use `import.meta.env.VITE_*` on the frontend. Hardcoded URLs are replaced with env vars with the existing hardcoded value as the fallback default (to avoid breaking existing deployments).
