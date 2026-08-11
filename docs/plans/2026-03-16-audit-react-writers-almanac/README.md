# Audit Remediation Plan: react-writers-almanac

> **Historical.** This plan describes the repository as it stood in March 2026
> (committed `ba3845b`..`896dc5b`, 2026-03-16) and was superseded by
> `2026-08-09-audit-react-writers-almanac`. **Do not cite it as evidence about
> current code.** Several statements below were true when written and are false
> now -- the Prerequisites section names React 18 and Vite 7 and prescribes a
> two-step `npm ci && cd frontend && npm ci` install; the project is on React 19
> and Vite 8 with a single root lockfile. See [`../../README.md`](../../README.md)
> for what this directory is and where current documentation lives.

## Overview

This plan remediates findings from three concurrent audits of the react-writers-almanac codebase: a health audit (tech debt), a 12-pillar evaluation, and a documentation drift audit. The codebase is a React + Vite SPA with a Zustand store, TanStack Query, and three AWS Lambda backend functions. It serves archived daily poems from a CDN/S3 backend.

The remediation follows a strict ordering: subtractive cleanup first (dead code, unused deps), then structural code fixes (architecture, error handling, performance), then additive guardrails (lint rules, pre-commit hooks), and finally documentation corrections. This ordering ensures that cleanup reduces the surface area before structural changes are made, and that guardrails lock in the improvements before documentation captures the final state.

Across the three audits, there are 3 critical findings, 6 high-severity findings, 8 medium findings, 5 low findings, 7 documentation drifts, 2 documentation gaps, 3 stale docs, 2 broken links, and 2 config drifts. Many findings overlap across audits and are consolidated into single tasks.

## Prerequisites

- **Node.js 22+** installed
- **npm** (comes with Node.js)
- **AWS SAM CLI** (for backend template validation)
- Repository cloned and dependencies installed: `npm ci && cd frontend && npm ci`
- Existing CI pipeline passing: `npm run check`
- Familiarity with: React 18, Vite 7, Zustand 5, TanStack Query 5, AWS Lambda, SAM

## Phase Summary

| Phase | Tag | Goal | Token Estimate |
|-------|-----|------|---------------|
| 0 | — | Foundation: ADRs, conventions, testing strategy | ~3,000 |
| 1 | [HYGIENIST] | Dead code removal, unused dependency cleanup, quick wins | ~12,000 |
| 2 | [IMPLEMENTER] | Structural fixes: DRY violations, data flow, error handling, performance | ~25,000 |
| 3 | [FORTIFIER] | Guardrails: lint rules, pre-commit hooks, CI hardening | ~10,000 |
| 4 | [DOC-ENGINEER] | Documentation drift fixes, broken links, config alignment | ~8,000 |

## Navigation

- [Phase 0 — Foundation](./Phase-0.md)
- [Phase 1 — Cleanup [HYGIENIST]](./Phase-1.md)
- [Phase 2 — Code Fixes [IMPLEMENTER]](./Phase-2.md)
- [Phase 3 — Guardrails [FORTIFIER]](./Phase-3.md)
- [Phase 4 — Documentation [DOC-ENGINEER]](./Phase-4.md)
- [Feedback](./feedback.md)
