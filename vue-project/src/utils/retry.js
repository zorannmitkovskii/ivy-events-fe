function isNotClientError(err) {
  const status = err?.response?.status ?? err?.status;
  return !(status >= 400 && status < 500);
}

/**
 * Retry an async function with exponential backoff.
 * By default stops retrying on 4xx client errors (the request itself is bad);
 * pass `shouldRetry` to narrow it further.
 */
export async function withRetry(fn, opts = {}) {
  const {
    retries = 3,
    baseDelayMs = 600,
    maxDelayMs = 5000,
    onAttempt = null,
    shouldRetry = isNotClientError,
  } = opts;

  let attempt = 0;
  while (true) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries || !shouldRetry(err)) throw err;

      const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt))
        + Math.floor(Math.random() * 200);
      attempt++;
      if (onAttempt) onAttempt(attempt, err, delay);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

/**
 * Fire-and-forget wrapper: returns immediately, runs the upload with retry
 * in the background. Callers can pass onSuccess/onError callbacks to react.
 */
export function runInBackgroundWithRetry(fn, { onSuccess, onError, ...retryOpts } = {}) {
  withRetry(fn, retryOpts)
    .then((res) => onSuccess?.(res))
    .catch((err) => onError?.(err));
}
