import bcrypt from "bcrypt";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { Author } from "../src/models/Author.js";
import { User } from "../src/models/User.js";

let mongo;
let app;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const { createApp } = await import("../src/app.js");
  app = createApp();

  const author = await Author.create({
    authorId: "AUTH001",
    name: "Priya Sharma",
    email: "priya.sharma@email.com",
    phone: "+91-98765-43210",
    city: "Mumbai",
    joinedDate: new Date("2023-03-15"),
  });

  await User.create({
    email: "priya.sharma@email.com",
    name: "Priya Sharma",
    role: "author",
    passwordHash: await bcrypt.hash("Author@123", 10),
    authorRef: author._id,
  });

  await User.create({
    email: "admin@bookleaf.com",
    name: "BookLeaf Admin",
    role: "admin",
    passwordHash: await bcrypt.hash("Admin@123", 10),
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

describe("auth", () => {
  it("serves public Swagger UI and the OpenAPI document", async () => {
    const docs = await request(app).get("/api/docs/");
    const spec = await request(app).get("/api/docs.json");

    expect(docs.status).toBe(200);
    expect(docs.headers["content-type"]).toMatch(/text\/html/);
    expect(docs.headers["content-security-policy"]).toContain(
      "'unsafe-inline'",
    );
    expect(spec.status).toBe(200);
    expect(spec.body.openapi).toBe("3.0.3");
    expect(spec.body.components.securitySchemes.bearerAuth.scheme).toBe(
      "bearer",
    );
    const documentedOperations = Object.entries(spec.body.paths)
      .flatMap(([path, methods]) =>
        Object.keys(methods)
          .filter((method) =>
            ["get", "post", "patch", "put", "delete"].includes(method),
          )
          .map((method) => `${method.toUpperCase()} ${path}`),
      )
      .sort();
    expect(documentedOperations).toEqual(
      [
        "GET /",
        "POST /auth/login",
        "GET /auth/me",
        "GET /books",
        "GET /books/{id}",
        "GET /tickets",
        "POST /tickets",
        "GET /tickets/{id}",
        "POST /tickets/{id}/replies",
        "GET /admin/tickets",
        "GET /admin/tickets/{id}",
        "PATCH /admin/tickets/{id}",
        "POST /admin/tickets/{id}/assign-me",
        "POST /admin/tickets/{id}/notes",
        "POST /admin/tickets/{id}/draft",
        "POST /admin/tickets/{id}/reply",
        "POST /admin/tickets/{id}/reclassify",
        "GET /admin/stats",
        "GET /health",
      ].sort(),
    );
  });

  it("returns API root links", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      name: "BookLeaf API",
      status: "ok",
      docs: "/api/docs",
      health: "/api/v1/health",
    });
    expect(res.headers["content-security-policy"]).not.toContain(
      "'unsafe-inline'",
    );
  });

  it("allows configured frontend origins and rejects unconfigured origins", async () => {
    const previewOrigin =
      "https://book-leaf-2u53y3rgi-aryan-kumars-projects-38c41021.vercel.app";
    const allowed = await request(app)
      .options("/api/v1/auth/login")
      .set("Origin", previewOrigin)
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type");
    const rejected = await request(app)
      .options("/api/v1/auth/login")
      .set("Origin", "https://untrusted.example")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type");

    expect(allowed.headers["access-control-allow-origin"]).toBe(previewOrigin);
    expect(rejected.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("logs in an author and returns a token", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "priya.sharma@email.com",
      password: "Author@123",
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("author");
    expect(res.body.user.authorId).toBe("AUTH001");
  });

  it("returns the same error for unknown email and wrong password", async () => {
    const unknown = await request(app).post("/api/v1/auth/login").send({
      email: "nobody@email.com",
      password: "Author@123",
    });
    const wrong = await request(app).post("/api/v1/auth/login").send({
      email: "priya.sharma@email.com",
      password: "WrongPass@1",
    });
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body.error.message).toBe(wrong.body.error.message);
    expect(unknown.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns the current user for a valid token", async () => {
    const login = await request(app).post("/api/v1/auth/login").send({
      email: "admin@bookleaf.com",
      password: "Admin@123",
    });
    const me = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.role).toBe("admin");
    expect(me.body.user.email).toBe("admin@bookleaf.com");
  });

  it("rejects unauthenticated /me", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });
});
