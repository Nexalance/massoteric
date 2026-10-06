# Massoteric — Production Launch Checklist

Split into two parts so a blocked bank account doesn't block the launch:

- **PART A — launch NOW** (needs only Clerk production keys + DNS; subscriptions stay OFF)
- **PART B — turn payments on later** (needs Stripe live + bank activation; a 10-minute job whenever the client is ready)

---

# PART A — Launch massoteric.com NOW

## A1. Clerk — Production Keys

Current state: the site runs on a Clerk **Development** instance (live sign-up fails CAPTCHA, sessions are short).

From the client (Clerk dashboard → the production instance):

- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_live_…`)
- [ ] `CLERK_SECRET_KEY` (starts with `sk_live_…`)
- [ ] Confirm the **production instance's allowed domains** include `massoteric.com`
- [ ] (Optional) webhooks signing secret, if user-sync webhooks are wanted later

> We create the production instance keys on the client's Clerk account so they own the users. If they prefer, they can add us as a team member instead.

## A2. DNS / Domain + SSL

Point the production domain at the CloudPanel server:

- [ ] DNS A/CNAME record: `massoteric.com` (+ `www`) → server IP `72.61.231.113`
- [ ] Confirm propagation (`dig massoteric.com +short`)
- [ ] Then we issue the **Let's Encrypt SSL certificate** for `massoteric.com` from CloudPanel (2 minutes, we do this)

## A3. Environment Variables (we set these together on the call)

- [ ] All `NEXT_PUBLIC_*` values swapped to production versions (Clerk keys)
- [ ] `DATABASE_URL` stays as-is (production DB already on the server)
- [ ] `ADMIN_USER_IDS` — final list of admin Clerk IDs (production Clerk IDs will differ from dev)
- [ ] Feature flags re-checked after first boot (SIMPLE_BINARY_ONLY, COMMENTS_VIEW/CREATE, TOPIC_CREATE, etc.)
- [ ] **Subscriptions stay OFF**: billing/upgrade surfaces hidden or clearly disabled until Part B (audited — see notes)

## A4. Post-Launch Smoke Test (we run this, ~10 minutes)

- [ ] Sign-up + sign-in works (live Clerk)
- [ ] Predictions post + lock correctly
- [ ] Leaderboard/profile scores render
- [ ] Comments + topic creation flags behave as configured
- [ ] Sync cron running on the server (15-min cycle)
- [ ] **No broken billing surfaces**: no dead "Upgrade" buttons, billing page shows a clean message, predictions/topic creation unaffected

---

# PART B — Turn Payments On Later (needs client's bank + Stripe activation)

Only this part waits on the client's company/bank setup. Everything else is already live from Part A.

## B1. Stripe — Live Keys + Price IDs

From the client (Stripe dashboard → toggle **Test mode OFF** first):

- [ ] `STRIPE_SECRET_KEY` (`sk_live_…`)
- [ ] `STRIPE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_live_…`)
- [ ] `STRIPE_WEBHOOK_SECRET` (from a live webhook endpoint pointing to `https://massoteric.com/api/webhooks/stripe`)
- [ ] Live **Price IDs** for the plan tiers (Standard / Pro) — `price_…`
- [ ] Confirm the live **products** exist with the agreed monthly prices
- [ ] Client completes **account activation** (business details) so live payments can actually charge

## B2. Enable Payments (we do this, ~10 minutes)

- [ ] Add Stripe live keys + price IDs to the server env
- [ ] Re-check billing/upgrade surfaces (buttons live, webhook receiving)
- [ ] Smoke test: live upgrade → tier updates via webhook

---

**Client-side prep summary (send this):**

**To launch now (Part A):**
1. Clerk production instance → send `pk_live_` + `sk_live_` keys
2. DNS panel access or A-record for `massoteric.com` → server IP

**To turn payments on later (Part B):**
3. Stripe → activate account, turn on live mode, send live keys + the two plan price IDs + webhook secret
