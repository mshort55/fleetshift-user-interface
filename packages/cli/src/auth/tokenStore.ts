import * as keyring from "@napi-rs/keyring";

const SERVICE = "fleetshift-cli";
const ACCOUNT = "tokens";

export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  keycloak_url: string;
}

export function saveTokens(tokens: StoredTokens): void {
  const entry = new keyring.Entry(SERVICE, ACCOUNT);
  entry.setPassword(JSON.stringify(tokens));
}

export function loadTokens(): StoredTokens | null {
  try {
    const entry = new keyring.Entry(SERVICE, ACCOUNT);
    const json = entry.getPassword();
    if (!json) return null;
    return JSON.parse(json) as StoredTokens;
  } catch {
    return null;
  }
}

export function clearTokens(): void {
  try {
    const entry = new keyring.Entry(SERVICE, ACCOUNT);
    entry.deletePassword();
  } catch {
    // Ignore if no entry exists
  }
}

async function refreshAccessToken(
  tokens: StoredTokens,
): Promise<StoredTokens | null> {
  const tokenUrl = `${tokens.keycloak_url}/realms/fleetshift/protocol/openid-connect/token`;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: "fleetshift-cli",
    refresh_token: tokens.refresh_token,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const updated: StoredTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    keycloak_url: tokens.keycloak_url,
  };

  saveTokens(updated);
  return updated;
}

export async function getValidToken(): Promise<string | null> {
  const tokens = loadTokens();
  if (!tokens) return null;

  // If token is still valid (with 30s buffer), return it
  if (tokens.expires_at > Date.now() + 30_000) {
    return tokens.access_token;
  }

  // Try to refresh
  const refreshed = await refreshAccessToken(tokens);
  if (!refreshed) return null;

  return refreshed.access_token;
}
