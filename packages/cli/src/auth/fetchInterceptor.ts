import { getValidToken } from "./tokenStore.js";

const _originalFetch = globalThis.fetch;

/**
 * Monkey-patches `globalThis.fetch` to inject the Authorization header
 * on requests to the FleetShift API server. The token is loaded from the
 * OS keyring on each request (auto-refreshing if expired).
 */
export function installFetchInterceptor(apiBase: string) {
  const apiOrigin = new URL(apiBase).origin;

  globalThis.fetch = async function patchedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    const isApiRequest = url.startsWith(apiOrigin);

    if (!isApiRequest) {
      return _originalFetch(input, init);
    }

    const token = await getValidToken();
    if (!token) {
      return _originalFetch(input, init);
    }

    const headers = new Headers(init?.headers);
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return _originalFetch(input, { ...init, headers });
  };
}
