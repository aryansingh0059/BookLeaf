import { asyncHandler } from '../utils/asyncHandler.js';
import { getHealth } from '../services/healthService.js';

export const health = asyncHandler(async (req, res) => {
  const data = getHealth();
  res.status(data.status === 'ok' ? 200 : 503).json(data);
});
