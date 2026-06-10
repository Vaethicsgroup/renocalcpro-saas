// lib/security/rateLimit.ts — Rate limit middleware-friendly.
// Implémentation no-op en dev/local (toujours success). En prod, à brancher sur Redis/Upstash.
import { NextRequest } from "next/server";

export interface RateLimitResult {
  success: boolean;
  retryAfterSec: number;
  limit: number;
  remaining: number;
}

export async function rateLimitForPath(
  _path: string,
  _req?: NextRequest,
): Promise<RateLimitResult | null> {
  // Dev/local : pas de rate limit, retourne null pour court-circuiter le check côté middleware.
  if (process.env.NODE_ENV !== "production") return null;
  // Production : implémentation safe par défaut (toujours success). À étendre avec Upstash Redis.
  return {
    success: true,
    retryAfterSec: 0,
    limit: 9999,
    remaining: 9999,
  };
}
