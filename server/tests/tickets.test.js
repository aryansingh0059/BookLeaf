import bcrypt from 'bcrypt';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { Author } from '../src/models/Author.js';
import { Book } from '../src/models/Book.js';
import { User } from '../src/models/User.js';

let mongo;
let app;
let authorToken;
let adminToken;
let author2Token;
let author1;
let author2;
let book1;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const { createApp } = await import('../src/app.js');
  app = createApp();

  author1 = await Author.create({
    authorId: 'AUTH001',
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    phone: '+91-98765-43210',
    city: 'Mumbai',
    joinedDate: new Date('2023-03-15'),
  });

  author2 = await Author.create({
    authorId: 'AUTH002',
    name: 'Rohit Kapoor',
    email: 'rohit.kapoor@email.com',
    phone: '+91-87654-32109',
    city: 'Delhi',
    joinedDate: new Date('2022-11-08'),
  });

  book1 = await Book.create({
    bookId: 'BK001',
    author: author1._id,
    title: 'Whispers of the Ganges',
    isbn: '978-93-5XXXX-01-1',
    genre: 'Literary Fiction',
    publicationDate: new Date('2023-06-20'),
    status: 'Published & Live',
    mrp: 399,
    authorRoyaltyPerCopy: 35,
    totalCopiesSold: 342,
    totalRoyaltyEarned: 11970,
    royaltyPaid: 8400,
    royaltyPending: 3570,
    lastRoyaltyPayoutDate: new Date('2025-10-15'),
    printPartner: 'In-House',
    availableOn: ['Amazon India', 'Flipkart', 'BookLeaf Store'],
  });

  const user1 = await User.create({
    email: 'priya.sharma@email.com',
    name: 'Priya Sharma',
    role: 'author',
    passwordHash: await bcrypt.hash('Author@123', 10),
    authorRef: author1._id,
  });

  const user2 = await User.create({
    email: 'rohit.kapoor@email.com',
    name: 'Rohit Kapoor',
    role: 'author',
    passwordHash: await bcrypt.hash('Author@123', 10),
    authorRef: author2._id,
  });

  await User.create({
    email: 'admin@bookleaf.com',
    name: 'BookLeaf Admin',
    role: 'admin',
    passwordHash: await bcrypt.hash('Admin@123', 10),
  });

  const r1 = await request(app).post('/api/v1/auth/login').send({ email: 'priya.sharma@email.com', password: 'Author@123' });
  authorToken = r1.body.token;

  const r2 = await request(app).post('/api/v1/auth/login').send({ email: 'rohit.kapoor@email.com', password: 'Author@123' });
  author2Token = r2.body.token;

  const r3 = await request(app).post('/api/v1/auth/login').send({ email: 'admin@bookleaf.com', password: 'Admin@123' });
  adminToken = r3.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

// ─── RBAC: Author cannot access admin routes ─────────────────────────────
describe('RBAC', () => {
  it('author cannot access GET /admin/tickets', async () => {
    const res = await request(app)
      .get('/api/v1/admin/tickets')
      .set('Authorization', `Bearer ${authorToken}`);
    expect(res.status).toBe(403);
  });

  it('author cannot access GET /admin/stats', async () => {
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${authorToken}`);
    expect(res.status).toBe(403);
  });

  it('admin cannot access /books (author-only route)', async () => {
    const res = await request(app)
      .get('/api/v1/books')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  it('unauthenticated request is rejected', async () => {
    const res = await request(app).get('/api/v1/books');
    expect(res.status).toBe(401);
  });
});

// ─── Ticket creation without AI (GROQ_API_KEY is empty in test env) ──────
describe('ticket creation', () => {
  let ticketId;

  it('creates a ticket even with GROQ_API_KEY unset', async () => {
    expect(process.env.GROQ_API_KEY).toBeFalsy(); // confirmed by setupEnv.js
    const res = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        subject: 'My royalty is overdue',
        description: 'I have not received any royalty payment for my book for the past 4 months.',
        bookId: book1._id.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.ticketNumber).toMatch(/^BL-/);
    expect(res.body.data.status).toBe('Open');
    // AI fields should NOT be in the author's response
    expect(res.body.data.internalNotes).toBeUndefined();
    expect(res.body.data.aiDraft).toBeUndefined();
    ticketId = res.body.data._id;
  });

  it('after async classification (fallback), aiStatus is skipped', async () => {
    // Give the setImmediate background job time to run
    await new Promise((r) => setTimeout(r, 200));
    const { Ticket } = await import('../src/models/Ticket.js');
    const t = await Ticket.findById(ticketId);
    expect(t).toBeTruthy();
    expect(t.aiStatus).toBe('skipped'); // no API key → skipped
    expect(t.category).toBeTruthy();    // fallback classifier set a category
    expect(t.priority).toBeTruthy();
  });

  it('author cannot read another author\'s ticket', async () => {
    // Create a ticket as author1, then try to read it as author2
    const createRes = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        subject: 'ISBN mismatch on my book',
        description: 'The ISBN printed on my physical book does not match the one on Amazon.',
      });
    expect(createRes.status).toBe(201);
    const tId = createRes.body.data._id;

    const readRes = await request(app)
      .get(`/api/v1/tickets/${tId}`)
      .set('Authorization', `Bearer ${author2Token}`);
    expect(readRes.status).toBe(404); // Returns 404, not 403, to avoid leaking ticket existence
  });

  it('author response never contains internalNotes or aiDraft', async () => {
    const res = await request(app)
      .get('/api/v1/tickets')
      .set('Authorization', `Bearer ${authorToken}`);
    expect(res.status).toBe(200);
    for (const ticket of res.body.data) {
      expect(ticket.internalNotes).toBeUndefined();
      expect(ticket.aiDraft).toBeUndefined();
      expect(ticket.aiCategory).toBeUndefined();
      expect(ticket.aiPriority).toBeUndefined();
    }
  });

  it('validates ticket body', async () => {
    const res = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ subject: 'Hi', description: 'ok' }); // too short
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─── Admin ticket operations ──────────────────────────────────────────────
describe('admin ticket operations', () => {
  it('admin can list tickets', async () => {
    const res = await request(app)
      .get('/api/v1/admin/tickets')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(20);
  });

  it('admin can get stats', async () => {
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(0);
  });

  it('draft endpoint returns 503 when AI is not configured', async () => {
    // First create a ticket to get an ID
    const createRes = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        subject: 'Book status update needed',
        description: 'My book Whispers of the Ganges has been in production for a while now and I need a status update.',
      });
    const tId = createRes.body.data._id;

    const res = await request(app)
      .post(`/api/v1/admin/tickets/${tId}/draft`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('AI_UNAVAILABLE');
  });
});

// ─── Health check ─────────────────────────────────────────────────────────
describe('health', () => {
  it('GET /health returns status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('db');
    expect(res.body.ai).toHaveProperty('configured');
    // No secrets in the response
    expect(JSON.stringify(res.body)).not.toContain('GROQ_API_KEY');
    expect(JSON.stringify(res.body)).not.toContain('JWT_SECRET');
  });
});
