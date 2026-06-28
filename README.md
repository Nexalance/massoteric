# Massoteric

**The Prediction Intelligence Platform**

A social prediction platform that aggregates markets from Polymarket, Kalshi, and Metaculus — and layers on a community where users post forecasts with reasoning, get scored on accuracy, and build verifiable reputations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL via Prisma ORM |
| Authentication | Clerk (email + phone/SMS verification) |
| Payments | Stripe (subscriptions) |
| Hosting | Vercel + Railway/Supabase |
| Language | TypeScript |

---

## Getting Started

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted)
- Accounts on: [Clerk](https://clerk.com), [Stripe](https://stripe.com)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:

- **DATABASE_URL** — your PostgreSQL connection string
- **CLERK keys** — from your Clerk dashboard
- **STRIPE keys** — from your Stripe dashboard
- **STRIPE_PRICE_STANDARD / PRO** — create subscription products in Stripe first
- **ADMIN_USER_IDS** — your Clerk user ID (find it in Clerk dashboard after signing up)

### 4. Set up the database

```bash
npm run db:push     # push schema to database
npm run db:seed     # seed default feature flags + sample markets
```

### 5. Configure Clerk webhooks

In your Clerk dashboard → Webhooks → Add endpoint:
- URL: `https://yourdomain.com/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`

### 6. Configure Stripe webhooks

In your Stripe dashboard → Webhooks → Add endpoint:
- URL: `https://yourdomain.com/api/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in your env file.

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
massoteric/
├── prisma/
│   ├── schema.prisma        # Full database schema
│   └── seed.ts              # Default data seeder
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── markets/     # Market CRUD + Polymarket sync
│   │   │   ├── predictions/ # Prediction create/update + access control
│   │   │   ├── users/       # Leaderboard + onboarding
│   │   │   ├── admin/       # Feature flags + topic moderation
│   │   │   ├── billing/     # Stripe checkout + portal
│   │   │   ├── waitlist/    # Landing page email collection
│   │   │   └── webhooks/    # Clerk + Stripe webhooks
│   │   ├── feed/            # Main market feed
│   │   ├── market/[id]/     # Market detail + prediction form
│   │   ├── profile/[username]/ # User public profile
│   │   ├── leaderboard/     # Accuracy rankings
│   │   ├── admin/           # Admin dashboard
│   │   ├── onboarding/      # New user profile setup
│   │   ├── settings/billing/ # Subscription management
│   │   └── layout.tsx       # Root layout with Clerk
│   ├── components/
│   │   └── layout/Nav.tsx   # Navigation bar
│   ├── lib/
│   │   ├── prisma.ts        # Database client
│   │   ├── scoring.ts       # Brier score engine
│   │   ├── polymarket.ts    # Polymarket API integration
│   │   ├── stripe.ts        # Stripe integration
│   │   └── access.ts        # Feature flag access control
│   └── middleware.ts        # Clerk auth middleware
└── .env.example             # Environment variable template
```

---

## Key Features (Phase 1)

- **Market aggregation** — pulls live markets from Polymarket API, synced every 5 minutes
- **Predictions with reasoning** — users post probability estimates + written analysis
- **Edit history** — all edits timestamped and public; predictions lock 48h before close
- **Brier Score accuracy** — automatic scoring on market resolution, overall + by category
- **Access tiers** — Free sees snippets; Standard/Pro sees full reasoning, filters, leaderboards
- **Admin dashboard** — toggle any feature free/paid via on/off switch, no redeploy needed
- **Topic moderation** — user-submitted topics enter approval queue
- **Stripe subscriptions** — full checkout + customer portal + webhook sync

---

## Deployment

### Vercel (recommended)

```bash
npm install -g vercel
vercel
```

Set all environment variables in Vercel dashboard → Project Settings → Environment Variables.

### Database (Railway)

1. Create a new PostgreSQL database on [railway.app](https://railway.app)
2. Copy the connection string to `DATABASE_URL`
3. Run `npm run db:push` and `npm run db:seed`

---

## Phase 2 Roadmap

- Expert monetization (individual user subscriptions)
- Expert Q&A (subscribers ask questions)
- Advertising system
- Anonymized data sales (B2B analytics)

## Phase 3 Roadmap

- AI public figure tracker
- Consumer marketplace
- iOS + Android apps

---

## License

Proprietary — Massoteric. All rights reserved.
