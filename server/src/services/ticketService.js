import mongoose from "mongoose";
import { Book } from "../models/Book.js";
import { Ticket } from "../models/Ticket.js";
import { User } from "../models/User.js";
import { nextTicketNumber } from "../models/Counter.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { classifyTicketById } from "./ai/classifier.js";
import { PRIORITY_WEIGHT } from "../config/constants.js";
import {
  serializeAdminTicket,
  serializeAuthorTicket,
} from "./ticketSerializer.js";
import {
  emitTicketAiReady,
  emitTicketCreated,
  emitTicketReply,
  emitTicketUpdated,
} from "../sockets/emitters.js";

function isTicketRef(value) {
  return /^BL-\d+$/i.test(value) || mongoose.Types.ObjectId.isValid(value);
}

async function loadTicket(id) {
  if (!isTicketRef(id)) {
    throw ApiError.badRequest("INVALID_ID", "Invalid ticket id");
  }
  const query = /^BL-\d+$/i.test(id)
    ? { ticketNumber: id.toUpperCase() }
    : { _id: id };
  const ticket = await Ticket.findOne(query)
    .populate("author")
    .populate("book")
    .populate("assignedTo", "name email role")
    .populate("responses.author", "name email role")
    .populate("internalNotes.author", "name email role");
  if (!ticket) {
    throw ApiError.notFound("TICKET_NOT_FOUND", "Ticket not found");
  }
  return ticket;
}

async function findAuthorUserId(authorObjectId) {
  const user = await User.findOne({
    authorRef: authorObjectId,
    role: "author",
  }).select("_id");
  return user?._id?.toString() ?? null;
}

function queueClassification(ticketId) {
  setImmediate(async () => {
    try {
      const classified = await classifyTicketById(ticketId);
      if (classified) {
        emitTicketAiReady(serializeAdminTicket(classified));
      }
    } catch (err) {
      logger.warn(
        { err: err.message, ticketId },
        "Background classification failed",
      );
    }
  });
}

export async function createTicket(
  authorUser,
  { bookId, subject, description, attachments },
) {
  let book = null;
  if (bookId) {
    book = mongoose.Types.ObjectId.isValid(bookId)
      ? await Book.findById(bookId)
      : await Book.findOne({ bookId });
    if (!book || book.author.toString() !== authorUser.authorRef.toString()) {
      throw ApiError.notFound("BOOK_NOT_FOUND", "Book not found");
    }
  }

  const ticket = await Ticket.create({
    ticketNumber: await nextTicketNumber(),
    author: authorUser.authorRef,
    book: book?._id ?? null,
    subject,
    description,
    attachments: attachments ?? [],
    status: "Open",
    aiStatus: "pending",
  });

  const populated = await loadTicket(ticket._id.toString());
  emitTicketCreated(serializeAdminTicket(populated));
  queueClassification(ticket._id);
  return serializeAuthorTicket(populated);
}

export async function listAuthorTickets(authorUser) {
  const tickets = await Ticket.find({ author: authorUser.authorRef })
    .populate("book")
    .populate("responses.author", "name role")
    .sort({ createdAt: -1 });
  return tickets.map(serializeAuthorTicket);
}

export async function getAuthorTicket(authorUser, id) {
  const ticket = await loadTicket(id);
  if (ticket.author._id.toString() !== authorUser.authorRef.toString()) {
    throw ApiError.notFound("TICKET_NOT_FOUND", "Ticket not found");
  }
  return serializeAuthorTicket(ticket);
}

export async function addAuthorReply(authorUser, id, body) {
  const ticket = await loadTicket(id);
  if (ticket.author._id.toString() !== authorUser.authorRef.toString()) {
    throw ApiError.notFound("TICKET_NOT_FOUND", "Ticket not found");
  }
  if (ticket.status === "Closed") {
    throw ApiError.unprocessable(
      "TICKET_CLOSED",
      "Closed tickets cannot receive follow-ups",
    );
  }
  ticket.responses.push({
    author: authorUser._id,
    role: "author",
    body,
  });
  if (ticket.status === "Resolved") {
    ticket.status = "Open";
  }
  await ticket.save();
  const fresh = await loadTicket(ticket._id.toString());
  const authorUserId = await findAuthorUserId(fresh.author._id);
  emitTicketReply(serializeAdminTicket(fresh), authorUserId);
  return serializeAuthorTicket(fresh);
}

export async function listAdminTickets(query) {
  const {
    status,
    category,
    priority,
    assignedTo,
    dateFrom,
    dateTo,
    search,
    page = 1,
    limit = 20,
    sort,
  } = query;

  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (assignedTo === "unassigned") filter.assignedTo = null;
  else if (assignedTo) filter.assignedTo = assignedTo;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }
  if (search) {
    filter.$or = [
      { subject: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { ticketNumber: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const tickets = await Ticket.find(filter)
    .populate("author")
    .populate("book")
    .populate("assignedTo", "name email role")
    .lean();

  const now = new Date();
  const decorated = tickets.map((ticket) => serializeAdminTicket(ticket, now));

  decorated.sort((a, b) => {
    if (sort === "createdAt") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    const aOpen = a.status === "Open" || a.status === "In Progress" ? 0 : 1;
    const bOpen = b.status === "Open" || b.status === "In Progress" ? 0 : 1;
    if (aOpen !== bOpen) return aOpen - bOpen;
    const pw =
      (PRIORITY_WEIGHT[b.priority] ?? 0) - (PRIORITY_WEIGHT[a.priority] ?? 0);
    if (pw !== 0) return pw;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const total = decorated.length;
  const data = decorated.slice(skip, skip + limit);
  return { data, page, limit, total, pages: Math.ceil(total / limit) || 1 };
}

export async function getAdminTicket(id) {
  const ticket = await loadTicket(id);
  return serializeAdminTicket(ticket);
}

export async function patchAdminTicket(adminUser, id, payload) {
  const ticket = await loadTicket(id);
  if (payload.status) ticket.status = payload.status;
  if (payload.assignedTo !== undefined) {
    ticket.assignedTo = payload.assignedTo || null;
  }
  if (payload.category && payload.category !== ticket.category) {
    ticket.category = payload.category;
    ticket.categoryOverriddenBy = adminUser._id;
  }
  if (payload.priority && payload.priority !== ticket.priority) {
    ticket.priority = payload.priority;
    ticket.priorityOverriddenBy = adminUser._id;
  }
  await ticket.save();
  const fresh = await loadTicket(ticket._id.toString());
  const authorUserId = await findAuthorUserId(fresh.author._id);
  emitTicketUpdated(serializeAdminTicket(fresh), authorUserId);
  return serializeAdminTicket(fresh);
}

export async function assignToMe(adminUser, id) {
  return patchAdminTicket(adminUser, id, {
    assignedTo: adminUser._id.toString(),
  });
}

export async function addInternalNote(adminUser, id, body) {
  const ticket = await loadTicket(id);
  ticket.internalNotes.push({ author: adminUser._id, body });
  await ticket.save();
  const fresh = await loadTicket(ticket._id.toString());
  emitTicketUpdated(serializeAdminTicket(fresh));
  return serializeAdminTicket(fresh);
}

export async function addAdminReply(adminUser, id, { body, status }) {
  const ticket = await loadTicket(id);
  ticket.responses.push({
    author: adminUser._id,
    role: "admin",
    body,
  });
  if (status) {
    ticket.status = status;
  } else if (ticket.status === "Open") {
    ticket.status = "In Progress";
  }
  await ticket.save();
  const fresh = await loadTicket(ticket._id.toString());
  const authorUserId = await findAuthorUserId(fresh.author._id);
  emitTicketReply(serializeAdminTicket(fresh), authorUserId);
  return serializeAdminTicket(fresh);
}

export async function reclassify(id) {
  const ticket = await loadTicket(id);
  ticket.aiStatus = "pending";
  await ticket.save();
  const classified = await classifyTicketById(ticket._id);
  emitTicketAiReady(serializeAdminTicket(classified));
  return serializeAdminTicket(classified);
}

export async function generateAiDraft(id) {
  const ticket = await loadTicket(id);

  // Mark draft as pending
  ticket.aiDraft = {
    ...(ticket.aiDraft?.toObject?.() ?? {}),
    status: "pending",
  };
  await ticket.save();

  try {
    const { generateDraft } = await import("./ai/drafter.js");
    const book = ticket.book ?? null;
    const author = ticket.author ?? null;
    const { draft, model } = await generateDraft(ticket, book, author);

    ticket.aiDraft = {
      body: draft,
      generatedAt: new Date(),
      model,
      status: "ready",
    };
    await ticket.save();

    const fresh = await loadTicket(ticket._id.toString());
    emitTicketAiReady(serializeAdminTicket(fresh));
    return serializeAdminTicket(fresh);
  } catch (err) {
    ticket.aiDraft = {
      body: "",
      generatedAt: null,
      model: null,
      status: "failed",
    };
    await ticket.save();
    // Re-throw so the controller can handle AIUnavailableError vs other errors
    throw err;
  }
}

export async function getAdminStats() {
  const now = new Date();
  const tickets = await Ticket.find().select(
    "status category priority createdAt",
  );
  const counts = {
    byStatus: {},
    byCategory: {},
    byPriority: {},
    overdue: 0,
    total: tickets.length,
  };
  for (const ticket of tickets) {
    counts.byStatus[ticket.status] = (counts.byStatus[ticket.status] || 0) + 1;
    counts.byCategory[ticket.category] =
      (counts.byCategory[ticket.category] || 0) + 1;
    counts.byPriority[ticket.priority] =
      (counts.byPriority[ticket.priority] || 0) + 1;
    const { isOverdue } = serializeAdminTicket(ticket, now);
    if (isOverdue) counts.overdue += 1;
  }
  return counts;
}
