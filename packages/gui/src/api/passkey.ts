import { getSessionId } from "../hooks/useInvalidationSocket";
import {
  derToPEM,
  base64urlToBuffer,
  bufferToBase64url,
  parseCreationOptions,
} from "../utils/webauthn";

const API_BASE = "/api/v1";

/** Register a new passkey via the WebAuthn creation flow. */
export async function createPasskey(): Promise<void> {
  const challengeResp = await fetch(`${API_BASE}/passkey/challenge`);
  if (!challengeResp.ok) {
    throw new Error(`Challenge request failed: ${challengeResp.status}`);
  }

  const pkJson: PublicKeyCredentialCreationOptionsJSON =
    await challengeResp.json();
  const pkConfig = parseCreationOptions(pkJson);

  const credential = await navigator.credentials.create({
    publicKey: pkConfig,
  });

  if (!credential) {
    throw new Error("User cancelled the passkey creation.");
  }
  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error("Expected a PublicKeyCredential");
  }
  if (!(credential.response instanceof AuthenticatorAttestationResponse)) {
    throw new Error("Expected an Attestation response");
  }

  const pkBuffer = credential.response.getPublicKey();
  if (!pkBuffer) {
    throw new Error("Failed to get public key from credential response");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const sid = getSessionId();
  if (sid) headers["x-session-id"] = sid;

  const storeResp = await fetch(`${API_BASE}/passkey`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      publicKey: derToPEM(pkBuffer),
      credentialId: credential.id,
    }),
  });
  if (!storeResp.ok) {
    throw new Error(`Failed to store passkey: ${storeResp.status}`);
  }
}

/** Verify identity via passkey and grant access. */
export async function grantAccess(): Promise<void> {
  const authChallengeResp = await fetch(`${API_BASE}/passkey/auth-challenge`);
  if (!authChallengeResp.ok) {
    throw new Error(
      `Auth challenge request failed: ${authChallengeResp.status}`,
    );
  }

  const { challenge, credentialId } = await authChallengeResp.json();
  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge: base64urlToBuffer(challenge),
    allowCredentials: [
      {
        id: base64urlToBuffer(credentialId),
        type: "public-key",
      },
    ],
    userVerification: "required",
    timeout: 60000,
  };

  const credential = await navigator.credentials.get({ publicKey });

  if (!credential) {
    throw new Error("User cancelled the authentication.");
  }
  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error("Expected a PublicKeyCredential");
  }
  if (!(credential.response instanceof AuthenticatorAssertionResponse)) {
    throw new Error("Expected an Assertion response");
  }

  const verifyResp = await fetch(`${API_BASE}/passkey/verify-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: credential.id,
      rawId: bufferToBase64url(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
        authenticatorData: bufferToBase64url(
          credential.response.authenticatorData,
        ),
        signature: bufferToBase64url(credential.response.signature),
        userHandle: credential.response.userHandle
          ? bufferToBase64url(credential.response.userHandle)
          : null,
      },
    }),
  });

  if (!verifyResp.ok) {
    throw new Error(`Verification request failed: ${verifyResp.status}`);
  }

  const result = await verifyResp.json();
  if (!result.success) {
    throw new Error("Verification failed.");
  }
}

/** Delete the current user's passkey. */
export async function deletePasskey(): Promise<void> {
  const headers: Record<string, string> = {};
  const sid = getSessionId();
  if (sid) headers["x-session-id"] = sid;

  const resp = await fetch(`${API_BASE}/passkey`, {
    method: "DELETE",
    headers,
  });
  if (!resp.ok) {
    throw new Error(`Failed to delete passkey: ${resp.status}`);
  }
}

/** Fetch whether the current user has a registered passkey. */
export function fetchPasskeyStatus(
  token: string,
): Promise<{ registered: boolean }> {
  return fetch(`${API_BASE}/passkey`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((resp) => {
    if (!resp.ok) throw new Error(`${resp.status}`);
    return resp.json();
  });
}
