// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/config.ts
// DOMAIN:      config
// CONCEPT:     Server constants + secret validation + the Claude moderation contract
// RELATIONS:   read by moderation.ts (model, prompt, tool), points.ts (drop rate),
//              requireEdu.ts (allowlist), index.ts (startup validation)
// KEY EXPORTS: CONFIG, CLAUDE_MODEL, MODERATION_SYSTEM_PROMPT, RECORD_VERDICT_TOOL,
//              POINT_DROP_RATE, MAX_MESSAGES_PER_SESSION, EDU_DOMAIN_ALLOWLIST, validateSecrets
// PURPOSE:     One place for every server tunable and the structured-moderation tool schema.
// LLM EDIT GUIDE: Tune behavior HERE, not inline in services. To pin a Claude snapshot, change
//                 CLAUDE_MODEL only. To tighten moderation, edit MODERATION_SYSTEM_PROMPT.
// DAY-OF CHANGES: POINT_DROP_RATE, MODERATION_SYSTEM_PROMPT, EDU_DOMAIN_ALLOWLIST, CLAUDE_MODEL.
// ─────────────────────────────────────────────────────────────────────────

// REPLIT SETUP: DATABASE_URL / SESSION_SECRET / REPL_ID / REPLIT_DOMAINS / ISSUER_URL are auto-injected
// once you enable PostgreSQL + Auth. Add ANTHROPIC_API_KEY and STRIPE_SECRET_KEY by hand in Secrets.

// ── SECTION: Runtime mode ──────────────────────────────────────────────────

/** True on Replit (where Replit Auth injects REPLIT_DOMAINS). Absent → local dev fallback. */
export const IS_REPLIT = Boolean(process.env.REPLIT_DOMAINS);

/**
 * DEV_AUTH: when running locally (no Replit OIDC), Buddy mounts a fake-login so you can sign in
 * without the OIDC flow. It is force-disabled on Replit and when DEV_AUTH=off.
 * // DAY-OF CHANGE: set DEV_AUTH=off to test the real OIDC path even locally.
 */
export const DEV_AUTH_ENABLED = !IS_REPLIT && process.env.DEV_AUTH !== 'off';

/** The email the local dev fake-login signs in as (must pass the .edu check). */
export const DEV_USER_EMAIL = process.env.DEV_USER_EMAIL ?? 'demo@university.edu';

// ── SECTION: Claude moderation contract ────────────────────────────────────

/** Current Claude Sonnet. // DAY-OF CHANGE: pin a dated snapshot here if needed (one place only). */
export const CLAUDE_MODEL = 'claude-sonnet-4-6';

/**
 * The system prompt that defines what Claude flags and how it phrases a nudge.
 * // DAY-OF CHANGE: edit this to tighten/loosen moderation or change the nudge tone.
 * Voice rules come from BUDDY_BRAND_AESTHETIC.md — warm, never preachy, never says "violation".
 */
export const MODERATION_SYSTEM_PROMPT = `You are the quiet safety layer for Buddy, an app where two students talk anonymously, with no names and no pressure.

Screen ONE message at a time and decide if it crosses a guideline. Flag a message when it contains:
- Personal identifiers: a real name, phone number, email address, social media handle/username, or a specific school name that could de-anonymize someone.
- Sexual content or sexual advances.
- Harassment, slurs, threats, or demeaning attacks on a person.
- References to self-harm or suicide.

If NONE of these apply, the verdict is "clean".

If the message is flagged, also write nudgeMessage: a short, warm, in-chat note shown to BOTH people. It must:
- Sound like the vibe of the place, not a rule someone broke. Never use the words "violation", "warning", "banned", "rules", or "punish".
- Name the relevant guideline gently (e.g. keeping names/numbers/socials out of it; keeping things kind).
- End by checking everyone's still good to keep going.
Example tone: "Quick one — let's keep names, numbers, and socials out of it. All good to keep going?"

Always respond by calling the record_verdict tool. Never reply in free text.`;

/**
 * The Anthropic tool definition for forced structured output. Using a forced tool call is far more
 * reliable than parsing free-text JSON. moderation.ts passes this in `tools` with tool_choice forced.
 * // HOW TO EXTEND: add a guideline category by extending the system prompt above AND the
 * guidelineTriggered description here so Claude knows the new label is available.
 */
export const RECORD_VERDICT_TOOL = {
  name: 'record_verdict',
  description: 'Record the moderation verdict for a single chat message.',
  input_schema: {
    type: 'object' as const,
    properties: {
      verdict: {
        type: 'string' as const,
        enum: ['clean', 'flagged'],
        description: 'clean if the message is fine; flagged if it crosses a guideline.',
      },
      guidelineTriggered: {
        type: ['string', 'null'] as const,
        description:
          'Short label of the guideline that tripped, e.g. "personal info", "sexual content", "harassment", "self-harm". null when clean.',
      },
      nudgeMessage: {
        type: ['string', 'null'] as const,
        description: 'The warm in-chat note shown to both users when flagged; null when clean.',
      },
    },
    required: ['verdict', 'guidelineTriggered', 'nudgeMessage'],
  },
};

// ── SECTION: Economy + access tunables ─────────────────────────────────────

/** Probability that any given message triggers a gift-point drop. // DAY-OF CHANGE: raise to make points rain. */
export const POINT_DROP_RATE = 0.08;

/** Soft cap on messages we keep screening per session (cost guard). // DAY-OF CHANGE. */
export const MAX_MESSAGES_PER_SESSION = 500;

/** Allowed email suffixes. // DAY-OF CHANGE: add partner school domains, e.g. ['.edu', 'alum.mit.edu']. */
export const EDU_DOMAIN_ALLOWLIST = ['.edu'];

// ── SECTION: Aggregate CONFIG + secret validation ──────────────────────────

export const CONFIG = {
  CLAUDE_MODEL,
  MODERATION_SYSTEM_PROMPT,
  RECORD_VERDICT_TOOL,
  POINT_DROP_RATE,
  MAX_MESSAGES_PER_SESSION,
  EDU_DOMAIN_ALLOWLIST,
  IS_REPLIT,
  DEV_AUTH_ENABLED,
  DEV_USER_EMAIL,
  /** Stripe webhook signing secret is optional (hackathon-friendly). */
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
} as const;

/**
 * Validate required secrets at startup. Throws ONE descriptive error listing every missing key.
 * On Replit, Auth + PostgreSQL keys are required. Locally we only hard-require DATABASE_URL and
 * SESSION_SECRET; ANTHROPIC_API_KEY / STRIPE_SECRET_KEY are warned about so the demo still boots.
 * // HOW TO EXTEND: add a new required secret to `required` (Replit) or `requiredLocal` (local).
 */
export function validateSecrets(): void {
  const required = IS_REPLIT
    ? ['DATABASE_URL', 'SESSION_SECRET', 'REPL_ID', 'REPLIT_DOMAINS']
    : ['DATABASE_URL', 'SESSION_SECRET'];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `[buddy] Missing required ${IS_REPLIT ? 'Secrets' : 'env vars'}: ${missing.join(', ')}.\n` +
        (IS_REPLIT
          ? 'Enable PostgreSQL + Auth from the Replit Tools pane; they inject these automatically.'
          : 'Set them in your shell (see .env.example). DATABASE_URL must point at a Postgres database.'),
    );
  }

  // Soft warnings — the app boots without these, with degraded features.
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[buddy] ANTHROPIC_API_KEY not set — moderation will no-op (every message treated as clean).');
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('[buddy] STRIPE_SECRET_KEY not set — redemptions will be marked fulfilled without charging.');
  }
}
