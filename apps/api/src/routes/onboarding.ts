import type { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { IncomeProfileSchema, CardConfirmSchema } from '@reward/shared';
import { prisma } from '../db/client.js';
import { ocrQueue } from '../queues/ocr.queue.js';
import { config } from '../config.js';

export async function onboardingRoutes(app: FastifyInstance) {
  // POST /v1/onboarding/statements/upload
  app.post('/v1/onboarding/statements/upload', {
    onRequest: [app.authenticate],
  }, async (req, reply) => {
    const data = await req.file({ limits: { fileSize: config.MAX_UPLOAD_BYTES } });
    if (!data) return reply.status(400).send({ error: 'No file provided' });

    const allowed = new Set([
      'image/jpeg', 'image/png', 'image/heic', 'image/heif',
      'image/webp', 'application/pdf',
    ]);
    if (!allowed.has(data.mimetype)) {
      return reply.status(415).send({ error: 'Unsupported file type. Send JPEG, PNG, HEIC, WebP, or PDF.' });
    }

    const ext = path.extname(data.filename) || '.bin';
    const fileKey = `statements/${req.user.sub}/${uuidv4()}${ext}`;
    const fileBuffer = await data.toBuffer();

    // TODO: upload fileBuffer to object storage at fileKey
    // await storageClient.putObject(config.STORAGE_BUCKET, fileKey, fileBuffer, { ContentType: data.mimetype });

    const statement = await prisma.statement.create({
      data: {
        userId: req.user.sub,
        fileKey,
        fileName: data.filename,
        mimeType: data.mimetype,
        fileSize: fileBuffer.byteLength,
        ocrStatus: 'PENDING',
      },
    });

    await ocrQueue.add('process-statement', {
      statementId: statement.id,
      fileKey,
      mimeType: data.mimetype,
    });

    return reply.status(202).send({
      statementId: statement.id,
      status: 'PENDING',
      message: 'Statement queued for OCR processing',
    });
  });

  // GET /v1/onboarding/statements/:id/status
  app.get('/v1/onboarding/statements/:id/status', {
    onRequest: [app.authenticate],
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const statement = await prisma.statement.findFirst({
      where: { id, userId: req.user.sub },
      select: {
        id: true,
        ocrStatus: true,
        periodStart: true,
        periodEnd: true,
        totalCharges: true,
        detectedIssuer: true,
        detectedLast4: true,
        processingError: true,
        _count: { select: { rawTransactions: true } },
      },
    });
    if (!statement) return reply.status(404).send({ error: 'Statement not found' });

    return reply.send({
      ...statement,
      transactionCount: statement._count.rawTransactions,
    });
  });

  // POST /v1/onboarding/cards/confirm
  app.post('/v1/onboarding/cards/confirm', {
    onRequest: [app.authenticate],
  }, async (req, reply) => {
    const body = CardConfirmSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Validation error', issues: body.error.flatten() });
    }

    // Verify the statement belongs to the user
    const statement = await prisma.statement.findFirst({
      where: { id: body.data.statementId, userId: req.user.sub, ocrStatus: 'COMPLETED' },
    });
    if (!statement) {
      return reply.status(404).send({ error: 'Statement not found or not yet processed' });
    }

    // Upsert card account
    let cardAccount = await prisma.cardAccount.findFirst({
      where: {
        userId: req.user.sub,
        cardProductId: body.data.cardProductId,
        ...(body.data.last4 ? { last4: body.data.last4 } : {}),
      },
    });

    if (!cardAccount) {
      cardAccount = await prisma.cardAccount.create({
        data: {
          userId: req.user.sub,
          cardProductId: body.data.cardProductId,
          last4: body.data.last4 ?? null,
          nickname: body.data.nickname ?? null,
          creditLimit: body.data.creditLimit ?? null,
        },
      });
    }

    // Link statement to card account
    await prisma.statement.update({
      where: { id: statement.id },
      data: { cardAccountId: cardAccount.id },
    });

    return reply.status(201).send({ cardAccount: { id: cardAccount.id } });
  });

  // POST /v1/onboarding/income
  app.post('/v1/onboarding/income', {
    onRequest: [app.authenticate],
  }, async (req, reply) => {
    const body = IncomeProfileSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Validation error', issues: body.error.flatten() });
    }

    const profile = await prisma.userIncomeProfile.upsert({
      where: { userId: req.user.sub },
      update: {
        annualIncome: body.data.annualIncome,
        filingStatus: body.data.filingStatus,
        state: body.data.state ?? null,
      },
      create: {
        userId: req.user.sub,
        annualIncome: body.data.annualIncome,
        filingStatus: body.data.filingStatus,
        state: body.data.state ?? null,
      },
    });

    return reply.status(201).send({ profile });
  });
}
