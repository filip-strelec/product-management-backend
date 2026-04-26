import 'dotenv/config';
import { z } from 'zod';

const optionalString = z
  .string()
  .trim()
  .min(1)
  .optional()
  .transform((v) => (v === '' ? undefined : v));

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_FILE: z.string().min(1).default('./data/products.db'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:4200'),

  // Optional local seed files. When set, the seed runner loads from these
  // instead of fetching DummyJSON. See src/db/seedValues/README.md.
  SEED_PRODUCTS_FILE: optionalString,
  SEED_CATEGORIES_FILE: optionalString,

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
