import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  addNote,
  assignMe,
  draftReply,
  getTicket,
  listTickets,
  patchTicket,
  reclassify,
  sendReply,
  stats,
} from "../controllers/adminController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import {
  adminReplyBody,
  adminTicketQuery,
  noteBody,
  patchTicketBody,
  ticketIdParam,
} from "../validators/ticketValidators.js";
import { ROLES } from "../config/constants.js";

const draftLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: "TOO_MANY_REQUESTS",
        message:
          "Draft generation rate limit exceeded. Wait a moment and try again.",
      },
    });
  },
});

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole(ROLES.ADMIN));

adminRouter.get("/tickets", validate({ query: adminTicketQuery }), listTickets);
adminRouter.get("/tickets/:id", validate({ params: ticketIdParam }), getTicket);
adminRouter.patch(
  "/tickets/:id",
  validate({ params: ticketIdParam, body: patchTicketBody }),
  patchTicket,
);
adminRouter.post(
  "/tickets/:id/assign-me",
  validate({ params: ticketIdParam }),
  assignMe,
);
adminRouter.post(
  "/tickets/:id/notes",
  validate({ params: ticketIdParam, body: noteBody }),
  addNote,
);
adminRouter.post(
  "/tickets/:id/draft",
  validate({ params: ticketIdParam }),
  draftLimiter,
  draftReply,
);
adminRouter.post(
  "/tickets/:id/reply",
  validate({ params: ticketIdParam, body: adminReplyBody }),
  sendReply,
);
adminRouter.post(
  "/tickets/:id/reclassify",
  validate({ params: ticketIdParam }),
  reclassify,
);
adminRouter.get("/stats", stats);
