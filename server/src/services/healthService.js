import { isAiConfigured } from "../config/env.js";
import { isDbConnected } from "../config/db.js";

export function getHealth() {
  const db = isDbConnected();
  return {
    status: db ? "ok" : "degraded",
    db: db ? "connected" : "disconnected",
    ai: {
      configured: isAiConfigured(),
      classifyModel: process.env.GROQ_CLASSIFY_MODEL || "openai/gpt-oss-20b",
      draftModel: process.env.GROQ_DRAFT_MODEL || "openai/gpt-oss-120b",
    },
  };
}
