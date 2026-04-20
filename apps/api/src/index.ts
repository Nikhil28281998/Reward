import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';
import { authRoutes } from './routes/auth.js';
import { onboardingRoutes } from './routes/onboarding.js';
import { cardRoutes } from './routes/cards.js';
import { ledgerRoutes } from './routes/ledger.js';
import { recommendationRoutes } from './routes/recommendations.js';
import { assistantRoutes } from './routes/assistant.js';

// ─── Type augmentation for JWT ────────────────────────────────────────────────
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; email: string };
    user: { sub: string; email: string };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>;
  }
}

// ─── App Factory ──────────────────────────────────────────────────────────────

async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'warn' : 'info',
      transport:
        config.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
    trustProxy: true,
  });

  // ── Plugins
  await app.register(cors, {
    origin: config.NODE_ENV === 'production'
      ? ['https://labhly.com', 'https://www.labhly.com', 'https://labhly.app']
      : true,
    credentials: true,
  });

  await app.register(jwt, { secret: config.JWT_SECRET });

  await app.register(multipart, {
    limits: {
      fileSize: config.MAX_UPLOAD_BYTES,
      files: 1,
    },
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.headers['x-forwarded-for']?.toString() ?? req.ip,
  });

  // ── Decorators
  app.decorate('authenticate', async (req: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // ── Health check
  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

  // ── Routes
  await app.register(authRoutes);
  await app.register(onboardingRoutes);
  await app.register(cardRoutes);
  await app.register(ledgerRoutes);
  await app.register(recommendationRoutes);
  await app.register(assistantRoutes);

  return app;
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    console.log(`🚀 Labhly API running on http://${config.HOST}:${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
