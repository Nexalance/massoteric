# Massoteric — Production Launch Checklist

Everything we need from the client to take the site from testing to production.
With these in hand the launch call takes ~20 minutes.

---

## 1. Clerk — Production Keys

Current state: the site runs on a Clerk **Development** instance (live sign-up fails CAPTCHA, sessions are short).

From the client (Clerk dashboard → the production instance):

- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_live_…`)
- [ ] `CLERK_SECRET_KEY` (starts with `sk_live_…`)
- [ ] Confirm the **production instance's allowed domains** include `massoteric.com`
- [ ] (Optional) webhooks signing secret, if user-sync webhooks are wanted later

> We create the production instance keys on the client's Clerk account so they own the users. If they prefer, they can add us as a team member instead.

## 2. Stripe — Live Keys + Price IDs

Current state: Stripe runs in **test mode** (test keys, test prices).

From the client (Stripe dashboard → toggle **Test mode OFF** first):

- [ ] `STRIPE_SECRET_KEY` (`sk_live_…`)
- [ ] `STRIPE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_live_…`)
- [ ] `STRIPE_WEBHOOK_SECRET` (from a live webhook endpoint pointing to `https://massoteric.com/api/webhooks/stripe`)
- [ ] Live **Price IDs** for the plan tiers (Standard / Pro) — `price_…`
- [ ] Confirm the live **products** exist with the agreed monthly prices
- [ ] Client completes **account activation** (business details) so live payments can actually charge

## 3. DNS / Domain

Point the production domain at the CloudPanel server:

- [ ] DNS A/CNAME record: `massoteric.com` (+ `www`) → server IP `72.60.103.57`
- [ ] Confirm propagation (`dig massoteric.com +short`)
- [ ] Then we issue the **Let's Encrypt SSL certificate** for `massoteric.com` from CloudPanel (2 minutes, we do this)

## 4. Environment Variables (we set these together on the call)

- [ ] All `NEXT_PUBLIC_*` values swapped to production versions
- [ ] `DATABASE_URL` stays as-is (production DB already on the server)
- [ ] `ADMIN_USER_IDS` — final list of admin Clerk IDs (production Clerk IDs will differ from dev)
- [ ] Feature flags re-checked after first boot (SIMPLE_BINARY_ONLY, COMMENTS_VIEW/CREATE, TOPIC_CREATE, etc.)

## 5. Post-Launch Smoke Test (we run this, ~10 minutes)

- [ ] Sign-up + sign-in works (live Clerk)
- [ ] Predictions post + lock correctly
- [ ] Leaderboard/profile scores render
- [ ] Upgrade flow: live Stripe payment → tier updates via webhook
- [ ] Comments + topic creation flags behave as configured
- [ ] Sync cron running on the server (15-min cycle)

---

**Client-side prep summary (send this):**
1. Clerk production instance → send `pk_live_` + `sk_live_` keys
2. Stripe → activate account, turn on live mode, send live keys + the two plan price IDs + webhook secret
3. DNS panel access or A-record for `massoteric.com` → server IP
