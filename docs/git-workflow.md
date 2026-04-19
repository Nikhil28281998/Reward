# Git Workflow (Optimization-First)

## Branching
- `main`: always releasable.
- short-lived feature branches: `feat/<scope>`.
- bug branches: `fix/<scope>`.

## Pull Request Requirements
- user impact summary,
- risk level,
- privacy/compliance impact,
- test evidence,
- rollback notes.

## Commit Style
Use conventional commits:
- `feat: ...`
- `fix: ...`
- `docs: ...`
- `refactor: ...`
- `chore: ...`

## Recommended Pre-Commit Checks
- lint and format,
- type checks,
- tests for touched modules,
- secrets scan.

## Merge Strategy
- squash merge for clean history,
- one coherent change per PR,
- release notes derived from commit prefixes.
