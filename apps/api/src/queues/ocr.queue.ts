import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config.js';

export const redis = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const ocrQueue = new Queue('ocr', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

export type OcrJobData = {
  statementId: string;
  fileKey: string;
  mimeType: string;
};
