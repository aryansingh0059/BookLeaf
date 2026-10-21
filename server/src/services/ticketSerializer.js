import { OVERDUE_HOURS, PRIORITY_WEIGHT } from "../config/constants.js";
import { royaltyFacts } from "./royalty.js";

const AUTHOR_OMIT = [
  "internalNotes",
  "aiDraft",
  "aiCategory",
  "aiPriority",
  "aiPriorityReason",
  "aiStatus",
  "categoryOverriddenBy",
  "priorityOverriddenBy",
  "__v",
];

function toPlain(doc) {
  if (!doc) return null;
  return typeof doc.toObject === "function"
    ? doc.toObject({ virtuals: true })
    : { ...doc };
}

function computeAge(ticket, now = new Date()) {
  const created = new Date(ticket.createdAt);
  const ageHours = Math.round(((now - created) / 36e5) * 10) / 10;
  const unresolved =
    ticket.status === "Open" || ticket.status === "In Progress";
  const limit = OVERDUE_HOURS[ticket.priority] ?? OVERDUE_HOURS.Medium;
  return {
    ageHours,
    isOverdue: unresolved && ageHours > limit,
  };
}

export function serializeAuthorTicket(ticket) {
  const plain = toPlain(ticket);
  for (const key of AUTHOR_OMIT) {
    delete plain[key];
  }
  if (plain.author && plain.author._id) {
    plain.author = {
      id: plain.author._id.toString(),
      name: plain.author.name,
      authorId: plain.author.authorId,
    };
  }
  if (plain.book && plain.book._id) {
    plain.book = {
      id: plain.book._id.toString(),
      bookId: plain.book.bookId,
      title: plain.book.title,
      status: plain.book.status,
    };
  }
  return plain;
}

export function serializeAdminTicket(ticket, now = new Date()) {
  const plain = toPlain(ticket);
  const { ageHours, isOverdue } = computeAge(plain, now);
  plain.ageHours = ageHours;
  plain.isOverdue = isOverdue;
  plain.priorityWeight = PRIORITY_WEIGHT[plain.priority] ?? 0;
  plain.classifiedByRules =
    plain.aiStatus === "failed" || plain.aiStatus === "skipped";
  if (plain.book) {
    plain.royalty = royaltyFacts(plain.book);
  }
  return plain;
}
