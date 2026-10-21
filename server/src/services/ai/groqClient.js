import Groq from "groq-sdk";
import { env, isAiConfigured } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { AIUnavailableError } from "../../utils/ApiError.js";

let groqInstance = null;

function getGroq() {
  if (!isAiConfigured()) {
    throw new AIUnavailableError("GROQ_API_KEY is not configured");
  }
  if (!groqInstance) {
    groqInstance = new Groq({ apiKey: env.GROQ_API_KEY });
  }
  return groqInstance;
}

// Simple in-memory circuit breaker
const circuitBreaker = {
  failures: 0,
  openedAt: null,
  THRESHOLD: 5,
  RESET_MS: 60_000,
  isOpen() {
    if (!this.openedAt) return false;
    if (Date.now() - this.openedAt > this.RESET_MS) {
      this.failures = 0;
      this.openedAt = null;
      return false;
    }
    return true;
  },
  recordSuccess() {
    this.failures = 0;
    this.openedAt = null;
  },
  recordFailure() {
    this.failures += 1;
    if (this.failures >= this.THRESHOLD) {
      this.openedAt = Date.now();
      logger.warn({ failures: this.failures }, "AI circuit breaker OPEN");
    }
  },
};

/**
 * Sleep for `ms` milliseconds.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Core wrapper: calls groq-sdk with timeout, 2 retries, exponential backoff.
 * Logs model, latency, and token usage. Never logs prompt contents at info level.
 *
 * @param {import('groq-sdk').Groq.Chat.ChatCompletionCreateParamsNonStreaming} params
 * @returns {Promise<import('groq-sdk').Groq.Chat.ChatCompletion>}
 */
export async function callGroq(params) {
  if (!isAiConfigured()) {
    throw new AIUnavailableError("AI is not configured");
  }
  if (circuitBreaker.isOpen()) {
    throw new AIUnavailableError(
      "AI circuit breaker is open; retrying after cooldown",
    );
  }

  const groq = getGroq();
  const timeoutMs = env.AI_TIMEOUT_MS;
  const maxRetries = 2;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const start = Date.now();
    try {
      const completion = await Promise.race([
        groq.chat.completions.create(params),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                Object.assign(new Error("AI call timed out"), {
                  code: "TIMEOUT",
                }),
              ),
            timeoutMs,
          ),
        ),
      ]);

      const latencyMs = Date.now() - start;
      logger.info(
        {
          model: params.model,
          latencyMs,
          promptTokens: completion.usage?.prompt_tokens,
          completionTokens: completion.usage?.completion_tokens,
        },
        "Groq call succeeded",
      );

      circuitBreaker.recordSuccess();
      return completion;
    } catch (err) {
      lastError = err;
      const latencyMs = Date.now() - start;
      const status = err?.status ?? err?.statusCode ?? 0;
      const isRetryable =
        err.code === "TIMEOUT" || status === 429 || status >= 500;

      logger.warn(
        {
          model: params.model,
          attempt,
          latencyMs,
          status,
          errMessage: err.message,
        },
        "Groq call failed",
      );

      if (!isRetryable || attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter; honor Retry-After header
      const retryAfterMs = err?.headers?.["retry-after"]
        ? parseInt(err.headers["retry-after"], 10) * 1000
        : null;
      const backoffMs =
        retryAfterMs ?? 500 * 2 ** attempt + Math.random() * 200;
      await sleep(backoffMs);
    }
  }

  circuitBreaker.recordFailure();
  throw new AIUnavailableError(
    `Groq call failed after retries: ${lastError?.message}`,
    lastError,
  );
}
