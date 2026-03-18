import { Router } from "express";
import crypto from "crypto";
import db from "../db";
import { sendToSession } from "../ws";

const router = Router();

const challengeStore = new Map<string, string>();
const authChallengeStore = new Map<string, string>();

/** Notify the originating client session about a passkey change. */
function notifySession(req: import("express").Request) {
  const sessionId = req.headers["x-session-id"] as string | undefined;
  if (sessionId) {
    sendToSession(sessionId, { type: "passkey-registered" });
  }
}

// GET /passkey — check if user has a passkey registered
router.get("/passkey", (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const row = db
    .prepare("SELECT passkey_public_key FROM users WHERE username = ?")
    .get(req.user.username) as
    | { passkey_public_key: string | null }
    | undefined;

  if (!row) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ registered: !!row.passkey_public_key });
});

// POST /passkey — register a new passkey
router.post("/passkey", (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { publicKey, credentialId } = req.body;
  if (!publicKey || typeof publicKey !== "string") {
    res.status(400).json({ error: "publicKey is required (string)" });
    return;
  }
  if (!credentialId || typeof credentialId !== "string") {
    res.status(400).json({ error: "credentialId is required (string)" });
    return;
  }

  console.log(
    `Registering passkey for ${req.user.username}: credentialId=${credentialId}`,
  );
  const result = db
    .prepare(
      "UPDATE users SET passkey_public_key = ?, passkey_credential_id = ? WHERE username = ?",
    )
    .run(publicKey, credentialId, req.user.username);

  if (result.changes === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  notifySession(req);
  res.json({ registered: true });
});

// DELETE /passkey — remove user's passkey
router.delete("/passkey", (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const result = db
    .prepare(
      "UPDATE users SET passkey_public_key = NULL, passkey_credential_id = NULL WHERE username = ?",
    )
    .run(req.user.username);

  if (result.changes === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  notifySession(req);
  res.json({ registered: false });
});

// GET /passkey/challenge — generate a challenge for passkey registration
router.get("/passkey/challenge", (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { userId, username } = req.user;
  const challenge = crypto.randomBytes(32).toString("base64url");
  challengeStore.set(userId, challenge);

  res.json({
    challenge,
    rp: {
      name: "FleetShift Dev UI",
      id: "localhost",
    },
    user: {
      id: Buffer.from(userId).toString("base64url"),
      name: username,
      displayName: username,
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 },
      { type: "public-key", alg: -257 },
    ],
    timeout: 60000,
    attestation: "none",
  });
});

// GET /passkey/auth-challenge — generate a challenge for passkey verification
router.get("/passkey/auth-challenge", (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const userRecord = db
    .prepare("SELECT passkey_credential_id FROM users WHERE username = ?")
    .get(req.user.username) as
    | { passkey_credential_id: string | null }
    | undefined;

  if (!userRecord?.passkey_credential_id) {
    res.status(400).json({ error: "No passkey registered for this user." });
    return;
  }

  const challenge = crypto.randomBytes(32).toString("base64url");
  authChallengeStore.set(req.user.userId, challenge);

  res.json({
    challenge,
    credentialId: userRecord.passkey_credential_id,
  });
});

// POST /passkey/verify-auth — verify a passkey assertion
interface AssertionResponseJSON {
  id: string;
  rawId: string;
  type: "public-key";
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle: string | null;
  };
}

interface CollectedClientData {
  type: "webauthn.create" | "webauthn.get";
  challenge: string;
  origin: string;
  crossOrigin?: boolean;
}

router.post("/passkey/verify-auth", (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { id, response }: AssertionResponseJSON = req.body;
  const { clientDataJSON, authenticatorData, signature } = response;

  const expectedChallenge = authChallengeStore.get(req.user.userId);
  if (!expectedChallenge) {
    res
      .status(400)
      .json({ error: "No pending authentication challenge found." });
    return;
  }

  const clientDataString = Buffer.from(clientDataJSON, "base64url").toString(
    "utf-8",
  );
  const clientData: CollectedClientData = JSON.parse(clientDataString);

  if (clientData.challenge !== expectedChallenge) {
    res
      .status(400)
      .json({ error: "Challenge mismatch! Potential replay attack." });
    return;
  }

  const userRecord = db
    .prepare(
      "SELECT passkey_public_key FROM users WHERE passkey_credential_id = ? AND username = ?",
    )
    .get(id, req.user.username) as
    | { passkey_public_key: string | null }
    | undefined;

  if (!userRecord?.passkey_public_key) {
    res
      .status(404)
      .json({ error: "Public key not found for this credential." });
    return;
  }

  const authenticatorDataBuffer = Buffer.from(authenticatorData, "base64url");
  const clientDataBuffer = Buffer.from(clientDataJSON, "base64url");
  const clientDataHash = crypto
    .createHash("sha256")
    .update(clientDataBuffer)
    .digest();
  const signedPayload = Buffer.concat([
    authenticatorDataBuffer,
    clientDataHash,
  ]);
  const signatureBuffer = Buffer.from(signature, "base64url");

  const verifier = crypto.createVerify("SHA256");
  verifier.update(signedPayload);
  verifier.end();

  const isVerified = verifier.verify(
    userRecord.passkey_public_key,
    signatureBuffer,
  );

  if (isVerified) {
    authChallengeStore.delete(req.user.userId);
    res.json({ success: true, message: "Signature verified!" });
  } else {
    res.status(401).json({ success: false, error: "Invalid signature." });
  }
});

export default router;
