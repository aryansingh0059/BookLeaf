import bcrypt from 'bcrypt';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDb, disconnectDb } from '../config/db.js';
import { Author, Book, Counter, Ticket, User } from '../models/index.js';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BCRYPT_COST = 11;
const AUTHOR_PASSWORD = 'Author@123';
const ADMIN_PASSWORD = 'Admin@123';

const SAMPLE_TICKETS = [
  {
    ticketNumber: 'BL-1042',
    authorId: 'AUTH003',
    bookId: 'BK005',
    subject: 'No royalty received after 4 months',
    description:
      'I published Between Two Temples months ago and still have not received any royalty. Bank details should already be on file. Please check what is going on.',
    category: 'Royalty & Payments',
    priority: 'High',
    status: 'Open',
  },
  {
    ticketNumber: 'BL-1043',
    authorId: 'AUTH001',
    bookId: 'BK001',
    subject: 'ISBN on Amazon does not match the printed copy',
    description:
      'Whispers of the Ganges is showing a different ISBN on Amazon than what is printed on the physical copy. This looks like a metadata mismatch.',
    category: 'ISBN & Metadata Issues',
    priority: 'High',
    status: 'In Progress',
  },
  {
    ticketNumber: 'BL-1044',
    authorId: 'AUTH002',
    bookId: 'BK003',
    subject: 'Author copies arrived with blurry pages',
    description:
      'I received my author copies of Code & Karma and the print quality is terrible. Images are blurry and a few pages are misaligned.',
    category: 'Printing & Quality',
    priority: 'High',
    status: 'Open',
  },
  {
    ticketNumber: 'BL-1045',
    authorId: 'AUTH007',
    bookId: 'BK013',
    subject: 'Cover design has been stuck for weeks',
    description:
      'Midnight in Mysore has been in cover design for 3 weeks. When will typesetting start? I have not received any update.',
    category: 'Book Status & Production Updates',
    priority: 'Medium',
    status: 'Open',
  },
  {
    ticketNumber: 'BL-1046',
    authorId: 'AUTH009',
    bookId: 'BK016',
    subject: 'Pending royalty below threshold?',
    description:
      'The Nagpur Notebooks shows pending royalty of 850 rupees. Why has this not been paid yet? Is there a minimum threshold?',
    category: 'Royalty & Payments',
    priority: 'Medium',
    status: 'Resolved',
  },
  {
    ticketNumber: 'BL-1047',
    authorId: 'AUTH010',
    bookId: 'BK018',
    subject: 'Book showing unavailable on Amazon',
    description:
      'Howrah Nights is published but it is showing as Currently Unavailable on Amazon India. Can you trigger a re-sync?',
    category: 'Distribution & Availability',
    priority: 'High',
    status: 'Open',
  },
];

function parseDate(value) {
  return value ? new Date(value) : null;
}

async function seedAdmins(passwordHash) {
  const admins = [
    { email: 'admin@bookleaf.com', name: 'BookLeaf Admin' },
    { email: 'ops@bookleaf.com', name: 'BookLeaf Ops' },
  ];

  for (const admin of admins) {
    await User.findOneAndUpdate(
      { email: admin.email },
      {
        email: admin.email,
        name: admin.name,
        role: 'admin',
        passwordHash,
        authorRef: null,
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
  }
}

async function seedSampleTickets(authorsById, booksById) {
  const existing = await Ticket.countDocuments();
  if (existing > 0) {
    logger.info({ existing }, 'Tickets already present; skipping sample tickets');
    return;
  }

  const ops = await User.findOne({ email: 'ops@bookleaf.com' });

  for (const sample of SAMPLE_TICKETS) {
    const author = authorsById.get(sample.authorId);
    const book = booksById.get(sample.bookId);
    await Ticket.create({
      ticketNumber: sample.ticketNumber,
      author: author._id,
      book: book?._id ?? null,
      subject: sample.subject,
      description: sample.description,
      status: sample.status,
      category: sample.category,
      aiCategory: sample.category,
      priority: sample.priority,
      aiPriority: sample.priority,
      aiPriorityReason: 'Seeded sample ticket',
      aiStatus: 'done',
      assignedTo: sample.status === 'In Progress' ? ops?._id : null,
      responses:
        sample.status === 'Resolved'
          ? [
              {
                author: ops._id,
                role: 'admin',
                body: 'Pending royalty is below the Rs 1,000 payout threshold, so it will roll over to the next quarterly cycle. Next payout window is 45 days after quarter end.',
              },
            ]
          : [],
    });
  }

  await Counter.findByIdAndUpdate('ticket', { seq: 1047 }, { upsert: true });
}

async function seed() {
  await connectDb();
  const dataPath = path.resolve(__dirname, '../../data/bookleaf_sample_data.json');
  const raw = await fs.readFile(dataPath, 'utf8');
  const payload = JSON.parse(raw);

  const authorPasswordHash = await bcrypt.hash(AUTHOR_PASSWORD, BCRYPT_COST);
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_COST);

  await seedAdmins(adminPasswordHash);

  const authorsById = new Map();
  const booksById = new Map();

  for (const record of payload.authors) {
    const author = await Author.findOneAndUpdate(
      { authorId: record.author_id },
      {
        authorId: record.author_id,
        name: record.name,
        email: record.email.toLowerCase(),
        phone: record.phone,
        city: record.city,
        joinedDate: parseDate(record.joined_date),
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    authorsById.set(record.author_id, author);

    await User.findOneAndUpdate(
      { email: record.email.toLowerCase() },
      {
        email: record.email.toLowerCase(),
        name: record.name,
        role: 'author',
        passwordHash: authorPasswordHash,
        authorRef: author._id,
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );

    for (const book of record.books) {
      const saved = await Book.findOneAndUpdate(
        { bookId: book.book_id },
        {
          bookId: book.book_id,
          author: author._id,
          title: book.title,
          isbn: book.isbn,
          genre: book.genre,
          publicationDate: parseDate(book.publication_date),
          status: book.status,
          mrp: book.mrp,
          authorRoyaltyPerCopy: book.author_royalty_per_copy,
          totalCopiesSold: book.total_copies_sold,
          totalRoyaltyEarned: book.total_royalty_earned,
          royaltyPaid: book.royalty_paid,
          royaltyPending: book.royalty_pending,
          lastRoyaltyPayoutDate: parseDate(book.last_royalty_payout_date),
          printPartner: book.print_partner,
          availableOn: book.available_on || [],
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      );
      booksById.set(book.book_id, saved);
    }
  }

  await seedSampleTickets(authorsById, booksById);
  logger.info(
    {
      authors: authorsById.size,
      books: booksById.size,
    },
    'Seed complete',
  );
  await disconnectDb();
}

seed().catch((err) => {
  logger.error({ err: { message: err.message } }, 'Seed failed');
  process.exit(1);
});
