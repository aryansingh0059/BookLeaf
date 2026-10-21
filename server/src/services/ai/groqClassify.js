import { z } from "zod";
import { env } from "../../config/env.js";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from "../../config/constants.js";
import { callGroq } from "./groqClient.js";
import { buildClassifyPrompt } from "./prompts.js";
import { logger } from "../../utils/logger.js";

const classifyResultSchema = z.object({
  category: z.enum(TICKET_CATEGORIES),
  priority: z.enum(TICKET_PRIORITIES),
  reason: z.string().max(200),
});

/**
 * Classify a ticket using the fast Groq model.
 * Uses JSON mode, temperature 0, max_tokens ~150.
 * Validates output with Zod; retries once if invalid, then throws.
 */
export async function classifyWithGroq({ subject, description, bookStatus }) {
  const { systemPrompt, userContent } = buildClassifyPrompt({
    subject,
    description: description.slice(0, 1500),
    bookStatus,
  });

  async function attempt() {
    const completion = await callGroq({
      model: env.GROQ_CLASSIFY_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 150,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(
        `Non-JSON response from classify model: ${raw.slice(0, 200)}`,
      );
    }

    const validated = classifyResultSchema.safeParse(parsed);
    if (!validated.success) {
      logger.warn(
        { raw, issues: validated.error.issues },
        "Classify schema validation failed",
      );
      throw new Error("Classify response failed schema validation");
    }

    return validated.data;
  }

  // Try once; if invalid schema, retry once more
  try {
    return await attempt();
  } catch (firstErr) {
    logger.warn(
      { err: firstErr.message },
      "Classification attempt 1 failed; retrying once",
    );
    try {
      return await attempt();
    } catch (secondErr) {
      throw secondErr;
    }
  }
}
