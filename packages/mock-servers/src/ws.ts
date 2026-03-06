import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { IncomingMessage } from "http";
import crypto from "crypto";

type Resource = "canvas_pages" | "nav_layout" | "clusters";

interface InvalidationMessage {
  resource: Resource;
}

interface Session {
  ws: WebSocket;
  userId: string | null;
}

let wss: WebSocketServer;

// Map sessionId → session info for origin exclusion + user scoping
const sessions = new Map<string, Session>();

export function attachWebSocket(server: Server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req: IncomingMessage) => {
    // Extract userId from query string: ws://…/ws?userId=xxx
    const url = new URL(req.url ?? "/", "http://localhost");
    const userId = url.searchParams.get("userId");

    // Assign a unique session ID and send it to the client
    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, { ws, userId });
    ws.send(JSON.stringify({ type: "session", sessionId }));

    ws.on("close", () => {
      sessions.delete(sessionId);
    });
  });
}

/**
 * Broadcast an invalidation signal to connected clients.
 *
 * - Skips the socket identified by `originSessionId` (the tab that made
 *   the mutation — it already updated optimistically).
 * - If `userId` is provided, only sends to sockets authenticated as
 *   that user (for per-user resources like canvas_pages / nav_layout).
 * - If `userId` is omitted, sends to all sockets (for global resources
 *   like clusters).
 */
export function broadcast(
  resource: Resource,
  opts?: { userId?: string; originSessionId?: string },
) {
  if (!wss) return;
  const msg = JSON.stringify({ resource } satisfies InvalidationMessage);

  for (const [sid, session] of sessions) {
    if (sid === opts?.originSessionId) continue; // skip origin
    // User-scoped: only send to sockets belonging to that user
    if (opts?.userId && session.userId !== opts.userId) continue;
    if (session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(msg);
    }
  }
}
