# Labhly

> *Labha (लाभ)* — Sanskrit/Telugu for **gain, profit, reward.**

**Labhly** is a privacy-first, AI-powered credit-card rewards optimizer. We tell you which card to swipe **right now**, track every welcome bonus and rotating category, and surface the points you''re leaving on the table — **without ever asking for your bank login.**

## The promise
1. **Best-card recommendation** in two taps for any purchase.
2. **No bank linking required.** Statement upload + OCR is the default ingestion path.
3. **Honest math.** Real dollar value, real fees, real approval odds — no premium-card spam.
4. **Quiet by design.** You set the notification budget, not us.

## Core features (v1)
- Statement OCR (PDF + photo) → automatic card and transaction detection
- Cross-issuer best-card recommendations per purchase
- Welcome-bonus (SUB) tracker with deadline countdown
- Rotating-category calendar (Chase Freedom, Discover It, US Bank Cash+)
- Earnings ring: month-to-date earned vs. potential
- Transfer-partner explorer for travel redemptions
- AI assistant grounded in *your* wallet and spend
- Biometric unlock + 2FA
- Web, iOS, Android (one Expo codebase)

## What we are NOT
- Not a budgeting app
- Not a bank aggregator (no Plaid by default)
- Not financial or investment advice

## Repository layout
- `apps/mobile` — React Native (Expo) client; web + iOS + Android
- `apps/api` — Fastify + Prisma + BullMQ backend
- `packages/shared` — types, schemas, constants
- `docs` — product, architecture, API specs

## Build principles
- Deterministic finance math; AI for explanation only
- Statement data is source of truth
- Every recommendation must be explainable and auditable
- Privacy is a feature, not a setting

## Tech stack
- **Mobile/Web:** Expo SDK 52, React Native 0.76, Expo Router 4, Zustand, React Query, Reanimated 3
- **API:** Fastify 4, Prisma 5, PostgreSQL 16, Redis 7, BullMQ
- **OCR:** Tesseract.js worker
- **AI:** OpenAI-compatible API (OpenRouter) with tool calls
- **Infra:** Docker Compose locally, Render/AWS for production

## Local dev
```bash
docker compose up -d              # start postgres + redis
pnpm install
pnpm --filter @reward/api dev     # API on :3001
pnpm --filter @reward/mobile dev  # Expo on :8081
```

> Internal monorepo namespace remains `@reward/*` for now; will be renamed to `@labhly/*` in a future cleanup pass.
