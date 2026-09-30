import { afterEach, describe, expect, it } from "vitest";
import {
    applyAdaptiveScaling,
    evaluateOnce,
    getAdaptiveFactor,
    setAdaptiveFactor,
} from "../core/adaptiveThrottle";
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

describe("applyAdaptiveScaling", () => {
    afterEach(() => setAdaptiveFactor(1));

    it("clamps the factor into 0..1", () => {
        setAdaptiveFactor(5);
        expect(getAdaptiveFactor()).toBe(1);
        setAdaptiveFactor(-1);
        expect(getAdaptiveFactor()).toBe(0);
    });

    it("leaves the rule untouched at factor 1", () => {
        const scaled = applyAdaptiveScaling({ capacity: 100, refillRate: 5 }, "Plus");
        expect(scaled).toEqual({ capacity: 100, refillRate: 5 });
    });

    it("shrinks capacity and refill rate together", () => {
        setAdaptiveFactor(0.6);
        const scaled = applyAdaptiveScaling({ capacity: 100, refillRate: 5 }, "Plus");
        expect(scaled.capacity).toBe(60);
        expect(scaled.refillRate).toBeCloseTo(3);
    });

    it("respects each tier's floor when the factor is very low", () => {
        setAdaptiveFactor(0.1);
        const rule = { capacity: 100, refillRate: 10 };

        expect(applyAdaptiveScaling(rule, "Free").capacity).toBe(30);
        expect(applyAdaptiveScaling(rule, "Plus").capacity).toBe(50);
        expect(applyAdaptiveScaling(rule, "Max").capacity).toBe(80);
    });

    it("always keeps at least one token of capacity", () => {
        setAdaptiveFactor(0);
        expect(applyAdaptiveScaling({ capacity: 1, refillRate: 1 }, "Free").capacity).toBe(1);
    });
});
