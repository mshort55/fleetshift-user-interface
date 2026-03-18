/** Convert an ArrayBuffer to a binary string. */
function bufferToBinary(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

/** Convert a DER-encoded public key buffer to PEM format. */
export function derToPEM(buffer: ArrayBuffer): string {
  const base64 = window.btoa(bufferToBinary(buffer));
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join("\n")}\n-----END PUBLIC KEY-----`;
}

/** Decode a Base64URL string to a BufferSource. */
export function base64urlToBuffer(base64URLString: string): BufferSource {
  const base64 = base64URLString.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (base64.length % 4)) % 4;
  const paddedBase64 = base64.padEnd(base64.length + padLength, "=");
  const binaryString = window.atob(paddedBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/** Encode an ArrayBuffer as a Base64URL string. */
export function bufferToBase64url(buffer: ArrayBuffer): string {
  return window
    .btoa(bufferToBinary(buffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

const VALID_ATTESTATION = ["none", "indirect", "direct", "enterprise"];

/** Convert JSON-serialized PublicKeyCredentialCreationOptions to the native format. */
export function parseCreationOptions(
  pkJson: PublicKeyCredentialCreationOptionsJSON,
): PublicKeyCredentialCreationOptions {
  const attestation = pkJson.attestation;
  if (attestation && !VALID_ATTESTATION.includes(attestation)) {
    throw new Error(
      `Invalid attestation conveyance preference: ${attestation}`,
    );
  }

  return {
    ...pkJson,
    challenge: base64urlToBuffer(pkJson.challenge),
    user: {
      ...pkJson.user,
      id: base64urlToBuffer(pkJson.user.id),
    },
    excludeCredentials: pkJson.excludeCredentials?.map((cred) => ({
      ...cred,
      id: base64urlToBuffer(cred.id),
      type: cred.type as PublicKeyCredentialType,
      transports: cred.transports as AuthenticatorTransport[] | undefined,
    })),
    extensions: undefined,
    attestation: attestation as AttestationConveyancePreference | undefined,
  };
}
