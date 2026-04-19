import { z } from 'zod';

// ─── Environment Config ────────────────────────────────────────────────────────

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  DATABASE_URL: z.string().url(),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY: z.string().default('30d'),

  OPENAI_API_KEY: z.string().startsWith('sk-'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  // Object storage (S3-compatible)
  STORAGE_BUCKET: z.string().default('reward-statements'),
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  STORAGE_REGION: z.string().default('us-east-1'),

  MAX_UPLOAD_BYTES: z.coerce.number().default(20 * 1024 * 1024), // 20 MB
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:');
  for (const [key, issues] of Object.entries(parsed.error.flatten().fieldErrors)) {
    console.error(`   ${key}: ${issues?.join(', ')}`);
  }
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
