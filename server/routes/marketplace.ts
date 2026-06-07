// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/routes/marketplace.ts
// DOMAIN:      marketplace
// CONCEPT:     Browse items, redeem points (→ Stripe PaymentIntent), and fulfill via webhook
// RELATIONS:   guarded by isAuthenticated + requireEdu; uses storage + points + Stripe
// KEY EXPORTS: marketplaceRouter
// PURPOSE:     GET /api/marketplace, POST /api/redeem, POST /api/stripe/webhook (raw body).
// LLM EDIT GUIDE: Spending the earner's own points is forbidden — only a recipient's unspent points
//                 are debited (storage enforces recipientId). Keep the .edu guard on redeem.
// DAY-OF CHANGES: STRIPE_WEBHOOK_SECRET fallback; add an item category; change redeem rules.
// ─────────────────────────────────────────────────────────────────────────

// REPLIT SETUP: Add STRIPE_SECRET_KEY in the Secrets pane. For webhooks, expose the deployed URL
// + /api/stripe/webhook in the Stripe dashboard and add STRIPE_WEBHOOK_SECRET.

import { Router } from 'express';
import Stripe from 'stripe';
import { isAuthenticated } from '../replitAuth';
import { requireEdu } from '../middleware/requireEdu';
import { rateLimit } from '../middleware/rateLimit';
// PERSEUS EDGE: marketplace → storage (items, redemptions, point ledger)
import { storage } from '../storage';
import { getSpendableBalance } from '../services/points';
import { CONFIG } from '../config';
import type { SessionUser } from '../types';

export const marketplaceRouter = Router();

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

/** GET /api/marketplace — active items, cheapest first. */
marketplaceRouter.get('/marketplace', isAuthenticated, requireEdu, async (_req, res) => {
  const items = await storage.listMarketplaceItems();
  res.json({ items });
});

/**
 * POST /api/redeem { itemId } — spend points on an item.
 * Flow: validate balance + inventory → debit points → create Stripe PaymentIntent → record redemption.
 * // HOW TO EXTEND: support partial-point + card top-up by reading an `amountUsd` from the body.
 */
marketplaceRouter.post(
  '/redeem',
  isAuthenticated,
  requireEdu,
  rateLimit(10, 60_000), // DAY-OF CHANGE: 10 redeem attempts / minute / user
  async (req, res) => {
    const userId = (req.user as SessionUser).claims.sub;
    const itemId = Number(req.body?.itemId);
    if (Number.isNaN(itemId)) return res.status(400).json({ message: 'Pick something to redeem.' });

    const item = await storage.getMarketplaceItem(itemId);
    if (!item || !item.active) return res.status(404).json({ message: 'That item isn\'t available.' });
    if (item.inventoryCount <= 0) return res.status(409).json({ message: 'That one just sold out — try another?' });

    const balance = await getSpendableBalance(userId);
    if (balance < item.pointCost) {
      return res.status(402).json({ message: 'Not enough points yet — your matches give you these.' });
    }

    // Debit exactly pointCost worth of unspent points (recipient-only by construction).
    const pointIds = await storage.getUnspentPointIds(userId, item.pointCost);
    await storage.markPointsSpent(pointIds);
    await storage.decrementInventory(item.id);

    // ── SECTION: Stripe PaymentIntent ──
    let paymentIntentId: string | null = null;
    let status: 'pending' | 'fulfilled' = 'pending';
    if (stripe) {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(Number(item.faceValueUsd) * 100), // cents; sponsor revenue covers this
        currency: 'usd',
        metadata: { userId, itemId: String(item.id), merchant: item.merchantName },
        description: `Buddy gift-card redemption: ${item.merchantName}`,
      });
      paymentIntentId = intent.id;
    } else {
      // DAY-OF CHANGE: no Stripe key → mark fulfilled immediately so the demo flows end-to-end.
      status = 'fulfilled';
    }

    const redemption = await storage.createRedemption({
      userId,
      itemId: item.id,
      pointsSpent: item.pointCost,
      stripePaymentIntentId: paymentIntentId,
    });
    if (status === 'fulfilled') await storage.updateRedemption(redemption.id, { status: 'fulfilled' });

    res.json({ redemption: { ...redemption, status }, item });
  },
);

/**
 * POST /api/stripe/webhook — Stripe calls this to confirm payment; we flip the redemption to fulfilled.
 * Mounted with a RAW body (see server/index.ts) so the signature can be verified.
 */
marketplaceRouter.post('/stripe/webhook', async (req, res) => {
  if (!stripe) return res.json({ received: true, note: 'Stripe disabled' });

  let event: Stripe.Event;
  const signature = req.headers['stripe-signature'];

  if (CONFIG.STRIPE_WEBHOOK_SECRET && signature) {
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, CONFIG.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).json({ message: `Webhook signature failed: ${(err as Error).message}` });
    }
  } else {
    // DAY-OF CHANGE: no STRIPE_WEBHOOK_SECRET → skip verification (hackathon-friendly). Set it in prod.
    console.warn('[buddy] STRIPE_WEBHOOK_SECRET not set — skipping webhook signature verification.');
    event = (typeof req.body === 'object' && !Buffer.isBuffer(req.body)
      ? req.body
      : JSON.parse(req.body.toString())) as Stripe.Event;
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const redemption = await storage.getRedemptionByPaymentIntent(intent.id);
    if (redemption) await storage.updateRedemption(redemption.id, { status: 'fulfilled' });
  }

  res.json({ received: true });
});
