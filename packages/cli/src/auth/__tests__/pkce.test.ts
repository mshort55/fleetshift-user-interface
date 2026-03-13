import { describe, it, expect } from "vitest";
import { generateCodeVerifier, generateCodeChallenge } from "../pkce";

describe("generateCodeVerifier", () => {
  it("returns a string of correct length (43 chars for 32 random bytes in base64url)", () => {
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
  });

  it("returns only URL-safe characters", () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("produces different values on each call", () => {
    const a = generateCodeVerifier();
    const b = generateCodeVerifier();
    expect(a).not.toBe(b);
  });
});

describe("generateCodeChallenge", () => {
  it("returns a base64url-encoded SHA256 hash", () => {
    const verifier = "test-verifier-value";
    const challenge = generateCodeChallenge(verifier);
    // base64url: no +, /, or = characters
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(challenge.length).toBeGreaterThan(0);
  });

  it("produces the same challenge for the same verifier", () => {
    const verifier = generateCodeVerifier();
    const a = generateCodeChallenge(verifier);
    const b = generateCodeChallenge(verifier);
    expect(a).toBe(b);
  });

  it("produces different challenges for different verifiers", () => {
    const a = generateCodeChallenge("verifier-a");
    const b = generateCodeChallenge("verifier-b");
    expect(a).not.toBe(b);
  });
});
