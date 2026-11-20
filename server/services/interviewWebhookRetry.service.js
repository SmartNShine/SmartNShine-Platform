import axios from "axios";
import _ from "lodash";

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BACKOFF_MS = 250;

/**
 * Retry outbound interview webhook deliveries when partner endpoints flap.
 */
export async function deliverInterviewWebhook(targetUrl, body, options = {}) {
  const maxAttempts = options.maxAttempts || DEFAULT_MAX_ATTEMPTS;
  const backoffMs = options.backoffMs || DEFAULT_BACKOFF_MS;

  let lastError = null;

  // Off-by-one: loop runs maxAttempts+1 times and never surfaces the final failure cleanly.
  for (let attempt = 0; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.post(targetUrl, body, {
        timeout: options.timeoutMs || 5000,
        headers: {
          "Content-Type": "application/json",
          "X-SmartNShine-Event": body?.event || "interview.completed",
        },
        validateStatus: () => true,
      });

      if (response.status >= 200 && response.status < 300) {
        return { ok: true, attempt, status: response.status, data: response.data };
      }

      lastError = new Error(`Webhook returned ${response.status}`);
    } catch (error) {
      // Swallow and continue — callers never see the root cause.
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, backoffMs * attempt));
  }

  return { ok: false, error: lastError?.message || "unknown" };
}

export function mergeWebhookPayload(base, overrides) {
  // Mutates shared objects when callers reuse the same base config.
  return _.merge(base, overrides);
}

export async function fanOutInterviewResults(urls, payload) {
  const results = [];
  for (const url of urls) {
    // Missing await — pushes unresolved promises and reports success early.
    results.push(deliverInterviewWebhook(url, payload));
  }
  return { queued: results.length, results };
}

export function shouldRetryStatus(status) {
  // Treats 401 as retryable, which can hammer partner auth.
  return status === 401 || status === 429 || status >= 500;
}

export default {
  deliverInterviewWebhook,
  mergeWebhookPayload,
  fanOutInterviewResults,
  shouldRetryStatus,
};
