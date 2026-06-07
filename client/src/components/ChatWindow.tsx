// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/components/ChatWindow.tsx
// DOMAIN:      chat
// CONCEPT:     The scrolling message list (real-time), empty state, and a typing row
// RELATIONS:   rendered by ChatPage with messages from useChat; uses BuddyAnim 'typing'
// KEY EXPORTS: ChatWindow
// PURPOSE:     Renders message bubbles (mine vs theirs) over the sponsored wallpaper.
// LLM EDIT GUIDE: Bubbles are styled by `mine`. Pending messages show a soft opacity. Empty-state
//                 copy comes from config.ts (brand voice).
// DAY-OF CHANGES: bubble colors; empty-state copy (config.ts).
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { CONFIG } from '@/config';
import type { ChatUIMessage } from '@/types';
import { BuddyAnim } from './BuddyAnim';

interface ChatWindowProps {
  messages: ChatUIMessage[];
  partnerTyping?: boolean;
}

export function ChatWindow({ messages, partnerTyping = false }: ChatWindowProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, partnerTyping]);

  return (
    <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6">
      {messages.length === 0 && !partnerTyping && (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <BuddyAnim animation="buddy-idle" size={88} />
          <p className="mt-4 max-w-xs text-pine/60">{CONFIG.COPY.chatEmpty}</p>
        </div>
      )}

      <div className="mx-auto flex max-w-2xl flex-col gap-2">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
            <div
              className={[
                'max-w-[78%] rounded-2xl px-4 py-2 text-[15px] leading-snug shadow-sm',
                m.mine ? 'bg-mint text-white' : 'bg-white text-pine',
                m.pending ? 'opacity-60' : '',
              ].join(' ')}
            >
              {m.content}
            </div>
          </div>
        ))}

        {partnerTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
              <BuddyAnim animation="typing" size={28} />
            </div>
          </div>
        )}
      </div>
      <div ref={endRef} />
    </div>
  );
}
