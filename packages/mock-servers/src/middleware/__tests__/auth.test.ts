import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

// Mock jose before importing the module under test
vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn(() => "mock-jwks"),
  jwtVerify: vi.fn(),
}));

// Mock the db module
vi.mock("../../db", () => {
  const prepareMock = vi.fn();
  return {
    default: { prepare: prepareMock },
  };
});

const { jwtVerify } = await import("jose");
const db = (await import("../../db")).default;
const { jwtAuthMiddleware } = await import("../auth");

function mockReq(authHeader?: string): Partial<Request> {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  };
}

function mockRes(): Partial<Response> & {
  statusCode: number;
  body: unknown;
} {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: unknown) {
      res.body = data;
      return res;
    },
  };
  return res as Partial<Response> & { statusCode: number; body: unknown };
}

describe("jwtAuthMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no Authorization header", async () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    await jwtAuthMiddleware(
      req as Request,
      res as unknown as Response,
      next as NextFunction,
    );

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      error: "Missing or invalid Authorization header",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization header is not Bearer", async () => {
    const req = mockReq("Basic abc123");
    const res = mockRes();
    const next = vi.fn();

    await jwtAuthMiddleware(
      req as Request,
      res as unknown as Response,
      next as NextFunction,
    );

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token verification fails", async () => {
    vi.mocked(jwtVerify).mockRejectedValue(new Error("Invalid token"));

    const req = mockReq("Bearer invalid-token");
    const res = mockRes();
    const next = vi.fn();

    await jwtAuthMiddleware(
      req as Request,
      res as unknown as Response,
      next as NextFunction,
    );

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Invalid or expired token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next and sets req.user when token is valid", async () => {
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: {
        preferred_username: "testuser",
        realm_access: { roles: ["ops"] },
      },
      protectedHeader: { alg: "RS256" },
      key: {} as CryptoKey,
    });

    // User already exists in DB
    vi.mocked(db.prepare).mockReturnValue({
      get: vi.fn().mockReturnValue({ id: "user-testuser" }),
      run: vi.fn(),
    } as never);

    const req = mockReq("Bearer valid-token");
    const res = mockRes();
    const next = vi.fn();

    await jwtAuthMiddleware(
      req as Request,
      res as unknown as Response,
      next as NextFunction,
    );

    expect(next).toHaveBeenCalled();
    expect((req as Request).user).toEqual({
      username: "testuser",
      roles: ["ops"],
    });
  });

  it("auto-creates user in DB when not present", async () => {
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: {
        preferred_username: "newuser",
        realm_access: { roles: ["dev"] },
      },
      protectedHeader: { alg: "RS256" },
      key: {} as CryptoKey,
    });

    const runMock = vi.fn();
    const getMock = vi.fn().mockReturnValue(undefined); // User not found
    vi.mocked(db.prepare).mockReturnValue({
      get: getMock,
      run: runMock,
    } as never);

    const req = mockReq("Bearer valid-token");
    const res = mockRes();
    const next = vi.fn();

    await jwtAuthMiddleware(
      req as Request,
      res as unknown as Response,
      next as NextFunction,
    );

    expect(next).toHaveBeenCalled();
    // Should have called prepare twice: once for SELECT, once for INSERT
    expect(db.prepare).toHaveBeenCalledTimes(2);
    expect(runMock).toHaveBeenCalledWith(
      "user-newuser",
      "newuser",
      "Newuser",
      "dev",
      "[]",
      "[]",
    );
  });
});
