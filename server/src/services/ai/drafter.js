import { env, isAiConfigured } from '../../config/env.js';
import { callGroq } from './groqClient.js';
import { buildDraftSystemPrompt, buildDraftUserPrompt } from './prompts.js';
import { getKbSection, FEW_SHOT_EXAMPLES } from './knowledgeBase.js';
import { royaltyFacts, nextPayoutDate } from '../royalty.js';
import { AIUnavailableError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';

/**
 * Sanitize user-supplied text before sending to the model.
 * Strips HTML tags and truncates.
 */
function sanitize(text, maxLen = 2000) {
  return String(text ?? '')
    .replace(/<[^>]*>/g, '')
    .slice(0, maxLen);
}

/**
 * Build a human-readable book facts string from the book document.
 * All numbers come from the database — the model must not invent any.
 */
function buildBookFacts(book, author) {
  if (!book) {
    return `No specific book associated with this ticket (General / Account Level query).
Author: ${author?.name ?? 'Unknown'}
Next royalty payout date (approx): ${nextPayoutDate().toISOString().slice(0, 10)}`;
  }

  const facts = royaltyFacts(book);
  const fmt = (n) => (n == null ? 'N/A' : `₹${Number(n).toLocaleString('en-IN')}`);

  const lines = [
    `Author: ${author?.name ?? 'Unknown'} (${author?.authorId ?? ''})`,
    `Book: "${book.title}" [${book.bookId}]`,
    `Genre: ${book.genre}`,
    `ISBN: ${book.isbn}`,
    `Status: ${book.status}`,
    `Publication Date: ${book.publicationDate ? new Date(book.publicationDate).toLocaleDateString('en-IN') : 'Not yet published'}`,
    `MRP: ${book.mrp != null ? fmt(book.mrp) : 'Pricing assigned at publication'}`,
    `Author Royalty Per Copy: ${book.authorRoyaltyPerCopy != null ? fmt(book.authorRoyaltyPerCopy) : 'N/A'}`,
    `Total Copies Sold: ${book.totalCopiesSold ?? 0}`,
    `Total Royalty Earned: ${fmt(book.totalRoyaltyEarned)}`,
    `Royalty Paid: ${fmt(book.royaltyPaid)}`,
    `Royalty Pending: ${fmt(book.royaltyPending)}`,
    `Last Royalty Payout Date: ${book.lastRoyaltyPayoutDate ? new Date(book.lastRoyaltyPayoutDate).toLocaleDateString('en-IN') : 'No payout yet'}`,
    `Print Partner: ${book.printPartner ?? 'Not assigned'}`,
    `Available On: ${book.availableOn?.length ? book.availableOn.join(', ') : 'Not yet listed'}`,
    `--- Computed Facts ---`,
    `Next Payout Date (approx): ${facts.nextPayoutDate}`,
    `Below Payout Threshold (₹1,000): ${facts.belowThreshold ? 'YES — will roll over to next quarter' : 'No'}`,
    `Never Paid Before: ${facts.neverPaid ? 'YES — first-time payout pending' : 'No'}`,
    `In Production (no royalties yet): ${facts.inProduction ? 'YES' : 'No'}`,
  ];

  return lines.join('\n');
}

/**
 * Generate an AI draft reply for a ticket using the high-quality 70B model.
 *
 * Cost-aware context:
 * 1. System prompt = persona + tone + relevant KB section + 1 few-shot example (~150+KB tokens)
 * 2. User prompt = structured book/author facts + last 3 thread messages + ticket
 * 3. max_tokens = 450, temperature = 0.3
 */
export async function generateDraft(ticket, book, author) {
  if (!isAiConfigured()) {
    throw new AIUnavailableError('AI draft is not available (GROQ_API_KEY not configured)');
  }

  const category = ticket.category ?? 'General Inquiry';
  const kbSection = getKbSection(category);
  const fewShotExample = FEW_SHOT_EXAMPLES[category] ?? null;

  const bookFacts = buildBookFacts(book, author);

  // Include only the last 3 messages from the thread to keep context lean
  const recentMessages = (ticket.responses ?? [])
    .slice(-3)
    .map((r) => ({ role: r.role, body: sanitize(r.body, 500) }));

  const systemPrompt = buildDraftSystemPrompt(kbSection);
  const userPrompt = buildDraftUserPrompt({
    bookFacts,
    ticket: {
      subject: sanitize(ticket.subject, 150),
      category,
      description: sanitize(ticket.description, 2000),
    },
    recentMessages,
    fewShotExample,
  });

  const completion = await callGroq({
    model: env.GROQ_DRAFT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 450,
  });

  const draft = completion.choices[0]?.message?.content?.trim() ?? '';
  const usedTokens = {
    prompt: completion.usage?.prompt_tokens ?? 0,
    completion: completion.usage?.completion_tokens ?? 0,
  };

  logger.info(
    {
      ticketNumber: ticket.ticketNumber,
      model: env.GROQ_DRAFT_MODEL,
      category,
      tokensPrompt: usedTokens.prompt,
      tokensCompletion: usedTokens.completion,
    },
    'Draft reply generated',
  );

  return { draft, model: env.GROQ_DRAFT_MODEL, usedTokens };
}
