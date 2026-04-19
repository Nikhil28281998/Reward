import { Worker } from 'bullmq';
import Tesseract from 'tesseract.js';
import { redis, type OcrJobData } from '../queues/ocr.queue.js';
import { prisma } from '../db/client.js';

// ─── OCR Worker ───────────────────────────────────────────────────────────────
// Processes uploaded statement images and PDFs.
// Extracts transactions, detects card issuer, and populates TransactionRaw rows.

const worker = new Worker<OcrJobData>(
  'ocr',
  async (job) => {
    const { statementId, fileKey, mimeType } = job.data;

    await prisma.statement.update({
      where: { id: statementId },
      data: { ocrStatus: 'PROCESSING' },
    });

    try {
      // TODO: download file from object storage
      // const fileBuffer = await storageClient.getObject(config.STORAGE_BUCKET, fileKey);
      // For now, use a placeholder path during development
      const filePath = fileKey; // replace with actual download

      let rawText = '';
      if (mimeType !== 'application/pdf') {
        const result = await Tesseract.recognize(filePath, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              void job.updateProgress(Math.round(m.progress * 100));
            }
          },
        });
        rawText = result.data.text;
      } else {
        // TODO: PDF text extraction via pdf-parse or pdfjs-dist
        rawText = '[PDF text extraction not yet implemented]';
      }

      // Naive transaction parser — replace with ML model in production
      const transactions = parseTransactions(rawText);
      const { issuer, last4 } = detectCard(rawText);

      await prisma.$transaction([
        prisma.statement.update({
          where: { id: statementId },
          data: {
            ocrStatus: 'COMPLETED',
            ocrRawText: rawText,
            detectedIssuer: issuer,
            detectedLast4: last4,
          },
        }),
        ...transactions.map((t) =>
          prisma.transactionRaw.create({
            data: {
              statementId,
              rawDate: t.date,
              rawDescription: t.description,
              rawAmount: t.amount,
              parsedDate: parseDate(t.date),
              parsedAmount: parseAmount(t.amount),
              confidence: t.confidence,
            },
          }),
        ),
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.statement.update({
        where: { id: statementId },
        data: { ocrStatus: 'FAILED', processingError: message },
      });
      throw err; // trigger BullMQ retry
    }
  },
  {
    connection: redis,
    concurrency: 3,
  },
);

worker.on('completed', (job) => {
  console.log(`[OCR] Job ${job.id} completed for statement ${job.data.statementId}`);
});

worker.on('failed', (job, err) => {
  console.error(`[OCR] Job ${job?.id} failed:`, err.message);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTransactions(text: string): Array<{
  date: string;
  description: string;
  amount: string;
  confidence: number;
}> {
  // Regex targeting common statement formats: DATE DESCRIPTION AMOUNT
  const lineRe =
    /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s+(.{3,80}?)\s+(-?\$?[\d,]+\.\d{2})/gm;
  const results: ReturnType<typeof parseTransactions> = [];
  let match: RegExpExecArray | null;

  while ((match = lineRe.exec(text)) !== null) {
    results.push({
      date: match[1],
      description: match[2].trim(),
      amount: match[3],
      confidence: 0.8,
    });
  }
  return results;
}

function detectCard(text: string): { issuer: string | null; last4: string | null } {
  const issuers: Array<[RegExp, string]> = [
    [/chase/i, 'Chase'],
    [/american express|amex/i, 'American Express'],
    [/citi(?:bank)?/i, 'Citi'],
    [/bank of america/i, 'Bank of America'],
    [/capital one/i, 'Capital One'],
    [/discover/i, 'Discover'],
    [/wells fargo/i, 'Wells Fargo'],
    [/us bank/i, 'US Bank'],
  ];

  let issuer: string | null = null;
  for (const [re, name] of issuers) {
    if (re.test(text)) { issuer = name; break; }
  }

  const last4Match = text.match(/(?:ending in|last 4 digits?:?)\s*(\d{4})/i);
  return { issuer, last4: last4Match?.[1] ?? null };
}

function parseDate(raw: string): Date | null {
  try {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[$,]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

export { worker };
