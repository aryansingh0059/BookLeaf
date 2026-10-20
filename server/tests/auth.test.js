import bcrypt from 'bcrypt';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { Author } from '../src/models/Author.js';
import { User } from '../src/models/User.js';

let mongo;
let app;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const { createApp } = await import('../src/app.js');
  app = createApp();

  const author = await Author.create({
    authorId: 'AUTH001',
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    phone: '+91-98765-43210',
    city: 'Mumbai',
    joinedDate: new Date('2023-03-15'),
  });

  await User.create({
    email: 'priya.sharma@email.com',
    name: 'Priya Sharma',
    role: 'author',
    passwordHash: await bcrypt.hash('Author@123', 10),
    authorRef: author._id,
  });

  await User.create({
    email: 'admin@bookleaf.com',
    name: 'BookLeaf Admin',
    role: 'admin',
    passwordHash: await bcrypt.hash('Admin@123', 10),
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

describe('auth', () => {
  it('logs in an author and returns a token', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'priya.sharma@email.com',
      password: 'Author@123',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('author');
    expect(res.body.user.authorId).toBe('AUTH001');
  });

  it('returns the same error for unknown email and wrong password', async () => {
    const unknown = await request(app).post('/api/v1/auth/login').send({
      email: 'nobody@email.com',
      password: 'Author@123',
    });
    const wrong = await request(app).post('/api/v1/auth/login').send({
      email: 'priya.sharma@email.com',
      password: 'WrongPass@1',
    });
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body.error.message).toBe(wrong.body.error.message);
    expect(unknown.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns the current user for a valid token', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@bookleaf.com',
      password: 'Admin@123',
    });
    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.role).toBe('admin');
    expect(me.body.user.email).toBe('admin@bookleaf.com');
  });

  it('rejects unauthenticated /me', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
