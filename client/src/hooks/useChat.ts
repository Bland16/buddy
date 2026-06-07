// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/hooks/useChat.ts
// DOMAIN:      chat
// CONCEPT:     The live chat subscription — join a room, send, receive, nudges, point drops
// RELATIONS:   uses lib/socket + apiRequest (history); drives ChatWindow/ChatInput/ModerationNudge
// KEY EXPORTS: useChat
// PURPOSE:     One hook that owns the socket lifecycle and chat state for a session.
// LLM EDIT GUIDE: Server broadcasts optimistically; we also do an optimistic local append on send,
//                 then de-dupe by id when the server echo arrives. Add new socket events here.
// DAY-OF CHANGES: add a typing relay; tune the de-dupe.
// ─────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message } from '@shared/schema';
import { getSocket } from '@/lib/socket';
import { apiRequest } from '@/lib/queryClient';
import { CONFIG } from '@/config';
import type { ChatUIMessage, ModerationNudge, PointDropEvent } from '@/types';

interface UseChatArgs {
  sessionId: number | null;
  currentUserId: string | null;
  /** Called when a gift point drops (so PointsDisplay can pop + refetch). */
  onPointDrop?: (event: PointDropEvent) => void;
}

export function useChat({ sessionId, currentUserId, onPointDrop }: UseChatArgs) {
  const [messages, setMessages] = useState<ChatUIMessage[]>([]);
  const [nudge, setNudge] = useState<ModerationNudge | null>(null);
  const [partnerLeft, setPartnerLeft] = useState(false);
  const onPointDropRef = useRef(onPointDrop);
  onPointDropRef.current = onPointDrop;

  const mark = useCallback(
    (m: Message): ChatUIMessage => ({ ...m, mine: m.senderId === currentUserId }),
    [currentUserId],
  );

  // Load history when the session changes.
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    apiRequest<{ messages: Message[] }>('GET', CONFIG.API_ROUTES.chatHistory(sessionId))
      .then((data) => {
        if (!cancelled) setMessages(data.messages.map(mark));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [sessionId, mark]);

  // Wire socket listeners + join the room.
  useEffect(() => {
    if (!sessionId) return;
    const socket = getSocket();
    socket.emit('chat:join', { sessionId });

    const onMessage = ({ message }: { message: Message }) => {
      setMessages((prev) => {
        // De-dupe: drop any optimistic temp from the same sender with identical content.
        const withoutTemp = prev.filter(
          (m) => !(m.pending && m.senderId === message.senderId && m.content === message.content),
        );
        if (withoutTemp.some((m) => m.id === message.id)) return withoutTemp;
        return [...withoutTemp, mark(message)];
      });
    };
    const onNudge = ({ nudge }: { nudge: ModerationNudge }) => setNudge(nudge);
    const onDrop = (event: PointDropEvent) => onPointDropRef.current?.(event);
    const onLeft = () => setPartnerLeft(true);

    socket.on('chat:message', onMessage);
    socket.on('chat:nudge', onNudge);
    socket.on('chat:pointDrop', onDrop);
    socket.on('chat:userLeft', onLeft);

    return () => {
      socket.emit('chat:leave', { sessionId });
      socket.off('chat:message', onMessage);
      socket.off('chat:nudge', onNudge);
      socket.off('chat:pointDrop', onDrop);
      socket.off('chat:userLeft', onLeft);
    };
  }, [sessionId, mark]);

  const send = useCallback(
    (content: string) => {
      const text = content.trim();
      if (!text || !sessionId || !currentUserId) return;
      // Optimistic local append (server will echo the persisted row, then we de-dupe).
      const temp: ChatUIMessage = {
        id: -Date.now(),
        sessionId,
        senderId: currentUserId,
        content: text,
        moderationChecked: false,
        verdict: 'pending',
        createdAt: new Date(),
        pending: true,
        mine: true,
      };
      setMessages((prev) => [...prev, temp]);
      getSocket().emit('chat:message', { sessionId, content: text });
    },
    [sessionId, currentUserId],
  );

  const dismissNudge = useCallback(() => setNudge(null), []);

  return { messages, nudge, partnerLeft, send, dismissNudge };
}
