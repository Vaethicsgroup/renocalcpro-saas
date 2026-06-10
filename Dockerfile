# syntax=docker/dockerfile:1.7-labs
# Multi-stage Dockerfile pour Réno·Calc Pro SaaS (Next.js 15 standalone).
# Final stage : distroless non-root, healthcheck via la stack runtime.

ARG NODE_VERSION=20.18.0
ARG ALPINE_VERSION=3.20

# ─── Stage 1 : deps (cache npm) ───────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --prefer-offline

# ─── Stage 2 : build ──────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Génère le client Prisma (typé, prêt à être runtime)
RUN npx prisma generate

# Build Next.js (output standalone)
RUN npm run build

# ─── Stage 3 : runner (distroless, non-root) ──────────────────────────────
FROM gcr.io/distroless/nodejs20-debian12:nonroot AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# Next.js standalone output
COPY --from=builder --chown=nonroot:nonroot /app/.next/standalone ./
COPY --from=builder --chown=nonroot:nonroot /app/.next/static    ./.next/static
COPY --from=builder --chown=nonroot:nonroot /app/public          ./public
COPY --from=builder --chown=nonroot:nonroot /app/prisma          ./prisma

# Distroless n'a pas de shell — on lance node directement.
USER nonroot
EXPOSE 3000

# Healthcheck géré au niveau Caddy (HTTP) + docker-compose (HEALTHCHECK).
CMD ["server.js"]
