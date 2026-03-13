/* eslint-disable @typescript-eslint/ban-ts-comment */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockGetValidToken = vi.fn();

vi.mock("../tokenStore.js", () => ({
  getValidToken: () => mockGetValidToken(),
}));

describe("installFetchInterceptor", () => {
  const originalFetch = globalThis.fetch;
  let fakeFetch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Set up a fresh "original" fetch that the interceptor will capture
    fakeFetch = vi.fn().mockResolvedValue(new Response("ok"));
    // @ts-ignore
    globalThis.fetch = fakeFetch;

    // Re-import the module fresh so it captures our fakeFetch as _originalFetch
    vi.resetModules();
    const mod = await import("../fetchInterceptor");
    mod.installFetchInterceptor("http://localhost:4000/api/v1");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("adds Authorization header to API-origin requests when token exists", async () => {
    mockGetValidToken.mockResolvedValue("test-token-123");

    await globalThis.fetch("http://localhost:4000/api/v1/clusters");

    expect(fakeFetch).toHaveBeenCalledTimes(1);
    const [, init] = fakeFetch.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer test-token-123");
  });

  it("does not add header for non-API requests", async () => {
    mockGetValidToken.mockResolvedValue("test-token-123");

    await globalThis.fetch("https://example.com/other");

    expect(fakeFetch).toHaveBeenCalledTimes(1);
    const [, init] = fakeFetch.mock.calls[0];
    // Should pass through without modification
    expect(init).toBeUndefined();
  });

  it("passes through without header when no token in keyring", async () => {
    mockGetValidToken.mockResolvedValue(null);

    await globalThis.fetch("http://localhost:4000/api/v1/clusters");

    expect(fakeFetch).toHaveBeenCalledTimes(1);
    const [, init] = fakeFetch.mock.calls[0];
    // No token → no auth header added, pass through as-is
    expect(init).toBeUndefined();
  });
});
