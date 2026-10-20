import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      'authorization',
      'headers.authorization',
      'JWT_SECRET',
      'GROQ_API_KEY',
      'req.headers.authorization',
    ],
    censor: '[redacted]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
