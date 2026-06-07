// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/services/moderation.ts
// DOMAIN:      moderation
// CONCEPT:     The Claude safety screen — turns one message into a structured verdict + logs it
// RELATIONS:   reads CONFIG (model/prompt/tool); writes moderationLogs via storage;
//              called by websocket/chatSocket.ts on every outgoing message
// KEY EXPORTS: screenMessage
// PURPOSE:     Calls Claude with a forced tool call for reliable structured moderation output.
// LLM EDIT GUIDE: To add a guideline category, edit MODERATION_SYSTEM_PROMPT + RECORD_VERDICT_TOOL
//                 in server/config.ts — not here. This file is the transport, not the policy.
// DAY-OF CHANGES: none here; tune policy in config.ts.
// ─────────────────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk';
// PERSEUS EDGE: moderation → config (the model, system prompt, and verdict tool live there)
import { CONFIG } from '../config';
// PERSEUS EDGE: moderation → storage (every call is logged for the admin audit)
import { storage } from '../storage';
import type { ModerationVerdict, ScreenMessageInput } from '../types';

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

/** Strip obvious PII and truncate before we persist an excerpt to moderationLogs. */
function safeExcerpt(content: string): string {
  const scrubbed = content
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[number]')
    .replace(/@\w{2,}/g, '[handle]');
  return scrubbed.length > 140 ? `${scrubbed.slice(0, 140)}…` : scrubbed;
}

/**
 * Screen one message. ALWAYS resolves (never throws) so chat is never blocked on moderation.
 * // HOW TO EXTEND: new guideline → extend the system prompt + tool enum in server/config.ts.
 */
export async function screenMessage(input: ScreenMessageInput): Promise<ModerationVerdict> {
  const clean: ModerationVerdict = { verdict: 'clean', guidelineTriggered: null, nudgeMessage: null };

  // No API key configured → degrade gracefully (treat everything as clean), still log.
  if (!anthropic) {
    await logVerdict(input, clean);
    return clean;
  }

  try {
    // ── SECTION: Claude Moderation Call ──
    const res = await anthropic.messages.create({
      model: CONFIG.CLAUDE_MODEL, // 'claude-sonnet-4-6' — DAY-OF CHANGE in config.ts
      max_tokens: 512,
      system: CONFIG.MODERATION_SYSTEM_PROMPT,
      tools: [CONFIG.RECORD_VERDICT_TOOL as Anthropic.Tool],
      tool_choice: { type: 'tool', name: 'record_verdict' }, // force structured output
      messages: [{ role: 'user', content: input.content }],
    });

    const toolUse = res.content.find((block) => block.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      await logVerdict(input, clean);
      return clean;
    }

    const out = toolUse.input as Partial<ModerationVerdict>;
    const verdict: ModerationVerdict = {
      verdict: out.verdict === 'flagged' ? 'flagged' : 'clean',
      guidelineTriggered: out.guidelineTriggered ?? null,
      nudgeMessage: out.nudgeMessage ?? null,
    };
    await logVerdict(input, verdict);
    return verdict;
  } catch (err) {
    // Never block chat on a failed moderation call.
    console.warn('[buddy] moderation call failed — treating message as clean:', (err as Error).message);
    await logVerdict(input, clean).catch(() => undefined);
    return clean;
  }
}

async function logVerdict(input: ScreenMessageInput, verdict: ModerationVerdict): Promise<void> {
  await storage.insertModerationLog({
    messageExcerpt: safeExcerpt(input.content),
    verdict: verdict.verdict,
    guidelineTriggered: verdict.guidelineTriggered,
    nudgeSent: verdict.verdict === 'flagged',
    sessionId: input.sessionId,
  });
}
