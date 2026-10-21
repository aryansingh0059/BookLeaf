import { logger } from "../utils/logger.js";

let ioRef = null;

export function setIo(io) {
  ioRef = io;
}

function authorSafeTicket(ticket) {
  if (!ticket) return ticket;
  const plain =
    typeof ticket.toObject === "function" ? ticket.toObject() : { ...ticket };
  delete plain.internalNotes;
  delete plain.aiDraft;
  delete plain.aiCategory;
  delete plain.aiPriority;
  delete plain.aiPriorityReason;
  delete plain.aiStatus;
  delete plain.categoryOverriddenBy;
  delete plain.priorityOverriddenBy;
  return plain;
}

export function emitTicketCreated(ticket) {
  ioRef?.to("admins").emit("ticket:created", ticket);
}

export function emitTicketUpdated(ticket, authorUserId) {
  ioRef?.to("admins").emit("ticket:updated", ticket);
  if (authorUserId) {
    ioRef
      ?.to(`user:${authorUserId}`)
      .emit("ticket:updated", authorSafeTicket(ticket));
  }
}

export function emitTicketReply(ticket, authorUserId) {
  if (authorUserId) {
    ioRef
      ?.to(`user:${authorUserId}`)
      .emit("ticket:reply", authorSafeTicket(ticket));
  }
  ioRef?.to("admins").emit("ticket:updated", ticket);
}

export function emitTicketAiReady(ticket) {
  ioRef?.to("admins").emit("ticket:ai-ready", ticket);
  logger.debug({ ticketNumber: ticket.ticketNumber }, "ticket:ai-ready");
}
