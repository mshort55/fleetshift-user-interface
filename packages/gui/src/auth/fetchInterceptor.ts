let _token: string | undefined;

const _originalFetch = window.fetch;

const API_ORIGIN = "http://localhost:4000";

export function setAccessToken(token: string | undefined) {
  _token = token;
}

/**
 * Monkey-patches `window.fetch` to inject the Authorization header
 * on requests to the app origin (proxied API) or the API server directly.
 */
export function installFetchInterceptor() {
  window.fetch = function patchedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    if (!_token) {
      return _originalFetch(input, init);
    }

    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    const isApiRequest =
      url.startsWith("/") ||
      url.startsWith(window.location.origin) ||
      url.startsWith(API_ORIGIN);

    if (!isApiRequest) {
      return _originalFetch(input, init);
    }

    const headers = new Headers(init?.headers);
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${_token}`);
    }

    return _originalFetch(input, { ...init, headers });
  };
}
