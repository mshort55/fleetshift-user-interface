import { Box, Text } from "ink";
import { decodeJwt } from "jose";
import type { Command } from "./types.js";
import { performLogin } from "../auth/login.js";
import { clearTokens, loadTokens } from "../auth/tokenStore.js";

export const login: Command = {
  name: "login",
  description: "Log in to Keycloak via browser (PKCE flow)",
  usage: "login [keycloak-url]",
  async run({ arg }) {
    const keycloakUrl = arg.trim() || undefined;

    try {
      const tokens = await performLogin(keycloakUrl);
      const claims = decodeJwt(tokens.access_token);
      const username =
        (claims as { preferred_username?: string }).preferred_username ??
        "unknown";

      return (
        <Box flexDirection="column">
          <Text color="green">Logged in as {username}</Text>
          <Text color="gray">
            Token expires: {new Date(tokens.expires_at).toLocaleString()}
          </Text>
        </Box>
      );
    } catch (err) {
      return (
        <Text color="red">
          Login failed: {err instanceof Error ? err.message : String(err)}
        </Text>
      );
    }
  },
};

export const logout: Command = {
  name: "logout",
  description: "Clear stored authentication tokens",
  async run() {
    clearTokens();
    return <Text color="green">Logged out — stored tokens cleared.</Text>;
  },
};

export const whoami: Command = {
  name: "whoami",
  description: "Show current authenticated user info",
  async run() {
    const tokens = loadTokens();
    if (!tokens) {
      return (
        <Text color="yellow">
          Not logged in. Run &apos;login&apos; to authenticate.
        </Text>
      );
    }

    try {
      const claims = decodeJwt(tokens.access_token);
      const kc = claims as {
        preferred_username?: string;
        realm_access?: { roles?: string[] };
        exp?: number;
      };
      const username = kc.preferred_username ?? "unknown";
      const roles =
        kc.realm_access?.roles?.filter(
          (r) => !r.startsWith("default-roles-"),
        ) ?? [];
      const expired = tokens.expires_at < Date.now();

      return (
        <Box flexDirection="column">
          <Box>
            <Box width={12}>
              <Text bold>User:</Text>
            </Box>
            <Text>{username}</Text>
          </Box>
          <Box>
            <Box width={12}>
              <Text bold>Roles:</Text>
            </Box>
            <Text>{roles.join(", ") || "none"}</Text>
          </Box>
          <Box>
            <Box width={12}>
              <Text bold>Expires:</Text>
            </Box>
            <Text color={expired ? "red" : "green"}>
              {new Date(tokens.expires_at).toLocaleString()}
              {expired ? " (EXPIRED)" : ""}
            </Text>
          </Box>
          <Box>
            <Box width={12}>
              <Text bold>Server:</Text>
            </Box>
            <Text>{tokens.keycloak_url}</Text>
          </Box>
        </Box>
      );
    } catch {
      return <Text color="red">Failed to decode stored token.</Text>;
    }
  },
};
