import 'dotenv/config';
import { z } from 'zod';

const boolFromString = z
  .enum(['true', 'false', '1', '0'])
  .default('false')
  .transform((v) => v === 'true' || v === '1');

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_FILE: z.string().min(1).default('./data/products.db'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:4200'),

  // Set to `true` when running behind a reverse proxy (nginx, ELB, ...) so
  // `req.protocol` / `req.get('host')` reflect the original client request.
  // Required for the upload endpoint to return correct https URLs in prod.
  TRUST_PROXY: boolFromString,

  // When `true`, the seed runner loads from the bundled JSON files in
  // src/db/seedValues/ instead of fetching DummyJSON. See that folder's README.
  SEED_FROM_LOCAL_FILES: boolFromString,

  // Thumbnail uploads. Disk path + per-file size cap.
  UPLOAD_DIR: z.string().min(1).default('./data/uploads'),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(1_048_576),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
