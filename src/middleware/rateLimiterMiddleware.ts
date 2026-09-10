import type { NextFunction, Request, Response } from "express";
import { TIERS, DEFAULT_TIER } from "../config/default";
import type { AccountTier } from "../types";
import { runTokenBucketScript } from "../core/redis/script";

export const rateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userid = (req.headers["incoming-user-id"] as string | undefined) ?? "unknown";
  const tierid = (req.headers["incoming-tier-id"] as AccountTier | undefined) ?? DEFAULT_TIER;
  const rule = TIERS[tierid] ?? TIERS[DEFAULT_TIER];

  try {
    const result = await runTokenBucketScript(
      `User:${userid}`,
      rule.capacity,
      rule.refillRate,
      Date.now()
    );

    res.set("Available_tokens", String(rule.capacity));
    res.set("tokens_remaining", String(Math.max(0, result.remaining)));
    res.set(
      "RateLimit_reset_time",
      String(Math.max(0, Math.ceil((rule.capacity - result.remaining) / rule.refillRate)))
    );

    if (!result.allowed) {
      res.set("Retry_after", String(Math.max(1, Math.ceil(result.retryAfterMs / 1000))));
      res.status(429).json({ error: "You have been Rate limited! too much requests." });
      return;
    }

    next();
  } catch (err) {
    console.error("Rate limiter unavailable — failing open:", err);
    next();
  }
};