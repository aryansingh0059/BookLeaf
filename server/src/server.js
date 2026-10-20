import http from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';
import { setIo } from './sockets/emitters.js';

const app = createApp();
const httpServer = http.createServer(app);

// --- Socket.IO ---
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  },
  // Require JWT in the handshake auth object
  allowRequest: (req, callback) => callback(null, true),
});

// JWT authentication middleware for Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    socket.data.userId = payload.sub;
    socket.data.role = payload.role;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  const { userId, role } = socket.data;
  logger.debug({ userId, role }, 'Socket connected');

  if (role === 'admin') {
    socket.join('admins');
  } else if (role === 'author') {
    // Authors only join their own room
    socket.join(`user:${userId}`);
  }

  socket.on('disconnect', () => {
    logger.debug({ userId, role }, 'Socket disconnected');
  });
});

setIo(io);

// --- HTTP Server ---
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
