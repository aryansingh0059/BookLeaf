import { z } from "zod";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "../config/constants.js";
import { objectId } from "./common.js";

const attachment = z.object({
  name: z.string().min(1).max(255),
  size: z.number().int().nonnegative(),
  type: z.string().min(1).max(200),
});

export const createTicketBody = z.object({
  bookId: z.union([z.string().min(1), z.null()]).optional(),
  subject: z.string().trim().min(3).max(150),
  description: z.string().trim().min(10).max(5000),
  attachments: z.array(attachment).max(5).optional(),
});

export const replyBody = z.object({
  body: z.string().trim().min(1).max(5000),
});

export const adminReplyBody = z.object({
  body: z.string().trim().min(1).max(5000),
  status: z.enum(["In Progress", "Resolved"]).optional(),
});

export const noteBody = z.object({
  body: z.string().trim().min(1).max(5000),
});

export const ticketIdParam = z.object({
  id: z.string().min(1),
});

export const patchTicketBody = z
  .object({
    status: z.enum(TICKET_STATUSES).optional(),
    category: z.enum(TICKET_CATEGORIES).optional(),
    priority: z.enum(TICKET_PRIORITIES).optional(),
    assignedTo: z.union([objectId, z.null()]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const adminTicketQuery = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  category: z.enum(TICKET_CATEGORIES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  assignedTo: z.string().optional(),
  dateFrom: z
    .string()
    .datetime({ offset: true })
    .or(z.string().date())
    .optional(),
  dateTo: z
    .string()
    .datetime({ offset: true })
    .or(z.string().date())
    .optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(["default", "createdAt"]).optional(),
});
