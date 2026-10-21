export const ROLES = Object.freeze({
  AUTHOR: 'author',
  ADMIN: 'admin',
});

export const TICKET_STATUSES = Object.freeze([
  'Open',
  'In Progress',
  'Resolved',
  'Closed',
]);

export const TICKET_CATEGORIES = Object.freeze([
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
]);

export const TICKET_PRIORITIES = Object.freeze(['Critical', 'High', 'Medium', 'Low']);

export const PRIORITY_WEIGHT = Object.freeze({
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
});

export const AI_STATUSES = Object.freeze(['pending', 'done', 'failed', 'skipped']);

export const OVERDUE_HOURS = Object.freeze({
  Critical: 24,
  High: 48,
  Medium: 24 * 5,
  Low: 24 * 10,
});
