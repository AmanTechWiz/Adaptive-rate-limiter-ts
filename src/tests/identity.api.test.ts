import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { redis } from "../core/redis/client";

const app = createApp();

const clearBuckets = async (): Promise<void> => {
    const keys = await redis.keys("User:*");   // dev-only: KEYS is O(N), fine for tests
    if (keys.length > 0) await redis.del(...keys);
};

describe("identity + tiers (needs live Redis)", () => {
    beforeAll(async () => {
        try {
            await redis.ping();
        } catch {
            throw new Error("Redis is not running — start it (lesson step 1)");
        }
        await clearBuckets();
    });

    afterAll(async () => {
        await clearBuckets();
        redis.disconnect();
    });

    it("rejects an unknown API key with 401", async () => {
        const res = await request(app).get("/api/data").set("x-api-key", "hacker-key");
        expect(res.status).toBe(401);
    });

    it("ignores spoofed tier headers — free key stays Free", async () => {
        const res = await request(app)
            .get("/api/data")
            .set("x-api-key", "demo-free-key")
            .set("incoming-tier-id", "Max");
        expect(res.status).toBe(200);
        expect(res.headers["available_tokens"]).toBe("20");
    });

    it("gives a Plus key its higher limits", async () => {
        const res = await request(app).get("/api/data").set("x-api-key", "demo-plus-key");
        expect(res.headers["available_tokens"]).toBe("100");
    });

    it("serves anonymous requests on the Free bucket", async () => {
        const res = await request(app).get("/api/data");
        expect(res.status).toBe(200);
        expect(res.headers["available_tokens"]).toBe("20");
    });

    it("applies the stricter /api/login override for Free", async () => {
        await clearBuckets();
        const hit = () => request(app).get("/api/login").set("x-api-key", "demo-free-key");
        for (let i = 0; i < 3; i++) {
            expect((await hit()).status).toBe(200);
        }
        expect((await hit()).status).toBe(429);
    });
});
