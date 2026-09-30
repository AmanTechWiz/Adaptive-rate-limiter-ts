import type { NextFunction, Request, Response } from "express";
import { resolveRequestUser } from "./identity";
import { getRuleAndKey } from "../config/configService";
import { runTokenBucketScript } from "../core/redis/script";
import { applyAdaptiveScaling } from "../core/adaptiveThrottle";
import { RequestUpdate } from "../core/metricsCollect";

export const rateLimiterMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const start = Date.now();
    const user = resolveRequestUser(req);

    if (!user) {
        RequestUpdate(false,false,false,Date.now()-start);
        res.status(401).json({ error: "Invalid API key" });
        return;
    }

    const endpoint = req.baseUrl + req.path;   // "/api + /data concatenated"
    const { rule, endpointKey } = getRuleAndKey(user.tier, endpoint);
    const scaled = applyAdaptiveScaling(rule,user.tier);
    const key = `User:${user.userId}:${endpointKey}`;

    try {
        const result = await runTokenBucketScript(
            key,
            scaled.capacity,
            scaled.refillRate,
            Date.now()
        );

        const latency = Date.now() - start;
        RequestUpdate(!result.allowed,false,false,latency);

        res.set("Available_tokens", String(scaled.capacity));
        res.set("tokens_remaining", String(Math.max(0, result.remaining)));
        res.set(
            "RateLimit_reset_time",
            String(Math.max(0, Math.ceil((scaled.capacity - result.remaining) / scaled.refillRate)))
        );

        if (!result.allowed) {
            res.set("Retry_after", String(Math.max(1, Math.ceil(result.retryAfterMs / 1000))));
            res.status(429).json({ error: "You have been Rate limited! too much requests." });
            return;
        }

        next();
    } catch (err) {
        RequestUpdate(false, false, true, Date.now() - start); //infra error!!
        console.error("Rate limiter unavailable — failing open:", err);
        next();
    }
};