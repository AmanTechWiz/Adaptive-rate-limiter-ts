import express from "express";
import { rateLimiterMiddleware } from "./middleware/rateLimiterMiddleware";
import { redis } from "./core/redis/client";
import { getAdaptiveFactor } from "./core/adaptiveThrottle";
import { getMetrics } from "./core/metricsCollect";

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

    app.get("/api/data",(req,res)=>{
        res.json({message: "hello from the rate-limited API."});
    })

    app.get("/api/login",(req,res)=>{
        res.json({message:"Login successful (demo endpoint)"});
    });

    return app;
}