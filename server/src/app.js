import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { corsOrigin } from "./config/corsOrigin.js";
import { authRouter } from "./routes/auth.js";
import { booksRouter } from "./routes/books.js";
import { ticketsRouter } from "./routes/tickets.js";
import { adminRouter } from "./routes/admin.js";
import { healthRouter } from "./routes/health.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const swaggerDoc = parseYaml(
  readFileSync(path.join(__dirname, "../openapi.yaml"), "utf8"),
);

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          styleSrc: ["'self'"],
        },
      },
    }),
  );
  app.use(
    "/api/docs",
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    }),
  );
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  if (env.NODE_ENV !== "test") {
    app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  }

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", apiLimiter);

  app.get("/", (req, res) => {
    res.json({
      name: "BookLeaf API",
      status: "ok",
      docs: "/api/docs",
      health: "/api/v1/health",
    });
  });
  app.get("/api/docs.json", (req, res) => {
    res.json(swaggerDoc);
  });
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/books", booksRouter);
  app.use("/api/v1/tickets", ticketsRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/health", healthRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
