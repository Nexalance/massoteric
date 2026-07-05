# Massoteric - Next.js Dockerfile
# Multi-stage build for production

# Base stage
FROM node:18-alpine AS base
WORKDIR /app

# Dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# Builder stage
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time public env. Defaults keep the app in its built-in mock-auth mode
# (Clerk key contains "placeholder") so the image builds without real 3rd-party
# keys. Override via Dokploy build args to bake real NEXT_PUBLIC_* values.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_placeholder
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_NAME=Massoteric
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    DATABASE_URL=$DATABASE_URL

# ── Build-time env diagnostics ───────────────────────────────────────────────
# Prints the values the build actually received so you can verify Dokploy is
# forwarding them. NEXT_PUBLIC_* are baked into the client bundle by `npm run
# build`, so if these show placeholders here, the shipped app WILL use
# placeholders no matter what you set in Dokploy's runtime Environment tab.
# These must be set in Dokploy's "Build Time Arguments" field (build type =
# Dockerfile), not only in Environment. DATABASE_URL is masked to keep the
# password out of build logs.
RUN echo "======================================================" && \
    echo "  BUILD-TIME ENV (values received by the Docker build)" && \
    echo "======================================================" && \
    echo "  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = ${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}" && \
    echo "  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = ${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}" && \
    echo "  NEXT_PUBLIC_APP_URL = ${NEXT_PUBLIC_APP_URL}" && \
    echo "  NEXT_PUBLIC_APP_NAME = ${NEXT_PUBLIC_APP_NAME}" && \
    echo "  DATABASE_URL = $(echo "$DATABASE_URL" | sed -E 's#(://[^:]+:)[^@]+@#\1****@#')" && \
    case "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" in \
      *placeholder*) echo "  >> WARNING: Clerk key is still the PLACEHOLDER default." ; \
                     echo "  >> Dokploy did NOT forward it as a Build Time Argument." ;; \
      *) echo "  >> OK: real Clerk key received." ;; \
    esac && \
    echo "======================================================"
# ─────────────────────────────────────────────────────────────────────────────

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js app
RUN npm run build

# Production stage
FROM base AS runner
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat openssl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Full node_modules gives us the Prisma CLI + query engines at runtime so the
# entrypoint can run `prisma db push` against the Dokploy-internal Postgres.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Boot-time schema sync + server start.
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
