// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/pages/ChatPage.tsx
// DOMAIN:      chat
// CONCEPT:     The main chat screen — wallpaper + messages + nudge + composer + points
// RELATIONS:   uses useChat (live), useAuth (me), useMatch (partner alias), usePoints (balance)
// KEY EXPORTS: ChatPage (default)
// PURPOSE:     Brings the whole live experience together over the sponsored wallpaper.
// LLM EDIT GUIDE: Real-time logic is in useChat; this page is composition. Keep the wallpaper behind
//                 the message list and the nudge above the composer.
// DAY-OF CHANGES: none here; tune child components.
// ─────────────────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useMatch } from '@/hooks/useMatch';
import { usePoints } from '@/hooks/usePoints';
import { useChat } from '@/hooks/useChat';
import { SponsoredWallpaper } from '@/components/SponsoredWallpaper';
import { ChatWindow } from '@/components/ChatWindow';
import { ChatInput } from '@/components/ChatInput';
import { ModerationNudge } from '@/components/ModerationNudge';
import { PointsDisplay } from '@/components/PointsDisplay';
import { MatchCard } from '@/components/MatchCard';
import { Sprite } from '@/components/Sprite';
import type { PointDropEvent } from '@/types';

export default function ChatPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const sessionId = Number(params.sessionId);
  const { user } = useAuth();
  const { partnerAlias, leave } = useMatch();
  const { spendable, refetch } = usePoints();

  const [dropSignal, setDropSignal] = useState(0);
  const [iAmRecipient, setIAmRecipient] = useState(false);

  const onPointDrop = useCallback(
    (event: PointDropEvent) => {
      setIAmRecipient(event.recipient === user?.id);
      setDropSignal((n) => n + 1);
      refetch();
    },
    [user?.id, refetch],
  );

  const { messages, nudge, partnerLeft, send, dismissNudge } = useChat({
    sessionId: Number.isNaN(sessionId) ? null : sessionId,
    currentUserId: user?.id ?? null,
    onPointDrop,
  });

  function endChat() {
    leave.mutate();
    navigate('/');
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="z-20 flex items-center justify-between border-b border-mint-soft/40 bg-canvas/85 px-4 py-2.5 backdrop-blur">
        <MatchCard alias={partnerAlias ?? 'your match'} subtitle={partnerLeft ? 'left the chat' : 'here now'} />
        <div className="flex items-center gap-2">
          <PointsDisplay
            spendable={spendable}
            dropSignal={dropSignal}
            recipientAlias={partnerAlias ?? 'your match'}
            iAmRecipient={iAmRecipient}
          />
          <button
            onClick={endChat}
            aria-label="End chat"
            className="flex h-9 items-center gap-1 rounded-full border border-mint-soft px-3 text-sm font-semibold text-pine/70 transition hover:bg-mint-soft/30"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Conversation area with sponsored wallpaper behind it */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <SponsoredWallpaper sessionId={Number.isNaN(sessionId) ? null : sessionId} />
        <ChatWindow messages={messages} />

        {nudge && (
          <div className="relative z-10 px-4">
            <ModerationNudge nudge={nudge} onAllGood={dismissNudge} />
          </div>
        )}

        {partnerLeft && (
          <div className="relative z-10 mx-auto mb-2 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-pine/70 shadow-sm">
            <Sprite name="chat_convo" size={18} />
            Your match stepped away. Want to{' '}
            <button onClick={endChat} className="font-semibold text-mint-deep underline">
              talk to someone new
            </button>
            ?
          </div>
        )}

        <ChatInput onSend={send} disabled={partnerLeft} />
      </div>
    </div>
  );
}
