import express from "express";
import { rateLimiterMiddleware } from "./middleware/rateLimiterMiddleware";
import { redis } from "./core/redis/client";
import { getAdaptiveFactor } from "./core/adaptiveThrottle";
import { getMetrics } from "./core/metricsCollect";

const MAX_BURN_MS = 1000;

export const createApp = () => {
    const app = express();
    app.use(express.json());

    app.get("/health", async (req, res) => {
        let redisUp = true;
        try {
            await redis.ping();
        } catch {
            redisUp = false;
        }

        res.json({
            status: redisUp ? "ok" : "degraded",
            redis: redisUp ? "up" : "down",
            adaptiveFactor: getAdaptiveFactor(),
            metrics: getMetrics(),
        });
    });

    app.use("/api",rateLimiterMiddleware);

    // load generator for the adaptive demo: burns CPU for ?ms= (default 200, capped)
    app.get("/api/heavy", (req, res) => {
        const ms = Math.min(Number(req.query.ms) || 200, MAX_BURN_MS);
        const end = Date.now() + ms;
        while (Date.now() < end) {
            Math.sqrt(Math.random());
        }
        res.json({ message: `burned cpu for ${ms}ms` });
    });

    app.get("/api/data",(req,res)=>{
        res.json({message: "hello from the rate-limited API."});
    })

    app.get("/api/login",(req,res)=>{
        res.json({message:"Login successful (demo endpoint)"});
    });

    return app;
}