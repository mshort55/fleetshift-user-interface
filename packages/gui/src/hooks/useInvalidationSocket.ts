import { useEffect, useRef } from "react";

type Resource = "canvas_pages" | "nav_layout" | "clusters";
type Handler = (resource: Resource) => void;

// Module-level singleton — one WS connection shared by all hook instances
let sessionId: string | null = null;
let ws: WebSocket | null = null;
let activeUserId: string | null = null;
const handlers = new Set<Handler>();

/** Returns the current session ID (available after WS handshake). */
export function getSessionId(): string | null {
  return sessionId;
}

function ensureConnection(userId: string) {
  if (ws && activeUserId === userId) return;

  // Close stale connection if user changed
  if (ws) {
    ws.close();
    ws = null;
    sessionId = null;
  }

  activeUserId = userId;
  const socket = new WebSocket(
    `ws://localhost:4000/ws?userId=${encodeURIComponent(userId)}`,
  );

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "session") {
      sessionId = msg.sessionId;
      return;
    }

    for (const handler of handlers) {
      handler(msg.resource);
    }
  };

  socket.onclose = () => {
    // Only clear if this is still our active socket
    if (ws === socket) {
      ws = null;
      sessionId = null;
      activeUserId = null;
    }
  };

  ws = socket;
}

function maybeClose() {
  if (handlers.size === 0 && ws) {
    ws.close();
    ws = null;
    sessionId = null;
    activeUserId = null;
  }
}

export function useInvalidationSocket(
  userId: string | undefined,
  onInvalidate: Handler,
) {
  const handlerRef = useRef(onInvalidate);
  handlerRef.current = onInvalidate;

  useEffect(() => {
    if (!userId) return;

    const handler: Handler = (resource) => handlerRef.current(resource);
    handlers.add(handler);
    ensureConnection(userId);

    return () => {
      handlers.delete(handler);
      maybeClose();
    };
  }, [userId]);
}
