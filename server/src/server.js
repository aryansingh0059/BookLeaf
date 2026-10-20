import http from 'node:http';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';

const app = createApp();
const httpServer = http.createServer(app);

try {
  await connectDb();
  httpServer.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'BookLeaf API listening');
  });
} catch (err) {
  logger.error({ err: { message: err.message } }, 'Failed to start server');
  process.exit(1);
}

function shutdown() {
  httpServer.close(() => {
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { httpServer, app };
