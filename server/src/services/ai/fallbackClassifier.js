import { TICKET_CATEGORIES } from '../../config/constants.js';

const RULES = [
  { category: 'Royalty & Payments', pattern: /royalt|payment|payout|bank transfer|threshold/i },
  { category: 'ISBN & Metadata Issues', pattern: /isbn|metadata|imprint/i },
  { category: 'Printing & Quality', pattern: /print|misprint|binding|blurry|misaligned|reprint|defective/i },
  { category: 'Distribution & Availability', pattern: /amazon|flipkart|unavailable|listing|stock sync|currently unavailable/i },
  { category: 'Book Status & Production Updates', pattern: /status|typesetting|cover|proof|production|manuscript/i },
];

export function fallbackClassify({ subject = '', description = '' }) {
  const text = `${subject}\n${description}`;
  let category = 'General Inquiry';
  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      category = rule.category;
      break;
    }
  }

  let priority = 'Medium';
  if (category === 'ISBN & Metadata Issues') {
    priority = 'High';
  }
  if (/months|not received|urgent|escalate|legal|threat/i.test(text)) {
    priority = priority === 'Medium' ? 'High' : priority;
  }
  if (/6 months|lawsuit|lawyer|data breach/i.test(text)) {
    priority = 'Critical';
  }

  if (!TICKET_CATEGORIES.includes(category)) {
    category = 'General Inquiry';
  }

  return {
    category,
    priority,
    reason: 'Keyword fallback classification',
    source: 'rules',
  };
}
