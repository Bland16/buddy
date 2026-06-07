// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/types.ts
// DOMAIN:      types
// CONCEPT:     Client-only UI types (optimistic state, socket payloads) not derived from the DB
// RELATIONS:   used by hooks/useChat, components/ChatWindow, ModerationNudge, PointsDisplay
// KEY EXPORTS: ChatUIMessage, PointDropEvent, ModerationNudge, ModerationVerdict
// PURPOSE:     Shapes that only the browser needs; DB row types come from @shared/schema.
// LLM EDIT GUIDE: If a type mirrors the DB, import from @shared/schema instead of redefining it.
// DAY-OF CHANGES: rarely.
// ─────────────────────────────────────────────────────────────────────────

import type { Message } from '@shared/schema';

/** A chat message plus optimistic-send state for the UI. */
export interface ChatUIMessage extends Message {
  /** true while the message is in-flight (not yet acknowledged by the server). */
  pending?: boolean;
  /** true if it's from the current user (right-aligned bubble). */
  mine?: boolean;
}

/** Socket.io payload when a gift point drops. */
export interface PointDropEvent {
  earner: string;
  recipient: string;
  points: number;
}

/** In-chat moderation nudge display state. */
export interface ModerationNudge {
  guidelineTriggered: string | null;
  message: string;
}

/** Mirror of the server verdict shape. */
export interface ModerationVerdict {
  verdict: 'clean' | 'flagged';
  guidelineTriggered: string | null;
  nudgeMessage: string | null;
}
