import { describe, it, expect, vi } from "vitest";
import { withRetry } from "@/utils/retry";

function failWith(status) {
  return Object.assign(new Error(`HTTP ${status}`), { status });
}

const fast = { baseDelayMs: 0, maxDelayMs: 0 };

describe("withRetry", () => {
  it("retries a 5xx by default", async () => {
    const fn = vi.fn().mockRejectedValueOnce(failWith(504)).mockResolvedValue("ok");

    await expect(withRetry(fn, fast)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry a 4xx", async () => {
    const fn = vi.fn().mockRejectedValue(failWith(413));

    await expect(withRetry(fn, fast)).rejects.toThrow("HTTP 413");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("stops when shouldRetry rejects the error", async () => {
    const fn = vi.fn().mockRejectedValue(failWith(504));
    const shouldRetry = (err) => err.status === 503;

    await expect(withRetry(fn, { ...fast, shouldRetry })).rejects.toThrow("HTTP 504");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries when shouldRetry accepts the error", async () => {
    const fn = vi.fn().mockRejectedValueOnce(failWith(503)).mockResolvedValue("ok");
    const shouldRetry = (err) => err.status === 503;

    await expect(withRetry(fn, { ...fast, shouldRetry })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
