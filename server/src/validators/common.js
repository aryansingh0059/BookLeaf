import { z } from 'zod';
import mongoose from 'mongoose';

export const objectId = z
  .string()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), { message: 'Invalid ObjectId' });

export const objectIdParam = z.object({
  id: objectId,
});

export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
