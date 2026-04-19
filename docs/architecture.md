# Architecture (v1)

## High-Level Components
- Mobile App (`apps/mobile`): onboarding, uploads, dashboard, search, assistant.
- API (`apps/api`): auth, ingestion orchestration, recommendation endpoints.
- OCR/Parsing Worker: extracts transaction fields from images/PDFs.
- Rules Engine: deterministic rewards/APR/utilization logic.
- Reconciliation Engine: dedupe and canonical ledger generation.
- Storage:
  - Postgres for normalized data,
  - Redis for queues/jobs,
  - object storage for uploaded artifacts.

## Data Source Priority
1. Statement uploads (highest confidence).
2. Push/quick transactions (faster, noisier).
3. Manual edits (user-verified).

## Dedupe Strategy
Build canonical fingerprint from:
- normalized merchant,
- amount,
- date window,
- card key (last4/profile).

Conflict policy:
- Statement wins over OCR partials and inferred events.
- Keep source lineage for auditability.

## AI Boundary
- AI can classify, summarize, and explain.
- AI cannot own money math.
- Rewards/APR recommendations come from deterministic rule outputs.

## Mobile OCR-Only Decision
v1 ingestion accepts:
- mobile screenshots,
- mobile camera captures,
- statement PDFs.

No direct bank-login dependency in v1.
