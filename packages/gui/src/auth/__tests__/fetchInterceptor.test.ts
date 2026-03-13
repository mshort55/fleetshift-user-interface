import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to provide a window-like environment for this module
const mockOriginalFetch = vi.fn().mockResolvedValue(new Response("ok"));

// Set up a minimal window mock before importing
const _origWindow = globalThis.window;

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.window = {
    fetch: mockOriginalFetch,
    location: { origin: "http://localhost:3000" },
  } as any;
});

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.window = _origWindow as any;
});

// Dynamic import so the module picks up our mocked window
const loadModule = () => import("../fetchInterceptor");

describe("GUI fetchInterceptor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOriginalFetch.mockResolvedValue(new Response("ok"));
  });

  it("adds Authorization header to same-origin requests", async () => {
    const { setAccessToken, installFetchInterceptor } = await loadModule();
    setAccessToken("gui-token-abc");
    installFetchInterceptor();

    await window.fetch("http://localhost:3000/api/v1/clusters");

    expect(mockOriginalFetch).toHaveBeenCalled();
    const [, init] = mockOriginalFetch.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer gui-token-abc");
  });

  it("adds Authorization header to API_ORIGIN requests", async () => {
    const { setAccessToken, installFetchInterceptor } = await loadModule();
    setAccessToken("gui-token-abc");
    installFetchInterceptor();

    await window.fetch("http://localhost:4000/api/v1/clusters");

    expect(mockOriginalFetch).toHaveBeenCalled();
    const [, init] = mockOriginalFetch.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer gui-token-abc");
  });

  it("does not add header for non-matching URLs", async () => {
    const { setAccessToken, installFetchInterceptor } = await loadModule();
    setAccessToken("gui-token-abc");
    installFetchInterceptor();

    await window.fetch("https://example.com/other");

    expect(mockOriginalFetch).toHaveBeenCalled();
    const [, init] = mockOriginalFetch.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBeNull();
  });

  it("passes through unchanged when token is undefined", async () => {
    const { setAccessToken, installFetchInterceptor } = await loadModule();
    setAccessToken(undefined);
    installFetchInterceptor();

    await window.fetch("http://localhost:3000/api/v1/clusters");

    expect(mockOriginalFetch).toHaveBeenCalled();
    const [, init] = mockOriginalFetch.mock.calls[0];
    // init may be undefined — no Authorization header should be added
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBeNull();
  });
});
