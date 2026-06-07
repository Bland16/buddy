// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/lib/socket.ts
// DOMAIN:      chat
// CONCEPT:     The Socket.io client singleton (same-origin, shares the session cookie)
// RELATIONS:   used by hooks/useChat.ts; talks to server/websocket/chatSocket.ts
// KEY EXPORTS: getSocket
// PURPOSE:     One lazily-created socket connection reused across the app.
// LLM EDIT GUIDE: Connect to same origin (no host) so it works on Replit + local. Auth rides on the
//                 session cookie (withCredentials), so no token handling here.
// DAY-OF CHANGES: none expected.
// ─────────────────────────────────────────────────────────────────────────

import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

/** Get (or lazily create) the shared socket. Same-origin; cookie auth via withCredentials. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: '/socket.io',
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}
