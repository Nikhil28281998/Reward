# API Contracts (Draft)

## Auth
- `POST /v1/auth/signup`
- `POST /v1/auth/login`

## Onboarding
- `POST /v1/onboarding/profile` (salary, commitments)
- `POST /v1/onboarding/cards/manual`
- `POST /v1/onboarding/statements/upload`
- `GET /v1/onboarding/cards/detected`

## Ledger and Reconciliation
- `GET /v1/transactions`
- `POST /v1/transactions/correct`
- `POST /v1/reconciliation/run`
- `GET /v1/reconciliation/status/{jobId}`

## Recommendations
- `GET /v1/recommendations/home`
- `POST /v1/recommendations/search` (purchase intent)
- `POST /v1/recommendations/travel` (destination/date range)

## Offers and Cashback
- `POST /v1/offers/upload` (screenshot/PDF)
- `GET /v1/offers/active`
- `GET /v1/cashback/summary`

## Planning
- `GET /v1/templates`
- `POST /v1/templates/apply`
- `POST /v1/templates/upload` (simple import, no custom builder UI)

## Assistant
- `POST /v1/assistant/query`
  - Returns: options, assumptions, confidence, disclosures.
