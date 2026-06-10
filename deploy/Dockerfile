# syntax=docker/dockerfile:1.7
# ─── Réno·Calc Pro SaaS — Dockerfile multi-stage Next.js standalone ─────────
# Image finale ~ 200 Mo, distroless-friendly, non-root.

ARG NODE_VERSION=20.18.1

# ─── Stage 1 : deps ─────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* pnpm-lock.yaml* ./
COPY prisma ./prisma
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable && pnpm install --frozen-lockfile --prod=false; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  else \
    echo "Lockfile manquant" && exit 1; \
  fi

# ─── Stage 2 : build ────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── Stage 3 : runner (image finale) ────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN apk add --no-cache openssl tini ca-certificates && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000

# Tini pour PID 1 propre, signaux, zombie reaper
ENTRYPOINT ["/sbin/tini", "--"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
