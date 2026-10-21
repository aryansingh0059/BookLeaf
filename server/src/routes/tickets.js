import { Router } from "express";
import {
  createTicket,
  getTicket,
  listTickets,
  replyToTicket,
} from "../controllers/ticketController.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import {
  createTicketBody,
  replyBody,
  ticketIdParam,
} from "../validators/ticketValidators.js";
import { ROLES } from "../config/constants.js";

export const ticketsRouter = Router();

ticketsRouter.use(authenticate, requireRole(ROLES.AUTHOR));
ticketsRouter.get("/", listTickets);
ticketsRouter.post("/", validate({ body: createTicketBody }), createTicket);
ticketsRouter.get("/:id", validate({ params: ticketIdParam }), getTicket);
ticketsRouter.post(
  "/:id/replies",
  validate({ params: ticketIdParam, body: replyBody }),
  replyToTicket,
);
