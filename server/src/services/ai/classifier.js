import { env, isAiConfigured } from '../../config/env.js';
import { Ticket } from '../../models/Ticket.js';
import { logger } from '../../utils/logger.js';
import { fallbackClassify } from './fallbackClassifier.js';

export async function classifyTicketById(ticketId) {
  const ticket = await Ticket.findById(ticketId).populate('book');
  if (!ticket) return null;

  const input = {
    subject: ticket.subject,
    description: ticket.description,
    bookStatus: ticket.book?.status ?? 'General / Account Level',
  };

  if (!isAiConfigured()) {
    const fallback = fallbackClassify(input);
    ticket.category = fallback.category;
    ticket.priority = fallback.priority;
    ticket.aiCategory = fallback.category;
    ticket.aiPriority = fallback.priority;
    ticket.aiPriorityReason = 'AI skipped (no API key); classified by rules';
    ticket.aiStatus = 'skipped';
    await ticket.save();
    logger.warn({ ticketId: ticket.ticketNumber }, 'AI skipped; used fallback classifier');
    return ticket;
  }

  try {
    const { classifyWithGroq } = await import('./groqClassify.js');
    const result = await classifyWithGroq(input);
    ticket.category = result.category;
    ticket.priority = result.priority;
    ticket.aiCategory = result.category;
    ticket.aiPriority = result.priority;
    ticket.aiPriorityReason = result.reason;
    ticket.aiStatus = 'done';
    await ticket.save();
    return ticket;
  } catch (err) {
    const fallback = fallbackClassify(input);
    ticket.category = fallback.category;
    ticket.priority = fallback.priority;
    ticket.aiCategory = fallback.category;
    ticket.aiPriority = fallback.priority;
    ticket.aiPriorityReason = 'AI unavailable, classified by rules, please review';
    ticket.aiStatus = 'failed';
    await ticket.save();
    logger.warn(
      { ticketId: ticket.ticketNumber, err: err.message, model: env.GROQ_CLASSIFY_MODEL },
      'AI classification failed; used fallback',
    );
    return ticket;
  }
}
