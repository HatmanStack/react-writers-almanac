# `docs/`

## What is in here

`docs/plans/` holds dated **audit-and-remediation working sets**. Each one is a
snapshot of an audit and the plan written from it, kept as a record of what was
found and what was decided.

| Set                                      | Written against              | Status                                       |
| ---------------------------------------- | ---------------------------- | -------------------------------------------- |
| `2026-03-16-audit-react-writers-almanac` | the repository in March 2026 | **Historical** — superseded by a later audit |

This table lists only the sets that are **tracked**. A remediation in progress
keeps its working set on disk and untracked until someone decides it is worth
committing, so a checkout can contain a directory under `docs/plans/` that this
table does not name. That is expected; the table is not an inventory of the
directory.

## These are records, not documentation

**Do not cite a file under `docs/plans/` as evidence about how the code behaves
today.** They are accurate as of the commit each was written against and stale by
construction thereafter — describing a tree the remediation then deliberately
changed. Reading one is how you find out what a decision was and why; it is not
how you find out what the code does.

This is a live hazard, not a stylistic preference. During the August 2026 audit,
the agents doing the work had to be told explicitly not to cite these documents
as evidence about current code, because they read as authoritative and are
internally consistent. Any reader or tool that arrives without that instruction
hits the same trap. The March set's own README, for instance, still describes the
project as "React 18, Vite 7" and prescribes a two-step
`npm ci && cd frontend && npm ci` install — both true when written, both false
now.

**Where to look instead:**

| Question                          | Source of truth                                            |
| --------------------------------- | ---------------------------------------------------------- |
| How do I set this up and run it?  | [`../README.md`](../README.md)                             |
| How do I contribute?              | [`../CONTRIBUTING.md`](../CONTRIBUTING.md)                 |
| What does the backend deploy do?  | [`../backend/README.md`](../backend/README.md)             |
| What are the S3 keys?             | [`../scripts/s3-structure.md`](../scripts/s3-structure.md) |
| What shipped, and when?           | [`../CHANGELOG.md`](../CHANGELOG.md)                       |
| How does the app actually behave? | the code, and the tests beside it                          |

## There is no ADR home yet

Architectural decision records exist, but only **inline inside plan files**: every
set's `Phase-0.md` opens with an "Architecture Decisions" section, and
`docs/plans/2026-03-16-audit-react-writers-almanac/Phase-0.md` is the one tracked
example. They are effectively unfindable — nothing links to them, and their
numbering is scoped to their own plan.

**Their currency is uncertain and cannot be assumed.** Numbering restarts in each
set and collides across them: March's ADR-2 is "Preserve Existing Patterns Where
Functional", and a later set's ADR-2 is something else entirely, so an unqualified
"ADR-2" means nothing without naming the set it came from. Several March ADRs were
written to constrain a remediation that has since finished, and it is not obvious
from the text which of those were meant to outlive it.

They have deliberately **not** been relocated. Deciding which still apply is a
judgment call about the project's direction, and promoting a stale decision into
a durable ADR home is worse than leaving a live one hard to find. If an ADR home
is created, that triage is the work — not the move.
