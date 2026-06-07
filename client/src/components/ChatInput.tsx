// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/components/ChatInput.tsx
// DOMAIN:      chat
// CONCEPT:     The message composer + send button (plays send-whoosh on send)
// RELATIONS:   used by ChatPage; calls useChat().send; uses BuddyAnim 'send-whoosh'
// KEY EXPORTS: ChatInput
// PURPOSE:     A calm single-line composer; Enter sends, the plane pops on send.
// LLM EDIT GUIDE: Keep it one clear action. Placeholder copy from config.ts.
// DAY-OF CHANGES: placeholder (config.ts).
// ─────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { CONFIG } from '@/config';
import { BuddyAnim } from './BuddyAnim';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [whoosh, setWhoosh] = useState(0); // bump to replay the send animation

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
    setWhoosh((w) => w + 1);
  }

  return (
    <div className="relative z-10 flex items-center gap-2 border-t border-mint-soft/50 bg-canvas/80 px-4 py-3 backdrop-blur">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        disabled={disabled}
        placeholder={CONFIG.COPY.chatPlaceholder}
        className="flex-1 rounded-full border border-mint-soft bg-white px-4 py-2.5 text-pine outline-none placeholder:text-pine/40 focus:border-mint disabled:opacity-50"
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Send"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-mint transition hover:bg-mint-deep disabled:opacity-40"
      >
        <BuddyAnim key={whoosh} animation="send-whoosh" size={26} />
      </button>
    </div>
  );
}
