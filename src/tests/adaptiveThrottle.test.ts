import { describe, expect, it } from "vitest";
import { evaluateOnce } from "../core/adaptiveThrottle";
import { DEFAULT_ADAPTIVE_CONFIG } from "../config/default";
import type { SystemMetrics } from "../types";

const calm: SystemMetrics = {
    cpuUsage: 10,
    memoryUsage: 10,
    avgLatency: 50,
    errorRate: 0,
    infraErrors: 0,
    requestsPerSecond: 0,
    totalRequests: 0,
    blockedRequests: 0,
    timestamp: 0,
};

const cfg = DEFAULT_ADAPTIVE_CONFIG;

describe("evaluateOnce", () => {
    it("steps down when cpu is high", () => {
        expect(evaluateOnce({ ...calm, cpuUsage: 90 }, cfg, 1.0)).toBeCloseTo(0.95);
    });

    it("steps down when latency is high", () => {
        expect(evaluateOnce({ ...calm, avgLatency: 600 }, cfg, 1.0)).toBeCloseTo(0.95);
    });

    it("steps down when the error rate is high", () => {
        expect(evaluateOnce({ ...calm, errorRate: 0.2 }, cfg, 1.0)).toBeCloseTo(0.95);
    });

    it("never drops below minFactor", () => {
        expect(evaluateOnce({ ...calm, cpuUsage: 95 }, cfg, cfg.minFactor)).toBe(cfg.minFactor);
    });

    it("recovers a step when everything is healthy", () => {
        expect(evaluateOnce(calm, cfg, 0.5)).toBeCloseTo(0.55);
    });

    it("never rises above maxFactor", () => {
        expect(evaluateOnce(calm, cfg, cfg.maxFactor)).toBe(cfg.maxFactor);
    });

    it("holds steady in the dead zone between the cpu thresholds", () => {
        expect(evaluateOnce({ ...calm, cpuUsage: 60 }, cfg, 0.7)).toBe(0.7);
    });
});
