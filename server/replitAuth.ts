// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/replitAuth.ts
// DOMAIN:      auth
// CONCEPT:     Replit Auth (OIDC) login + session, with a local dev fake-login fallback
// RELATIONS:   upserts via storage; used by server/index.ts (setupAuth) and every protected route
// KEY EXPORTS: getSession, setupAuth, isAuthenticated
// PURPOSE:     Authenticates users via Replit OIDC (prod) or a dev fake-login (local), stores the
//              passport user on a pg-backed session, and exposes the isAuthenticated guard.
// LLM EDIT GUIDE: Don't invent auth packages — this is the official blueprint. The .edu check is
//                 SEPARATE (server/middleware/requireEdu.ts) and runs after isAuthenticated.
// DAY-OF CHANGES: rarely; the local fallback identity comes from DEV_USER_EMAIL in config.ts.
// ─────────────────────────────────────────────────────────────────────────

// REPLIT SETUP: Enable "Auth" (Replit Auth) from the Tools pane. It auto-injects REPL_ID,
// REPLIT_DOMAINS, ISSUER_URL, and SESSION_SECRET as Secrets. No package install needed beyond
// openid-client / passport / express-session / connect-pg-simple / memoizee.

import * as client from 'openid-client';
import { Strategy, type VerifyFunction } from 'openid-client/passport';
import passport from 'passport';
import session from 'express-session';
import type { Express, RequestHandler } from 'express';
import memoize from 'memoizee';
import connectPg from 'connect-pg-simple';
// PERSEUS EDGE: auth → storage (every login upserts the user)
import { storage } from './storage';
import { CONFIG, DEV_AUTH_ENABLED, DEV_USER_EMAIL } from './config';
import type { SessionUser } from './types';

// ── SECTION: OIDC config discovery (memoized 1h) ───────────────────────────

const getOidcConfig = memoize(
  async () =>
    client.discovery(new URL(process.env.ISSUER_URL ?? 'https://replit.com/oidc'), process.env.REPL_ID!),
  { maxAge: 3600 * 1000 },
);

// ── SECTION: Session middleware (pg-backed) ────────────────────────────────

/**
 * express-session backed by connect-pg-simple, storing rows in the Postgres `sessions` table.
 * createTableIfMissing: false — the table is created by `npm run db:push` from shared/schema.ts.
 * cookie.secure is true on Replit (HTTPS Webview) and false locally so the cookie survives http.
 */
export function getSession(): RequestHandler {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 7 days
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: 'sessions',
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: CONFIG.IS_REPLIT, // DAY-OF CHANGE: must be true behind HTTPS; false for local http dev.
      maxAge: sessionTtl,
    },
  });
}

// ── SECTION: Helpers ───────────────────────────────────────────────────────

function updateUserSession(user: SessionUser, tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers) {
  user.claims = tokens.claims() as SessionUser['claims'];
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp as number | undefined;
}

// PERSEUS EDGE: auth → storage (claims become a users row; email feeds the .edu check)
async function upsertUserFromClaims(claims: Record<string, unknown>) {
  await storage.upsertUser({
    id: String(claims['sub']),
    email: claims['email'] as string | undefined,
    firstName: claims['first_name'] as string | undefined,
    lastName: claims['last_name'] as string | undefined,
    profileImageUrl: claims['profile_image_url'] as string | undefined,
  });
}

// ── SECTION: setupAuth — branches on environment ───────────────────────────

export async function setupAuth(app: Express): Promise<void> {
  app.set('trust proxy', 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  if (DEV_AUTH_ENABLED) {
    setupDevAuth(app);
    return;
  }

  // ── Real Replit OIDC ──
  const config = await getOidcConfig();

  const verify: VerifyFunction = async (tokens, verified) => {
    const user: SessionUser = { claims: { sub: '' } };
    updateUserSession(user, tokens);
    await upsertUserFromClaims(tokens.claims() as Record<string, unknown>);
    verified(null, user);
  };

  for (const domain of process.env.REPLIT_DOMAINS!.split(',')) {
    passport.use(
      new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: 'openid email profile offline_access',
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      ),
    );
  }

  app.get('/api/login', (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: 'login consent',
      scope: ['openid', 'email', 'profile', 'offline_access'],
    })(req, res, next);
  });

  app.get('/api/callback', (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: '/',
      failureRedirect: '/api/login',
    })(req, res, next);
  });

  app.get('/api/logout', (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href,
      );
    });
  });
}

// ── SECTION: Local dev fake-login (never reachable on Replit) ───────────────
// DAY-OF CHANGE: this whole branch is dev-only. Set DEV_AUTH=off to force the real OIDC path.
function setupDevAuth(app: Express): void {
  console.warn(
    `[buddy] DEV AUTH enabled — /api/login signs you in as ${DEV_USER_EMAIL} with no OIDC. ` +
      'This branch is skipped automatically on Replit.',
  );

  // A stable fake identity so the same dev user persists across restarts.
  const devClaims = {
    sub: 'dev-user-1',
    email: DEV_USER_EMAIL,
    first_name: 'Demo',
    last_name: 'Student',
    profile_image_url: '',
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };

  app.get('/api/login', async (req, res, next) => {
    await upsertUserFromClaims(devClaims);
    const user: SessionUser = {
      claims: devClaims,
      access_token: 'dev',
      refresh_token: 'dev',
      expires_at: devClaims.exp,
    };
    req.login(user, (err) => {
      if (err) return next(err);
      res.redirect('/');
    });
  });

  app.get('/api/callback', (_req, res) => res.redirect('/'));

  app.get('/api/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
  });
}

// ── SECTION: isAuthenticated guard ─────────────────────────────────────────

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as SessionUser | undefined;
  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // In dev, tokens never expire meaningfully — just pass through.
  if (DEV_AUTH_ENABLED) return next();

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  // Token expired — try to refresh before rejecting.
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
