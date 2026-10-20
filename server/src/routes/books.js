import { Router } from 'express';
import { getBook, listBooks } from '../controllers/bookController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { bookIdParam } from '../validators/bookValidators.js';
import { ROLES } from '../config/constants.js';

export const booksRouter = Router();

booksRouter.use(authenticate, requireRole(ROLES.AUTHOR));
booksRouter.get('/', listBooks);
booksRouter.get('/:id', validate({ params: bookIdParam }), getBook);
