/**
 * AI evaluation script: run sample queries through the classification pipeline
 * and optionally generate draft replies to eyeball quality.
 *
 * Usage: npm run eval:ai
 *
 * Requires GROQ_API_KEY to be set. Falls back to rule-based classification if unset.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Must import AFTER dotenv so env is loaded
const { fallbackClassify } = await import('../services/ai/fallbackClassifier.js');
const { isAiConfigured } = await import('../config/env.js');

// 7 sample queries from the assignment table + 3 additional edge cases
const SAMPLES = [
  {
    label: 'Royalty overdue (Ananya Reddy)',
    subject: 'No royalty received after 4 months',
    description:
      'I published Between Two Temples months ago and still have not received any royalty. Bank details should already be on file. My book sold 67 copies. Please check what is going on.',
    bookStatus: 'Published & Live',
    expectedCategory: 'Royalty & Payments',
    expectedPriority: 'High',
  },
  {
    label: 'ISBN mismatch on Amazon (Priya Sharma)',
    subject: 'ISBN on Amazon does not match the printed copy',
    description:
      'Whispers of the Ganges is showing a different ISBN on Amazon than what is printed on the physical copy. This looks like a metadata mismatch. ISBN on book: 978-93-5XXXX-01-1.',
    bookStatus: 'Published & Live',
    expectedCategory: 'ISBN & Metadata Issues',
    expectedPriority: 'High',
  },
  {
    label: 'Blurry print quality (Rohit Kapoor)',
    subject: 'Author copies arrived with blurry pages',
    description:
      'I received my author copies of Code & Karma and the print quality is terrible. Images are blurry and a few pages are misaligned.',
    bookStatus: 'Published & Live',
    expectedCategory: 'Printing & Quality',
    expectedPriority: 'High',
  },
  {
    label: 'Book unavailable on Amazon (Diya Chatterjee)',
    subject: 'Book showing unavailable on Amazon',
    description:
      'Howrah Nights is published but it is showing as Currently Unavailable on Amazon India. Can you trigger a re-sync?',
    bookStatus: 'Published & Live',
    expectedCategory: 'Distribution & Availability',
    expectedPriority: 'High',
  },
  {
    label: 'Cover design stuck for weeks (Sneha Kulkarni)',
    subject: 'Cover design has been stuck for weeks',
    description:
      'Midnight in Mysore has been in cover design for 3 weeks. When will typesetting start? I have not received any update.',
    bookStatus: 'In Production - Cover Design',
    expectedCategory: 'Book Status & Production Updates',
    expectedPriority: 'Medium',
  },
  {
    label: 'Below threshold royalty (Kavita Deshmukh)',
    subject: 'Pending royalty below threshold?',
    description:
      'The Nagpur Notebooks shows pending royalty of 850 rupees. Why has this not been paid yet? Is there a minimum threshold?',
    bookStatus: 'Published & Live',
    expectedCategory: 'Royalty & Payments',
    expectedPriority: 'Medium',
  },
  {
    label: 'General metadata update request',
    subject: 'How do I update my author bio?',
    description: 'I want to update my author bio on the BookLeaf store and also on Amazon. How do I do this?',
    bookStatus: 'Published & Live',
    expectedCategory: 'General Inquiry',
    expectedPriority: 'Low',
  },
  {
    label: 'Critical: ISBN duplicate threat to escalate',
    subject: 'Wrong book linked to my ISBN - I will escalate legally',
    description:
      'My ISBN 978-93-5XXXX-11-0 is showing a completely different book on Flipkart. This is a serious mistake that affects my reputation. I will take legal action if not resolved in 24 hours.',
    bookStatus: 'Published & Live',
    expectedCategory: 'ISBN & Metadata Issues',
    expectedPriority: 'Critical',
  },
  {
    label: 'Months of missing royalty (Critical escalation)',
    subject: 'No royalty for 6 months - threatening to leave BookLeaf',
    description:
      'I have not received any royalty payment for 6 months despite selling hundreds of copies. I am seriously considering moving to another publisher. This is unacceptable.',
    bookStatus: 'Published & Live',
    expectedCategory: 'Royalty & Payments',
    expectedPriority: 'Critical',
  },
  {
    label: 'Production typesetting query',
    subject: 'What stage is my book in currently?',
    description:
      'Raising Roots has been with your team for a while now. Last I heard it was in typesetting. Can you please give me an update on when it will be ready for proofreading?',
    bookStatus: 'In Production - Typesetting',
    expectedCategory: 'Book Status & Production Updates',
    expectedPriority: 'Medium',
  },
];

async function classifyWithAi(sample) {
  const { classifyWithGroq } = await import('../services/ai/groqClassify.js');
  return classifyWithGroq({
    subject: sample.subject,
    description: sample.description,
    bookStatus: sample.bookStatus,
  });
}

function printResult(label, expected, actual, source) {
  const catOk = actual.category === expected.expectedCategory ? '✅' : '❌';
  const priOk = actual.priority === expected.expectedPriority ? '✅' : '❌';
  console.log(`\n── ${label} [${source}]`);
  console.log(`   Category : ${catOk} ${actual.category} (expected: ${expected.expectedCategory})`);
  console.log(`   Priority : ${priOk} ${actual.priority} (expected: ${expected.expectedPriority})`);
  console.log(`   Reason   : ${actual.reason}`);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  BookLeaf AI Evaluation — Classification Accuracy');
  console.log(`  AI configured: ${isAiConfigured() ? 'YES (Groq)' : 'NO (fallback rules only)'}`);
  console.log('═══════════════════════════════════════════════════════');

  let correct = 0;
  let total = 0;

  for (const sample of SAMPLES) {
    total++;
    let result;
    let source = 'rules';

    if (isAiConfigured()) {
      try {
        result = await classifyWithAi(sample);
        source = 'groq';
      } catch (err) {
        console.warn(`  ⚠ AI failed for "${sample.label}": ${err.message}. Using fallback.`);
        result = fallbackClassify({ subject: sample.subject, description: sample.description });
      }
    } else {
      result = fallbackClassify({ subject: sample.subject, description: sample.description });
    }

    printResult(sample.label, sample, result, source);
    if (result.category === sample.expectedCategory && result.priority === sample.expectedPriority) {
      correct++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  Classification accuracy: ${correct}/${total} (${Math.round((correct / total) * 100)}%)`);
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('Eval failed:', err.message);
  process.exit(1);
});
