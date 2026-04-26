import { createApp } from './app.js';
import { env } from './config/env.js';
import { runSeed } from './db/seed-runner.js';

const start = async (): Promise<void> => {
  // Auto-bootstrap: ensures categories (lookup) and products exist on first
  // boot. Idempotent — does nothing when tables are already populated.
  await runSeed();

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
};

start().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});
