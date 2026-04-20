# Multi-stage build for the Reward API (monorepo-aware)
FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# ── deps ───────────────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --prod=false

# ── source ─────────────────────────────────────────────────────────────────────
FROM deps AS source
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN pnpm exec prisma generate

# ── runtime ────────────────────────────────────────────────────────────────────
FROM source AS runtime
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
# Run via tsx (no compile step needed, keeps @reward/shared source imports working)
CMD ["pnpm", "exec", "tsx", "src/index.ts"]
