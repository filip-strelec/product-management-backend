/**
 * CLI entry point. Most of the time you do not need to run this manually —
 * the API auto-seeds on boot when the database is empty (see `seed-runner.ts`).
 *
 * Usage:  npm run seed
 */
import { runSeed } from './seed-runner.js';

runSeed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
