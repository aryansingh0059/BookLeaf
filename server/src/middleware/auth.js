import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('UNAUTHORIZED', 'Authentication required');
  }

  const token = header.slice('Bearer '.length).trim();
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw ApiError.unauthorized('UNAUTHORIZED', 'Invalid or expired token');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw ApiError.unauthorized('UNAUTHORIZED', 'Invalid or expired token');
  }

  req.user = user;
  req.tokenPayload = payload;
  next();
});
