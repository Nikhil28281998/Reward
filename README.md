# Reward

Reward is a mobile-first AI financial assistant focused on one core promise:
help users save more money with better card, offer, and spending decisions.

## v1 Scope (Locked)
- Mobile OCR-only ingestion from statement screenshots/PDFs.
- Card auto-detection plus manual add for inactive cards.
- Salary and fixed-cost capture.
- Cashback earned and missed-opportunity tracking.
- Best-card recommendation search.
- Monthly statement refresh and reconciliation.
- Suggestion-only assistant with multiple options (no directive advice).

## v1 Exclusions
- No complex template-builder UI.
- No heavy direct bank-login integrations.

## Repository Layout
- `apps/mobile`: React Native app (user-facing).
- `apps/api`: backend API and orchestration layer.
- `packages/shared`: shared types/schemas/constants.
- `docs`: product, architecture, API, and workflow specs.

## Build Principles
- Deterministic finance math, AI for explanation only.
- Statement data is source-of-truth over push/OCR streams.
- Every recommendation must be explainable and auditable.
- Start lean, optimize for reliability and gross margin.
