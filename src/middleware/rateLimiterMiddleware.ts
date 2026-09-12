import type { NextFunction, Request, Response } from "express";
import { resolveRequestUser } from "./identity";
import { getRuleAndKey } from "../config/configService";
import { runTokenBucketScript } from "../core/redis/script";

export const rateLimiterMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const user = resolveRequestUser(req);

    if (!user) {
        res.status(401).json({ error: "Invalid API key" });
        return;
    }

    const endpoint = req.baseUrl + req.path;   // "/api + /data concatenated"
    const { rule, endpointKey } = getRuleAndKey(user.tier, endpoint);
    const key = `User:${user.userId}:${endpointKey}`;

    try {
        const result = await runTokenBucketScript(
            key,
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