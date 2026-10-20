import { z } from 'zod';

export const bookIdParam = z.object({
  id: z.string().min(1),
});
