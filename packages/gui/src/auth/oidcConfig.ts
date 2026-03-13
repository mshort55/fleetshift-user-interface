import type { AuthProviderProps } from "react-oidc-context";

const KEYCLOAK_URL =
  (typeof process !== "undefined" && process.env && process.env.KEYCLOAK_URL) ||
  "http://localhost:8080";

export const oidcConfig: AuthProviderProps = {
  authority: `${KEYCLOAK_URL}/realms/fleetshift`,
  client_id: "fleetshift-ui",
  redirect_uri: window.location.origin + "/",
  post_logout_redirect_uri: window.location.origin + "/",
  scope: "openid profile email roles",
  automaticSilentRenew: true,
  onSigninCallback: () => {
    // Remove OIDC query params from URL after login
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};
