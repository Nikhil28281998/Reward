import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { SignUpSchema, SignInSchema } from '@reward/shared';
import { prisma } from '../db/client.js';

export async function authRoutes(app: FastifyInstance) {
  // POST /v1/auth/signup
  app.post('/v1/auth/signup', async (req, reply) => {
    const body = SignUpSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Validation error', issues: body.error.flatten() });
    }

    const existing = await prisma.user.findUnique({ where: { email: body.data.email } });
    if (existing) {
      return reply.status(409).send({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(body.data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: body.data.email,
        passwordHash,
        fullName: body.data.fullName ?? null,
      },
      select: { id: true, email: true, fullName: true, createdAt: true },
    });

    const token = app.jwt.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '30d' },
    );

    // Record consent at signup
    await prisma.consentRecord.create({
      data: {
        userId: user.id,
        consentType: 'data_processing',
        granted: true,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] ?? null,
      },
    });

    return reply.status(201).send({ user, token });
  });

  // POST /v1/auth/signin
  app.post('/v1/auth/signin', async (req, reply) => {
    const body = SignInSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Validation error' });
    }

    const user = await prisma.user.findUnique({ where: { email: body.data.email } });
    // Use constant-time comparison to avoid timing attacks
    const dummyHash = '$2b$12$invalidhashusedtopreventtimingattacks00000000000000000';
    const passwordHash = user?.passwordHash ?? dummyHash;
    const valid = await bcrypt.compare(body.data.password, passwordHash);

    if (!user || !valid) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const token = app.jwt.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '30d' },
    );

    return reply.send({
      user: { id: user.id, email: user.email, fullName: user.fullName, createdAt: user.createdAt },
      token,
    });
  });

  // GET /v1/auth/me
  app.get('/v1/auth/me', { onRequest: [app.authenticate] }, async (req, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: {
        id: true, email: true, fullName: true, createdAt: true,
        incomeProfile: {
          select: { annualIncome: true, filingStatus: true, state: true },
        },
      },
    });
    if (!user) return reply.status(404).send({ error: 'User not found' });
    return reply.send({ user });
  });
}
